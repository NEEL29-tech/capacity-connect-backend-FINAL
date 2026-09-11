/**
 * Assignment Routes
 * Capacity Connect LMS (SIH26075)
 */

const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.use(authenticateToken);

router.get('/my-submissions', (req, res, next) => assignmentController.getMySubmissions(req, res, next));
router.get('/course/:courseId', (req, res, next) => assignmentController.getAssignmentsByCourse(req, res, next));
router.get('/:id', (req, res, next) => assignmentController.getAssignmentById(req, res, next));

// Learner submit
router.post('/:id/submit', (req, res, next) => assignmentController.submitAssignment(req, res, next));

// Trainer/Admin operations
router.post(
  '/',
  authorizeRoles('TRAINER', 'ADMIN'),
  (req, res, next) => assignmentController.createAssignment(req, res, next)
);

router.put(
  '/submissions/:submissionId/grade',
  authorizeRoles('TRAINER', 'ADMIN'),
  (req, res, next) => assignmentController.gradeSubmission(req, res, next)
);

module.exports = router;
