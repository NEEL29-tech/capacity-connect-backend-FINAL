/**
 * Skill Gap Controller
 * Capacity Connect LMS (SIH26075)
 * Architecture: routes -> controllers -> services -> PostgreSQL pool
 */

const skillGapService = require('../services/skillGapService');

class SkillGapController {
  async analyzeCourseGap(req, res, next) {
    try {
      const courseId = parseInt(req.params.courseId, 10);
      const result = await skillGapService.analyzeSkillGap({
        userId: req.user.id,
        courseId
      });
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getOverallSummary(req, res, next) {
    try {
      const result = await skillGapService.getLearnerOverallGapSummary(req.user.id);
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SkillGapController();
