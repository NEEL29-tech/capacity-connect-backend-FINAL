const db = require('../config/db');

class AssignmentService {

  // CREATE ASSIGNMENT
  async createAssignment({
    courseId,
    moduleId,
    title,
    description,
    dueDate,
    maxScore = 100,
    userId
  }) {
    if (!courseId || !title) {
      throw new Error('Course ID and title are required');
    }

    const courseRes = await db.query(
      'SELECT trainer_id FROM courses WHERE id = $1',
      [courseId]
    );

    if (!courseRes.rows.length) {
      throw new Error('Course not found');
    }

    const course = courseRes.rows[0];

    if (course.trainer_id !== userId) {
      throw new Error('You are not authorized to create assignment for this course');
    }

    const result = await db.query(
      `
      INSERT INTO assignments
      (
        course_id,
        module_id,
        title,
        description,
        due_date,
        total_marks,
        created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
      `,
      [
        courseId,
        moduleId || null,
        title.trim(),
        description || null,
        dueDate || null,
        maxScore,
        userId
      ]
    );

    return result.rows[0];
  }


  // GET ASSIGNMENTS BY COURSE
  async getAssignmentsByCourse(courseId) {

    const result = await db.query(
      `
      SELECT
        a.*,
        c.title AS course_title
      FROM assignments a
      JOIN courses c ON a.course_id = c.id
      WHERE a.course_id = $1
      ORDER BY a.created_at DESC
      `,
      [courseId]
    );

    const assignments = result.rows;

    if (!assignments.length) {
      return [];
    }

    const ids = assignments.map(a => a.id);

    const placeholders = ids
      .map((_, index) => `$${index + 1}`)
      .join(', ');

    const countResult = await db.query(
      `
      SELECT
        assignment_id,
        COUNT(*) AS count
      FROM assignment_submissions
      WHERE assignment_id IN (${placeholders})
      GROUP BY assignment_id
      `,
      ids
    );

    const countMap = {};

    countResult.rows.forEach(row => {
      countMap[row.assignment_id] = parseInt(row.count, 10);
    });

    return assignments.map(a => ({
      ...a,
      submission_count: countMap[a.id] || 0
    }));
  }


  // GET ASSIGNMENT BY ID
  async getAssignmentById(assignmentId) {

    const result = await db.query(
      `
      SELECT
        a.*,
        c.title AS course_title,
        c.trainer_id
      FROM assignments a
      JOIN courses c ON a.course_id = c.id
      WHERE a.id = $1
      `,
      [assignmentId]
    );

    if (!result.rows.length) {
      throw new Error('Assignment not found');
    }

    return result.rows[0];
  }


  // SUBMIT ASSIGNMENT
  async submitAssignment({
    assignmentId,
    submissionText,
    fileUrl,
    userId
  }) {

    const assignmentResult = await db.query(
      `
      SELECT
        id,
        course_id,
        title
      FROM assignments
      WHERE id = $1
      `,
      [assignmentId]
    );

    if (!assignmentResult.rows.length) {
      throw new Error('Assignment not found');
    }

    const assignment = assignmentResult.rows[0];


    // Check enrollment
    const enrollmentResult = await db.query(
      `
      SELECT id
      FROM enrollments
      WHERE learner_id = $1
      AND course_id = $2
      `,
      [userId, assignment.course_id]
    );

    if (!enrollmentResult.rows.length) {
      throw new Error('You are not enrolled in this course');
    }


    // Check existing submission
    const existingResult = await db.query(
      `
      SELECT id
      FROM assignment_submissions
      WHERE assignment_id = $1
      AND learner_id = $2
      `,
      [assignmentId, userId]
    );


    let result;

    if (existingResult.rows.length) {

      result = await db.query(
        `
        UPDATE assignment_submissions
        SET
          submission_text = $1,
          submission_url = $2,
          submitted_at = NOW(),
          status = 'SUBMITTED'
        WHERE id = $3
        RETURNING *
        `,
        [
          submissionText || null,
          fileUrl || null,
          existingResult.rows[0].id
        ]
      );

    } else {

      result = await db.query(
        `
        INSERT INTO assignment_submissions
        (
          assignment_id,
          learner_id,
          submission_text,
          submission_url,
          status
        )
        VALUES ($1, $2, $3, $4, 'SUBMITTED')
        RETURNING *
        `,
        [
          assignmentId,
          userId,
          submissionText || null,
          fileUrl || null
        ]
      );
    }

    return result.rows[0];
  }


  // GRADE SUBMISSION
  async gradeSubmission({
    submissionId,
    score,
    feedback,
    userId
  }) {

    const submissionResult = await db.query(
      `
      SELECT
        s.*,
        a.course_id,
        a.total_marks,
        a.title AS assignment_title,
        c.trainer_id
      FROM assignment_submissions s
      JOIN assignments a
        ON s.assignment_id = a.id
      JOIN courses c
        ON a.course_id = c.id
      WHERE s.id = $1
      `,
      [submissionId]
    );

    if (!submissionResult.rows.length) {
      throw new Error('Submission not found');
    }

    const submission = submissionResult.rows[0];


    if (submission.trainer_id !== userId) {
      throw new Error('You are not authorized to grade this submission');
    }


    const maxScore = parseFloat(submission.total_marks);
    const numericScore = parseFloat(score);

    if (
      Number.isNaN(numericScore) ||
      numericScore < 0 ||
      numericScore > maxScore
    ) {
      throw new Error(
        `Score must be between 0 and ${maxScore}`
      );
    }


    const result = await db.query(
      `
      UPDATE assignment_submissions
      SET
        score = $1,
        feedback = $2,
        status = 'GRADED',
        evaluated_at = NOW()
      WHERE id = $3
      RETURNING *
      `,
      [
        numericScore,
        feedback || null,
        submissionId
      ]
    );


    return result.rows[0];
  }


  // GET MY SUBMISSIONS
  async getMySubmissions(userId) {

    const result = await db.query(
      `
      SELECT
        s.*,
        a.title AS assignment_title,
        a.total_marks,
        c.title AS course_title
      FROM assignment_submissions s
      JOIN assignments a
        ON s.assignment_id = a.id
      JOIN courses c
        ON a.course_id = c.id
      WHERE s.learner_id = $1
      ORDER BY s.submitted_at DESC
      `,
      [userId]
    );

    return result.rows;
  }
}

module.exports = new AssignmentService();