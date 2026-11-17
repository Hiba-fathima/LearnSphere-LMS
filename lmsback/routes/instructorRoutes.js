const express = require("express");
const router = express.Router();

const jwt = require("jsonwebtoken");

const User = require("../models/UserModel");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");

// =====================================
// VERIFY INSTRUCTOR
// =====================================

const verifyInstructor = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Please login first",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userId = decoded.id || decoded.userId || decoded._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    const user = await User.findById(userId);

    if (
      !user ||
      user.role !== "instructor" ||
      user.verificationStatus !== "approved"
    ) {
      return res.status(403).json({
        success: false,
        message: "Approved instructor access only",
      });
    }

    req.userId = user._id;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

// =====================================
// VALIDATE OBJECT ID
// =====================================

const isValidId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

// =====================================
// GET INSTRUCTOR COURSES
// =====================================

router.get("/courses", verifyInstructor, async (req, res) => {
  try {
    const courses = await Course.find({
      instructorId: req.userId,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: courses.length,
      courses,
    });
  } catch (error) {
    console.error("Instructor courses error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// =====================================
// GET STUDENTS
// =====================================

router.get("/students", verifyInstructor, async (req, res) => {
  try {
    const courses = await Course.find({
      instructorId: req.userId,
    }).select("_id title");

    const courseIds = courses.map((course) => course._id);

    const enrollments = await Enrollment.find({
      course: { $in: courseIds },
      paymentStatus: "Paid",
    })
      .populate("student", "name email")
      .populate("course", "title category")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: enrollments.length,
      students: enrollments,
    });
  } catch (error) {
    console.error("Instructor students error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// =====================================
// ADD SECTION TO COURSE
// POST /api/instructor/courses/:courseId/sections
// =====================================

router.post(
  "/courses/:courseId/sections",
  verifyInstructor,
  async (req, res) => {
    try {
      const { title, description } = req.body;
      const { courseId } = req.params;

      if (!isValidId(courseId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid course ID",
        });
      }

      if (!title || !title.trim()) {
        return res.status(400).json({
          success: false,
          message: "Section title is required",
        });
      }

      const course = await Course.findOne({
        _id: courseId,
        instructorId: req.userId,
      });

      if (!course) {
        return res.status(404).json({
          success: false,
          message: "Course not found or you do not own this course",
        });
      }

      course.sections.push({
        title: title.trim(),
        description: description || "",
        order: course.sections.length + 1,
      });

      await course.save();

      res.status(201).json({
        success: true,
        message: "Section added successfully",
        sections: course.sections,
      });
    } catch (error) {
      console.error("Add section error:", error);

      res.status(500).json({
        success: false,
        message: "Unable to add section",
      });
    }
  }
);

// =====================================
// UPDATE SECTION
// PUT /api/instructor/courses/:courseId/sections/:sectionId
// =====================================

router.put(
  "/courses/:courseId/sections/:sectionId",
  verifyInstructor,
  async (req, res) => {
    try {
      const { courseId, sectionId } = req.params;
      const { title, description } = req.body;

      if (!isValidId(courseId) || !isValidId(sectionId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid ID",
        });
      }

      const course = await Course.findOne({
        _id: courseId,
        instructorId: req.userId,
      });

      if (!course) {
        return res.status(404).json({
          success: false,
          message: "Course not found",
        });
      }

      const section = course.sections.id(sectionId);

      if (!section) {
        return res.status(404).json({
          success: false,
          message: "Section not found",
        });
      }

      if (title !== undefined) {
        if (!title.trim()) {
          return res.status(400).json({
            success: false,
            message: "Section title cannot be empty",
          });
        }

        section.title = title.trim();
      }

      if (description !== undefined) {
        section.description = description;
      }

      await course.save();

      res.status(200).json({
        success: true,
        message: "Section updated successfully",
        sections: course.sections,
      });
    } catch (error) {
      console.error("Update section error:", error);

      res.status(500).json({
        success: false,
        message: "Unable to update section",
      });
    }
  }
);

// =====================================
// DELETE SECTION
// DELETE /api/instructor/courses/:courseId/sections/:sectionId
// =====================================

router.delete(
  "/courses/:courseId/sections/:sectionId",
  verifyInstructor,
  async (req, res) => {
    try {
      const { courseId, sectionId } = req.params;

      if (!isValidId(courseId) || !isValidId(sectionId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid ID",
        });
      }

      const course = await Course.findOne({
        _id: courseId,
        instructorId: req.userId,
      });

      if (!course) {
        return res.status(404).json({
          success: false,
          message: "Course not found",
        });
      }

      const section = course.sections.id(sectionId);

      if (!section) {
        return res.status(404).json({
          success: false,
          message: "Section not found",
        });
      }

      section.deleteOne();

      // Reorder remaining sections
      course.sections.forEach((item, index) => {
        item.order = index + 1;
      });

      await course.save();

      res.status(200).json({
        success: true,
        message: "Section deleted successfully",
        sections: course.sections,
      });
    } catch (error) {
      console.error("Delete section error:", error);

      res.status(500).json({
        success: false,
        message: "Unable to delete section",
      });
    }
  }
);

module.exports = router;