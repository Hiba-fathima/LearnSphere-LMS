import { useState } from "react";
import "../css/StudentProfile.css";

function StudentProfile() {
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

  const getUserDetails = () => {
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

    return {
      name: currentUser.name || currentUser.username || "",
      email: currentUser.email || "",
      phone: currentUser.phone || "",
      role: currentUser.role || "Student",
    };
  };

  const [user, setUser] = useState(getUserDetails);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setUser({
      ...user,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = (e) => {
    e.preventDefault();

    const updatedUser = {
      ...JSON.parse(localStorage.getItem("user") || "{}"),
      name: user.name.trim(),
      email: user.email.trim(),
      phone: user.phone.trim(),
    };

    localStorage.setItem("user", JSON.stringify(updatedUser));

    setUser({
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      role: updatedUser.role || "Student",
    });

    setIsEditing(false);
    setMessage("Profile updated successfully!");
  };

  const handleCancel = () => {
    setUser(getUserDetails());
    setIsEditing(false);
    setMessage("");
  };

  return (
    <div className="student-profile-page">

      <header className="profile-topbar">
        <div>
          <span className="profile-eyebrow">STUDENT PORTAL</span>
          <h1>My Profile</h1>
          <p>Manage your personal information and account details.</p>
        </div>

        <div className="profile-user-avatar">
          {(user.name || "S").charAt(0).toUpperCase()}
        </div>
      </header>

      <section className="profile-content">

        <div className="profile-cover">
          <div className="profile-large-avatar">
            {(user.name || "S").charAt(0).toUpperCase()}
          </div>

          <div className="profile-cover-info">
            <h2>{user.name || "Student Name"}</h2>
            <p>{user.email || "student@example.com"}</p>
            <span className="profile-role-badge">
              Student Account
            </span>
          </div>

          {!isEditing && (
            <button
              className="profile-edit-button"
              onClick={() => {
                setMessage("");
                setIsEditing(true);
              }}
            >
              ✎ Edit Profile
            </button>
          )}
        </div>

        <div className="profile-information-card">

          <div className="profile-card-heading">
            <div>
              <h3>Personal Information</h3>
              <p>Keep your account information up to date.</p>
            </div>
          </div>

          {message && (
            <div className="profile-success-message">
              {message}
            </div>
          )}

          <form onSubmit={handleSave}>

            <div className="profile-form-grid">

              <div className="profile-form-group">
                <label htmlFor="profile-name">Full Name</label>
                <input
                  id="profile-name"
                  name="name"
                  value={user.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  disabled={!isEditing}
                  required
                />
              </div>

              <div className="profile-form-group">
                <label htmlFor="profile-email">Email Address</label>
                <input
                  id="profile-email"
                  name="email"
                  type="email"
                  value={user.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  disabled={!isEditing}
                  required
                />
              </div>

              <div className="profile-form-group">
                <label htmlFor="profile-phone">Phone Number</label>
                <input
                  id="profile-phone"
                  name="phone"
                  type="tel"
                  value={user.phone}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
                  disabled={!isEditing}
                />
              </div>

              <div className="profile-form-group">
                <label htmlFor="profile-role">Account Role</label>
                <input
                  id="profile-role"
                  name="role"
                  value={user.role}
                  disabled
                  readOnly
                />
              </div>

            </div>

            {isEditing && (
              <div className="profile-form-actions">

                <button
                  type="button"
                  className="profile-cancel-button"
                  onClick={handleCancel}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="profile-save-button"
                >
                  Save Changes
                </button>

              </div>
            )}

          </form>
        </div>

        <div className="profile-security-note">
          <span>🔒</span>

          <div>
            <strong>Account security</strong>
            <p>
              Keep your account details accurate. Never share your
              password with anyone.
            </p>
          </div>
        </div>

      </section>

      <footer className="profile-footer">
        © {new Date().getFullYear()} LearnSphere. Keep learning, keep growing.
      </footer>

    </div>
  );
}

export default StudentProfile;