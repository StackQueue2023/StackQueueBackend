const express = require('express');
const router = express.Router();
const studentTaskController = require('../controllers/studentTaskController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);

// Get tasks list (student sees own tasks, tutor sees assigned tasks)
router.get('/', studentTaskController.getTasks);

// Create task linked to session
router.post('/', authorize('trainer', 'tutor', 'admin'), studentTaskController.createTask);

// Student submits task
router.post('/:id/submit', authorize('student', 'admin'), studentTaskController.submitTask);

// Tutor reviews and grades task
router.post('/:id/review', authorize('trainer', 'tutor', 'admin'), studentTaskController.reviewTask);

module.exports = router;
