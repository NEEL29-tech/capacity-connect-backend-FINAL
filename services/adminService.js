
/**
 * Admin Service
 * Capacity Connect LMS (SIH26075)
 *
 * Architecture:
 * routes -> controllers -> services -> PostgreSQL pool
 */

const db = require('../config/db');

class AdminService {

  // Get platform statistics
  async getPlatformStats() {
    const usersCountRes = await db.query(
      'SELECT COUNT(*) AS count FROM users'
    );

    const learnersCountRes = await db.query(
      "SELECT COUNT(*) AS count FROM users WHERE role = 'LEARNER'"
    );

    const trainersCountRes = await db.query(
      "SELECT COUNT(*) AS count FROM users WHERE role = 'TRAINER'"
    );

    const coursesCountRes = await db.query(
      'SELECT COUNT(*) AS count FROM courses'
    );

    const enrollmentsCountRes = await db.query(
      'SELECT COUNT(*) AS count FROM enrollments'
    );

    const completedCountRes = await db.query(
      "SELECT COUNT(*) AS count FROM enrollments WHERE status = 'COMPLETED'"
    );

    const certificatesCountRes = await db.query(
      'SELECT COUNT(*) AS count FROM certificates'
    );

    const competenciesCountRes = await db.query(
      'SELECT COUNT(*) AS count FROM competencies'
    );

    const resourcesCountRes = await db.query(
      'SELECT COUNT(*) AS count FROM knowledge_resources'
    );

    return {
      totalUsers: parseInt(usersCountRes.rows[0].count, 10) || 0,
      totalLearners: parseInt(learnersCountRes.rows[0].count, 10) || 0,
      totalTrainers: parseInt(trainersCountRes.rows[0].count, 10) || 0,
      totalCourses: parseInt(coursesCountRes.rows[0].count, 10) || 0,
      totalEnrollments: parseInt(enrollmentsCountRes.rows[0].count, 10) || 0,
      completedEnrollments:
        parseInt(completedCountRes.rows[0].count, 10) || 0,
      certificatesIssued:
        parseInt(certificatesCountRes.rows[0].count, 10) || 0,
      totalCompetencies:
        parseInt(competenciesCountRes.rows[0].count, 10) || 0,
      knowledgeResources:
        parseInt(resourcesCountRes.rows[0].count, 10) || 0
    };
  }


  // Get all users
  async getAllUsers(filters = {}) {
    let query = `
      SELECT
        id,
        name,
        email,
        role,
        bio,
        created_at,
        updated_at
      FROM users
      WHERE 1 = 1
    `;

    const params = [];

    if (filters.role) {
      const role = filters.role.toUpperCase();

      const validRoles = ['LEARNER', 'TRAINER', 'ADMIN'];

      if (!validRoles.includes(role)) {
        const error = new Error(
          `Invalid role filter. Allowed: ${validRoles.join(', ')}`
        );
        error.statusCode = 400;
        throw error;
      }

      params.push(role);
      query += ` AND role = $${params.length}`;
    }

    query += ' ORDER BY created_at DESC';

    const res = await db.query(query, params);

    return res.rows;
  }


  // Update user role
  async updateUserRole(userId, newRole) {

    if (!newRole || typeof newRole !== 'string') {
      const error = new Error(
        'Role is required. Allowed: LEARNER, TRAINER, ADMIN'
      );
      error.statusCode = 400;
      throw error;
    }

    const validRoles = ['LEARNER', 'TRAINER', 'ADMIN'];
    const cleanRole = newRole.toUpperCase();

    if (!validRoles.includes(cleanRole)) {
      const error = new Error(
        `Invalid role. Allowed: ${validRoles.join(', ')}`
      );
      error.statusCode = 400;
      throw error;
    }

    const res = await db.query(`
      UPDATE users
      SET
        role = $1,
        updated_at = NOW()
      WHERE id = $2
      RETURNING id, name, email, role, updated_at
    `, [cleanRole, userId]);

    if (res.rows.length === 0) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    return res.rows[0];
  }


  // Delete user
  async deleteUser(userId) {
    const res = await db.query(`
      DELETE FROM users
      WHERE id = $1
      RETURNING id, name, email
    `, [userId]);

    if (res.rows.length === 0) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    return {
      success: true,
      message: 'User deleted successfully',
      user: res.rows[0]
    };
  }


  // Get audit logs
  async getAuditLogs() {
    try {
      const res = await db.query(`
        SELECT *
        FROM audit_logs
        ORDER BY created_at DESC
      `);

      return res.rows;

    } catch (error) {

      // Current database may not contain audit_logs yet.
      if (error.code === '42P01') {
        return [];
      }

      throw error;
    }
  }
}

module.exports = new AdminService();

