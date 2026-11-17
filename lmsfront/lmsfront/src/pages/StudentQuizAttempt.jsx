import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../api";
import "../css/StudentQuizAttempt.css";

function StudentQuizAttempt() {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await API.get(
          `/quizzes/student/${quizId}`
        );

        const quizData = response.data.quiz || response.data;

        setQuiz(quizData);
      } catch (err) {
        console.error("Quiz loading error:", err);

        setError(
          err.response?.data?.message ||
          "Unable to load this quiz."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId]);

  const handleAnswerChange = (questionId, answer) => {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: answer,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!window.confirm("Are you sure you want to submit this quiz?")) {
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const formattedAnswers = quiz.questions.map((question) => ({
        questionId: question._id,
        answer: answers[question._id] || "",
      }));

      const response = await API.post(
        `/quizzes/student/${quizId}/submit`,
        {
          answers: formattedAnswers,
        }
      );

      setResult(response.data);
    } catch (err) {
      console.error("Quiz submission error:", err);

      setError(
        err.response?.data?.message ||
        "Unable to submit quiz. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="quiz-attempt-message">
        Loading quiz...
      </div>
    );
  }

  if (error && !quiz) {
    return (
      <div className="quiz-attempt-message quiz-attempt-error">
        {error}

        <button onClick={() => navigate("/student/quizzes")}>
          Back to My Quizzes
        </button>
      </div>
    );
  }

  if (result) {
    const attempt = result.attempt || result;

    return (
      <div className="quiz-result-page">
        <div className="quiz-result-card">

          <div className="quiz-result-icon">🎉</div>

          <h1>Quiz Submitted Successfully!</h1>

          <p>Your answers have been submitted.</p>

          <div className="quiz-result-marks">
            <span>Your Score</span>

            <h2>
              {attempt.obtainedMarks ?? 0} /{" "}
              {attempt.totalMarks ?? quiz.totalMarks}
            </h2>
          </div>

          {attempt.status === "Submitted" && (
            <p className="quiz-pending-result">
              Your written answers are waiting for instructor evaluation.
            </p>
          )}

          <button
            onClick={() => navigate("/student/quizzes")}
          >
            Back to My Quizzes
          </button>

        </div>
      </div>
    );
  }

  if (!quiz) {
    return null;
  }

  return (
    <div className="quiz-attempt-page">

      <div className="quiz-attempt-header">

        <button
          type="button"
          className="quiz-back-button"
          onClick={() => navigate("/student/quizzes")}
        >
          ← Back to Quizzes
        </button>

        <h1>{quiz.title}</h1>

        <p>{quiz.description}</p>

        <div className="quiz-attempt-info">
          <span>📚 {quiz.courseId?.title || "Course"}</span>
          <span>📝 {quiz.questions?.length || 0} Questions</span>
          <span>🎯 {quiz.totalMarks} Marks</span>
          <span>⏱ {quiz.duration} Minutes</span>
        </div>

      </div>

      <form
        className="quiz-question-form"
        onSubmit={handleSubmit}
      >

        {quiz.questions?.map((question, index) => (

          <div
            className="quiz-question-card"
            key={question._id}
          >

            <div className="quiz-question-heading">

              <h3>
                Question {index + 1}
              </h3>

              <span>{question.marks} Marks</span>

            </div>

            <h4>{question.questionText}</h4>

            {/* MCQ */}

            {question.questionType === "mcq" && (
              <div className="quiz-options">

                {question.options?.map((option) => (

                  <label
                    className={`quiz-option ${
                      answers[question._id] === option._id
                        ? "selected-option"
                        : ""
                    }`}
                    key={option._id}
                  >

                    <input
                      type="radio"
                      name={question._id}
                      value={option._id}
                      checked={
                        answers[question._id] === option._id
                      }
                      onChange={() =>
                        handleAnswerChange(
                          question._id,
                          option._id
                        )
                      }
                    />

                    <span>{option.text}</span>

                  </label>

                ))}

              </div>
            )}

            {/* TRUE / FALSE */}

            {question.questionType === "true_false" && (
              <div className="quiz-options">

                {["true", "false"].map((option) => (

                  <label
                    className={`quiz-option ${
                      answers[question._id] === option
                        ? "selected-option"
                        : ""
                    }`}
                    key={option}
                  >

                    <input
                      type="radio"
                      name={question._id}
                      value={option}
                      checked={
                        answers[question._id] === option
                      }
                      onChange={() =>
                        handleAnswerChange(
                          question._id,
                          option
                        )
                      }
                    />

                    <span>
                      {option === "true" ? "True" : "False"}
                    </span>

                  </label>

                ))}

              </div>
            )}

            {/* WRITTEN ANSWER */}

            {question.questionType === "written" && (
              <textarea
                className="quiz-written-answer"
                placeholder="Write your answer here..."
                rows="5"
                value={answers[question._id] || ""}
                onChange={(e) =>
                  handleAnswerChange(
                    question._id,
                    e.target.value
                  )
                }
              />
            )}

          </div>

        ))}

        {error && (
          <div className="quiz-submit-error">
            {error}
          </div>
        )}

        <div className="quiz-submit-container">

          <p>
            Check your answers carefully before submitting.
            You cannot attempt this quiz again after submission.
          </p>

          <button
            type="submit"
            className="quiz-submit-button"
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Submit Quiz"}
          </button>

        </div>

      </form>

    </div>
  );
}

export default StudentQuizAttempt;