import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.datasets import make_classification
import pickle

print("Creating synthetic classification dataset...")

# Create a synthetic classification dataset
X, y = make_classification(
    n_samples=1000,
    n_features=10,
    n_informative=8,
    n_redundant=2,
    n_classes=2,
    random_state=42,
    flip_y=0.1
)

# Create feature names
feature_names = [f'feature_{i}' for i in range(10)]

# Create DataFrame
df = pd.DataFrame(X, columns=feature_names)
df['target'] = y

print(f"Dataset created: {df.shape[0]} rows, {df.shape[1]} columns")
print(f"Class distribution:\n{df['target'].value_counts()}")

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    df[feature_names], 
    df['target'], 
    test_size=0.3, 
    random_state=42
)

print("\nTraining Random Forest model...")
# Train model
model = RandomForestClassifier(
    n_estimators=100,
    max_depth=10,
    random_state=42
)
model.fit(X_train, y_train)

# Check accuracy
train_accuracy = model.score(X_train, y_train)
test_accuracy = model.score(X_test, y_test)

print(f"✅ Model trained successfully!")
print(f"Training accuracy: {train_accuracy:.2%}")
print(f"Test accuracy: {test_accuracy:.2%}")

# Save model
model_filename = 'classification_model.pkl'
with open(model_filename, 'wb') as f:
    pickle.dump(model, f)
print(f"✅ Model saved: {model_filename}")

# Create test dataset (baseline - same distribution)
baseline_data = df[feature_names + ['target']].iloc[:300].copy()
baseline_data.to_csv('baseline_test_data.csv', index=False)
print(f"✅ Baseline dataset saved: baseline_test_data.csv ({baseline_data.shape[0]} rows)")

# Create current dataset (slightly drifted)
current_data = df[feature_names + ['target']].iloc[300:600].copy()
# Add some drift by slightly modifying features
for col in feature_names[:5]:  # Drift in first 5 features
    current_data[col] = current_data[col] + np.random.normal(0, 0.3, len(current_data))
current_data.to_csv('current_test_data.csv', index=False)
print(f"✅ Current dataset (with drift) saved: current_test_data.csv ({current_data.shape[0]} rows)")

# Create degraded dataset (worse performance)
degraded_data = df[feature_names + ['target']].iloc[600:900].copy()
# Add more noise to degrade performance
for col in feature_names:
    degraded_data[col] = degraded_data[col] + np.random.normal(0, 0.8, len(degraded_data))
degraded_data.to_csv('degraded_test_data.csv', index=False)
print(f"✅ Degraded dataset (for concept drift) saved: degraded_test_data.csv ({degraded_data.shape[0]} rows)")

print("\n" + "="*60)
print("ALL FILES CREATED SUCCESSFULLY!")
print("="*60)
print("\nYou now have:")
print("1. classification_model.pkl - Trained Random Forest model")
print("2. baseline_test_data.csv - Baseline dataset (good performance)")
print("3. current_test_data.csv - Dataset with data drift")
print("4. degraded_test_data.csv - Dataset with concept drift (poor performance)")
print("\nTarget column name: 'target'")
print("Task type: Classification")
print("\nNext steps:")
print("1. Upload classification_model.pkl to your app")
print("2. Upload all 3 CSV files")
print("3. Test Data Drift: Compare baseline_test_data.csv vs current_test_data.csv")
print("4. Test Concept Drift: Evaluate model on degraded_test_data.csv")