const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);

// Get departments (supports ?collegeId=...)
router.get('/', authorize('admin', 'trainer', 'tutor'), departmentController.getDepartments);

// Add custom department
router.post('/', authorize('admin'), departmentController.createDepartment);

// Update department
router.put('/:id', authorize('admin'), departmentController.updateDepartment);

// Delete department
router.delete('/:id', authorize('admin'), departmentController.deleteDepartment);

module.exports = router;
