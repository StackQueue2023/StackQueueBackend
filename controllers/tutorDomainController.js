const DomainTask = require('../models/DomainTask');
const StudentDomainProgress = require('../models/StudentDomainProgress');
const StudentProfile = require('../models/StudentProfile');
const StudentModuleStatus = require('../models/StudentModuleStatus');
const Module = require('../models/Module');
const Batch = require('../models/Batch');

// ─────────────────────────────────────────────
// GET /api/tutor/domain/students
// Tutor sees their assigned students and task status
// ─────────────────────────────────────────────
exports.getTutorStudents = async (req, res) => {
  try {
    const students = await StudentProfile.find({ assignedTutorId: req.user._id })
      .populate('userId', 'name email studentId')
      .populate('enrolledCourseId', 'title slug');

    return res.json({ success: true, data: students });
  } catch (err) {
    console.error('getTutorStudents error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// GET /api/tutor/domain/tasks/:courseId
// Get all domain tasks for a course (for tutor to manage)
// ─────────────────────────────────────────────
exports.getDomainTasksForCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const tasks = await DomainTask.find({ courseId, isActive: true })
      .populate('moduleId', 'title order')
      .sort({ 'moduleId.order': 1, order: 1 });

    return res.json({ success: true, data: tasks });
  } catch (err) {
    console.error('getDomainTasksForCourse error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// POST /api/tutor/domain/tasks/:taskId/enable
// Tutor enables a task (makes it available for students)
// ─────────────────────────────────────────────
exports.enableTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await DomainTask.findByIdAndUpdate(
      taskId,
      {
        isEnabled: true,
        enabledBy: req.user._id,
        enabledAt: new Date()
      },
      { new: true }
    );

    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    // Create StudentDomainProgress records for all students enrolled in this course
    const profiles = await StudentProfile.find({ enrolledCourseId: task.courseId });
    const bulkOps = profiles.map(profile => ({
      updateOne: {
        filter: { studentId: profile.userId, domainTaskId: taskId },
        update: {
          $setOnInsert: {
            studentId: profile.userId,
            domainTaskId: taskId,
            moduleId: task.moduleId,
            courseId: task.courseId,
            domain: task.domain,
            status: 'available'
          }
        },
        upsert: true
      }
    }));

    if (bulkOps.length > 0) {
      await StudentDomainProgress.bulkWrite(bulkOps);
    }

    return res.json({ success: true, message: 'Task enabled for all students.', data: task });
  } catch (err) {
    console.error('enableTask error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// POST /api/tutor/domain/tasks/:taskId/disable
// Tutor disables a task
// ─────────────────────────────────────────────
exports.disableTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await DomainTask.findByIdAndUpdate(
      taskId,
      { isEnabled: false, enabledBy: null, enabledAt: null },
      { new: true }
    );
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });
    return res.json({ success: true, message: 'Task disabled.', data: task });
  } catch (err) {
    console.error('disableTask error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// POST /api/tutor/domain/progress/:studentId/:taskId/complete
// Tutor marks a student's task as completed
// ─────────────────────────────────────────────
exports.markStudentTaskComplete = async (req, res) => {
  try {
    const { studentId, taskId } = req.params;
    const { feedback } = req.body;

    const task = await DomainTask.findById(taskId);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    const progress = await StudentDomainProgress.findOneAndUpdate(
      { studentId, domainTaskId: taskId },
      {
        status: 'completed',
        completedAt: new Date(),
        pointsEarned: task.points,
        tutorFeedback: feedback || '',
        reviewedBy: req.user._id
      },
      { new: true, upsert: true }
    );

    // Update student XP
    await StudentProfile.findOneAndUpdate(
      { userId: studentId },
      { $inc: { totalXp: task.points } }
    );

    return res.json({ success: true, message: 'Marked as completed.', data: progress });
  } catch (err) {
    console.error('markStudentTaskComplete error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// POST /api/tutor/domain/tasks  (Create a new domain task)
// ─────────────────────────────────────────────
exports.createDomainTask = async (req, res) => {
  try {
    const task = await DomainTask.create(req.body);
    return res.status(201).json({ success: true, data: task });
  } catch (err) {
    console.error('createDomainTask error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// GET /api/tutor/domain/student-modules/:studentUserId
// Tutor gets modules and their status for a specific student
// ─────────────────────────────────────────────
exports.getStudentModules = async (req, res) => {
  try {
    const { studentUserId } = req.params;
    const profile = await StudentProfile.findOne({ userId: studentUserId })
      .populate('userId', 'name email studentId')
      .populate('enrolledCourseId', 'title slug');

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const targetCourseId = profile.enrolledCourseId?._id || profile.enrolledCourseId;
    const targetDomain = profile.domain;

    let modules = [];
    if (targetCourseId) {
      modules = await Module.find({ courseId: targetCourseId, isPublished: { $ne: false } }).sort({ order: 1 });
    }
    if ((!modules || modules.length === 0) && targetDomain) {
      modules = await Module.find({ domain: targetDomain, isPublished: { $ne: false } }).sort({ order: 1 });
    }

    // Get statuses for this student
    const statuses = await StudentModuleStatus.find({ studentId: studentUserId });
    const statusMap = {};
    statuses.forEach(s => { statusMap[s.moduleId.toString()] = s.status; });

    const modulesWithStatus = await Promise.all(modules.map(async (mod) => {
      const totalTasks = await DomainTask.countDocuments({ moduleId: mod._id, isActive: true });
      const completedTasks = await StudentDomainProgress.countDocuments({
        studentId: studentUserId,
        moduleId: mod._id,
        status: 'completed'
      });
      const inProgressTasks = await StudentDomainProgress.countDocuments({
        studentId: studentUserId,
        moduleId: mod._id,
        status: 'in_progress'
      });

      const defaultStatus = mod.order === 1 ? 'processing' : 'not_started';
      const currentStatus = statusMap[mod._id.toString()] || defaultStatus;

      return {
        _id: mod._id,
        title: mod.title,
        description: mod.description,
        order: mod.order,
        domain: mod.domain,
        courseId: mod.courseId,
        status: currentStatus, // 'not_started' | 'processing' | 'completed'
        isLocked: currentStatus === 'not_started',
        totalTasks,
        completedTasks,
        inProgressTasks
      };
    }));

    return res.json({
      success: true,
      data: {
        student: {
          _id: profile.userId?._id,
          name: profile.userId?.name,
          email: profile.userId?.email,
          studentId: profile.studentId || profile.userId?.studentId,
          domain: profile.domain,
          course: profile.enrolledCourseId
        },
        modules: modulesWithStatus
      }
    });
  } catch (err) {
    console.error('getStudentModules error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// POST/PUT /api/tutor/domain/student-modules/:studentUserId/:moduleId/status
// Tutor sets module status for a student ('not_started' | 'processing' | 'completed')
// ─────────────────────────────────────────────
exports.updateStudentModuleStatus = async (req, res) => {
  try {
    const { studentUserId, moduleId } = req.params;
    const { status } = req.body;

    if (!['not_started', 'processing', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be 'not_started', 'processing', or 'completed'."
      });
    }

    const mod = await Module.findById(moduleId);
    if (!mod) {
      return res.status(404).json({ success: false, message: 'Module not found.' });
    }

    const record = await StudentModuleStatus.findOneAndUpdate(
      { studentId: studentUserId, moduleId },
      {
        status,
        domain: mod.domain,
        courseId: mod.courseId,
        updatedBy: req.user._id,
        updatedAt: new Date()
      },
      { new: true, upsert: true }
    );

    // If set to 'processing', unlock tasks for this student in this module
    if (status === 'processing') {
      const tasks = await DomainTask.find({ moduleId, isActive: true });
      for (const t of tasks) {
        if (!t.isEnabled) {
          t.isEnabled = true;
          t.enabledBy = req.user._id;
          t.enabledAt = new Date();
          await t.save();
        }
        const existingProgress = await StudentDomainProgress.findOne({
          studentId: studentUserId,
          domainTaskId: t._id
        });
        if (!existingProgress) {
          await StudentDomainProgress.create({
            studentId: studentUserId,
            domainTaskId: t._id,
            moduleId: mod._id,
            courseId: t.courseId || mod.courseId,
            domain: t.domain || mod.domain,
            status: 'available'
          });
        } else if (existingProgress.status === 'locked') {
          existingProgress.status = 'available';
          await existingProgress.save();
        }
      }
    } else if (status === 'not_started') {
      // Set unstarted tasks back to 'locked' for this student
      await StudentDomainProgress.updateMany(
        { studentId: studentUserId, moduleId, status: 'available' },
        { $set: { status: 'locked' } }
      );
    }

    return res.json({
      success: true,
      message: `Module status updated to ${status}.`,
      data: record
    });
  } catch (err) {
    console.error('updateStudentModuleStatus error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// GET /api/tutor/domain/batch-modules/:batchId
// Returns shared batch syllabus modules with batch-wide progress
// ─────────────────────────────────────────────
exports.getBatchModules = async (req, res) => {
  try {
    const { batchId } = req.params;
    const batch = await Batch.findById(batchId)
      .populate('courseId', 'title slug category code')
      .populate('trainerId', 'name email')
      .populate('studentIds', 'name studentId email username');

    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found.' });
    }

    if (!batch.courseId) {
      return res.status(400).json({ success: false, message: 'No course/domain is assigned to this batch.' });
    }

    // Fetch shared modules for this batch's course
    let modules = await Module.find({ courseId: batch.courseId._id }).sort({ order: 1 });
    if (!modules || modules.length === 0) {
      const searchSlug = (batch.courseId.slug || batch.courseId.domain || '').toLowerCase();
      if (searchSlug) {
        modules = await Module.find({
          $or: [
            { domain: searchSlug },
            { domain: new RegExp(searchSlug, 'i') }
          ]
        }).sort({ order: 1 });
      }
    }

    const studentUserIds = (batch.studentIds || []).map(s => s._id);
    const totalStudents = studentUserIds.length;

    const modulesWithStatus = await Promise.all(modules.map(async (mod) => {
      const tasks = await DomainTask.find({ moduleId: mod._id, isActive: true });
      const totalTasks = tasks.length;
      const taskIds = tasks.map(t => t._id);

      // Statuses across batch students
      const statuses = await StudentModuleStatus.find({
        studentId: { $in: studentUserIds },
        moduleId: mod._id
      });

      let processingCount = 0;
      let completedCount = 0;
      let notStartedCount = 0;

      for (const s of statuses) {
        if (s.status === 'completed') completedCount++;
        else if (s.status === 'processing') processingCount++;
        else notStartedCount++;
      }

      // Remaining students who haven't explicitly set status
      const unrecordedCount = totalStudents - statuses.length;
      if (mod.order === 1) {
        processingCount += unrecordedCount;
      } else {
        notStartedCount += unrecordedCount;
      }

      // Determine batch-level effective status
      let batchStatus = 'not_started';
      if (totalStudents > 0 && completedCount === totalStudents) {
        batchStatus = 'completed';
      } else if (processingCount > 0 || (mod.order === 1 && completedCount === 0)) {
        batchStatus = 'processing';
      }

      // How many students completed all tasks in this module
      let studentsCompletedAllTasks = 0;
      if (totalTasks > 0 && totalStudents > 0) {
        for (const sId of studentUserIds) {
          const completedTasksForStudent = await StudentDomainProgress.countDocuments({
            studentId: sId,
            domainTaskId: { $in: taskIds },
            status: 'completed'
          });
          if (completedTasksForStudent >= totalTasks) {
            studentsCompletedAllTasks++;
          }
        }
      }

      const progressPercent = totalStudents > 0
        ? Math.round((studentsCompletedAllTasks / totalStudents) * 100)
        : 0;

      return {
        _id: mod._id,
        title: mod.title,
        description: mod.description,
        order: mod.order,
        domain: mod.domain,
        courseId: mod.courseId,
        status: batchStatus, // 'not_started' | 'processing' | 'completed'
        isLocked: batchStatus === 'not_started',
        totalTasks,
        totalStudents,
        processingCount,
        completedCount,
        notStartedCount,
        studentsCompletedAllTasks,
        progressPercent
      };
    }));

    return res.json({
      success: true,
      data: {
        batch: {
          _id: batch._id,
          name: batch.name,
          code: batch.code,
          batchType: batch.batchType,
          course: batch.courseId,
          trainer: batch.trainerId,
          totalStudents,
          students: batch.studentIds
        },
        modules: modulesWithStatus
      }
    });
  } catch (err) {
    console.error('getBatchModules error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// POST/PUT /api/tutor/domain/batch-modules/:batchId/:moduleId/status
// Tutor sets module status for all students in the batch simultaneously
// ─────────────────────────────────────────────
exports.updateBatchModuleStatus = async (req, res) => {
  try {
    const { batchId, moduleId } = req.params;
    const { status } = req.body;

    if (!['not_started', 'processing', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be 'not_started', 'processing', or 'completed'."
      });
    }

    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found.' });
    }

    const mod = await Module.findById(moduleId);
    if (!mod) {
      return res.status(404).json({ success: false, message: 'Module not found.' });
    }

    const studentUserIds = (batch.studentIds || []).map(s => s._id || s);

    if (studentUserIds.length > 0) {
      // 1. Bulk upsert StudentModuleStatus for all students in the batch
      const bulkOps = studentUserIds.map(sId => ({
        updateOne: {
          filter: { studentId: sId, moduleId },
          update: {
            $set: {
              status,
              domain: mod.domain,
              courseId: mod.courseId,
              updatedBy: req.user._id,
              updatedAt: new Date()
            }
          },
          upsert: true
        }
      }));
      await StudentModuleStatus.bulkWrite(bulkOps);

      // 2. If 'processing' (unlocked), unlock tasks for all students in batch
      if (status === 'processing') {
        const tasks = await DomainTask.find({ moduleId, isActive: true });
        for (const t of tasks) {
          if (!t.isEnabled) {
            t.isEnabled = true;
            t.enabledBy = req.user._id;
            t.enabledAt = new Date();
            await t.save();
          }

          const progressBulkOps = studentUserIds.map(sId => ({
            updateOne: {
              filter: { studentId: sId, domainTaskId: t._id },
              update: {
                $setOnInsert: {
                  studentId: sId,
                  domainTaskId: t._id,
                  moduleId: mod._id,
                  courseId: t.courseId || mod.courseId,
                  domain: t.domain || mod.domain,
                  status: 'available'
                }
              },
              upsert: true
            }
          }));

          if (progressBulkOps.length > 0) {
            await StudentDomainProgress.bulkWrite(progressBulkOps);
          }

          // If previously locked, set to available
          await StudentDomainProgress.updateMany(
            { studentId: { $in: studentUserIds }, domainTaskId: t._id, status: 'locked' },
            { $set: { status: 'available' } }
          );
        }
      } else if (status === 'not_started') {
        // Lock unstarted tasks back to 'locked' for all batch students
        await StudentDomainProgress.updateMany(
          { studentId: { $in: studentUserIds }, moduleId, status: 'available' },
          { $set: { status: 'locked' } }
        );
      }
    }

    return res.json({
      success: true,
      message: `Module '${mod.title}' status updated to ${status.replace('_', ' ').toUpperCase()} for all ${studentUserIds.length} batch students.`,
      data: { moduleId, status }
    });
  } catch (err) {
    console.error('updateBatchModuleStatus error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};


