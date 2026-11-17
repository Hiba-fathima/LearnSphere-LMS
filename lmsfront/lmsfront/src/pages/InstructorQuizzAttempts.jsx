import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../api";

import "../css/InstructorQuizAttepmts.css";

function InstructorQuizAttempts() {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [grades, setGrades] = useState({});
  const [message, setMessage] = useState("");
  const [gradingId, setGradingId] = useState("");

  // Fetch quiz attempts
  const fetchAttempts = async () => {
    try {
      setLoading(true);
      setMessage("");

      const response = await API.get(
        `/quizzes/instructor/${quizId}/attempts`
      );

      setQuiz(response.data.quiz);
      setAttempts(response.data.attempts || []);

      const initialGrades = {};

      (response.data.attempts || []).forEach((attempt) => {

        initialGrades[attempt._id] = {};

        attempt.answers.forEach((answer) => {

          initialGrades[attempt._id][answer.questionId] = {
            marksAwarded: answer.marksAwarded ?? 0,
            feedback: answer.feedback || "",
          };

        });

      });

      setGrades(initialGrades);

    } catch (error) {
      console.error("Fetch attempts error:", error);

      setMessage(
        error.response?.data?.message ||
          "Unable to load quiz attempts."
      );

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttempts();
  }, [quizId]);

  // Update marks and feedback
  const updateGrade = (
    attemptId,
    questionId,
    field,
    value
  ) => {

    setGrades((previous) => ({
      ...previous,

      [attemptId]: {
        ...previous[attemptId],

        [questionId]: {
          ...previous[attemptId]?.[questionId],
          [field]: value,
        },
      },
    }));

  };

  // Grade written answers
  const submitGrade = async (attempt) => {

    if (attempt.status === "Graded") {
      return;
    }

    const writtenQuestions = quiz.questions.filter(
      (question) => question.questionType === "written"
    );

    if (writtenQuestions.length === 0) {
      setMessage("There are no written questions to grade.");
      return;
    }

    // Validate marks
    for (const question of writtenQuestions) {

      const grade =
        grades[attempt._id]?.[question._id];

      const marks = Number(grade?.marksAwarded ?? 0);

      if (
        !Number.isFinite(marks) ||
        marks < 0 ||
        marks > question.marks
      ) {
        setMessage(
          `Marks for "${question.questionText}" must be between 0 and ${question.marks}.`
        );
        return;
      }

    }

    try {

      setGradingId(attempt._id);
      setMessage("");

      const formattedGrades = writtenQuestions.map((question) => {

        const grade =
          grades[attempt._id]?.[question._id] || {};

        return {
          questionId: question._id,
          marksAwarded: Number(grade.marksAwarded ?? 0),
          feedback: grade.feedback || "",
        };

      });

      const response = await API.patch(
        `/quizzes/instructor/${quizId}/attempts/${attempt._id}/grade`,
        {
          grades: formattedGrades,
        }
      );

      setMessage(
        response.data.message || "Quiz graded successfully."
      );

      await fetchAttempts();

    } catch (error) {

      console.error("Grade quiz error:", error);

      setMessage(
        error.response?.data?.message ||
          "Failed to grade quiz."
      );

    } finally {
      setGradingId("");
    }

  };

  // Show correct MCQ answer text
  const getStudentAnswer = (question, answer) => {

    if (!answer || !answer.answer) {
      return "Not answered";
    }

    if (question.questionType === "mcq") {

      const selectedOption = question.options?.find(
        (option) =>
          option._id?.toString() === answer.answer.toString()
      );

      return selectedOption?.text || "Unknown option";

    }

    if (question.questionType === "true_false") {

      if (answer.answer === "true") return "True";
      if (answer.answer === "false") return "False";

    }

    return answer.answer;

  };

  if (loading) {
    return (
      <div className="instructor-quiz-attempts-page">
        <div className="attempt-loading">
          Loading quiz attempts...
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="instructor-quiz-attempts-page">

        <div className="attempt-error">
          {message || "Quiz not found."}
        </div>

        <button
          className="attempt-back-button"
          onClick={() => navigate("/instructor/quizzes")}
        >
          ← Back to Quizzes
        </button>

      </div>
    );
  }

  const totalAttempted = attempts.length;

  const gradedCount = attempts.filter(
    (attempt) => attempt.status === "Graded"
  ).length;

  const pendingCount = totalAttempted - gradedCount;

  const hasWrittenQuestions = quiz.questions.some(
    (question) => question.questionType === "written"
  );

  return (
    <div className="instructor-quiz-attempts-page">

      {/* Header */}

      <div className="instructor-attempt-header">

        <button
          type="button"
          className="attempt-back-button"
          onClick={() => navigate("/instructor/quizzes")}
        >
          ← Back to Quizzes
        </button>

        <h1>{quiz.title}</h1>

        <p>
          Review student submissions and evaluate written answers.
        </p>

        <div className="attempt-quiz-details">

          <span>
            📚 {quiz.courseId?.title || "Course"}
          </span>

          <span>
            📝 {quiz.questions?.length || 0} Questions
          </span>

          <span>
            🎯 {quiz.totalMarks} Marks
          </span>

        </div>

      </div>

      {/* Statistics */}

      <div className="attempt-stats-grid">

        <div className="attempt-stat-card">
          <span>👨‍🎓</span>
          <div>
            <p>Total Attempts</p>
            <h2>{totalAttempted}</h2>
          </div>
        </div>

        <div className="attempt-stat-card">
          <span>✅</span>
          <div>
            <p>Graded</p>
            <h2>{gradedCount}</h2>
          </div>
        </div>

        <div className="attempt-stat-card">
          <span>⏳</span>
          <div>
            <p>Pending Evaluation</p>
            <h2>{pendingCount}</h2>
          </div>
        </div>

      </div>

      {message && (
        <div className="attempt-message">
          {message}
        </div>
      )}

      {/* Student Attempts */}

      <div className="attempt-list-heading">
        <h2>Student Submissions</h2>
        <span>{totalAttempted} Students</span>
      </div>

      {attempts.length === 0 ? (

        <div className="attempt-empty">

          <div>📋</div>

          <h3>No Attempts Yet</h3>

          <p>
            Students who submit this quiz will appear here.
          </p>

        </div>

      ) : (

        attempts.map((attempt) => (

          <div className="instructor-attempt-card" key={attempt._id}>

            {/* Student Information */}

            <div className="attempt-student-header">

              <div className="attempt-student-info">

                <div className="attempt-student-avatar">
                  {(attempt.studentId?.name || "S")
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div>

                  <h3>
                    {attempt.studentId?.name || "Student"}
                  </h3>

                  <p>
                    {attempt.studentId?.email || ""}
                  </p>

                  <small>
                    Submitted:{" "}
                    {new Date(
                      attempt.submittedAt
                    ).toLocaleString("en-IN")}
                  </small>

                </div>

              </div>

              <div className="attempt-student-score">

                <strong>
                  {attempt.obtainedMarks} / {attempt.totalMarks}
                </strong>

                <span
                  className={`attempt-status ${
                    attempt.status === "Graded"
                      ? "attempt-status-graded"
                      : "attempt-status-pending"
                  }`}
                >
                  {attempt.status}
                </span>

              </div>

            </div>

            {/* Answers */}

            <div className="attempt-answers-section">

              <h3>Student Answers</h3>

              {quiz.questions.map((question, index) => {

                const answer = attempt.answers.find(
                  (item) =>
                    item.questionId.toString() ===
                    question._id.toString()
                );

                return (

                  <div
                    className="attempt-answer-card"
                    key={question._id}
                  >

                    <div className="attempt-question-heading">

                      <h4>
                        Question {index + 1}
                      </h4>

                      <span>
                        {question.marks} Marks
                      </span>

                    </div>

                    <p className="attempt-question-text">
                      {question.questionText}
                    </p>

                    <p className="attempt-question-type">
                      Type:{" "}
                      {question.questionType.replace("_", " ")}
                    </p>

                    <div className="attempt-student-answer">

                      <strong>Student Answer:</strong>

                      <p>
                        {getStudentAnswer(question, answer)}
                      </p>

                    </div>

                    {/* Automatic Questions */}

                    {question.questionType !== "written" && (

                      <div className="attempt-auto-result">

                        <span>
                          Result:{" "}
                          {answer?.isCorrect
                            ? "Correct ✓"
                            : "Incorrect ✗"}
                        </span>

                        <span>
                          Marks:{" "}
                          {answer?.marksAwarded ?? 0} / {question.marks}
                        </span>

                      </div>

                    )}

                    {/* Written Questions */}

                    {question.questionType === "written" && (

                      <div className="attempt-manual-grade">

                        <h4>Evaluate Written Answer</h4>

                        <div className="attempt-grade-field">

                          <label>
                            Marks Awarded (Maximum {question.marks})
                          </label>

                          <input
                            type="number"
                            min="0"
                            max={question.marks}
                            step="0.5"
                            disabled={attempt.status === "Graded"}
                            value={
                              grades[attempt._id]?.[question._id]
                                ?.marksAwarded ?? 0
                            }
                            onChange={(e) =>
                              updateGrade(
                                attempt._id,
                                question._id,
                                "marksAwarded",
                                e.target.value
                              )
                            }
                          />

                        </div>

                        <div className="attempt-grade-field">

                          <label>Feedback</label>

                          <textarea
                            rows="3"
                            disabled={attempt.status === "Graded"}
                            value={
                              grades[attempt._id]?.[question._id]
                                ?.feedback ?? ""
                            }
                            onChange={(e) =>
                              updateGrade(
                                attempt._id,
                                question._id,
                                "feedback",
                                e.target.value
                              )
                            }
                            placeholder="Write feedback for the student..."
                          />

                        </div>

                      </div>

                    )}

                  </div>

                );

              })}

            </div>

            {/* Submit Grade */}

            {attempt.status !== "Graded" &&
              hasWrittenQuestions && (

                <div className="attempt-grade-footer">

                  <p>
                    Review all written answers before submitting.
                    After grading, the marks cannot be changed using
                    the current backend.
                  </p>

                  <button
                    type="button"
                    className="attempt-submit-grade"
                    disabled={gradingId === attempt._id}
                    onClick={() => submitGrade(attempt)}
                  >
                    {gradingId === attempt._id
                      ? "Submitting..."
                      : "Submit Final Grade"}
                  </button>

                </div>

              )}

            {attempt.status === "Graded" && (

              <div className="attempt-completed-message">
                ✓ This quiz attempt has been evaluated.
              </div>

            )}

          </div>

        ))

      )}

    </div>
  );
}

export default InstructorQuizAttempts;