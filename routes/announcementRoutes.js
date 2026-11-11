const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

// Admin endpoints
router.post('/send', protect, authorize('admin'), announcementController.createAndSendAnnouncement);
router.get('/history', protect, authorize('admin'), announcementController.getAnnouncementHistory);

// Recipient endpoints
router.get('/student', protect, authorize('student'), announcementController.getStudentAnnouncements);
router.get('/tutor', protect, authorize('trainer', 'admin', 'tutor'), announcementController.getTutorAnnouncements);

module.exports = router;
