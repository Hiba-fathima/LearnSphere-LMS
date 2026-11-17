import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";

import AdminSidebar from "./pages/AdminSidebar";
import Courses from "./pages/Courses";
import Enrollments from "./pages/Enrollment";
import AdminLogin from "./pages/AdminLogin";
import Students from "./pages/Students";
import Instructors from "./pages/Instructors";
import AdminNotifications from "./pages/AdminNotification";

import "./App.css";

// Protect admin pages
function ProtectedAdminRoute() {
  const adminToken = localStorage.getItem("adminToken");

  return adminToken ? <Outlet /> : <Navigate to="/admin/login" replace />;
}

// Dashboard Page
function Dashboard() {
  return (
    <div className="admin-page">

      {/* Dashboard Header */}
      <div className="admin-page-header">

        <div>
          <p className="admin-eyebrow">LEARNSPHERE ADMIN</p>
          <h1>Dashboard</h1>
          <p>Welcome to your learning management system.</p>
        </div>

        {/* Right Side Actions */}
        <div className="admin-header-actions">

          {/* Notification Bell */}
          <AdminNotifications />

          {/* Admin Profile */}
          <div className="admin-profile">
            <div className="admin-avatar">A</div>

            <div>
              <h4>Administrator</h4>
              <span>Admin Account</span>
            </div>
          </div>

        </div>

      </div>

      {/* Welcome Banner */}
      <div className="admin-welcome-banner">

        <div>
          <span>WELCOME BACK!</span>

          <h2>Manage your learning platform</h2>

          <p>
            Monitor your courses, students, instructors, and
            enrollments from one place.
          </p>
        </div>

        <div className="admin-banner-icon">🎓</div>

      </div>

      {/* Overview */}
      <h2 className="admin-section-title">Overview</h2>

      <div className="admin-stats-grid">

        <div className="admin-stat-card">
          <div className="admin-stat-icon courses-icon">▤</div>
          <p>Total Courses</p>
          <h2>0</h2>
          <span>Courses available</span>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon students-icon">♙</div>
          <p>Total Students</p>
          <h2>0</h2>
          <span>Registered learners</span>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon instructors-icon">♧</div>
          <p>Total Instructors</p>
          <h2>0</h2>
          <span>Registered instructors</span>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon enrollments-icon">▣</div>
          <p>Total Enrollments</p>
          <h2>0</h2>
          <span>Course enrollments</span>
        </div>

      </div>

      {/* Getting Started */}
      <div className="admin-activity-card">
        <h2>Getting Started</h2>

        <p>
          Your admin dashboard is ready. Once we connect your backend,
          this page can display real statistics from your database.
        </p>
      </div>

    </div>
  );
}

// Layout shared by admin pages
function AdminLayout() {
  return (
    <div className="admin-layout">

      <AdminSidebar />

      <main className="admin-main-content">
        <Outlet />
      </main>

    </div>
  );
}

// Application Routes
function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* Default Page */}
        <Route
          path="/"
          element={<Navigate to="/admin/login" replace />}
        />

        {/* Admin Login */}
        <Route
          path="/admin/login"
          element={<AdminLogin />}
        />

        {/* Protected Admin Pages */}
        <Route element={<ProtectedAdminRoute />}>

          <Route path="/admin" element={<AdminLayout />}>

            <Route
              index
              element={<Navigate to="/admin/dashboard" replace />}
            />

            <Route path="dashboard" element={<Dashboard />} />

            <Route path="courses" element={<Courses />} />

            <Route path="enrollments" element={<Enrollments />} />

            <Route path="students" element={<Students />} />

            <Route path="instructors" element={<Instructors />} />

          </Route>

        </Route>

        {/* Unknown Routes */}
        <Route
          path="*"
          element={<Navigate to="/admin/login" replace />}
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;