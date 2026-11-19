import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/AdminLogin.css";

function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "https://learnsphere-lms-vkzs.onrender.com/api/admin/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const contentType = response.headers.get("content-type");

      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(
          "Backend returned HTML instead of JSON. Check server route registration."
        );
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("adminUser", JSON.stringify(data.admin));
      localStorage.setItem("token", data.token);

      navigate("/admin/dashboard");

    } catch (err) {
      console.error("Admin login error:", err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-box">

        <div className="admin-login-logo">L</div>

        <p className="admin-login-eyebrow">LEARNSPHERE</p>

        <h1>Admin Login</h1>

        <p className="admin-login-description">
          Sign in to manage your learning platform.
        </p>

        {error && (
          <div className="admin-login-error">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>

          <label>Email Address</label>

          <input
            type="email"
            placeholder="Enter admin email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Password</label>

          <div className="password-input-wrapper">

            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                // Eye-off icon
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10.58 10.58a2 2 0 0 0 2.83 2.83" />
                  <path d="M16.68 16.68A10.94 10.94 0 0 1 12 17.5C7 17.5 3 12 3 12a17.3 17.3 0 0 1 4.2-4.7" />
                  <path d="M9.9 5.2A10.9 10.9 0 0 1 12 5c5 0 9 7 9 7a17.8 17.8 0 0 1-2.1 2.8" />
                  <line x1="2" y1="2" x2="22" y2="22" />
                </svg>
              ) : (
                // Eye icon
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>

          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Login to Dashboard"}
          </button>

        </form>

        <p className="admin-login-footer">
          Secure administrator access
        </p>

      </div>
    </div>
  );
}

export default AdminLogin;