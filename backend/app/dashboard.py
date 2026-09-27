from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import get_db
import numpy as np
from datetime import datetime

dashboard_bp = Blueprint("dashboard", __name__)

@dashboard_bp.route("/metrics", methods=["GET"])
@jwt_required()
def get_all_metrics():
    user_id = get_jwt_identity()
    
    conn = get_db()
    cur = conn.cursor()
    
    try:
        user_id_int = int(user_id) if user_id else 3
        
        # Get uploaded models count
        cur.execute("SELECT COUNT(*) FROM uploaded_models WHERE user_id = %s", (user_id_int,))
        models_count = cur.fetchone()[0] or 0
        
        # Get datasets count
        cur.execute("SELECT COUNT(*) FROM uploaded_datasets WHERE user_id = %s", (user_id_int,))
        datasets_count = cur.fetchone()[0] or 0
        
        # Get recent models
        cur.execute("""
            SELECT id, filename, uploaded_at 
            FROM uploaded_models 
            WHERE user_id = %s 
            ORDER BY uploaded_at DESC 
            LIMIT 5
        """, (user_id_int,))
        recent_models = [{"id": m[0], "name": m[1], "uploaded_at": m[2].isoformat() if m[2] else ""} for m in cur.fetchall()]
        
        # Get recent datasets
        cur.execute("""
            SELECT id, filename, uploaded_at 
            FROM uploaded_datasets 
            WHERE user_id = %s 
            ORDER BY uploaded_at DESC 
            LIMIT 5
        """, (user_id_int,))
        recent_datasets = [{"id": d[0], "name": d[1], "uploaded_at": d[2].isoformat() if d[2] else ""} for d in cur.fetchall()]
        
        # Get quality scores
        quality_scores = []
        try:
            cur.execute("""
                SELECT quality_score 
                FROM quality_logs 
                WHERE user_id = %s AND quality_score IS NOT NULL
                ORDER BY analyzed_at DESC 
                LIMIT 20
            """, (user_id_int,))
            quality_scores = [float(q[0]) for q in cur.fetchall() if q[0] is not None]
        except Exception as e:
            print(f"Quality logs error: {e}")
        
        avg_quality = np.mean(quality_scores) if quality_scores else 95.0
        
        # Get drift scores
        drift_scores = []
        try:
            cur.execute("""
                SELECT drift_score 
                FROM drift_logs 
                WHERE user_id = %s AND drift_score IS NOT NULL
                ORDER BY detected_at DESC 
                LIMIT 50
            """, (user_id_int,))
            drift_scores = [float(d[0]) for d in cur.fetchall() if d[0] is not None]
        except Exception as e:
            print(f"Drift logs error: {e}")
        
        high_drift_count = sum(1 for d in drift_scores if d > 0.2) if drift_scores else 0
        
        # Get model performance
        accuracies = []
        try:
            cur.execute("""
                SELECT accuracy 
                FROM model_metrics 
                WHERE user_id = %s AND accuracy IS NOT NULL
                ORDER BY created_at DESC 
                LIMIT 50
            """, (user_id_int,))
            accuracies = [float(a[0]) for a in cur.fetchall() if a[0] is not None]
        except Exception as e:
            print(f"Model metrics error: {e}")
        
        avg_accuracy = np.mean(accuracies) * 100 if accuracies else 85.0
        
        # Get explainability scores
        explain_scores = []
        try:
            cur.execute("""
                SELECT interpretability_score 
                FROM explainability_logs 
                WHERE user_id = %s AND interpretability_score IS NOT NULL
                ORDER BY created_at DESC 
                LIMIT 20
            """, (user_id_int,))
            explain_scores = [float(e[0]) for e in cur.fetchall() if e[0] is not None]
        except Exception as e:
            print(f"Explainability error: {e}")
        
        avg_interpretability = np.mean(explain_scores) if explain_scores else 7.5
        
        # Get fairness scores
        fairness_scores = []
        try:
            cur.execute("""
                SELECT overall_fairness_score 
                FROM bias_logs 
                WHERE user_id = %s AND overall_fairness_score IS NOT NULL
                ORDER BY created_at DESC 
                LIMIT 20
            """, (user_id_int,))
            fairness_scores = [float(f[0]) for f in cur.fetchall() if f[0] is not None]
        except Exception as e:
            print(f"Bias logs error: {e}")
        
        avg_fairness = np.mean(fairness_scores) * 100 if fairness_scores else 85.0
        
        # Performance trend data
        performance_data = []
        try:
            cur.execute("""
                SELECT accuracy, created_at 
                FROM model_metrics 
                WHERE user_id = %s AND accuracy IS NOT NULL
                ORDER BY created_at ASC 
                LIMIT 30
            """, (user_id_int,))
            for acc, created_at in cur.fetchall():
                if acc:
                    performance_data.append({
                        'date': created_at.strftime('%Y-%m-%d'),
                        'accuracy': round(float(acc) * 100, 1)
                    })
        except Exception as e:
            print(f"Performance trend error: {e}")
        
        # Count active alerts
        alerts_count = 0
        if high_drift_count > 0:
            alerts_count += 1
        if avg_quality < 80:
            alerts_count += 1
        if avg_fairness < 70:
            alerts_count += 1
        if avg_interpretability < 5:
            alerts_count += 1
        
        return jsonify({
            "success": True,
            "stats": {
                "active_models": models_count,
                "total_datasets": datasets_count,
                "avg_accuracy": round(avg_accuracy, 1),
                "avg_quality_score": round(avg_quality, 1),
                "avg_fairness_score": round(avg_fairness, 1),
                "avg_interpretability": round(avg_interpretability, 1),
                "high_drift_alerts": high_drift_count,
                "active_alerts": alerts_count
            },
            "recent_models": recent_models,
            "recent_datasets": recent_datasets,
            "performance_data": performance_data,
            "drift_chart_data": [
                {'metric': 'Data Quality', 'value': round(avg_quality / 100, 2), 'threshold': 0.9},
                {'metric': 'Fairness', 'value': round(avg_fairness / 100, 2), 'threshold': 0.8},
                {'metric': 'Interpretability', 'value': round(avg_interpretability / 10, 2), 'threshold': 0.7},
            ],
            "top_drift_features": [],
            "top_bias_issues": [],
            "alerts": [],
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()