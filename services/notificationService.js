/**
 * Notification Service
 * Capacity Connect LMS (SIH26075)
 * Architecture: routes -> controllers -> services -> PostgreSQL pool
 */

const db = require('../config/db');

class NotificationService {
  async getUserNotifications(userId) {
    const res = await db.query(`
      SELECT *
      FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [userId]);

    return res.rows;
  }

  async getUnreadCount(userId) {
    const res = await db.query(`
      SELECT COUNT(*) as count
      FROM notifications
      WHERE user_id = $1 AND is_read = false
    `, [userId]);

    return parseInt(res.rows[0].count, 10) || 0;
  }

  async markAsRead(notificationId, userId) {
    const res = await db.query(`
      UPDATE notifications
      SET is_read = true
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `, [notificationId, userId]);

    if (res.rows.length === 0) {
      const error = new Error('Notification not found');
      error.statusCode = 404;
      throw error;
    }

    return res.rows[0];
  }

  async markAllAsRead(userId) {
    await db.query(`
      UPDATE notifications
      SET is_read = true
      WHERE user_id = $1
    `, [userId]);

    return { success: true, message: 'All notifications marked as read' };
  }
}

module.exports = new NotificationService();
