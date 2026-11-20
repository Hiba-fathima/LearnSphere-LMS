import { useEffect, useState } from "react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";

import API from "../api";
import "../css/Reports.css";

function Reports() {
  const [filter, setFilter] = useState("6months");

  const [stats, setStats] = useState({
    totalStudents: 0,
    totalInstructors: 0,
    totalCourses: 0,
    totalEnrollments: 0,
    periodEnrollments: 0,
    periodRevenue: 0,
  });

  const [enrollmentData, setEnrollmentData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [popularCourses, setPopularCourses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const COLORS = [
    "#4f46e5",
    "#06b6d4",
    "#f59e0b",
    "#10b981",
    "#ec4899",
  ];

  // FETCH REAL REPORT DATA
  const fetchReports = async () => {
    try {
      setLoading(true);
      setError("");

      const token =
        localStorage.getItem("adminToken") ||
        localStorage.getItem("token");

      if (!token) {
        setError("Admin authentication token not found. Please login again.");
        return;
      }

      const response = await API.get("/admin/reports", {
        params: {
          range: filter,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setStats(response.data.stats);

        setEnrollmentData(response.data.enrollmentChart || []);

        setRevenueData(response.data.revenueChart || []);

        setPopularCourses(response.data.popularCourses || []);
      }
    } catch (err) {
      console.error("Reports fetching error:", err);

      setError(
        err.response?.data?.message ||
        "Unable to load reports. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [filter]);

  // FORMAT CURRENCY
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  // PIE CHART DATA
  const courseData = popularCourses.map((course) => ({
    name: course.name,
    value: course.students,
  }));

  if (loading) {
    return (
      <div className="reports-page">
        <div className="reports-loading">
          Loading reports...
        </div>
      </div>
    );
  }

  return (
    <div className="reports-page">

      {/* HEADER */}

      <div className="reports-header">
        <div>
          <h1>Reports & Analytics</h1>
          <p>
            Track your LearnSphere platform performance and statistics.
          </p>
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="7days">Last 7 Days</option>
          <option value="30days">Last 30 Days</option>
          <option value="6months">Last 6 Months</option>
          <option value="year">This Year</option>
        </select>
      </div>

      {/* ERROR MESSAGE */}

      {error && (
        <div className="reports-error">
          {error}

          <button onClick={fetchReports}>
            Retry
          </button>
        </div>
      )}

      {!error && (
        <>
          {/* OVERVIEW CARDS */}

          <div className="report-stats">

            <div className="report-card">
              <span>👨‍🎓</span>
              <p>Total Students</p>
              <h2>{stats.totalStudents}</h2>
              <small>Registered students</small>
            </div>

            <div className="report-card">
              <span>👨‍🏫</span>
              <p>Total Instructors</p>
              <h2>{stats.totalInstructors}</h2>
              <small>Registered instructors</small>
            </div>

            <div className="report-card">
              <span>📚</span>
              <p>Total Courses</p>
              <h2>{stats.totalCourses}</h2>
              <small>All courses</small>
            </div>

            <div className="report-card">
              <span>📈</span>
              <p>Total Enrollments</p>
              <h2>{stats.totalEnrollments}</h2>
              <small>All-time enrollments</small>
            </div>

            <div className="report-card">
              <span>💰</span>
              <p>Revenue</p>
              <h2>{formatCurrency(stats.periodRevenue)}</h2>
              <small>Paid enrollments in selected period</small>
            </div>

          </div>

          {/* PERIOD SUMMARY */}

          <div className="report-period-summary">
            <div>
              <h3>{stats.periodEnrollments}</h3>
              <p>Enrollments in selected period</p>
            </div>

            <div>
              <h3>{formatCurrency(stats.periodRevenue)}</h3>
              <p>Revenue in selected period</p>
            </div>
          </div>

          {/* CHARTS */}

          <div className="report-charts">

            {/* ENROLLMENT CHART */}

            <div className="report-chart-box">
              <h3>Enrollment Activity</h3>

              {enrollmentData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={enrollmentData}>
                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis dataKey="month" />

                    <YAxis allowDecimals={false} />

                    <Tooltip />

                    <Bar
                      dataKey="enrollments"
                      name="Enrollments"
                      fill="#4f46e5"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="report-no-data">
                  No enrollment data available for this period.
                </p>
              )}
            </div>

            {/* REVENUE CHART */}

            <div className="report-chart-box">
              <h3>Revenue Overview</h3>

              {revenueData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis dataKey="month" />

                    <YAxis />

                    <Tooltip
                      formatter={(value) => formatCurrency(value)}
                    />

                    <Line
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      stroke="#10b981"
                      strokeWidth={3}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="report-no-data">
                  No revenue data available for this period.
                </p>
              )}
            </div>

          </div>

          {/* BOTTOM SECTION */}

          <div className="report-bottom">

            {/* COURSE DISTRIBUTION */}

            <div className="report-chart-box">
              <h3>Popular Course Distribution</h3>

              {courseData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={courseData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {courseData.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>

                    <Tooltip />

                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="report-no-data">
                  No course enrollment data available.
                </p>
              )}
            </div>

            {/* POPULAR COURSES */}

            <div className="report-chart-box">
              <h3>Popular Courses</h3>

              <div className="popular-course-list">

                {popularCourses.length > 0 ? (
                  popularCourses.map((course, index) => (
                    <div
                      className="popular-course"
                      key={index}
                    >
                      <div>
                        <h4>{course.name}</h4>

                        <p>
                          {course.students} enrollments
                        </p>
                      </div>

                      <span>#{index + 1}</span>
                    </div>
                  ))
                ) : (
                  <p className="report-no-data">
                    No popular courses available.
                  </p>
                )}

              </div>
            </div>

          </div>
        </>
      )}

    </div>
  );
}

export default Reports;