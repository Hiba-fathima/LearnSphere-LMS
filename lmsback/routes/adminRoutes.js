const express = require("express");
const router = express.Router();

const jwt = require("jsonwebtoken");

const Admin = require("../models/AdminModel");
const User = require("../models/UserModel");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");

// ==========================================
// ADMIN AUTHENTICATION
// ==========================================

const verifyAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Admin token missing",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "admin" || !decoded.id) {
      return res.status(403).json({
        success: false,
        message: "Admin access only",
      });
    }

    const admin = await Admin.findById(decoded.id);

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Admin not found",
      });
    }

    req.admin = admin;
    next();

  } catch (error) {
    console.error("Admin verification error:", error);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};


// ==========================================
// GET STUDENTS AND INSTRUCTORS
// ==========================================

router.get("/users", verifyAdmin, async (req, res) => {
  try {
    const { role } = req.query;

    if (!["student", "instructor"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user role",
      });
    }

    const users = await User.find({ role })
      .select("-password")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });

  } catch (error) {
    console.error("Fetch users error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch users",
    });
  }
});


// ==========================================
// ADMIN REPORTS API
// ==========================================

router.get("/reports", verifyAdmin, async (req, res) => {
  try {

    const { range = "6months" } = req.query;

    const now = new Date();
    const startDate = new Date(now);

    // DATE FILTER
    switch (range) {

      case "7days":
        startDate.setDate(now.getDate() - 7);
        break;

      case "30days":
        startDate.setDate(now.getDate() - 30);
        break;

      case "6months":
        startDate.setMonth(now.getMonth() - 6);
        break;

      case "year":
        startDate.setMonth(0, 1);
        startDate.setHours(0, 0, 0, 0);
        break;

      default:
        return res.status(400).json({
          success: false,
          message: "Invalid date range",
        });
    }


    // ======================================
    // 1. TOTAL STUDENTS
    // ======================================

    const totalStudents = await User.countDocuments({
      role: "student",
    });


    // ======================================
    // 2. TOTAL INSTRUCTORS
    // ======================================

    const totalInstructors = await User.countDocuments({
      role: "instructor",
    });


    // ======================================
    // 3. TOTAL COURSES
    // ======================================

    const totalCourses = await Course.countDocuments();


    // ======================================
    // 4. TOTAL ENROLLMENTS
    // ======================================

    const totalEnrollments = await Enrollment.countDocuments();


    // ======================================
    // 5. PERIOD ENROLLMENTS
    // ======================================

    const periodEnrollments = await Enrollment.countDocuments({
      createdAt: {
        $gte: startDate,
        $lte: now,
      },
    });


    // ======================================
    // 6. TOTAL REVENUE
    // ======================================

    const revenueResult = await Enrollment.aggregate([
      {
        $match: {
          paymentStatus: "Paid",
          createdAt: {
            $gte: startDate,
            $lte: now,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: "$amount",
          },
        },
      },
    ]);

    const periodRevenue =
      revenueResult.length > 0
        ? revenueResult[0].totalRevenue
        : 0;


    // ======================================
    // 7. ENROLLMENT CHART
    // ======================================

    const dateFormat =
      range === "7days" || range === "30days"
        ? "%d %b"
        : "%b %Y";

    const enrollmentChart = await Enrollment.aggregate([

      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: now,
          },
        },
      },

      {
        $group: {
          _id: {
            $dateToString: {
              format: dateFormat,
              date: "$createdAt",
              timezone: "Asia/Kolkata",
            },
          },

          enrollments: {
            $sum: 1,
          },

          sortDate: {
            $min: "$createdAt",
          },
        },
      },

      {
        $sort: {
          sortDate: 1,
        },
      },

      {
        $project: {
          _id: 0,
          month: "$_id",
          enrollments: 1,
        },
      },

    ]);


    // ======================================
    // 8. REVENUE CHART
    // ======================================

    const revenueChart = await Enrollment.aggregate([

      {
        $match: {
          paymentStatus: "Paid",
          createdAt: {
            $gte: startDate,
            $lte: now,
          },
        },
      },

      {
        $group: {
          _id: {
            $dateToString: {
              format: dateFormat,
              date: "$createdAt",
              timezone: "Asia/Kolkata",
            },
          },

          revenue: {
            $sum: "$amount",
          },

          sortDate: {
            $min: "$createdAt",
          },
        },
      },

      {
        $sort: {
          sortDate: 1,
        },
      },

      {
        $project: {
          _id: 0,
          month: "$_id",
          revenue: 1,
        },
      },

    ]);


    // ======================================
    // 9. POPULAR COURSES
    // ======================================

    const popularCourses = await Enrollment.aggregate([

      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: now,
          },
        },
      },

      {
        $group: {
          _id: "$course",

          students: {
            $sum: 1,
          },
        },
      },

      {
        $lookup: {
          from: "courses",
          localField: "_id",
          foreignField: "_id",
          as: "courseDetails",
        },
      },

      {
        $unwind: "$courseDetails",
      },

      {
        $project: {
          _id: 0,
          name: "$courseDetails.title",
          students: 1,
        },
      },

      {
        $sort: {
          students: -1,
        },
      },

      {
        $limit: 5,
      },

    ]);


    // ======================================
    // FINAL RESPONSE
    // ======================================

    return res.status(200).json({

      success: true,

      stats: {
        totalStudents,
        totalInstructors,
        totalCourses,
        totalEnrollments,
        periodEnrollments,
        periodRevenue,
      },

      enrollmentChart,
      revenueChart,
      popularCourses,

    });

  } catch (error) {

    console.error("Reports API error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate reports",
    });

  }
});


// ==========================================
// EXPORT ROUTER
// ==========================================

module.exports = router;