const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');

// Optional auth to attach user progress
const optionalProtect = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const jwt = require('jsonwebtoken');
      const User = require('../models/User');
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'stackqueue_secret_jwt_key_2026_super_secure_it_platform');
      req.user = await User.findById(decoded.id).select('-password');
    } catch (e) {
      // Proceed unauthenticated
    }
  }
  next();
};

router.get('/', optionalProtect, gameController.getGames);
router.get('/:slug', optionalProtect, gameController.getGameBySlug);

module.exports = router;
