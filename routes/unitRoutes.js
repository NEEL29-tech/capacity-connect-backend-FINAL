const express = require("express");
const router = express.Router();

const unitController = require("../controllers/unitController");

// Create Unit
router.post("/", unitController.createUnit);

// Get all Units of a Course
router.get("/course/:courseId", unitController.getUnitsByCourse);

// Get Unit by ID
router.get("/:id", unitController.getUnitById);

// Update Unit
router.put("/:id", unitController.updateUnit);

// Delete Unit
router.delete("/:id", unitController.deleteUnit);

module.exports = router;