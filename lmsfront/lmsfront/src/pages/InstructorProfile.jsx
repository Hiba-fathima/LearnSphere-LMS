import { useState } from "react";

import "../css/StudentDashboard.css";
import "../css/InstructorDashboard.css";
import "../css/InstructorProfile.css";

function InstructorProfile() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [profile] = useState({
    name: user.name || user.username || "",
    email: user.email || "",
    phone: user.phone || "",
    role: user.role || "instructor",
    verificationStatus: user.verificationStatus || "approved",
  });

  return (
    <div className="instructor-profile-page">

      {/* Topbar */}
      <header className="student-topbar">

        <div>
          <span className="student-topbar-label">
            INSTRUCTOR PORTAL
          </span>

          <h2>My Profile</h2>
        </div>

        <div className="student-user-info">

          <div className="student-user-avatar">
            {(profile.name || "I").charAt(0).toUpperCase()}
          </div>

          <div>
            <strong>{profile.name || "Instructor"}</strong>
            <p>Instructor</p>
          </div>

        </div>

      </header>

      {/* Heading */}
      <section className="instructor-profile-heading">

        <span className="student-section-eyebrow">
          ACCOUNT SETTINGS
        </span>

        <h1>My Profile</h1>

        <p>
          View your personal information and instructor account details.
        </p>

      </section>

      {/* Profile Card */}
      <section className="instructor-profile-card">

        <div className="instructor-profile-banner">

          <div className="instructor-profile-avatar">
            {(profile.name || "I").charAt(0).toUpperCase()}
          </div>

          <div className="instructor-profile-user">

            <h2>{profile.name || "Instructor"}</h2>

            <p>{profile.email || "Email not available"}</p>

            <span className="instructor-profile-badge">
              {profile.verificationStatus}
            </span>

          </div>

        </div>

        <div className="instructor-profile-details">

          <h3>Personal Information</h3>

          <div className="instructor-profile-grid">

            <div className="instructor-profile-item">
              <span>Full Name</span>
              <strong>{profile.name || "Not available"}</strong>
            </div>

            <div className="instructor-profile-item">
              <span>Email Address</span>
              <strong>{profile.email || "Not available"}</strong>
            </div>

            <div className="instructor-profile-item">
              <span>Phone Number</span>
              <strong>{profile.phone || "Not added"}</strong>
            </div>

            <div className="instructor-profile-item">
              <span>Account Role</span>
              <strong>Instructor</strong>
            </div>

            <div className="instructor-profile-item">
              <span>Verification Status</span>
              <strong className="profile-approved">
                {profile.verificationStatus}
              </strong>
            </div>

          </div>

        </div>

      </section>

      {/* Footer */}
      <footer className="student-footer">
        © {new Date().getFullYear()} LearnSphere.
        Inspire. Teach. Transform.
      </footer>

    </div>
  );
}

export default InstructorProfile;