const express = require("express");
const router = express.Router();

const topicController = require("../controllers/topicController");

// Create Topic
router.post("/", topicController.createTopic);

// Get all Topics of a Unit
router.get("/unit/:unitId", topicController.getTopicsByUnit);

// Get Topic by ID
router.get("/:id", topicController.getTopicById);

// Update Topic
router.put("/:id", topicController.updateTopic);

// Delete Topic
router.delete("/:id", topicController.deleteTopic);

module.exports = router;