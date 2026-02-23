import { useEffect, useState } from "react";
import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis, YAxis
} from "recharts";

export default function Dashboard() {
  const [planData, setPlanData] = useState(null);
  const [debtData, setDebtData] = useState(null);
  const [aiPrediction, setAiPrediction] = useState(null);

  useEffect(() => {
    const savedPlan = localStorage.getItem("planData");
    if (savedPlan) setPlanData(JSON.parse(savedPlan));

    const savedDebt = localStorage.getItem("debtData");
    if (savedDebt) setDebtData(JSON.parse(savedDebt));

    const savedAi = localStorage.getItem("aiPrediction");
    if (savedAi) setAiPrediction(JSON.parse(savedAi));
  }, []);

  if (!planData && !debtData) {
    return <p>No data available. Please go to Planner or Debt Clearance first.</p>;
  }

  // Extract goal plan
  const { salary, expenses, goal, goalAmount, duration, unit, frequency } = planData || {};

  // Extract loan data
  const loans = debtData?.loans || [];
  const totalLoanEMI = debtData?.totalEMI || 0;
  const disposableIncome = debtData?.income - debtData?.expenses || 0;

  // Normalize timeframe
  const totalMonths = unit === "years" ? duration * 12 : duration;

  // Income & Expenses
  let monthlyIncome = planData
    ? frequency === "monthly"
      ? salary
      : salary / 12
    : debtData?.income || 0;

  let monthlyExpenses = planData
    ? frequency === "monthly"
      ? expenses
      : expenses / 12
    : debtData?.expenses || 0;

  let currentMonthlyCapacity = monthlyIncome - monthlyExpenses - totalLoanEMI;

  // Goal savings
  const requiredMonthlySavings = planData ? goalAmount / totalMonths : 0;
  const extraNeeded = requiredMonthlySavings - currentMonthlyCapacity;

  // Recommendations
  let recommendations = [];
  if (extraNeeded > 0 && requiredMonthlySavings > 0) {
    const newMonths = Math.ceil(goalAmount / currentMonthlyCapacity);
    const newYears = (newMonths / 12).toFixed(1);
    recommendations.push(
      `👉 Extend saving duration to about ${newYears} years.`,
      `👉 Or reduce expenses/loan burden to free up more savings.`
    );
  }

  // Chart Data
  let chartData = [];
  if (planData) {
    chartData = Array.from({ length: totalMonths }, (_, i) => ({
      month: `M${i + 1}`,
      required: requiredMonthlySavings * (i + 1),
      possible: currentMonthlyCapacity > 0 ? currentMonthlyCapacity * (i + 1) : 0,
    }));
  }

  return (
    <div className="dashboard">
      <h2>📊 Dashboard</h2>

      {/* Goal Summary */}
      {planData && (
        <div className="summary-card">
          <h3>🎯 Goal Summary</h3>
          <p><strong>Goal:</strong> {goal} (₹{goalAmount?.toLocaleString()})</p>
          <p><strong>Timeframe:</strong> {duration} {unit}</p>
          <p><strong>Required Monthly Savings:</strong> ₹{requiredMonthlySavings.toLocaleString()}</p>
          <p><strong>Your Current Capacity (after loans):</strong> ₹{currentMonthlyCapacity.toLocaleString()}</p>

          {extraNeeded > 0 ? (
            <div className="advice danger">
              ⚠️ You cannot reach this goal with current savings.
              <ul>
                {recommendations.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          ) : (
            <div className="advice success">✅ You can reach this goal if you save consistently!</div>
          )}
        </div>
      )}

      {/* AI Insights Card */}
      {aiPrediction && (
        <div className="summary-card" style={{ background: "linear-gradient(135deg, #f0fafa, #e0f2fe)", border: "1px solid #bae6fd" }}>
          <h3>🤖 AI Advice</h3>
          <p><strong>AI Predicted Time:</strong> {aiPrediction.predicted_months} months</p>
          <p><strong>Recommended Savings Rate:</strong> {aiPrediction.recommended_savings_percent}%</p>
          <p style={{ marginTop: "10px", lineHeight: "1.5" }} dangerouslySetInnerHTML={{ __html: aiPrediction.insight.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
        </div>
      )}

      {/* Loan Summary */}
      {debtData && loans.length > 0 && (
        <div className="summary-card">
          <h3>🏦 Loan Summary</h3>
          <p><strong>Total EMI:</strong> ₹{totalLoanEMI.toFixed(0)}/month</p>
          <p><strong>Disposable Income:</strong> ₹{disposableIncome.toFixed(0)}/month</p>
          <ul>
            {loans.map((loan, i) => (
              <li key={i}>
                {loan.name || `Loan ${i+1}`} → EMI: ₹{loan.emi}/month for {loan.months} months
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Savings Chart */}
      {planData && chartData.length > 0 && (
        <div className="chart-section">
          <h3>📈 Savings vs Capacity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="required" stroke="#e63946" strokeWidth={3} dot={false} name="Required" />
              <Line type="monotone" dataKey="possible" stroke="#2a9d8f" strokeWidth={3} dot={false} name="Possible" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
