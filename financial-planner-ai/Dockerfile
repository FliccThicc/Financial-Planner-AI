FROM python:3.10-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code and pre-trained model
COPY . .

# Generate the model if it doesn't exist
RUN python model_trainer.py

EXPOSE 8000

# Start FastAPI application
CMD ["uvicorn", "financial_planner_api:app", "--host", "0.0.0.0", "--port", "8000"]
