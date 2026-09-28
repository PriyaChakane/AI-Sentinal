# ⚡ AI-Sentinel

### Intelligent ML Monitoring, Reliability & Explainability Platform

AI-Sentinel is a full-stack machine learning monitoring platform designed to observe ML models and datasets after deployment. It brings model management, data validation, drift analysis, performance tracking, explainability, fairness checks, alerting, and business-impact analysis into a single dashboard.

The platform is intended to help ML engineers understand how models behave in changing production environments and identify potential reliability issues before they become larger problems.

---

## 🎯 Why AI-Sentinel?

Training a machine learning model successfully does not guarantee that it will continue performing well after deployment.

Production environments continuously change. Incoming data may have different distributions, important features may become unreliable, model accuracy may decline, and prediction behavior may vary across different groups.

AI-Sentinel focuses on the monitoring stage of the ML lifecycle:

```text
Data
  ↓
Model Training
  ↓
Model Evaluation
  ↓
Deployment
  ↓
Production Predictions
  ↓
Continuous Monitoring
  ├── Data Quality
  ├── Data Drift
  ├── Concept Drift
  ├── Model Performance
  ├── Explainability
  ├── Fairness
  ├── Alerts
  └── Business Impact
```

The objective is to provide a centralized monitoring layer that helps users understand whether an ML system is still behaving as expected.

---

# 🧰 Technology Stack

| Component         | Technology                 |
| ----------------- | -------------------------- |
| Frontend          | Next.js, React, TypeScript |
| UI Styling        | Tailwind CSS               |
| Component Library | shadcn/ui                  |
| Icons             | Lucide React               |
| Visualization     | Recharts                   |
| Backend           | Flask                      |
| Authentication    | Flask-JWT-Extended         |
| Password Security | Werkzeug                   |
| Database          | PostgreSQL                 |
| Database Driver   | psycopg2                   |
| ML Processing     | scikit-learn               |
| Data Processing   | Pandas, NumPy              |
| Model Files       | Pickle / Joblib            |
| Containers        | Docker                     |
| Orchestration     | Docker Compose             |
| Communication     | REST APIs                  |

---

# ✨ Platform Capabilities

## 🔐 User Authentication

AI-Sentinel includes an authentication layer for controlling access to the monitoring dashboard.

The authentication system supports:

* User registration
* User login
* Password hashing
* PostgreSQL-based user records
* JWT token creation
* Protected backend endpoints
* Frontend authentication state
* Persistent browser authentication
* Secure dashboard access

### Authentication Process

```text
Registration
     ↓
Validate User Data
     ↓
Hash Password
     ↓
Store User
     ↓
Login
     ↓
Verify Credentials
     ↓
Generate JWT
     ↓
Open Protected Dashboard
```

Passwords are stored using password hashes instead of plain-text credentials.

---

## 📦 ML Model Management

The Model Management section provides a central location for registering and monitoring machine learning models.

The intended process is:

```text
Upload Model
     ↓
Validate Model File
     ↓
Store Model Artifact
     ↓
Save Model Metadata
     ↓
Attach Dataset
     ↓
Validate Compatibility
     ↓
Run Monitoring
     ↓
Generate Results
     ↓
Display Dashboard Metrics
```

Model management includes functionality for:

* Uploading models
* Viewing registered models
* Displaying model information
* Monitoring model status
* Comparing models
* Removing models
* Tracking model versions
* Viewing monitoring activity

The initial implementation focuses on tabular ML models compatible with scikit-learn.

Supported or planned model formats include:

```text
.pkl
.joblib
.onnx
.h5
.pt
```

Model loading and monitoring depend on the framework and serialization format.

---

# 📁 Dataset Monitoring

Datasets play an important role in determining whether a deployed ML model continues to operate correctly.

AI-Sentinel uses two main dataset concepts.

### Reference Dataset

The reference dataset represents the baseline distribution against which new observations are compared.

Possible sources include:

* Training datasets
* Validation datasets
* Historical production data
* Previously approved production distributions

### Current Dataset

The current dataset represents recent or newly collected production observations.

