const express = require("express");
const router = express.Router();

const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const User = require("../models/UserModel");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const Quiz = require("../models/Quiz");
const QuizAttempt = require("../models/QuizAttempts");
const Notification = require("../models/Notification");

// ================= AUTHENTICATION =================

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

// ================= INSTRUCTOR CHECK =================

const verifyInstructor = async (req, res, next) => {
  if (req.userRole !== "instructor") {
    return res.status(403).json({
      message: "Instructor access required",
    });
  }

  const instructor = await User.findById(req.userId);

  if (!instructor || instructor.verificationStatus !== "approved") {
    return res.status(403).json({
      message: "Instructor approval required",
    });
  }

  next();
};

// ================= STUDENT CHECK =================

const verifyStudent = (req, res, next) => {
  if (req.userRole !== "student") {
    return res.status(403).json({
      message: "Student access required",
    });
  }

  next();
};

// ================= CREATE QUIZ =================

router.post(
  "/instructor/:courseId/:sectionId",
  verifyUser,
  verifyInstructor,
  async (req, res) => {
    try {
      const { courseId, sectionId } = req.params;

      const {
        title,
        description,
        questions,
        duration,
        dueDate,
        status,
      } = req.body;

      if (
        !mongoose.Types.ObjectId.isValid(courseId) ||
        !mongoose.Types.ObjectId.isValid(sectionId)
      ) {
        return res.status(400).json({
          message: "Invalid course or section ID",
        });
      }

      if (!title || !Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({
          message: "Quiz title and questions are required",
        });
      }

      const course = await Course.findOne({
        _id: courseId,
        instructorId: req.userId,
      });

      if (!course) {
        return res.status(404).json({
          message: "Course not found",
        });
      }

      const section = course.sections.id(sectionId);

      if (!section) {
        return res.status(404).json({
          message: "Section not found",
        });
      }

      let totalMarks = 0;

      for (const question of questions) {
        if (
          !question.questionText ||
          !["mcq", "true_false", "written"].includes(question.questionType) ||
          !Number.isFinite(Number(question.marks)) ||
          Number(question.marks) < 1
        ) {
          return res.status(400).json({
            message: "Invalid question details",
          });
        }

        if (question.questionType === "mcq") {
          if (
            !Array.isArray(question.options) ||
            question.options.length < 2 ||
            question.options.some((option) => !option.trim())
          ) {
            return res.status(400).json({
              message: "MCQ questions need at least two options",
            });
          }

          if (
            !Number.isInteger(Number(question.correctAnswer)) ||
            Number(question.correctAnswer) < 0 ||
            Number(question.correctAnswer) >= question.options.length
          ) {
            return res.status(400).json({
              message: "Select a valid correct MCQ option",
            });
          }
        }

        if (question.questionType === "true_false") {
          if (
            !["true", "false"].includes(
              String(question.correctAnswer).toLowerCase()
            )
          ) {
            return res.status(400).json({
              message: "True/False question needs a correct answer",
            });
          }
        }

        totalMarks += Number(question.marks);
      }

      const formattedQuestions = questions.map((question) => {
        let correctAnswer = "";

        if (question.questionType === "mcq") {
          // Store the selected option text as the correct answer.
          correctAnswer = question.options[
            Number(question.correctAnswer)
          ];
        } else if (question.questionType === "true_false") {
          correctAnswer = String(question.correctAnswer).toLowerCase();
        }

        return {
          questionText: question.questionText,
          questionType: question.questionType,
          options:
            question.questionType === "mcq"
              ? question.options.map((text) => ({ text }))
              : [],
          correctAnswer,
          marks: Number(question.marks),
        };
      });

      const quiz = await Quiz.create({
        title,
        description,
        courseId,
        sectionId,
        instructorId: req.userId,
        questions: formattedQuestions,
        totalMarks,
        duration: Number(duration) || 30,
        dueDate: dueDate || null,
        status: status === "Published" ? "Published" : "Draft",
      });

      // ==========================================
      // NOTIFY STUDENTS WHEN A NEW QUIZ IS PUBLISHED
      // ==========================================

      if (quiz.status === "Published") {
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
                title: "New Quiz Added",
                message: `A new quiz "${quiz.title}" has been added to ${course.title}.`,
                type: "quiz",
                isRead: false,
                link: "/student/quizzes",
              }));

            if (notifications.length > 0) {
              await Notification.insertMany(notifications);
            }
          }
        } catch (notificationError) {
          console.error(
            "New quiz notification error:",
            notificationError
          );
        }
      }

      res.status(201).json({
        success: true,
        message: "Quiz created successfully",
        quiz,
      });
    } catch (error) {
      console.error("Create quiz error:", error);

      res.status(500).json({
        message: "Failed to create quiz",
      });
    }
  }
);

