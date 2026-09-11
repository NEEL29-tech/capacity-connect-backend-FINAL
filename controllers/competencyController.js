/**
 * Competency Controller
 * Capacity Connect LMS (SIH26075)
 */

const competencyService = require('../services/competencyService');

class CompetencyController {

  // Get all competencies
  async getAllCompetencies(req, res, next) {
    try {
      const list = await competencyService.getAllCompetencies();

      return res.status(200).json({
        success: true,
        count: list.length,
        data: list
      });
    } catch (error) {
      next(error);
    }
  }

  // Create competency
  async createCompetency(req, res, next) {
    try {
      const {
        name,
        description,
        category
      } = req.body;

      const comp = await competencyService.createCompetency({
        name,
        description,
        category
      });

      return res.status(201).json({
        success: true,
        message: 'Competency created successfully',
        data: comp
      });
    } catch (error) {
      next(error);
    }
  }

  // Map competency to course
  async mapCourseCompetency(req, res, next) {
    try {
      const {
        courseId,
        competencyId,
        requiredLevel
      } = req.body;

      const mapping =
        await competencyService.mapCourseCompetency({
          courseId: parseInt(courseId, 10),
          competencyId: parseInt(competencyId, 10),
          requiredLevel: parseInt(requiredLevel, 10),
          userId: req.user.id,
          userRole: req.user.role
        });

      return res.status(201).json({
        success: true,
        message: 'Competency mapped to course successfully',
        data: mapping
      });
    } catch (error) {
      next(error);
    }
  }

  // Get course competencies
  async getCourseCompetencies(req, res, next) {
    try {
      const courseId = parseInt(
        req.params.courseId,
        10
      );

      const list =
        await competencyService.getCourseCompetencies(
          courseId
        );

      return res.status(200).json({
        success: true,
        count: list.length,
        data: list
      });
    } catch (error) {
      next(error);
    }
  }

  // Get learner competency profile
  async getLearnerProfile(req, res, next) {
    try {
      const userId = req.user.id;

      const list =
        await competencyService.getLearnerCompetencyProfile(
          userId
        );

      return res.status(200).json({
        success: true,
        count: list.length,
        data: list
      });
    } catch (error) {
      next(error);
    }
  }

  // Update learner competency
  async updateLearnerCompetency(req, res, next) {
    try {
      const {
        competencyId,
        proficiencyLevel,
        targetLevel
      } = req.body;

      const updated =
        await competencyService.updateLearnerCompetency({
          userId: req.user.id,
          competencyId: parseInt(competencyId, 10),
          proficiencyLevel,
          targetLevel
        });

      return res.status(200).json({
        success: true,
        message: 'Learner competency updated successfully',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CompetencyController();