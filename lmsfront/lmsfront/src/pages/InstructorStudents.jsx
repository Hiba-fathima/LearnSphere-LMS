import { useEffect, useState } from "react";
import API from "../api";

import "../css/StudentDashboard.css";
import "../css/InstructorDashboard.css";
import "../css/MyCourses.css";
import "../css/InstructorStudents.css";

function InstructorStudents() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch instructor students
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await API.get("/instructor/students");

        setStudents(response.data.students || []);
      } catch (error) {
        console.error("Error fetching students:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  return (
    <div className="instructor-students-page">

      {/* Topbar */}
      <header className="student-topbar">

        <div>
          <span className="student-topbar-label">
            INSTRUCTOR PORTAL
          </span>

          <h2>My Students</h2>
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

      {/* Page Heading */}
      <section className="my-courses-heading">

        <div>
          <span className="student-section-eyebrow">
            STUDENT MANAGEMENT
          </span>

          <h1>My Students</h1>

          <p>
            View students enrolled in your assigned courses.
          </p>
        </div>

        <div className="my-courses-count">

          <span>👨‍🎓</span>

          <div>
            <small>Total Enrollments</small>
            <h3>{students.length}</h3>
          </div>

        </div>

      </section>

      {/* Students Table */}
      {loading ? (

        <div className="my-courses-message">
          Loading students...
        </div>

      ) : students.length === 0 ? (

        <div className="my-courses-empty">

          <div>👨‍🎓</div>

          <h3>No Students Yet</h3>

          <p>
            Students enrolled in your courses will appear here.
          </p>

        </div>

      ) : (

        <div className="instructor-table-container">

          <table className="instructor-table">

            <thead>
              <tr>
                <th>Sl.No</th>
                <th>Student Name</th>
                <th>Email</th>
                <th>Course</th>
                <th>Category</th>
                <th>Payment Status</th>
              </tr>
            </thead>

            <tbody>

              {students.map((enrollment, index) => (

                <tr key={enrollment._id}>

                  <td>{index + 1}</td>

                  <td>
                    {enrollment.student?.name || "Unknown"}
                  </td>

                  <td>
                    {enrollment.student?.email || "N/A"}
                  </td>

                  <td>
                    {enrollment.course?.title || "N/A"}
                  </td>

                  <td>
                    {enrollment.course?.category || "N/A"}
                  </td>

                  <td>
                    <span className="paid-status">
                      {enrollment.paymentStatus || "Pending"}
                    </span>
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      )}

      {/* Footer */}
      <footer className="student-footer">
        © {new Date().getFullYear()} LearnSphere.
        Inspire. Teach. Transform.
      </footer>

    </div>
  );
}

export default InstructorStudents;