// ================= INSTRUCTOR: VIEW QUIZZES =================

router.get(
  "/instructor",
  verifyUser,
  verifyInstructor,
  async (req, res) => {
    try {
      const quizzes = await Quiz.find({
        instructorId: req.userId,
      })
        .populate("courseId", "title")
        .sort({ createdAt: -1 });

      res.json(quizzes);
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Failed to fetch quizzes",
      });
    }
  }
);

// ================= STUDENT: VIEW AVAILABLE QUIZZES =================

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

      const courseIds = enrollments.map((item) => item.course);

      const quizzes = await Quiz.find({
        courseId: { $in: courseIds },
        status: "Published",
      })
        .populate("courseId", "title sections")
        .sort({ createdAt: -1 })
        .lean();

      const attempts = await QuizAttempt.find({
        studentId: req.userId,
        quizId: { $in: quizzes.map((quiz) => quiz._id) },
      }).lean();

      const attemptMap = new Map(
        attempts.map((attempt) => [
          attempt.quizId.toString(),
          attempt,
        ])
      );

      const result = quizzes.map((quiz) => {
        const section = quiz.courseId?.sections?.find(
          (item) => item._id.toString() === quiz.sectionId.toString()
        );

        return {
          _id: quiz._id,
          title: quiz.title,
          description: quiz.description,
          courseId: quiz.courseId?._id,
          courseTitle: quiz.courseId?.title || "",
          sectionTitle: section?.title || "Section",
          totalMarks: quiz.totalMarks,
          duration: quiz.duration,
          dueDate: quiz.dueDate,
          attempt: attemptMap.get(quiz._id.toString()) || null,
        };
      });

      res.json(result);
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Failed to fetch student quizzes",
      });
    }
  }
);

// ================= STUDENT: OPEN QUIZ =================

router.get(
  "/student/:quizId",
  verifyUser,
  verifyStudent,
  async (req, res) => {
    try {
      const { quizId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(quizId)) {
        return res.status(400).json({
          message: "Invalid quiz ID",
        });
      }

      const quiz = await Quiz.findOne({
        _id: quizId,
        status: "Published",
      }).lean();

      if (!quiz) {
        return res.status(404).json({
          message: "Quiz not found",
        });
      }

      const enrollment = await Enrollment.findOne({
        student: req.userId,
        course: quiz.courseId,
        paymentStatus: "Paid",
      });

      if (!enrollment) {
        return res.status(403).json({
          message: "You are not enrolled in this course",
        });
      }

      const existingAttempt = await QuizAttempt.findOne({
        quizId,
        studentId: req.userId,
      });

      if (existingAttempt) {
        return res.status(409).json({
          message: "You have already attempted this quiz",
        });
      }

      // Never send correctAnswer to the student.
      const safeQuestions = quiz.questions.map((question) => ({
        _id: question._id,
        questionText: question.questionText,
        questionType: question.questionType,
        options: question.options,
        marks: question.marks,
      }));

      res.json({
        _id: quiz._id,
        title: quiz.title,
        description: quiz.description,
        questions: safeQuestions,
        totalMarks: quiz.totalMarks,
        duration: quiz.duration,
        dueDate: quiz.dueDate,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Failed to open quiz",
      });
    }
  }
);

