from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import get_db
from datetime import datetime, timedelta
import numpy as np

auto_dashboard_bp = Blueprint("auto_dashboard", __name__)

@auto_dashboard_bp.route("/auto-generate", methods=["GET"])
@jwt_required()
def auto_generate():
    """Generate intelligent dashboard with insights"""
    user_id = get_jwt_identity()
    
    conn = get_db()
    cur = conn.cursor()
    
    try:
        user_id_int = int(user_id) if user_id else 3
        
        # Get all metrics
        cur.execute("SELECT COUNT(*) FROM uploaded_models WHERE user_id = %s", (user_id_int,))
        models = cur.fetchone()[0] or 0
        
        cur.execute("SELECT COUNT(*) FROM uploaded_datasets WHERE user_id = %s", (user_id_int,))
        datasets = cur.fetchone()[0] or 0
        
        # Performance metrics
        cur.execute("""
            SELECT AVG(accuracy), MAX(accuracy), MIN(accuracy)
            FROM model_metrics 
            WHERE user_id = %s AND accuracy IS NOT NULL
        """, (user_id_int,))
        perf = cur.fetchone()
        avg_accuracy = round((perf[0] or 0) * 100, 1)
        best_accuracy = round((perf[1] or 0) * 100, 1)
        
        # Quality metrics
        cur.execute("""
            SELECT AVG(quality_score), MIN(quality_score)
            FROM quality_logs 
            WHERE user_id = %s
        """, (user_id_int,))
        qual = cur.fetchone()
        avg_quality = round(qual[0] or 0, 1)
        min_quality = round(qual[1] or 0, 1)
        
        # Drift metrics
        cur.execute("""
            SELECT COUNT(*) FROM drift_logs 
            WHERE user_id = %s AND drift_score > 0.2
        """, (user_id_int,))
        drift_features = cur.fetchone()[0] or 0
        
        # Fairness metrics
        cur.execute("""
            SELECT AVG(overall_fairness_score)
            FROM bias_logs 
            WHERE user_id = %s
        """, (user_id_int,))
        fairness = cur.fetchone()
        avg_fairness = round((fairness[0] or 0) * 100, 1)
        
        # Generate smart insights
        insights = []
        
        if models == 0:
            insights.append("🚀 Get started by uploading your first model")
        elif avg_accuracy > 90:
            insights.append("🎯 Excellent model performance! Your models are doing great")
        elif avg_accuracy < 70:
            insights.append("⚠️ Model performance needs attention. Consider retraining")
        
        if drift_features > 5:
            insights.append(f"🌊 High drift detected in {drift_features} features")
        elif drift_features > 0:
            insights.append(f"📊 {drift_features} features showing drift")
        
        if avg_quality < 80:
            insights.append("🔧 Data quality needs improvement")
        elif avg_quality > 95:
            insights.append("✨ Data quality is excellent")
        
        if avg_fairness < 75:
            insights.append("⚖️ Bias detected. Review fairness metrics")
        
        # Determine overall status
        if avg_accuracy > 85 and avg_quality > 90 and avg_fairness > 80:
            status = "healthy"
            status_color = "green"
            status_message = "All systems operating normally"
        elif avg_accuracy < 70 or avg_quality < 80 or avg_fairness < 70:
            status = "critical"
            status_color = "red"
            status_message = "Critical issues require immediate attention"
        else:
            status = "warning"
            status_color = "yellow"
            status_message = "Some issues detected, monitor closely"
        
        return jsonify({
            "success": True,
            "dashboard_data": {
                "summary": {
                    "total_models": models,
                    "total_datasets": datasets,
                    "avg_accuracy": avg_accuracy,
                    "best_accuracy": best_accuracy,
                    "avg_quality": avg_quality,
                    "min_quality": min_quality,
                    "avg_fairness": avg_fairness,
                    "drift_features": drift_features
                },
                "insights": insights if insights else ["✅ All systems healthy. Continue monitoring"],
                "status": {
                    "level": status,
                    "color": status_color,
                    "message": status_message
                },
                "recommendations": generate_recommendations(avg_accuracy, avg_quality, avg_fairness, drift_features),
                "timestamp": datetime.now().isoformat()
            }
        })
        
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()

def generate_recommendations(accuracy, quality, fairness, drift):
    """Generate smart recommendations"""
    recs = []
    
    if accuracy < 80:
        recs.append("Retrain model to improve accuracy")
    if quality < 85:
        recs.append("Run data quality checks and clean data")
    if fairness < 80:
        recs.append("Review and mitigate model bias")
    if drift > 3:
        recs.append("Investigate data pipeline for drift sources")
    
    if not recs:
        recs.append("Schedule regular monitoring checks")
    
    return recs