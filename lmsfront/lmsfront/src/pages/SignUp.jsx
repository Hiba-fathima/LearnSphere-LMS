import { useState } from "react";
import { Link } from "react-router-dom";
import API from "../api";
import "../css/SignUp.css";

function Signup() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "student"
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
      const response = await API.post("/auth/signup", formData);

      if (formData.role === "instructor") {
        setMessage(
          "Your instructor application has been submitted. Please wait for admin approval before logging in."
        );
      } else {
        setMessage(response.data.message || "Signup successful!");
      }

      setFormData({
        name: "",
        email: "",
        password: "",
        role: "student"
      });

    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        "Signup failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-card">

        <Link to="/" className="signup-brand">
          Learn<span>Sphere</span>
        </Link>

        <div className="signup-heading">
          <div className="signup-icon">✦</div>
          <h2>Create your account</h2>
          <p>Start your learning journey with us today.</p>
        </div>

        <form onSubmit={handleSubmit} className="signup-form">

          <div className="signup-field">
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="signup-field">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="signup-field">
            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="Create a password"
              value={formData.password}
              onChange={handleChange}
              minLength="6"
              required
            />
            <small>Use at least 6 characters.</small>
          </div>

          <div className="signup-field">
            <label>Register As</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="student">Student</option>
              <option value="instructor">Instructor</option>
            </select>

            {formData.role === "instructor" && (
              <small>
                Instructor accounts require admin approval before login.
              </small>
            )}
          </div>

          <button
            type="submit"
            className="signup-submit-btn"
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Create Account"}
            {!loading && <span>→</span>}
          </button>

        </form>

        {message && (
          <p className="signup-message">{message}</p>
        )}

        <div className="signup-bottom">
          Already have an account?{" "}
          <Link to="/login">Login</Link>
        </div>

        <p className="signup-terms">
          By signing up, you agree to our Terms of Service and Privacy Policy.
        </p>

      </div>
    </div>
  );
}

export default Signup;