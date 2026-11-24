import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api";
import "../css/Home.css";

const SERVER_URL = "https://learnsphere-lms-vkzs.onrender.com";

function Home() {
  const [categories, setCategories] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch categories and courses
  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [categoryResponse, courseResponse] = await Promise.all([
          API.get("/categories"),
          API.get("/courses"),
        ]);

        const categoryData = categoryResponse.data;
        const courseData = courseResponse.data;

        setCategories(
          Array.isArray(categoryData)
            ? categoryData
            : categoryData.categories || []
        );

        setCourses(
          Array.isArray(courseData)
            ? courseData
            : courseData.courses || []
        );
      } catch (err) {
        console.error("Error fetching home data:", err);
        setError("Unable to load categories and courses.");
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  // Category image URL
  const getCategoryImage = (image) => {
    if (!image) return "";

    if (image.startsWith("http")) {
      return image;
    }

    return `${SERVER_URL}/${image.replace(/^\/+/, "")}`;
  };

  // Find courses belonging to selected category
  const getCategoryCourses = (category) => {
    return courses.filter((course) => {
      if (course.status !== "Published") return false;

      const courseCategory = course.category;

      if (typeof courseCategory === "object" && courseCategory !== null) {
        return (
          courseCategory._id === category._id ||
          courseCategory.name === category.name
        );
      }

      return (
        courseCategory === category.name ||
        courseCategory === category._id
      );
    });
  };

  // Handle category click
  const handleCategoryClick = (category) => {
    if (selectedCategory?._id === category._id) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(category);
    }
  };

  return (
    <div className="home-page">

      {/* Navbar */}
      <nav className="home-navbar">
        <Link to="/" className="home-logo">
          Learn<span>Sphere</span>
        </Link>

        <div className="home-nav-links">
          <Link to="/login" className="login-btn">
            Login
          </Link>

          <Link to="/signup" className="signup-btn">
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="home-hero">

        <div className="hero-content">
          <span className="hero-tag">
            YOUR LEARNING JOURNEY STARTS HERE
          </span>

          <h1>
            Learn Today.
            <br />
            <span>Lead Tomorrow.</span>
          </h1>

          <p>
            Discover new skills, explore exciting courses, and learn at
            your own pace. Your next opportunity starts with the right
            knowledge.
          </p>

          <div className="hero-buttons">
            <Link to="/signup" className="hero-primary-btn">
              Get Started <span>→</span>
            </Link>

            <Link to="/login" className="hero-secondary-btn">
              Login to Continue
            </Link>
          </div>

          <div className="hero-note">
            <span className="note-dot"></span>
            Learn at your own pace, anytime and anywhere.
          </div>
        </div>

        {/* Decorative Visual */}
        <div className="hero-visual">
          <div className="visual-circle circle-one"></div>
          <div className="visual-circle circle-two"></div>

          <div className="learning-card">
            <div className="learning-icon">✦</div>

            <span className="card-label">YOUR FUTURE STARTS NOW</span>

            <h2>Knowledge is your superpower.</h2>

            <p>
              Every new skill takes you one step closer to your goals.
            </p>

            <div className="learning-progress">
              <span></span>
            </div>

            <div className="progress-text">
              <span>Keep learning</span>
              <span>Keep growing</span>
            </div>
          </div>

          <div className="floating-badge badge-top">
            <span>✧</span> Explore your potential
          </div>

          <div className="floating-badge badge-bottom">
            <span>✓</span> Your journey, your pace
          </div>
        </div>

      </section>

      {/* Categories Section */}
      <section className="home-categories">

        <div className="categories-heading">
          <span>EXPLORE OUR COURSES</span>
          <h2>Learn Something New</h2>
          <p>
            Explore different categories and find the right course
            for your learning journey.
          </p>
        </div>

        {loading ? (
          <p className="home-loading">Loading categories...</p>
        ) : error ? (
          <p className="home-error">{error}</p>
        ) : categories.length === 0 ? (
          <p className="home-empty">
            No categories available currently.
          </p>
        ) : (
          <>
            <div className="home-category-grid">

              {categories.map((category) => (
                <div
                  className={`home-category-card ${
                    selectedCategory?._id === category._id
                      ? "active-category"
                      : ""
                  }`}
                  key={category._id}
                  onClick={() => handleCategoryClick(category)}
                >

                  <div className="category-image-wrapper">
                    {category.image ? (
                      <img
                        src={getCategoryImage(category.image)}
                        alt={category.name}
                      />
                    ) : (
                      <div className="category-no-image">
                        {category.name?.charAt(0)}
                      </div>
                    )}
                  </div>

                  <div className="category-card-content">
                    <h3>{category.name}</h3>

                    <p>
                      {category.description || "Explore our courses"}
                    </p>

                    <span className="category-view-text">
                      {selectedCategory?._id === category._id
                        ? "Hide Courses ↑"
                        : "View Courses →"}
                    </span>
                  </div>

                </div>
              ))}

            </div>

            {/* Selected Category Courses */}
            {selectedCategory && (
              <div className="selected-category-courses">

                <div className="selected-category-heading">
                  <span>COURSES IN</span>
                  <h2>{selectedCategory.name}</h2>
                </div>

                {(() => {
                  const categoryCourses =
                    getCategoryCourses(selectedCategory);

                  return categoryCourses.length === 0 ? (
                    <p className="home-empty">
                      No published courses available in this category yet.
                    </p>
                  ) : (
                    <div className="home-course-grid">

                      {categoryCourses.map((course) => (
                        <div className="home-course-card" key={course._id}>

                          <div className="home-course-content">
                            <span className="course-category-label">
                              {selectedCategory.name}
                            </span>

                            <h3>{course.title}</h3>

                            <p>
                              {course.description ||
                                "Explore this course and improve your skills."}
                            </p>

                            <div className="home-course-details">
                              <span>
                                {course.duration || "Self-paced"}
                              </span>

                              <strong>
                                ₹{course.price || 0}
                              </strong>
                            </div>

                            <Link
                              to={`/course/${course._id}`}
                              className="home-course-btn"
                            >
                              View Course →
                            </Link>
                          </div>

                        </div>
                      ))}

                    </div>
                  );
                })()}

              </div>
            )}
          </>
        )}

      </section>

      {/* Bottom Highlight */}
      <section className="home-highlight">

        <div className="highlight-item">
          <span className="highlight-icon">◎</span>
          <div>
            <h3>Learn Your Way</h3>
            <p>Study at your own pace</p>
          </div>
        </div>

        <div className="highlight-divider"></div>

        <div className="highlight-item">
          <span className="highlight-icon">◇</span>
          <div>
            <h3>Explore New Skills</h3>
            <p>Discover learning opportunities</p>
          </div>
        </div>

        <div className="highlight-divider"></div>

        <div className="highlight-item">
          <span className="highlight-icon">↗</span>
          <div>
            <h3>Grow Your Future</h3>
            <p>Take the next step forward</p>
          </div>
        </div>

      </section>

      {/* Footer */}
      <footer className="home-footer">
        <p>
          © 2026 LearnSphere.
          <span> Learn something new every day.</span>
        </p>
      </footer>

    </div>
  );
}

export default Home;