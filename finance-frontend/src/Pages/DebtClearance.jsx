import { useState } from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend, ResponsiveContainer,
    Tooltip,
    XAxis, YAxis
} from "recharts";

export default function DebtClearance() {
  const [loans, setLoans] = useState([]);
  const [income, setIncome] = useState("");
  const [expenses, setExpenses] = useState("");
  const [showSummary, setShowSummary] = useState(false);

  const addLoan = () => {
    setLoans([...loans, { name: "", principal: "", interest: "", loanDuration: "", loanUnit: "years" }]);
  };

  const updateLoan = (index, field, value) => {
    const updated = [...loans];
    updated[index][field] = value;
    setLoans(updated);
  };

  const removeLoan = (index) => {
    setLoans(loans.filter((_, i) => i !== index));
  };

  const calculateEMI = (principal, interest, months) => {
    const r = interest / 100 / 12;
    if (r === 0) return principal / months;
    return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
  };

  // Loan summaries only generated when "Generate Summary" clicked
  let loanSummaries = [];
  let totalEMI = 0;
  let chartData = [];

  if (showSummary && loans.length > 0) {
    loanSummaries = loans.map((loan) => {
      const months = loan.loanUnit === "years" ? loan.loanDuration * 12 : loan.loanDuration;
      const principal = Number(loan.principal);
      const emi = calculateEMI(principal, loan.interest, months);
      totalEMI += emi;

      for (let m = 1; m <= months; m++) {
        if (!chartData[m - 1]) chartData[m - 1] = { month: `M${m}` };
        chartData[m - 1][loan.name || `Loan ${loanSummaries.length + 1}`] = Math.round(emi);
      }

      return { ...loan, emi: emi.toFixed(0), months };
    });

    // Save to localStorage so Dashboard can use it
    localStorage.setItem("debtData", JSON.stringify({
      income, expenses, loans: loanSummaries, totalEMI
    }));
  }

  const disposableIncome = income - expenses;
  const advice =
    disposableIncome < totalEMI
      ? { msg: "⚠️ Loan EMIs exceed disposable income. Debt trap risk! Consider restructuring or cutting expenses.", type: "danger" }
      : disposableIncome * 0.5 < totalEMI
      ? { msg: "⚠️ High EMI load. Try pre-payments or refinance at lower interest.", type: "warn" }
      : { msg: "✅ Loan burden manageable. Still, prepay if possible to save on interest.", type: "success" };

  return (
    <div className="debt-container">
      <h2 className="page-title">💳 Debt Trap Clearance</h2>

      {/* Income/Expense */}
      <div className="form-card">
        <div className="input-group">
          <label>💵 Monthly Income</label>
          <input type="number" value={income} onChange={(e) => setIncome(Number(e.target.value))} />
        </div>
        <div className="input-group">
          <label>💸 Monthly Expenses</label>
          <input type="number" value={expenses} onChange={(e) => setExpenses(Number(e.target.value))} />
        </div>
      </div>

      {/* Loan Inputs */}
      <h3 className="section-title">🏦 Your Loans</h3>
      {loans.map((loan, i) => (
        <div key={i} className="loan-card">
          <input type="text" placeholder="Loan Name" value={loan.name} onChange={(e) => updateLoan(i, "name", e.target.value)} />
          <input type="number" placeholder="Principal Amount" value={loan.principal} onChange={(e) => updateLoan(i, "principal", e.target.value)} />
          <input type="number" placeholder="Interest %" value={loan.interest} onChange={(e) => updateLoan(i, "interest", e.target.value)} />
          <div className="loan-duration">
            <input type="number" placeholder="Duration" value={loan.loanDuration} onChange={(e) => updateLoan(i, "loanDuration", e.target.value)} />
            <select value={loan.loanUnit} onChange={(e) => updateLoan(i, "loanUnit", e.target.value)}>
              <option value="years">Years</option>
              <option value="months">Months</option>
            </select>
          </div>
          <button type="button" className="btn-remove" onClick={() => removeLoan(i)}>❌ Remove</button>
        </div>
      ))}

      <button type="button" className="btn-secondary" onClick={addLoan}>➕ Add Loan</button>

      {/* Generate Summary Button */}
      {loans.length > 0 && (
        <button type="button" className="btn-primary" style={{ marginTop: "1rem" }} onClick={() => setShowSummary(true)}>
          📊 Generate Loan Summary
        </button>
      )}

      {/* Loan Insights */}
      {showSummary && loanSummaries.length > 0 && (
        <div className="summary-card">
          <h3>📑 Loan Summary</h3>
          <p><strong>Total EMI:</strong> ₹{totalEMI.toFixed(0)}/month</p>
          <p><strong>Disposable Income:</strong> ₹{disposableIncome.toFixed(0)}/month</p>
          <p className={`advice ${advice.type}`}>{advice.msg}</p>
          <ul>
            {loanSummaries.map((loan, i) => (
              <li key={i}>
                {loan.name || `Loan ${i + 1}`} → EMI: ₹{loan.emi}/month for {loan.months} months
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* EMI Breakdown Chart */}
      {showSummary && chartData.length > 0 && (
        <div className="chart-section">
          <h3>📊 Loan EMI Breakdown</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              {loans.map((loan, i) => (
                <Bar key={i} dataKey={loan.name || `Loan ${i+1}`} stackId="a" fill={`hsl(${i * 60},70%,50%)`} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
