import os
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from models import get_db

upload_bp = Blueprint("upload", __name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Use UPLOAD_ROOT from the environment when deployed.
# Falls back to the local uploads directory for development.
UPLOAD_ROOT = os.getenv(
    "UPLOAD_ROOT",
    os.path.join(BASE_DIR, "uploads")
)

MODEL_DIR = os.path.join(UPLOAD_ROOT, "models")
DATASET_DIR = os.path.join(UPLOAD_ROOT, "datasets")

os.makedirs(MODEL_DIR, exist_ok=True)
os.makedirs(DATASET_DIR, exist_ok=True)

ALLOWED_MODEL_EXTENSIONS = {'.pkl', '.h5', '.pt', '.pth', '.joblib'}
ALLOWED_DATASET_EXTENSIONS = {'.csv', '.json', '.parquet'}

MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB


def allowed_file(filename, allowed_extensions):
    return any(
        filename.lower().endswith(ext)
        for ext in allowed_extensions
    )


def file_size_exceeded(file):
    file.seek(0, os.SEEK_END)
    size = file.tell()
    file.seek(0)
    return size > MAX_FILE_SIZE


@upload_bp.route("/model", methods=["POST"])
@jwt_required()
def upload_model():
    """Upload ML model file"""

    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]

    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    filename = secure_filename(file.filename)

    if not allowed_file(filename, ALLOWED_MODEL_EXTENSIONS):
        return jsonify({
            "error": f"Only {ALLOWED_MODEL_EXTENSIONS} files allowed"
        }), 400

    if file_size_exceeded(file):
        return jsonify({
            "error": "File size exceeds the 100MB limit"
        }), 413

    # Get user ID from JWT
    user_id = get_jwt_identity()

    # Save file
    path = os.path.join(MODEL_DIR, filename)
    file.save(path)

    # Save to database
    conn = get_db()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            INSERT INTO uploaded_models
            (filename, path, user_id)
            VALUES (%s, %s, %s)
            RETURNING id
            """,
            (filename, path, user_id)
        )

        model_id = cur.fetchone()[0]
        conn.commit()

        return jsonify({
            "success": True,
            "message": "Model uploaded successfully",
            "model_id": model_id,
            "filename": filename
        }), 201

    except Exception as e:
        conn.rollback()

        # Delete file if database insert fails
        if os.path.exists(path):
            os.remove(path)

        return jsonify({
            "error": f"Database error: {str(e)}"
        }), 500

    finally:
        cur.close()
        conn.close()


@upload_bp.route("/dataset", methods=["POST"])
@jwt_required()
def upload_dataset():
    """Upload dataset file"""

    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]

    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    filename = secure_filename(file.filename)

    if not allowed_file(filename, ALLOWED_DATASET_EXTENSIONS):
        return jsonify({
            "error": f"Only {ALLOWED_DATASET_EXTENSIONS} files allowed"
        }), 400

    if file_size_exceeded(file):
        return jsonify({
            "error": "File size exceeds the 100MB limit"
        }), 413

    # Get user ID from JWT
    user_id = get_jwt_identity()

    # Save file
    path = os.path.join(DATASET_DIR, filename)
    file.save(path)

    # Save to database
    conn = get_db()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            INSERT INTO uploaded_datasets
            (filename, path, user_id)
            VALUES (%s, %s, %s)
            RETURNING id
            """,
            (filename, path, user_id)
        )

        dataset_id = cur.fetchone()[0]
        conn.commit()

        return jsonify({
            "success": True,
            "message": "Dataset uploaded successfully",
            "dataset_id": dataset_id,
            "filename": filename
        }), 201

    except Exception as e:
        conn.rollback()

        # Delete file if database insert fails
        if os.path.exists(path):
            os.remove(path)

        return jsonify({
            "error": f"Database error: {str(e)}"
        }), 500

    finally:
        cur.close()
        conn.close()


@upload_bp.route("/models", methods=["GET"])
@jwt_required()
def list_models():
    """List all uploaded models for current user"""

    user_id = get_jwt_identity()

    conn = get_db()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            SELECT id, filename, uploaded_at
            FROM uploaded_models
            WHERE user_id = %s
            ORDER BY uploaded_at DESC
            """,
            (user_id,)
        )

        models = cur.fetchall()

        return jsonify({
            "success": True,
            "models": [
                {
                    "id": m[0],
                    "filename": m[1],
                    "uploaded_at": m[2].isoformat() if m[2] else None
                }
                for m in models
            ]
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        cur.close()
        conn.close()


@upload_bp.route("/datasets", methods=["GET"])
@jwt_required()
def list_datasets():
    """List all uploaded datasets for current user"""

    user_id = get_jwt_identity()

    conn = get_db()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            SELECT id, filename, uploaded_at
            FROM uploaded_datasets
            WHERE user_id = %s
            ORDER BY uploaded_at DESC
            """,
            (user_id,)
        )

        datasets = cur.fetchall()

        return jsonify({
            "success": True,
            "datasets": [
                {
                    "id": d[0],
                    "filename": d[1],
                    "uploaded_at": d[2].isoformat() if d[2] else None
                }
                for d in datasets
            ]
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        cur.close()
        conn.close()
