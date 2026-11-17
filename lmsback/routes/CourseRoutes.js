const express = require("express");
const router = express.Router();

const Course = require("../models/Course");
const User = require("../models/UserModel");
const Review = require("../models/ReviewModel");

const verifyAdmin = require("../middleware/verifyAdmin");

// =====================================
// VALIDATE APPROVED INSTRUCTOR
// =====================================

const validateInstructor = async (instructorId) => {
  if (!instructorId) {
    throw new Error("Please select an instructor");
  }

  if (!/^[0-9a-fA-F]{24}$/.test(instructorId)) {
    throw new Error("Invalid instructor ID");
  }

  const instructor = await User.findById(instructorId);

  if (!instructor) {
    throw new Error("Instructor not found");
  }

  if (instructor.role !== "instructor") {
    throw new Error("Selected user is not an instructor");
  }

  if (instructor.verificationStatus !== "approved") {
    throw new Error("Only approved instructors can be assigned");
  }

  return instructor;
};


// =====================================
// GET ALL COURSES
// =====================================

router.get("/", async (req, res) => {
  try {
    const courses = await Course.find()
      .sort({ createdAt: -1 });

    res.status(200).json(courses);

  } catch (error) {
    console.error("GET COURSES ERROR:", error);

    res.status(500).json({
      message: "Failed to fetch courses",
      error: error.message,
    });
  }
});


// =====================================
// ADD COURSE
// =====================================

router.post("/", verifyAdmin, async (req, res) => {
  try {
    const {
      title,
      category,
      instructorId,
      price,
      duration,
      status,
    } = req.body;

    if (
      !title ||
      !category ||
      !instructorId ||
      price === undefined ||
      !duration
    ) {
      return res.status(400).json({
        message: "Please provide all required course details",
      });
    }

    const instructor = await validateInstructor(instructorId);

    const course = await Course.create({
      title,
      category,
      instructor: instructor.name,
      instructorId: instructor._id,
      price: Number(price),
      duration,
      status: status || "Published",
    });

    res.status(201).json({
      success: true,
      message: "Course created successfully",
      course,
    });

  } catch (error) {
    console.error("ADD COURSE ERROR:", error);

    res.status(400).json({
      message: "Failed to create course",
      error: error.message,
    });
  }
});


// =====================================
// UPDATE COURSE
// =====================================

router.put("/:id", verifyAdmin, async (req, res) => {
  try {
    const {
      title,
      category,
      instructorId,
      price,
      duration,
      status,
    } = req.body;

    const updateData = {
      title,
      category,
      price,
      duration,
      status,
    };

    // Update instructor if selected
    if (instructorId) {
      const instructor = await validateInstructor(instructorId);

      updateData.instructor = instructor.name;
      updateData.instructorId = instructor._id;
    }

    // Remove undefined values
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const course = await Course.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!course) {
      return res.status(404).json({
        message: "Course not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Course updated successfully",
      course,
    });

  } catch (error) {
    console.error("UPDATE COURSE ERROR:", error);

    res.status(400).json({
      message: "Failed to update course",
      error: error.message,
    });
  }
});


// =====================================
// DELETE COURSE
// =====================================

router.delete("/:id", verifyAdmin, async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);

    if (!course) {
      return res.status(404).json({
        message: "Course not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Course deleted successfully",
    });

  } catch (error) {
    console.error("DELETE COURSE ERROR:", error);

    res.status(400).json({
      message: "Failed to delete course",
      error: error.message,
    });
  }
});


// =====================================
// GET COURSE REVIEWS
// =====================================

router.get("/:id/reviews", async (req, res) => {
  try {
    const reviews = await Review.find({
      course: req.params.id,
    })
      .populate("student", "name")
      .sort({ createdAt: -1 });

    const averageRating = reviews.length
      ? (
          reviews.reduce(
            (total, review) => total + review.rating,
            0
          ) / reviews.length
        ).toFixed(1)
      : "0.0";

    res.status(200).json({
      success: true,
      reviews,
      totalReviews: reviews.length,
      averageRating,
    });

  } catch (error) {
    console.error("FETCH COURSE REVIEWS ERROR:", error);

    res.status(500).json({
      message: "Unable to fetch course reviews",
      error: error.message,
    });
  }
});

module.exports = router;