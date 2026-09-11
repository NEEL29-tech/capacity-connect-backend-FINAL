/**
 * Certificate Service
 * Capacity Connect LMS (SIH26075)
 *
 * Architecture:
 * routes -> controllers -> services -> PostgreSQL pool
 */

const crypto = require('crypto');
const db = require('../config/db');

class CertificateService {

  /**
   * Generate certificate for a completed enrollment
   */
  async generateCertificate({ enrollmentId, userId }) {

    if (!enrollmentId) {
      const error = new Error('enrollmentId is required');
      error.statusCode = 400;
      throw error;
    }

    // 1. Fetch enrollment
    const enrollRes = await db.query(`
      SELECT
        e.id,
        e.learner_id,
        e.course_id,
        e.status,
        e.completed_at,
        c.title AS course_title,
        u.name AS user_name
      FROM enrollments e
      JOIN courses c
        ON e.course_id = c.id
      JOIN users u
        ON e.learner_id = u.id
      WHERE e.id = $1
    `, [enrollmentId]);

    if (enrollRes.rows.length === 0) {
      const error = new Error('Enrollment not found');
      error.statusCode = 404;
      throw error;
    }

    const enrollment = enrollRes.rows[0];

    // 2. Verify ownership
    // Number() handles JWT userId string vs PostgreSQL integer
    if (Number(enrollment.learner_id) !== Number(userId)) {
      const error = new Error(
        'Forbidden: You can only generate certificates for your own completed courses'
      );
      error.statusCode = 403;
      throw error;
    }

    // 3. Check completion status
    if (enrollment.status !== 'COMPLETED') {

      const totalModsRes = await db.query(`
        SELECT COUNT(*) AS cnt
        FROM modules
        WHERE course_id = $1
      `, [enrollment.course_id]);

      const doneModsRes = await db.query(`
        SELECT COUNT(*) AS cnt
        FROM learning_progress lp
        JOIN modules m
          ON lp.module_id = m.id
        WHERE lp.enrollment_id = $1
          AND lp.completed = true
          AND m.course_id = $2
      `, [
        enrollmentId,
        enrollment.course_id
      ]);

      const total = parseInt(
        totalModsRes.rows[0].cnt,
        10
      ) || 0;

      const done = parseInt(
        doneModsRes.rows[0].cnt,
        10
      ) || 0;

      if (total === 0 || done < total) {
        const error = new Error(
          `Course is not completed (${done}/${total} modules completed). Complete all modules to unlock your certificate.`
        );

        error.statusCode = 400;
        throw error;
      }

      // All modules completed
      await db.query(`
        UPDATE enrollments
        SET
          status = 'COMPLETED',
          completed_at = NOW()
        WHERE id = $1
      `, [enrollmentId]);

      enrollment.status = 'COMPLETED';
    }

    // 4. Check duplicate certificate
    const existingCert = await db.query(`
      SELECT *
      FROM certificates
      WHERE learner_id = $1
        AND course_id = $2
    `, [
      enrollment.learner_id,
      enrollment.course_id
    ]);

    if (existingCert.rows.length > 0) {
      return existingCert.rows[0];
    }

    // 5. Generate unique certificate number
    const randomHex = crypto
      .randomBytes(4)
      .toString('hex')
      .toUpperCase();

    const certificateNumber =
      `CAP-${new Date().getFullYear()}-${enrollment.course_id}-${randomHex}`;

    // 6. Insert certificate
    const insertRes = await db.query(`
      INSERT INTO certificates
      (
        learner_id,
        course_id,
        certificate_number,
        issued_at,
        certificate_url
      )
      VALUES
      (
        $1,
        $2,
        $3,
        NOW(),
        $4
      )
      RETURNING *
    `, [
      enrollment.learner_id,
      enrollment.course_id,
      certificateNumber,
      null
    ]);

    return insertRes.rows[0];
  }


  /**
   * Get all certificates belonging to learner
   */
  async getLearnerCertificates(userId) {

    const res = await db.query(`
      SELECT
        cert.id,
        cert.certificate_number,
        cert.issued_at,
        cert.certificate_url,
        c.id AS course_id,
        c.title AS course_title,
        c.category,
        c.level,
        u.name AS learner_name
      FROM certificates cert
      JOIN courses c
        ON cert.course_id = c.id
      JOIN users u
        ON cert.learner_id = u.id
      WHERE cert.learner_id = $1
      ORDER BY cert.issued_at DESC
    `, [userId]);

    return res.rows;
  }


  /**
   * Public certificate verification
   */
  async verifyCertificate(certificateNumber) {

    if (!certificateNumber) {
      const error = new Error(
        'Certificate number is required'
      );

      error.statusCode = 400;
      throw error;
    }

    const cleanNumber =
      certificateNumber.trim().toUpperCase();

    const res = await db.query(`
      SELECT
        cert.id,
        cert.certificate_number,
        cert.issued_at,
        cert.certificate_url,
        c.title AS course_title,
        c.category AS course_category,
        u.name AS learner_name,
        u.email AS learner_email
      FROM certificates cert
      JOIN courses c
        ON cert.course_id = c.id
      JOIN users u
        ON cert.learner_id = u.id
      WHERE UPPER(cert.certificate_number) = $1
    `, [cleanNumber]);

    // Certificate not found
    if (res.rows.length === 0) {
      return {
        isValid: false,
        message:
          'Certificate not found or invalid certificate number'
      };
    }

    const cert = res.rows[0];

    return {
      isValid: true,
      certificateNumber: cert.certificate_number,
      issuedAt: cert.issued_at,
      learnerName: cert.learner_name,
      courseTitle: cert.course_title,
      courseCategory: cert.course_category,
      certificateUrl: cert.certificate_url,
      issuingAuthority:
        'Capacity Connect - Digital Capacity Building Portal (SIH26075)'
    };
  }
}

module.exports = new CertificateService();