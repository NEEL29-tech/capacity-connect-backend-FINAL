const pool = require('../config/db');

class QuizService {

  // CREATE QUIZ
  async createQuiz({
    courseId,
    moduleId,
    title,
    description,
    passingScore,
    userId,
    userRole
  }) {
    if (!['TRAINER', 'ADMIN'].includes(userRole)) {
      throw new Error('Only trainer or admin can create quizzes');
    }

    const result = await pool.query(
      `INSERT INTO quizzes
       (course_id, module_id, title, description, passing_score)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        courseId,
        moduleId || null,
        title,
        description || null,
        passingScore || 60
      ]
    );

    return result.rows[0];
  }


  // ADD QUESTION
  async addQuestion({
    quizId,
    questionText,
    questionType,
    options,
    correctAnswer,
    marks,
    orderIndex,
    userId,
    userRole
  }) {
    if (!['TRAINER', 'ADMIN'].includes(userRole)) {
      throw new Error('Only trainer or admin can add questions');
    }

    const optionA = options?.A || options?.a || null;
    const optionB = options?.B || options?.b || null;
    const optionC = options?.C || options?.c || null;
    const optionD = options?.D || options?.d || null;

    const result = await pool.query(
      `INSERT INTO quiz_questions
       (
         quiz_id,
         question_text,
         option_a,
         option_b,
         option_c,
         option_d,
         correct_option,
         marks,
         question_order
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        quizId,
        questionText,
        optionA,
        optionB,
        optionC,
        optionD,
        correctAnswer,
        marks || 1,
        orderIndex || 0
      ]
    );

    return result.rows[0];
  }


  // GET QUIZ
  async getQuiz(quizId) {
    const result = await pool.query(
      `SELECT
         q.*,
         c.title AS course_title,
         m.title AS module_title
       FROM quizzes q
       LEFT JOIN courses c ON c.id = q.course_id
       LEFT JOIN modules m ON m.id = q.module_id
       WHERE q.id = $1`,
      [quizId]
    );

    if (result.rows.length === 0) {
      throw new Error('Quiz not found');
    }

    return result.rows[0];
  }


  // GET QUESTIONS
  async getQuizQuestions(quizId, isTrainerOrAdmin = false) {

    const correctColumn = isTrainerOrAdmin
      ? 'correct_option,'
      : '';

    const result = await pool.query(
      `SELECT
         id,
         quiz_id,
         question_text,
         option_a,
         option_b,
         option_c,
         option_d,
         ${correctColumn}
         marks,
         question_order
       FROM quiz_questions
       WHERE quiz_id = $1
       ORDER BY question_order ASC, id ASC`,
      [quizId]
    );

    return result.rows;
  }


  // START QUIZ ATTEMPT
  async startQuizAttempt({ quizId, userId }) {

    const quizResult = await pool.query(
      `SELECT
         q.id,
         q.passing_score,
         COALESCE(SUM(qq.marks), 0) AS total_marks
       FROM quizzes q
       LEFT JOIN quiz_questions qq
         ON qq.quiz_id = q.id
       WHERE q.id = $1
       GROUP BY q.id`,
      [quizId]
    );

    if (quizResult.rows.length === 0) {
      throw new Error('Quiz not found');
    }

    const quiz = quizResult.rows[0];

    // Check enrollment
    const enrollmentResult = await pool.query(
      `SELECT id
       FROM enrollments
       WHERE course_id = (
         SELECT course_id
         FROM quizzes
         WHERE id = $1
       )
       AND learner_id = $2
       LIMIT 1`,
      [quizId, userId]
    );

    if (enrollmentResult.rows.length === 0) {
      throw new Error('You are not enrolled in this course');
    }

    const enrollmentId = enrollmentResult.rows[0].id;

    const attemptResult = await pool.query(
      `INSERT INTO quiz_attempts
       (
         quiz_id,
         learner_id,
         score,
         total_marks,
         passed
       )
       VALUES ($1, $2, 0, $3, false)
       RETURNING *`,
      [
        quizId,
        userId,
        quiz.total_marks
      ]
    );

    return {
      ...attemptResult.rows[0],
      enrollmentId
    };
  }


