const { pool } = require("../config/db");

// Create a new topic
async function createTopic(topicData) {
  const { unitId, topicNumber, title, description } = topicData;

  const result = await pool.query(
    `
    INSERT INTO topics (unit_id, topic_number, title, description)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
    `,
    [unitId, topicNumber, title, description || null]
  );

  return result.rows[0];
}

// Get all topics of a unit
async function getTopicsByUnit(unitId) {
  const result = await pool.query(
    `
    SELECT *
    FROM topics
    WHERE unit_id = $1
    ORDER BY topic_number ASC;
    `,
    [unitId]
  );

  return result.rows;
}

// Get one topic by ID
async function getTopicById(topicId) {
  const result = await pool.query(
    `
    SELECT *
    FROM topics
    WHERE id = $1;
    `,
    [topicId]
  );

  return result.rows[0];
}

// Update a topic
async function updateTopic(topicId, topicData) {
  const { topicNumber, title, description } = topicData;

  const result = await pool.query(
    `
    UPDATE topics
    SET
      topic_number = $1,
      title = $2,
      description = $3,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $4
    RETURNING *;
    `,
    [topicNumber, title, description || null, topicId]
  );

  return result.rows[0];
}

// Delete a topic
async function deleteTopic(topicId) {
  const result = await pool.query(
    `
    DELETE FROM topics
    WHERE id = $1
    RETURNING *;
    `,
    [topicId]
  );

  return result.rows[0];
}

module.exports = {
  createTopic,
  getTopicsByUnit,
  getTopicById,
  updateTopic,
  deleteTopic,
};