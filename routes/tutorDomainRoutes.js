const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getTutorStudents,
  getDomainTasksForCourse,
  enableTask,
  disableTask,
  markStudentTaskComplete,
  createDomainTask,
  getStudentModules,
  updateStudentModuleStatus,
  getBatchModules,
  updateBatchModuleStatus
} = require('../controllers/tutorDomainController');

const isTutorOrAdmin = (req, res, next) => {
  const role = req.user?.role;
  if (role === 'tutor' || role === 'trainer' || role === 'admin') return next();
  return res.status(403).json({ success: false, message: 'Tutor or Admin access required.' });
};

// All routes require authentication + tutor/admin role
router.use(protect);
router.use(isTutorOrAdmin);

router.get('/students',                                                    getTutorStudents);
router.get('/student-modules/:studentUserId',                              getStudentModules);
router.post('/student-modules/:studentUserId/:moduleId/status',            updateStudentModuleStatus);
router.put('/student-modules/:studentUserId/:moduleId/status',             updateStudentModuleStatus);
router.get('/batch-modules/:batchId',                                       getBatchModules);
router.post('/batch-modules/:batchId/:moduleId/status',                     updateBatchModuleStatus);
router.put('/batch-modules/:batchId/:moduleId/status',                      updateBatchModuleStatus);
router.get('/tasks/:courseId',                                             getDomainTasksForCourse);
router.post('/tasks',                                                      createDomainTask);
router.post('/tasks/:taskId/enable',                                       enableTask);
router.post('/tasks/:taskId/disable',                                      disableTask);
router.post('/progress/:studentId/:taskId/complete',                       markStudentTaskComplete);

module.exports = router;
