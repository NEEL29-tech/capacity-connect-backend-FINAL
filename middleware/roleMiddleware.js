/**
 * Role-Based Authorization Middleware
 * Capacity Connect LMS (SIH26075)
 */

function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User authentication required'
      });
    }

    const normalizedUserRole = req.user.role.toUpperCase();
    const normalizedAllowedRoles = allowedRoles.map(r => r.toUpperCase());

    if (!normalizedAllowedRoles.includes(normalizedUserRole)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: User role '${req.user.role}' lacks permission for this resource. Required: [${allowedRoles.join(', ')}]`
      });
    }

    next();
  };
}

module.exports = {
  authorizeRoles
};