The monitoring process compares the two:

```text
Reference Data ─────┐
                    │
                    ▼
              Comparison Engine
                    ▲
                    │
Current Data ───────┘
                    ↓
             Monitoring Results
```

Dataset analysis can include:

* Schema validation
* Missing-value inspection
* Duplicate checking
* Data-type verification
* Distribution comparison
* Feature drift detection
* Prediction generation
* Performance measurement
* Data quality scoring

---

# 📊 Data Quality Checks

Poor-quality input data can affect model predictions even when the underlying model has not changed.

The data quality layer is designed to identify:

* Missing values
* Duplicate records
* Unexpected null rates
* Incorrect data types
* Missing columns
* Additional columns
* Constant-value features
* Invalid numeric ranges
* Unexpected categorical values
* Outlier changes
* Schema inconsistencies

### Quality Analysis Flow

```text
Dataset
  ↓
Schema Inspection
  ↓
Quality Analysis
  ├── Missing Values
  ├── Duplicate Rows
  ├── Data Types
  ├── Column Validation
  ├── Range Checks
  └── Category Checks
  ↓
Quality Metrics
  ↓
Warnings & Quality Score
```

The goal is to calculate monitoring information from actual datasets rather than relying only on static dashboard values.

---

# 📈 Data Drift Analysis

Data drift occurs when the distribution of production inputs changes relative to the data used as a reference.

For example:

```text
Reference Distribution
          ↓
     Drift Analysis
          ↑
Current Distribution
          ↓
Drift Results
```

The monitoring interface is designed to show:

* Overall drift status
* Feature-level drift
* Drift scores
* Number of affected features
* Drift severity
* Distribution comparisons
* Ranking of changed features
* Statistical evidence

Possible statistical techniques include:

* Population Stability Index (PSI)
* Kolmogorov-Smirnov Test
* Chi-Square Test
* Jensen-Shannon Divergence
* Wasserstein Distance

The selected method depends on the feature type and monitoring configuration.

---

# 📉 Model Performance & Concept Drift

A model may experience performance degradation even when its input data appears valid.

Concept drift refers to changes in the relationship between input variables and the target outcome.

AI-Sentinel is designed to evaluate model performance using labeled monitoring data.

```text
Model + Monitoring Dataset + Ground Truth
                    ↓
             Generate Predictions
                    ↓
              Calculate Metrics
                    ↓
       ┌────────────┬────────────┐
       ↓            ↓            ↓
   Accuracy     Precision      Recall
       ↓            ↓            ↓
     F1 Score      ROC-AUC   Confusion Matrix
                    ↓
            Compare Baseline
                    ↓
          Detect Performance Change
                    ↓
          Monitoring Recommendations
```

Performance monitoring can include:

* Accuracy
* Precision
* Recall
* F1 score
* ROC-AUC
* Confusion matrix
* Class-level performance
* Baseline comparison
* Performance trends
* Degradation indicators
* Monitoring recommendations

The Concept Drift dashboard provides the visualization layer, while backend integration is being developed to calculate metrics from uploaded models and datasets.

---

# 🔍 Explainable AI

Performance metrics can show that something changed, but explainability helps investigate **why** predictions changed.

The Explainability module is intended to provide both global and individual prediction insights.

```text
Model
  +
Dataset
  ↓
Explainability Layer
  ├── Global Feature Importance
  ├── Local Explanations
  ├── Feature Contributions
  └── Explanation Comparison
  ↓
Interactive Dashboard
```

Potential explanation techniques include:

* SHAP
* LIME
* Native feature importance
* Permutation importance
* Local feature contribution analysis

The selected technique depends on the model architecture and framework.

The module is designed to answer questions such as:

```text
Which features influence predictions the most?

Why did the model produce this prediction?

Have important features changed over time?

Which variables may be contributing to poor predictions?
```

---

# ⚖️ Fairness & Bias Analysis

Overall model performance does not always represent performance across individual groups.

The fairness monitoring component allows users to compare model results across selected sensitive attributes.

