from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import pandas as pd
import numpy as np
from scipy import stats
from models import get_db
import os
from datetime import datetime, timedelta

drift_bp = Blueprint("drift", __name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, "uploads/datasets")

def kolmogorov_smirnov_test(reference_data, current_data):
    """Perform KS test for drift detection"""
    try:
        statistic, p_value = stats.ks_2samp(reference_data, current_data)
        return {
            'statistic': float(statistic),
            'p_value': float(p_value),
            'drift_detected': bool(p_value < 0.05)  # ✅ Convert to bool explicitly
        }
    except Exception as e:
        print(f"KS test error: {e}")
        return None

def population_stability_index(reference_data, current_data, bins=10):
    """Calculate PSI for drift detection"""
    try:
        # Create bins based on reference data
        _, bin_edges = np.histogram(reference_data, bins=bins)
        
        # Get distributions
        ref_hist, _ = np.histogram(reference_data, bins=bin_edges)
        curr_hist, _ = np.histogram(current_data, bins=bin_edges)
        
        # Normalize
        ref_dist = ref_hist / len(reference_data)
        curr_dist = curr_hist / len(current_data)
        
        # Add small constant to avoid division by zero
        ref_dist = np.where(ref_dist == 0, 0.0001, ref_dist)
        curr_dist = np.where(curr_dist == 0, 0.0001, curr_dist)
        
        # Calculate PSI
        psi = np.sum((curr_dist - ref_dist) * np.log(curr_dist / ref_dist))
        
        return {
            'psi_score': float(psi),
            'drift_detected': bool(psi > 0.1)  # ✅ Convert to bool explicitly
        }
    except Exception as e:
        print(f"PSI calculation error: {e}")
        return None

def calculate_statistics(data):
    """Calculate statistical metrics for a dataset"""
    try:
        return {
            'mean': float(np.mean(data)),
            'std': float(np.std(data)),
            'min': float(np.min(data)),
            'max': float(np.max(data)),
            'median': float(np.median(data)),
            'q25': float(np.percentile(data, 25)),
            'q75': float(np.percentile(data, 75))
        }
    except Exception as e:
        print(f"Statistics calculation error: {e}")
        return None

@drift_bp.route("/analyze", methods=["POST"])
@jwt_required()
def analyze_drift():
    """Analyze drift between reference and current dataset"""
    user_id = get_jwt_identity()
    data = request.json
    
    reference_dataset_id = data.get('reference_dataset_id')
    current_dataset_id = data.get('current_dataset_id')
    
    if not reference_dataset_id or not current_dataset_id:
        return jsonify({"error": "Both reference and current dataset IDs required"}), 400
    
    conn = get_db()
    cur = conn.cursor()
    
    try:
        # Get reference dataset
        cur.execute(
            "SELECT filename, path FROM uploaded_datasets WHERE id = %s AND user_id = %s",
            (reference_dataset_id, user_id)
        )
        ref_result = cur.fetchone()
        
        # Get current dataset
        cur.execute(
            "SELECT filename, path FROM uploaded_datasets WHERE id = %s AND user_id = %s",
            (current_dataset_id, user_id)
        )
        curr_result = cur.fetchone()
        
        if not ref_result or not curr_result:
            return jsonify({"error": "Dataset not found"}), 404
        
        print(f"Loading reference: {ref_result[1]}")
        print(f"Loading current: {curr_result[1]}")
        
        # Load datasets
        ref_df = pd.read_csv(ref_result[1])
        curr_df = pd.read_csv(curr_result[1])
        
        print(f"Reference shape: {ref_df.shape}")
        print(f"Current shape: {curr_df.shape}")
        
        # Get numeric columns
        numeric_cols = ref_df.select_dtypes(include=[np.number]).columns.tolist()
        
        print(f"Numeric columns: {numeric_cols}")
        
        if len(numeric_cols) == 0:
            return jsonify({"error": "No numeric columns found in datasets"}), 400
        
        # Analyze drift for each numeric column
        drift_results = []
        total_drift_score = 0
        
        for col in numeric_cols:
            if col not in curr_df.columns:
                print(f"Column {col} not in current dataset, skipping")
                continue
            
            ref_data = ref_df[col].dropna()
            curr_data = curr_df[col].dropna()
            
            if len(ref_data) == 0 or len(curr_data) == 0:
                print(f"Column {col} has no data, skipping")
                continue
            
            print(f"Processing column: {col}")
            
            # Perform drift tests
            ks_result = kolmogorov_smirnov_test(ref_data, curr_data)
            psi_result = population_stability_index(ref_data, curr_data)
            ref_stats = calculate_statistics(ref_data)
            curr_stats = calculate_statistics(curr_data)
            
            if not ks_result or not psi_result or not ref_stats or not curr_stats:
                print(f"Failed to calculate metrics for {col}, skipping")
                continue
            
            # Calculate percentage change in mean
            mean_change = 0
            if ref_stats['mean'] != 0:
                mean_change = ((curr_stats['mean'] - ref_stats['mean']) / ref_stats['mean']) * 100
            
            drift_score = psi_result['psi_score'] if psi_result else ks_result['statistic']
            drift_detected = psi_result['drift_detected'] if psi_result else ks_result['drift_detected']
            
            total_drift_score += drift_score
            
            result = {
                'feature_name': str(col),  # ✅ Ensure string
                'drift_score': float(drift_score),  # ✅ Ensure float
                'drift_detected': bool(drift_detected),  # ✅ Ensure bool
                'ks_statistic': float(ks_result['statistic']) if ks_result else None,
                'ks_p_value': float(ks_result['p_value']) if ks_result else None,
                'psi_score': float(psi_result['psi_score']) if psi_result else None,
                'reference_stats': ref_stats,
                'current_stats': curr_stats,
                'mean_change_percent': float(mean_change)
            }
            
            drift_results.append(result)
            
            # Save individual feature drift to logs
            try:
                cur.execute(
                    "INSERT INTO drift_logs (feature_name, drift_score, user_id, detected_at) VALUES (%s, %s, %s, %s)",
                    (col, drift_score, user_id, datetime.now())
                )
            except Exception as e:
                print(f"Failed to save drift log for {col}: {e}")
        
        conn.commit()
        
        print(f"✅ Drift analysis complete. Found {len(drift_results)} features")
        
        return jsonify({
            "success": True,
            "reference_dataset": str(ref_result[0]),
            "current_dataset": str(curr_result[0]),
            "drift_results": drift_results,
            "total_features": int(len(drift_results)),
            "features_with_drift": int(sum(1 for r in drift_results if r['drift_detected']))
        })
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Drift analysis error: {e}")
        import traceback
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()


