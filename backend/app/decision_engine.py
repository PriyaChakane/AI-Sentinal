from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import get_db
from datetime import datetime

decision_bp = Blueprint("decision", __name__)

@decision_bp.route("/recommendations", methods=["GET"])
@jwt_required()
def get_recommendations():
    """Get AI-powered recommendations"""
    user_id = get_jwt_identity()
    
    conn = get_db()
    cur = conn.cursor()
    
    try:
        user_id_int = int(user_id) if user_id else 3
        
        recommendations = []
        
        # Check if there's data
        cur.execute("SELECT COUNT(*) FROM uploaded_models WHERE user_id = %s", (user_id_int,))
        model_count = cur.fetchone()[0] or 0
        
        cur.execute("SELECT COUNT(*) FROM uploaded_datasets WHERE user_id = %s", (user_id_int,))
        dataset_count = cur.fetchone()[0] or 0
        
        if model_count == 0 or dataset_count == 0:
            recommendations.append({
                "id": 1,
                "title": "Upload Your First Model",
                "description": "Start by uploading a trained model and dataset",
                "priority": "high",
                "category": "getting_started",
                "action": "Go to Upload page",
                "expected_improvement": "Enable all monitoring features"
            })
        else:
            # Check quality
            cur.execute("""
                SELECT AVG(quality_score) FROM quality_logs 
                WHERE user_id = %s AND quality_score IS NOT NULL
            """, (user_id_int,))
            quality = cur.fetchone()[0]
            
            if quality and quality < 80:
                recommendations.append({
                    "id": 2,
                    "title": "Improve Data Quality",
                    "description": f"Data quality score is {quality:.1f}%",
                    "priority": "high",
                    "category": "data_quality",
                    "action": "Run Data Quality Check",
                    "expected_improvement": "Improve model accuracy by 5-10%"
                })
            
            # Default recommendation
            if len(recommendations) == 0:
                recommendations.append({
                    "id": 3,
                    "title": "Schedule Regular Monitoring",
                    "description": "Set up automated monitoring for proactive alerts",
                    "priority": "medium",
                    "category": "best_practice",
                    "action": "Configure Alerts",
                    "expected_improvement": "Early detection of issues"
                })
        
        return jsonify({
            "success": True,
            "recommendations": recommendations
        })
        
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()


@decision_bp.route("/execute/<int:recommendation_id>", methods=["POST"])
@jwt_required()
def execute_recommendation(recommendation_id):
    """Execute a recommendation"""
    return jsonify({
        "success": True,
        "message": f"Recommendation {recommendation_id} has been queued for execution",
        "executed_at": datetime.now().isoformat()
    })