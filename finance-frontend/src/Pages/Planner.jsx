import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { predictGoal } from "../services/api";

export default function Planner() {
  const [salary, setSalary] = useState("");
  const [expenses, setExpenses] = useState("");
  const [goal, setGoal] = useState("Car");
  const [goalAmount, setGoalAmount] = useState("");
  const [duration, setDuration] = useState("");
  const [unit, setUnit] = useState("years");
  const [frequency, setFrequency] = useState("monthly");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    // Normalize to monthly values for the API
    const monthlySalary = frequency === "monthly" ? Number(salary) : Number(salary) / 12;
    const monthlyExpenses = frequency === "monthly" ? Number(expenses) : Number(expenses) / 12;
    
    // Normalize to years for the API
    const durationYears = unit === "years" ? Number(duration) : Math.max(1, Math.ceil(Number(duration) / 12));

    const planData = {
      salary: Number(salary),
      expenses: Number(expenses),
      goal,
      goalAmount: Number(goalAmount),
      duration: Number(duration),
      unit,
      frequency,
    };

    try {
      // Call the AI Backend
      const predictionResponse = await predictGoal({
        salary: monthlySalary,
        expenses: monthlyExpenses,
        goal_amount: Number(goalAmount),
        goal_type: goal,
        duration_years: durationYears,
      });

      // Save plan and AI prediction to local storage
      localStorage.setItem("planData", JSON.stringify(planData));
      localStorage.setItem("aiPrediction", JSON.stringify(predictionResponse));
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Failed to get prediction from AI. Is the backend running?");
      // Still save planData so the dashboard works even if AI fails
      localStorage.setItem("planData", JSON.stringify(planData));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="planner">
      <h2>📌 Plan Your Goal</h2>
      {error && <div className="advice danger">{error}</div>}
      <form onSubmit={handleSubmit} className="form-card">
        {/* Salary */}
        <label>💵 Income ({frequency === "monthly" ? "per month" : "per year"})</label>
        <input type="number" value={salary} onChange={(e)=>setSalary(e.target.value)} required />

        {/* Expenses */}
        <label>💸 Expenses ({frequency === "monthly" ? "per month" : "per year"})</label>
        <input type="number" value={expenses} onChange={(e)=>setExpenses(e.target.value)} required />

        {/* Goal */}
        <label>🎯 Goal</label>
        <select value={goal} onChange={(e)=>setGoal(e.target.value)}>
          <option>Car</option><option>House</option><option>Education</option><option>Travel</option>
        </select>

        {/* Goal Amount */}
        <label>💰 Goal Amount</label>
        <input type="number" value={goalAmount} onChange={(e)=>setGoalAmount(e.target.value)} required />

        {/* Timeframe */}
        <label>📅 Timeframe</label>
        <div style={{ display:"flex", gap:"10px" }}>
          <input type="number" value={duration} onChange={(e)=>setDuration(e.target.value)} required />
          <select value={unit} onChange={(e)=>setUnit(e.target.value)}>
            <option value="years">Years</option>
            <option value="months">Months</option>
          </select>
        </div>

        {/* Frequency */}
        <label>⏳ Frequency</label>
        <select value={frequency} onChange={(e)=>setFrequency(e.target.value)}>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>

        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? "Consulting AI..." : "Calculate Plan"}
        </button>
      </form>
    </div>
  );
}
