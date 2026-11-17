import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import "../css/MyLearning.css";

function MyLearning() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    const fetchMyLearning = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await API.get("/student/my-learning", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setCourses(response.data);
      } catch (err) {
        console.error(err);
        setError(
          err.response?.data?.message || "Unable to load your courses"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMyLearning();
  }, []);

  return (
    <div className="learning-page">

      {/* HEADER */}
      <header className="learning-topbar">
        <div>
          <span className="learning-topbar-label">
            STUDENT PORTAL
          </span>
          <h2>My Learning</h2>
        </div>

        <div className="learning-user-info">
          <div className="learning-avatar">
            {(user.name || user.username || "S")
              .charAt(0)
              .toUpperCase()}
          </div>

          <div>
            <strong>{user.name || user.username || "Student"}</strong>
            <p>Student</p>
          </div>
        </div>
      </header>

      {/* WELCOME BANNER */}
      <section className="learning-banner">
        <div>
          <span>YOUR LEARNING JOURNEY</span>
          <h1>Keep Growing, Keep Learning!</h1>
          <p>
            Continue your courses and build new skills
            with LearnSphere.
          </p>
        </div>

        <div className="learning-banner-icon">🎓</div>
      </section>

      {/* COURSE SECTION */}
      <section className="learning-course-section">

        <div className="learning-section-heading">
          <div>
            <span>YOUR COURSES</span>
            <h2>Enrolled Courses</h2>
            <p>All the courses you have enrolled in.</p>
          </div>

          <div className="learning-count">
            {courses.length} Courses
          </div>
        </div>

        {loading ? (
          <div className="learning-message">
            Loading your courses...
          </div>
        ) : error ? (
          <div className="learning-message learning-error">
            {error}
          </div>
        ) : courses.length === 0 ? (
          <div className="learning-empty">
            <div>📚</div>
            <h3>No enrolled courses yet</h3>
            <p>
              Explore available courses and enroll to
              start your learning journey.
            </p>

            <button
              onClick={() => navigate("/student/dashboard")}
            >
              Explore Courses →
            </button>
          </div>
        ) : (
          <div className="learning-course-grid">

            {courses.map((course) => (
              <article
                className="learning-course-card"
                key={course._id}
              >
                <div className="learning-course-cover">
                  <span className="learning-course-category">
                    {course.category || "Course"}
                  </span>

                  <div className="learning-course-icon">
                    📘
                  </div>

                  <span className="learning-paid-badge">
                    {course.paymentStatus || "Enrolled"}
                  </span>
                </div>

                <div className="learning-course-body">

                  <h3>{course.title}</h3>

                  <p className="learning-instructor">
                    👨‍🏫 {course.instructor || "Instructor"}
                  </p>

                  <div className="learning-course-meta">
                    <span>◷ {course.duration || "Flexible"}</span>
                  </div>

                  <div className="learning-card-footer">
                    <div>
                      <small>Course price</small>
                      <strong>
                        ₹{Number(course.price || 0).toLocaleString("en-IN")}
                      </strong>
                    </div>

                    <button
                      onClick={() =>
                        navigate(`/student/my-learning/${course._id}`)
                      }
                    >
                      View Course →
                    </button>
                  </div>

                </div>
              </article>
            ))}

          </div>
        )}

      </section>

      <footer className="learning-footer">
        © {new Date().getFullYear()} LearnSphere. Keep learning, keep growing.
      </footer>

    </div>
  );
}

export default MyLearning;