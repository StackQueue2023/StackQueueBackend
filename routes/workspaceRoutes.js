const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const workspaceController = require('../controllers/workspaceController');

router.get('/config/:courseId', protect, workspaceController.getCourseEnvironmentConfig);
router.get('/state/:courseId/:questionId', protect, workspaceController.getWorkspaceState);
router.post('/state/:courseId/:questionId', protect, workspaceController.saveWorkspaceState);

module.exports = router;
