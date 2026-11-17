const express = require("express");
const router = express.Router();

const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const User = require("../models/UserModel");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const Assignment = require("../models/Assignment");
const AssignmentSubmission = require("../models/AssignmentSubmission");
const Notification = require("../models/Notification");

// =====================================
// FILE UPLOAD CONFIGURATION
// =====================================

const uploadDirectory = path.join(
  __dirname,
  "../uploads/assignments"
);

fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname).toLowerCase();

    cb(null, uniqueName);
  },
});

const allowedExtensions = [
  ".pdf",
  ".doc",
  ".docx",
  ".zip",
  ".png",
  ".jpg",
  ".jpeg",
];

const upload = multer({
  storage,

  limits: {
    fileSize: 10 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    if (!allowedExtensions.includes(extension)) {
      return cb(
        new Error("Only PDF, DOC, DOCX, ZIP and image files are allowed.")
      );
    }

    cb(null, true);
  },
});

// =====================================
// HELPER: DELETE UPLOADED FILE
// =====================================

const deleteFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

// =====================================
// AUTHENTICATION
// =====================================

const verifyUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Login required",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userId = decoded.id || decoded.userId || decoded._id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({
        message: "Invalid user token",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    req.userId = user._id;
    req.userRole = user.role;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

const verifyInstructor = (req, res, next) => {
  if (req.userRole !== "instructor") {
    return res.status(403).json({
      message: "Instructor access required",
    });
  }

  next();
};

const verifyStudent = (req, res, next) => {
  if (req.userRole !== "student") {
    return res.status(403).json({
      message: "Student access required",
    });
  }

  next();
};

// =====================================
// INSTRUCTOR: CREATE ASSIGNMENT
// =====================================

router.post(
  "/instructor/:courseId/:sectionId",
  verifyUser,
  verifyInstructor,
  async (req, res) => {
    try {
      const { courseId, sectionId } = req.params;

      const { title, description, dueDate, totalMarks } = req.body;

      if (
        !mongoose.Types.ObjectId.isValid(courseId) ||
        !mongoose.Types.ObjectId.isValid(sectionId)
      ) {
        return res.status(400).json({
          message: "Invalid course or section ID",
        });
      }

      if (!title?.trim() || !description?.trim() || !dueDate) {
        return res.status(400).json({
          message: "Title, description and due date are required",
        });
      }

      const parsedDueDate = new Date(dueDate);

      if (Number.isNaN(parsedDueDate.getTime())) {
        return res.status(400).json({
          message: "Invalid due date",
        });
      }

      const marks = Number(totalMarks ?? 100);

      if (!Number.isFinite(marks) || marks < 1) {
        return res.status(400).json({
          message: "Total marks must be at least 1",
        });
      }

      const course = await Course.findOne({
        _id: courseId,
        instructorId: req.userId,
      });

      if (!course) {
        return res.status(404).json({
          message: "Course not found or access denied",
        });
      }

      const section = course.sections.id(sectionId);

      if (!section) {
        return res.status(404).json({
          message: "Section not found in this course",
        });
      }

      // Create assignment
      const assignment = await Assignment.create({
        title: title.trim(),
        description: description.trim(),
        courseId,
        sectionId,
        instructorId: req.userId,
        dueDate: parsedDueDate,
        totalMarks: marks,
      });

      // =====================================
      // NOTIFY STUDENTS ABOUT NEW ASSIGNMENT
      // =====================================

      try {
        // Find students who have paid for this course
        const enrollments = await Enrollment.find({
          course: courseId,
          paymentStatus: "Paid",
        }).select("student");

        if (enrollments.length > 0) {
          const notifications = enrollments
            .filter((enrollment) => enrollment.student)
            .map((enrollment) => ({
              recipient: enrollment.student,
              title: "New Assignment Added",
              message: `A new assignment "${assignment.title}" has been added to ${course.title}. Due date: ${parsedDueDate.toLocaleDateString("en-IN")}.`,
              type: "assignment",
              isRead: false,
              link: "/student/assignments",
            }));

          if (notifications.length > 0) {
            await Notification.insertMany(notifications);
          }
        }
      } catch (notificationError) {
        console.error(
          "New assignment notification error:",
          notificationError
        );
      }

      res.status(201).json({
        message: "Assignment created successfully",
        assignment,
      });
    } catch (error) {
      console.error("Create assignment error:", error);

      res.status(500).json({
        message: "Failed to create assignment",
      });
    }
  }
);

