const certificateService = require("../services/certificateService");

// Generate certificate
const generate = async (req, res) => {
  try {
    const { enrollmentId } = req.body;

    if (!enrollmentId) {
      return res.status(400).json({
        message: "enrollmentId is required",
      });
    }

    const result = await certificateService.generateCertificate({
      enrollmentId: Number(enrollmentId),
      userId: req.user.id,
    });

    res.status(201).json(result);
  } catch (error) {
    console.error("Generate certificate error:", error.message);

    if (error.message.includes("not completed")) {
      return res.status(400).json({
        message: error.message,
      });
    }

    if (error.message.includes("not found")) {
      return res.status(404).json({
        message: error.message,
      });
    }

    res.status(500).json({
      message: "Failed to generate certificate",
      error: error.message,
    });
  }
};


// Get my certificates
const getMyCertificates = async (req, res) => {
  try {
    const certificates = await certificateService.getMyCertificates(
      req.user.id
    );

    res.status(200).json({
      count: certificates.length,
      certificates,
    });
  } catch (error) {
    console.error("Get certificates error:", error.message);

    res.status(500).json({
      message: "Failed to fetch certificates",
      error: error.message,
    });
  }
};


// Verify certificate publicly
const verify = async (req, res) => {
  try {
    const { code } = req.params;

    const certificate = await certificateService.verifyCertificate(code);

    if (!certificate) {
      return res.status(404).json({
        message: "Certificate not found",
      });
    }

    res.status(200).json({
      verified: true,
      certificate,
    });
  } catch (error) {
    console.error("Verify certificate error:", error.message);

    res.status(500).json({
      message: "Failed to verify certificate",
      error: error.message,
    });
  }
};


module.exports = {
  generate,
  getMyCertificates,
  verify,
};