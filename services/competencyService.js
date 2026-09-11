/**
 * Competency Service
 * Capacity Connect LMS (SIH26075)
 * Architecture: routes -> controllers -> services -> PostgreSQL pool
 */

const db = require('../config/db');

class CompetencyService {

  // Get all competencies
  async getAllCompetencies() {
    const res = await db.query(
      'SELECT * FROM competencies ORDER BY name ASC'
    );

    return res.rows;
  }

  // Create competency
  async createCompetency({
    name,
    description,
    category = 'TECHNICAL'
  }) {
    if (!name) {
      const error = new Error('Competency name is required');
      error.statusCode = 400;
      throw error;
    }

    const cleanName = name.trim();

    const existing = await db.query(
      'SELECT id FROM competencies WHERE LOWER(name) = $1',
      [cleanName.toLowerCase()]
    );

    if (existing.rows.length > 0) {
      const error = new Error(
        'Competency with this name already exists'
      );
      error.statusCode = 409;
      throw error;
    }

    const res = await db.query(
      `
      INSERT INTO competencies (name, description, category)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [cleanName, description, category]
    );

    return res.rows[0];
  }

  // Map competency to course
  async mapCourseCompetency({
    courseId,
    competencyId,
    requiredLevel = 2,
    userId,
    userRole
  }) {
    const courseRes = await db.query(
      'SELECT trainer_id FROM courses WHERE id = $1',
      [courseId]
    );

    if (courseRes.rows.length === 0) {
      const error = new Error('Course not found');
      error.statusCode = 404;
      throw error;
    }

    if (
      userRole !== 'ADMIN' &&
      courseRes.rows[0].trainer_id !== userId
    ) {
      const error = new Error(
        'Forbidden: You do not own this course'
      );
      error.statusCode = 403;
      throw error;
    }

    const compRes = await db.query(
      'SELECT id FROM competencies WHERE id = $1',
      [competencyId]
    );

    if (compRes.rows.length === 0) {
      const error = new Error('Competency not found');
      error.statusCode = 404;
      throw error;
    }

    const existing = await db.query(
      `
      SELECT id
      FROM course_competencies
      WHERE course_id = $1
      AND competency_id = $2
      `,
      [courseId, competencyId]
    );

    if (existing.rows.length > 0) {
      const updateRes = await db.query(
        `
        UPDATE course_competencies
        SET target_level = $1
        WHERE id = $2
        RETURNING *
        `,
        [requiredLevel, existing.rows[0].id]
      );

      return updateRes.rows[0];
    }

    const insertRes = await db.query(
      `
      INSERT INTO course_competencies
        (course_id, competency_id, target_level)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [courseId, competencyId, requiredLevel]
    );

    return insertRes.rows[0];
  }

  // Get competencies mapped to a course
  async getCourseCompetencies(courseId) {
    const res = await db.query(
      `
      SELECT
        cc.id,
        cc.course_id,
        cc.competency_id,
        cc.target_level,
        c.name,
        c.description,
        c.category
      FROM course_competencies cc
      JOIN competencies c
        ON cc.competency_id = c.id
      WHERE cc.course_id = $1
      ORDER BY c.name ASC
      `,
      [courseId]
    );

    return res.rows;
  }

  // Get learner competency profile
  async getLearnerCompetencyProfile(userId) {
    const res = await db.query(
      `
      SELECT
        lc.id,
        lc.learner_id,
        lc.competency_id,
        lc.current_level,
        lc.target_level,
        lc.progress_percentage,
        lc.last_updated,
        c.name,
        c.description,
        c.category
      FROM learner_competencies lc
      JOIN competencies c
        ON lc.competency_id = c.id
      WHERE lc.learner_id = $1
      ORDER BY c.name ASC
      `,
      [userId]
    );

    return res.rows;
  }

  // Update learner competency
  async updateLearnerCompetency({
    userId,
    competencyId,
    proficiencyLevel = 1,
    targetLevel = 3
  }) {
    if (!competencyId) {
      const error = new Error('competencyId is required');
      error.statusCode = 400;
      throw error;
    }

    const compRes = await db.query(
      'SELECT id FROM competencies WHERE id = $1',
      [competencyId]
    );

    if (compRes.rows.length === 0) {
      const error = new Error('Competency not found');
      error.statusCode = 404;
      throw error;
    }

    const currentLevel = parseInt(proficiencyLevel, 10);
    const learnerTargetLevel = parseInt(targetLevel, 10);

    if (
      Number.isNaN(currentLevel) ||
      currentLevel < 1 ||
      currentLevel > 3
    ) {
      const error = new Error(
        'proficiencyLevel must be between 1 and 3'
      );
      error.statusCode = 400;
      throw error;
    }

    if (
      Number.isNaN(learnerTargetLevel) ||
      learnerTargetLevel < 1 ||
      learnerTargetLevel > 3
    ) {
      const error = new Error(
        'targetLevel must be between 1 and 3'
      );
      error.statusCode = 400;
      throw error;
    }

    const progressPercentage = Math.min(
      100,
      Math.round(
        (currentLevel / learnerTargetLevel) * 100
      )
    );

    const existing = await db.query(
      `
      SELECT id
      FROM learner_competencies
      WHERE learner_id = $1
      AND competency_id = $2
      `,
      [userId, competencyId]
    );

    if (existing.rows.length > 0) {
      const updateRes = await db.query(
        `
        UPDATE learner_competencies
        SET
          current_level = $1,
          target_level = $2,
          progress_percentage = $3,
          last_updated = NOW()
        WHERE id = $4
        RETURNING *
        `,
        [
          currentLevel,
          learnerTargetLevel,
          progressPercentage,
          existing.rows[0].id
        ]
      );

      return updateRes.rows[0];
    }

    const insertRes = await db.query(
      `
      INSERT INTO learner_competencies
        (
          learner_id,
          competency_id,
          current_level,
          target_level,
          progress_percentage
        )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [
        userId,
        competencyId,
        currentLevel,
        learnerTargetLevel,
        progressPercentage
      ]
    );

    return insertRes.rows[0];
  }
}

module.exports = new CompetencyService();