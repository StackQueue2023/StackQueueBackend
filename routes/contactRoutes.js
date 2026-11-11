const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

// Public route to submit inquiries
router.post('/', contactController.submitContactMessage);

// Admin routes to review inquiries
router.get('/admin/messages', protect, authorize('admin'), contactController.getContactMessages);
router.patch('/admin/messages/:id', protect, authorize('admin'), contactController.updateContactMessage);
router.delete('/admin/messages/:id', protect, authorize('admin'), contactController.deleteContactMessage);

module.exports = router;
