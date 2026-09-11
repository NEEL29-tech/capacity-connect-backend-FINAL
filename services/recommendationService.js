/**
 * Course Recommendation Service
 * Capacity Connect LMS (SIH26075)
 *
 * Recommends courses based on learner competencies.
 * Excludes already enrolled courses.
 * Uses deterministic relevance scoring.
 */

const db = require('../config/db');

class RecommendationService {

  async getRecommendationsForLearner(userId) {

    // 1. Get learner's enrolled courses
    const enrollmentsRes = await db.query(
      `
      SELECT course_id, status
      FROM enrollments
      WHERE learner_id = $1
      `,
      [userId]
    );

    const enrolledCourseIds = new Set(
      enrollmentsRes.rows.map(
        (e) => parseInt(e.course_id, 10)
      )
    );

    // 2. Get learner's current competencies
    const userCompRes = await db.query(
      `
      SELECT
        competency_id,
        current_level,
        target_level,
        progress_percentage
      FROM learner_competencies
      WHERE learner_id = $1
      `,
      [userId]
    );

    const userCompetencyMap = {};

    userCompRes.rows.forEach((uc) => {
      userCompetencyMap[
        parseInt(uc.competency_id, 10)
      ] = parseInt(uc.current_level, 10);
    });

    // 3. Get all published courses
    const coursesRes = await db.query(
      `
      SELECT
        c.id,
        c.title,
        c.description,
        c.category,
        c.level,
        c.trainer_id,
        u.name AS trainer_name
      FROM courses c
      LEFT JOIN users u
        ON c.trainer_id = u.id
      WHERE c.is_published = true
      ORDER BY c.id ASC
      `
    );

    // 4. Get course competency requirements
    const courseCompRes = await db.query(
      `
      SELECT
        cc.course_id,
        cc.competency_id,
        cc.target_level,
        c.name AS competency_name
      FROM course_competencies cc
      JOIN competencies c
        ON cc.competency_id = c.id
      `
    );

    const courseCompMap = {};

    courseCompRes.rows.forEach((row) => {

      const courseId = parseInt(
        row.course_id,
        10
      );

      if (!courseCompMap[courseId]) {
        courseCompMap[courseId] = [];
      }

      courseCompMap[courseId].push({
        competencyId: parseInt(
          row.competency_id,
          10
        ),
        competencyName: row.competency_name,
        requiredLevel: parseInt(
          row.target_level,
          10
        )
      });
    });

    // 5. Evaluate courses
    const recommendations = [];

    for (const course of coursesRes.rows) {

      const courseId = parseInt(
        course.id,
        10
      );

      // Skip already enrolled courses
      if (enrolledCourseIds.has(courseId)) {
        continue;
      }

      const competencies =
        courseCompMap[courseId] || [];

      // Courses without competency mappings
      // are not useful for competency-based recommendations.
      if (competencies.length === 0) {
        continue;
      }

      let matchScore = 0;

      const targetGaps = [];
      const bridgeCompetencies = [];
      const matchedSkills = [];

      for (const comp of competencies) {

        const userLevel =
          userCompetencyMap[comp.competencyId];

        const requiredLevel =
          comp.requiredLevel;

        // Learner does not have this competency
        if (userLevel === undefined) {

          matchScore += 30;

          targetGaps.push(
            comp.competencyName
          );

          continue;
        }

        // Learner has competency but below requirement
        if (userLevel < requiredLevel) {

          matchScore += 20;

          bridgeCompetencies.push(
            `${comp.competencyName} (Advance from level ${userLevel} to level ${requiredLevel})`
          );

          continue;
        }

        // Requirement already satisfied
        matchScore += 5;

        matchedSkills.push(
          comp.competencyName
        );
      }

      // Course-level bonus
      if (course.level === 'BEGINNER') {
        matchScore += 10;
      } else if (course.level === 'INTERMEDIATE') {
        matchScore += 15;
      } else if (course.level === 'ADVANCED') {
        matchScore += 20;
      }

      // Build recommendation reasons
      const reasons = [];

      if (targetGaps.length > 0) {
        reasons.push(
          `Fills critical skill gaps in: ${targetGaps.join(', ')}`
        );
      }

      if (bridgeCompetencies.length > 0) {
        reasons.push(
          `Levels up proficiency in: ${bridgeCompetencies.join(', ')}`
        );
      }

      if (matchedSkills.length > 0) {
        reasons.push(
          `Strengthens existing skills: ${matchedSkills.join(', ')}`
        );
      }

      if (reasons.length === 0) {
        reasons.push(
          'Strengthens existing digital capacities'
        );
      }

      recommendations.push({
        courseId: course.id,
        title: course.title,
        description: course.description,
        category: course.category,
        level: course.level,
        trainerName: course.trainer_name,
        relevanceScore: matchScore,
        skillsAddressed:
          targetGaps.concat(bridgeCompetencies),
        recommendationReason:
          reasons.join(' | ')
      });
    }

    // 6. Highest relevance first
    recommendations.sort(
      (a, b) =>
        b.relevanceScore - a.relevanceScore
    );

    return {
      learnerId: userId,
      recommendedCount: recommendations.length,
      recommendations
    };
  }
}

module.exports = new RecommendationService();