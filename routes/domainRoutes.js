const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getMyDomain,
  getDomainAnalytics,
  getModules,
  getModuleTasks,
  startTask,
  runTaskCode,
  submitTask,
  getModuleQuestions,
  runModuleQuestionCode,
  submitModuleQuestion
} = require('../controllers/domainController');

// All routes require authentication
router.use(protect);

router.get('/my',                          getMyDomain);
router.get('/analytics',                   getDomainAnalytics);
router.get('/modules',                     getModules);
router.get('/modules/:moduleId/tasks',     getModuleTasks);
router.post('/tasks/:taskId/start',        startTask);
router.post('/tasks/:taskId/run',          runTaskCode);
router.post('/tasks/:taskId/submit',       submitTask);

// Dedicated Module Practice Questions
router.get('/modules/:moduleId/questions', getModuleQuestions);
router.post('/questions/:questionId/run',   runModuleQuestionCode);
router.post('/questions/:questionId/submit',submitModuleQuestion);

module.exports = router;
