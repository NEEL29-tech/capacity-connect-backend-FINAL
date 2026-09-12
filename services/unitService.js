const { pool } = require("../config/db");

// Create a new unit
async function createUnit(unitData) {
  const { courseId, unitNumber, title, description } = unitData;

  const result = await pool.query(
    `
    INSERT INTO units (course_id, unit_number, title, description)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
    `,
    [courseId, unitNumber, title, description || null]
  );

  return result.rows[0];
}

// Get all units of a course
async function getUnitsByCourse(courseId) {
  const result = await pool.query(
    `
    SELECT *
    FROM units
    WHERE course_id = $1
    ORDER BY unit_number ASC;
    `,
    [courseId]
  );

  return result.rows;
}

// Get one unit by ID
async function getUnitById(unitId) {
  const result = await pool.query(
    `
    SELECT *
    FROM units
    WHERE id = $1;
    `,
    [unitId]
  );

  return result.rows[0];
}

// Update a unit
async function updateUnit(unitId, unitData) {
  const { unitNumber, title, description } = unitData;

  const result = await pool.query(
    `
    UPDATE units
    SET
      unit_number = $1,
      title = $2,
      description = $3,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $4
    RETURNING *;
    `,
    [unitNumber, title, description || null, unitId]
  );

  return result.rows[0];
}

// Delete a unit
async function deleteUnit(unitId) {
  const result = await pool.query(
    `
    DELETE FROM units
    WHERE id = $1
    RETURNING *;
    `,
    [unitId]
  );

  return result.rows[0];
}

module.exports = {
  createUnit,
  getUnitsByCourse,
  getUnitById,
  updateUnit,
  deleteUnit,
};