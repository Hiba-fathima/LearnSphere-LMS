import { useEffect, useState } from "react";
import API from "../api";
import "../css/Students.css";

function Students() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const response = await API.get("/admin/users?role=student", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setStudents(response.data.users || response.data);
      setError("");
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || "Unable to load students."
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter((student) =>
    `${student.name} ${student.email}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="students-page">
      <div className="students-header">
        <div>
          <h1>Students</h1>
          <p>Manage all students registered in LearnSphere.</p>
        </div>

        <div className="students-count">
          Total Students: <strong>{students.length}</strong>
        </div>
      </div>

      <div className="students-card">
        <div className="students-toolbar">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <p className="students-message">Loading students...</p>
        ) : error ? (
          <p className="students-error">{error}</p>
        ) : (
          <div className="students-table-wrapper">
            <table className="students-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined Date</th>
                </tr>
              </thead>

              <tbody>
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student, index) => (
                    <tr key={student._id}>
                      <td>{index + 1}</td>

                      <td>
                        <div className="student-name">
                          <div className="student-avatar">
                            {student.name?.charAt(0).toUpperCase()}
                          </div>
                          {student.name}
                        </div>
                      </td>

                      <td>{student.email}</td>

                      <td>
                        <span className="student-role">
                          {student.role}
                        </span>
                      </td>

                      <td>
                        <span className="student-status">
                          Active
                        </span>
                      </td>

                      <td>
                        {student.createdAt
                          ? new Date(student.createdAt).toLocaleDateString()
                          : "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="students-empty">
                      No students found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Students;