@drift_bp.route("/history", methods=["GET"])
@jwt_required()
def get_drift_history():
    """Get drift detection history for user"""
    user_id = get_jwt_identity()
    
    # Get time range from query params (default: last 7 days)
    days = request.args.get('days', 7, type=int)
    start_date = datetime.now() - timedelta(days=days)
    
    conn = get_db()
    cur = conn.cursor()
    
    try:
        cur.execute(
            """
            SELECT feature_name, drift_score, detected_at 
            FROM drift_logs 
            WHERE user_id = %s AND detected_at >= %s
            ORDER BY detected_at DESC
            """,
            (user_id, start_date)
        )
        
        logs = cur.fetchall()
        
        # Group by feature
        feature_history = {}
        for feature_name, drift_score, detected_at in logs:
            if feature_name not in feature_history:
                feature_history[feature_name] = []
            
            feature_history[feature_name].append({
                'drift_score': float(drift_score),
                'timestamp': detected_at.isoformat()
            })
        
        return jsonify({
            "success": True,
            "history": feature_history,
            "total_logs": int(len(logs))
        })
        
    except Exception as e:
        print(f"Error fetching drift history: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()


@drift_bp.route("/summary", methods=["GET"])
@jwt_required()
def get_drift_summary():
    """Get drift summary statistics"""
    user_id = get_jwt_identity()
    
    conn = get_db()
    cur = conn.cursor()
    
    try:
        # Get recent drift logs (last 24 hours)
        cur.execute(
            """
            SELECT feature_name, AVG(drift_score) as avg_score, MAX(drift_score) as max_score, COUNT(*) as count
            FROM drift_logs 
            WHERE user_id = %s AND detected_at >= NOW() - INTERVAL '24 hours'
            GROUP BY feature_name
            ORDER BY avg_score DESC
            """,
            (user_id,)
        )
        
        summary = cur.fetchall()
        
        features = []
        for feature_name, avg_score, max_score, count in summary:
            features.append({
                'feature_name': str(feature_name),
                'avg_drift_score': float(avg_score),
                'max_drift_score': float(max_score),
                'detection_count': int(count),
                'status': 'high' if avg_score > 0.2 else 'medium' if avg_score > 0.1 else 'low'
            })
        
        return jsonify({
            "success": True,
            "features": features,
            "total_features_monitored": int(len(features))
        })
        
    except Exception as e:
        print(f"Error fetching drift summary: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()