// ================= STUDENT: SUBMIT QUIZ =================

router.post(
  "/student/:quizId/submit",
  verifyUser,
  verifyStudent,
  async (req, res) => {
    try {
      const { quizId } = req.params;
      const { answers } = req.body;

      if (!mongoose.Types.ObjectId.isValid(quizId)) {
        return res.status(400).json({
          message: "Invalid quiz ID",
        });
      }

      if (!Array.isArray(answers)) {
        return res.status(400).json({
          message: "Answers are required",
        });
      }

      const quiz = await Quiz.findOne({
        _id: quizId,
        status: "Published",
      });

      if (!quiz) {
        return res.status(404).json({
          message: "Quiz not found",
        });
      }

      const enrollment = await Enrollment.findOne({
        student: req.userId,
        course: quiz.courseId,
        paymentStatus: "Paid",
      });

      if (!enrollment) {
        return res.status(403).json({
          message: "You are not enrolled in this course",
        });
      }

      const existingAttempt = await QuizAttempt.findOne({
        quizId,
        studentId: req.userId,
      });

      if (existingAttempt) {
        return res.status(409).json({
          message: "Quiz already submitted",
        });
      }

      let obtainedMarks = 0;
      let hasWrittenQuestions = false;

      const formattedAnswers = [];

      for (const question of quiz.questions) {
        const submittedAnswer = answers.find(
          (item) =>
            item.questionId?.toString() === question._id.toString()
        );

        const answer = String(submittedAnswer?.answer || "").trim();

        let marksAwarded = 0;
        let isCorrect = null;

        if (question.questionType === "mcq") {
          isCorrect = question.options.some(
            (option) =>
              option.text === question.correctAnswer &&
              option._id.toString() === answer
          );

          if (isCorrect) {
            marksAwarded = question.marks;
          }
        } else if (question.questionType === "true_false") {
          isCorrect =
            answer.toLowerCase() === question.correctAnswer.toLowerCase();

          if (isCorrect) {
            marksAwarded = question.marks;
          }
        } else if (question.questionType === "written") {
          hasWrittenQuestions = true;
        }

        obtainedMarks += marksAwarded;

        formattedAnswers.push({
          questionId: question._id,
          answer,
          marksAwarded,
          isCorrect,
        });
      }

      const attempt = await QuizAttempt.create({
        quizId,
        studentId: req.userId,
        answers: formattedAnswers,
        totalMarks: quiz.totalMarks,
        obtainedMarks,
        status: hasWrittenQuestions ? "Submitted" : "Graded",
        gradedAt: hasWrittenQuestions ? null : new Date(),
      });

      // Notify instructor about new quiz submission
      try {
        const student = await User.findById(req.userId)
          .select("name username");

        await Notification.create({
          recipient: quiz.instructorId,
          title: "New Quiz Submission",
          message: `${student?.name || student?.username || "A student"} submitted "${quiz.title}".`,
          type: "quiz",
          link: "/instructor/quizzes",
        });
      } catch (notificationError) {
        console.error(
          "Quiz submission notification error:",
          notificationError
        );
      }

      res.status(201).json({
        success: true,
        message: hasWrittenQuestions
          ? "Quiz submitted. Written answers are waiting for instructor grading."
          : "Quiz submitted and automatically graded.",
        attempt: {
          _id: attempt._id,
          obtainedMarks: attempt.obtainedMarks,
          totalMarks: attempt.totalMarks,
          status: attempt.status,
        },
      });
    } catch (error) {
      console.error("Submit quiz error:", error);

      if (error.code === 11000) {
        return res.status(409).json({
          message: "Quiz already submitted",
        });
      }

      res.status(500).json({
        message: "Failed to submit quiz",
      });
    }
  }
);

