import psycopg2
import os
import time

def get_db():
    """Get database connection with retry logic"""
    DATABASE_URL = os.getenv("DATABASE_URL")
    
    if not DATABASE_URL:
        raise Exception("DATABASE_URL environment variable not set")
    
    for i in range(10):
        try:
            conn = psycopg2.connect(DATABASE_URL)
            print("✅ DB Connected")
            return conn
        except Exception as e:
            print(f"⏳ Waiting for DB... attempt {i+1}/10 ({e})")
            time.sleep(3)
    
    raise Exception("❌ DB connection failed after 10 attempts")