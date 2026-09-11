/**
 * Assignment Controller
 * Capacity Connect LMS (SIH26075)
 * Architecture: routes -> controllers -> services -> PostgreSQL pool
 */

const assignmentService = require('../services/assignmentService');

class AssignmentController {
  async createAssignment(req, res, next) {
    try {
      const { courseId, moduleId, title, description, dueDate, maxScore } = req.body;
      const assignment = await assignmentService.createAssignment({
        courseId: parseInt(courseId, 10),
        moduleId: moduleId ? parseInt(moduleId, 10) : null,
        title,
        description,
        dueDate,
        maxScore,
        userId: req.user.id,
        userRole: req.user.role
      });
      return res.status(201).json({
        success: true,
        message: 'Assignment created successfully',
        data: assignment
      });
    } catch (error) {
      next(error);
    }
  }

  async getAssignmentsByCourse(req, res, next) {
    try {
      const courseId = parseInt(req.params.courseId, 10);
      const assignments = await assignmentService.getAssignmentsByCourse(courseId);
      return res.status(200).json({
        success: true,
        count: assignments.length,
        data: assignments
      });
    } catch (error) {
      next(error);
    }
  }

  async getAssignmentById(req, res, next) {
    try {
      const assignmentId = parseInt(req.params.id, 10);
      const assignment = await assignmentService.getAssignmentById(assignmentId);
      return res.status(200).json({
        success: true,
        data: assignment
      });
    } catch (error) {
      next(error);
    }
  }

  async submitAssignment(req, res, next) {
    try {
      const assignmentId = parseInt(req.params.id, 10);
      const { submissionText, fileUrl } = req.body;
      const submission = await assignmentService.submitAssignment({
        assignmentId,
        submissionText,
        fileUrl,
        userId: req.user.id
      });
      return res.status(201).json({
        success: true,
        message: 'Assignment submitted successfully',
        data: submission
      });
    } catch (error) {
      next(error);
    }
  }

  async gradeSubmission(req, res, next) {
    try {
      const submissionId = parseInt(req.params.submissionId, 10);
      const { score, feedback } = req.body;
      const result = await assignmentService.gradeSubmission({
        submissionId,
        score,
        feedback,
        userId: req.user.id,
        userRole: req.user.role
      });
      return res.status(200).json({
        success: true,
        message: 'Submission graded successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getMySubmissions(req, res, next) {
    try {
      const submissions = await assignmentService.getMySubmissions(req.user.id);
      return res.status(200).json({
        success: true,
        count: submissions.length,
        data: submissions
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AssignmentController();
