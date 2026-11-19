import { useEffect, useState } from "react";
import axios from "axios";
import "../css/Courses.css";

const API_URL =
  "https://learnsphere-lms-vkzs.onrender.com/api/courses";

const INSTRUCTOR_API =
  "https://learnsphere-lms-vkzs.onrender.com/api/admin/instructors/approved";

const CATEGORY_API =
  "https://learnsphere-lms-vkzs.onrender.com/api/categories";

function Courses() {
  const [courses, setCourses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [instructorsLoading, setInstructorsLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const emptyForm = {
    title: "",
    category: "",
    instructorId: "",
    price: "",
    duration: "",
    status: "Published",
  };

  const [formData, setFormData] = useState(emptyForm);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  // =====================================
  // AUTHORIZATION HEADER
  // =====================================

  const getAuthConfig = () => {
    const token = localStorage.getItem("token");

    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  // =====================================
  // FETCH ALL COURSES
  // =====================================

  const fetchCourses = async () => {
    try {
      const response = await axios.get(API_URL);

      const courseList = Array.isArray(response.data)
        ? response.data
        : response.data.courses || [];

      setCourses(courseList);
    } catch (error) {
      console.error("Error fetching courses:", error);

      alert(
        "Could not load courses. Please check that the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // FETCH APPROVED INSTRUCTORS
  // =====================================

  const fetchInstructors = async () => {
    try {
      setInstructorsLoading(true);

      const response = await axios.get(
        INSTRUCTOR_API,
        getAuthConfig()
      );

      setInstructors(response.data.instructors || []);
    } catch (error) {
      console.error("Error fetching instructors:", error);

      setInstructors([]);

      alert(
        error.response?.data?.message ||
          "Could not load approved instructors."
      );
    } finally {
      setInstructorsLoading(false);
    }
  };

  // =====================================
  // FETCH ADMIN-ADDED CATEGORIES
  // =====================================

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);

      const response = await axios.get(
        CATEGORY_API,
        getAuthConfig()
      );

      const categoryList = Array.isArray(response.data)
        ? response.data
        : response.data.categories || [];

      setCategories(categoryList);
    } catch (error) {
      console.error("Error fetching categories:", error);

      setCategories([]);

      console.error(
        "Please check whether GET /api/categories exists in your backend."
      );
    } finally {
      setCategoriesLoading(false);
    }
  };

  // =====================================
  // INITIAL LOAD
  // =====================================

  useEffect(() => {
    fetchCourses();
    fetchInstructors();
    fetchCategories();
  }, []);

  // =====================================
  // OPEN ADD COURSE FORM
  // =====================================

  const handleAddCourse = () => {
    setFormData(emptyForm);
    setEditId(null);
    setShowForm(true);
  };

  // =====================================
  // HANDLE INPUT CHANGES
  // =====================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =====================================
  // ADD OR UPDATE COURSE
  // =====================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.title.trim() ||
      !formData.category ||
      !formData.instructorId ||
      formData.price === "" ||
      !formData.duration.trim()
    ) {
      alert("Please fill in all required fields.");
      return;
    }

    if (
      !Number.isFinite(Number(formData.price)) ||
      Number(formData.price) < 0
    ) {
      alert("Please enter a valid course price.");
      return;
    }

    // Find selected instructor
    const selectedInstructor = instructors.find(
      (instructor) =>
        instructor._id === formData.instructorId
    );

    if (!selectedInstructor) {
      alert("Please select a valid approved instructor.");
      return;
    }

    // Data sent to backend
    const courseData = {
      title: formData.title.trim(),
      category: formData.category,
      instructorId: selectedInstructor._id,
      price: Number(formData.price),
      duration: formData.duration.trim(),
      status: formData.status,
    };

    try {
      setSaving(true);

      if (editId) {
        await axios.put(
          `${API_URL}/${editId}`,
          courseData,
          getAuthConfig()
        );

        alert("Course updated successfully!");
      } else {
        await axios.post(
          API_URL,
          courseData,
          getAuthConfig()
        );

        alert("Course added successfully!");
      }

      await fetchCourses();

      setFormData(emptyForm);
      setEditId(null);
      setShowForm(false);
    } catch (error) {
      console.error("Error saving course:", error);

      alert(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Could not save course. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================
  // EDIT COURSE
  // =====================================

  const handleEdit = (course) => {
    // Match instructor by ID or name
    const matchedInstructor = instructors.find(
      (instructor) =>
        instructor._id === course.instructorId ||
        (
          !course.instructorId &&
          instructor.name === course.instructor
        )
    );

    setFormData({
      title: course.title || "",
      category: course.category || "",
      instructorId: matchedInstructor?._id || "",
      price: String(course.price ?? ""),
      duration: course.duration || "",
      status: course.status || "Published",
    });

    setEditId(course._id);
    setShowForm(true);
  };

  // =====================================
  // DELETE COURSE
  // =====================================

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this course?"
    );

    if (!confirmDelete) return;

    try {
      await axios.delete(
        `${API_URL}/${id}`,
        getAuthConfig()
      );

      await fetchCourses();

      alert("Course deleted successfully!");
    } catch (error) {
      console.error("Error deleting course:", error);

      alert(
        error.response?.data?.message ||
          "Could not delete course. Please try again."
      );
    }
  };

  // =====================================
  // CLOSE FORM
  // =====================================

  const closeForm = () => {
    setShowForm(false);
    setEditId(null);
    setFormData(emptyForm);
  };

  // =====================================
  // SEARCH AND FILTER
  // =====================================

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      course.instructor
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesCategory =
      categoryFilter === "All" ||
      course.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  // =====================================
  // STATISTICS
  // =====================================

  const publishedCount = courses.filter(
    (course) => course.status === "Published"
  ).length;

  const draftCount = courses.filter(
    (course) => course.status === "Draft"
  ).length;

  // =====================================
  // MAIN DESIGN
  // =====================================

  return (
    <div className="courses-page">

      {/* PAGE HEADING */}

      <div className="courses-page-header">
        <div>
          <span className="courses-eyebrow">
            LEARNSPHERE ADMIN
          </span>

          <h1>Course Management</h1>

          <p>
            Create, manage, and organize courses on your learning platform.
          </p>
        </div>

        <button
          type="button"
          className="add-course-button"
          onClick={handleAddCourse}
        >
          <span>＋</span> Add New Course
        </button>
      </div>

      {/* STATISTICS */}

      <div className="course-stats-grid">

        <div className="course-stat-card">
          <div className="course-stat-icon total-icon">
            ▤
          </div>

          <div>
            <p>Total Courses</p>
            <h2>{courses.length}</h2>
          </div>
        </div>

        <div className="course-stat-card">
          <div className="course-stat-icon published-icon">
            ✓
          </div>

          <div>
            <p>Published</p>
            <h2>{publishedCount}</h2>
          </div>
        </div>

        <div className="course-stat-card">
          <div className="course-stat-icon draft-icon">
            ◷
          </div>

          <div>
            <p>Draft Courses</p>
            <h2>{draftCount}</h2>
          </div>
        </div>

      </div>

      {/* ADD / EDIT FORM */}

      {showForm && (
        <div className="course-form-card">

          <div className="course-form-heading">
            <div>
              <h2>
                {editId ? "Edit Course" : "Add New Course"}
              </h2>

              <p>
                {editId
                  ? "Update the course information below."
                  : "Enter the details to create a new course."}
              </p>
            </div>

            <button
              type="button"
              className="close-course-form"
              onClick={closeForm}
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit}>

            <div className="course-form-grid">

              {/* COURSE TITLE */}

              <div className="course-form-group">
                <label>Course Title *</label>

                <input
                  type="text"
                  name="title"
                  placeholder="Enter course title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* DYNAMIC CATEGORY DROPDOWN */}

              <div className="course-form-group">
                <label>Category *</label>

                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  disabled={categoriesLoading}
                >
                  <option value="">
                    {categoriesLoading
                      ? "Loading categories..."
                      : "Select category"}
                  </option>

                  {categories.map((category) => (
                    <option
                      key={category._id}
                      value={category.name}
                    >
                      {category.name}
                    </option>
                  ))}

                </select>

                {!categoriesLoading &&
                  categories.length === 0 && (
                    <small>
                      No categories available. Please add categories first.
                    </small>
                  )}
              </div>

              {/* INSTRUCTOR DROPDOWN */}

              <div className="course-form-group">
                <label>Instructor *</label>

                <select
                  name="instructorId"
                  value={formData.instructorId}
                  onChange={handleChange}
                  required
                  disabled={instructorsLoading}
                >
                  <option value="">
                    {instructorsLoading
                      ? "Loading instructors..."
                      : "Select an instructor"}
                  </option>

                  {instructors.map((instructor) => (
                    <option
                      key={instructor._id}
                      value={instructor._id}
                    >
                      {instructor.name}
                    </option>
                  ))}
                </select>

                {!instructorsLoading &&
                  instructors.length === 0 && (
                    <small>
                      No approved instructors available.
                    </small>
                  )}
              </div>

              {/* PRICE */}

              <div className="course-form-group">
                <label>Price (₹) *</label>

                <input
                  type="number"
                  name="price"
                  placeholder="Enter course price"
                  min="0"
                  value={formData.price}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* DURATION */}

              <div className="course-form-group">
                <label>Duration *</label>

                <input
                  type="text"
                  name="duration"
                  placeholder="Example: 8 Weeks"
                  value={formData.duration}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* STATUS */}

              <div className="course-form-group">
                <label>Status *</label>

                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="Published">
                    Published
                  </option>

                  <option value="Draft">
                    Draft
                  </option>
                </select>
              </div>

            </div>

            {/* FORM BUTTONS */}

            <div className="course-form-actions">

              <button
                type="button"
                className="cancel-course-button"
                onClick={closeForm}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="save-course-button"
                disabled={
                  saving ||
                  instructorsLoading ||
                  categoriesLoading ||
                  instructors.length === 0 ||
                  categories.length === 0
                }
              >
                {saving
                  ? "Saving..."
                  : editId
                    ? "Update Course"
                    : "Save Course"}
              </button>

            </div>

          </form>
        </div>
      )}

      {/* COURSE LIST */}

      <div className="course-list-card">

        <div className="course-list-header">
          <div>
            <h2>All Courses</h2>

            <p>
              View and manage all available courses.
            </p>
          </div>

          <span className="course-count">
            {filteredCourses.length} courses
          </span>
        </div>

        {/* SEARCH AND FILTER */}

        <div className="course-toolbar">

          <div className="course-search-box">
            <span>⌕</span>

            <input
              type="text"
              placeholder="Search courses or instructors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* DYNAMIC CATEGORY FILTER */}

          <select
            className="course-filter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="All">
              All Categories
            </option>

            {categories.map((category) => (
              <option
                key={category._id}
                value={category.name}
              >
                {category.name}
              </option>
            ))}
          </select>

        </div>

        {/* COURSE TABLE */}

        <div className="course-table-wrapper">

          <table className="course-table">

            <thead>
              <tr>
                <th>COURSE</th>
                <th>CATEGORY</th>
                <th>INSTRUCTOR</th>
                <th>PRICE</th>
                <th>DURATION</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>

              {loading ? (

                <tr>
                  <td colSpan="7" className="course-empty-state">
                    <p>Loading courses...</p>
                  </td>
                </tr>

              ) : filteredCourses.length > 0 ? (

                filteredCourses.map((course) => (
                  <tr key={course._id}>

                    <td>
                      <div className="course-title-cell">
                        <div className="course-table-icon">
                          📚
                        </div>

                        <span>{course.title}</span>
                      </div>
                    </td>

                    <td>
                      <span className="course-category">
                        {course.category}
                      </span>
                    </td>

                    <td>
                      {course.instructor}
                    </td>

                    <td className="course-price">
                      ₹{Number(course.price).toLocaleString("en-IN")}
                    </td>

                    <td>{course.duration}</td>

                    <td>
                      <span
                        className={`course-status ${
                          course.status === "Published"
                            ? "status-published"
                            : "status-draft"
                        }`}
                      >
                        {course.status}
                      </span>
                    </td>

                    <td>
                      <div className="course-action-buttons">

                        <button
                          type="button"
                          className="course-edit-button"
                          title="Edit course"
                          onClick={() => handleEdit(course)}
                        >
                          ✎
                        </button>

                        <button
                          type="button"
                          className="course-delete-button"
                          title="Delete course"
                          onClick={() => handleDelete(course._id)}
                        >
                          🗑
                        </button>

                      </div>
                    </td>

                  </tr>
                ))

              ) : (

                <tr>
                  <td colSpan="7" className="course-empty-state">
                    <div>📚</div>

                    <h3>No courses found</h3>

                    <p>
                      Try another search or add a new course.
                    </p>
                  </td>
                </tr>

              )}

            </tbody>

          </table>

        </div>

        {/* FOOTER */}

        <div className="course-list-footer">
          Showing {filteredCourses.length} of {courses.length} courses
        </div>

      </div>

    </div>
  );
}

export default Courses;