// =====================================
// INSTRUCTOR: VIEW OWN ASSIGNMENTS
// =====================================

router.get(
  "/instructor",
  verifyUser,
  verifyInstructor,
  async (req, res) => {
    try {
      const assignments = await Assignment.find({
        instructorId: req.userId,
      })
        .populate("courseId", "title")
        .sort({ createdAt: -1 });

      res.json(assignments);
    } catch (error) {
      console.error("Fetch instructor assignments:", error);

      res.status(500).json({
        message: "Failed to fetch assignments",
      });
    }
  }
);

// =====================================
// INSTRUCTOR: VIEW SUBMISSIONS
// =====================================

router.get(
  "/instructor/:assignmentId/submissions",
  verifyUser,
  verifyInstructor,
  async (req, res) => {
    try {
      const { assignmentId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
        return res.status(400).json({
          message: "Invalid assignment ID",
        });
      }

      const assignment = await Assignment.findOne({
        _id: assignmentId,
        instructorId: req.userId,
      });

      if (!assignment) {
        return res.status(404).json({
          message: "Assignment not found",
        });
      }

      const submissions = await AssignmentSubmission.find({
        assignmentId,
      })
        .populate("studentId", "name email")
        .sort({ submittedAt: -1 });

      res.json({
        assignment,
        submissions,
      });
    } catch (error) {
      console.error("Fetch submissions error:", error);

      res.status(500).json({
        message: "Failed to fetch submissions",
      });
    }
  }
);

// =====================================
// INSTRUCTOR: DOWNLOAD STUDENT FILE
// =====================================

router.get(
  "/instructor/:assignmentId/submissions/:submissionId/file",
  verifyUser,
  verifyInstructor,
  async (req, res) => {
    try {
      const { assignmentId, submissionId } = req.params;

      const assignment = await Assignment.findOne({
        _id: assignmentId,
        instructorId: req.userId,
      });

      if (!assignment) {
        return res.status(404).json({
          message: "Assignment not found",
        });
      }

      const submission = await AssignmentSubmission.findOne({
        _id: submissionId,
        assignmentId,
      });

      if (!submission || !submission.file?.filename) {
        return res.status(404).json({
          message: "Submission file not found",
        });
      }

      const filePath = path.join(
        uploadDirectory,
        submission.file.filename
      );

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          message: "File does not exist on the server",
        });
      }

      res.download(filePath, submission.file.originalName);
    } catch (error) {
      console.error("Download submission error:", error);

      res.status(500).json({
        message: "Failed to download file",
      });
    }
  }
);

// =====================================
// INSTRUCTOR: GRADE SUBMISSION
// =====================================

router.patch(
  "/instructor/:assignmentId/submissions/:submissionId/grade",
  verifyUser,
  verifyInstructor,
  async (req, res) => {
    try {
      const { assignmentId, submissionId } = req.params;

      const { marks, feedback } = req.body;

      const assignment = await Assignment.findOne({
        _id: assignmentId,
        instructorId: req.userId,
      });

      if (!assignment) {
        return res.status(404).json({
          message: "Assignment not found",
        });
      }

      const numericMarks = Number(marks);

      if (
        marks === undefined ||
        marks === null ||
        marks === "" ||
        !Number.isFinite(numericMarks) ||
        numericMarks < 0 ||
        numericMarks > assignment.totalMarks
      ) {
        return res.status(400).json({
          message: `Marks must be between 0 and ${assignment.totalMarks}`,
        });
      }

      const submission = await AssignmentSubmission.findOne({
        _id: submissionId,
        assignmentId,
      });

      if (!submission) {
        return res.status(404).json({
          message: "Submission not found",
        });
      }

      submission.marks = numericMarks;
      submission.feedback = feedback || "";
      submission.status = "Graded";

      await submission.save();

      // Notify student about assignment grade
      try {
        await Notification.create({
          recipient: submission.studentId,
          title: "Assignment Graded",
          message: `Your assignment "${assignment.title}" has been graded. You received ${numericMarks}/${assignment.totalMarks} marks.`,
          type: "grade",
          link: "/student/assignments",
        });
      } catch (notificationError) {
        console.error(
          "Assignment grade notification error:",
          notificationError
        );
      }

      res.json({
        message: "Submission graded successfully",
        submission,
      });
    } catch (error) {
      console.error("Grade submission error:", error);

      res.status(500).json({
        message: "Failed to grade submission",
      });
    }
  }
);

// =====================================
// STUDENT: VIEW ASSIGNMENTS
// =====================================

