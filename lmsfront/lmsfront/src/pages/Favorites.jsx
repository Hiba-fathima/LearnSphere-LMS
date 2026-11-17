import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import "../css/StudentDashboard.css";

function Favorites() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const favoriteKey = `favorites_${user._id || user.id || user.email}`;

  const [favorites, setFavorites] = useState(() => {
    return JSON.parse(localStorage.getItem(favoriteKey) || "[]");
  });

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch Favorite Courses
  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const response = await API.get("/courses");

        const courseList = Array.isArray(response.data)
          ? response.data
          : response.data.courses || [];

        const favoriteCourses = courseList.filter(
          (course) =>
            course.status === "Published" &&
            favorites.includes(course._id)
        );

        setCourses(favoriteCourses);
      } catch (error) {
        console.error("Failed to load favorite courses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, []);

  // Remove Favorite
  const removeFavorite = (courseId) => {
    const updatedFavorites = favorites.filter(
      (id) => id !== courseId
    );

    setFavorites(updatedFavorites);

    localStorage.setItem(
      favoriteKey,
      JSON.stringify(updatedFavorites)
    );

    setCourses((prev) =>
      prev.filter((course) => course._id !== courseId)
    );
  };

  return (
    <div className="favorites-page">

      {/* Header */}
      <header className="student-topbar">

        <div>
          <span className="student-topbar-label">
            STUDENT PORTAL
          </span>

          <h2>My Favorites</h2>
        </div>

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

      </header>

      {/* Favorites Section */}
      <section className="student-courses-section">

        <div className="student-section-heading">

          <div>
            <span className="student-section-eyebrow">
              YOUR SAVED COURSES
            </span>

            <h2>Favorite Courses ♥</h2>

            <p>
              All your favorite courses in one place.
            </p>
          </div>

          <span className="student-course-count">
            {courses.length} courses
          </span>

        </div>

        {/* Loading */}
        {loading ? (

          <div className="student-message-box">
            Loading favorite courses...
          </div>

        ) : courses.length === 0 ? (

          /* Empty Favorites */
          <div className="student-empty-state">

            <div>♡</div>

            <h3>No Favorite Courses Yet</h3>

            <p>
              You haven't added any courses to your favorites.
              Browse courses and click the heart icon to save them.
            </p>

            <button
              type="button"
              className="student-view-course-button"
              onClick={() => navigate("/student/dashboard")}
            >
              Explore Courses →
            </button>

          </div>

        ) : (

          /* Favorite Course Cards */
          <div className="student-course-grid">

            {courses.map((course) => (

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

                  <button
                    type="button"
                    className="student-favorite-button favorited"
                    onClick={() => removeFavorite(course._id)}
                    aria-label="Remove from favorites"
                  >
                    ♥
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
                      className="student-view-course-button"
                      onClick={() =>
                        navigate(`/student/course/${course._id}`)
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

      <footer className="student-footer">
        © {new Date().getFullYear()} LearnSphere.
        Keep learning, keep growing.
      </footer>

    </div>
  );
}

export default Favorites;