import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

import "../css/StudentDashboard.css";
import "../css/InstructorDashboard.css";
import "../css/InstructorAssignments.css";

function InstructorAssignments() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedSection, setSelectedSection] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: "",
    totalMarks: 100,
  });

  // Fetch instructor courses and assignments
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [courseResponse, assignmentResponse] = await Promise.all([
        API.get("/instructor/courses"),
        API.get("/assignments/instructor"),
      ]);

      const courseList = Array.isArray(courseResponse.data)
        ? courseResponse.data
        : courseResponse.data.courses || [];

      setCourses(courseList);

      setAssignments(
        Array.isArray(assignmentResponse.data)
          ? assignmentResponse.data
          : []
      );
    } catch (error) {
      console.error("Error fetching assignment data:", error);

      setMessage(
        error.response?.data?.message || "Failed to load data."
      );
    } finally {
      setLoading(false);
    }
  };

  // Selected course
  const currentCourse = courses.find(
    (course) => course._id === selectedCourse
  );

  const sections = currentCourse?.sections || [];

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle course selection
  const handleCourseChange = (e) => {
    setSelectedCourse(e.target.value);
    setSelectedSection("");
  };

  // Create assignment
  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");

    if (!selectedCourse || !selectedSection) {
      setMessage("Please select a course and section.");
      return;
    }

    if (!formData.title.trim() || !formData.description.trim()) {
      setMessage("Please enter the assignment title and description.");
      return;
    }

    if (!formData.dueDate) {
      setMessage("Please select a due date.");
      return;
    }

    if (Number(formData.totalMarks) < 1) {
      setMessage("Total marks must be at least 1.");
      return;
    }

    try {
      setSaving(true);

      const response = await API.post(
        `/assignments/instructor/${selectedCourse}/${selectedSection}`,
        {
          ...formData,
          totalMarks: Number(formData.totalMarks),
        }
      );

      setMessage(
        response.data.message || "Assignment created successfully!"
      );

      setFormData({
        title: "",
        description: "",
        dueDate: "",
        totalMarks: 100,
      });

      setSelectedCourse("");
      setSelectedSection("");

      await fetchData();
    } catch (error) {
      console.error("Create assignment error:", error);

      setMessage(
        error.response?.data?.message ||
          "Failed to create assignment."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="instructor-assignments-page">

      {/* Topbar */}
      <header className="student-topbar">

        <div>
          <span className="student-topbar-label">
            INSTRUCTOR PORTAL
          </span>

          <h2>Assignments</h2>
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

      {/* Heading */}
      <section className="instructor-assignment-heading">

        <div>
          <span className="student-section-eyebrow">
            LEARNING MANAGEMENT
          </span>

          <h1>Manage Assignments</h1>

          <p>
            Create assignments for individual course sections
            and evaluate student submissions.
          </p>
        </div>

        <div className="assignment-count-card">
          <span>📝</span>

          <div>
            <small>Total Assignments</small>
            <h3>{assignments.length}</h3>
          </div>
        </div>

      </section>

      {/* Create Assignment */}
      <section className="assignment-form-card">

        <div className="assignment-form-heading">
          <h2>Create New Assignment</h2>

          <p>
            Select a course and section before creating an assignment.
          </p>
        </div>

        {message && (
          <div className="assignment-message">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          <div className="assignment-form-grid">

            {/* Course */}
            <div className="assignment-input-group">
              <label>Select Course *</label>

              <select
                value={selectedCourse}
                onChange={handleCourseChange}
                required
              >
                <option value="">Choose a course</option>

                {courses.map((course) => (
                  <option
                    key={course._id}
                    value={course._id}
                  >
                    {course.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Section */}
            <div className="assignment-input-group">
              <label>Select Section *</label>

              <select
                value={selectedSection}
                onChange={(e) =>
                  setSelectedSection(e.target.value)
                }
                required
                disabled={!selectedCourse}
              >
                <option value="">Choose a section</option>

                {sections.map((section) => (
                  <option
                    key={section._id}
                    value={section._id}
                  >
                    {section.title}
                  </option>
                ))}
              </select>

              {selectedCourse && sections.length === 0 && (
                <small className="assignment-hint">
                  No sections available. Add sections to this course first.
                </small>
              )}
            </div>

            {/* Title */}
            <div className="assignment-input-group full-width">
              <label>Assignment Title *</label>

              <input
                type="text"
                name="title"
                placeholder="Example: HTML Basics Assignment"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            {/* Description */}
            <div className="assignment-input-group full-width">
              <label>Assignment Description *</label>

              <textarea
                name="description"
                placeholder="Explain the assignment requirements..."
                value={formData.description}
                onChange={handleChange}
                rows="5"
                required
              />
            </div>

            {/* Due Date */}
            <div className="assignment-input-group">
              <label>Due Date *</label>

              <input
                type="datetime-local"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                min={
                  new Date(
                    Date.now() - new Date().getTimezoneOffset() * 60000
                  )
                    .toISOString()
                    .slice(0, 16)
                }
                required
              />
            </div>

            {/* Marks */}
            <div className="assignment-input-group">
              <label>Total Marks *</label>

              <input
                type="number"
                name="totalMarks"
                min="1"
                value={formData.totalMarks}
                onChange={handleChange}
                required
              />
            </div>

          </div>

          <button
            type="submit"
            className="create-assignment-button"
            disabled={saving || sections.length === 0}
          >
            {saving ? "Creating..." : "+ Create Assignment"}
          </button>

        </form>
      </section>

      {/* Existing Assignments */}
      <section className="instructor-assignment-list">

        <div className="assignment-list-heading">
          <div>
            <span className="student-section-eyebrow">
              YOUR WORK
            </span>

            <h2>Created Assignments</h2>
          </div>
        </div>

        {loading ? (
          <div className="assignment-empty">
            Loading assignments...
          </div>
        ) : assignments.length === 0 ? (
          <div className="assignment-empty">
            <span>📝</span>

            <h3>No Assignments Yet</h3>

            <p>Your created assignments will appear here.</p>
          </div>
        ) : (
          <div className="assignment-list">

            {assignments.map((assignment) => (
              <article
                className="assignment-list-card"
                key={assignment._id}
              >

                <div className="assignment-list-icon">
                  📝
                </div>

                <div className="assignment-list-details">

                  <h3>{assignment.title}</h3>

                  <p>
                    Course: {assignment.courseId?.title || "Course"}
                  </p>

                  <p>
                    Due:{" "}
                    {new Date(assignment.dueDate).toLocaleString()}
                  </p>

                  <span>
                    Total Marks: {assignment.totalMarks}
                  </span>

                </div>

                <button
                  type="button"
                  className="assignment-view-button"
                  onClick={() =>
                    navigate(
                      `/instructor/assignments/${assignment._id}/submissions`
                    )
                  }
                >
                  View Submissions →
                </button>

              </article>
            ))}

          </div>
        )}

      </section>

      <footer className="student-footer">
        © {new Date().getFullYear()} LearnSphere.
        Inspire. Teach. Transform.
      </footer>

    </div>
  );
}

export default InstructorAssignments;