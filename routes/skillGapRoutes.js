/**
 * Skill Gap Routes
 * Capacity Connect LMS (SIH26075)
 */

const express = require('express');
const router = express.Router();
const skillGapController = require('../controllers/skillGapController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.get('/summary', (req, res, next) => skillGapController.getOverallSummary(req, res, next));
router.get('/course/:courseId', (req, res, next) => skillGapController.analyzeCourseGap(req, res, next));

module.exports = router;
