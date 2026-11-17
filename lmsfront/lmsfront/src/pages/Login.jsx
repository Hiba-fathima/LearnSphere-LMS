import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api";
import "../css/Login.css";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      const response = await API.post("/auth/login", formData);

      const { token, user } = response.data;

      if (!token || !user) {
        setMessage("Invalid login response.");
        return;
      }

      // Save authentication details
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      setMessage("Login successful!");

      // Redirect based on user role
      setTimeout(() => {
        const role = user.role?.toLowerCase();

        if (role === "admin") {
          navigate("/admin/dashboard");
        } else if (role === "instructor") {
          navigate("/instructor/dashboard");
        } else {
          navigate("/student/dashboard");
        }
      }, 700);

    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        "Login failed. Please check your email and password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      <div className="login-card">

        <Link to="/" className="login-brand">
          Learn<span>Sphere</span>
        </Link>

        <div className="login-heading">
          <div className="login-icon">↗</div>

          <h2>Welcome back!</h2>

          <p>
            Log in to continue your learning journey.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">

          <div className="login-field">
            <label htmlFor="email">Email Address</label>

            <input
              type="email"
              id="email"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />
          </div>

          <div className="login-field">
            <label htmlFor="password">Password</label>

            <input
              type="password"
              id="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            className="login-submit-btn"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login to Account"}
            {!loading && <span>→</span>}
          </button>

        </form>

        {message && (
          <p className="login-message">{message}</p>
        )}

        <div className="login-signup-link">
          Don't have an account?{" "}
          <Link to="/signup">Sign Up</Link>
        </div>

        <p className="login-terms">
          Learn something new every day with LearnSphere.
        </p>

      </div>
    </div>
  );
}

export default Login;