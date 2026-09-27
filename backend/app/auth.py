from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token
import psycopg2
import secrets
from models import get_db
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

auth_bp = Blueprint("auth", __name__)

def send_verification_email(email, token):
    """Send verification email to user using app config"""
    try:
        config = current_app.config
        verification_url = f"{config['APP_URL']}/verify-email?token={token}"
        
        msg = MIMEMultipart()
        msg['From'] = config['MAIL_DEFAULT_SENDER']
        msg['To'] = email
        msg['Subject'] = "Verify Your Email - ML Observe"
        
        body = f"""
        <html>
            <body>
                <h2>Welcome to ML Observe!</h2>
                <p>Please click the link below to verify your email address:</p>
                <p><a href="{verification_url}">Verify Email</a></p>
                <p>Or copy this link: {verification_url}</p>
                <p>This link will expire in {config.get('VERIFICATION_TOKEN_EXPIRE_HOURS', 24)} hours.</p>
            </body>
        </html>
        """
        
        msg.attach(MIMEText(body, 'html'))
        
        server = smtplib.SMTP(config['SMTP_SERVER'], config['SMTP_PORT'])
        server.starttls()
        
        # Only try to login if credentials are provided
        if config.get('SMTP_USERNAME') and config.get('SMTP_PASSWORD'):
            server.login(config['SMTP_USERNAME'], config['SMTP_PASSWORD'])
        
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"Email sending failed: {e}")
        return False

# ======================
# REGISTER with Email Verification
# ======================
@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Email & password required"}), 400

    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters"}), 400

    hashed_password = generate_password_hash(password)
    verification_token = secrets.token_urlsafe(32)

    conn = get_db()
    cur = conn.cursor()

    try:
        # Insert user into database
        cur.execute(
            "INSERT INTO users (email, password, verification_token) VALUES (%s, %s, %s) RETURNING id",
            (email, hashed_password, verification_token)
        )
        user_id = cur.fetchone()[0]
        
        # ALWAYS COMMIT the user insert first
        conn.commit()
        print(f"✅ User '{email}' created with ID {user_id}")
        
        # Try to send verification email (but don't rollback if it fails)
        email_sent = send_verification_email(email, verification_token)
        
        if email_sent:
            return jsonify({
                "success": True,
                "message": "User registered successfully. Please check your email to verify your account."
            }), 201
        else:
            # User is saved, just email failed
            return jsonify({
                "success": True,
                "message": "Registration successful! Please login to continue.",
                "warning": "verification_email_failed"
            }), 201
            
    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        return jsonify({
            "success": False,
            "error": "Email already registered. Please use a different email or login."
        }), 409
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Registration error: {e}")
        return jsonify({
            "success": False,
            "error": "Registration failed due to server error."
        }), 500
        
    finally:
        cur.close()
        conn.close()

# ======================
# VERIFY EMAIL
# ======================
@auth_bp.route("/verify-email", methods=["GET"])
def verify_email():
    token = request.args.get("token")
    
    if not token:
        return jsonify({"error": "Token is required"}), 400
    
    conn = get_db()
    cur = conn.cursor()
    
    try:
        cur.execute(
            "SELECT id, email_verified FROM users WHERE verification_token = %s",
            (token,)
        )
        user = cur.fetchone()
        
        if not user:
            return jsonify({
                "success": False,
                "error": "Invalid or expired verification token."
            }), 400
        
        user_id, already_verified = user
        
        if already_verified:
            return jsonify({
                "success": True,
                "message": "Email already verified. You can login now."
            })
        
        cur.execute(
            "UPDATE users SET email_verified = TRUE, verification_token = NULL WHERE id = %s",
            (user_id,)
        )
        conn.commit()
        
        return jsonify({
            "success": True,
            "message": "Email verified successfully! You can now login."
        })
            
    except Exception as e:
        conn.rollback()
        print(f"Verification error: {e}")
        return jsonify({
            "success": False,
            "error": "Email verification failed."
        }), 500
    finally:
        cur.close()
        conn.close()

# ======================
# LOGIN
# ======================
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({
            "success": False,
            "error": "Email and password are required."
        }), 400

    conn = get_db()
    cur = conn.cursor()
    
    try:
        cur.execute(
            "SELECT id, password, email_verified FROM users WHERE email = %s",
            (email,)
        )
        user = cur.fetchone()
        
        if not user:
            return jsonify({
                "success": False,
                "error": "Invalid email or password."
            }), 401
        
        user_id, hashed_password, email_verified = user
        
        if not check_password_hash(hashed_password, password):
            return jsonify({
                "success": False,
                "error": "Invalid email or password."
            }), 401
        
        # Optional: Uncomment to enforce email verification
        # if not email_verified:
        #     return jsonify({
        #         "success": False,
        #         "error": "Please verify your email before logging in.",
        #         "needs_verification": True
        #     }), 403
        
        token = create_access_token(identity=str(user_id))
        
        return jsonify({
            "success": True,
            "access_token": token,
            "email_verified": email_verified,
            "user_id": user_id
        })
        
    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({
            "success": False,
            "error": "Login failed due to server error."
        }), 500
    finally:
        cur.close()
        conn.close()

# ======================
# RESEND VERIFICATION EMAIL
# ======================
@auth_bp.route("/resend-verification", methods=["POST"])
def resend_verification():
    data = request.json
    email = data.get("email")
    
    if not email:
        return jsonify({"error": "Email is required"}), 400
    
    conn = get_db()
    cur = conn.cursor()
    
    try:
        cur.execute(
            "SELECT id, email_verified FROM users WHERE email = %s",
            (email,)
        )
        user = cur.fetchone()
        
        if not user:
            return jsonify({
                "success": False,
                "error": "User not found."
            }), 404
        
        user_id, email_verified = user
        
        if email_verified:
            return jsonify({
                "success": True,
                "message": "Email already verified."
            })
        
        # Generate new verification token
        new_token = secrets.token_urlsafe(32)
        
        cur.execute(
            "UPDATE users SET verification_token = %s WHERE id = %s",
            (new_token, user_id)
        )
        
        # Commit the token update
        conn.commit()
        
        # Try to send email
        email_sent = send_verification_email(email, new_token)
        
        if email_sent:
            return jsonify({
                "success": True,
                "message": "Verification email resent. Please check your inbox."
            })
        else:
            return jsonify({
                "success": True,
                "message": "Verification token updated. Please contact support for email issues.",
                "warning": "email_failed"
            })
            
    except Exception as e:
        conn.rollback()
        print(f"Resend verification error: {e}")
        return jsonify({
            "success": False,
            "error": "Failed to resend verification email."
        }), 500
    finally:
        cur.close()
        conn.close()

# ======================
# CHECK AUTH STATUS
# ======================
@auth_bp.route("/check", methods=["GET"])
def check_auth():
    """Simple endpoint to check if auth routes are working"""
    return jsonify({
        "success": True,
        "message": "Auth routes are working",
        "routes": ["/register", "/login", "/verify-email", "/resend-verification"]
    })