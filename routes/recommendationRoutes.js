/**
 * Course Recommendation Routes
 * Capacity Connect LMS (SIH26075)
 */

const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.get('/', (req, res, next) => recommendationController.getRecommendations(req, res, next));

module.exports = router;
