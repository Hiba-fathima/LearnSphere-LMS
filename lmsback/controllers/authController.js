const User = require("../models/UserModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// SIGNUP
exports.signup = async (req, res) => {
try {
const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({
            message: "Name, email and password are required"
        });
    }

    if (password.length < 6) {
        return res.status(400).json({
            message: "Password must contain at least 6 characters"
        });
    }

    const userRole = role || "student";

    if (!["student", "instructor"].includes(userRole)) {
        return res.status(400).json({
            message: "Invalid role"
        });
    }

    const existingUser = await User.findOne({
        email: email.toLowerCase().trim()
    });

    if (existingUser) {
        return res.status(409).json({
            message: "Email is already registered"
        });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
        name,
        email,
        password: hashedPassword,
        role: userRole
    });

    res.status(201).json({
        message: "Registration successful",
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        }
    });

} catch (error) {
    res.status(500).json({
        message: "Signup failed",
        error: error.message
    });
}

};

// LOGIN
exports.login = async (req, res) => {
try {
const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Email and password are required"
        });
    }

    const user = await User.findOne({
        email: email.toLowerCase().trim()
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
        throw new Error("JWT_SECRET is missing from .env");
    }

    const token = jwt.sign(
        {
            id: user._id,
            role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    );

    res.status(200).json({
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
        message: "Login failed",
        error: error.message
    });
}

};
