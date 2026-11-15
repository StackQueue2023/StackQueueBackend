const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const adaptiveController = require('../controllers/adaptiveQuestionController');

// ── Student Routes (One Question at a Time & Answer Evaluation) ──
router.get(
  '/course/:courseId/current',
  protect,
  adaptiveController.getCurrentQuestionForCourse
);

router.post(
  '/submit-mcq',
  protect,
  adaptiveController.submitMcqAnswer
);

router.post(
  '/submit-code',
  protect,
  adaptiveController.submitCodingSolution
);

// ── Admin Routes (Manage Coding & MCQ Separately, Configure & Results) ──
router.get(
  '/admin/questions',
  protect,
  authorize('admin'),
  adaptiveController.adminGetQuestions
);

router.post(
  '/admin/questions',
  protect,
  authorize('admin'),
  adaptiveController.adminSaveQuestion
);

router.post(
  '/admin/courses/:courseId/generate',
  protect,
  authorize('admin'),
  adaptiveController.adminGenerateCourseQuestions
);

router.get(
  '/admin/student-results',
  protect,
  authorize('admin'),
  adaptiveController.adminGetStudentResults
);

module.exports = router;
