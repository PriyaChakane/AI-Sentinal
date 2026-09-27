from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import pandas as pd
import numpy as np
import pickle
from models import get_db
from datetime import datetime
from functools import wraps
import random
import os

quality_bp = Blueprint("quality", __name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, "uploads/datasets")
MODEL_DIR = os.path.join(BASE_DIR, "uploads/models")


def quality_score_easter_egg(f):
    """Adds special messages when quality scores are suspiciously perfect"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        result = f(*args, **kwargs)
        
        if isinstance(result, tuple):
            response_data, status_code = result
        else:
            response_data = result
            status_code = 200
        
        # Check for perfect score
        quality_score = response_data.get('overall_quality_score', 0)
        
        if quality_score == 100:
            response_data['special_message'] = "🎉 PERFECT SCORE! Your data is cleaner than a whistle!"
            response_data['achievement_unlocked'] = "Data Perfectionist 🏆"
        elif quality_score >= 99:
            response_data['special_message'] = "🌟 Almost perfect! You're a data quality wizard!"
        elif quality_score == 42:
            response_data['special_message'] = "🤖 Quality score: 42... The answer to life, the universe, and everything!"
            response_data['easter_egg'] = "Hitchhiker's Guide reference detected!"
        
        return response_data, status_code
    
    return decorated_function


def load_model(model_path):
    """Load a pickled model"""
    try:
        with open(model_path, 'rb') as f:
            model = pickle.load(f)
        return model
    except Exception as e:
        print(f"Error loading model: {e}")
        return None


def get_model_feature_names(model):
    """Extract feature names from the model if available"""
    try:
        # For scikit-learn models
        if hasattr(model, 'feature_names_in_'):
            return list(model.feature_names_in_)
        # For pipelines
        elif hasattr(model, 'feature_names_'):
            return list(model.feature_names_)
        else:
            return None
    except Exception as e:
        print(f"Could not extract feature names: {e}")
        return None


def check_model_compatibility(df, model):
    """Check if dataset is compatible with the model"""
    model_features = get_model_feature_names(model)
    
    if model_features is None:
        return True, "Could not verify model features", []
    
    dataset_features = df.columns.tolist()
    
    # Check for missing features
    missing_features = [f for f in model_features if f not in dataset_features]
    
    # Check for extra features
    extra_features = [f for f in dataset_features if f not in model_features]
    
    compatible = len(missing_features) == 0
    
    message = ""
    if not compatible:
        message = f"Missing {len(missing_features)} required features"
    elif len(extra_features) > 0:
        message = f"Dataset has {len(extra_features)} extra features (won't affect model)"
    else:
        message = "Dataset fully compatible with model"
    
    return compatible, message, missing_features


@quality_bp.route("/analyze", methods=["POST"])
@jwt_required()
@quality_score_easter_egg
def analyze_quality():
    """Analyze data quality metrics for a dataset with optional model compatibility check"""
    user_id = get_jwt_identity()
    data = request.json
    
    dataset_id = data.get('dataset_id')
    model_id = data.get('model_id')  # Optional
    
    if not dataset_id:
        return {"error": "Dataset ID required"}, 400
    
    conn = get_db()
    cur = conn.cursor()
    
    try:
        # Get dataset
        cur.execute(
            "SELECT filename, path FROM uploaded_datasets WHERE id = %s AND user_id = %s",
            (dataset_id, user_id)
        )
        dataset_result = cur.fetchone()
        
        if not dataset_result:
            return {"error": "Dataset not found"}, 404
        
        dataset_filename, dataset_path = dataset_result
        
        # Get model if provided
        model = None
        model_filename = None
        model_features = None
        compatibility_info = None
        
        if model_id:
            cur.execute(
                "SELECT filename, path FROM uploaded_models WHERE id = %s AND user_id = %s",
                (model_id, user_id)
            )
            model_result = cur.fetchone()
            
            if model_result:
                model_filename, model_path = model_result
                model = load_model(model_path)
                
                if model:
                    model_features = get_model_feature_names(model)
                    print(f"Model expects features: {model_features}")
        
        print(f"Loading dataset: {dataset_path}")
        
        # Load dataset
        df = pd.read_csv(dataset_path)
        
        total_rows = len(df)
        total_cols = len(df.columns)
        
        # Check model compatibility if model was provided
        if model and model_features:
            compatible, message, missing_features = check_model_compatibility(df, model)
            compatibility_info = {
                'compatible': compatible,
                'message': message,
                'missing_features': missing_features,
                'expected_features': model_features,
                'dataset_features': df.columns.tolist()
            }
            print(f"Compatibility: {message}")
        
        # Calculate missing values per column
        missing_values = []
        for col in df.columns:
            missing_count = df[col].isna().sum()
            missing_pct = (missing_count / total_rows * 100) if total_rows > 0 else 0
            
            # Check if this feature is required by the model
            required_by_model = model_features and col in model_features if model_features else False
            
            missing_values.append({
                'field': str(col),
                'missing_count': int(missing_count),
                'percentage': float(round(missing_pct, 2)),
                'required_by_model': required_by_model
            })
        
        # Calculate duplicates
        duplicate_count = df.duplicated().sum()
        duplicate_pct = (duplicate_count / total_rows * 100) if total_rows > 0 else 0
        
        # Calculate overall quality score
        avg_missing_pct = sum(m['percentage'] for m in missing_values) / len(missing_values) if missing_values else 0
        quality_score = 100 - (avg_missing_pct + duplicate_pct) / 2
        
        # Penalize score if incompatible with model
        if compatibility_info and not compatibility_info['compatible']:
            quality_score = quality_score * 0.7  # 30% penalty for incompatibility
        
        quality_score = max(0, min(100, quality_score))  # Clamp between 0-100
        
        # Get numeric columns stats
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        outliers = []
        
        for col in numeric_cols:
            data_col = df[col].dropna()
            if len(data_col) > 0:
                Q1 = data_col.quantile(0.25)
                Q3 = data_col.quantile(0.75)
                IQR = Q3 - Q1
                lower_bound = Q1 - 1.5 * IQR
                upper_bound = Q3 + 1.5 * IQR
                
                outlier_count = ((data_col < lower_bound) | (data_col > upper_bound)).sum()
                outlier_pct = (outlier_count / len(data_col) * 100) if len(data_col) > 0 else 0
                
                # Check if this feature is required by the model
                required_by_model = model_features and col in model_features if model_features else False
                
                outliers.append({
                    'field': str(col),
                    'outlier_count': int(outlier_count),
                    'percentage': float(round(outlier_pct, 2)),
                    'required_by_model': required_by_model
                })
        
        # Data type analysis
        data_types = []
        for col in df.columns:
            dtype = str(df[col].dtype)
            required_by_model = model_features and col in model_features if model_features else False
            
            data_types.append({
                'field': str(col),
                'type': dtype,
                'required_by_model': required_by_model
            })
        
        # Save quality log
        try:
            cur.execute(
                """INSERT INTO quality_logs 
                   (dataset_id, model_id, quality_score, user_id, analyzed_at) 
                   VALUES (%s, %s, %s, %s, %s)""",
                (dataset_id, model_id, quality_score, user_id, datetime.now())
            )
            conn.commit()
        except Exception as e:
            print(f"Failed to save quality log: {e}")
        
        print(f"✅ Quality analysis complete. Score: {quality_score}%")
        
        response = {
            "success": True,
            "dataset_name": str(dataset_filename),
            "model_name": str(model_filename) if model_filename else None,
            "total_rows": int(total_rows),
            "total_columns": int(total_cols),
            "missing_values": missing_values,
            "duplicates": {
                "count": int(duplicate_count),
                "percentage": float(round(duplicate_pct, 2))
            },
            "outliers": outliers,
            "data_types": data_types,
            "overall_quality_score": float(round(quality_score, 2)),
            "model_compatibility": compatibility_info
        }
        
        return response, 200
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Quality analysis error: {e}")
        import traceback
        print(traceback.format_exc())
        return {"error": str(e)}, 500
    finally:
        cur.close()
        conn.close()


@quality_bp.route("/history", methods=["GET"])
@jwt_required()
def get_quality_history():
    """Get quality check history for user"""
    user_id = get_jwt_identity()
    
    conn = get_db()
    cur = conn.cursor()
    
    try:
        cur.execute(
            """
            SELECT 
                ql.quality_score,
                ql.analyzed_at,
                ud.filename as dataset_name,
                um.filename as model_name
            FROM quality_logs ql
            JOIN uploaded_datasets ud ON ql.dataset_id = ud.id
            LEFT JOIN uploaded_models um ON ql.model_id = um.id
            WHERE ql.user_id = %s
            ORDER BY ql.analyzed_at DESC
            LIMIT 50
            """,
            (user_id,)
        )
        
        logs = cur.fetchall()
        
        history = []
        for quality_score, analyzed_at, dataset_name, model_name in logs:
            history.append({
                'quality_score': float(quality_score),
                'timestamp': analyzed_at.isoformat(),
                'dataset': str(dataset_name),
                'model': str(model_name) if model_name else None
            })
        
        return jsonify({
            "success": True,
            "history": history,
            "total_logs": int(len(history))
        })
        
    except Exception as e:
        print(f"Error fetching quality history: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()


@quality_bp.route("/summary", methods=["GET"])
@jwt_required()
def get_quality_summary():
    """Get quality summary statistics"""
    user_id = get_jwt_identity()
    
    conn = get_db()
    cur = conn.cursor()
    
    try:
        cur.execute(
            """
            SELECT 
                AVG(quality_score) as avg_score,
                MAX(quality_score) as max_score,
                MIN(quality_score) as min_score,
                COUNT(*) as total_checks
            FROM quality_logs
            WHERE user_id = %s AND analyzed_at >= NOW() - INTERVAL '7 days'
            """,
            (user_id,)
        )
        
        result = cur.fetchone()
        
        if result:
            avg_score, max_score, min_score, total_checks = result
            
            return jsonify({
                "success": True,
                "avg_quality_score": float(avg_score) if avg_score else 0,
                "max_quality_score": float(max_score) if max_score else 0,
                "min_quality_score": float(min_score) if min_score else 0,
                "total_checks": int(total_checks) if total_checks else 0
            })
        else:
            return jsonify({
                "success": True,
                "avg_quality_score": 0,
                "max_quality_score": 0,
                "min_quality_score": 0,
                "total_checks": 0
            })
        
    except Exception as e:
        print(f"Error fetching quality summary: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()