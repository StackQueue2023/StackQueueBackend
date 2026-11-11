const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const syllabusController = require('../controllers/adminSyllabusController');

const multer = require('multer');

// Configure memory storage for PDF processing
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB max
});

// Ensure only authenticated Admin can access
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Admin access required.' });
};

router.use(protect);
router.use(isAdmin);

// Overview & Statistics
router.get('/domains', syllabusController.getDomainsOverview);
router.get('/stats', syllabusController.getSyllabusStats);
router.get('/coverage-report', syllabusController.getSyllabusCoverageReport);
router.post('/sync-coverage', syllabusController.syncSyllabusCoverage);

// PDF Syllabus Upload & Automatic 10-15 Task Generator
router.post('/upload-pdf', upload.single('file'), syllabusController.uploadSyllabusPdf);

// Modules
router.get('/modules', syllabusController.getModulesWithTasks);
router.post('/modules', syllabusController.createModule);
router.put('/modules/:moduleId', syllabusController.updateModule);
router.delete('/modules/:moduleId', syllabusController.deleteModule);

// Tasks
router.post('/tasks', syllabusController.createTask);
router.put('/tasks/:taskId', syllabusController.updateTask);
router.delete('/tasks/:taskId', syllabusController.deleteTask);
router.patch('/tasks/:taskId/reorder', syllabusController.reorderTask);
router.patch('/tasks/:taskId/toggle-status', syllabusController.toggleTaskStatus);

// Automatic 4-Module Question Generation & Admin Controls
router.get('/generation-status/:courseId', syllabusController.getGenerationStatus);
router.get('/course-questions/:courseId', syllabusController.getCourseQuestions);
router.post('/generate-questions/:courseId', syllabusController.triggerGenerateCourseQuestions);
router.post('/generate-all-domains', syllabusController.triggerGenerateAllDomains);
router.post('/regenerate-topic', syllabusController.regenerateTopic);
router.post('/retry-generation/:jobId', syllabusController.retryGeneration);
router.put('/question/:type/:id', syllabusController.updateQuestion);
router.patch('/question/:type/:id/verification', syllabusController.updateVerificationStatus);
router.post('/publish-questions/:courseId', syllabusController.publishCourseQuestions);

module.exports = router;
