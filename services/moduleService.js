/**
 * Module & Module Content Service
 * Capacity Connect LMS (SIH26075)
 * Architecture: routes -> controllers -> services -> PostgreSQL pool
 */

const db = require('../config/db');

class ModuleService {
  async getModulesByCourse(courseId) {
    const res = await db.query(`
      SELECT m.id, m.course_id, m.title, m.description, m.order_index, m.created_at, m.updated_at
      FROM modules m
      WHERE m.course_id = $1
      ORDER BY m.order_index ASC
    `, [courseId]);

    const modules = res.rows;
    if (modules.length === 0) return [];

    const ids = modules.map(m => parseInt(m.id, 10));
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
    const countsRes = await db.query(`
      SELECT module_id, COUNT(*) as count
      FROM module_contents
      WHERE module_id IN (${placeholders})
      GROUP BY module_id
    `, ids);

    const countMap = {};
    countsRes.rows.forEach(r => { countMap[r.module_id] = parseInt(r.count, 10); });

    return modules.map(m => ({
      ...m,
      content_count: countMap[m.id] || 0
    }));
  }

  async getModuleById(moduleId) {
    const modRes = await db.query('SELECT * FROM modules WHERE id = $1', [moduleId]);
    if (modRes.rows.length === 0) {
      const error = new Error('Module not found');
      error.statusCode = 404;
      throw error;
    }

    const mod = modRes.rows[0];
    const contentsRes = await db.query(
      'SELECT * FROM module_contents WHERE module_id = $1 ORDER BY order_index ASC',
      [moduleId]
    );
    mod.contents = contentsRes.rows;
    return mod;
  }

  async createModule({ courseId, title, description, orderIndex = 1, userId, userRole }) {
    if (!courseId || !title) {
      const error = new Error('courseId and title are required');
      error.statusCode = 400;
      throw error;
    }

    const courseRes = await db.query('SELECT trainer_id FROM courses WHERE id = $1', [courseId]);
    if (courseRes.rows.length === 0) {
      const error = new Error('Course not found');
      error.statusCode = 404;
      throw error;
    }

    if (userRole !== 'ADMIN' && courseRes.rows[0].trainer_id !== userId) {
      const error = new Error('Forbidden: You can only add modules to your own courses');
      error.statusCode = 403;
      throw error;
    }

    const res = await db.query(`
      INSERT INTO modules (course_id, title, description, order_index)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [courseId, title.trim(), description, orderIndex]);

    return res.rows[0];
  }

  async updateModule(moduleId, { title, description, orderIndex }, userId, userRole) {
    const modRes = await db.query(`
      SELECT m.id, m.course_id, c.trainer_id
      FROM modules m
      JOIN courses c ON m.course_id = c.id
      WHERE m.id = $1
    `, [moduleId]);

    if (modRes.rows.length === 0) {
      const error = new Error('Module not found');
      error.statusCode = 404;
      throw error;
    }

    if (userRole !== 'ADMIN' && modRes.rows[0].trainer_id !== userId) {
      const error = new Error('Forbidden: You do not own this course');
      error.statusCode = 403;
      throw error;
    }

    const res = await db.query(`
      UPDATE modules
      SET title = COALESCE($1, title),
          description = COALESCE($2, description),
          order_index = COALESCE($3, order_index),
          updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `, [title, description, orderIndex, moduleId]);

    return res.rows[0];
  }

  async deleteModule(moduleId, userId, userRole) {
    const modRes = await db.query(`
      SELECT m.id, c.trainer_id
      FROM modules m
      JOIN courses c ON m.course_id = c.id
      WHERE m.id = $1
    `, [moduleId]);

    if (modRes.rows.length === 0) {
      const error = new Error('Module not found');
      error.statusCode = 404;
      throw error;
    }

    if (userRole !== 'ADMIN' && modRes.rows[0].trainer_id !== userId) {
      const error = new Error('Forbidden: You do not own this course');
      error.statusCode = 403;
      throw error;
    }

    await db.query('DELETE FROM modules WHERE id = $1', [moduleId]);
    return { success: true, message: 'Module deleted successfully' };
  }

  // --- MODULE CONTENTS ---

  async addModuleContent({ moduleId, title, contentType, contentUrl, contentData, orderIndex = 1, userId, userRole }) {
    if (!moduleId || !title || !contentType) {
      const error = new Error('moduleId, title, and contentType are required');
      error.statusCode = 400;
      throw error;
    }

    const modRes = await db.query(`
      SELECT m.id, c.trainer_id
      FROM modules m
      JOIN courses c ON m.course_id = c.id
      WHERE m.id = $1
    `, [moduleId]);

    if (modRes.rows.length === 0) {
      const error = new Error('Module not found');
      error.statusCode = 404;
      throw error;
    }

    if (userRole !== 'ADMIN' && modRes.rows[0].trainer_id !== userId) {
      const error = new Error('Forbidden: You do not own this course');
      error.statusCode = 403;
      throw error;
    }

    const res = await db.query(`
      INSERT INTO module_contents (module_id, title, content_type, content_url, content_data, order_index)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [moduleId, title.trim(), contentType.toUpperCase(), contentUrl, contentData, orderIndex]);

    return res.rows[0];
  }

  async getModuleContents(moduleId) {
    const res = await db.query(
      'SELECT * FROM module_contents WHERE module_id = $1 ORDER BY order_index ASC',
      [moduleId]
    );
    return res.rows;
  }
}

module.exports = new ModuleService();
