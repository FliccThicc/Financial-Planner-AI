import { useEffect, useState } from "react";
import { Link, Route, Routes, useLocation } from "react-router-dom";
import "./App.css";
import Dashboard from "./Pages/Dashboard.jsx";
import DebtClearance from "./Pages/DebtClearance.jsx";
import Home from "./Pages/Home.jsx";
import Planner from "./Pages/Planner.jsx";

// Page transition wrapper
function PageTransition({ children }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    setShow(false);
    const timeout = setTimeout(() => setShow(true), 10);
    return () => clearTimeout(timeout);
  }, [children]);
  return <div className={`fade-page${show ? " show" : ""}`}>{children}</div>;
}

// Animated routing with transitions
function AnimatedRoutes() {
  const location = useLocation();
  return (
    <PageTransition key={location.pathname}>
      <Routes location={location}>
        <Route path="/" element={<Home />} />
        <Route path="/planner" element={<Planner />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/debt" element={<DebtClearance />} />
      </Routes>
    </PageTransition>
  );
}

export default function App() {
  const location = useLocation();
  return (
    <div className="app-container">
      {/* Navbar */}
      <header className="navbar">
        <h1 className="logo">💰 Finance Planner</h1>
        <nav>
          <Link to="/" className={location.pathname === "/" ? "active" : ""}>
            Home
          </Link>
          <Link to="/planner" className={location.pathname === "/planner" ? "active" : ""}>
            Planner
          </Link>
          <Link to="/dashboard" className={location.pathname === "/dashboard" ? "active" : ""}>
            Dashboard
          </Link>
          <Link to="/debt" className={location.pathname === "/debt" ? "active" : ""}>
            Debt Clearance
          </Link>
        </nav>
      </header>

      {/* Page Content */}
      <main className="content">
        <AnimatedRoutes />
      </main>

      {/* Footer */}
      <footer className="footer">© 2025 Finance Planner | Built with React</footer>
    </div>
  );
}
