/**
 * Course Routes
 * Capacity Connect LMS (SIH26075)
 */

const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Public course browsing
router.get('/', (req, res, next) => courseController.getAllCourses(req, res, next));
router.get('/:id', (req, res, next) => courseController.getCourseById(req, res, next));

// Trainer & Admin protected management
router.post(
  '/',
  authenticateToken,
  authorizeRoles('TRAINER', 'ADMIN'),
  (req, res, next) => courseController.createCourse(req, res, next)
);

router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('TRAINER', 'ADMIN'),
  (req, res, next) => courseController.updateCourse(req, res, next)
);

router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('TRAINER', 'ADMIN'),
  (req, res, next) => courseController.deleteCourse(req, res, next)
);

module.exports = router;
