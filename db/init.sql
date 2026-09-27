-- Users table with email verification
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Model metrics table
CREATE TABLE IF NOT EXISTS model_metrics (
    id SERIAL PRIMARY KEY,
    model_name VARCHAR(100),
    accuracy FLOAT,
    precision FLOAT,
    recall FLOAT,
    f1_score FLOAT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Drift logs table
CREATE TABLE IF NOT EXISTS drift_logs (
    id SERIAL PRIMARY KEY,
    feature_name VARCHAR(100),
    drift_score FLOAT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Uploaded models table with user association
CREATE TABLE IF NOT EXISTS uploaded_models (
    id SERIAL PRIMARY KEY,
    filename TEXT NOT NULL,
    path TEXT NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Uploaded datasets table with user association
CREATE TABLE IF NOT EXISTS uploaded_datasets (
    id SERIAL PRIMARY KEY,
    filename TEXT NOT NULL,
    path TEXT NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Quality logs table
CREATE TABLE IF NOT EXISTS quality_logs (
    id SERIAL PRIMARY KEY,
    dataset_id INTEGER REFERENCES uploaded_datasets(id) ON DELETE SET NULL,
    dataset_name VARCHAR(255),
    quality_score FLOAT,
    missing_values_percent FLOAT,
    duplicate_count INTEGER,
    outlier_count INTEGER,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Explainability logs table
CREATE TABLE IF NOT EXISTS explainability_logs (
    id SERIAL PRIMARY KEY,
    model_name VARCHAR(255),
    dataset_name VARCHAR(255),
    num_features INTEGER,
    interpretability_score FLOAT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bias logs table
CREATE TABLE IF NOT EXISTS bias_logs (
    id SERIAL PRIMARY KEY,
    dataset_id INTEGER REFERENCES uploaded_datasets(id) ON DELETE SET NULL,
    model_id INTEGER REFERENCES uploaded_models(id) ON DELETE SET NULL,
    dataset_name VARCHAR(255),
    overall_fairness_score FLOAT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_uploaded_models_user ON uploaded_models(user_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_datasets_user ON uploaded_datasets(user_id);
CREATE INDEX IF NOT EXISTS idx_model_metrics_user ON model_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_drift_logs_user ON drift_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_quality_logs_user ON quality_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_quality_logs_dataset ON quality_logs(dataset_id);
CREATE INDEX IF NOT EXISTS idx_explainability_user ON explainability_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_bias_logs_user ON bias_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_bias_logs_dataset ON bias_logs(dataset_id);