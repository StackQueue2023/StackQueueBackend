const express = require('express');
const router = express.Router();
const controller = require('../controllers/collegeTrainingSyllabusController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

// ─── ADMIN SYLLABUS & MODULE MANAGEMENT ───────────────────────────
router.post(
  '/admin/college-training/syllabus/save',
  protect,
  authorize('admin'),
  controller.saveSyllabus
);

router.get(
  '/admin/college-training/syllabus/batch/:batchId',
  protect,
  authorize('admin', 'tutor', 'trainer'),
  controller.getSyllabusByBatch
);

router.post(
  '/admin/college-training/syllabus/generate/:batchId',
  protect,
  authorize('admin'),
  controller.generateModulesAndQuestions
);

router.get(
  '/admin/college-training/modules/batch/:batchId',
  protect,
  authorize('admin', 'tutor', 'trainer'),
  controller.getBatchModules
);

router.put(
  '/admin/college-training/modules/:moduleId',
  protect,
  authorize('admin'),
  controller.updateModule
);

router.post(
  '/admin/college-training/modules/:moduleId/questions',
  protect,
  authorize('admin'),
  controller.addQuestionToModule
);

router.put(
  '/admin/college-training/questions/:questionId',
  protect,
  authorize('admin'),
  controller.updateQuestion
);

router.delete(
  '/admin/college-training/questions/:questionId',
  protect,
  authorize('admin'),
  controller.deleteQuestion
);

// ─── STUDENT ASSIGNED MODULES & EXECUTION ─────────────────────────
router.get(
  '/student/college-training/my-modules',
  protect,
  authorize('student'),
  controller.getStudentAssignedModules
);

router.post(
  '/student/college-training/modules/:moduleId/questions/:questionId/submit',
  protect,
  authorize('student'),
  controller.submitQuestionAnswer
);

module.exports = router;
