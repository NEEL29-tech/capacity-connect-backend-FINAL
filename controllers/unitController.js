const unitService = require("../services/unitService");

// Create Unit
async function createUnit(req, res) {
  try {
    const { courseId, unitNumber, title, description } = req.body;

    if (!courseId || !unitNumber || !title) {
      return res.status(400).json({
        message: "courseId, unitNumber and title are required",
      });
    }

    const unit = await unitService.createUnit({
      courseId,
      unitNumber,
      title,
      description,
    });

    res.status(201).json({
      message: "Unit created successfully",
      unit,
    });
  } catch (error) {
    console.error("Create Unit Error:", error.message);

    res.status(500).json({
      message: "Failed to create unit",
      error: error.message,
    });
  }
}

// Get Units by Course
async function getUnitsByCourse(req, res) {
  try {
    const { courseId } = req.params;

    const units = await unitService.getUnitsByCourse(courseId);

    res.status(200).json({
      count: units.length,
      units,
    });
  } catch (error) {
    console.error("Get Units Error:", error.message);

    res.status(500).json({
      message: "Failed to fetch units",
      error: error.message,
    });
  }
}

// Get Unit by ID
async function getUnitById(req, res) {
  try {
    const { id } = req.params;

    const unit = await unitService.getUnitById(id);

    if (!unit) {
      return res.status(404).json({
        message: "Unit not found",
      });
    }

    res.status(200).json({
      unit,
    });
  } catch (error) {
    console.error("Get Unit Error:", error.message);

    res.status(500).json({
      message: "Failed to fetch unit",
      error: error.message,
    });
  }
}

// Update Unit
async function updateUnit(req, res) {
  try {
    const { id } = req.params;
    const { unitNumber, title, description } = req.body;

    if (!unitNumber || !title) {
      return res.status(400).json({
        message: "unitNumber and title are required",
      });
    }

    const unit = await unitService.updateUnit(id, {
      unitNumber,
      title,
      description,
    });

    if (!unit) {
      return res.status(404).json({
        message: "Unit not found",
      });
    }

    res.status(200).json({
      message: "Unit updated successfully",
      unit,
    });
  } catch (error) {
    console.error("Update Unit Error:", error.message);

    res.status(500).json({
      message: "Failed to update unit",
      error: error.message,
    });
  }
}

// Delete Unit
async function deleteUnit(req, res) {
  try {
    const { id } = req.params;

    const unit = await unitService.deleteUnit(id);

    if (!unit) {
      return res.status(404).json({
        message: "Unit not found",
      });
    }

    res.status(200).json({
      message: "Unit deleted successfully",
      unit,
    });
  } catch (error) {
    console.error("Delete Unit Error:", error.message);

    res.status(500).json({
      message: "Failed to delete unit",
      error: error.message,
    });
  }
}

module.exports = {
  createUnit,
  getUnitsByCourse,
  getUnitById,
  updateUnit,
  deleteUnit,
};