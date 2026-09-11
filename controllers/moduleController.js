/**
 * Module Controller
 * Capacity Connect LMS (SIH26075)
 * Architecture: routes -> controllers -> services -> PostgreSQL pool
 */

const moduleService = require('../services/moduleService');

class ModuleController {
  async getModulesByCourse(req, res, next) {
    try {
      const courseId = parseInt(req.params.courseId, 10);
      const modules = await moduleService.getModulesByCourse(courseId);
      return res.status(200).json({
        success: true,
        count: modules.length,
        data: modules
      });
    } catch (error) {
      next(error);
    }
  }

  async getModuleById(req, res, next) {
    try {
      const moduleId = parseInt(req.params.id, 10);
      const moduleData = await moduleService.getModuleById(moduleId);
      return res.status(200).json({
        success: true,
        data: moduleData
      });
    } catch (error) {
      next(error);
    }
  }

  async createModule(req, res, next) {
    try {
      const { courseId, title, description, orderIndex } = req.body;
      const mod = await moduleService.createModule({
        courseId: parseInt(courseId, 10),
        title,
        description,
        orderIndex,
        userId: req.user.id,
        userRole: req.user.role
      });
      return res.status(201).json({
        success: true,
        message: 'Module created successfully',
        data: mod
      });
    } catch (error) {
      next(error);
    }
  }

  async updateModule(req, res, next) {
    try {
      const moduleId = parseInt(req.params.id, 10);
      const mod = await moduleService.updateModule(
        moduleId,
        req.body,
        req.user.id,
        req.user.role
      );
      return res.status(200).json({
        success: true,
        message: 'Module updated successfully',
        data: mod
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteModule(req, res, next) {
    try {
      const moduleId = parseInt(req.params.id, 10);
      const result = await moduleService.deleteModule(
        moduleId,
        req.user.id,
        req.user.role
      );
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async addModuleContent(req, res, next) {
    try {
      const moduleId = parseInt(req.params.id, 10);
      const { title, contentType, contentUrl, contentData, orderIndex } = req.body;
      const content = await moduleService.addModuleContent({
        moduleId,
        title,
        contentType,
        contentUrl,
        contentData,
        orderIndex,
        userId: req.user.id,
        userRole: req.user.role
      });
      return res.status(201).json({
        success: true,
        message: 'Module content added successfully',
        data: content
      });
    } catch (error) {
      next(error);
    }
  }

  async getModuleContents(req, res, next) {
    try {
      const moduleId = parseInt(req.params.id, 10);
      const contents = await moduleService.getModuleContents(moduleId);
      return res.status(200).json({
        success: true,
        count: contents.length,
        data: contents
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ModuleController();
