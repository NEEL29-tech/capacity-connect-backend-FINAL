const express = require("express");
const router = express.Router();

const {
  uploadPDF,
  uploadAssignment,
} = require("../middleware/uploadMiddleware");

const {
  uploadPDF: uploadPDFController,
  uploadAssignment: uploadAssignmentController,
} = require("../controllers/uploadController");


router.post(
  "/pdf",
  uploadPDF.single("pdf"),
  uploadPDFController
);


router.post(
  "/assignment",
  uploadAssignment.single("assignment"),
  uploadAssignmentController
);


module.exports = router;