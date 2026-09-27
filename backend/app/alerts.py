from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import get_db
from datetime import datetime

alerts_bp = Blueprint("alerts", __name__)

@alerts_bp.route("/", methods=["GET"])
@jwt_required()
def get_all_alerts():
    """Get all active alerts from all monitoring features"""
    user_id = get_jwt_identity()
    
    conn = get_db()
    cur = conn.cursor()
    
    all_alerts = []
    alert_id = 1
    
    try:
        # 1. CONCEPT DRIFT ALERTS (Model Performance Degradation)
        cur.execute("""
            SELECT model_name, accuracy, created_at 
            FROM model_metrics 
            WHERE user_id = %s AND accuracy IS NOT NULL
            ORDER BY created_at DESC 
            LIMIT 20
        """, (user_id,))
        metrics = cur.fetchall()
        
        if len(metrics) >= 2:
            latest_acc = metrics[0][1]
            prev_acc = metrics[1][1] if metrics[1][1] else latest_acc
            latest_model = metrics[0][0]
            
            if latest_acc and prev_acc and latest_acc < prev_acc * 0.9:
                all_alerts.append({
                    "id": alert_id,
                    "type": "Concept Drift - Performance Degradation",
                    "description": f"Model '{latest_model}' accuracy dropped from {(prev_acc*100):.1f}% to {(latest_acc*100):.1f}%",
                    "severity": "critical",
                    "timestamp": "Just now",
                    "status": "active",
                    "feature": "concept_drift",
                    "actions": ["Investigate", "Retrain Model", "Acknowledge"]
                })
                alert_id += 1
        
        # 2. DATA DRIFT ALERTS
        cur.execute("""
            SELECT feature_name, drift_score, detected_at 
            FROM drift_logs 
            WHERE user_id = %s AND drift_score > 0.2
            ORDER BY drift_score DESC 
            LIMIT 10
        """, (user_id,))
        drift_alerts = cur.fetchall()
        
        for feature, score, detected_at in drift_alerts:
            time_ago = "recent"
            if detected_at:
                hours = (datetime.now() - detected_at).total_seconds() / 3600
                time_ago = f"{int(hours)} hours ago" if hours < 24 else f"{int(hours/24)} days ago"
            
            all_alerts.append({
                "id": alert_id,
                "type": "Data Drift Detected",
                "description": f"Feature '{feature}' has drift score of {score:.3f} (threshold: 0.2)",
                "severity": "critical" if score > 0.3 else "warning",
                "timestamp": time_ago,
                "status": "active",
                "feature": "data_drift",
                "actions": ["View Details", "Investigate Pipeline", "Acknowledge"]
            })
            alert_id += 1
        
        # 3. FAIRNESS/BIAS ALERTS
        cur.execute("""
            SELECT dataset_name, overall_fairness_score, created_at 
            FROM bias_logs 
            WHERE user_id = %s AND overall_fairness_score < 0.8
            ORDER BY overall_fairness_score ASC 
            LIMIT 10
        """, (user_id,))
        bias_alerts = cur.fetchall()
        
        for dataset, score, created_at in bias_alerts:
            severity = "critical" if score < 0.7 else "warning"
            time_ago = "recent"
            if created_at:
                hours = (datetime.now() - created_at).total_seconds() / 3600
                time_ago = f"{int(hours)} hours ago" if hours < 24 else f"{int(hours/24)} days ago"
            
            all_alerts.append({
                "id": alert_id,
                "type": "Fairness Alert",
                "description": f"Fairness score for '{dataset}' is {(score*100):.1f}% (below {70 if score < 0.7 else 80}% threshold)",
                "severity": severity,
                "timestamp": time_ago,
                "status": "active",
                "feature": "fairness",
                "actions": ["Review Bias Report", "Mitigation Strategies", "Acknowledge"]
            })
            alert_id += 1
        
        # 4. DATA QUALITY ALERTS
        cur.execute("""
            SELECT dataset_name, quality_score, analyzed_at 
            FROM quality_logs 
            WHERE user_id = %s AND quality_score < 85
            ORDER BY quality_score ASC 
            LIMIT 10
        """, (user_id,))
        quality_alerts = cur.fetchall()
        
        for dataset, score, analyzed_at in quality_alerts:
            severity = "critical" if score < 70 else "warning"
            time_ago = "recent"
            if analyzed_at:
                hours = (datetime.now() - analyzed_at).total_seconds() / 3600
                time_ago = f"{int(hours)} hours ago" if hours < 24 else f"{int(hours/24)} days ago"
            
            all_alerts.append({
                "id": alert_id,
                "type": "Data Quality Issue",
                "description": f"Data quality score for '{dataset}' is {score:.1f}% (below {70 if score < 70 else 85}% threshold)",
                "severity": severity,
                "timestamp": time_ago,
                "status": "active",
                "feature": "quality",
                "actions": ["View Report", "Clean Data", "Acknowledge"]
            })
            alert_id += 1
        
        # 5. EXPLAINABILITY ALERTS
        cur.execute("""
            SELECT model_name, interpretability_score, created_at 
            FROM explainability_logs 
            WHERE user_id = %s AND interpretability_score < 6
            ORDER BY interpretability_score ASC 
            LIMIT 10
        """, (user_id,))
        explain_alerts = cur.fetchall()
        
        for model, score, created_at in explain_alerts:
            time_ago = "recent"
            if created_at:
                hours = (datetime.now() - created_at).total_seconds() / 3600
                time_ago = f"{int(hours)} hours ago" if hours < 24 else f"{int(hours/24)} days ago"
            
            all_alerts.append({
                "id": alert_id,
                "type": "Explainability Issue",
                "description": f"Interpretability score for '{model}' is {score:.1f}/10 (below threshold)",
                "severity": "warning",
                "timestamp": time_ago,
                "status": "active",
                "feature": "explainability",
                "actions": ["View SHAP/LIME", "Simplify Model", "Acknowledge"]
            })
            alert_id += 1
        
        # Sort by severity (critical first)
        severity_order = {'critical': 0, 'warning': 1, 'info': 2}
        all_alerts.sort(key=lambda x: severity_order.get(x['severity'], 3))
        
        # Calculate stats
        alert_stats = {
            "active_alerts": len(all_alerts),
            "critical": len([a for a in all_alerts if a['severity'] == 'critical']),
            "warnings": len([a for a in all_alerts if a['severity'] == 'warning']),
            "info": len([a for a in all_alerts if a['severity'] == 'info'])
        }
        
        return jsonify({
            "success": True,
            "alerts": all_alerts,
            "stats": alert_stats,
            "total_alerts": len(all_alerts),
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"Error fetching alerts: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()


@alerts_bp.route("/acknowledge/<int:alert_id>", methods=["POST"])
@jwt_required()
def acknowledge_alert(alert_id):
    """Acknowledge an alert (marks as acknowledged)"""
    # This would update a database table if you have one
    # For now, just return success
    return jsonify({
        "success": True,
        "message": f"Alert {alert_id} acknowledged",
        "timestamp": datetime.now().isoformat()
    })


@alerts_bp.route("/stats", methods=["GET"])
@jwt_required()
def get_alert_stats():
    """Get alert statistics summary"""
    user_id = get_jwt_identity()
    
    conn = get_db()
    cur = conn.cursor()
    
    try:
        # Count alerts from different features
        stats = {
            "concept_drift": 0,
            "data_drift": 0,
            "fairness": 0,
            "quality": 0,
            "explainability": 0
        }
        
        # Concept drift alerts
        cur.execute("""
            SELECT COUNT(*) FROM model_metrics m1
            WHERE user_id = %s AND accuracy IS NOT NULL
            AND EXISTS (
                SELECT 1 FROM model_metrics m2 
                WHERE m2.user_id = m1.user_id 
                AND m2.created_at < m1.created_at 
                AND m2.accuracy > m1.accuracy * 1.1
            )
        """, (user_id,))
        stats["concept_drift"] = cur.fetchone()[0] or 0
        
        # Data drift alerts
        cur.execute("""
            SELECT COUNT(*) FROM drift_logs 
            WHERE user_id = %s AND drift_score > 0.2
        """, (user_id,))
        stats["data_drift"] = cur.fetchone()[0] or 0
        
        # Fairness alerts
        cur.execute("""
            SELECT COUNT(*) FROM bias_logs 
            WHERE user_id = %s AND overall_fairness_score < 0.8
        """, (user_id,))
        stats["fairness"] = cur.fetchone()[0] or 0
        
        # Quality alerts
        cur.execute("""
            SELECT COUNT(*) FROM quality_logs 
            WHERE user_id = %s AND quality_score < 85
        """, (user_id,))
        stats["quality"] = cur.fetchone()[0] or 0
        
        # Explainability alerts
        cur.execute("""
            SELECT COUNT(*) FROM explainability_logs 
            WHERE user_id = %s AND interpretability_score < 6
        """, (user_id,))
        stats["explainability"] = cur.fetchone()[0] or 0
        
        return jsonify({
            "success": True,
            "stats": stats,
            "total": sum(stats.values()),
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()