router.get(
  "/student",
  verifyUser,
  verifyStudent,
  async (req, res) => {
    try {
      const enrollments = await Enrollment.find({
        student: req.userId,
        paymentStatus: "Paid",
      }).select("course");

      const courseIds = enrollments.map(
        (enrollment) => enrollment.course
      );

      const assignments = await Assignment.find({
        courseId: { $in: courseIds },
      })
        .populate("courseId", "title sections")
        .sort({ dueDate: 1 });

      const submissions = await AssignmentSubmission.find({
        studentId: req.userId,
        assignmentId: {
          $in: assignments.map((assignment) => assignment._id),
        },
      });

      const submissionMap = new Map(
        submissions.map((submission) => [
          submission.assignmentId.toString(),
          submission,
        ])
      );

      const result = assignments.map((assignment) => {
        const section = assignment.courseId.sections.id(
          assignment.sectionId
        );

        return {
          ...assignment.toObject(),

          sectionTitle: section?.title || "Section",

          submission:
            submissionMap.get(assignment._id.toString()) || null,
        };
      });

      res.json(result);
    } catch (error) {
      console.error("Fetch student assignments:", error);

      res.status(500).json({
        message: "Failed to fetch assignments",
      });
    }
  }
);

// =====================================
// STUDENT: SUBMIT ASSIGNMENT
// =====================================

router.post(
  "/student/:assignmentId/submit",
  verifyUser,
  verifyStudent,
  (req, res, next) => {
    upload.single("file")(req, res, (error) => {
      if (error) {
        return res.status(400).json({
          message: error.message,
        });
      }

      next();
    });
  },
  async (req, res) => {
    try {
      const { assignmentId } = req.params;
      const { answer } = req.body;

      if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
        deleteFile(req.file?.path);

        return res.status(400).json({
          message: "Invalid assignment ID",
        });
      }

      if (!answer?.trim() && !req.file) {
        return res.status(400).json({
          message: "Write an answer or attach a file",
        });
      }

      const assignment = await Assignment.findById(assignmentId);

      if (!assignment) {
        deleteFile(req.file?.path);

        return res.status(404).json({
          message: "Assignment not found",
        });
      }

      const enrollment = await Enrollment.findOne({
        student: req.userId,
        course: assignment.courseId,
        paymentStatus: "Paid",
      });

      if (!enrollment) {
        deleteFile(req.file?.path);

        return res.status(403).json({
          message: "You must be enrolled in this course to submit",
        });
      }

      let submission = await AssignmentSubmission.findOne({
        assignmentId,
        studentId: req.userId,
      });

      if (submission?.status === "Graded") {
        deleteFile(req.file?.path);

        return res.status(400).json({
          message: "This submission has already been graded",
        });
      }

      const oldFilePath = submission?.file?.filename
        ? path.join(uploadDirectory, submission.file.filename)
        : null;

      if (!submission) {
        submission = new AssignmentSubmission({
          assignmentId,
          studentId: req.userId,
        });
      }

      submission.answer = answer?.trim() || "";
      submission.submittedAt = new Date();
      submission.status = "Submitted";

      if (req.file) {
        submission.file = {
          originalName: req.file.originalname,
          filename: req.file.filename,
          path: `uploads/assignments/${req.file.filename}`,
          mimetype: req.file.mimetype,
          size: req.file.size,
        };
      }

      await submission.save();

      // Notify instructor about new assignment submission
      try {
        const student = await User.findById(req.userId)
          .select("name username");

        await Notification.create({
          recipient: assignment.instructorId,
          title: "New Assignment Submission",
          message: `${student?.name || student?.username || "A student"} submitted "${assignment.title}".`,
          type: "assignment",
          link: "/instructor/assignments",
        });
      } catch (notificationError) {
        console.error(
          "Assignment notification error:",
          notificationError
        );
      }

      // Delete old file only after the new submission is saved.
      if (req.file && oldFilePath) {
        deleteFile(oldFilePath);
      }

      res.json({
        message: "Assignment submitted successfully",
        submission,
      });
    } catch (error) {
      deleteFile(req.file?.path);

      console.error("Submit assignment error:", error);

      res.status(500).json({
        message: "Failed to submit assignment",
      });
    }
  }
);

// =====================================
// MULTER ERROR HANDLER
// =====================================

router.use((error, req, res, next) => {
  console.error("Assignment route error:", error);

  res.status(500).json({
    message: "Something went wrong",
  });
});

module.exports = router;