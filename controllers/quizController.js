/**
 * Quiz Controller
 * Capacity Connect LMS (SIH26075)
 * Architecture: routes -> controllers -> services -> PostgreSQL pool
 */

const quizService = require('../services/quizService');

class QuizController {
  async createQuiz(req, res, next) {
    try {
      const { courseId, moduleId, title, description, passingScore, totalMarks, timeLimitMinutes } = req.body;
      const quiz = await quizService.createQuiz({
        courseId: parseInt(courseId, 10),
        moduleId: moduleId ? parseInt(moduleId, 10) : null,
        title,
        description,
        passingScore,
        totalMarks,
        timeLimitMinutes,
        userId: req.user.id,
        userRole: req.user.role
      });
      return res.status(201).json({
        success: true,
        message: 'Quiz created successfully',
        data: quiz
      });
    } catch (error) {
      next(error);
    }
  }

  async addQuestion(req, res, next) {
    try {
      const quizId = parseInt(req.params.id, 10);
      const { questionText, questionType, options, correctAnswer, marks, orderIndex } = req.body;
      const question = await quizService.addQuestion({
        quizId,
        questionText,
        questionType,
        options,
        correctAnswer,
        marks,
        orderIndex,
        userId: req.user.id,
        userRole: req.user.role
      });
      return res.status(201).json({
        success: true,
        message: 'Question added successfully',
        data: question
      });
    } catch (error) {
      next(error);
    }
  }

  async getQuiz(req, res, next) {
    try {
      const quizId = parseInt(req.params.id, 10);
      const quiz = await quizService.getQuiz(quizId);
      return res.status(200).json({
        success: true,
        data: quiz
      });
    } catch (error) {
      next(error);
    }
  }

  async getQuizQuestions(req, res, next) {
    try {
      const quizId = parseInt(req.params.id, 10);
      const isTrainerOrAdmin = req.user && (req.user.role === 'TRAINER' || req.user.role === 'ADMIN');
      const questions = await quizService.getQuizQuestions(quizId, isTrainerOrAdmin);
      return res.status(200).json({
        success: true,
        count: questions.length,
        data: questions
      });
    } catch (error) {
      next(error);
    }
  }

  async startAttempt(req, res, next) {
    try {
      const quizId = parseInt(req.params.id, 10);
      const attempt = await quizService.startQuizAttempt({
        quizId,
        userId: req.user.id
      });
      return res.status(201).json({
        success: true,
        message: 'Quiz attempt started',
        data: attempt
      });
    } catch (error) {
      next(error);
    }
  }

  async submitAttempt(req, res, next) {
    try {
      const attemptId = parseInt(req.params.attemptId, 10);
      const { answers } = req.body;
      const result = await quizService.submitQuizAttempt({
        attemptId,
        answers,
        userId: req.user.id
      });
      return res.status(200).json({
        success: true,
        message: result.passed ? 'Quiz submitted! Congratulations, you passed!' : 'Quiz submitted. Passing score not reached.',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getAttemptResult(req, res, next) {
    try {
      const attemptId = parseInt(req.params.attemptId, 10);
      const result = await quizService.getAttemptResult(
        attemptId,
        req.user.id,
        req.user.role
      );
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new QuizController();
