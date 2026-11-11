const express = require('express');
const router = express.Router();
const guidanceController = require('../controllers/guidanceController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);

router.get('/', guidanceController.getGuidance);
router.post('/', authorize('trainer', 'tutor', 'admin'), guidanceController.createGuidance);
router.patch('/:id/read', authorize('student', 'admin'), guidanceController.markAsRead);

module.exports = router;
