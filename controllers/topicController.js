const topicService = require("../services/topicService");

// Create Topic
async function createTopic(req, res) {
  try {
    const { unitId, topicNumber, title, description } = req.body;

    if (!unitId || !topicNumber || !title) {
      return res.status(400).json({
        message: "unitId, topicNumber and title are required",
      });
    }

    const topic = await topicService.createTopic({
      unitId,
      topicNumber,
      title,
      description,
    });

    res.status(201).json({
      message: "Topic created successfully",
      topic,
    });
  } catch (error) {
    console.error("Create Topic Error:", error.message);

    res.status(500).json({
      message: "Failed to create topic",
      error: error.message,
    });
  }
}

// Get Topics by Unit
async function getTopicsByUnit(req, res) {
  try {
    const { unitId } = req.params;

    const topics = await topicService.getTopicsByUnit(unitId);

    res.status(200).json({
      count: topics.length,
      topics,
    });
  } catch (error) {
    console.error("Get Topics Error:", error.message);

    res.status(500).json({
      message: "Failed to fetch topics",
      error: error.message,
    });
  }
}

// Get Topic by ID
async function getTopicById(req, res) {
  try {
    const { id } = req.params;

    const topic = await topicService.getTopicById(id);

    if (!topic) {
      return res.status(404).json({
        message: "Topic not found",
      });
    }

    res.status(200).json({
      topic,
    });
  } catch (error) {
    console.error("Get Topic Error:", error.message);

    res.status(500).json({
      message: "Failed to fetch topic",
      error: error.message,
    });
  }
}

// Update Topic
async function updateTopic(req, res) {
  try {
    const { id } = req.params;
    const { topicNumber, title, description } = req.body;

    if (!topicNumber || !title) {
      return res.status(400).json({
        message: "topicNumber and title are required",
      });
    }

    const topic = await topicService.updateTopic(id, {
      topicNumber,
      title,
      description,
    });

    if (!topic) {
      return res.status(404).json({
        message: "Topic not found",
      });
    }

    res.status(200).json({
      message: "Topic updated successfully",
      topic,
    });
  } catch (error) {
    console.error("Update Topic Error:", error.message);

    res.status(500).json({
      message: "Failed to update topic",
      error: error.message,
    });
  }
}

// Delete Topic
async function deleteTopic(req, res) {
  try {
    const { id } = req.params;

    const topic = await topicService.deleteTopic(id);

    if (!topic) {
      return res.status(404).json({
        message: "Topic not found",
      });
    }

    res.status(200).json({
      message: "Topic deleted successfully",
      topic,
    });
  } catch (error) {
    console.error("Delete Topic Error:", error.message);

    res.status(500).json({
      message: "Failed to delete topic",
      error: error.message,
    });
  }
}

module.exports = {
  createTopic,
  getTopicsByUnit,
  getTopicById,
  updateTopic,
  deleteTopic,
};