const mongoose = require("mongoose");

// Section Schema
const sectionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    order: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

// Course Schema
const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
    },

    instructor: {
      type: String,
      required: true,
      trim: true,
    },

    instructorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    duration: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["Published", "Draft"],
      default: "Published",
    },

    // Course Sections
    sections: [sectionSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Course", courseSchema);