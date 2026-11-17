const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
require("dotenv").config();



const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const courseRoutes = require("./routes/CourseRoutes");
app.use("/api/courses", courseRoutes);
console.log("Course routes registered");

const enrollmentRoutes = require("./routes/enrollmentRoutes");
app.use("/api/enrollments", enrollmentRoutes);


const adminRoutes = require("./routes/adminRoutes");
app.use("/api/admin", adminRoutes);


const adminAuthRoutes = require("./routes/adminAuthRoutes");
app.use("/api/admin", adminAuthRoutes);


const studentLearningRoutes = require("./routes/StudentLearningRoutes");

app.use("/api/student", studentLearningRoutes);

const instructorVerificationRoutes = require(
  "./routes/InstructorVerificationRoutes"
);

app.use(
  "/api/admin/instructors",
  instructorVerificationRoutes
);



const instructorRoutes = require("./routes/instructorRoutes");

app.use("/api/instructor", instructorRoutes);

console.log("CourseRoutes file loaded");

// app.use("/api/courses", courseRoutes);

// console.log("Course routes registered");

const assignmentRoutes = require("./routes/AssignmentRoutes");
app.use("/api/assignments", assignmentRoutes);
const quizRoutes = require("./routes/QuizRoutes");
app.use("/api/quizzes", quizRoutes);

const notificationRoutes = require("./routes/NotificationRoutes");
app.use("/api/notifications", notificationRoutes);

app.get("/api/test", (req, res) => {
  res.json({ message: "Main server is working!" });
});


// Connect MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB connected"))
.catch((err) => console.log("MongoDB error:", err.message));

// User Model
const User = require("./models/UserModel");

// Home Route
app.get("/", (req, res) => {
res.send("LMS Backend is Running!");
});

// SIGNUP
// SIGNUP
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Please fill in all required fields",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must contain at least 6 characters",
      });
    }

    const userRole = role || "student";

    if (!["student", "instructor"].includes(userRole)) {
      return res.status(400).json({
        message: "Invalid role",
      });
    }

    const existingUser = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Email already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role: userRole,

      verificationStatus:
        userRole === "instructor" ? "pending" : "approved",
    });

    res.status(201).json({
      message:
        userRole === "instructor"
          ? "Registration successful! Your instructor account is waiting for admin approval."
          : "Signup successful! You can now log in.",

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        verificationStatus: user.verificationStatus,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);

    res.status(500).json({
      message: "Signup failed",
    });
  }
});


// LOGIN
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Please enter email and password",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // INSTRUCTOR VERIFICATION CHECK
    if (
      user.role === "instructor" &&
      user.verificationStatus !== "approved"
    ) {
      return res.status(403).json({
        message:
          user.verificationStatus === "rejected"
            ? "Your instructor application has been rejected. Please contact the administrator."
            : "Your instructor account is awaiting admin approval.",
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        message: "JWT_SECRET is not configured",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        verificationStatus: user.verificationStatus,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      message: "Login failed",
    });
  }
});



// LOGIN
app.post("/api/auth/login", async (req, res) => {
try {
const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Please enter email and password"
        });
    }

    const user = await User.findOne({
        email: email.trim().toLowerCase()
    });

    if (!user) {
        return res.status(401).json({
            message: "Invalid email or password"
        });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        return res.status(401).json({
            message: "Invalid email or password"
        });
    }

    if (!process.env.JWT_SECRET) {
        return res.status(500).json({
            message: "JWT_SECRET is not configured"
        });
    }

    const token = jwt.sign(
        {
            id: user._id,
            role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    );

    res.json({
        message: "Login successful",
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        }
    });

} catch (error) {
    res.status(500).json({
        message: "Login failed"
    });
}

});



app.get("/api/test", (req, res) => {
  res.json({
    message: "Main server is working!"
  });
});

console.log("TEST ROUTE ADDED");


// Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
console.log(`Server running on port ${PORT}`);
});
