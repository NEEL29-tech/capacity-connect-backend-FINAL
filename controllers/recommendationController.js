/**
 * Recommendation Controller
 * Capacity Connect LMS (SIH26075)
 * Architecture: routes -> controllers -> services -> PostgreSQL pool
 */

const recommendationService = require('../services/recommendationService');

class RecommendationController {
  async getRecommendations(req, res, next) {
    try {
      const result = await recommendationService.getRecommendationsForLearner(req.user.id);
      return res.status(200).json({
        success: true,
        count: result.recommendedCount,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RecommendationController();
