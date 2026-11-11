const express = require('express');
const router = express.Router();
const lmsController = require('../controllers/lmsController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

// All LMS routes require authentication
router.use(protect);

// ==========================================
// 1. ADMIN LMS ROUTES
// ==========================================
router.post('/admin/students', authorize('admin'), lmsController.adminCreateStudent);
router.get('/admin/courses/:courseId/next-student-id', authorize('admin'), lmsController.getNextStudentId);
router.get('/admin/students/resolve-course-by-id/:studentId', authorize('admin'), lmsController.resolveCourseByStudentId);
router.get('/admin/students/filter-options', authorize('admin'), lmsController.getStudentDirectoryFilterOptions);
router.get('/admin/students/directory-search', authorize('admin'), lmsController.getFilteredStudentsForDirectory);
router.get('/admin/students/lookup-by-id/:studentId', authorize('admin'), lmsController.lookupStudentById);
router.get('/admin/students', authorize('admin', 'tutor', 'trainer'), lmsController.adminGetStudents);
router.put('/admin/students/:id', authorize('admin'), lmsController.adminUpdateStudent);
router.delete('/admin/students/:id', authorize('admin'), lmsController.adminDeleteStudent);
router.get('/courses', lmsController.getCourses);
router.post('/admin/courses', authorize('admin'), lmsController.adminCreateCourse);
router.post('/admin/modules', authorize('admin'), lmsController.adminCreateModule);
router.post('/admin/concepts', authorize('admin'), lmsController.adminCreateConcept);
router.post('/admin/tasks', authorize('admin'), lmsController.adminCreateConceptTask);
router.post('/admin/schedule-class', authorize('admin'), lmsController.adminScheduleClass);
router.get('/admin/attendance-report', authorize('admin', 'tutor', 'trainer'), lmsController.adminGetAttendanceReport);
router.put('/admin/leave-requests/:id/review', authorize('admin', 'tutor', 'trainer'), lmsController.adminReviewLeaveRequest);
router.delete('/admin/sessions/:id', authorize('admin'), lmsController.adminDeleteSession);

// ==========================================
// 2. TUTOR LMS ROUTES
// ==========================================
router.get('/tutor/assigned-content', authorize('tutor', 'trainer', 'admin'), lmsController.tutorGetAssignedContent);
router.put('/concepts/:conceptId/status', authorize('tutor', 'trainer', 'admin'), lmsController.updateConceptStatus);
router.put('/sessions/:sessionId/attendance', authorize('tutor', 'trainer', 'admin'), lmsController.tutorRecordAttendance);

// ==========================================
// 3. STUDENT LMS ROUTES
// ==========================================
router.get('/student/dashboard', authorize('student', 'admin'), lmsController.getStudentDashboard);
router.get('/concepts/:conceptId/tasks', authorize('student', 'admin', 'tutor', 'trainer'), lmsController.getConceptTasks);
router.post('/tasks/:taskId/submit', authorize('student', 'admin'), lmsController.submitConceptTask);
router.post('/attendance/:sessionId/absence-reason', authorize('student', 'admin'), lmsController.submitAbsenceReason);
router.post('/leave-requests', authorize('student', 'admin'), lmsController.submitLeaveRequest);

module.exports = router;
