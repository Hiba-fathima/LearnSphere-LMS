import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import "../css/StudentDashboard.css";

function StudentLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="student-layout">

      {/* Shared Student Sidebar */}
      <aside className="student-sidebar">

        <Link to="/" className="student-brand">
          Learn<span>Sphere</span>
        </Link>

        <div className="student-sidebar-label">
          LEARNING MENU
        </div>

        <nav className="student-navigation">

          <NavLink
            to="/student/dashboard"
            end
            className={({ isActive }) =>
              `student-nav-link ${isActive ? "active" : ""}`
            }
          >
            <span>▦</span>
            Dashboard
          </NavLink>

         <a
  href="/student/dashboard#courses"
  className="student-nav-link"
>
  <span>▤</span>
  Browse Courses
</a>

          <NavLink
            to="/student/my-learning"
            end
            className={({ isActive }) =>
              `student-nav-link ${isActive ? "active" : ""}`
            }
          >
            <span>🎓</span>
            My Learning
          </NavLink>

          <NavLink
            to="/student/favorites"
            className={({ isActive }) =>
              `student-nav-link ${isActive ? "active" : ""}`
            }
          >
            <span className="favorite-sidebar-icon">♥</span>
            My Favorites
          </NavLink>

          <NavLink
            to="/student/assignments"
            className={({ isActive }) =>
              `student-nav-link ${isActive ? "active" : ""}`
            }
          >
            <span>📝</span>
            My Assignments
          </NavLink>

          <NavLink
            to="/student/quizzes"
            className={({ isActive }) =>
              `student-nav-link ${isActive ? "active" : ""}`
            }
          >
            <span>📋</span>
            My Quizzes
          </NavLink>

          <NavLink
            to="/student/profile"
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
              Keep learning and reach your goals.
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

      {/* Student Pages Display Here */}
      <main className="student-main">
        <Outlet />
      </main>

    </div>
  );
}

export default StudentLayout;