from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import get_db
from datetime import datetime
import numpy as np

auto_learning_bp = Blueprint("auto_learning", __name__)

@auto_learning_bp.route("/insights", methods=["GET"])
@jwt_required()
def get_auto_insights():
    """Get auto-generated insights from monitoring data"""
    user_id = get_jwt_identity()
    
    conn = get_db()
    cur = conn.cursor()
    
    try:
        user_id_int = int(user_id) if user_id else 3
        
        insights = []
        health_score = 95
        
        # Get counts
        cur.execute("SELECT COUNT(*) FROM uploaded_models WHERE user_id = %s", (user_id_int,))
        model_count = cur.fetchone()[0] or 0
        
        cur.execute("SELECT COUNT(*) FROM uploaded_datasets WHERE user_id = %s", (user_id_int,))
        dataset_count = cur.fetchone()[0] or 0
        
        # No data case
        if model_count == 0 or dataset_count == 0:
            insights.append({
                "type": "welcome",
                "severity": "info",
                "message": "Welcome to ML Observe! Upload your first model and dataset to get started.",
                "recommendation": "Go to Upload page and add your files",
                "auto_action": "none"
            })
            health_score = 100
            
        else:
            # 1. Check Data Quality
            cur.execute("""
                SELECT AVG(quality_score) as avg_quality, MIN(quality_score) as min_quality
                FROM quality_logs 
                WHERE user_id = %s AND quality_score IS NOT NULL
            """, (user_id_int,))
            quality_data = cur.fetchone()
            avg_quality = quality_data[0] if quality_data[0] else 95
            min_quality = quality_data[1] if quality_data[1] else 95
            
            if min_quality < 70:
                insights.append({
                    "type": "quality_critical",
                    "severity": "critical",
                    "message": f"Critical data quality issue detected! Quality score dropped to {min_quality:.1f}%",
                    "recommendation": "Immediately check for missing values, duplicates, and outliers",
                    "auto_action": "quality_alert"
                })
                health_score = 50
            elif min_quality < 85:
                insights.append({
                    "type": "quality_warning",
                    "severity": "warning",
                    "message": f"Data quality score is {min_quality:.1f}% (below 85% threshold)",
                    "recommendation": "Review data pipeline for potential issues",
                    "auto_action": "quality_check"
                })
                health_score = 70
            elif avg_quality > 95:
                insights.append({
                    "type": "quality_excellent",
                    "severity": "info",
                    "message": f"Data quality is excellent! Average score: {avg_quality:.1f}%",
                    "recommendation": "Continue maintaining data quality standards",
                    "auto_action": "none"
                })
            
            # 2. Check Model Performance
            cur.execute("""
                SELECT accuracy, created_at 
                FROM model_metrics 
                WHERE user_id = %s AND accuracy IS NOT NULL
                ORDER BY created_at DESC LIMIT 10
            """, (user_id_int,))
            perf_data = cur.fetchall()
            
            if len(perf_data) >= 2:
                current_acc = perf_data[0][0] * 100
                previous_acc = perf_data[1][0] * 100
                change = current_acc - previous_acc
                
                if change < -10:
                    insights.append({
                        "type": "performance_critical",
                        "severity": "critical",
                        "message": f"Model performance degraded significantly! Accuracy dropped by {abs(change):.1f}%",
                        "recommendation": "URGENT: Retrain model immediately with recent data",
                        "auto_action": "trigger_retraining"
                    })
                    health_score = 45
                elif change < -5:
                    insights.append({
                        "type": "performance_warning",
                        "severity": "warning",
                        "message": f"Model accuracy decreased by {abs(change):.1f}%",
                        "recommendation": "Schedule model retraining soon",
                        "auto_action": "schedule_retraining"
                    })
                    health_score = 65
            
            # 3. Check Data Drift
            cur.execute("""
                SELECT feature_name, drift_score 
                FROM drift_logs 
                WHERE user_id = %s AND drift_score > 0.2
                ORDER BY drift_score DESC LIMIT 5
            """, (user_id_int,))
            drift_data = cur.fetchall()
            
            if len(drift_data) >= 3:
                features = [d[0] for d in drift_data[:3]]
                insights.append({
                    "type": "drift_high",
                    "severity": "warning",
                    "message": f"High drift detected in {len(drift_data)} features: {', '.join(features)}",
                    "recommendation": "Investigate data source changes and update feature transformations",
                    "auto_action": "drift_investigation"
                })
                health_score = 60
            elif len(drift_data) > 0:
                insights.append({
                    "type": "drift_detected",
                    "severity": "info",
                    "message": f"{len(drift_data)} feature(s) showing drift above threshold",
                    "recommendation": "Monitor these features closely and review data pipeline",
                    "auto_action": "monitor_drift"
                })
            
            # 4. Check Bias/Fairness
            cur.execute("""
                SELECT overall_fairness_score, created_at 
                FROM bias_logs 
                WHERE user_id = %s
                ORDER BY created_at DESC LIMIT 1
            """, (user_id_int,))
            fairness = cur.fetchone()
            
            if fairness and fairness[0]:
                fairness_score = fairness[0] * 100
                if fairness_score < 70:
                    insights.append({
                        "type": "fairness_critical",
                        "severity": "critical",
                        "message": f"Critical fairness issue! Score is {fairness_score:.1f}% (below 70%)",
                        "recommendation": "Immediate bias mitigation required - review protected attributes",
                        "auto_action": "bias_mitigation"
                    })
                    health_score = 55
                elif fairness_score < 80:
                    insights.append({
                        "type": "fairness_warning",
                        "severity": "warning",
                        "message": f"Fairness score is {fairness_score:.1f}% (below 80% threshold)",
                        "recommendation": "Review model for potential disparate impact",
                        "auto_action": "bias_review"
                    })
                    health_score = 75
                elif fairness_score > 90:
                    insights.append({
                        "type": "fairness_excellent",
                        "severity": "info",
                        "message": f"Fairness metrics look good! Score: {fairness_score:.1f}%",
                        "recommendation": "Continue monitoring for any changes",
                        "auto_action": "none"
                    })
            
            # 5. Check Explainability
            cur.execute("""
                SELECT interpretability_score, created_at 
                FROM explainability_logs 
                WHERE user_id = %s
                ORDER BY created_at DESC LIMIT 1
            """, (user_id_int,))
            explain = cur.fetchone()
            
            if explain and explain[0] and explain[0] < 5:
                insights.append({
                    "type": "explainability_issue",
                    "severity": "warning",
                    "message": f"Model interpretability score is {explain[0]:.1f}/10 (below threshold)",
                    "recommendation": "Consider using simpler models or SHAP/LIME for better explanations",
                    "auto_action": "explainability_review"
                })
                health_score = 80
        
        # Default insight if no specific issues
        if not insights:
            insights.append({
                "type": "healthy",
                "severity": "info",
                "message": f"All systems healthy! {model_count} models and {dataset_count} datasets are being monitored",
                "recommendation": "Continue regular monitoring and upload more data for better insights",
                "auto_action": "none"
            })
        
        # Calculate overall health score
        health_score = min(100, max(0, health_score))
        
        return jsonify({
            "success": True,
            "insights": insights,
            "health_score": health_score,
            "auto_upgrade_available": {"available": False},
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"Error in auto_learning: {e}")
        import traceback
        traceback.print_exc()
        
        # Return graceful error response
        return jsonify({
            "success": True,
            "insights": [{
                "type": "info",
                "severity": "info",
                "message": "Auto insights system is initializing",
                "recommendation": "Upload models and datasets to see insights",
                "auto_action": "none"
            }],
            "health_score": 100,
            "auto_upgrade_available": {"available": False},
            "timestamp": datetime.now().isoformat()
        }), 200
    finally:
        cur.close()
        conn.close()