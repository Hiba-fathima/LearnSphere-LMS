const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

const User = require("../models/UserModel");

// =====================================
// VERIFY ADMIN
// =====================================

const verifyAdmin = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Login required",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "admin") {
      return res.status(403).json({
        message: "Admin access only",
      });
    }

    next();

  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};


// =====================================
// GET ALL INSTRUCTORS
// For Admin Instructors Page
// =====================================

router.get("/", verifyAdmin, async (req, res) => {
  try {
    const instructors = await User.find({
      role: "instructor",
    })
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      instructors,
    });

  } catch (error) {
    console.error("GET ALL INSTRUCTORS ERROR:", error);

    res.status(500).json({
      message: "Unable to fetch instructor applications",
      error: error.message,
    });
  }
});


// =====================================
// GET APPROVED INSTRUCTORS ONLY
// For Add Course Dropdown
// =====================================

router.get("/approved", verifyAdmin, async (req, res) => {
  try {
    const instructors = await User.find({
      role: "instructor",
      verificationStatus: "approved",
    })
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      instructors,
    });

  } catch (error) {
    console.error("GET APPROVED INSTRUCTORS ERROR:", error);

    res.status(500).json({
      message: "Unable to fetch approved instructors",
      error: error.message,
    });
  }
});


// =====================================
// APPROVE OR REJECT INSTRUCTOR
// =====================================

router.patch("/:id/verification", verifyAdmin, async (req, res) => {
  try {
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        message: "Invalid verification status",
      });
    }

    const instructor = await User.findOneAndUpdate(
      {
        _id: req.params.id,
        role: "instructor",
      },
      {
        verificationStatus: status,
      },
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    if (!instructor) {
      return res.status(404).json({
        message: "Instructor not found",
      });
    }

    res.status(200).json({
      success: true,
      message:
        status === "approved"
          ? "Instructor approved successfully"
          : "Instructor application rejected",
      instructor,
    });

  } catch (error) {
    console.error("UPDATE INSTRUCTOR STATUS ERROR:", error);

    res.status(500).json({
      message: "Unable to update instructor verification",
      error: error.message,
    });
  }
});

module.exports = router;