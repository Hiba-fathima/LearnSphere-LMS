import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

import "../css/StudentDashboard.css";
import "../css/InstructorDashboard.css";
import StudentNotifications from "../pages/StudentNotifications";

function InstructorDashboard() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [courses, setCourses] = useState([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch Instructor Courses and Students
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [courseResponse, studentResponse] = await Promise.all([
          API.get("/instructor/courses"),
          API.get("/instructor/students"),
        ]);

        // Courses
        const courseList = Array.isArray(courseResponse.data)
          ? courseResponse.data
          : courseResponse.data.courses || [];

        setCourses(courseList);

        // Students
        const studentList = Array.isArray(studentResponse.data)
          ? studentResponse.data
          : studentResponse.data.students || [];

        // Count unique paid students
        const paidEnrollments = studentList.filter(
          (enrollment) => enrollment.paymentStatus === "Paid"
        );

        const uniqueStudents = new Set(
          paidEnrollments
            .map((enrollment) => {
              const student = enrollment.student;

              return typeof student === "object"
                ? student?._id
                : student;
            })
            .filter(Boolean)
            .map(String)
        );

        setTotalStudents(uniqueStudents.size);

      } catch (error) {
        console.error("Failed to load instructor dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const publishedCourses = courses.filter(
    (course) => course.status === "Published"
  );

  return (
    <div className="instructor-dashboard-page">

      {/* Topbar */}
      <header className="student-topbar">

        <div>
          <span className="student-topbar-label">
            INSTRUCTOR PORTAL
          </span>

          <h2>Instructor Dashboard</h2>
        </div>

        {/* Notification + Instructor Profile */}
        <div className="student-topbar-actions">

          <StudentNotifications />

          <div className="student-user-info">

            <div className="student-user-avatar">
              {(user.name || user.username || "I")
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <strong>
                {user.name || user.username || "Instructor"}
              </strong>

              <p>Instructor</p>
            </div>

          </div>

        </div>

      </header>

      {/* Welcome Banner */}
      <section className="student-welcome-banner">

        <div>

          <span className="student-welcome-tag">
            INSTRUCTOR WORKSPACE
          </span>

          <h1>
            Welcome back,{" "}
            {user.name || user.username || "Instructor"}!
          </h1>

          <p>
            Manage your courses, share your knowledge,
            and help students achieve their learning goals.
          </p>

          <button
            type="button"
            className="student-explore-button"
            onClick={() => navigate("/instructor/courses")}
          >
            Manage Courses <span>→</span>
          </button>

        </div>

        <div className="student-welcome-illustration">

          <div className="student-book-icon">📚</div>

          <div className="student-cap-icon">🎓</div>

        </div>

      </section>

      {/* Statistics */}
      <section className="student-stats-grid">

        <div className="student-stat-card">

          <div className="student-stat-icon courses-stat-icon">
            📚
          </div>

          <div>
            <p>Total Courses</p>
            <h3>{loading ? "..." : courses.length}</h3>
          </div>

        </div>

        <div className="student-stat-card">

          <div className="student-stat-icon categories-stat-icon">
            ✓
          </div>

          <div>
            <p>Published Courses</p>
            <h3>{loading ? "..." : publishedCourses.length}</h3>
          </div>

        </div>

        <div className="student-stat-card">

          <div className="student-stat-icon learning-stat-icon">
            👨‍🎓
          </div>

          <div>
            <p>Total Students</p>
            <h3>{loading ? "..." : totalStudents}</h3>
          </div>

        </div>

      </section>

      {/* My Courses */}
      <section className="student-courses-section">

        <div className="student-section-heading">

          <div>

            <span className="student-section-eyebrow">
              COURSE MANAGEMENT
            </span>

            <h2>My Courses</h2>

            <p>
              View and manage the courses you have created.
            </p>

          </div>

          <button
            type="button"
            className="student-view-course-button"
            onClick={() => navigate("/instructor/courses")}
          >
            View All →
          </button>

        </div>

        {loading ? (

          <div className="student-message-box">
            Loading courses...
          </div>

        ) : courses.length === 0 ? (

          <div className="student-empty-state">

            <div>📚</div>

            <h3>No Courses Yet</h3>

            <p>
              Your courses will appear here once they are
              assigned or created.
            </p>

            <button
              type="button"
              className="student-view-course-button"
              onClick={() => navigate("/instructor/courses")}
            >
              Manage Courses →
            </button>

          </div>

        ) : (

          <div className="student-course-grid">

            {courses.slice(0, 3).map((course) => (

              <article
                className="student-course-card"
                key={course._id}
              >

                <div className="student-course-cover">

                  <span className="student-course-category">
                    {course.category}
                  </span>

                  <div className="student-course-cover-icon">
                    📘
                  </div>

                  <span className="student-published-badge">
                    {course.status}
                  </span>

                </div>

                <div className="student-course-card-body">

                  <h3>{course.title}</h3>

                  <p className="student-course-instructor">
                    <span>◷</span>
                    {course.duration}
                  </p>

                  <div className="student-course-card-footer">

                    <div>
                      <small>Course price</small>

                      <strong>
                        ₹{Number(course.price).toLocaleString("en-IN")}
                      </strong>
                    </div>

                    <button
                      type="button"
                      className="student-view-course-button"
                      onClick={() =>
                        navigate("/instructor/courses")
                      }
                    >
                      Manage →
                    </button>

                  </div>

                </div>

              </article>

            ))}

          </div>

        )}

      </section>

      {/* Footer */}
      <footer className="student-footer">
        © {new Date().getFullYear()} LearnSphere.
        Inspire. Teach. Transform.
      </footer>

    </div>
  );
}

export default InstructorDashboard;