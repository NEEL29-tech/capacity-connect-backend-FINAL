/**
 * JWT Authentication Middleware
 * Capacity Connect LMS (SIH26075)
 */

const { verifyToken } = require('../config/jwt');
const db = require('../config/db');

async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'] || req.headers['x-access-token'];
    let token;

    if (authHeader) {
      if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7).trim();
      } else {
        token = authHeader;
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied: No authorization token provided'
      });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // Verify user exists in database
    const userRes = await db.query(
      'SELECT id, name, email, role, bio FROM users WHERE id = $1',
      [decoded.id]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Authentication failed: User no longer exists'
      });
    }

    req.user = userRes.rows[0];
    next();
  } catch (error) {
    console.error('[AuthMiddleware] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication'
    });
  }
}

module.exports = {
  authenticateToken
};
