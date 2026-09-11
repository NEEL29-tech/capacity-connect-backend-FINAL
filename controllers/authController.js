/**
 * Authentication Controller
 * Capacity Connect LMS (SIH26075)
 * Architecture: routes -> controllers -> services -> PostgreSQL pool
 */

const authService = require('../services/authService');

class AuthController {
  async register(req, res, next) {
    try {
      const { name, email, password, role, bio } = req.body;
      const result = await authService.register({ name, email, password, role, bio });
      return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login({ email, password });
      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result
      });
    } catch (error) {
      // Ensure expected 401 response on invalid credentials
      if (error.statusCode === 401) {
        return res.status(401).json({
          success: false,
          message: error.message || 'Invalid email or password'
        });
      }
      next(error);
    }
  }

  async getMe(req, res, next) {
    try {
      const user = await authService.getProfile(req.user.id);
      return res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
