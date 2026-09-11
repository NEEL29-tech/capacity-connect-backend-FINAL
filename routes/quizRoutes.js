/**
 * Quiz Routes
 * Capacity Connect LMS (SIH26075)
 */

const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.use(authenticateToken);

// Quiz metadata & questions
router.get('/:id', (req, res, next) => quizController.getQuiz(req, res, next));
router.get('/:id/questions', (req, res, next) => quizController.getQuizQuestions(req, res, next));

// Learner attempts
router.post('/:id/start', (req, res, next) => quizController.startAttempt(req, res, next));
router.post('/attempts/:attemptId/submit', (req, res, next) => quizController.submitAttempt(req, res, next));
router.get('/attempts/:attemptId/result', (req, res, next) => quizController.getAttemptResult(req, res, next));

// Trainer / Admin management
router.post(
  '/',
  authorizeRoles('TRAINER', 'ADMIN'),
  (req, res, next) => quizController.createQuiz(req, res, next)
);

router.post(
  '/:id/questions',
  authorizeRoles('TRAINER', 'ADMIN'),
  (req, res, next) => quizController.addQuestion(req, res, next)
);

module.exports = router;
