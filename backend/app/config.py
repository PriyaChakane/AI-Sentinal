import os

class Config:
    # Database
    DATABASE_URL = os.getenv("DATABASE_URL")
    
    # JWT Configuration
    SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-key-change-in-production")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "jwt-secret-key-change-in-production")
    
    # Email Verification Configuration
    SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
    SMTP_USERNAME = os.getenv("SMTP_USERNAME")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
    APP_URL = os.getenv("APP_URL", "http://localhost:3000")
    
    # Email sender configuration
    MAIL_DEFAULT_SENDER = os.getenv("MAIL_DEFAULT_SENDER", SMTP_USERNAME)
    
    # Verification settings
    VERIFICATION_TOKEN_EXPIRE_HOURS = int(os.getenv("VERIFICATION_TOKEN_EXPIRE_HOURS", 24))
    
    # Security
    JWT_ACCESS_TOKEN_EXPIRES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES", 3600))  # 1 hour default
    
    # CORS settings
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")