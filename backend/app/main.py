import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity

from auth import auth_bp
from upload import upload_bp
from drift_detection import drift_bp
from model_drift import model_drift_bp
from explainability import explainability_bp
from config import Config
from data_quality import quality_bp
from bias_fairness import bias_bp
from dashboard import dashboard_bp
from alerts import alerts_bp
from auto_learning import auto_learning_bp
from decision_engine import decision_bp
from auto_dashboard import auto_dashboard_bp

app = Flask(__name__)
app.config.from_object(Config)

CORS(app, origins=app.config['CORS_ORIGINS'])
jwt = JWTManager(app)

# Register blueprints
app.register_blueprint(auth_bp, url_prefix="/auth")
app.register_blueprint(upload_bp, url_prefix="/upload")
app.register_blueprint(drift_bp, url_prefix="/drift")
app.register_blueprint(model_drift_bp, url_prefix="/model-drift")
app.register_blueprint(explainability_bp, url_prefix="/explainability")
app.register_blueprint(quality_bp, url_prefix="/quality")
app.register_blueprint(bias_bp, url_prefix="/bias")
app.register_blueprint(dashboard_bp, url_prefix="/dashboard")
app.register_blueprint(alerts_bp, url_prefix="/alerts")
app.register_blueprint(auto_learning_bp, url_prefix="/auto-learning")
app.register_blueprint(decision_bp, url_prefix="/decision")
app.register_blueprint(auto_dashboard_bp, url_prefix="/auto-dashboard")


@app.route("/")
def home():
    return jsonify({"status": "Flask backend running"})


@app.route("/health")
def health():
    return jsonify({"status": "healthy"})


@app.route("/health/db")
def health_db():
    try:
        from models import get_db
        conn = get_db()
        conn.close()
        return jsonify({"status": "db connected"})
    except Exception as e:
        return jsonify({"status": "db disconnected", "error": str(e)}), 503


@app.route("/protected")
@jwt_required()
def protected():
    return jsonify({"user": get_jwt_identity()})


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    app.run(host="0.0.0.0", port=port, debug=False)
