import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import API from "../api";
import "../css/CourseDetails.css";

function CourseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Reviews
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  // Payment
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState(false);


  // =====================================
  // FETCH COURSE
  // =====================================

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await API.get("/courses");

        const courseList = Array.isArray(response.data)
          ? response.data
          : response.data.courses || [];

        const selectedCourse = courseList.find(
          (item) => item._id === id
        );

        if (!selectedCourse || selectedCourse.status !== "Published") {
          setError("This course is unavailable.");
        } else {
          setCourse(selectedCourse);
        }
      } catch (err) {
        console.error("Course loading error:", err);
        setError("Unable to load course details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id]);

  // =====================================
  // FETCH COURSE REVIEWS
  // =====================================

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setReviewsLoading(true);

        const response = await API.get(`/courses/${id}/reviews`);

        const reviewList = Array.isArray(response.data)
          ? response.data
          : response.data.reviews || [];

        setReviews(reviewList);
      } catch (err) {
        console.error("Review loading error:", err);
        setReviews([]);
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchReviews();
  }, [id]);

  // =====================================
  // REVIEW AVERAGE
  // =====================================

  const averageRating =
    reviews.length > 0
      ? (
          reviews.reduce(
            (total, review) => total + Number(review.rating || 0),
            0
          ) / reviews.length
        ).toFixed(1)
      : "0.0";

  // =====================================
  // LOAD RAZORPAY SCRIPT
  // =====================================

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");

      script.src = "https://checkout.razorpay.com/v1/checkout.js";

      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);

      document.body.appendChild(script);
    });
  };

  // =====================================
  // ENROLL NOW
  // =====================================

  const handleEnroll = () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setPaymentMessage("Please log in before enrolling in this course.");
      return;
    }

    setPaymentMessage("");
    setPaymentSuccess(false);
    setShowPaymentDetails(true);
  };

  // =====================================
  // PAY NOW WITH RAZORPAY
  // =====================================

  const handlePayNow = async () => {
    if (paymentLoading || !course) return;

    setPaymentLoading(true);
    setPaymentMessage("");
    setPaymentSuccess(false);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Please log in again.");
      }

      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded) {
        throw new Error(
          "Unable to load Razorpay. Check your internet connection."
        );
      }

      // Create order from backend
      const orderResponse = await API.post(
        `/enrollments/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const {
        keyId,
        orderId,
        amount,
        currency,
        courseName,
      } = orderResponse.data;

      if (!keyId || !orderId || !amount) {
        throw new Error("Invalid Razorpay order details.");
      }

      const options = {
        key: keyId,
        order_id: orderId,
        amount,
        currency,

        name: "LearnSphere",
        description: `Payment for ${courseName || course.title}`,

        prefill: {},

        theme: {
          color: "#38bdf8",
        },

        // PAYMENT SUCCESS
        handler: async function (response) {
          setPaymentLoading(true);
          setPaymentMessage("Verifying your payment...");

          try {
            const verificationResponse = await API.post(
              "/enrollments/verify-payment",
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (verificationResponse.data.success) {
              setPaymentSuccess(true);

              setPaymentMessage(
                "Payment Successful! You are enrolled in this course."
              );

              setTimeout(() => {
                navigate("/student/dashboard");
              }, 3000);
            } else {
              setPaymentSuccess(false);

              setPaymentMessage(
                verificationResponse.data.message ||
                  "Payment verification failed."
              );
            }
          } catch (err) {
            console.error("Verification error:", err);

            setPaymentSuccess(false);

            setPaymentMessage(
              err.response?.data?.message ||
                "Payment verification failed. Please contact support."
            );
          } finally {
            setPaymentLoading(false);
          }
        },

        // CHECKOUT CLOSED
        modal: {
          ondismiss: () => {
            setPaymentMessage(
              "Payment window closed. You can try again."
            );
          },
        },
      };

      const razorpay = new window.Razorpay(options);

      // PAYMENT FAILED
      razorpay.on("payment.failed", (response) => {
        console.error("Payment failed:", response.error);

        setPaymentSuccess(false);

        setPaymentMessage(
          response.error?.description ||
            "Payment failed. Please try again."
        );
      });

      razorpay.open();
    } catch (err) {
      console.error("Payment error:", err);

      setPaymentMessage(
        err.response?.data?.message ||
          err.message ||
          "Unable to start payment."
      );
    } finally {
      setPaymentLoading(false);
    }
  };

  // =====================================
  // LOADING
  // =====================================

  if (loading) {
    return (
      <div className="course-details-page">
        <p className="details-message">
          Loading course details...
        </p>
      </div>
    );
  }

  // =====================================
  // ERROR
  // =====================================

  if (error || !course) {
    return (
      <div className="course-details-page">
        <div className="details-message details-error">
          <h2>Course unavailable</h2>

          <p>{error || "This course is unavailable."}</p>

          <button onClick={() => navigate("/student/dashboard")}>
            Browse Courses
          </button>
        </div>
      </div>
    );
  }

  // =====================================
  // MAIN DESIGN
  // =====================================

  return (
    <div className="course-details-page">

      {/* NAVBAR */}

      <header className="course-details-navbar">
        <Link to="/student/dashboard" className="details-brand">
          Learn<span>Sphere</span>
        </Link>

        <button
          type="button"
          className="details-back-button"
          onClick={() => navigate("/student/dashboard")}
        >
          ← Back to Dashboard
        </button>
      </header>

      <main className="course-details-container">

        {/* BREADCRUMB */}

        <div className="course-details-breadcrumb">
          <Link to="/student/dashboard">Dashboard</Link>
          <span>/</span>
          <Link to="/student/dashboard#courses">Courses</Link>
          <span>/</span>
          <span>{course.title}</span>
        </div>

        {/* HERO SECTION */}

        <section className="course-details-hero">
          <div className="course-details-hero-content">
            <span className="details-category">
              {course.category}
            </span>

            <h1>{course.title}</h1>

            <p>
              Explore this course on LearnSphere and take the next
              step in your learning journey.
            </p>

            <div className="details-instructor">
              <div className="details-instructor-avatar">
                {(course.instructor || "I")
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                <small>Course instructor</small>
                <strong>{course.instructor}</strong>
              </div>
            </div>
          </div>

          <div className="course-details-hero-art">
            <div className="details-book-illustration">
              📚
            </div>

            <span>LEARN · GROW · ACHIEVE</span>
          </div>
        </section>

        {/* COURSE CONTENT */}

        <div className="course-details-content-grid">

          {/* COURSE OVERVIEW */}

          <section className="course-overview-card">
            <span className="details-section-label">
              COURSE OVERVIEW
            </span>

            <h2>About this course</h2>

            <p>
              This course is offered in the {course.category} category
              and taught by {course.instructor}. Explore the course
              information below to decide whether it matches your
              learning goals.
            </p>

            <div className="course-overview-divider" />

            <h3>What you should know</h3>

            <ul className="course-benefits-list">
              <li>✓ Course category: {course.category}</li>
              <li>✓ Instructor: {course.instructor}</li>
              <li>✓ Duration: {course.duration}</li>
              <li>
                ✓ Learn at your own pace based on the course format.
              </li>
            </ul>
          </section>

          {/* ENROLLMENT CARD */}

          <aside className="course-enrollment-card">
            <div className="enrollment-card-cover">
              <span>{course.category}</span>
              <div>📘</div>
            </div>

            <div className="enrollment-card-content">
              <small>Course price</small>

              <h2>
                ₹{Number(course.price).toLocaleString("en-IN")}
              </h2>

              <div className="enrollment-detail-row">
                <span>Instructor</span>
                <strong>{course.instructor}</strong>
              </div>

              <div className="enrollment-detail-row">
                <span>Duration</span>
                <strong>{course.duration}</strong>
              </div>

              <div className="enrollment-detail-row">
                <span>Category</span>
                <strong>{course.category}</strong>
              </div>

              <button
                type="button"
                className="enroll-course-button"
                onClick={handleEnroll}
              >
                Enroll Now →
              </button>

              {paymentMessage && !showPaymentDetails && (
                <p role="status" className="enrollment-note">
                  {paymentMessage}
                </p>
              )}
            </div>
          </aside>
        </div>

        {/* =====================================
            STUDENT REVIEWS
        ===================================== */}

        <section className="course-reviews-section">

          <div className="reviews-heading">
            <div>
              <span className="details-section-label">
                STUDENT FEEDBACK
              </span>

              <h2>What Students Say</h2>

              <p>
                Feedback from students who have enrolled in this course.
              </p>
            </div>

            <div className="reviews-rating-summary">
              <strong>{averageRating}</strong>

              <div>
                <div className="review-summary-stars">
                  ★★★★★
                </div>

                <span>
                  {reviews.length}{" "}
                  {reviews.length === 1 ? "review" : "reviews"}
                </span>
              </div>
            </div>
          </div>

          {/* REVIEW LOADING */}

          {reviewsLoading ? (
            <div className="reviews-empty">
              Loading reviews...
            </div>
          ) : reviews.length === 0 ? (
            /* NO REVIEWS */

            <div className="reviews-empty">
              <div>💬</div>

              <h3>No reviews yet</h3>

              <p>
                Be the first student to share your learning experience.
              </p>
            </div>
          ) : (
            /* REVIEW LIST */

            <div className="reviews-list">
              {reviews.map((review) => {
                const rating = Math.min(
                  5,
                  Math.max(0, Number(review.rating) || 0)
                );

                return (
                  <article
                    className="course-review-card"
                    key={review._id}
                  >
                    <div className="review-student-avatar">
                      {(review.student?.name || "S")
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="review-card-content">

                      <div className="review-card-top">
                        <div>
                          <h3>
                            {review.student?.name || "Student"}
                          </h3>

                          <span>
                            {review.createdAt
                              ? new Date(
                                  review.createdAt
                                ).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })
                              : ""}
                          </span>
                        </div>

                        <div className="review-stars">
                          {"★".repeat(rating)}
                          {"☆".repeat(5 - rating)}
                        </div>
                      </div>

                      <p>{review.comment}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

      </main>

      {/* =====================================
          RAZORPAY PAYMENT MODAL
      ===================================== */}

      {showPaymentDetails && (
        <div
          className="payment-modal-overlay"
          onClick={() => {
            if (!paymentLoading && !paymentSuccess) {
              setShowPaymentDetails(false);
              setPaymentMessage("");
            }
          }}
        >
          <div
            className="payment-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-modal-title"
            onClick={(event) => event.stopPropagation()}
          >

            {!paymentSuccess && (
              <button
                type="button"
                className="payment-modal-close"
                onClick={() => {
                  if (!paymentLoading) {
                    setShowPaymentDetails(false);
                    setPaymentMessage("");
                  }
                }}
                disabled={paymentLoading}
                aria-label="Close payment details"
              >
                ×
              </button>
            )}

            <div className="payment-modal-icon">
              {paymentSuccess ? "✓" : "🎓"}
            </div>

            <span className="payment-modal-label">
              LEARNSPHERE ENROLLMENT
            </span>

            <h2 id="payment-modal-title">
              {paymentSuccess
                ? "Payment Successful!"
                : "Confirm Your Enrollment"}
            </h2>

            <p className="payment-modal-description">
              {paymentSuccess
                ? "Your enrollment has been confirmed. You can now access your course."
                : "Review your course details before proceeding to payment."}
            </p>

            {/* COURSE DETAILS */}

            <div className="payment-course-summary">
              <div className="payment-course-icon">
                📘
              </div>

              <div>
                <h3>{course.title}</h3>

                <p>{course.category}</p>

                <small>
                  Instructor: {course.instructor}
                </small>
              </div>
            </div>

            <div className="payment-summary-row">
              <span>Course duration</span>
              <strong>{course.duration}</strong>
            </div>

            <div className="payment-summary-row">
              <span>Course fee</span>

              <strong>
                ₹{Number(course.price).toLocaleString("en-IN")}
              </strong>
            </div>

            <div className="payment-summary-row payment-total">
              <span>Total payable</span>

              <strong>
                ₹{Number(course.price).toLocaleString("en-IN")}
              </strong>
            </div>

            {/* PAYMENT MESSAGE */}

            {paymentMessage && (
              <p
                role="status"
                aria-live="polite"
                className="payment-message"
              >
                {paymentMessage}
              </p>
            )}

            {/* PAY BUTTON */}

            {!paymentSuccess && (
              <button
                type="button"
                className="payment-pay-button"
                onClick={handlePayNow}
                disabled={paymentLoading}
              >
                {paymentLoading
                  ? "Processing..."
                  : `Pay Now ₹${Number(course.price).toLocaleString("en-IN")} →`}
              </button>
            )}

            {paymentSuccess && (
              <button
                type="button"
                className="payment-pay-button"
                onClick={() => navigate("/student/dashboard")}
              >
                Go to Dashboard →
              </button>
            )}

            <p className="payment-secure-note">
              🔒 Secure checkout powered by Razorpay
            </p>

          </div>
        </div>
      )}
    </div>
  );
}

export default CourseDetails;