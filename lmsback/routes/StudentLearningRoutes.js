const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
const Review = require("../models/ReviewModel");
// Verify student
const verifyStudent = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Login required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "student") {
      return res.status(403).json({ message: "Student access only" });
    }

    req.userId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// GET ENROLLED COURSES
router.get("/my-learning", verifyStudent, async (req, res) => {
  try {
    const enrollments = await Enrollment.find({
      student: req.userId,
      paymentStatus: "Paid",
    }).populate("course");

    const courses = enrollments
      .filter((item) => item.course)
      .map((item) => ({
        ...item.course.toObject(),
        enrollmentId: item._id,
        paymentStatus: item.paymentStatus,
      }));

    res.json(courses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to load enrolled courses" });
  }
});

// GET COURSE DETAILS AND REVIEWS
router.get("/my-learning/:courseId", verifyStudent, async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({
      student: req.userId,
      course: req.params.courseId,
      paymentStatus: "Paid",
    });

    if (!enrollment) {
      return res.status(403).json({
        message: "You are not enrolled in this course",
      });
    }

    const course = await Course.findById(req.params.courseId);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const reviews = await Review.find({
      course: req.params.courseId,
    }).populate("student", "name");

    const myReview = reviews.find(
      (review) => review.student?._id.toString() === req.userId
    );

    res.json({
      course,
      reviews,
      myReview: myReview || null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to load course details" });
  }
});

// ADD OR UPDATE REVIEW
router.post("/my-learning/:courseId/review", verifyStudent, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!Number.isInteger(Number(rating)) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Select a rating from 1 to 5" });
    }

    if (!comment?.trim()) {
      return res.status(400).json({ message: "Please write a review" });
    }

    const enrollment = await Enrollment.findOne({
      student: req.userId,
      course: req.params.courseId,
      paymentStatus: "Paid",
    });

    if (!enrollment) {
      return res.status(403).json({
        message: "Only enrolled students can review this course",
      });
    }

    const review = await Review.findOneAndUpdate(
      {
        student: req.userId,
        course: req.params.courseId,
      },
      {
        rating: Number(rating),
        comment: comment.trim(),
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    ).populate("student", "name");

    res.json({
      message: "Review submitted successfully",
      review,
    });
  } catch (error) {
    console.error(error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "You have already reviewed this course",
      });
    }

    res.status(500).json({ message: "Unable to submit review" });
  }
});

module.exports = router;