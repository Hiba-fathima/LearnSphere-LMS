const express = require("express");
const router = express.Router();

const Category = require("../models/Category");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// =====================================
// IMAGE UPLOAD CONFIGURATION
// =====================================

const uploadFolder = path.join(__dirname, "../uploads/categories");

if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadFolder);
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9);

    cb(
      null,
      uniqueName + path.extname(file.originalname)
    );
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

// =====================================
// GET ALL CATEGORIES
// =====================================

router.get("/", async (req, res) => {
  try {
    const categories = await Category.find().sort({
      createdAt: -1,
    });

    res.status(200).json({
      categories,
    });
  } catch (error) {
    console.error("Fetch categories error:", error);

    res.status(500).json({
      message: "Failed to fetch categories",
    });
  }
});

// =====================================
// ADD CATEGORY
// =====================================

router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Category name is required",
      });
    }

    const existingCategory = await Category.findOne({
      name: name.trim(),
    });

    if (existingCategory) {
      return res.status(409).json({
        message: "Category already exists",
      });
    }

    const category = new Category({
      name: name.trim(),
      description: description || "",
      image: req.file
        ? `/uploads/categories/${req.file.filename}`
        : "",
    });

    await category.save();

    res.status(201).json({
      message: "Category added successfully",
      category,
    });
  } catch (error) {
    console.error("Add category error:", error);

    res.status(500).json({
      message: "Failed to add category",
    });
  }
});

// =====================================
// DELETE CATEGORY
// =====================================

router.delete("/:id", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    await category.deleteOne();

    res.status(200).json({
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Delete category error:", error);

    res.status(500).json({
      message: "Failed to delete category",
    });
  }
});

module.exports = router;