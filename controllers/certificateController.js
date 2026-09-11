/**
 * Certificate Controller
 * Capacity Connect LMS (SIH26075)
 * Architecture: routes -> controllers -> services -> PostgreSQL pool
 */

const certificateService = require('../services/certificateService');

class CertificateController {
  async generateCertificate(req, res, next) {
    try {
      const { enrollmentId } = req.body;
      const certificate = await certificateService.generateCertificate({
        enrollmentId: parseInt(enrollmentId, 10),
        userId: req.user.id
      });
      return res.status(201).json({
        success: true,
        message: 'Certificate generated successfully',
        data: certificate
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyCertificates(req, res, next) {
    try {
      const certificates = await certificateService.getLearnerCertificates(req.user.id);
      return res.status(200).json({
        success: true,
        count: certificates.length,
        data: certificates
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyCertificate(req, res, next) {
    try {
      const { code } = req.params;
      const result = await certificateService.verifyCertificate(code);
      return res.status(200).json({
        success: result.isValid,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CertificateController();
