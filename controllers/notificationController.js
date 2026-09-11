/**
 * Notification Controller
 * Capacity Connect LMS (SIH26075)
 * Architecture: routes -> controllers -> services -> PostgreSQL pool
 */

const notificationService = require('../services/notificationService');

class NotificationController {
  async getNotifications(req, res, next) {
    try {
      const list = await notificationService.getUserNotifications(req.user.id);
      const unreadCount = await notificationService.getUnreadCount(req.user.id);
      return res.status(200).json({
        success: true,
        count: list.length,
        unreadCount,
        data: list
      });
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req, res, next) {
    try {
      const notificationId = parseInt(req.params.id, 10);
      const updated = await notificationService.markAsRead(notificationId, req.user.id);
      return res.status(200).json({
        success: true,
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req, res, next) {
    try {
      const result = await notificationService.markAllAsRead(req.user.id);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NotificationController();
