/**
 * Module & Content Routes
 * Capacity Connect LMS (SIH26075)
 */

const express = require('express');
const router = express.Router();
const moduleController = require('../controllers/moduleController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Get modules by course
router.get('/course/:courseId', (req, res, next) => moduleController.getModulesByCourse(req, res, next));
router.get('/:id', (req, res, next) => moduleController.getModuleById(req, res, next));
router.get('/:id/contents', (req, res, next) => moduleController.getModuleContents(req, res, next));

// Trainer/Admin operations
router.post(
  '/',
  authenticateToken,
  authorizeRoles('TRAINER', 'ADMIN'),
  (req, res, next) => moduleController.createModule(req, res, next)
);

router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('TRAINER', 'ADMIN'),
  (req, res, next) => moduleController.updateModule(req, res, next)
);

router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('TRAINER', 'ADMIN'),
  (req, res, next) => moduleController.deleteModule(req, res, next)
);

// Module Contents
router.post(
  '/:id/contents',
  authenticateToken,
  authorizeRoles('TRAINER', 'ADMIN'),
  (req, res, next) => moduleController.addModuleContent(req, res, next)
);

module.exports = router;
