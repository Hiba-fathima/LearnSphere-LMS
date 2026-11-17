const express = require("express");
const router = express.Router();

const { signup, login } = require("../controllers/authController");

// Student and instructor registration
router.post("/signup", signup);

// User login
router.post("/login", login);

module.exports = router;
