/**
 * Admin Controller
 * Capacity Connect LMS (SIH26075)
 * Architecture: routes -> controllers -> services -> PostgreSQL pool
 */

const adminService = require('../services/adminService');

class AdminController {
  async getStats(req, res, next) {
    try {
      const stats = await adminService.getPlatformStats();
      return res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  async getUsers(req, res, next) {
    try {
      const users = await adminService.getAllUsers(req.query);
      return res.status(200).json({
        success: true,
        count: users.length,
        data: users
      });
    } catch (error) {
      next(error);
    }
  }

  async updateUserRole(req, res, next) {
    try {
      const userId = parseInt(req.params.id, 10);
      const { role } = req.body;
      const user = await adminService.updateUserRole(userId, role);
      return res.status(200).json({
        success: true,
        message: 'User role updated successfully',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req, res, next) {
    try {
      const userId = parseInt(req.params.id, 10);
      const result = await adminService.deleteUser(userId);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getAuditLogs(req, res, next) {
    try {
      const logs = await adminService.getAuditLogs();
      return res.status(200).json({
        success: true,
        count: logs.length,
        data: logs
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminController();
