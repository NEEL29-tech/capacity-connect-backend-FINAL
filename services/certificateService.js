const { pool } = require("../config/db");

// Generate certificate
const generateCertificate = async ({ enrollmentId, userId }) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Get enrollment, user and course details
    const enrollmentResult = await client.query(
  `
  SELECT
    e.id AS enrollment_id,
    e.learner_id,
    e.course_id,
    e.status,
    e.enrolled_at,
    e.completed_at,
    u.name AS learner_name,
    u.email AS learner_email,
    c.title AS course_title,
    c.category,
    c.level
  FROM enrollments e
  JOIN users u ON u.id = e.learner_id
  JOIN courses c ON c.id = e.course_id
  WHERE e.id = $1 AND e.learner_id = $2
  `,
  [enrollmentId, userId]
);

    if (enrollmentResult.rows.length === 0) {
      throw new Error("Enrollment not found or access denied");
    }

    const enrollment = enrollmentResult.rows[0];

    // Count total modules
    const totalModulesResult = await client.query(
      `
      SELECT COUNT(*)::int AS total_modules
      FROM modules
      WHERE course_id = $1
      `,
      [enrollment.course_id]
    );

    const totalModules = totalModulesResult.rows[0].total_modules;

    // Count completed modules
    const completedModulesResult = await client.query(
      `
      SELECT COUNT(*)::int AS completed_modules
      FROM learning_progress lp
      JOIN modules m ON m.id = lp.module_id
      WHERE lp.enrollment_id = $1
        AND m.course_id = $2
        AND lp.completed = true
      `,
      [enrollmentId, enrollment.course_id]
    );

    const completedModules =
      completedModulesResult.rows[0].completed_modules;

    if (totalModules === 0 || completedModules !== totalModules) {
      throw new Error(
        `Course is not completed. Completed ${completedModules}/${totalModules} modules.`
      );
    }

    // Mark enrollment as completed
    await client.query(
      `
      UPDATE enrollments
      SET status = 'COMPLETED',
          completed_at = COALESCE(completed_at, CURRENT_TIMESTAMP)
      WHERE id = $1
      `,
      [enrollmentId]
    );

    // Check existing certificate
    const existingCertificateResult = await client.query(
      `
      SELECT *
      FROM certificates
      WHERE user_id = $1 AND course_id = $2
      `,
      [userId, enrollment.course_id]
    );

    if (existingCertificateResult.rows.length > 0) {
      await client.query("COMMIT");

      return {
        message: "Certificate already exists",
        certificate: existingCertificateResult.rows[0],
      };
    }

    // Generate certificate code
    const certificateCode = `CAP-${new Date().getFullYear()}-${enrollment.course_id}-${Date.now()}`;

    const metadata = JSON.stringify({
      learnerName: enrollment.learner_name,
      learnerEmail: enrollment.learner_email,
      courseName: enrollment.course_title,
      totalModules,
      completedModules,
      completionPercentage: 100,
    });

    // Insert certificate
    const certificateResult = await client.query(
      `
      INSERT INTO certificates (
        user_id,
        course_id,
        enrollment_id,
        certificate_code,
        issue_date,
        certificate_url,
        metadata
      )
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, NULL, $5)
      RETURNING *
      `,
      [
        userId,
        enrollment.course_id,
        enrollmentId,
        certificateCode,
        metadata,
      ]
    );

    await client.query("COMMIT");

    return {
      message: "Certificate generated successfully",
      certificate: {
        ...certificateResult.rows[0],
        learnerName: enrollment.learner_name,
        learnerEmail: enrollment.learner_email,
        courseName: enrollment.course_title,
        category: enrollment.category,
        level: enrollment.level,
        totalModules,
        completedModules,
        completionPercentage: 100,
      },
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};


// Get learner certificates
const getMyCertificates = async (userId) => {
  const result = await pool.query(
    `
    SELECT
      cert.id,
      cert.certificate_code,
      cert.issue_date,
      cert.certificate_url,
      cert.metadata,
      c.title AS course_name,
      c.category,
      c.level,
      u.name AS learner_name,
      u.email AS learner_email
    FROM certificates cert
    JOIN courses c ON c.id = cert.course_id
    JOIN users u ON u.id = cert.user_id
    WHERE cert.user_id = $1
    ORDER BY cert.issue_date DESC
    `,
    [userId]
  );

  return result.rows;
};


// Public certificate verification
const verifyCertificate = async (certificateCode) => {
  const result = await pool.query(
    `
    SELECT
      cert.certificate_code,
      cert.issue_date,
      cert.certificate_url,
      c.title AS course_name,
      c.category,
      c.level,
      u.name AS learner_name,
      u.email AS learner_email
    FROM certificates cert
    JOIN courses c ON c.id = cert.course_id
    JOIN users u ON u.id = cert.user_id
    WHERE cert.certificate_code = $1
    `,
    [certificateCode]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
};


module.exports = {
  generateCertificate,
  getMyCertificates,
  verifyCertificate,
};