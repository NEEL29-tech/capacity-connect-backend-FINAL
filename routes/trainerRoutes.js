/**
 * Trainer Routes
 * Capacity Connect LMS (SIH26075)
 */

const express = require('express');
const router = express.Router();

const trainerController = require('../controllers/trainerController');

const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// All trainer routes require login
router.use(authenticateToken);

// Only TRAINER can access trainer routes
router.use(authorizeRoles('TRAINER'));

// Get trainer's courses
router.get(
  '/courses',
  (req, res, next) =>
    trainerController.getMyCourses(req, res, next)
);

// Get students/enrollments
router.get(
  '/enrollments',
  (req, res, next) =>
    trainerController.getMyEnrollments(req, res, next)
);

// Get trainer analytics
router.get(
  '/analytics',
  (req, res, next) =>
    trainerController.getAnalytics(req, res, next)
);

module.exports = router;