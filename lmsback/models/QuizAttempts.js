const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },

  answer: {
    type: String,
    default: "",
  },

  marksAwarded: {
    type: Number,
    default: 0,
  },

  feedback: {
    type: String,
    default: "",
  },

  isCorrect: {
    type: Boolean,
    default: null,
  },
});

const quizAttemptSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    answers: [answerSchema],

    totalMarks: {
      type: Number,
      default: 0,
    },

    obtainedMarks: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["Submitted", "Graded"],
      default: "Submitted",
    },

    submittedAt: {
      type: Date,
      default: Date.now,
    },

    gradedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// One attempt per student per quiz
quizAttemptSchema.index(
  { quizId: 1, studentId: 1 },
  { unique: true }
);

module.exports = mongoose.model("QuizAttempt", quizAttemptSchema);