/**
 * Knowledge Hub Controller
 * Capacity Connect LMS (SIH26075)
 * Architecture: routes -> controllers -> services -> PostgreSQL pool
 */

const knowledgeService = require('../services/knowledgeService');

class KnowledgeController {
  async getAllResources(req, res, next) {
    try {
      const resources = await knowledgeService.getAllResources(req.query);
      return res.status(200).json({
        success: true,
        count: resources.length,
        data: resources
      });
    } catch (error) {
      next(error);
    }
  }

  async getResourceById(req, res, next) {
    try {
      const resourceId = parseInt(req.params.id, 10);
      const resource = await knowledgeService.getResourceById(resourceId);
      return res.status(200).json({
        success: true,
        data: resource
      });
    } catch (error) {
      next(error);
    }
  }

  async createResource(req, res, next) {
    try {
      const { title, description, category, resourceType, url, fileSize } = req.body;
      const resource = await knowledgeService.createResource({
        title,
        description,
        category,
        resourceType,
        url,
        fileSize,
        userId: req.user.id
      });
      return res.status(201).json({
        success: true,
        message: 'Knowledge resource created successfully',
        data: resource
      });
    } catch (error) {
      next(error);
    }
  }

  async updateResource(req, res, next) {
    try {
      const resourceId = parseInt(req.params.id, 10);
      const resource = await knowledgeService.updateResource(
        resourceId,
        req.body,
        req.user.id,
        req.user.role
      );
      return res.status(200).json({
        success: true,
        message: 'Knowledge resource updated successfully',
        data: resource
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteResource(req, res, next) {
    try {
      const resourceId = parseInt(req.params.id, 10);
      const result = await knowledgeService.deleteResource(
        resourceId,
        req.user.id,
        req.user.role
      );
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new KnowledgeController();
