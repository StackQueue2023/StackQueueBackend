const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const domainController = require('../controllers/adminDomainController');

const multer = require('multer');

// Configure memory storage for PDF syllabus processing
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

// Combined data
router.get('/all', domainController.getAllDomainData);

// Courses
router.get('/courses', domainController.getCourses);
router.post('/courses', upload.single('syllabusFile'), domainController.createCourse);
router.get('/courses/:courseId/details', domainController.getCourseDetail);
router.put('/courses/:courseId', domainController.updateCourse);
router.delete('/courses/:courseId', domainController.deleteCourse);

// Internships
router.get('/internships', domainController.getInternships);
router.post('/internships', upload.single('syllabusFile'), domainController.createInternship);
router.get('/internships/:internshipId/details', domainController.getInternshipDetail);
router.put('/internships/:internshipId', domainController.updateInternship);
router.delete('/internships/:internshipId', domainController.deleteInternship);

// Projects
router.get('/projects', domainController.getProjects);
router.post('/projects', domainController.createProject);
router.get('/projects/:projectId/details', domainController.getProjectDetail);
router.put('/projects/:projectId', domainController.updateProject);
router.delete('/projects/:projectId', domainController.deleteProject);

// Course Categories
router.get('/categories', domainController.getCourseCategories);
router.post('/categories', domainController.createCourseCategory);
router.put('/categories/:categoryId', domainController.updateCourseCategory);
router.patch('/categories/:categoryId/status', domainController.toggleCourseCategoryStatus);
router.delete('/categories/:categoryId', domainController.deleteCourseCategory);

// Technical Domains (Dynamic Add & Rename Domains)
router.get('/domains', domainController.getTechnicalDomains);
router.post('/domains', domainController.createTechnicalDomain);
router.put('/domains/:domainId', domainController.updateTechnicalDomain);
router.delete('/domains/:domainId', domainController.deleteTechnicalDomain);

module.exports = router;
