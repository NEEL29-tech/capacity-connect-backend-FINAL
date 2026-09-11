/**
 * Admin Routes
 * Capacity Connect LMS (SIH26075)
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.use(authenticateToken);
router.use(authorizeRoles('ADMIN'));

router.get('/stats', (req, res, next) => adminController.getStats(req, res, next));
router.get('/users', (req, res, next) => adminController.getUsers(req, res, next));
router.put('/users/:id/role', (req, res, next) => adminController.updateUserRole(req, res, next));
router.delete('/users/:id', (req, res, next) => adminController.deleteUser(req, res, next));
router.get('/audit-logs', (req, res, next) => adminController.getAuditLogs(req, res, next));

module.exports = router;
