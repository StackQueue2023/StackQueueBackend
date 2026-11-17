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

router.post(
  '/submit-practical',
  protect,
  adaptiveController.submitPracticalSolution
);

router.post(
  '/submit-non-coding',
  protect,
  adaptiveController.submitNonCodingAnswer
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

router.put(
  '/admin/questions/:questionId/evaluation-config',
  protect,
  authorize('admin'),
  adaptiveController.adminUpdateEvaluationConfig
);

router.post(
  '/admin/test-battery/:questionId',
  protect,
  authorize('admin'),
  adaptiveController.adminRunAccuracyTestBattery
);

router.get(
  '/admin/pending-reviews',
  protect,
  authorize('admin'),
  adaptiveController.adminGetPendingReviews
);

router.post(
  '/admin/override-review',
  protect,
  authorize('admin'),
  adaptiveController.adminOverrideReview
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
