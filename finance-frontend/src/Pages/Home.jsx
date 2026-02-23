import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="home">
      <h2>Welcome to Finance Planner</h2>
      <p>
        Plan your savings and investments to achieve your goals — whether it’s
        buying a car, a house, or funding education.
      </p>
      <Link to="/planner" className="btn-primary">
        Get Started
      </Link>
    </div>
  );
}
