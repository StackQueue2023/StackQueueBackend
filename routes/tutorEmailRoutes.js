const express = require('express');
const router = express.Router();
const adminTutorController = require('../controllers/adminTutorController');

// Public/Protected email OTP verification routes for tutors
router.post('/send-otp', adminTutorController.sendEmailOtp);
router.post('/verify-otp', adminTutorController.verifyEmailOtp);
router.post('/resend-otp', adminTutorController.resendEmailOtp);

module.exports = router;
