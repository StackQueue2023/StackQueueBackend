const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

// All session routes require login
router.use(protect);

// Student view for today's class
router.get('/student/today', authorize('student', 'admin'), sessionController.getStudentTodayClass);
router.get('/student/my-live-classes', authorize('student', 'admin'), sessionController.getStudentLiveClasses);

// Curriculum / What to teach next progress
router.get('/curriculum/progress', sessionController.getCurriculumProgress);

// Tutor & Admin today's sessions
router.get('/today', authorize('trainer', 'tutor', 'admin'), sessionController.getTodaySessions);

// Create / Schedule a session
router.post('/', authorize('trainer', 'tutor', 'admin'), sessionController.createSession);

// Start a live session
router.post('/:id/start', authorize('trainer', 'tutor', 'admin'), sessionController.startSession);

// End a live session (enforces task assignment check)
router.post('/:id/end', authorize('trainer', 'tutor', 'admin'), sessionController.endSession);

// Send morning SMS digest to tutor
router.post('/tutor/morning-digest', authorize('trainer', 'tutor', 'admin'), sessionController.sendMorningDigest);

module.exports = router;
