/**
 * Notification Routes
 * Capacity Connect LMS (SIH26075)
 */

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.get('/', (req, res, next) => notificationController.getNotifications(req, res, next));
router.put('/:id/read', (req, res, next) => notificationController.markAsRead(req, res, next));
router.put('/mark-all-read', (req, res, next) => notificationController.markAllAsRead(req, res, next));

module.exports = router;
