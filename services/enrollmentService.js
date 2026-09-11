const db = require('../config/db');

class EnrollmentService {

  // Enroll learner in a course
  async enroll({ userId, courseId }) {

    if (!courseId) {
      const error = new Error('courseId is required');
      error.statusCode = 400;
      throw error;
    }

    // Verify course exists and is published
    const courseRes = await db.query(
      'SELECT id, title, is_published FROM courses WHERE id = $1',
      [courseId]
    );

    if (courseRes.rows.length === 0) {
      const error = new Error('Course not found');
      error.statusCode = 404;
      throw error;
    }

    // Check existing enrollment
    const existing = await db.query(
      'SELECT id, status FROM enrollments WHERE learner_id = $1 AND course_id = $2',
      [userId, courseId]
    );

    if (existing.rows.length > 0) {
      const error = new Error('User is already enrolled in this course');
      error.statusCode = 409;
      throw error;
    }

    // Create enrollment
    const insertRes = await db.query(`
      INSERT INTO enrollments (learner_id, course_id, status)
      VALUES ($1, $2, 'ACTIVE')
      RETURNING *
    `, [userId, courseId]);

    const enrollment = insertRes.rows[0];

    // Create notification
    try {
      await db.query(`
        INSERT INTO notifications (user_id, title, message, type)
        VALUES ($1, 'Enrollment Successful', $2, 'SUCCESS')
      `, [
        userId,
        `You have successfully enrolled in "${courseRes.rows[0].title}".`
      ]);
    } catch (e) {
      console.warn(
        '[EnrollmentService] Notification warning:',
        e.message
      );
    }

    return enrollment;
  }

  // Get all enrollments for a user
  async getUserEnrollments(userId) {

    const res = await db.query(`
      SELECT
        e.id,
        e.learner_id,
        e.course_id,
        e.status,
        e.enrolled_at,
        e.completed_at,
        c.title AS course_title,
        c.description AS course_description,
        c.category,
        c.level
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      WHERE e.learner_id = $1
      ORDER BY e.enrolled_at DESC
    `, [userId]);

    const enrollments = res.rows;

    if (enrollments.length === 0) return [];

    const moduleCountsRes = await db.query(`
      SELECT course_id, COUNT(*) AS count
      FROM modules
      GROUP BY course_id
    `);

    const modCountMap = {};

    moduleCountsRes.rows.forEach(r => {
      modCountMap[r.course_id] = parseInt(r.count, 10);
    });

    const progressCountsRes = await db.query(`
      SELECT enrollment_id, COUNT(*) AS count
      FROM learning_progress
      WHERE completed = true
      GROUP BY enrollment_id
    `);

    const progressMap = {};

    progressCountsRes.rows.forEach(r => {
      progressMap[r.enrollment_id] = parseInt(r.count, 10);
    });

    return enrollments.map(e => {

      const total = modCountMap[e.course_id] || 0;
      const done = progressMap[e.id] || 0;

      const pct = total > 0
        ? Math.round((done / total) * 100)
        : 0;

      return {
        ...e,
        total_modules: total,
        completed_modules: done,
        completionPercentage: pct
      };
    });
  }

  // Get single enrollment details
  async getEnrollmentById(enrollmentId, userId, userRole) {

    const res = await db.query(`
      SELECT
        e.id,
        e.learner_id,
        e.course_id,
        e.status,
        e.enrolled_at,
        e.completed_at,
        c.title AS course_title,
        c.description AS course_description,
        u.name AS learner_name,
        u.email AS learner_email
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      JOIN users u ON e.learner_id = u.id
      WHERE e.id = $1
    `, [enrollmentId]);

    if (res.rows.length === 0) {
      const error = new Error('Enrollment not found');
      error.statusCode = 404;
      throw error;
    }

    const enrollment = res.rows[0];

    if (
      userRole !== 'ADMIN' &&
      userRole !== 'TRAINER' &&
      enrollment.learner_id !== userId
    ) {
      const error = new Error(
        'Unauthorized: You cannot access another user enrollment'
      );
      error.statusCode = 403;
      throw error;
    }

    return enrollment;
  }
}

module.exports = new EnrollmentService();