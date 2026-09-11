/**
 * Knowledge Hub Routes
 * Capacity Connect LMS (SIH26075)
 */

const express = require('express');
const router = express.Router();
const knowledgeController = require('../controllers/knowledgeController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Public read
router.get('/', (req, res, next) => knowledgeController.getAllResources(req, res, next));
router.get('/:id', (req, res, next) => knowledgeController.getResourceById(req, res, next));

// Trainer/Admin modifications
router.post(
  '/',
  authenticateToken,
  authorizeRoles('TRAINER', 'ADMIN'),
  (req, res, next) => knowledgeController.createResource(req, res, next)
);

router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('TRAINER', 'ADMIN'),
  (req, res, next) => knowledgeController.updateResource(req, res, next)
);

router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('TRAINER', 'ADMIN'),
  (req, res, next) => knowledgeController.deleteResource(req, res, next)
);

module.exports = router;
