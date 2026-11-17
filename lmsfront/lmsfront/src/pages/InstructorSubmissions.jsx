import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import API from "../api";
import "../css/StudentDashboard.css";
import "../css/InstructorDashboard.css";
import "../css/InstructorSubmissions.css";

function InstructorSubmissions() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [marks, setMarks] = useState({});
  const [feedback, setFeedback] = useState({});
  const [grading, setGrading] = useState("");

  useEffect(() => {
    fetchSubmissions();
  }, [assignmentId]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get(
        `/assignments/instructor/${assignmentId}/submissions`
      );

      setAssignment(response.data.assignment);
      setSubmissions(response.data.submissions || []);

      const initialMarks = {};
      const initialFeedback = {};

      (response.data.submissions || []).forEach((submission) => {
        initialMarks[submission._id] =
          submission.marks ?? "";

        initialFeedback[submission._id] =
          submission.feedback || "";
      });

      setMarks(initialMarks);
      setFeedback(initialFeedback);
    } catch (err) {
      console.error("Fetch submissions error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load student submissions."
      );
    } finally {
      setLoading(false);
    }
  };

  // Download student uploaded file
  const handleDownload = async (submission) => {
    try {
      const response = await API.get(
        `/assignments/instructor/${assignmentId}/submissions/${submission._id}/file`,
        {
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data]);

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;
      link.download =
        submission.file?.originalName || "submission-file";

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("File download error:", err);
      setMessage("Unable to download the submitted file.");
    }
  };

  // Grade student submission
  const handleGrade = async (submissionId) => {
    const studentMarks = marks[submissionId];

    if (
      studentMarks === "" ||
      studentMarks === undefined ||
      studentMarks === null
    ) {
      setMessage("Please enter marks.");
      return;
    }

    const numericMarks = Number(studentMarks);

    if (
      !Number.isFinite(numericMarks) ||
      numericMarks < 0 ||
      numericMarks > assignment.totalMarks
    ) {
      setMessage(
        `Marks must be between 0 and ${assignment.totalMarks}.`
      );
      return;
    }

    try {
      setGrading(submissionId);
      setMessage("");

      const response = await API.patch(
        `/assignments/instructor/${assignmentId}/submissions/${submissionId}/grade`,
        {
          marks: numericMarks,
          feedback: feedback[submissionId] || "",
        }
      );

      setMessage(
        response.data.message || "Submission graded successfully."
      );

      await fetchSubmissions();
    } catch (err) {
      console.error("Grading error:", err);

      setMessage(
        err.response?.data?.message || "Failed to save grade."
      );
    } finally {
      setGrading("");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="student-layout">

      {/* Sidebar */}
      <aside className="student-sidebar">

        <Link to="/" className="student-brand">
          Learn<span>Sphere</span>
        </Link>

        <div className="student-sidebar-label">
          INSTRUCTOR MENU
        </div>

        <nav className="student-navigation">

          <Link
            to="/instructor/dashboard"
            className="student-nav-link"
          >
            <span>▦</span>
            Dashboard
          </Link>

          <Link
            to="/instructor/courses"
            className="student-nav-link"
          >
            <span>📚</span>
            My Courses
          </Link>

          <Link
            to="/instructor/assignments"
            className="student-nav-link active"
          >
            <span>📝</span>
            Assignments
          </Link>

          <Link
            to="/instructor/students"
            className="student-nav-link"
          >
            <span>👨‍🎓</span>
            Students
          </Link>

          <Link
            to="/instructor/profile"
            className="student-nav-link"
          >
            <span>👤</span>
            My Profile
          </Link>

        </nav>

        <div className="student-sidebar-bottom">

          <div className="student-help-box">
            <div className="student-help-icon">?</div>
            <h4>Need help?</h4>
            <p>Inspire students and share your knowledge.</p>
          </div>

          <button
            className="student-logout-button"
            onClick={handleLogout}
          >
            <span>↪</span>
            Logout
          </button>

        </div>
      </aside>

      {/* Main Content */}
      <main className="student-main">

        <header className="student-topbar">

          <div>
            <span className="student-topbar-label">
              INSTRUCTOR PORTAL
            </span>

            <h2>Student Submissions</h2>
          </div>

          <div className="student-user-info">

            <div className="student-user-avatar">
              {(user.name || user.username || "I")
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <strong>
                {user.name || user.username || "Instructor"}
              </strong>
              <p>Instructor</p>
            </div>

          </div>

        </header>

        <section className="submissions-page">

          <button
            className="submission-back-button"
            onClick={() => navigate("/instructor/assignments")}
          >
            ← Back to Assignments
          </button>

          {loading ? (

            <div className="submission-empty">
              Loading submissions...
            </div>

          ) : error ? (

            <div className="submission-empty submission-error">
              {error}
            </div>

          ) : (

            <>
              {/* Assignment Details */}
              <div className="submission-heading">

                <div>
                  <span>ASSIGNMENT DETAILS</span>

                  <h1>{assignment?.title}</h1>

                  <p>{assignment?.description}</p>
                </div>

                <div className="submission-total-card">
                  <small>Total Marks</small>
                  <h2>{assignment?.totalMarks}</h2>
                </div>

              </div>

              {/* Statistics */}
              <div className="submission-stats">

                <div className="submission-stat-card">
                  <span>👨‍🎓</span>
                  <div>
                    <small>Total Submissions</small>
                    <h3>{submissions.length}</h3>
                  </div>
                </div>

                <div className="submission-stat-card">
                  <span>✅</span>
                  <div>
                    <small>Graded</small>
                    <h3>
                      {
                        submissions.filter(
                          (item) => item.status === "Graded"
                        ).length
                      }
                    </h3>
                  </div>
                </div>

                <div className="submission-stat-card">
                  <span>⏳</span>
                  <div>
                    <small>Pending Evaluation</small>
                    <h3>
                      {
                        submissions.filter(
                          (item) => item.status !== "Graded"
                        ).length
                      }
                    </h3>
                  </div>
                </div>

              </div>

              {message && (
                <div className="submission-message">
                  {message}
                </div>
              )}

              {/* Student Submissions */}
              <div className="submission-list-heading">
                <div>
                  <span>STUDENT WORK</span>
                  <h2>Submitted Assignments</h2>
                </div>
              </div>

              {submissions.length === 0 ? (

                <div className="submission-empty">
                  <div>📭</div>
                  <h3>No Submissions Yet</h3>
                  <p>
                    Students' submitted assignments will appear here.
                  </p>
                </div>

              ) : (

                <div className="submission-list">

                  {submissions.map((submission, index) => {

                    const student = submission.studentId || {};

                    const isGraded =
                      submission.status === "Graded";

                    return (

                      <article
                        className="submission-card"
                        key={submission._id}
                      >

                        {/* Student Information */}
                        <div className="submission-student-header">

                          <div className="submission-student-avatar">
                            {(student.name || "S")
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div className="submission-student-info">
                            <h3>
                              {student.name || "Student"}
                            </h3>

                            <p>{student.email || "No email available"}</p>

                            <small>
                              Submitted:{" "}
                              {submission.submittedAt
                                ? new Date(
                                    submission.submittedAt
                                  ).toLocaleString("en-IN")
                                : "Not available"}
                            </small>
                          </div>

                          <span
                            className={`submission-status ${
                              isGraded ? "graded" : "pending"
                            }`}
                          >
                            {isGraded ? "Graded" : "Pending"}
                          </span>

                        </div>

                        {/* Answer */}
                        <div className="submission-answer">

                          <h4>Student Answer</h4>

                          {submission.answer ? (
                            <p>{submission.answer}</p>
                          ) : (
                            <p className="no-answer">
                              No text answer submitted.
                            </p>
                          )}

                        </div>

                        {/* Uploaded File */}
                        <div className="submission-file">

                          <h4>Uploaded File</h4>

                          {submission.file?.filename ? (

                            <div className="submission-file-box">

                              <span>📎</span>

                              <div>
                                <strong>
                                  {submission.file.originalName}
                                </strong>

                                <small>
                                  {(
                                    submission.file.size / 1024
                                  ).toFixed(2)} KB
                                </small>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  handleDownload(submission)
                                }
                              >
                                Download
                              </button>

                            </div>

                          ) : (
                            <p className="no-answer">
                              No file uploaded.
                            </p>
                          )}

                        </div>

                        {/* Grading */}
                        <div className="submission-grading">

                          <h4>
                            {isGraded ? "Grade Details" : "Evaluate Submission"}
                          </h4>

                          <div className="grading-fields">

                            <div>
                              <label>Marks</label>

                              <input
                                type="number"
                                min="0"
                                max={assignment.totalMarks}
                                value={marks[submission._id] ?? ""}
                                onChange={(e) =>
                                  setMarks((prev) => ({
                                    ...prev,
                                    [submission._id]: e.target.value,
                                  }))
                                }
                                disabled={isGraded}
                                placeholder="Enter marks"
                              />

                              <small>
                                Out of {assignment.totalMarks}
                              </small>
                            </div>

                            <div className="grading-feedback">
                              <label>Feedback</label>

                              <textarea
                                value={feedback[submission._id] ?? ""}
                                onChange={(e) =>
                                  setFeedback((prev) => ({
                                    ...prev,
                                    [submission._id]: e.target.value,
                                  }))
                                }
                                disabled={isGraded}
                                placeholder="Write feedback for the student..."
                              />
                            </div>

                          </div>

                          {isGraded ? (

                            <div className="graded-message">
                              ✓ This submission has been graded.
                            </div>

                          ) : (

                            <button
                              className="grade-submit-button"
                              type="button"
                              disabled={grading === submission._id}
                              onClick={() =>
                                handleGrade(submission._id)
                              }
                            >
                              {grading === submission._id
                                ? "Saving..."
                                : "Save Grade"}
                            </button>

                          )}

                        </div>

                      </article>
                    );
                  })}

                </div>
              )}

            </>
          )}

        </section>

      </main>
    </div>
  );
}

export default InstructorSubmissions;