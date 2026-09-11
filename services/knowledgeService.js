/**
 * Knowledge Hub Service
 * Capacity Connect LMS (SIH26075)
 * Architecture: routes -> controllers -> services -> PostgreSQL pool
 */

const db = require('../config/db');

class KnowledgeService {
  async getAllResources(filters = {}) {
    let query = `
      SELECT kr.*, u.name as author_name
      FROM knowledge_resources kr
      LEFT JOIN users u ON kr.created_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.category) {
      params.push(filters.category);
      query += ` AND kr.category = $${params.length}`;
    }

    if (filters.resourceType) {
      params.push(filters.resourceType);
      query += ` AND kr.resource_type = $${params.length}`;
    }

    query += ' ORDER BY kr.created_at DESC';

    const res = await db.query(query, params);
    return res.rows;
  }

  async getResourceById(resourceId) {
    const res = await db.query(`
      SELECT kr.*, u.name as author_name, u.email as author_email
      FROM knowledge_resources kr
      LEFT JOIN users u ON kr.created_by = u.id
      WHERE kr.id = $1
    `, [resourceId]);

    if (res.rows.length === 0) {
      const error = new Error('Resource not found');
      error.statusCode = 404;
      throw error;
    }

    return res.rows[0];
  }

  async createResource({ title, description, category, resourceType = 'DOCUMENT', url, fileSize, userId }) {
    if (!title || !url || !category) {
      const error = new Error('title, url, and category are required');
      error.statusCode = 400;
      throw error;
    }

    const res = await db.query(`
      INSERT INTO knowledge_resources (title, description, category, resource_type, url, file_size, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [title.trim(), description, category.trim(), resourceType.toUpperCase(), url.trim(), fileSize || 'N/A', userId]);

    return res.rows[0];
  }

  async updateResource(resourceId, updates, userId, userRole) {
    const existing = await db.query('SELECT created_by FROM knowledge_resources WHERE id = $1', [resourceId]);
    if (existing.rows.length === 0) {
      const error = new Error('Resource not found');
      error.statusCode = 404;
      throw error;
    }

    if (userRole !== 'ADMIN' && existing.rows[0].created_by !== userId) {
      const error = new Error('Forbidden: You can only edit your own resources');
      error.statusCode = 403;
      throw error;
    }

    const { title, description, category, resource_type, url, file_size } = updates;

    const res = await db.query(`
      UPDATE knowledge_resources
      SET title = COALESCE($1, title),
          description = COALESCE($2, description),
          category = COALESCE($3, category),
          resource_type = COALESCE($4, resource_type),
          url = COALESCE($5, url),
          file_size = COALESCE($6, file_size),
          updated_at = NOW()
      WHERE id = $7
      RETURNING *
    `, [title, description, category, resource_type, url, file_size, resourceId]);

    return res.rows[0];
  }

  async deleteResource(resourceId, userId, userRole) {
    const existing = await db.query('SELECT created_by FROM knowledge_resources WHERE id = $1', [resourceId]);
    if (existing.rows.length === 0) {
      const error = new Error('Resource not found');
      error.statusCode = 404;
      throw error;
    }

    if (userRole !== 'ADMIN' && existing.rows[0].created_by !== userId) {
      const error = new Error('Forbidden: You can only delete your own resources');
      error.statusCode = 403;
      throw error;
    }

    await db.query('DELETE FROM knowledge_resources WHERE id = $1', [resourceId]);
    return { success: true, message: 'Resource deleted successfully' };
  }
}

module.exports = new KnowledgeService();
