/**
 * Learning Progress Controller
 * Capacity Connect LMS (SIH26075)
 */

const progressService = require('../services/progressService');

class ProgressController {

  // POST /api/progress/complete
  async completeModule(req, res) {
    try {
      const enrollmentId = Number(
        req.body?.enrollmentId ?? req.body?.enrollment_id
      );

      const moduleId = Number(
        req.body?.moduleId ?? req.body?.module_id
      );

      const userId = Number(
        req.user?.userId ?? req.user?.id
      );

      if (
        !Number.isInteger(userId) ||
        !Number.isInteger(enrollmentId) ||
        !Number.isInteger(moduleId)
      ) {
        return res.status(400).json({
          success: false,
          message: 'Invalid userId, enrollmentId or moduleId'
        });
      }

      const result = await progressService.completeModule(
        userId,
        enrollmentId,
        moduleId
      );

      return res.status(200).json({
        success: true,
        message: result.isCourseCompleted
          ? 'Module completed! Congratulations, you have completed the entire course!'
          : 'Module marked as completed',
        data: result
      });

    } catch (error) {
      console.error('[ProgressController] completeModule:', error);

      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to complete module'
      });
    }
  }


  // GET /api/progress/enrollment/:enrollmentId
  async getEnrollmentProgress(req, res) {
    try {
      const enrollmentId = Number(req.params.enrollmentId);

      const userId = Number(
        req.user?.userId ?? req.user?.id
      );

      if (
        !Number.isInteger(userId) ||
        !Number.isInteger(enrollmentId)
      ) {
        return res.status(400).json({
          success: false,
          message: 'Invalid userId or enrollmentId'
        });
      }

      const result = await progressService.getEnrollmentProgress(
        userId,
        enrollmentId
      );

      return res.status(200).json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('[ProgressController] getEnrollmentProgress:', error);

      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to get enrollment progress'
      });
    }
  }


  // GET /api/progress/course/:courseId
  async getCourseProgress(req, res) {
    try {
      const courseId = Number(req.params.courseId);

      const userId = Number(
        req.user?.userId ?? req.user?.id
      );

      if (
        !Number.isInteger(userId) ||
        !Number.isInteger(courseId)
      ) {
        return res.status(400).json({
          success: false,
          message: 'Invalid userId or courseId'
        });
      }

      const result = await progressService.getProgressByCourse(
        userId,
        courseId
      );

      return res.status(200).json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('[ProgressController] getCourseProgress:', error);

      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to get course progress'
      });
    }
  }
}

module.exports = new ProgressController();