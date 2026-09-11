/**
 * Authentication Routes
 * Capacity Connect LMS (SIH26075)
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/register', (req, res, next) => authController.register(req, res, next));
router.post('/login', (req, res, next) => authController.login(req, res, next));
router.get('/me', authenticateToken, (req, res, next) => authController.getMe(req, res, next));

module.exports = router;
