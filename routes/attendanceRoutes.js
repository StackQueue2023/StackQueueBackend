const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

// Tutor & Admin endpoints
router.get('/tutor-students', protect, authorize('trainer', 'admin', 'tutor'), attendanceController.getTutorStudentsAttendance);
router.post('/student-mark', protect, authorize('trainer', 'admin', 'tutor'), attendanceController.markStudentAttendance);
router.get('/leave-requests', protect, authorize('trainer', 'admin', 'tutor'), attendanceController.getStudentLeaveRequests);
router.post('/leave-requests/:id/approve', protect, authorize('trainer', 'admin', 'tutor'), attendanceController.approveStudentLeave);
router.post('/leave-requests/:id/reject', protect, authorize('trainer', 'admin', 'tutor'), attendanceController.rejectStudentLeave);

router.get('/tutor-self', protect, authorize('trainer', 'admin', 'tutor'), attendanceController.getTutorSelfAttendance);
router.post('/tutor-self', protect, authorize('trainer', 'admin', 'tutor'), attendanceController.markTutorSelfAttendance);

// Student endpoints
router.post('/student-leave', protect, authorize('student'), attendanceController.submitStudentLeave);
router.get('/my-leaves', protect, authorize('student'), attendanceController.getStudentLeaves);
router.get('/my-attendance', protect, authorize('student'), attendanceController.getStudentOwnAttendance);

// Backward compatibility fallback endpoint
router.get('/', protect, attendanceController.getStudentOwnAttendance);

module.exports = router;
