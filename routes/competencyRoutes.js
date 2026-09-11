/**
 * Competency Routes
 * Capacity Connect LMS (SIH26075)
 */

const express = require('express');
const router = express.Router();
const competencyController = require('../controllers/competencyController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Public/Learner reads
router.get('/', (req, res, next) => competencyController.getAllCompetencies(req, res, next));
router.get('/course/:courseId', (req, res, next) => competencyController.getCourseCompetencies(req, res, next));

// Learner competency profile
router.get('/profile', authenticateToken, (req, res, next) => competencyController.getLearnerProfile(req, res, next));
router.post('/profile', authenticateToken, (req, res, next) => competencyController.updateLearnerCompetency(req, res, next));

// Trainer/Admin mappings
router.post(
  '/',
  authenticateToken,
  authorizeRoles('TRAINER', 'ADMIN'),
  (req, res, next) => competencyController.createCompetency(req, res, next)
);

router.post(
  '/map-course',
  authenticateToken,
  authorizeRoles('TRAINER', 'ADMIN'),
  (req, res, next) => competencyController.mapCourseCompetency(req, res, next)
);

module.exports = router;
