const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'stackqueue_secret_jwt_key_2026_super_secure_it_platform');
    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found or account is deactivated.' });
    }

    // Verify course enrollment lifecycle if token is tied to a specific course enrollment
    if (decoded.enrollmentId) {
      const CollegeTrainingEnrollment = require('../models/CollegeTrainingEnrollment');
      const enrollment = await CollegeTrainingEnrollment.findById(decoded.enrollmentId);
      if (!enrollment || enrollment.status === 'COMPLETED' || enrollment.accountStatus !== 'ACTIVE' || (decoded.tokenVersion && enrollment.tokenVersion !== decoded.tokenVersion)) {
        return res.status(401).json({
          success: false,
          code: 'ENROLLMENT_COMPLETED_ACCESS_REVOKED',
          message: 'Access revoked: This course enrollment has been completed and credentials deactivated.'
        });
      }
      req.enrollment = enrollment;
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token invalid or expired.' });
  }
};

const optionalProtect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'stackqueue_secret_jwt_key_2026_super_secure_it_platform');
    const user = await User.findById(decoded.id).select('-password');
    if (user && user.isActive) {
      req.user = user;
    }
  } catch (error) {
    // Continue without req.user for optional authentication
  }
  next();
};

module.exports = { protect, optionalProtect };
