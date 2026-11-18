import React, { useEffect, useState } from "react";
import "../css/Enrollment.css";

function Enrollments() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Admin login required. Please log in first.");
      }

      const response = await fetch(
        "https://learnsphere-lms-vkzs.onrender.com/api/enrollments/admin/all",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to fetch enrollments");
      }

      setEnrollments(data.enrollments || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const filteredEnrollments = enrollments.filter((item) => {
    const studentName = item.student?.name || "";
    const studentEmail = item.student?.email || "";
    const courseName =
      item.course?.title ||
      item.course?.courseName ||
      item.course?.name ||
      "";

    const searchMatch =
      studentName.toLowerCase().includes(search.toLowerCase()) ||
      studentEmail.toLowerCase().includes(search.toLowerCase()) ||
      courseName.toLowerCase().includes(search.toLowerCase());

    const statusMatch =
      statusFilter === "All" ||
      item.paymentStatus === statusFilter;

    return searchMatch && statusMatch;
  });

  const paidCount = enrollments.filter(
    (item) => item.paymentStatus === "Paid"
  ).length;

  const pendingCount = enrollments.filter(
    (item) => item.paymentStatus === "Pending Payment"
  ).length;

  const failedCount = enrollments.filter(
    (item) => item.paymentStatus === "Failed"
  ).length;

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="admin-page enrollments-page">

      <div className="admin-page-header">
        <div>
          <p className="admin-eyebrow">LEARNSPHERE ADMIN</p>
          <h1>Enrollments</h1>
          <p>Manage student course enrollments and payments.</p>
        </div>

        <button
          className="enrollment-refresh-btn"
          onClick={fetchEnrollments}
        >
          ↻ Refresh
        </button>
      </div>

      {/* Statistics */}

      <div className="enrollment-stats">

        <div className="enrollment-stat-card">
          <span>Total Enrollments</span>
          <h2>{enrollments.length}</h2>
        </div>

        <div className="enrollment-stat-card">
          <span>Paid Enrollments</span>
          <h2>{paidCount}</h2>
        </div>

        <div className="enrollment-stat-card">
          <span>Pending Payments</span>
          <h2>{pendingCount}</h2>
        </div>

        <div className="enrollment-stat-card">
          <span>Failed Payments</span>
          <h2>{failedCount}</h2>
        </div>

      </div>

      {/* Search and Filter */}

      <div className="enrollment-toolbar">

        <input
          type="text"
          placeholder="Search student or course..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All Payments</option>
          <option value="Paid">Paid</option>
          <option value="Pending Payment">Pending Payment</option>
          <option value="Failed">Failed</option>
          <option value="Refunded">Refunded</option>
        </select>

      </div>

      {/* Enrollment Table */}

      <div className="enrollment-table-card">

        {loading ? (
          <p className="enrollment-message">Loading enrollments...</p>
        ) : error ? (
          <div className="enrollment-message enrollment-error">
            {error}
          </div>
        ) : filteredEnrollments.length === 0 ? (
          <p className="enrollment-message">
            No enrollments found.
          </p>
        ) : (

          <div className="enrollment-table-wrapper">

            <table className="enrollment-table">

              <thead>
                <tr>
                  <th>Student</th>
                  <th>Course</th>
                  <th>Amount</th>
                  <th>Payment Status</th>
                  <th>Enrollment Date</th>
                  <th>Details</th>
                </tr>
              </thead>

              <tbody>

                {filteredEnrollments.map((item) => (

                  <tr key={item._id}>

                    <td>
                      <div className="enrollment-student">
                        <strong>
                          {item.student?.name || "Unknown"}
                        </strong>
                        <span>
                          {item.student?.email || "-"}
                        </span>
                      </div>
                    </td>

                    <td>
                      {item.course?.title ||
                        item.course?.courseName ||
                        item.course?.name ||
                        "Unknown Course"}
                    </td>

                    <td>
                      ₹{Number(item.amount || 0).toLocaleString("en-IN")}
                    </td>

                    <td>
                      <span
                        className={`payment-badge ${(
                          item.paymentStatus || "unknown"
                        )
                          .toLowerCase()
                          .replace(/\s+/g, "-")}`}
                      >
                        {item.paymentStatus || "Unknown"}
                      </span>
                    </td>

                    <td>{formatDate(item.createdAt)}</td>

                    <td>
                      <button
                        className="enrollment-view-btn"
                        onClick={() => setSelectedEnrollment(item)}
                      >
                        View
                      </button>
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>

      {/* Enrollment Details Modal */}

      {selectedEnrollment && (

        <div
          className="enrollment-modal-overlay"
          onClick={() => setSelectedEnrollment(null)}
        >

          <div
            className="enrollment-modal"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="enrollment-modal-header">
              <h2>Enrollment Details</h2>

              <button
                onClick={() => setSelectedEnrollment(null)}
              >
                ×
              </button>
            </div>

            <div className="enrollment-details">

              <h3>Student Information</h3>

              <p>
                <strong>Name:</strong>{" "}
                {selectedEnrollment.student?.name || "-"}
              </p>

              <p>
                <strong>Email:</strong>{" "}
                {selectedEnrollment.student?.email || "-"}
              </p>

              <h3>Course Information</h3>

              <p>
                <strong>Course:</strong>{" "}
                {selectedEnrollment.course?.title ||
                  selectedEnrollment.course?.courseName ||
                  selectedEnrollment.course?.name ||
                  "Unknown Course"}
              </p>

              <p>
                <strong>Amount:</strong>{" "}
                ₹{selectedEnrollment.amount}
              </p>

              <h3>Payment Information</h3>

              <p>
                <strong>Status:</strong>{" "}
                {selectedEnrollment.paymentStatus}
              </p>

              <p>
                <strong>Payment ID:</strong>{" "}
                {selectedEnrollment.paymentId || "-"}
              </p>

              <p>
                <strong>Order ID:</strong>{" "}
                {selectedEnrollment.orderId || "-"}
              </p>

              <p>
                <strong>Enrollment Date:</strong>{" "}
                {formatDate(selectedEnrollment.createdAt)}
              </p>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default Enrollments;