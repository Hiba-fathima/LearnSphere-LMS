const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    answer: {
      type: String,
      default: "",
    },

    file: {
      originalName: { type: String, default: "" },
      filename: { type: String, default: "" },
      path: { type: String, default: "" },
      mimetype: { type: String, default: "" },
      size: { type: Number, default: 0 },
    },

    submittedAt: {
      type: Date,
      default: Date.now,
    },

    status: {
      type: String,
      enum: ["Submitted", "Graded"],
      default: "Submitted",
    },

    marks: {
      type: Number,
      default: null,
    },

    feedback: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

submissionSchema.index(
  { assignmentId: 1, studentId: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "AssignmentSubmission",
  submissionSchema
);