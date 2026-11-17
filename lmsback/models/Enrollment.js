const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    orderId: {
      type: String,
      default: null,
    },

    paymentId: {
      type: String,
      default: null,
    },

    paymentStatus: {
      type: String,
      enum: ["Pending Payment", "Paid", "Failed", "Refunded"],
      default: "Pending Payment",
    },
  },
  { timestamps: true }
);

// A student can enroll in each course only once.
enrollmentSchema.index(
  { student: 1, course: 1 },
  { unique: true }
);

module.exports = mongoose.model("Enrollment", enrollmentSchema);