```text
Predictions
    ↓
Select Sensitive Attribute
    ↓
Create Comparison Groups
    ↓
Calculate Group Metrics
    ├── Accuracy
    ├── Selection Rate
    ├── True Positive Rate
    ├── False Positive Rate
    └── Performance Difference
    ↓
Fairness Analysis
    ↓
Potential Bias Indicators
```

Potential fairness measurements include:

* Demographic parity difference
* Equal opportunity difference
* Selection-rate comparison
* Group accuracy difference
* False-positive-rate difference
* True-positive-rate difference

These measurements are intended to highlight measurable differences between groups for further investigation. They do not automatically establish that a model is fair or unfair.

---

# 🚨 Monitoring Alerts

Monitoring becomes more useful when important changes can be surfaced automatically.

The alert layer evaluates monitoring metrics against configured thresholds.

```text
Monitoring Metrics
       ↓
Threshold Evaluation
       ├── Data Quality
       ├── Data Drift
       ├── Accuracy
       ├── Bias
       └── Performance
       ↓
Alert Generation
       ├── Low
       ├── Medium
       ├── High
       └── Critical
       ↓
Alert Dashboard
```

Example notifications:

```text
HIGH
Model precision has fallen below the configured threshold.

MEDIUM
A feature has experienced significant distribution change.

CRITICAL
Dataset quality has dropped below the accepted level.

HIGH
A measurable difference has been detected between selected groups.
```

Planned alert functionality includes:

* Email notifications
* Alert history
* Alert acknowledgement
* Configurable thresholds
* Monitoring rule configuration

---

# 💼 Business Impact Monitoring

Technical model metrics can eventually affect real-world business outcomes.

The Business Impact section is designed to connect model monitoring results with domain-specific consequences.

```text
Model Degradation
       ↓
Prediction Errors
       ↓
Business Metric
       ↓
Potential Impact
       ├── Revenue
       ├── Customers
       ├── Operational Cost
       └── Risk
```

### Example: Customer Churn

```text
Recall Decreases
      ↓
More Churn Customers Missed
      ↓
Fewer Retention Opportunities
      ↓
Potential Revenue Impact
```

### Example: Fraud Detection

```text
False Negatives Increase
      ↓
More Fraud Cases Missed
      ↓
Higher Financial Exposure
```

### Example: Demand Forecasting

```text
Forecast Error Increases
      ↓
Poor Inventory Planning
      ↓
Stockouts / Excess Inventory
```

Business impact calculations depend on the assumptions and metrics defined for each individual use case.

---

# 🏗️ Application Architecture

```text
                     USER
                      │
                      ▼
        ┌──────────────────────────┐
        │ Next.js / React Frontend │
        │                          │
        │ Dashboard                │
        │ Authentication           │
        │ Model Management         │
        │ Data Quality             │
        │ Drift Monitoring         │
        │ Explainability           │
        │ Fairness                 │
        │ Alerts                   │
        │ Business Impact          │
        └────────────┬─────────────┘
                     │
                  REST API
                     │
                     ▼
        ┌──────────────────────────┐
        │       Flask Backend      │
        │                          │
        │ Authentication           │
        │ JWT Security             │
        │ Model APIs               │
        │ Dataset APIs             │
        │ Monitoring Services      │
        └────────────┬─────────────┘
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
   ┌───────────────┐     ┌───────────────┐
   │  PostgreSQL   │     │ File Storage  │
   │               │     │               │
   │ Users         │     │ ML Models     │
   │ Metadata      │     │ Datasets      │
   │ Monitoring    │     │               │
   │ Alerts        │     │               │
   └───────┬───────┘     └───────┬───────┘
           │                       │
           └──────────┬────────────┘
                      ▼
             Monitoring Engine
                      │
       ┌──────────────┼──────────────┐
       ▼              ▼              ▼
   Data Quality     Drift       Performance
       │              │              │
       └──────────────┼──────────────┘
                      ▼
             Explainability
                      │
                      ▼
                Fairness
                      │
                      ▼
                  Alerts
```

---

# 📁 Project Structure

