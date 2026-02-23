# In model_trainer.py
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression # Keep for comparison, but won't be used
from sklearn.ensemble import RandomForestRegressor # <-- NEW IMPORT
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib
import os
# ...

# Configuration
NUM_RECORDS = 1000
MODEL_PATH = 'financial_model.pkl'

def generate_synthetic_data(n_records=NUM_RECORDS):
    """Generates a synthetic dataset for financial planning."""
    np.random.seed(42)

    # Inputs:
    salary = np.random.randint(30000, 200000, n_records) # ₹30k - ₹200k
    expenses = salary * np.random.uniform(0.3, 0.8, n_records) # 30%-80% of salary
    savings_percent = np.random.uniform(0.1, 0.4, n_records) # 10%-40% savings
    goal_amount = np.random.randint(100000, 5000000, n_records) # ₹1L - ₹50L
    duration_years = np.random.randint(1, 10, n_records) # 1-10 years
    goal_type = np.random.choice(['car', 'house_downpayment', 'trip', 'education'], n_records)

    # Derived/Target Feature:
    # Savings per month = (Salary - Expenses)
    # Target: Time (in months) to reach the goal, assuming constant savings
    monthly_savings = salary * (savings_percent)
    
    # Time to reach goal (in months) = Goal Amount / Monthly Savings
    # Add some noise to simulate real-world variance
    time_months = np.ceil(goal_amount / monthly_savings)
    time_months = time_months + np.random.randint(-10, 10, n_records) # Add noise
    
    # Cap the time to a realistic maximum, e.g., 10 years (120 months)
    time_months = np.clip(time_months, 1, 120) 
    
    # Feature Engineering for the Model: Savings Rate (for linearity)
    # The actual savings_percent used *in the model* will be derived from the inputs
    
    data = pd.DataFrame({
        'salary': salary,
        'expenses': expenses,
        'goal_amount': goal_amount,
        'duration_years': duration_years,
        'goal_type': goal_type,
        'savings_percent': savings_percent * 100, # stored as percentage (0-100)
        'time_months': time_months.astype(int),
        'achieved': (time_months <= (duration_years * 12)).astype(int)
    })
    
    return data

def train_and_save_model(df):
    """Trains a Linear Regression model to predict time_months."""
    # Features for the model
    # We use derived features that better represent the underlying financial relationship
    df['net_income'] = df['salary'] - df['expenses']
    df['required_savings_rate'] = df['goal_amount'] / (df['duration_years'] * 12) # Savings needed per month

    X = df[['net_income', 'required_savings_rate', 'salary', 'expenses']] # Features
    y = df['time_months'] # Target: Time in months

    # Split and Train
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    # Evaluate
    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    print(f"Model trained. Mean Absolute Error (MAE): {mae:.2f} months")

    # Save the model
    joblib.dump(model, MODEL_PATH)
    print(f"Model saved to {MODEL_PATH}")
    
    return model

if __name__ == '__main__':
    print("--- 💾 Generating Synthetic Data ---")
    synthetic_df = generate_synthetic_data()
    print(f"Generated {len(synthetic_df)} records.")
    
    print("\n--- 🧠 Training Model ---")
    train_and_save_model(synthetic_df)
    
    print("\nTraining complete. You can now run the FastAPI application.")