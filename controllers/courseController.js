/**
 * Course Controller
 * Capacity Connect LMS (SIH26075)
 * Architecture: routes -> controllers -> services -> PostgreSQL pool
 */

const courseService = require('../services/courseService');

class CourseController {
  async getAllCourses(req, res, next) {
    try {
      const courses = await courseService.getAllCourses(req.query);
      return res.status(200).json({
        success: true,
        count: courses.length,
        data: courses
      });
    } catch (error) {
      next(error);
    }
  }

  async getCourseById(req, res, next) {
    try {
      const courseId = parseInt(req.params.id, 10);
      const course = await courseService.getCourseById(courseId);
      return res.status(200).json({
        success: true,
        data: course
      });
    } catch (error) {
      next(error);
    }
  }

  async createCourse(req, res, next) {
    try {
      const { title, description, category, level, isPublished } = req.body;
      const trainerId = req.user.role === 'TRAINER' ? req.user.id : (req.body.trainerId || req.user.id);
      const course = await courseService.createCourse({
        title,
        description,
        category,
        level,
        trainerId,
        isPublished
      });
      return res.status(201).json({
        success: true,
        message: 'Course created successfully',
        data: course
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCourse(req, res, next) {
    try {
      const courseId = parseInt(req.params.id, 10);
      const course = await courseService.updateCourse(
        courseId,
        req.body,
        req.user.id,
        req.user.role
      );
      return res.status(200).json({
        success: true,
        message: 'Course updated successfully',
        data: course
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteCourse(req, res, next) {
    try {
      const courseId = parseInt(req.params.id, 10);
      const result = await courseService.deleteCourse(
        courseId,
        req.user.id,
        req.user.role
      );
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CourseController();