```text
AI-Sentinal/
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── public/
│   ├── styles/
│   ├── package.json
│   └── tsconfig.json
│
├── backend/
│   ├── app/
│   ├── routes/
│   ├── services/
│   ├── models/
│   ├── schemas/
│   └── requirements.txt
│
├── docker-compose.yml
├── Dockerfile
├── README.md
└── .gitignore
```

---

# 🔌 Backend API

The backend follows a REST-oriented structure.

## Authentication

```text
POST /api/auth/register
POST /api/auth/login
```

These endpoints handle user registration and authentication.

## System

```text
GET /api/health
GET /api/status
```

System endpoints provide application and service status information.

## Model & Dataset Operations

The platform provides API support for:

```text
Model Upload
Model Listing
Model Details
Model Deletion

Dataset Upload
Dataset Validation
Dataset Metadata
```

## Planned Monitoring APIs

The monitoring layer is being expanded to support endpoints for:

```text
Data Quality
Data Drift
Concept Drift
Performance
Explainability
Fairness
Alerts
Business Impact
Monitoring History
```

---

# 🐳 Docker-Based Deployment

The platform is structured around containerized services.

A typical environment contains:

```text
Docker Compose
     │
     ├── Frontend
     │
     ├── Flask API
     │
     └── PostgreSQL
```

This approach provides a consistent development environment and makes the application easier to run across different machines.

---

# 🔄 ML Monitoring Lifecycle

The intended end-to-end monitoring process is:

```text
1. Register User
       ↓
2. Upload ML Model
       ↓
3. Register Reference Dataset
       ↓
4. Upload Current Dataset
       ↓
5. Validate Data
       ↓
6. Generate Predictions
       ↓
7. Analyze Data Quality
       ↓
8. Detect Data Drift
       ↓
9. Evaluate Performance
       ↓
10. Analyze Explainability
       ↓
11. Evaluate Fairness
       ↓
12. Generate Alerts
       ↓
13. Estimate Business Impact
       ↓
14. Display Monitoring Dashboard
```

---

# 🧠 Monitoring Engine

The monitoring engine is designed as a modular layer so that individual monitoring capabilities can evolve independently.

```text
                 Monitoring Engine
                        │
        ┌───────────────┼────────────────┐
        ▼               ▼                ▼
   Data Quality       Drift          Performance
        │               │                │
        ▼               ▼                ▼
 Explainability     Fairness          Alerts
                        │
                        ▼
                 Business Impact
```

This modular structure allows additional monitoring techniques and model integrations to be introduced over time.

---

# 🚀 Getting Started

## Prerequisites

Install the following before running the project:

* Git
* Node.js
* npm
* Python
* Docker
* Docker Compose
* PostgreSQL-compatible environment

---

## 1. Clone the Repository

```bash
git clone https://github.com/PriyaChakane/AI-Sentinal.git
cd AI-Sentinal
```

---

## 2. Configure Environment Variables

Create the required environment configuration for the backend.

Example:

```env
DATABASE_URL=postgresql://username:password@postgres:5432/mlobserve
JWT_SECRET_KEY=your-secret-key
```

Use appropriate values for your local environment.

Do not commit sensitive credentials or secret keys to GitHub.

---

## 3. Build the Containers

```bash
docker compose build
```

---

## 4. Start the Application

```bash
docker compose up
```

To run the services in the background:

```bash
docker compose up -d
```

---

## 5. Open the Application

After the services start, access the frontend through the configured application port.

The backend API will be available through the Flask service.

---

## 6. Verify Containers

```bash
docker compose ps
```

---

## 7. View Backend Logs

```bash
docker compose logs backend
```

For continuous logs:

```bash
docker compose logs -f backend
```

---

## 8. Inspect PostgreSQL

PostgreSQL can be accessed through the configured database container.

```bash
docker compose exec postgres psql -U postgres
```

---

## 9. Stop the Application

```bash
docker compose down
```

---

# 📊 Example Monitoring Scenario

Consider a deployed customer-churn model.

A new production dataset is uploaded to AI-Sentinel.

The platform can perform the following analysis:

