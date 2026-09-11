/**
 * Trainer Controller
 * Capacity Connect LMS (SIH26075)
 *
 * Architecture:
 * routes -> controllers -> services -> PostgreSQL pool
 */

const trainerService = require('../services/trainerService');

class TrainerController {

  // GET /api/trainer/courses
  async getMyCourses(req, res, next) {

    try {

      const trainerId = req.user.id;

      const courses =
        await trainerService.getTrainerCourses(trainerId);

      return res.status(200).json({
        success: true,
        count: courses.length,
        data: courses
      });

    } catch (error) {
      next(error);
    }
  }


  // GET /api/trainer/enrollments
  async getMyEnrollments(req, res, next) {

    try {

      const trainerId = req.user.id;

      const enrollments =
        await trainerService.getTrainerEnrollments(trainerId);

      return res.status(200).json({
        success: true,
        count: enrollments.length,
        data: enrollments
      });

    } catch (error) {
      next(error);
    }
  }


  // GET /api/trainer/analytics
  async getAnalytics(req, res, next) {

    try {

      const trainerId = req.user.id;

      const analytics =
        await trainerService.getTrainerAnalytics(trainerId);

      return res.status(200).json({
        success: true,
        data: analytics
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TrainerController();