const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const projectController = require('../controllers/projectController');
const lifecycleCtrl = require('../controllers/projectLifecycleController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

// Ensure upload directories exist
const uploadDir = path.join(__dirname, '..', 'uploads', 'projects');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration for Projects
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25 MB max per upload
});

const reqFilesUpload = upload.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'referenceDocs', maxCount: 10 }
]);

const subFilesUpload = upload.fields([
  { name: 'documents', maxCount: 5 },
  { name: 'screenshots', maxCount: 8 }
]);

// ── Public Routes ──────────────────────────────────────────────────────────
router.get('/public/approved', lifecycleCtrl.getPublicApprovedProjects);
router.get('/public/:id', lifecycleCtrl.getPublicProjectDetail);

// ── Admin: Project Requirements CMS ────────────────────────────────────────
router.post('/requirements', protect, authorize('admin'), reqFilesUpload, lifecycleCtrl.createRequirement);
router.get('/requirements', protect, authorize('admin', 'trainer', 'tutor'), lifecycleCtrl.getRequirements);
router.get('/requirements/:id', protect, authorize('admin', 'trainer', 'tutor'), lifecycleCtrl.getRequirementById);
router.put('/requirements/:id', protect, authorize('admin'), reqFilesUpload, lifecycleCtrl.updateRequirement);
router.patch('/requirements/:id/status', protect, authorize('admin'), lifecycleCtrl.updateRequirementStatus);

// ── Admin: Executive Approvals & Replication ───────────────────────────────
router.get('/admin/pending-approvals', protect, authorize('admin'), lifecycleCtrl.getPendingAdminApprovals);
router.post('/admin/approvals/:assignmentId', protect, authorize('admin'), lifecycleCtrl.handleAdminApproval);
router.post('/admin/github-sync/:assignmentId/retry', protect, authorize('admin'), lifecycleCtrl.retryGitHubSync);
router.patch('/admin/publish-homepage/:assignmentId', protect, authorize('admin'), lifecycleCtrl.toggleHomepagePublication);
router.get('/admin/all', protect, authorize('admin', 'trainer', 'tutor'), lifecycleCtrl.getAllProjectsLibrary);

// ── Download Full Project ZIP ──────────────────────────────────────────────
router.get('/assignments/:assignmentId/download', protect, lifecycleCtrl.downloadProjectZip);

// ── Tutor: Requirements, Assignment & Review ──────────────────────────────
router.get('/tutor/students', protect, authorize('trainer', 'tutor', 'admin'), lifecycleCtrl.getAssignableStudents);
router.get('/tutor/requirements', protect, authorize('trainer', 'tutor', 'admin'), lifecycleCtrl.getTutorRequirements);
router.get('/tutor/assignments', protect, authorize('trainer', 'tutor', 'admin'), lifecycleCtrl.getTutorAssignments);
router.post('/tutor/assign', protect, authorize('trainer', 'tutor', 'admin'), lifecycleCtrl.assignProjectToStudent);
router.get('/tutor/reviews/:assignmentId', protect, authorize('trainer', 'tutor', 'admin'), lifecycleCtrl.getTutorReviewDetail);
router.post('/tutor/review/:assignmentId', protect, authorize('trainer', 'tutor', 'admin'), lifecycleCtrl.submitTutorReview);

// ── Student: My Final Projects & Submissions ───────────────────────────────
router.get('/student/my-projects', protect, lifecycleCtrl.getStudentProjects);
router.post('/student/submit/:assignmentId', protect, subFilesUpload, lifecycleCtrl.submitStudentProject);

// ── Legacy Routes Compatibility ────────────────────────────────────────────
router.get('/', protect, projectController.getProjects);
router.get('/:id', protect, projectController.getProjectById);
router.patch('/:id/tasks/:taskId', protect, projectController.updateTaskStatus);
router.post('/:id/submit', protect, projectController.submitProject);
router.post('/:id/review', protect, authorize('trainer', 'admin'), projectController.reviewProject);

module.exports = router;
