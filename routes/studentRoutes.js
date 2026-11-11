const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);
router.use(authorize('student', 'admin', 'trainer'));

router.get('/dashboard', studentController.getDashboard);
router.get('/progress', studentController.getProgress);
router.get('/achievements', studentController.getAchievements);
router.get('/daily-challenge', studentController.getDailyChallenge);
router.get('/learning-path', studentController.getLearningPath);

module.exports = router;