// ================= INSTRUCTOR: VIEW QUIZ ATTEMPTS =================

router.get(
  "/instructor/:quizId/attempts",
  verifyUser,
  verifyInstructor,
  async (req, res) => {
    try {
      const quiz = await Quiz.findOne({
        _id: req.params.quizId,
        instructorId: req.userId,
      });

      if (!quiz) {
        return res.status(404).json({
          message: "Quiz not found",
        });
      }

      const attempts = await QuizAttempt.find({
        quizId: quiz._id,
      })
        .populate("studentId", "name email")
        .sort({ submittedAt: -1 });

      res.json({
        quiz,
        attempts,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Failed to fetch quiz attempts",
      });
    }
  }
);

// ================= INSTRUCTOR: GRADE WRITTEN ANSWERS =================

router.patch(
  "/instructor/:quizId/attempts/:attemptId/grade",
  verifyUser,
  verifyInstructor,
  async (req, res) => {
    try {
      const { quizId, attemptId } = req.params;
      const { grades } = req.body;

      if (!Array.isArray(grades)) {
        return res.status(400).json({
          message: "Grades must be an array",
        });
      }

      const quiz = await Quiz.findOne({
        _id: quizId,
        instructorId: req.userId,
      });

      if (!quiz) {
        return res.status(404).json({
          message: "Quiz not found",
        });
      }

      const attempt = await QuizAttempt.findOne({
        _id: attemptId,
        quizId: quiz._id,
      });

      if (!attempt) {
        return res.status(404).json({
          message: "Attempt not found",
        });
      }

      if (attempt.status === "Graded") {
        return res.status(400).json({
          message: "This quiz attempt has already been graded",
        });
      }

      for (const grade of grades) {
        const question = quiz.questions.id(grade.questionId);

        if (!question || question.questionType !== "written") {
          return res.status(400).json({
            message: "Invalid written question",
          });
        }

        const marks = Number(grade.marksAwarded);

        if (
          !Number.isFinite(marks) ||
          marks < 0 ||
          marks > question.marks
        ) {
          return res.status(400).json({
            message: "Invalid marks awarded",
          });
        }

        const studentAnswer = attempt.answers.find(
          (item) =>
            item.questionId.toString() === question._id.toString()
        );

        if (studentAnswer) {
          studentAnswer.marksAwarded = marks;
          studentAnswer.feedback = grade.feedback || "";
        }
      }

      // Require every written question to be graded.
      const writtenQuestions = quiz.questions.filter(
        (question) => question.questionType === "written"
      );

      const allWrittenGraded = writtenQuestions.every((question) => {
        const studentAnswer = attempt.answers.find(
          (item) =>
            item.questionId.toString() === question._id.toString()
        );

        return studentAnswer && grades.some(
          (grade) =>
            grade.questionId.toString() === question._id.toString()
        );
      });

      if (!allWrittenGraded) {
        return res.status(400).json({
          message: "Please grade all written questions",
        });
      }

      attempt.obtainedMarks = attempt.answers.reduce(
        (total, answer) => total + answer.marksAwarded,
        0
      );

      attempt.status = "Graded";
      attempt.gradedAt = new Date();

      await attempt.save();

      // Notify student about quiz grade
      try {
        await Notification.create({
          recipient: attempt.studentId,
          title: "Quiz Graded",
          message: `Your quiz "${quiz.title}" has been graded. You received ${attempt.obtainedMarks}/${attempt.totalMarks} marks.`,
          type: "grade",
          link: "/student/quizzes",
        });
      } catch (notificationError) {
        console.error(
          "Quiz grade notification error:",
          notificationError
        );
      }

      res.json({
        success: true,
        message: "Quiz graded successfully",
        attempt,
      });
    } catch (error) {
      console.error("Grade quiz error:", error);

      res.status(500).json({
        message: "Failed to grade quiz",
      });
    }
  }
);

module.exports = router;