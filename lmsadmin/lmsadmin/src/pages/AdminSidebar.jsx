import { NavLink, useNavigate } from "react-router-dom";
import "../css/AdminSidebar.css";
import AdminNotifications from "../pages/AdminNotification";
function AdminSidebar() {
const navigate = useNavigate();

const menuItems = [
{ name: "Dashboard", path: "/admin/dashboard", icon: "▦" },
{ name: "Courses", path: "/admin/courses", icon: "▤" },
{ name: "Categories", path: "/admin/categories", icon: "◈" },
{ name: "Students", path: "/admin/students", icon: "♙" },
{ name: "Instructors", path: "/admin/instructors", icon: "♧" },
{ name: "Enrollments", path: "/admin/enrollments", icon: "▣" },
{ name: "Reports", path: "/admin/reports", icon: "▥" },
{ name: "Settings", path: "/admin/settings", icon: "⚙" },
];

const handleLogout = () => {
localStorage.removeItem("token");
localStorage.removeItem("user");
navigate("/login");
};

return ( <aside className="admin-sidebar">
{/* Brand */} <div className="admin-sidebar-brand"> <div className="admin-brand-icon">L</div>

    <div>
      <h2>LearnSphere</h2>
      <p>ADMIN PANEL</p>
    </div>
  </div>

  {/* Menu */}
  <div className="admin-menu-heading">MAIN MENU</div>

  <nav className="admin-sidebar-menu">
    {menuItems.map((item) => (
      <NavLink
        key={item.path}
        to={item.path}
        className={({ isActive }) =>
          isActive
            ? "admin-menu-item active"
            : "admin-menu-item"
        }
      >
        <span className="admin-menu-icon">{item.icon}</span>
        <span>{item.name}</span>
      </NavLink>
    ))}
  </nav>

  {/* Bottom section */}
  <div className="admin-sidebar-bottom">
    <div className="admin-help-card">
      <div className="admin-help-icon">?</div>

      <h4>Need Help?</h4>

      <p>
        Contact support if you need assistance with the admin panel.
      </p>

      <button
        type="button"
        className="admin-help-button"
        onClick={() => alert("Support page will be added later.")}
      >
        Get Support
      </button>
    </div>

    <button
      type="button"
      className="admin-logout-button"
      onClick={handleLogout}
    >
      <span className="admin-menu-icon">↪</span>
      <span>Logout</span>
    </button>

    <div className="admin-sidebar-footer">
      LearnSphere © 2026
    </div>
  </div>
</aside>

);
}

export default AdminSidebar;
