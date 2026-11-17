import { useEffect, useState } from "react";
import API from "../api";
import "../css/Instructors.css";

function Instructors() {
  const [instructors, setInstructors] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const fetchInstructors = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const response = await API.get("/admin/instructors", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setInstructors(response.data.instructors || []);
      setError("");

    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
        "Unable to load instructor applications."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstructors();
  }, []);

  const updateStatus = async (id, status) => {
    const action = status === "approved" ? "approve" : "reject";

    if (!window.confirm(`Are you sure you want to ${action} this instructor?`)) {
      return;
    }

    try {
      setUpdatingId(id);

      const token = localStorage.getItem("token");

      const response = await API.patch(
        `/admin/instructors/${id}/verification`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      // Update the instructor in the frontend
      setInstructors((previous) =>
        previous.map((instructor) =>
          instructor._id === id
            ? {
                ...instructor,
                verificationStatus: response.data.instructor.verificationStatus
              }
            : instructor
        )
      );

      alert(response.data.message);

    } catch (err) {
      alert(
        err.response?.data?.message ||
        "Unable to update instructor status."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredInstructors = instructors.filter((instructor) => {
    const matchesSearch =
      `${instructor.name} ${instructor.email}`
        .toLowerCase()
        .includes(search.toLowerCase());

    const status = instructor.verificationStatus || "pending";

    const matchesFilter =
      filter === "all" || status === filter;

    return matchesSearch && matchesFilter;
  });

  const pendingCount = instructors.filter(
    (item) => item.verificationStatus === "pending"
  ).length;

  const approvedCount = instructors.filter(
    (item) => item.verificationStatus === "approved"
  ).length;

  const rejectedCount = instructors.filter(
    (item) => item.verificationStatus === "rejected"
  ).length;

  return (
    <div className="instructors-page">

      <div className="instructors-header">
        <div>
          <h1>Instructors</h1>
          <p>Review and manage instructor applications.</p>
        </div>

        <button
          className="instructors-refresh-btn"
          onClick={fetchInstructors}
        >
          ↻ Refresh
        </button>
      </div>

      {/* Statistics */}
      <div className="instructors-stats">

        <div className="instructor-stat-card">
          <h3>{instructors.length}</h3>
          <p>Total Instructors</p>
        </div>

        <div className="instructor-stat-card pending-stat">
          <h3>{pendingCount}</h3>
          <p>Pending Applications</p>
        </div>

        <div className="instructor-stat-card approved-stat">
          <h3>{approvedCount}</h3>
          <p>Approved</p>
        </div>

        <div className="instructor-stat-card rejected-stat">
          <h3>{rejectedCount}</h3>
          <p>Rejected</p>
        </div>

      </div>

      <div className="instructors-card">

        <div className="instructors-toolbar">

          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Applications</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

        </div>

        {loading ? (
          <p className="instructors-message">
            Loading instructors...
          </p>
        ) : error ? (
          <p className="instructors-error">{error}</p>
        ) : (
          <div className="instructors-table-wrapper">

            <table className="instructors-table">

              <thead>
                <tr>
                  <th>#</th>
                  <th>Instructor</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Joined Date</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {filteredInstructors.length > 0 ? (
                  filteredInstructors.map((instructor, index) => {

                    const status =
                      instructor.verificationStatus || "pending";

                    return (
                      <tr key={instructor._id}>

                        <td>{index + 1}</td>

                        <td>
                          <div className="instructor-name">
                            <div className="instructor-avatar">
                              {instructor.name?.charAt(0).toUpperCase()}
                            </div>

                            {instructor.name}
                          </div>
                        </td>

                        <td>{instructor.email}</td>

                        <td>
                          <span
                            className={`instructor-status ${status}`}
                          >
                            {status}
                          </span>
                        </td>

                        <td>
                          {instructor.createdAt
                            ? new Date(
                                instructor.createdAt
                              ).toLocaleDateString()
                            : "-"}
                        </td>

                        <td>
                          <div className="instructor-actions">

                            {status !== "approved" && (
                              <button
                                className="approve-btn"
                                disabled={updatingId === instructor._id}
                                onClick={() =>
                                  updateStatus(instructor._id, "approved")
                                }
                              >
                                {updatingId === instructor._id
                                  ? "Updating..."
                                  : "Approve"}
                              </button>
                            )}

                            {status !== "rejected" && (
                              <button
                                className="reject-btn"
                                disabled={updatingId === instructor._id}
                                onClick={() =>
                                  updateStatus(instructor._id, "rejected")
                                }
                              >
                                Reject
                              </button>
                            )}

                          </div>
                        </td>

                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="instructors-empty">
                      No instructor applications found.
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

export default Instructors;