import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/AdminLogin.css";

function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

      // Check whether backend returned JSON
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

      // Store admin details
      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("adminUser", JSON.stringify(data.admin));

      // Token used by admin API requests
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

          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

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