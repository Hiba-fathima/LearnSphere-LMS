import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import API from "../api";
import "../css/MyLearningDetails.css";

function MyLearningDetails() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  const [course, setCourse] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [myReview, setMyReview] = useState(null);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchDetails = async () => {
    try {
      const response = await API.get(
        `/student/my-learning/${courseId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setCourse(response.data.course);
      setReviews(response.data.reviews || []);
      setMyReview(response.data.myReview || null);

      if (response.data.myReview) {
        setRating(response.data.myReview.rating);
        setComment(response.data.myReview.comment);
      }
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Unable to load course details"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [courseId]);

  const submitReview = async (e) => {
    e.preventDefault();

    if (!rating) {
      setMessage("Please select a star rating.");
      return;
    }

    if (!comment.trim()) {
      setMessage("Please write your review.");
      return;
    }

    try {
      setSubmitting(true);
      setMessage("");

      const response = await API.post(
        `/student/my-learning/${courseId}/review`,
        {
          rating,
          comment,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage(response.data.message);
      await fetchDetails();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Unable to submit review"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const averageRating =
    reviews.length > 0
      ? (
          reviews.reduce((total, review) => total + review.rating, 0) /
          reviews.length
        ).toFixed(1)
      : "0.0";

  if (loading) {
    return <div className="details-loading">Loading course details...</div>;
  }

  if (!course) {
    return (
      <div className="details-loading">
        <p>{message || "Course not found"}</p>
        <button onClick={() => navigate("/student/my-learning")}>
          Back to My Learning
        </button>
      </div>
    );
  }

  return (
    <div className="details-layout">

      {/* SIDEBAR */}
      <aside className="details-sidebar">

        <Link to="/" className="details-brand">
          Learn<span>Sphere</span>
        </Link>

        <p className="details-menu-label">LEARNING MENU</p>

        <nav className="details-navigation">

          <button
            className="details-nav-link"
            onClick={() => navigate("/student/dashboard")}
          >
            <span>▦</span>
            Dashboard
          </button>

          <button
            className="details-nav-link"
            onClick={() => navigate("/student/dashboard#courses")}
          >
            <span>▤</span>
            Browse Courses
          </button>

          <button
            className="details-nav-link active"
            onClick={() => navigate("/student/my-learning")}
          >
            <span>🎓</span>
            My Learning
          </button>

          <button
            className="details-nav-link"
            onClick={() => navigate("/student/profile")}
          >
            <span>👤</span>
            My Profile
          </button>

        </nav>

        <div className="details-sidebar-bottom">

          <div className="details-help-box">
            <div className="details-help-icon">?</div>
            <h4>Need help?</h4>
            <p>Keep learning and reach your goals.</p>
          </div>

          <button
            className="details-logout"
            onClick={handleLogout}
          >
            <span>↪</span>
            Logout
          </button>

        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="details-main">

        {/* TOPBAR */}
        <header className="details-topbar">

          <div>
            <span className="details-topbar-label">
              STUDENT PORTAL
            </span>
            <h2>Course Details</h2>
          </div>

          <div className="details-user-info">
            <div className="details-avatar">
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

        {/* BACK BUTTON */}
        <button
          className="details-back-button"
          onClick={() => navigate("/student/my-learning")}
        >
          ← Back to My Learning
        </button>

        {/* COURSE BANNER */}
        <section className="details-course-banner">

          <div className="details-course-content">

            <span className="details-course-tag">
              ENROLLED COURSE
            </span>

            <h1>{course.title}</h1>

            <p>
              {course.description ||
                "Continue your learning journey with this course."}
            </p>

            <div className="details-course-info">
              <span>👨‍🏫 {course.instructor || "Instructor"}</span>
              <span>◷ {course.duration || "Flexible duration"}</span>
              <span>✓ Enrolled</span>
            </div>

          </div>

          <div className="details-course-illustration">
            📚
          </div>

        </section>

        {/* COURSE INFORMATION */}
        <section className="details-info-section">

          <div className="details-section-heading">
            <span>COURSE INFORMATION</span>
            <h2>About This Course</h2>
          </div>

          <div className="details-info-card">
            <h3>{course.title}</h3>

            <p>
              {course.description ||
                "No course description available."}
            </p>

            <div className="details-info-grid">

              <div>
                <small>Instructor</small>
                <strong>{course.instructor || "Not specified"}</strong>
              </div>

              <div>
                <small>Duration</small>
                <strong>{course.duration || "Not specified"}</strong>
              </div>

              <div>
                <small>Category</small>
                <strong>{course.category || "General"}</strong>
              </div>

              <div>
                <small>Course Price</small>
                <strong>
                  ₹{Number(course.price || 0).toLocaleString("en-IN")}
                </strong>
              </div>

            </div>
          </div>

        </section>

        {/* REVIEW SECTION */}
        <section className="details-review-section">

          <div className="details-section-heading">
            <span>YOUR FEEDBACK</span>
            <h2>Rate This Course</h2>
            <p>Share your experience with other students.</p>
          </div>

          <div className="details-review-form-card">

            <h3>
              {myReview ? "Update Your Review" : "Write a Review"}
            </h3>

            <p className="details-review-subtitle">
              How would you rate this course?
            </p>

            <form onSubmit={submitReview}>

              <div className="details-rating-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    className={
                      star <= rating ? "selected" : ""
                    }
                    aria-label={`Rate ${star} out of 5 stars`}
                  >
                    ★
                  </button>
                ))}
              </div>

              <p className="details-rating-label">
                {rating === 0
                  ? "Select your rating"
                  : `${rating} out of 5 stars`}
              </p>

              <label htmlFor="review-comment">
                Your Comments
              </label>

              <textarea
                id="review-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write your experience about this course..."
                rows="5"
                required
              />

              <button
                type="submit"
                className="details-submit-review"
                disabled={submitting || rating === 0}
              >
                {submitting
                  ? "Submitting..."
                  : myReview
                  ? "Update Review"
                  : "Submit Review"}
              </button>

            </form>

            {message && (
              <p className="details-review-message">
                {message}
              </p>
            )}

          </div>

        </section>

        {/* STUDENT REVIEWS */}
        <section className="details-all-reviews">

          <div className="details-reviews-heading">

            <div>
              <span>STUDENT FEEDBACK</span>
              <h2>Student Reviews</h2>
            </div>

            <div className="details-average-rating">
              <strong>★ {averageRating}</strong>
              <span>{reviews.length} Reviews</span>
            </div>

          </div>

          {reviews.length === 0 ? (
            <div className="details-no-reviews">
              <div>⭐</div>
              <h3>No reviews yet</h3>
              <p>Be the first student to review this course.</p>
            </div>
          ) : (
            <div className="details-reviews-list">

              {reviews.map((review) => (
                <article
                  key={review._id}
                  className="details-review-card"
                >

                  <div className="details-review-avatar">
                    {(review.student?.name || "S")
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div className="details-review-content">

                    <div className="details-review-card-heading">
                      <h4>
                        {review.student?.name || "Student"}
                      </h4>

                      <span>
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="details-review-card-stars">
                      {"★".repeat(review.rating)}
                      {"☆".repeat(5 - review.rating)}
                    </div>

                    <p>{review.comment}</p>

                  </div>

                </article>
              ))}

            </div>
          )}

        </section>

        <footer className="details-footer">
          © {new Date().getFullYear()} LearnSphere. Keep learning, keep growing.
        </footer>

      </main>
    </div>
  );
}

export default MyLearningDetails;