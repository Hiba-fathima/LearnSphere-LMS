const express = require("express");
const router = express.Router();

const jwt = require("jsonwebtoken");
const Razorpay = require("razorpay");
const crypto = require("crypto");

const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
const verifyAdmin = require("../middleware/verifyAdmin");

// =====================================
// RAZORPAY CONFIGURATION
// =====================================

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// =====================================
// AUTHENTICATION MIDDLEWARE
// =====================================

const verifyStudent = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Please log in first",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.userId =
      decoded.id ||
      decoded.userId ||
      decoded._id;

    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token",
      });
    }

    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

// =====================================
// 1. VERIFY RAZORPAY PAYMENT
// =====================================

router.post("/verify-payment", verifyStudent, async (req, res) => {
  try {

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing payment verification details",
      });
    }

    // Find enrollment belonging to this student
    const enrollment = await Enrollment.findOne({
      student: req.userId,
      orderId: razorpay_order_id,
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "Enrollment not found",
      });
    }

    if (enrollment.paymentStatus === "Paid") {
      return res.json({
        success: true,
        message: "Payment already verified",
        enrollment,
      });
    }

    // Generate Razorpay signature
    const generatedSignature = crypto
      .createHmac(
        "sha256",
        process.env.RAZORPAY_KEY_SECRET
      )
      .update(
        `${razorpay_order_id}|${razorpay_payment_id}`
      )
      .digest("hex");

    // Compare signatures safely
    const receivedBuffer = Buffer.from(razorpay_signature);
    const generatedBuffer = Buffer.from(generatedSignature);

    const signaturesMatch =
      receivedBuffer.length === generatedBuffer.length &&
      crypto.timingSafeEqual(
        receivedBuffer,
        generatedBuffer
      );

    if (!signaturesMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    // Fetch payment directly from Razorpay
    let payment = await razorpay.payments.fetch(
      razorpay_payment_id
    );

    // Verify payment details
    if (
      payment.order_id !== razorpay_order_id ||
      Number(payment.amount) !==
        Math.round(Number(enrollment.amount) * 100) ||
      payment.currency !== "INR"
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment details do not match",
      });
    }

    // Capture authorized payment
    if (payment.status === "authorized") {

      payment = await razorpay.payments.capture(
        razorpay_payment_id,
        payment.amount,
        payment.currency
      );

    }

    // Only captured payments are successful
    if (payment.status !== "captured") {
      return res.status(400).json({
        success: false,
        message: "Payment is not completed yet",
      });
    }

    // Save successful payment
    enrollment.paymentId = razorpay_payment_id;
    enrollment.paymentStatus = "Paid";

    await enrollment.save();

    return res.status(200).json({
      success: true,
      message: "Payment successful! You are enrolled.",
      enrollment,
    });

  } catch (error) {

    console.error("Payment verification error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Payment verification failed. Please contact support.",
    });

  }
});

// =====================================
// 2. GET STUDENT'S PAID COURSES
// =====================================

router.get("/my-courses", verifyStudent, async (req, res) => {
  try {

    const enrollments = await Enrollment.find({
      student: req.userId,
      paymentStatus: "Paid",
    })
      .populate("course")
      .sort({ updatedAt: -1 });

    return res.json({
      success: true,
      count: enrollments.length,
      courses: enrollments,
    });

  } catch (error) {

    console.error("Fetch courses error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch your courses",
    });

  }
});

// =====================================
// 3. CREATE RAZORPAY ORDER
// =====================================

router.post("/:courseId", verifyStudent, async (req, res) => {
  try {

    const { courseId } = req.params;

    // Find course
    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    if (course.status !== "Published") {
      return res.status(400).json({
        success: false,
        message: "This course is not available",
      });
    }

    // Check existing enrollment
    let enrollment = await Enrollment.findOne({
      student: req.userId,
      course: courseId,
    });

    if (enrollment?.paymentStatus === "Paid") {
      return res.status(409).json({
        success: false,
        message: "You are already enrolled in this course",
      });
    }

    // Validate course price
    const amount = Number(course.price);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid course price",
      });
    }

    const amountInPaise = Math.round(amount * 100);

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `course_${Date.now()}`,
      notes: {
        studentId: String(req.userId),
        courseId: String(course._id),
      },
    });

    // Create or update enrollment
    if (enrollment) {

      enrollment.amount = amount;
      enrollment.orderId = order.id;
      enrollment.paymentId = null;
      enrollment.paymentStatus = "Pending Payment";

      await enrollment.save();

    } else {

      enrollment = await Enrollment.create({
        student: req.userId,
        course: courseId,
        amount,
        orderId: order.id,
        paymentId: null,
        paymentStatus: "Pending Payment",
      });

    }

    return res.status(201).json({
      success: true,
      message: "Payment order created successfully",
      keyId: process.env.RAZORPAY_KEY_ID,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      enrollmentId: enrollment._id,
      courseName: course.title || course.name || "Course",
    });

  } catch (error) {

    console.error("Create Razorpay order error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create payment order",
    });

  }
});


// =====================================
// ADMIN - GET ALL ENROLLMENTS
// =====================================

router.get("/admin/all", verifyAdmin, async (req, res) => {
  try {
    const enrollments = await Enrollment.find()
      .populate("student", "name email")
      .populate("course")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: enrollments.length,
      enrollments,
    });
  } catch (error) {
    console.error("Fetch enrollments error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch enrollments",
    });
  }
});

module.exports = router;
