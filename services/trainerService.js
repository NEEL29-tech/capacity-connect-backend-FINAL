
/**
 * Trainer Service
 * Capacity Connect LMS (SIH26075)
 *
 * Architecture:
 * routes -> controllers -> services -> PostgreSQL pool
 */

const db = require('../config/db');

class TrainerService {

  // Get all courses created by trainer
  async getTrainerCourses(trainerId) {
    const res = await db.query(`
      SELECT c.*
      FROM courses c
      WHERE c.trainer_id = $1
      ORDER BY c.created_at DESC
    `, [trainerId]);

    const courses = res.rows;

    if (courses.length === 0) {
      return [];
    }

    // Module counts
    const moduleCountsRes = await db.query(`
      SELECT course_id, COUNT(*) AS count
      FROM modules
      GROUP BY course_id
    `);

    // Enrollment counts
    const enrollmentCountsRes = await db.query(`
      SELECT course_id, COUNT(*) AS count
      FROM enrollments
      GROUP BY course_id
    `);

    // Quiz counts
    const quizCountsRes = await db.query(`
      SELECT course_id, COUNT(*) AS count
      FROM quizzes
      GROUP BY course_id
    `);

    const moduleMap = {};

    moduleCountsRes.rows.forEach(row => {
      moduleMap[row.course_id] = parseInt(row.count, 10);
    });

    const enrollmentMap = {};

    enrollmentCountsRes.rows.forEach(row => {
      enrollmentMap[row.course_id] = parseInt(row.count, 10);
    });

    const quizMap = {};

    quizCountsRes.rows.forEach(row => {
      quizMap[row.course_id] = parseInt(row.count, 10);
    });

    return courses.map(course => ({
      ...course,
      module_count: moduleMap[course.id] || 0,
      student_count: enrollmentMap[course.id] || 0,
      quiz_count: quizMap[course.id] || 0
    }));
  }


  // Get all enrollments in trainer's courses
  async getTrainerEnrollments(trainerId) {
    const res = await db.query(`
      SELECT
        e.id AS enrollment_id,
        e.learner_id,
        e.status,
        e.enrolled_at,
        e.completed_at,
        c.id AS course_id,
        c.title AS course_title,
        u.id AS student_id,
        u.name AS student_name,
        u.email AS student_email
      FROM enrollments e
      JOIN courses c
        ON e.course_id = c.id
      JOIN users u
        ON e.learner_id = u.id
      WHERE c.trainer_id = $1
      ORDER BY e.enrolled_at DESC
    `, [trainerId]);

    return res.rows;
  }


  // Trainer analytics
  async getTrainerAnalytics(trainerId) {

    // Trainer courses
    const coursesRes = await db.query(`
      SELECT
        id,
        title
      FROM courses
      WHERE trainer_id = $1
      ORDER BY id
    `, [trainerId]);

    const courseIds = coursesRes.rows.map(course => course.id);

    // Trainer has no courses
    if (courseIds.length === 0) {
      return {
        totalCourses: 0,
        totalStudentsEnrolled: 0,
        completedEnrollments: 0,
        completionRatePercentage: 0,
        courses: []
      };
    }

    // Create placeholders: $1, $2, $3...
    const placeholders = courseIds
      .map((_, index) => `$${index + 1}`)
      .join(', ');

    // Get enrollments for trainer courses
    const enrollmentsRes = await db.query(`
      SELECT
        e.id,
        e.course_id,
        e.learner_id,
        e.status
      FROM enrollments e
      WHERE e.course_id IN (${placeholders})
    `, courseIds);

    const totalStudents = enrollmentsRes.rows.length;

    const completedStudents =
      enrollmentsRes.rows.filter(
        enrollment => enrollment.status === 'COMPLETED'
      ).length;

    const completionRate =
      totalStudents > 0
        ? Math.round((completedStudents / totalStudents) * 100)
        : 0;

    return {
      totalCourses: courseIds.length,
      totalStudentsEnrolled: totalStudents,
      completedEnrollments: completedStudents,
      completionRatePercentage: completionRate,
      courses: coursesRes.rows
    };
  }
}

module.exports = new TrainerService();
