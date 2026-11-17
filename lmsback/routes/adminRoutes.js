const express = require("express");
const router = express.Router();

const jwt = require("jsonwebtoken");

const Admin = require("../models/AdminModel");
const User = require("../models/UserModel");

// ADMIN AUTHENTICATION
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


// GET STUDENTS AND INSTRUCTORS
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

module.exports = router;