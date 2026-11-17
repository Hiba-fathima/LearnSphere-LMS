const mongoose = require("mongoose");

const optionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
});

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true,
  },

  questionType: {
    type: String,
    enum: ["mcq", "true_false", "written"],
    required: true,
  },

  options: {
    type: [optionSchema],
    default: [],
  },

  correctAnswer: {
    type: String,
    default: "",
  },

  marks: {
    type: Number,
    required: true,
    min: 1,
  },
});

const quizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      default: "",
    },

    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    instructorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    questions: [questionSchema],

    totalMarks: {
      type: Number,
      default: 0,
    },

    duration: {
      type: Number,
      default: 30,
    },

    dueDate: {
      type: Date,
    },

    status: {
      type: String,
      enum: ["Draft", "Published"],
      default: "Draft",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Quiz", quizSchema);