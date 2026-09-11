/**
 * Enrollment Controller
 * Capacity Connect LMS (SIH26075)
 * Architecture: routes -> controllers -> services -> PostgreSQL pool
 */

const enrollmentService = require('../services/enrollmentService');

class EnrollmentController {
  async enroll(req, res, next) {
    try {
      const { courseId } = req.body;
      const enrollment = await enrollmentService.enroll({
        userId: req.user.id,
        courseId: parseInt(courseId, 10)
      });
      return res.status(201).json({
        success: true,
        message: 'Enrolled in course successfully',
        data: enrollment
      });
    } catch (error) {
      if (error.statusCode === 409) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }
      next(error);
    }
  }

  async getMyEnrollments(req, res, next) {
    try {
      const enrollments = await enrollmentService.getUserEnrollments(req.user.id);
      return res.status(200).json({
        success: true,
        count: enrollments.length,
        data: enrollments
      });
    } catch (error) {
      next(error);
    }
  }

  async getEnrollmentById(req, res, next) {
    try {
      const enrollmentId = parseInt(req.params.id, 10);
      const enrollment = await enrollmentService.getEnrollmentById(
        enrollmentId,
        req.user.id,
        req.user.role
      );
      return res.status(200).json({
        success: true,
        data: enrollment
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new EnrollmentController();
