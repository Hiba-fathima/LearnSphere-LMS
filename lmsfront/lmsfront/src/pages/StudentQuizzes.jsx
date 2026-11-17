import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import "../css/StudentQuizzes.css";
import "../css/StudentDashboard.css";

function StudentQuizzes() {
  const navigate = useNavigate();

  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchQuizzes = async () => {
    try {
      const response = await API.get("/quizzes/student");

      const quizList = Array.isArray(response.data)
        ? response.data
        : response.data.quizzes || [];

      setQuizzes(quizList);
    } catch (err) {
      console.error("Quiz loading error:", err);
      setError(
        err.response?.data?.message || "Unable to load quizzes."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const formatDate = (date) => {
    if (!date) return "No due date";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="student-quizzes-page">

      {/* Header */}
      <div className="student-quizzes-header">
        <div>
          <span>STUDENT PORTAL</span>
          <h1>My Quizzes</h1>
          <p>
            Test your knowledge and track your learning progress.
          </p>
        </div>

        <div className="quiz-header-icon">📋</div>
      </div>

      {/* Summary */}
      <div className="quiz-summary">

        <div className="quiz-summary-card">
          <span>📝</span>
          <div>
            <p>Available Quizzes</p>
            <h2>{quizzes.length}</h2>
          </div>
        </div>

        <div className="quiz-summary-card">
          <span>✅</span>
          <div>
            <p>Attempted</p>
            <h2>
              {quizzes.filter((quiz) => quiz.attempt).length}
            </h2>
          </div>
        </div>

        <div className="quiz-summary-card">
          <span>⏳</span>
          <div>
            <p>Not Attempted</p>
            <h2>
              {quizzes.filter((quiz) => !quiz.attempt).length}
            </h2>
          </div>
        </div>

      </div>

      {/* Quiz List */}
      <section className="student-quiz-list-section">

        <div className="student-quiz-list-heading">
          <h2>Available Quizzes</h2>
          <span>{quizzes.length} quizzes</span>
        </div>

        {loading ? (

          <div className="quiz-message">
            Loading quizzes...
          </div>

        ) : error ? (

          <div className="quiz-message quiz-error">
            {error}
          </div>

        ) : quizzes.length === 0 ? (

          <div className="quiz-empty-state">
            <div>📚</div>
            <h3>No quizzes available</h3>
            <p>
              Quizzes published for your enrolled courses
              will appear here.
            </p>
          </div>

        ) : (

          <div className="student-quiz-grid">

            {quizzes.map((quiz) => {
              const attempted = Boolean(quiz.attempt);

              return (
                <article
                  className="student-quiz-card"
                  key={quiz._id}
                >

                  <div className="student-quiz-card-top">

                    <div className="student-quiz-icon">
                      📋
                    </div>

                    <span
                      className={`quiz-status ${
                        attempted
                          ? "quiz-attempted"
                          : "quiz-pending"
                      }`}
                    >
                      {attempted
                        ? "Attempted"
                        : "Not Attempted"}
                    </span>

                  </div>

                  <h3>{quiz.title}</h3>

                  <p className="student-quiz-description">
                    {quiz.description || "Test your knowledge."}
                  </p>

                  <div className="student-quiz-details">

                    <p>
                      <strong>Course:</strong>{" "}
                      {quiz.courseId?.title || "Course"}
                    </p>

                    <p>
                      <strong>Section:</strong>{" "}
                      {quiz.sectionTitle || "Section"}
                    </p>

                    <p>
                      <strong>Questions:</strong>{" "}
                      {quiz.questions?.length || 0}
                    </p>

                    <p>
                      <strong>Total Marks:</strong>{" "}
                      {quiz.totalMarks}
                    </p>

                    <p>
                      <strong>Duration:</strong>{" "}
                      {quiz.duration} minutes
                    </p>

                    <p>
                      <strong>Due Date:</strong>{" "}
                      {formatDate(quiz.dueDate)}
                    </p>

                  </div>

                  {attempted && (
                    <div className="quiz-attempt-result">

                      <p>
                        <strong>Status:</strong>{" "}
                        {quiz.attempt.status}
                      </p>

                      <p>
                        <strong>Obtained Marks:</strong>{" "}
                        {quiz.attempt.obtainedMarks} /{" "}
                        {quiz.attempt.totalMarks}
                      </p>

                      {quiz.attempt.status === "Submitted" && (
                        <small>
                          Written answers are awaiting instructor evaluation.
                        </small>
                      )}

                    </div>
                  )}

                  <button
                    type="button"
                    className={`student-quiz-button ${
                      attempted ? "quiz-disabled-button" : ""
                    }`}
                    disabled={attempted}
                    onClick={() =>
                      navigate(`/student/quizzes/${quiz._id}`)
                    }
                  >
                    {attempted
                      ? "Already Attempted"
                      : "Attempt Quiz →"}
                  </button>

                </article>
              );
            })}

          </div>
        )}

      </section>

    </div>
  );
}

export default StudentQuizzes;