/**
 * Skill Gap Analysis Service
 * Capacity Connect LMS (SIH26075)
 */

const db = require('../config/db');

const LEVEL_WEIGHTS = {
  1: 1,
  2: 2,
  3: 3
};

class SkillGapService {

  // Analyze skill gap between learner and course
  async analyzeSkillGap({ userId, courseId }) {

    if (!userId || !courseId) {
      const error = new Error('userId and courseId are required');
      error.statusCode = 400;
      throw error;
    }

    // 1. Course
    const courseRes = await db.query(
      `
      SELECT id, title, description, category, level
      FROM courses
      WHERE id = $1
      `,
      [courseId]
    );

    if (courseRes.rows.length === 0) {
      const error = new Error('Course not found');
      error.statusCode = 404;
      throw error;
    }

    const course = courseRes.rows[0];

    // 2. Course required competencies
    const courseCompRes = await db.query(
      `
      SELECT
        cc.competency_id,
        cc.target_level,
        c.name,
        c.description,
        c.category
      FROM course_competencies cc
      JOIN competencies c
        ON cc.competency_id = c.id
      WHERE cc.course_id = $1
      ORDER BY c.name ASC
      `,
      [courseId]
    );

    const requiredCompetencies = courseCompRes.rows;

    // 3. Learner competencies
    const learnerCompRes = await db.query(
      `
      SELECT
        lc.competency_id,
        lc.current_level,
        lc.target_level,
        lc.progress_percentage,
        lc.last_updated,
        c.name,
        c.description,
        c.category
      FROM learner_competencies lc
      JOIN competencies c
        ON lc.competency_id = c.id
      WHERE lc.learner_id = $1
      ORDER BY c.name ASC
      `,
      [userId]
    );

    const learnerMap = {};

    learnerCompRes.rows.forEach((lc) => {
      learnerMap[lc.competency_id] = lc;
    });

    // 4. Calculate gaps
    const missingCompetencies = [];
    const skillGaps = [];
    const matchedCompetencies = [];

    let totalPointsRequired = 0;
    let totalPointsEarned = 0;

    for (const req of requiredCompetencies) {

      const requiredLevel = Number(req.target_level) || 2;
      const reqWeight = LEVEL_WEIGHTS[requiredLevel] || 2;

      totalPointsRequired += reqWeight;

      const learnerHas = learnerMap[req.competency_id];

      // Learner does not have competency
      if (!learnerHas) {

        missingCompetencies.push({
          competencyId: req.competency_id,
          name: req.name,
          category: req.category,
          requiredLevel,
          currentLevel: 'NONE'
        });

        skillGaps.push({
          competencyId: req.competency_id,
          name: req.name,
          category: req.category,
          requiredLevel,
          currentLevel: 'NONE',
          gapType: 'MISSING',
          severity: 'HIGH',
          description:
            `You do not have ${req.name} registered in your profile. Recommended level for this course is ${requiredLevel}.`
        });

        continue;
      }

      // Learner has competency
      const currentLevel = Number(learnerHas.current_level) || 1;
      const curWeight = LEVEL_WEIGHTS[currentLevel] || 1;

      totalPointsEarned += Math.min(curWeight, reqWeight);

      // Learner level is below required
      if (curWeight < reqWeight) {

        skillGaps.push({
          competencyId: req.competency_id,
          name: req.name,
          category: req.category,
          requiredLevel,
          currentLevel,
          gapType: 'DEFICIT',
          severity: currentLevel === 1 ? 'HIGH' : 'MEDIUM',
          description:
            `Current level is ${currentLevel}, but this course requires level ${requiredLevel}.`
        });

      } else {

        // Requirement satisfied
        matchedCompetencies.push({
          competencyId: req.competency_id,
          name: req.name,
          category: req.category,
          requiredLevel,
          currentLevel,
          status: 'SATISFIED'
        });
      }
    }

    // 5. Readiness score
    const readinessPercentage =
      totalPointsRequired > 0
        ? Math.round(
            (totalPointsEarned / totalPointsRequired) * 100
          )
        : 100;

    return {
      course: {
        id: course.id,
        title: course.title,
        category: course.category,
        level: course.level
      },

      readinessScore: readinessPercentage,

      isReady: readinessPercentage >= 70,

      summary: {
        totalRequired: requiredCompetencies.length,
        matchedCount: matchedCompetencies.length,
        gapCount: skillGaps.length,
        missingCount: missingCompetencies.length
      },

      currentCompetencies: learnerCompRes.rows,

      requiredCompetencies,

      missingCompetencies,

      skillGaps,

      matchedCompetencies
    };
  }

  // Overall learner competency gap summary
  async getLearnerOverallGapSummary(userId) {

    const allCompRes = await db.query(
      `
      SELECT *
      FROM competencies
      ORDER BY name ASC
      `
    );

    const learnerCompRes = await db.query(
      `
      SELECT
        lc.competency_id,
        lc.current_level,
        lc.target_level,
        lc.progress_percentage,
        lc.last_updated,
        c.name,
        c.description,
        c.category
      FROM learner_competencies lc
      JOIN competencies c
        ON lc.competency_id = c.id
      WHERE lc.learner_id = $1
      ORDER BY c.name ASC
      `,
      [userId]
    );

    const ownedMap = {};

    learnerCompRes.rows.forEach((learner) => {
      ownedMap[learner.competency_id] = learner;
    });

    const acquired = [];
    const missing = [];

    allCompRes.rows.forEach((competency) => {

      if (ownedMap[competency.id]) {

        acquired.push(
          ownedMap[competency.id]
        );

      } else {

        missing.push({
          competencyId: competency.id,
          name: competency.name,
          category: competency.category,
          description: competency.description
        });
      }
    });

    return {
      totalCompetenciesInCatalog: allCompRes.rows.length,
      acquiredCount: acquired.length,
      missingCount: missing.length,
      acquired,
      missing
    };
  }
}

module.exports = new SkillGapService();