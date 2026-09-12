/**
 * Enrollment Routes
 * Capacity Connect LMS (SIH26075)
 */

const express = require('express');

const router = express.Router();

const enrollmentController = require('../controllers/enrollmentController');

const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.post('/', (req, res, next) =>
  enrollmentController.enroll(req, res, next)
);

router.get('/my', (req, res, next) =>
  enrollmentController.getMyEnrollments(req, res, next)
);

router.get('/:id', (req, res, next) =>
  enrollmentController.getEnrollmentById(req, res, next)
);

module.exports = router;