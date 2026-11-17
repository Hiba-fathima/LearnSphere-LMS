import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

import "../css/StudentDashboard.css";
import "../css/InstructorDashboard.css";
import "../css/MyCourses.css";

function MyCourses() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [editingSection, setEditingSection] = useState(null);

  const [sectionTitle, setSectionTitle] = useState("");
  const [sectionDescription, setSectionDescription] = useState("");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Fetch courses
  const fetchCourses = async () => {
    try {
      const response = await API.get("/instructor/courses");

      const courseList = Array.isArray(response.data)
        ? response.data
        : response.data.courses || [];

      setCourses(courseList);
    } catch (error) {
      console.error("Error fetching courses:", error);

      setMessage(
        error.response?.data?.message || "Failed to load courses"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Reset form
  const resetForm = () => {
    setSectionTitle("");
    setSectionDescription("");
    setEditingSection(null);
  };

  // Open add section form
  const handleAddSection = (course) => {
    setSelectedCourse(course);
    resetForm();
    setMessage("");
  };

  // Open edit section form
  const handleEditSection = (course, section) => {
    setSelectedCourse(course);
    setEditingSection(section);

    setSectionTitle(section.title);
    setSectionDescription(section.description || "");

    setMessage("");
  };

  // Save section
  const handleSaveSection = async (e) => {
    e.preventDefault();

    if (!sectionTitle.trim()) {
      setMessage("Please enter a section title");
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      if (editingSection) {
        await API.put(
          `/instructor/courses/${selectedCourse._id}/sections/${editingSection._id}`,
          {
            title: sectionTitle,
            description: sectionDescription,
          }
        );

        setMessage("Section updated successfully");
      } else {
        await API.post(
          `/instructor/courses/${selectedCourse._id}/sections`,
          {
            title: sectionTitle,
            description: sectionDescription,
          }
        );

        setMessage("Section added successfully");
      }

      await fetchCourses();

      setSectionTitle("");
      setSectionDescription("");
      setEditingSection(null);

    } catch (error) {
      console.error("Section save error:", error);

      setMessage(
        error.response?.data?.message || "Unable to save section"
      );
    } finally {
      setSaving(false);
    }
  };

  // Delete section
  const handleDeleteSection = async (courseId, sectionId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this section?"
    );

    if (!confirmDelete) return;

    try {
      await API.delete(
        `/instructor/courses/${courseId}/sections/${sectionId}`
      );

      setMessage("Section deleted successfully");

      if (
        editingSection?._id === sectionId &&
        selectedCourse?._id === courseId
      ) {
        resetForm();
        setSelectedCourse(null);
      }

      await fetchCourses();

    } catch (error) {
      console.error("Delete section error:", error);

      setMessage(
        error.response?.data?.message || "Unable to delete section"
      );
    }
  };

  return (
    <div className="my-courses-page">

      {/* Topbar */}
      <header className="student-topbar">

        <div>
          <span className="student-topbar-label">
            INSTRUCTOR PORTAL
          </span>

          <h2>My Courses</h2>
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
      <section className="my-courses-heading">

        <div>
          <span className="student-section-eyebrow">
            COURSE MANAGEMENT
          </span>

          <h1>My Courses</h1>

          <p>
            Manage your courses and organize their learning sections.
          </p>
        </div>

        <div className="my-courses-count">
          <span>📚</span>

          <div>
            <small>Total Courses</small>
            <h3>{courses.length}</h3>
          </div>
        </div>

      </section>

      {message && (
        <div className="section-message">
          {message}
        </div>
      )}

      {/* Courses */}
      {loading ? (

        <div className="my-courses-message">
          Loading courses...
        </div>

      ) : courses.length === 0 ? (

        <div className="my-courses-empty">
          <div>📚</div>

          <h3>No Courses Assigned Yet</h3>

          <p>
            Courses assigned to you will appear here.
          </p>
        </div>

      ) : (

        <div className="instructor-course-grid">

          {courses.map((course) => (

            <article
              className="instructor-course-card"
              key={course._id}
            >

              <div className="my-course-cover">
                <span>{course.category}</span>
                <div>📘</div>
              </div>

              <div className="my-course-body">

                <h3>{course.title}</h3>

                <p>
                  <strong>Duration:</strong> {course.duration}
                </p>

                <p>
                  <strong>Price:</strong>{" "}
                  ₹{Number(course.price).toLocaleString("en-IN")}
                </p>

                <div className="my-course-footer">

                  <span
                    className={`my-course-status ${
                      course.status === "Published"
                        ? "published"
                        : "draft"
                    }`}
                  >
                    {course.status}
                  </span>

                </div>

                {/* Course Sections */}
                <div className="course-sections">

                  <div className="course-sections-heading">
                    <h4>Course Sections</h4>

                    <span>
                      {course.sections?.length || 0} Sections
                    </span>
                  </div>

                  {course.sections?.length > 0 ? (

                    <div className="course-section-list">

                      {course.sections
                        .slice()
                        .sort((a, b) => a.order - b.order)
                        .map((section, index) => (

                          <div
                            className="course-section-item"
                            key={section._id}
                          >

                            <div className="course-section-number">
                              {index + 1}
                            </div>

                            <div className="course-section-info">
                              <strong>{section.title}</strong>

                              <small>
                                {section.description || "No description"}
                              </small>
                            </div>

                            <div className="course-section-actions">

                              <button
                                type="button"
                                onClick={() =>
                                  handleEditSection(course, section)
                                }
                                title="Edit section"
                              >
                                ✏️
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteSection(
                                    course._id,
                                    section._id
                                  )
                                }
                                title="Delete section"
                              >
                                🗑️
                              </button>

                            </div>

                          </div>

                        ))}

                    </div>

                  ) : (

                    <p className="no-sections">
                      No sections added yet.
                    </p>

                  )}

                  <button
                    type="button"
                    className="add-section-button"
                    onClick={() => handleAddSection(course)}
                  >
                    + Add Section
                  </button>

                </div>

              </div>

            </article>

          ))}

        </div>

      )}

      <footer className="student-footer">
        © {new Date().getFullYear()} LearnSphere.
        Inspire. Teach. Transform.
      </footer>

      {/* Section Modal */}
      {selectedCourse && (

        <div className="section-modal-overlay">

          <div className="section-modal">

            <button
              type="button"
              className="section-modal-close"
              onClick={() => {
                setSelectedCourse(null);
                resetForm();
                setMessage("");
              }}
            >
              ×
            </button>

            <h2>
              {editingSection ? "Edit Section" : "Add New Section"}
            </h2>

            <p>{selectedCourse.title}</p>

            <form onSubmit={handleSaveSection}>

              <label>Section Title *</label>

              <input
                type="text"
                placeholder="Example: HTML Basics"
                value={sectionTitle}
                onChange={(e) => setSectionTitle(e.target.value)}
                required
              />

              <label>Section Description</label>

              <textarea
                placeholder="Enter section description..."
                rows="4"
                value={sectionDescription}
                onChange={(e) =>
                  setSectionDescription(e.target.value)
                }
              />

              {message && (
                <div className="section-modal-message">
                  {message}
                </div>
              )}

              <button
                type="submit"
                className="section-save-button"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingSection
                  ? "Update Section"
                  : "Save Section"}
              </button>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default MyCourses;