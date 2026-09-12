/**
 * Certificate Routes
 * Capacity Connect LMS (SIH26075)
 */

const express = require("express");

const router = express.Router();

const certificateController = require("../controllers/certificateController");
const { authenticateToken } = require("../middleware/authMiddleware");

// Public verification
router.get(
  "/verify/:code",
  (req, res, next) =>
    certificateController.verify(req, res, next)
);

// Learner endpoints (Protected)
router.post(
  "/generate",
  authenticateToken,
  (req, res, next) =>
    certificateController.generate(req, res, next)
);

router.get(
  "/my",
  authenticateToken,
  (req, res, next) =>
    certificateController.getMyCertificates(req, res, next)
);

module.exports = router;