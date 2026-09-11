/**
 * Learning Progress Routes
 * Capacity Connect LMS (SIH26075)
 */

const express = require('express');
const router = express.Router();

const progressController = require('../controllers/progressController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.post(
  '/complete',
  progressController.completeModule.bind(progressController)
);

router.get(
  '/enrollment/:enrollmentId',
  progressController.getEnrollmentProgress.bind(progressController)
);

router.get(
  '/course/:courseId',
  progressController.getCourseProgress.bind(progressController)
);

module.exports = router;