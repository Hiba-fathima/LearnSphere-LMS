import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import "../css/StudentDashboard.css";
import StudentNotifications from "../pages/StudentNotifications";
import StudentReminders from "./StudentReminders";

function StudentDashboard() {
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // Favorite storage key for each student
  const favoriteKey = `favorites_${user._id || user.id || user.email}`;

  // Get saved favorites
  const [favorites, setFavorites] = useState(() => {
    return JSON.parse(localStorage.getItem(favoriteKey) || "[]");
  });

  // Fetch Courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await API.get("/courses");

        const courseList = Array.isArray(response.data)
          ? response.data
          : response.data.courses || [];

        setCourses(
          courseList.filter(
            (course) => course.status === "Published"
          )
        );
      } catch (err) {
        console.error("Failed to load courses:", err);
        setError("Unable to load courses. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // Toggle Favorite
  const toggleFavorite = (courseId) => {
    let updatedFavorites;

    if (favorites.includes(courseId)) {
      updatedFavorites = favorites.filter(
        (id) => id !== courseId
      );
    } else {
      updatedFavorites = [...favorites, courseId];
    }

    setFavorites(updatedFavorites);

    localStorage.setItem(
      favoriteKey,
      JSON.stringify(updatedFavorites)
    );
  };

  // Categories
  const categories = [
    "All",
    ...new Set(courses.map((course) => course.category)),
  ];

  // Search and Filter
  const filteredCourses = courses.filter((course) => {
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      (course.title || "").toLowerCase().includes(search) ||
      (course.instructor || "").toLowerCase().includes(search) ||
      (course.category || "").toLowerCase().includes(search);

    const matchesCategory =
      categoryFilter === "All" ||
      course.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  return (
    <>

      {/* Dashboard Header */}

      <header className="student-topbar">

        <div>
          <span className="student-topbar-label">
            STUDENT PORTAL
          </span>

          <h2>My Dashboard</h2>
        </div>

        <div className="student-topbar-actions">

          <StudentNotifications />

          <div className="student-user-info">

            <div className="student-user-avatar">
              {(user.name || user.username || "S")
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <strong>
                {user.name || user.username || "Student"}
              </strong>

              <p>Student</p>
            </div>

          </div>

        </div>

      </header>

      {/* Welcome Banner */}

      <section className="student-welcome-banner">

        <div>

          <span className="student-welcome-tag">
            YOUR LEARNING JOURNEY
          </span>

          <h1>
            Welcome back,{" "}
            {user.name || user.username || "Student"}!
          </h1>

          <p>
            Discover new skills, explore courses, and continue
            building your future.
          </p>

          <a
            href="#courses"
            className="student-explore-button"
          >
            Explore Courses <span>→</span>
          </a>

        </div>

        <div className="student-welcome-illustration">
          <div className="student-book-icon">📚</div>
          <div className="student-cap-icon">🎓</div>
        </div>

      </section>
      <StudentReminders />


      {/* Statistics */}

      <section className="student-stats-grid">

        <div className="student-stat-card">

          <div className="student-stat-icon courses-stat-icon">
            📚
          </div>

          <div>
            <p>Available Courses</p>
            <h3>{courses.length}</h3>
          </div>

        </div>

        <div className="student-stat-card">

          <div className="student-stat-icon categories-stat-icon">
            ▦
          </div>

          <div>
            <p>Course Categories</p>

            <h3>
              {new Set(
                courses.map((course) => course.category)
              ).size}
            </h3>
          </div>

        </div>

        <div className="student-stat-card">

          <div className="student-stat-icon learning-stat-icon">
            🎯
          </div>

          <div>
            <p>My Favorites</p>
            <h3>{favorites.length}</h3>
          </div>

        </div>

      </section>

      {/* Courses Section */}

      <section
        className="student-courses-section"
        id="courses"
      >

        <div className="student-section-heading">

          <div>

            <span className="student-section-eyebrow">
              LEARN SOMETHING NEW
            </span>

            <h2>Explore Courses</h2>

            <p>
              Discover courses published by your LearnSphere
              administrators.
            </p>

          </div>

          <span className="student-course-count">
            {filteredCourses.length} courses
          </span>

        </div>

        {/* Search and Category Filter */}

        <div className="student-course-toolbar">

          <div className="student-search-box">

            <span>⌕</span>

            <input
              type="text"
              placeholder="Search courses, instructors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="student-category-filter"
          >

            {categories.map((category) => (

              <option key={category} value={category}>
                {category === "All"
                  ? "All Categories"
                  : category}
              </option>

            ))}

          </select>

        </div>

        {/* Course Cards */}

        {loading ? (

          <div className="student-message-box">
            Loading courses...
          </div>

        ) : error ? (

          <div className="student-message-box student-error">
            {error}
          </div>

        ) : filteredCourses.length === 0 ? (

          <div className="student-empty-state">

            <div>📚</div>

            <h3>No courses available</h3>

            <p>
              {searchTerm || categoryFilter !== "All"
                ? "Try changing your search or category."
                : "Published courses added by the administrator will appear here."}
            </p>

          </div>

        ) : (

          <div className="student-course-grid">

            {filteredCourses.map((course) => {

              const isFavorite = favorites.includes(course._id);

              return (

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

                    {/* Favorite Heart */}

                    <button
                      type="button"
                      className={`student-favorite-button ${
                        isFavorite ? "favorited" : ""
                      }`}
                      onClick={() => toggleFavorite(course._id)}
                      aria-label={
                        isFavorite
                          ? "Remove from favorites"
                          : "Add to favorites"
                      }
                      aria-pressed={isFavorite}
                    >
                      {isFavorite ? "♥" : "♡"}
                    </button>

                    <span className="student-published-badge">
                      Published
                    </span>

                  </div>

                  <div className="student-course-card-body">

                    <h3>{course.title}</h3>

                    <p className="student-course-instructor">
                      <span>👨‍🏫</span>
                      {course.instructor}
                    </p>

                    <div className="student-course-meta">
                      <span>◷ {course.duration}</span>
                    </div>

                    <div className="student-course-card-footer">

                      <div>
                        <small>Course price</small>

                        <strong>
                          ₹{Number(course.price).toLocaleString("en-IN")}
                        </strong>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/student/course/${course._id}`)
                        }
                        className="student-view-course-button"
                      >
                        View Course →
                      </button>

                    </div>

                  </div>

                </article>

              );

            })}

          </div>

        )}

      </section>

      {/* Footer */}

      <footer className="student-footer">
        © {new Date().getFullYear()} LearnSphere.
        Keep learning, keep growing.
      </footer>

    </>
  );
}

export default StudentDashboard;