```text
Production Dataset
       ↓
Data Quality Check
       ↓
Feature Distribution Comparison
       ↓
Drift Detection
       ↓
Model Predictions
       ↓
Performance Evaluation
       ↓
Explainability Analysis
       ↓
Fairness Analysis
       ↓
Threshold Evaluation
       ↓
Alert Generation
       ↓
Dashboard
```

This gives the user a single location to inspect different aspects of model health.

---

# 🛣️ Development Roadmap

### Phase 1 — Platform Foundation

* Frontend dashboard
* Flask backend
* PostgreSQL integration
* Docker environment

### Phase 2 — Authentication

* Registration
* Login
* JWT authentication
* Protected routes
* Password security

### Phase 3 — Model & Dataset Management

* Model upload
* Dataset upload
* Metadata management
* Model listing
* Dataset validation

### Phase 4 — Monitoring Engine

* Prediction generation
* Performance calculations
* Monitoring APIs
* Baseline comparison

### Phase 5 — Data Quality & Drift

* Schema validation
* Missing-value analysis
* Data quality scoring
* PSI
* KS test
* Distribution analysis

### Phase 6 — Explainability & Fairness

* SHAP integration
* LIME integration
* Feature importance
* Group-level fairness metrics
* Bias analysis

### Phase 7 — Alerts & History

* Configurable thresholds
* Alert generation
* Alert history
* Monitoring history
* Email notifications

### Phase 8 — Production Preparation

* Improved security
* Logging
* Monitoring reliability
* Performance optimization
* Deployment configuration

---

# 🔮 Intended Production Architecture

The longer-term architecture is designed around a continuous ML monitoring workflow:

```text
                    ML Model
                       │
                       ▼
               Production System
                       │
                       ▼
                Prediction Data
                       │
                       ▼
              Monitoring Pipeline
                       │
       ┌───────────────┼────────────────┐
       ▼               ▼                ▼
   Data Quality      Drift         Performance
       │               │                │
       └───────────────┼────────────────┘
                       ▼
                Explainability
                       │
                       ▼
                  Fairness
                       │
                       ▼
                    Alerts
                       │
                       ▼
               Business Impact
                       │
                       ▼
                 ML Dashboard
```

---

# 🔐 Security Notes

The platform includes several security considerations:

* JWT-based authentication
* Password hashing
* Protected API routes
* Environment-based configuration
* Database-backed user management
* Validation of uploaded files
* Controlled access to model resources

Sensitive configuration values should always remain outside source control.

---

## ⚠️ Model Serialization Warning

Pickle and Joblib files should only be loaded when their source is trusted.

Loading an untrusted serialized ML model can execute malicious code.

For production environments, uploaded model files should be validated and handled using appropriate security controls.

---

# ⚠️ Current Development Limitations

AI-Sentinel is under active development.

Some monitoring modules currently contain frontend visualization or demonstration logic while backend integration is being developed.

Current limitations may include:

* Some dashboard metrics are demonstration values
* Monitoring APIs are still being expanded
* Model compatibility depends on the framework
* Explainability methods depend on model support
* Fairness metrics require suitable sensitive attributes
* Business impact calculations require domain-specific configuration
* Production-scale monitoring infrastructure is still under development

The project is therefore best viewed as a development-stage ML observability platform rather than a finished production monitoring service.

---

# 🎯 Project Vision

AI-Sentinel aims to provide a unified environment where teams can continuously inspect ML systems after deployment.

The long-term objective is to make it easier to:

* Identify data changes
* Detect model degradation
* Investigate prediction behavior
* Examine fairness metrics
* Track monitoring history
* Receive actionable alerts
* Understand possible business consequences

The platform combines these capabilities into one monitoring workflow instead of requiring separate tools for every stage of the ML lifecycle.

---

# 👩‍💻 Author

**Priya Chakane**

Artificial Intelligence & Data Science

GitHub:
https://github.com/PriyaChakane

---

## ⭐ Support

If you find the project useful, consider giving the repository a star and exploring the implementation.

---

# ⚡ AI-Sentinel

### Monitor Models. Understand Changes. Investigate Predictions. Improve ML Reliability.
