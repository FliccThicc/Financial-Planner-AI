# AI Financial Planner

This project is an AI-powered financial planning application. It consists of a React frontend and a FastAPI backend with a trained machine learning model that predicts the time required to hit financial goals.

## Architecture
- **Frontend**: React, Vite, Recharts (`/finance-frontend`)
- **Backend**: FastAPI, Scikit-Learn, Pandas (`/financial-planner-ai`)

## Requirements
- Docker and Docker Compose (Recommended)
- Node.js > 18 (if running locally)
- Python > 3.9 (if running locally)

## Running with Docker (Recommended)

To start both the frontend and backend simultaneously, run:

```bash
docker-compose up --build
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000

## Running Locally (Without Docker)

### Backend Setup
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd financial-planner-ai
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Train the AI model (required before first run):
   ```bash
   python model_trainer.py
   ```
5. Start the backend server:
   ```bash
   python financial_planner_api.py
   # Or using uvicorn: uvicorn financial_planner_api:app --reload --host 0.0.0.0 --port 8000
   ```

### Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd finance-frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
4. Start the frontend developer server:
   ```bash
   npm run dev
   ```

## Usage
1. Go to the web UI.
2. Under "Planner", fill out your salary, expenses, and a financial goal.
3. Submit the form to request an AI prediction.
4. Go to the "Dashboard" to see a chart and the AI's personalized saving recommendation.
"# Financial-Planner-AI" 