  // SUBMIT QUIZ
  async submitQuizAttempt({
    attemptId,
    answers,
    userId
  }) {

    // Get attempt
    const attemptResult = await pool.query(
      `SELECT
         qa.*,
         q.passing_score
       FROM quiz_attempts qa
       JOIN quizzes q
         ON q.id = qa.quiz_id
       WHERE qa.id = $1
       AND qa.learner_id = $2`,
      [attemptId, userId]
    );

    if (attemptResult.rows.length === 0) {
      throw new Error('Quiz attempt not found');
    }

    const attempt = attemptResult.rows[0];

    // Get questions
    const questionsResult = await pool.query(
      `SELECT
         id,
         correct_option,
         marks
       FROM quiz_questions
       WHERE quiz_id = $1`,
      [attempt.quiz_id]
    );

    const questions = questionsResult.rows;

    let score = 0;
    let totalMarks = 0;

    // Delete previous answers if resubmitting
    await pool.query(
      `DELETE FROM quiz_attempt_answers
       WHERE attempt_id = $1`,
      [attemptId]
    );

    for (const question of questions) {

      totalMarks += Number(question.marks);

      const answer = answers.find(
        a => Number(a.questionId) === Number(question.id)
      );

      const selectedOption = answer
        ? String(answer.selectedOption).toUpperCase()
        : null;

      const correctOption =
        String(question.correct_option).toUpperCase();

      const isCorrect =
        selectedOption === correctOption;

      const marksObtained =
        isCorrect ? Number(question.marks) : 0;

      score += marksObtained;

      await pool.query(
        `INSERT INTO quiz_attempt_answers
         (
           attempt_id,
           question_id,
           selected_option,
           is_correct,
           marks_obtained
         )
         VALUES ($1,$2,$3,$4,$5)`,
        [
          attemptId,
          question.id,
          selectedOption,
          isCorrect,
          marksObtained
        ]
      );
    }

    const percentage =
      totalMarks > 0
        ? (score / totalMarks) * 100
        : 0;

    const passed =
      percentage >= Number(attempt.passing_score);

    // Update attempt
    await pool.query(
      `UPDATE quiz_attempts
       SET
         score = $1,
         total_marks = $2,
         passed = $3
       WHERE id = $4`,
      [
        score,
        totalMarks,
        passed,
        attemptId
      ]
    );

    return {
      attemptId,
      quizId: attempt.quiz_id,
      score,
      totalMarks,
      percentage: Number(percentage.toFixed(2)),
      passingScore: Number(attempt.passing_score),
      passed
    };
  }


  // GET ATTEMPT RESULT
  async getAttemptResult(
    attemptId,
    userId,
    userRole
  ) {

    let query;
    let params;

    if (userRole === 'ADMIN' || userRole === 'TRAINER') {

      query = `
        SELECT
          qa.*,
          q.title AS quiz_title
        FROM quiz_attempts qa
        JOIN quizzes q
          ON q.id = qa.quiz_id
        WHERE qa.id = $1
      `;

      params = [attemptId];

    } else {

      query = `
        SELECT
          qa.*,
          q.title AS quiz_title
        FROM quiz_attempts qa
        JOIN quizzes q
          ON q.id = qa.quiz_id
        WHERE qa.id = $1
        AND qa.learner_id = $2
      `;

      params = [attemptId, userId];
    }

    const attemptResult = await pool.query(query, params);

    if (attemptResult.rows.length === 0) {
      throw new Error('Attempt not found');
    }

    const attempt = attemptResult.rows[0];

    const answersResult = await pool.query(
      `SELECT
         aaa.id,
         aaa.question_id,
         aaa.selected_option,
         aaa.is_correct,
         aaa.marks_obtained,
         qq.question_text,
         qq.correct_option,
         qq.marks
       FROM quiz_attempt_answers aaa
       JOIN quiz_questions qq
         ON qq.id = aaa.question_id
       WHERE aaa.attempt_id = $1
       ORDER BY qq.question_order ASC, qq.id ASC`,
      [attemptId]
    );

    return {
      attempt,
      answers: answersResult.rows
    };
  }
}

module.exports = new QuizService();