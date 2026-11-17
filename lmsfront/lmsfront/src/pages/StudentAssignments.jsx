import { useEffect, useState } from "react";
import API from "../api";
import "../css/StudentAssignments.css";

function StudentAssignments() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [answers, setAnswers] = useState({});
  const [files, setFiles] = useState({});
  const [submitting, setSubmitting] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);

      const response = await API.get("/assignments/student");

      const data = response.data.assignments || response.data;

      setAssignments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Assignment loading error:", err);
      setError(
        err.response?.data?.message || "Unable to load assignments."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (assignmentId) => {
    const answer = answers[assignmentId] || "";
    const file = files[assignmentId];

    if (!answer.trim() && !file) {
      setMessage("Please enter an answer or select a file.");
      return;
    }

    const formData = new FormData();

    formData.append("answer", answer);

    if (file) {
      formData.append("file", file);
    }

    try {
      setSubmitting(assignmentId);
      setMessage("");

      await API.post(
        `/assignments/student/${assignmentId}/submit`,
        formData
      );

      setMessage("Assignment submitted successfully!");

      setAnswers((prev) => ({
        ...prev,
        [assignmentId]: "",
      }));

      setFiles((prev) => ({
        ...prev,
        [assignmentId]: null,
      }));

      await fetchAssignments();
    } catch (err) {
      console.error("Submission error:", err);

      setMessage(
        err.response?.data?.message || "Assignment submission failed."
      );
    } finally {
      setSubmitting("");
    }
  };

  return (
    <div className="student-assignments-page">

      {/* HEADER */}
      <header className="student-topbar">

        <div>
          <span className="student-topbar-label">
            STUDENT PORTAL
          </span>
          <h2>My Assignments</h2>
        </div>

        <div className="student-user-info">

          <div className="student-user-avatar">
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

      <section className="assignments-page">

        <div className="assignments-heading">
          <span>YOUR LEARNING TASKS</span>
          <h1>My Assignments</h1>
          <p>
            View your assignments and submit your work before the due date.
          </p>
        </div>

        {message && (
          <div className="assignment-message">
            {message}
          </div>
        )}

        {loading ? (

          <div className="assignment-empty">
            Loading assignments...
          </div>

        ) : error ? (

          <div className="assignment-empty assignment-error">
            {error}
          </div>

        ) : assignments.length === 0 ? (

          <div className="assignment-empty">
            <div>📝</div>
            <h3>No assignments available</h3>
            <p>
              Assignments from your enrolled courses will appear here.
            </p>
          </div>

        ) : (

          <div className="student-assignment-list">

            {assignments.map((assignment) => {

              const submission =
                assignment.submission ||
                assignment.mySubmission ||
                null;

              const isGraded = submission?.status === "Graded";

              const courseName =
                assignment.courseTitle ||
                assignment.courseId?.title ||
                "Course";

              const sectionName =
                assignment.sectionTitle ||
                assignment.section?.title ||
                "Section";

              return (

                <article
                  className="student-assignment-card"
                  key={assignment._id}
                >

                  <div className="assignment-card-header">

                    <div>
                      <span className="assignment-course">
                        {courseName}
                      </span>

                      <h2>{assignment.title}</h2>

                      <p className="assignment-section">
                        Section: {sectionName}
                      </p>
                    </div>

                    <span
                      className={`assignment-status ${
                        isGraded
                          ? "graded"
                          : submission
                          ? "submitted"
                          : "pending"
                      }`}
                    >
                      {isGraded
                        ? "Graded"
                        : submission
                        ? "Submitted"
                        : "Not Submitted"}
                    </span>

                  </div>

                  <div className="assignment-description">
                    <h4>Instructions</h4>
                    <p>{assignment.description}</p>
                  </div>

                  <div className="assignment-information">

                    <div>
                      <small>Due Date</small>
                      <strong>
                        {new Date(
                          assignment.dueDate
                        ).toLocaleString("en-IN")}
                      </strong>
                    </div>

                    <div>
                      <small>Total Marks</small>
                      <strong>{assignment.totalMarks}</strong>
                    </div>

                  </div>

                  {submission && (

                    <div className="previous-submission">

                      <h4>Your Submission</h4>

                      {submission.answer && (
                        <p>{submission.answer}</p>
                      )}

                      {submission.file?.originalName && (
                        <p>
                          📎 {submission.file.originalName}
                        </p>
                      )}

                      {isGraded && (
                        <div className="assignment-result">

                          <strong>
                            Marks: {submission.marks} /{" "}
                            {assignment.totalMarks}
                          </strong>

                          {submission.feedback && (
                            <p>
                              Feedback: {submission.feedback}
                            </p>
                          )}

                        </div>
                      )}

                    </div>

                  )}

                  {!isGraded && (

                    <div className="assignment-submit-form">

                      <h4>
                        {submission
                          ? "Resubmit Assignment"
                          : "Submit Assignment"}
                      </h4>

                      <textarea
                        placeholder="Write your answer here..."
                        value={answers[assignment._id] || ""}
                        onChange={(e) =>
                          setAnswers((prev) => ({
                            ...prev,
                            [assignment._id]: e.target.value,
                          }))
                        }
                      />

                      <label className="assignment-file-label">
                        Upload File (Optional)
                      </label>

                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.zip,.png,.jpg,.jpeg"
                        onChange={(e) =>
                          setFiles((prev) => ({
                            ...prev,
                            [assignment._id]: e.target.files[0] || null,
                          }))
                        }
                      />

                      {files[assignment._id] && (
                        <p className="selected-file">
                          Selected: {files[assignment._id].name}
                        </p>
                      )}

                      <button
                        type="button"
                        disabled={submitting === assignment._id}
                        onClick={() => handleSubmit(assignment._id)}
                      >
                        {submitting === assignment._id
                          ? "Submitting..."
                          : "Submit Assignment"}
                      </button>

                    </div>

                  )}

                </article>

              );
            })}

          </div>

        )}

      </section>

    </div>
  );
}

export default StudentAssignments;