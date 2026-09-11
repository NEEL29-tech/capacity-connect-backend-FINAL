const db = require('../config/db');

/**
 * Complete a module for a learner
 */
const completeModule = async (userId, enrollmentId, moduleId) => {
    // Check enrollment belongs to logged-in learner
    const enrollmentResult = await db.query(
        `
        SELECT
            e.id,
            e.learner_id,
            e.course_id,
            e.status
        FROM enrollments e
        WHERE e.id = $1
          AND e.learner_id = $2
        `,
        [enrollmentId, userId]
    );

    if (enrollmentResult.rows.length === 0) {
        const error = new Error(
            'Enrollment not found or does not belong to this learner'
        );
        error.statusCode = 404;
        throw error;
    }

    const enrollment = enrollmentResult.rows[0];

    // Check module belongs to enrolled course
    const moduleResult = await db.query(
        `
        SELECT
            id,
            course_id,
            title
        FROM modules
        WHERE id = $1
          AND course_id = $2
        `,
        [moduleId, enrollment.course_id]
    );

    if (moduleResult.rows.length === 0) {
        const error = new Error(
            'Module not found or does not belong to this course'
        );
        error.statusCode = 404;
        throw error;
    }

    const module = moduleResult.rows[0];

    // Check if already completed
    const existingProgress = await db.query(
        `
        SELECT
            id,
            completed,
            completed_at
        FROM learning_progress
        WHERE enrollment_id = $1
          AND module_id = $2
        `,
        [enrollmentId, moduleId]
    );

    let progress;

    if (existingProgress.rows.length > 0) {
        // Update existing progress
        const progressResult = await db.query(
            `
            UPDATE learning_progress
            SET
                completed = TRUE,
                completed_at = COALESCE(completed_at, NOW())
            WHERE enrollment_id = $1
              AND module_id = $2
            RETURNING
                id,
                enrollment_id,
                module_id,
                completed,
                completed_at
            `,
            [enrollmentId, moduleId]
        );

        progress = progressResult.rows[0];
    } else {
        // Create new progress record
        const progressResult = await db.query(
            `
            INSERT INTO learning_progress
                (enrollment_id, module_id, completed, completed_at)
            VALUES
                ($1, $2, TRUE, NOW())
            RETURNING
                id,
                enrollment_id,
                module_id,
                completed,
                completed_at
            `,
            [enrollmentId, moduleId]
        );

        progress = progressResult.rows[0];
    }

    // Calculate course progress
    const progressCountResult = await db.query(
        `
        SELECT
            COUNT(m.id) AS total_modules,
            COUNT(
                CASE
                    WHEN lp.completed = TRUE THEN 1
                END
            ) AS completed_modules
        FROM modules m
        LEFT JOIN learning_progress lp
            ON lp.module_id = m.id
           AND lp.enrollment_id = $1
        WHERE m.course_id = $2
        `,
        [enrollmentId, enrollment.course_id]
    );

    const totalModules = Number(
        progressCountResult.rows[0].total_modules
    );

    const completedModules = Number(
        progressCountResult.rows[0].completed_modules
    );

    const completionPercentage =
        totalModules > 0
            ? Number(((completedModules / totalModules) * 100).toFixed(2))
            : 0;

    const courseCompleted =
        totalModules > 0 && completedModules === totalModules;

    // Update enrollment progress
    if (courseCompleted) {
        await db.query(
            `
            UPDATE enrollments
            SET
                progress_percentage = 100,
                status = 'COMPLETED',
                completed_at = NOW()
            WHERE id = $1
              AND learner_id = $2
            `,
            [enrollmentId, userId]
        );
    } else {
        await db.query(
            `
            UPDATE enrollments
            SET
                progress_percentage = $1
            WHERE id = $2
              AND learner_id = $3
            `,
            [completionPercentage, enrollmentId, userId]
        );
    }

    // Return complete result
    return {
        enrollmentId: Number(enrollmentId),
        moduleId: Number(moduleId),
        moduleTitle: module.title,
        completed: true,
        completedAt: progress.completed_at,
        totalModules,
        completedModules,
        completionPercentage,
        isCourseCompleted: courseCompleted
    };
};


/**
 * Get progress of an enrollment
 */
const getEnrollmentProgress = async (userId, enrollmentId) => {
    // Get enrollment
    const enrollmentResult = await db.query(
        `
        SELECT
            e.id,
            e.learner_id,
            e.course_id,
            e.status,
            e.enrolled_at,
            e.completed_at,
            c.title AS course_title
        FROM enrollments e
        JOIN courses c
            ON c.id = e.course_id
        WHERE e.id = $1
          AND e.learner_id = $2
        `,
        [enrollmentId, userId]
    );

    if (enrollmentResult.rows.length === 0) {
        const error = new Error(
            'Enrollment not found or does not belong to this learner'
        );
        error.statusCode = 404;
        throw error;
    }

    const enrollment = enrollmentResult.rows[0];

    // Get modules and completion status
    const modulesResult = await db.query(
        `
        SELECT
            m.id AS module_id,
            m.title,
            m.description,
            m.order_index,
            COALESCE(lp.completed, FALSE) AS completed,
            lp.completed_at
        FROM modules m
        LEFT JOIN learning_progress lp
            ON lp.module_id = m.id
           AND lp.enrollment_id = $1
        WHERE m.course_id = $2
        ORDER BY m.order_index ASC, m.id ASC
        `,
        [enrollmentId, enrollment.course_id]
    );

    const modules = modulesResult.rows.map((module) => ({
        moduleId: module.module_id,
        title: module.title,
        description: module.description,
        orderIndex: module.order_index,
        completed: module.completed,
        completedAt: module.completed_at
    }));

    const totalModules = modules.length;

    const completedModules = modules.filter(
        (module) => module.completed === true
    ).length;

    const completionPercentage =
        totalModules > 0
            ? Number(((completedModules / totalModules) * 100).toFixed(2))
            : 0;

    return {
        enrollmentId: enrollment.id,
        userId: enrollment.learner_id,
        learnerName: null,
        courseId: enrollment.course_id,
        courseTitle: enrollment.course_title,
        status: enrollment.status,
        enrolledAt: enrollment.enrolled_at,
        completedAt: enrollment.completed_at,
        totalModules,
        completedModules,
        completionPercentage,
        isCourseCompleted:
            totalModules > 0 && completedModules === totalModules,
        modules
    };
};


/**
 * Get progress of a course for logged-in learner
 */
const getProgressByCourse = async (userId, courseId) => {
    // Find active enrollment
    const enrollmentResult = await db.query(
        `
        SELECT
            e.id,
            e.learner_id,
            e.course_id,
            e.status,
            e.enrolled_at,
            e.completed_at,
            c.title AS course_title
        FROM enrollments e
        JOIN courses c
            ON c.id = e.course_id
        WHERE e.learner_id = $1
          AND e.course_id = $2
        ORDER BY e.id DESC
        LIMIT 1
        `,
        [userId, courseId]
    );

    if (enrollmentResult.rows.length === 0) {
        const error = new Error(
            'You are not enrolled in this course'
        );
        error.statusCode = 404;
        throw error;
    }

    const enrollment = enrollmentResult.rows[0];

    return await getEnrollmentProgress(
        userId,
        enrollment.id
    );
};


module.exports = {
    completeModule,
    getEnrollmentProgress,
    getProgressByCourse
};