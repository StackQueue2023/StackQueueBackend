/**
 * Role-Based Access Control Middleware
 * Usage: authorize('admin'), authorize('trainer', 'admin')
 */
const authorize = (...roles) => {
  const effectiveRoles = new Set(roles);
  if (effectiveRoles.has('trainer')) effectiveRoles.add('tutor');
  if (effectiveRoles.has('tutor')) effectiveRoles.add('trainer');

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }
    if (!effectiveRoles.has(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: User role '${req.user.role}' is not authorized to access this resource.`
      });
    }
    next();
  };
};

module.exports = { authorize };
