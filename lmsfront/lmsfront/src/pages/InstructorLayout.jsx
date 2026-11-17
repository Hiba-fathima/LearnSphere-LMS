import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import "../css/InstructorDashboard.css";

function InstructorLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="student-layout">

      {/* Shared Instructor Sidebar */}
      <aside className="student-sidebar">

        <Link to="/" className="student-brand">
          Learn<span>Sphere</span>
        </Link>

        <div className="student-sidebar-label">
          INSTRUCTOR MENU
        </div>

        <nav className="student-navigation">

          <NavLink
            to="/instructor/dashboard"
            end
            className={({ isActive }) =>
              `student-nav-link ${isActive ? "active" : ""}`
            }
          >
            <span>▦</span>
            Dashboard
          </NavLink>

          <NavLink
            to="/instructor/courses"
            className={({ isActive }) =>
              `student-nav-link ${isActive ? "active" : ""}`
            }
          >
            <span>📚</span>
            My Courses
          </NavLink>

          <NavLink
            to="/instructor/students"
            className={({ isActive }) =>
              `student-nav-link ${isActive ? "active" : ""}`
            }
          >
            <span>👨‍🎓</span>
            Students
          </NavLink>

          <NavLink
            to="/instructor/assignments"
            className={({ isActive }) =>
              `student-nav-link ${isActive ? "active" : ""}`
            }
          >
            <span>📝</span>
            Assignments
          </NavLink>

          <NavLink
            to="/instructor/quizzes"
            className={({ isActive }) =>
              `student-nav-link ${isActive ? "active" : ""}`
            }
          >
            <span>📋</span>
            Quizzes
          </NavLink>

          <NavLink
            to="/instructor/profile"
            className={({ isActive }) =>
              `student-nav-link ${isActive ? "active" : ""}`
            }
          >
            <span>👤</span>
            My Profile
          </NavLink>

        </nav>

        <div className="student-sidebar-bottom">

          <div className="student-help-box">
            <div className="student-help-icon">?</div>

            <h4>Need help?</h4>

            <p>
              Inspire students and share your knowledge.
            </p>
          </div>

          <button
            type="button"
            className="student-logout-button"
            onClick={handleLogout}
          >
            <span>↪</span>
            Logout
          </button>

        </div>

      </aside>

      {/* Instructor Pages Display Here */}
      <main className="student-main">
        <Outlet />
      </main>

    </div>
  );
}

export default InstructorLayout;