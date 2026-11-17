const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

const User = require("../models/UserModel");
const Notification = require("../models/Notification");

// Authentication
const verifyUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const userId =
      decoded.id || decoded.userId || decoded._id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    req.userId = user._id;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

// Get logged-in user's notifications
router.get("/", verifyUser, async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipient: req.userId,
    }).sort({ createdAt: -1 });

    const unreadCount = await Notification.countDocuments({
      recipient: req.userId,
      isRead: false,
    });

    res.status(200).json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Notification fetch error:", error);

    res.status(500).json({
      message: "Failed to fetch notifications",
    });
  }
});

// Mark one notification as read
router.patch("/:id/read", verifyUser, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        recipient: req.userId,
      },
      {
        isRead: true,
      },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    res.json({
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update notification",
    });
  }
});

// Mark all notifications as read
router.patch("/read-all", verifyUser, async (req, res) => {
  try {
    await Notification.updateMany(
      {
        recipient: req.userId,
        isRead: false,
      },
      {
        isRead: true,
      }
    );

    res.json({
      message: "All notifications marked as read",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update notifications",
    });
  }
});

module.exports = router;