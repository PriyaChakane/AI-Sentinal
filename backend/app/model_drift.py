from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import pandas as pd
import numpy as np
import pickle
import joblib
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, mean_squared_error, r2_score, mean_absolute_error
from models import get_db
import os
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

model_drift_bp = Blueprint("model_drift", __name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def load_model(model_path):
    """Load a pickled model"""
    try:
        with open(model_path, 'rb') as f:
            return pickle.load(f)
    except:
        try:
            return joblib.load(model_path)
        except Exception as e:
            raise Exception(f"Failed to load model: {str(e)}")

def get_model_feature_names(model):
    """Extract feature names from model if available"""
    try:
        if hasattr(model, 'feature_names_in_'):
            return list(model.feature_names_in_)
        elif hasattr(model, 'feature_names'):
            return list(model.feature_names)
        elif hasattr(model, 'columns_'):
            return list(model.columns_)
        else:
            return None
    except:
        return None

def align_features(X, model_features, feature_mapping=None):
    """Align dataset features with model expected features"""
    if model_features is None:
        return X
    
    # If dataset has different column names, try to map or use numeric columns
    X_numeric = X.select_dtypes(include=[np.number])
    
    if len(X_numeric.columns) == len(model_features):
        # Rename columns to match model expectations
        X_aligned = X_numeric.copy()
        X_aligned.columns = model_features[:len(X_numeric.columns)]
        return X_aligned
    elif len(X_numeric.columns) > len(model_features):
        # Use top N features by variance
        variances = X_numeric.var()
        top_features = variances.nlargest(len(model_features)).index
        X_aligned = X_numeric[top_features]
        X_aligned.columns = model_features
        return X_aligned
    else:
        # Need to add missing features
        X_aligned = X_numeric.copy()
        for i, feat in enumerate(model_features):
            if i >= len(X_numeric.columns):
                X_aligned[feat] = 0  # Add missing features with 0
        X_aligned.columns = model_features[:len(X_aligned.columns)]
        return X_aligned

def calculate_classification_metrics(y_true, y_pred):
    """Calculate classification metrics"""
    try:
        return {
            'accuracy': float(accuracy_score(y_true, y_pred)),
            'precision': float(precision_score(y_true, y_pred, average='weighted', zero_division=0)),
            'recall': float(recall_score(y_true, y_pred, average='weighted', zero_division=0)),
            'f1_score': float(f1_score(y_true, y_pred, average='weighted', zero_division=0))
        }
    except Exception as e:
        print(f"Classification metrics error: {e}")
        return None

def calculate_regression_metrics(y_true, y_pred):
    """Calculate regression metrics"""
    try:
        return {
            'mse': float(mean_squared_error(y_true, y_pred)),
            'rmse': float(np.sqrt(mean_squared_error(y_true, y_pred))),
            'r2_score': float(r2_score(y_true, y_pred)),
            'mae': float(mean_absolute_error(y_true, y_pred))
        }
    except Exception as e:
        print(f"Regression metrics error: {e}")
        return None

def detect_concept_drift(history_metrics, current_metrics, threshold=0.05):
    """Detect concept drift based on performance degradation"""
    drift_detected = False
    drift_type = None
    severity = 'low'
    affected_metrics = []
    
    if not history_metrics:
        return drift_detected, drift_type, severity, affected_metrics
    
    if 'accuracy' in current_metrics and history_metrics[-1].get('accuracy'):
        accuracy_drop = history_metrics[-1]['accuracy'] - current_metrics['accuracy']
        if accuracy_drop > threshold:
            drift_detected = True
            affected_metrics.append(f"Accuracy dropped by {accuracy_drop*100:.1f}%")
            severity = 'high' if accuracy_drop > 0.15 else 'medium'
    
    if 'precision' in current_metrics and history_metrics[-1].get('precision'):
        precision_drop = history_metrics[-1]['precision'] - current_metrics['precision']
        if precision_drop > threshold:
            drift_detected = True
            affected_metrics.append(f"Precision dropped by {precision_drop*100:.1f}%")
    
    if 'recall' in current_metrics and history_metrics[-1].get('recall'):
        recall_drop = history_metrics[-1]['recall'] - current_metrics['recall']
        if recall_drop > threshold:
            drift_detected = True
            affected_metrics.append(f"Recall dropped by {recall_drop*100:.1f}%")
    
    if drift_detected:
        if len(affected_metrics) >= 2:
            drift_type = "Severe Concept Drift"
            severity = "high"
        elif 'precision' in str(affected_metrics):
            drift_type = "Precision-focused Drift"
        elif 'recall' in str(affected_metrics):
            drift_type = "Recall-focused Drift"
        else:
            drift_type = "General Performance Drift"
    else:
        drift_type = "No Significant Drift"
    
    return drift_detected, drift_type, severity, affected_metrics

@model_drift_bp.route("/evaluate", methods=["POST"])
@jwt_required()
def evaluate_model():
    """Evaluate a model on a dataset and detect concept drift"""
    user_id = get_jwt_identity()
    data = request.json
    
    model_id = data.get('model_id')
    dataset_id = data.get('dataset_id')
    target_column = data.get('target_column')
    task_type = data.get('task_type', 'classification')
    
    if not model_id or not dataset_id or not target_column:
        return jsonify({"error": "model_id, dataset_id, and target_column are required"}), 400
    
    conn = get_db()
    cur = conn.cursor()
    
    try:
        # Get model
        cur.execute(
            "SELECT filename, path FROM uploaded_models WHERE id = %s AND user_id = %s",
            (model_id, user_id)
        )
        model_result = cur.fetchone()
        
        # Get dataset
        cur.execute(
            "SELECT filename, path FROM uploaded_datasets WHERE id = %s AND user_id = %s",
            (dataset_id, user_id)
        )
        dataset_result = cur.fetchone()
        
        if not model_result or not dataset_result:
            return jsonify({"error": "Model or dataset not found"}), 404
        
        print(f"📊 Loading model: {model_result[0]}")
        model = load_model(model_result[1])
        
        print(f"📁 Loading dataset: {dataset_result[0]}")
        df = pd.read_csv(dataset_result[1])
        
        # Check if target column exists
        if target_column not in df.columns:
            return jsonify({
                "error": f"Target column '{target_column}' not found in dataset",
                "available_columns": df.columns.tolist()
            }), 400
        
        # Prepare features
        X = df.drop(columns=[target_column])
        y_true = df[target_column]
        
        # Handle non-numeric target for classification
        if task_type == 'classification' and y_true.dtype == 'object':
            from sklearn.preprocessing import LabelEncoder
            le = LabelEncoder()
            y_true = le.fit_transform(y_true)
        
        # Get model expected features
        model_features = get_model_feature_names(model)
        
        if model_features:
            print(f"Model expects {len(model_features)} features: {model_features[:5]}...")
            print(f"Dataset has {len(X.columns)} features: {X.columns.tolist()[:5]}...")
            
            # Try to align features
            X = align_features(X, model_features)
            print(f"Aligned features: {X.columns.tolist()[:5]}...")
        else:
            # Use only numeric columns
            numeric_cols = X.select_dtypes(include=[np.number]).columns.tolist()
            if len(numeric_cols) < len(X.columns):
                print(f"⚠️ Using {len(numeric_cols)} numeric features (dropped {len(X.columns) - len(numeric_cols)} non-numeric)")
                X = X[numeric_cols]
        
        # Make predictions
        try:
            y_pred = model.predict(X)
        except Exception as e:
            # If prediction fails, try to handle differently
            print(f"Prediction error: {e}")
            # Try to convert X to numpy array
            X_array = X.values if hasattr(X, 'values') else np.array(X)
            y_pred = model.predict(X_array)
        
        # Calculate metrics based on task type
        if task_type == 'classification':
            metrics = calculate_classification_metrics(y_true, y_pred)
        else:
            metrics = calculate_regression_metrics(y_true, y_pred)
        
        # Get historical metrics
        cur.execute(
            """
            SELECT accuracy, precision, recall, created_at 
            FROM model_metrics 
            WHERE user_id = %s AND model_name = %s
            ORDER BY created_at DESC 
            LIMIT 10
            """,
            (user_id, model_result[0])
        )
        history_data = cur.fetchall()
        
        # Build history metrics
        history_metrics = []
        for acc, prec, rec, created_at in history_data:
            history_metrics.append({
                'accuracy': float(acc) if acc else None,
                'precision': float(prec) if prec else None,
                'recall': float(rec) if rec else None,
                'timestamp': created_at.isoformat()
            })
        
        # Detect concept drift
        drift_detected, drift_type, severity, affected_metrics = detect_concept_drift(
            history_metrics, metrics, threshold=0.05
        )
        
        # Calculate drift score
        if history_metrics and 'accuracy' in metrics and history_metrics[0]['accuracy']:
            baseline_acc = history_metrics[0]['accuracy']
            drift_score = max(0, min(1, (baseline_acc - metrics['accuracy']) / baseline_acc)) if baseline_acc > 0 else 0
        else:
            drift_score = 0.0
        
        # Save current metrics
        if task_type == 'classification':
            cur.execute(
                """
                INSERT INTO model_metrics (model_name, accuracy, precision, recall, user_id, created_at)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (model_result[0], 
                 metrics.get('accuracy'), 
                 metrics.get('precision'), 
                 metrics.get('recall'),
                 user_id, 
                 datetime.now())
            )
        else:
            cur.execute(
                """
                INSERT INTO model_metrics (model_name, accuracy, precision, recall, user_id, created_at)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (model_result[0], 
                 metrics.get('rmse'), 
                 metrics.get('r2_score'), 
                 metrics.get('mae'),
                 user_id, 
                 datetime.now())
            )
        
        conn.commit()
        
        # Generate recommendations
        recommendations = []
        if drift_detected:
            if severity == 'high':
                recommendations.append("🚨 URGENT: Model performance has degraded significantly. Consider retraining immediately.")
            else:
                recommendations.append("⚠️ Performance degradation detected. Schedule model retraining.")
            for affected in affected_metrics[:3]:
                recommendations.append(f"📉 {affected}")
        else:
            recommendations.append("✅ Model performance is stable. No concept drift detected.")
        
        return jsonify({
            "success": True,
            "model_name": model_result[0],
            "dataset_name": dataset_result[0],
            "task_type": task_type,
            "metrics": metrics,
            "drift_detected": drift_detected,
            "drift_type": drift_type,
            "drift_severity": severity,
            "drift_score": float(drift_score),
            "affected_metrics": affected_metrics,
            "performance_history": history_metrics,
            "baseline_metrics": history_metrics[0] if history_metrics else None,
            "recommendations": recommendations,
            "total_samples": len(df),
            "timestamp": datetime.now().isoformat(),
            "feature_alignment": {
                "model_expected_features": model_features[:10] if model_features else None,
                "dataset_features": X.columns.tolist()[:10]
            }
        })
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()