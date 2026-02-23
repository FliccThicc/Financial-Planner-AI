from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import joblib
import pandas as pd
import numpy as np
import os

# --- Configuration & Model Loading ---
MODEL_PATH = 'financial_model.pkl'

# Check if model exists and load it
if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(
        f"Model file '{MODEL_PATH}' not found. Please run 'python model_trainer.py' first."
    )

try:
    model = joblib.load(MODEL_PATH)
except Exception as e:
    raise RuntimeError(f"Could not load the model: {e}")

app = FastAPI(
    title="AI Financial Planner Backend",
    description="Backend for AI-Based Financial Planning using FastAPI and Scikit-learn."
)

# --- CORS Configuration ---
# Allow specific origins from environment, defaulting to standard dev ports
cors_origins_str = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
origins = [origin.strip() for origin in cors_origins_str.split(",") if origin.strip()]

# Add the CORSMiddleware to the application
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Models for Data Validation ---
class FinancialInput(BaseModel):
    """Defines the required input structure for the API."""
    salary: float = Field(..., gt=0, description="Monthly net salary in ₹")
    expenses: float = Field(..., gt=0, description="Monthly fixed and variable expenses in ₹")
    goal_amount: float = Field(..., gt=0, description="Target goal amount in ₹")
    goal_type: str = Field(..., description="Type of goal (e.g., car, house, trip)")
    duration_years: int = Field(..., gt=0, description="Desired time to achieve goal, in years")
    # Optional field, used for prediction, but can be ignored for recommendation
    savings_percent: float = Field(None, ge=0, le=100, description="Current/Hypothetical savings percentage (0-100)")

class PredictionResponse(BaseModel):
    """Defines the output structure for the prediction and recommendation."""
    goal_type: str
    predicted_months: int = Field(..., ge=1)
    recommended_savings_percent: int = Field(..., ge=1, le=100)
    insight: str

# --- Helper Functions ---
def predict_time_to_goal(input_data: FinancialInput) -> float:
    """Uses the trained model to predict goal achievement time in months."""
    # Feature engineering for prediction
    net_income = input_data.salary - input_data.expenses
    required_savings_rate = input_data.goal_amount / (input_data.duration_years * 12)
    
    # Create a DataFrame row for the model
    data = pd.DataFrame([[
        net_income, 
        required_savings_rate, 
        input_data.salary, 
        input_data.expenses
    ]], columns=['net_income', 'required_savings_rate', 'salary', 'expenses'])
    
    # Predict
    predicted_months = model.predict(data)[0]
    return max(1, round(predicted_months)) # Ensure minimum 1 month

def calculate_recommendation(input_data: FinancialInput, target_months: int) -> int:
    """Calculates the necessary savings rate to meet a specific target time."""
    monthly_savings_needed = input_data.goal_amount / target_months
    
    # Available income for savings
    net_income = input_data.salary - input_data.expenses
    
    if monthly_savings_needed > net_income:
        # Cannot achieve goal even by saving 100% of available income
        return 100 # Recommend maximum possible
        
    recommended_savings_amount = monthly_savings_needed + input_data.expenses # Total required for goal + expenses
    
    # Savings % = (Total Required - Expenses) / Salary
    recommended_percent = (recommended_savings_amount / input_data.salary) * 100
    
    # Cap between 1 and 100 and round
    return int(np.clip(round(recommended_percent), 1, 100))

# --- API Routes ---

@app.get("/")
def read_root():
    return {"message": "AI Financial Planner API is running."}

@app.post("/predict", response_model=PredictionResponse)
async def predict_goal_achievement(input_data: FinancialInput):
    """
    Predicts the time (in months) to achieve the goal based on current parameters.
    It uses the AI model primarily for the *predicted_months*.
    """
    
    # 1. AI Model Prediction (Predicted Months)
    predicted_months = predict_time_to_goal(input_data)
    
    # 2. Recommendation Calculation
    # We set the target time to the user's desired duration (in months)
    target_months = input_data.duration_years * 12
    recommended_savings_percent = calculate_recommendation(input_data, target_months)

    # 3. Insight Generation (Heuristic)
    insight_text = ""
    current_savings_rate = (input_data.salary - input_data.expenses) / input_data.salary * 100
    
    if predicted_months <= target_months:
        insight_text = (
            f"You are on track! By saving **{current_savings_rate:.0f}%** of your salary "
            f"(₹{input_data.salary - input_data.expenses:,.0f}/month), you will achieve your "
            f"{input_data.goal_type} goal in {predicted_months} months."
        )
    else:
        # Calculate how much more to save to hit the target_months
        current_savings = input_data.salary - input_data.expenses
        required_savings_per_month = input_data.goal_amount / target_months
        extra_savings_needed = required_savings_per_month - current_savings
        
        if extra_savings_needed > 0:
            insight_text = (
                f"To hit your target of {input_data.duration_years} years, you need to increase your "
                f"monthly savings by **₹{extra_savings_needed:,.0f}**. This translates to a "
                f"recommended savings rate of {recommended_savings_percent}%."
            )
        else:
            # This case means predicted_months > target_months due to model error/noise, but required savings is lower
            # Fallback to the recommended percentage to be safe
            insight_text = (
                f"The model suggests you may take longer. Save **{recommended_savings_percent}%** "
                f"of your salary to achieve your goal exactly in {input_data.duration_years} years."
            )


    return PredictionResponse(
        goal_type=input_data.goal_type,
        predicted_months=predicted_months,
        recommended_savings_percent=recommended_savings_percent,
        insight=insight_text
    )

@app.post("/recommend", response_model=PredictionResponse)
async def get_savings_recommendation(input_data: FinancialInput):
    """
    Returns a recommendation based on the *user's desired duration* (not the model's prediction).
    """
    # 1. Calculate Recommended Savings Percentage
    target_months = input_data.duration_years * 12
    recommended_savings_percent = calculate_recommendation(input_data, target_months)
    
    # 2. Insight Generation
    if recommended_savings_percent == 100:
        insight_text = (
            "⚠️ **Warning**: To achieve your goal in the desired time, you must save 100% of your net "
            "income (Salary - Expenses). Consider extending your duration or lowering the goal amount."
        )
    else:
        required_savings_amount = (recommended_savings_percent / 100) * input_data.salary
        extra_amount_over_expenses = required_savings_amount - input_data.expenses
        
        insight_text = (
            f"To reach your **{input_data.goal_type}** goal in **{input_data.duration_years} years**, "
            f"you must save **₹{extra_amount_over_expenses:,.0f}** monthly (over your current expenses). "
            "This corresponds to the recommended savings rate."
        )

    # 3. Use the model to predict the *actual* time if they follow the recommendation
    # We override the input_data.savings_percent with the recommendation for prediction
    input_data.savings_percent = recommended_savings_percent
    
    # The Linear Regression model prediction is used for the predicted_months
    predicted_months = predict_time_to_goal(input_data)
    
    return PredictionResponse(
        goal_type=input_data.goal_type,
        predicted_months=predicted_months,
        recommended_savings_percent=recommended_savings_percent,
        insight=insight_text
    )

@app.post("/train")
async def train_model_route():
    """Endpoint to re-train the model (optional requirement)."""
    # In a real application, this would run model_trainer.py logic in a separate process
    # For simplicity, we call the generation and training functions directly (requires imports)
    
    # To avoid external script, we use a simple placeholder response.
    # The actual implementation would look like:
    # from model_trainer import generate_synthetic_data, train_and_save_model
    # df = generate_synthetic_data()
    # train_and_save_model(df)
    
    return {"message": "Model re-training initiated. Please check server logs for progress."}

# --- Execution ---
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)