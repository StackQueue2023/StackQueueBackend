const Module = require('../models/Module');
const DomainTask = require('../models/DomainTask');
const Course = require('../models/Course');
const StudentDomainProgress = require('../models/StudentDomainProgress');
const InterviewQuestion = require('../models/InterviewQuestion');
const InterviewTestCase = require('../models/InterviewTestCase');
const Challenge = require('../models/Challenge');
const SyllabusGenerationJob = require('../models/SyllabusGenerationJob');
const {
  extractTextFromPdf,
  splitTextIntoModules,
  generateTasksForModule
} = require('../services/syllabusGeneratorService');
const {
  generateSyllabusQuestions,
  regenerateTopicQuestions,
  normalizeDomainKey
} = require('../services/syllabusQuestionGeneratorService');
const {
  generateAllSyllabusQuestionBanks,
  generateSyllabusCoverageReport
} = require('../services/syllabusQuestionSeederService');
const { extractCourseSyllabusTopics } = require('../services/syllabusTopicExtractorService');

// Standard domains configuration
const DOMAIN_CONFIG = {
  java: {
    key: 'java',
    label: 'Java',
    slug: 'java-full-stack',
    title: 'Java Full Stack',
    icon: '☕',
    color: 'from-orange-500 to-red-500',
    badgeColor: 'orange'
  },
  python: {
    key: 'python',
    label: 'Python',
    slug: 'python-full-stack',
    title: 'Python Full Stack',
    icon: '🐍',
    color: 'from-blue-500 to-cyan-500',
    badgeColor: 'blue'
  },
  cpp: {
    key: 'cpp',
    label: 'C++',
    slug: 'cpp-mastery',
    title: 'C++ Systems & DSA Mastery',
    icon: '⚡',
    color: 'from-purple-500 to-indigo-500',
    badgeColor: 'purple'
  },
  react: {
    key: 'react',
    label: 'React',
    slug: 'react-frontend-mastery',
    title: 'React Modern Web Engineering',
    icon: '⚛️',
    color: 'from-cyan-500 to-teal-500',
    badgeColor: 'cyan'
  }
};

// Helper: Ensure domain has a Course record in DB without overwriting unrelated courses
async function ensureDomainCourse(domainKey, courseId = null, courseTitle = null) {
  if (courseId) {
    const c = await Course.findById(courseId);
    if (c) return c;
  }

  const dKey = (domainKey || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  if (courseTitle) {
    const matchedByTitle = await Course.findOne({
      $or: [
        { title: { $regex: new RegExp('^' + courseTitle.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') + '$', 'i') } },
        { slug: courseTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-') }
      ]
    });
    if (matchedByTitle) return matchedByTitle;
  }

  if (DOMAIN_CONFIG[dKey]) {
    const conf = DOMAIN_CONFIG[dKey];
    let course = await Course.findOne({
      $or: [{ slug: conf.slug }, { title: conf.title }]
    });

    if (!course) {
      course = await Course.create({
        title: conf.title,
        slug: conf.slug,
        description: `Comprehensive syllabus and practical project training for ${conf.label}.`,
        category: 'Software Development',
        icon: conf.icon,
        color: conf.color,
        durationWeeks: 12,
        totalHours: 120,
        isActive: true
      });
    }
    return course;
  }

  // If domainKey is custom, search by dKey or create custom course
  let customCourse = await Course.findOne({
    $or: [
      { slug: dKey },
      { title: { $regex: new RegExp('^' + (courseTitle || dKey).trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') + '$', 'i') } }
    ]
  });

  if (!customCourse) {
    const titleToUse = courseTitle || domainKey.toUpperCase();
    customCourse = await Course.create({
      title: titleToUse,
      slug: dKey || 'custom-course',
      description: `Comprehensive syllabus training for ${titleToUse}.`,
      category: 'Software Development',
      durationWeeks: 12,
      totalHours: 120,
      isActive: true
    });
  }

  return customCourse;
}

// ─────────────────────────────────────────────────────────
// 1. GET /api/admin/syllabus/domains
// Returns all 4 domains with their course info & syllabus counts
// ─────────────────────────────────────────────────────────
exports.getDomainsOverview = async (req, res) => {
  try {
    // Ensure standard 4 domains have courses
    for (const d of Object.keys(DOMAIN_CONFIG)) {
      await ensureDomainCourse(d);
    }

    const courses = await Course.find({ isActive: true });
    const result = [];
    const processedDomains = new Set();

    for (const course of courses) {
      const dKey = (course.slug || course.title).toLowerCase().replace(/[^a-z0-9]/g, '');
      if (processedDomains.has(dKey)) continue;
      processedDomains.add(dKey);

      const conf = DOMAIN_CONFIG[dKey] || {
        key: dKey,
        label: course.title,
        icon: course.icon || '📖',
        color: course.color || 'from-blue-600 to-indigo-600',
        badgeColor: 'blue'
      };

      const totalModules = await Module.countDocuments({
        $or: [{ domain: dKey }, { courseId: course._id }],
        isPublished: { $ne: false }
      });

      const totalTasks = await DomainTask.countDocuments({
        $or: [{ domain: dKey }, { courseId: course._id }]
      });
      const activeTasks = await DomainTask.countDocuments({
        $or: [{ domain: dKey }, { courseId: course._id }],
        isActive: true
      });

      result.push({
        key: dKey,
        label: conf.label || course.title,
        icon: conf.icon || '📖',
        color: conf.color || 'from-blue-600 to-indigo-600',
        badgeColor: conf.badgeColor || 'blue',
        courseId: course._id,
        courseTitle: course.title,
        totalModules,
        totalTasks,
        activeTasks
      });
    }

    return res.json({ success: true, data: result });
  } catch (err) {
    console.error('getDomainsOverview error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────
// 2. GET /api/admin/syllabus/stats?domain=java
// Returns top-level metrics for dashboard cards
// ─────────────────────────────────────────────────────────
exports.getSyllabusStats = async (req, res) => {
  try {
    const { domain } = req.query;

    if (domain) {
      const course = await ensureDomainCourse(domain);
      const totalModules = await Module.countDocuments({
        $or: [{ domain }, { courseId: course._id }]
      });
      const totalTasks = await DomainTask.countDocuments({
        $or: [{ domain }, { courseId: course._id }]
      });
      const activeTasks = await DomainTask.countDocuments({
        $or: [{ domain }, { courseId: course._id }],
        isActive: true
      });
      const totalDomains = await Course.countDocuments({ isActive: true });

      return res.json({
        success: true,
        data: {
          domain,
          domainLabel: course.title || domain,
          totalDomains,
          totalModules,
          totalTasks,
          activeTasks
        }
      });
    }

    // Overall across all domains
    const totalDomains = await Course.countDocuments({ isActive: true });
    const totalModules = await Module.countDocuments();
    const totalTasks = await DomainTask.countDocuments();
    const activeTasks = await DomainTask.countDocuments({ isActive: true });

    return res.json({
      success: true,
      data: {
        totalDomains,
        totalModules,
        totalTasks,
        activeTasks
      }
    });
  } catch (err) {
    console.error('getSyllabusStats error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────
// 3. GET /api/admin/syllabus/modules?domain=java&search=...
// Returns modules for a domain with tasks under each module
// ─────────────────────────────────────────────────────────
exports.getModulesWithTasks = async (req, res) => {
  try {
    const domain = (req.query.domain || 'java').toLowerCase();
    const search = (req.query.search || '').trim().toLowerCase();

    const course = await ensureDomainCourse(domain);

    // Sync any older modules that have courseId but missing domain
    await Module.updateMany(
      { courseId: course._id, domain: { $exists: false } },
      { $set: { domain } }
    );

    const moduleFilter = {
      $or: [{ domain }, { courseId: course._id }],
      isPublished: { $ne: false }
    };

    let modules = await Module.find(moduleFilter).sort({ order: 1 });

    // Fetch all domain tasks for this domain
    let tasks = await DomainTask.find({ domain }).sort({ order: 1 });

    // Filter by search if provided
    if (search) {
      const matchingTaskModuleIds = new Set();
      tasks.forEach(t => {
        if (t.title.toLowerCase().includes(search) || t.description?.toLowerCase().includes(search)) {
          matchingTaskModuleIds.add(t.moduleId.toString());
        }
      });

      modules = modules.filter(m =>
        m.title.toLowerCase().includes(search) ||
        m.description?.toLowerCase().includes(search) ||
        matchingTaskModuleIds.has(m._id.toString())
      );
    }

    // Group tasks under modules
    const tasksByModule = {};
    tasks.forEach(t => {
      const mId = t.moduleId.toString();
      if (!tasksByModule[mId]) tasksByModule[mId] = [];
      tasksByModule[mId].push(t);
    });

    const populatedModules = modules.map(m => {
      const mTasks = tasksByModule[m._id.toString()] || [];
      return {
        _id: m._id,
        courseId: m.courseId || course._id,
        domain: m.domain || domain,
        title: m.title,
        description: m.description,
        order: m.order,
        isPublished: m.isPublished !== false,
        tasksCount: mTasks.length,
        activeTasksCount: mTasks.filter(t => t.isActive).length,
        tasks: mTasks
      };
    });

    return res.json({
      success: true,
      domain,
      domainLabel: DOMAIN_CONFIG[domain]?.label || domain,
      data: populatedModules
    });
  } catch (err) {
    console.error('getModulesWithTasks error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────
// 4. POST /api/admin/syllabus/modules
// Creates a new module under a domain
// ─────────────────────────────────────────────────────────
exports.createModule = async (req, res) => {
  try {
    const { domain, title, description, order, isPublished, courseId } = req.body;

    if (!domain || !domain.trim()) {
      return res.status(400).json({ success: false, message: 'Domain is required.' });
    }
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Module title is required.' });
    }

    const domainKey = domain.toLowerCase().trim();
    const course = await ensureDomainCourse(domainKey, courseId);

    let moduleOrder = Number(order);
    if (!moduleOrder || isNaN(moduleOrder)) {
      const lastMod = await Module.findOne({
        $or: [{ domain: domainKey }, { courseId: course._id }]
      }).sort({ order: -1 });
      moduleOrder = lastMod ? lastMod.order + 1 : 1;
    }

    const newModule = await Module.create({
      courseId: course._id,
      domain: domainKey,
      title: title.trim(),
      description: description ? description.trim() : '',
      order: moduleOrder,
      isPublished: isPublished !== false
    });

    return res.status(201).json({
      success: true,
      message: 'Module created successfully.',
      data: {
        ...newModule.toObject(),
        tasksCount: 0,
        activeTasksCount: 0,
        tasks: []
      }
    });
  } catch (err) {
    console.error('createModule error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────
// 5. PUT /api/admin/syllabus/modules/:moduleId
// Updates a module
// ─────────────────────────────────────────────────────────
exports.updateModule = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { title, description, order, isPublished } = req.body;

    const mod = await Module.findById(moduleId);
    if (!mod) {
      return res.status(404).json({ success: false, message: 'Module not found.' });
    }

    if (title !== undefined) mod.title = title.trim();
    if (description !== undefined) mod.description = description.trim();
    if (order !== undefined) mod.order = Number(order);
    if (isPublished !== undefined) mod.isPublished = Boolean(isPublished);

    await mod.save();

    return res.json({
      success: true,
      message: 'Module updated successfully.',
      data: mod
    });
  } catch (err) {
    console.error('updateModule error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────
// 6. DELETE /api/admin/syllabus/modules/:moduleId
// Deletes or soft-deletes a module
// ─────────────────────────────────────────────────────────
exports.deleteModule = async (req, res) => {
  try {
    const { moduleId } = req.params;

    const mod = await Module.findById(moduleId);
    if (!mod) {
      return res.status(404).json({ success: false, message: 'Module not found.' });
    }

    // Check if any student has completed or in-progress tasks in this module
    const studentProgressCount = await StudentDomainProgress.countDocuments({
      moduleId,
      status: { $in: ['in_progress', 'completed'] }
    });

    if (studentProgressCount > 0) {
      // Soft-delete to preserve historical progress!
      mod.isPublished = false;
      await mod.save();
      await DomainTask.updateMany({ moduleId }, { $set: { isActive: false } });

      return res.json({
        success: true,
        message: `Module has ${studentProgressCount} student records. It has been deactivated (soft-deleted) to protect student progress.`
      });
    }

    // If no student progress, safe to delete
    await DomainTask.deleteMany({ moduleId });
    await Module.findByIdAndDelete(moduleId);

    return res.json({
      success: true,
      message: 'Module and its tasks deleted successfully.'
    });
  } catch (err) {
    console.error('deleteModule error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────
// 7. POST /api/admin/syllabus/tasks
// Creates a new task inside a module
// ─────────────────────────────────────────────────────────
exports.createTask = async (req, res) => {
  try {
    const {
      moduleId,
      domain,
      title,
      description,
      instructions,
      expectedOutput,
      taskType,
      difficulty,
      points,
      estimatedTime,
      order,
      isActive
    } = req.body;

    if (!moduleId) {
      return res.status(400).json({ success: false, message: 'Module ID is required.' });
    }
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Task title is required.' });
    }

    const mod = await Module.findById(moduleId);
    if (!mod) {
      return res.status(404).json({ success: false, message: 'Module not found.' });
    }

    const taskDomain = (domain || mod.domain || 'java').toLowerCase();
    const course = await ensureDomainCourse(taskDomain);

    let taskOrder = Number(order);
    if (!taskOrder || isNaN(taskOrder)) {
      const lastTask = await DomainTask.findOne({ moduleId }).sort({ order: -1 });
      taskOrder = lastTask ? lastTask.order + 1 : 1;
    }

    const validTypes = ['coding', 'mcq', 'quiz', 'debugging', 'challenge', 'practical', 'game', 'reading', 'exercise', 'project'];
    const assignedType = validTypes.includes(taskType) ? taskType : 'coding';

    const validDiff = ['Easy', 'Medium', 'Hard'];
    const assignedDiff = validDiff.includes(difficulty) ? difficulty : 'Easy';

    const newTask = await DomainTask.create({
      moduleId: mod._id,
      courseId: course._id,
      domain: taskDomain,
      title: title.trim(),
      description: description ? description.trim() : title.trim(),
      instructions: instructions ? instructions.trim() : '',
      expectedOutput: expectedOutput ? expectedOutput.trim() : '',
      taskType: assignedType,
      difficulty: assignedDiff,
      points: Number(points) || 10,
      estimatedTime: estimatedTime ? String(estimatedTime) : '20 mins',
      order: taskOrder,
      isActive: isActive !== false,
      isEnabled: true // Admin created task is immediately enabled or tutor-ready
    });

    const totalTasksInMod = await DomainTask.countDocuments({ moduleId: mod._id });

    return res.status(201).json({
      success: true,
      message: 'Task created successfully.',
      data: newTask,
      moduleTaskCount: totalTasksInMod
    });
  } catch (err) {
    console.error('createTask error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────
// 8. PUT /api/admin/syllabus/tasks/:taskId
// Updates a task
// ─────────────────────────────────────────────────────────
exports.updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const updates = req.body;

    const task = await DomainTask.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    if (updates.title !== undefined) task.title = updates.title.trim();
    if (updates.description !== undefined) task.description = updates.description.trim();
    if (updates.instructions !== undefined) task.instructions = updates.instructions.trim();
    if (updates.expectedOutput !== undefined) task.expectedOutput = updates.expectedOutput.trim();
    if (updates.taskType !== undefined) task.taskType = updates.taskType;
    if (updates.difficulty !== undefined) task.difficulty = updates.difficulty;
    if (updates.points !== undefined) task.points = Number(updates.points) || 10;
    if (updates.estimatedTime !== undefined) task.estimatedTime = String(updates.estimatedTime);
    if (updates.order !== undefined) task.order = Number(updates.order);
    if (updates.isActive !== undefined) task.isActive = Boolean(updates.isActive);
    if (updates.isEnabled !== undefined) task.isEnabled = Boolean(updates.isEnabled);

    await task.save();

    return res.json({
      success: true,
      message: 'Task updated successfully.',
      data: task
    });
  } catch (err) {
    console.error('updateTask error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────
// 9. DELETE /api/admin/syllabus/tasks/:taskId
// Deletes or soft-deletes a task
// ─────────────────────────────────────────────────────────
exports.deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await DomainTask.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const progressCount = await StudentDomainProgress.countDocuments({
      domainTaskId: taskId,
      status: { $in: ['in_progress', 'completed'] }
    });

    if (progressCount > 0) {
      // Soft-delete: mark inactive
      task.isActive = false;
      await task.save();
      return res.json({
        success: true,
        message: `Task has ${progressCount} student completions. It has been deactivated to preserve student learning records.`
      });
    }

    await DomainTask.findByIdAndDelete(taskId);

    return res.json({
      success: true,
      message: 'Task deleted successfully.'
    });
  } catch (err) {
    console.error('deleteTask error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────
// 10. PATCH /api/admin/syllabus/tasks/:taskId/reorder
// Moves task up or down in order
// ─────────────────────────────────────────────────────────
exports.reorderTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { direction } = req.body; // 'up' or 'down'

    const currentTask = await DomainTask.findById(taskId);
    if (!currentTask) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const moduleId = currentTask.moduleId;
    const tasksInModule = await DomainTask.find({ moduleId }).sort({ order: 1 });

    const currentIndex = tasksInModule.findIndex(t => t._id.toString() === taskId);
    if (currentIndex === -1) {
      return res.status(400).json({ success: false, message: 'Task not found in module.' });
    }

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= tasksInModule.length) {
      return res.json({ success: true, message: 'Task already at boundary order.', data: tasksInModule });
    }

    const targetTask = tasksInModule[targetIndex];

    // Swap orders
    const tempOrder = currentTask.order;
    currentTask.order = targetTask.order;
    targetTask.order = tempOrder;

    // In case they had identical orders, force distinct sequential values
    if (currentTask.order === targetTask.order) {
      currentTask.order = direction === 'up' ? targetTask.order - 1 : targetTask.order + 1;
    }

    await currentTask.save();
    await targetTask.save();

    const updatedTasks = await DomainTask.find({ moduleId }).sort({ order: 1 });

    return res.json({
      success: true,
      message: `Task moved ${direction} successfully.`,
      data: updatedTasks
    });
  } catch (err) {
    console.error('reorderTask error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────
// 11. PATCH /api/admin/syllabus/tasks/:taskId/toggle-status
// ─────────────────────────────────────────────────────────
exports.toggleTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await DomainTask.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    task.isActive = !task.isActive;
    await task.save();

    return res.json({
      success: true,
      message: `Task ${task.isActive ? 'activated' : 'deactivated'}.`,
      data: task
    });
  } catch (err) {
    console.error('toggleTaskStatus error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────
// 12. POST /api/admin/syllabus/upload-pdf
// Uploads PDF, parses syllabus, splits into modules, and
// automatically creates 10-15 tasks per module in DB!
// ─────────────────────────────────────────────────────────
exports.uploadSyllabusPdf = async (req, res) => {
  try {
    let rawText = req.body.text || '';

    // 1. Extract text from uploaded PDF file if present
    if (req.file) {
      const extracted = await extractTextFromPdf(req.file.buffer);
      if (extracted && extracted.trim()) {
        rawText = extracted;
      }
    }

    if (!rawText || !rawText.trim()) {
      return res.status(400).json({
        success: false,
        message: 'No syllabus content found. Please upload a PDF syllabus file or provide syllabus text.'
      });
    }

    const targetCourseId = req.body.courseId || null;
    const domainKey = (req.body.domain || 'java').toLowerCase().replace(/[^a-z0-9]/g, '');
    const courseTitle = req.body.courseTitle || DOMAIN_CONFIG[domainKey]?.title || `${domainKey.toUpperCase()} Course`;
    const tasksPerModule = Math.min(15, Math.max(10, parseInt(req.body.tasksPerModule, 10) || 12));
    const isNewCourse = req.body.isNewCourse === 'true' || req.body.isNewCourse === true;

    // 2. Ensure or Create Course
    let course;
    if (targetCourseId) {
      course = await Course.findById(targetCourseId);
    }

    if (!course && isNewCourse) {
      const slug = (req.body.slug || courseTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/^-|-$/g, '');
      course = await Course.findOne({ slug });
      if (!course) {
        course = await Course.create({
          title: courseTitle,
          slug,
          description: req.body.description || `Comprehensive syllabus training for ${courseTitle}.`,
          category: req.body.category || 'Software Development',
          level: req.body.level || 'All Levels',
          icon: req.body.icon || '📖',
          color: req.body.color || 'from-blue-600 to-indigo-600',
          durationWeeks: parseInt(req.body.durationWeeks, 10) || 12,
          totalHours: parseInt(req.body.totalHours, 10) || 120,
          isActive: true
        });
      }
    } else if (!course) {
      course = await ensureDomainCourse(domainKey, targetCourseId, courseTitle);
    }

    // 3. Intelligently split text into structured modules
    const parsedModules = splitTextIntoModules(rawText, domainKey);

    if (!parsedModules || parsedModules.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Could not detect structured modules from the syllabus. Please check the PDF document structure.'
      });
    }

    // 4. Save modules & auto-generate 10-15 tasks each
    const savedModules = [];
    let totalGeneratedTasks = 0;

    for (let i = 0; i < parsedModules.length; i++) {
      const pMod = parsedModules[i];
      const modOrder = i + 1;

      // Check if module already exists for this course & order
      let mod = await Module.findOne({
        courseId: course._id,
        order: modOrder
      });

      if (!mod) {
        mod = await Module.create({
          courseId: course._id,
          domain: domainKey,
          title: pMod.title,
          description: pMod.description,
          order: modOrder,
          isPublished: true
        });
      } else {
        mod.title = pMod.title;
        mod.description = pMod.description;
        mod.domain = domainKey;
        mod.isPublished = true;
        await mod.save();
      }

      // Check existing tasks for this module with student progress
      const existingTasks = await DomainTask.find({ moduleId: mod._id });
      const tasksWithProgress = await StudentDomainProgress.distinct('domainTaskId', {
        moduleId: mod._id,
        status: { $in: ['in_progress', 'completed'] }
      });
      const preserveTaskIds = new Set(tasksWithProgress.map(id => id.toString()));

      // Delete tasks that have no student progress so new syllabus tasks take effect
      const deletableTaskIds = existingTasks
        .filter(t => !preserveTaskIds.has(t._id.toString()))
        .map(t => t._id);

      if (deletableTaskIds.length > 0) {
        await DomainTask.deleteMany({ _id: { $in: deletableTaskIds } });
      }

      // Generate 10-15 tasks
      const taskBlueprints = generateTasksForModule(pMod, domainKey, tasksPerModule);

      const tasksToInsert = taskBlueprints.map((tb, j) => ({
        moduleId: mod._id,
        courseId: course._id,
        domain: domainKey,
        title: tb.title,
        description: tb.description,
        instructions: tb.instructions,
        expectedOutput: tb.expectedOutput,
        taskType: tb.taskType,
        difficulty: tb.difficulty,
        points: tb.points,
        estimatedTime: tb.estimatedTime,
        order: j + 1,
        isActive: true,
        isEnabled: true
      }));

      if (tasksToInsert.length > 0) {
        await DomainTask.insertMany(tasksToInsert);
        totalGeneratedTasks += tasksToInsert.length;
      }

      const count = await DomainTask.countDocuments({ moduleId: mod._id, isActive: true });
      savedModules.push({
        _id: mod._id,
        title: mod.title,
        description: mod.description,
        order: mod.order,
        tasksCount: count
      });
    }

    // 5. Cleanup / Archive old modules that are no longer part of the updated syllabus
    const activeModuleIds = new Set(savedModules.map(m => m._id.toString()));
    const existingDomainModules = await Module.find({
      $or: [{ courseId: course._id }, { domain: domainKey }]
    });

    for (const oldMod of existingDomainModules) {
      if (!activeModuleIds.has(oldMod._id.toString())) {
        const hasProgress = await StudentDomainProgress.countDocuments({
          moduleId: oldMod._id,
          status: { $in: ['in_progress', 'completed'] }
        });

        if (hasProgress > 0) {
          oldMod.isPublished = false;
          await oldMod.save();
          await DomainTask.updateMany({ moduleId: oldMod._id }, { $set: { isActive: false } });
        } else {
          await DomainTask.deleteMany({ moduleId: oldMod._id });
          await Module.findByIdAndDelete(oldMod._id);
        }
      }
    }

    // 6. Automatically extract clean topics & generate questions topic-by-topic
    // (1. Interview Arena, 2. Module Questions, 3. Mock Interview)
    let generationJobId = null;
    if (course && course._id) {
      try {
        course.syllabusText = rawText;
        await course.save();

        // Extract and assign clean topics to every module
        await extractCourseSyllabusTopics(course._id);

        const job = await SyllabusGenerationJob.create({
          courseId: course._id,
          domain: domainKey,
          courseTitle: course.title,
          status: 'generating',
          progress: 10,
          currentStep: 'Extracting syllabus topics and seeding separated question banks...'
        });
        generationJobId = job._id;

        // Run asynchronously in background so response completes immediately
        setImmediate(async () => {
          try {
            await generateAllSyllabusQuestionBanks(course._id, {
              onProgress: async (p) => {
                job.progress = Math.min(95, 10 + Math.round(p.percent * 0.85));
                job.currentStep = `Module ${p.moduleOrder}: ${p.moduleTitle} (${p.percent}%)`;
                await job.save().catch(() => {});
              }
            });

            job.status = 'completed';
            job.progress = 100;
            job.currentStep = 'All syllabus topics successfully covered across Interview Arena, Module, and Mock banks';
            await job.save().catch(() => {});
          } catch (bgErr) {
            console.error('Background syllabus question generation error:', bgErr);
            job.status = 'failed';
            job.currentStep = bgErr.message;
            await job.save().catch(() => {});
          }
        });
      } catch (genErr) {
        console.error('Initial auto-generation error:', genErr);
      }
    }

    return res.json({
      success: true,
      message: `Syllabus successfully parsed! Created ${savedModules.length} modules and ${totalGeneratedTasks} tasks. Question generation has started in the background.`,
      data: {
        domain: domainKey,
        courseId: course ? course._id : null,
        courseTitle: course ? course.title : courseTitle,
        totalModules: savedModules.length,
        totalGeneratedTasks,
        modules: savedModules,
        generationJobId
      }
    });
  } catch (err) {
    console.error('uploadSyllabusPdf error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────
// 13. GET /api/admin/syllabus/generation-status/:courseId
// Returns generation progress and stats across all 4 modules
// ─────────────────────────────────────────────────────────
exports.getGenerationStatus = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Handle overall platform question bank stats across all courses
    if (courseId === 'overall') {
      const [
        interviewArenaCount,
        gameHubCount,
        mockInterviewCount,
        testingPracticeCount,
        testedSolutionsCount,
        flaggedArena,
        flaggedGame,
        flaggedTask,
        totalModulesCount,
        totalCoursesCount
      ] = await Promise.all([
        InterviewQuestion.countDocuments({
          targetFeature: { $in: ['INTERVIEW_ARENA', 'interview'] },
          isActive: true
        }),
        Challenge.countDocuments({
          isActive: true
        }),
        InterviewQuestion.countDocuments({
          targetFeature: { $in: ['MOCK_INTERVIEW', 'mock'] },
          isActive: true
        }),
        DomainTask.countDocuments({
          isActive: true
        }),
        DomainTask.countDocuments({
          $or: [{ isTested: true }, { 'testingResult.passed': true }]
        }),
        InterviewQuestion.countDocuments({
          verificationStatus: 'flagged'
        }),
        Challenge.countDocuments({
          verificationStatus: 'flagged'
        }),
        DomainTask.countDocuments({
          verificationStatus: 'flagged'
        }),
        Module.countDocuments({
          isPublished: { $ne: false }
        }),
        Course.countDocuments({
          isActive: { $ne: false }
        })
      ]);

      const flaggedQuestionsCount = flaggedArena + flaggedGame + flaggedTask;
      const totalQuestions = interviewArenaCount + gameHubCount + mockInterviewCount + testingPracticeCount;

      return res.json({
        success: true,
        data: {
          courseId: 'overall',
          courseTitle: 'All Courses (Catalog Overall)',
          isOverall: true,
          job: {
            status: totalQuestions > 0 ? 'completed' : 'pending',
            progress: totalQuestions > 0 ? 100 : 0,
            currentStep: `Overall Question Bank across ${totalCoursesCount} Course(s) and ${totalModulesCount} Module(s).`
          },
          counts: {
            interviewArena: interviewArenaCount,
            gameHub: gameHubCount,
            mockInterview: mockInterviewCount,
            testingPractice: testingPracticeCount,
            total: totalQuestions,
            testedSolutions: testedSolutionsCount,
            flagged: flaggedQuestionsCount,
            totalModules: totalModulesCount,
            totalCourses: totalCoursesCount
          }
        }
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    const domainKey = normalizeDomainKey(course.slug || course.domain || course.title);
    let latestJob = await SyllabusGenerationJob.findOne({ courseId }).sort({ createdAt: -1 });

    // Auto-heal stale jobs (> 3 minutes without update)
    if (latestJob && latestJob.status === 'generating') {
      const msSinceLastUpdate = Date.now() - new Date(latestJob.updatedAt).getTime();
      if (msSinceLastUpdate > 180000) {
        latestJob.status = 'failed';
        latestJob.error = 'Generation stalled or server was restarted. Click Regenerate or Retry to resume.';
        await latestJob.save();
      }
    }

    // Parallel counts from collections
    const [
      interviewArenaCount,
      gameHubCount,
      mockInterviewCount,
      testingPracticeCount,
      testedSolutionsCount,
      flaggedArena,
      flaggedGame,
      flaggedTask,
      totalModulesCount
    ] = await Promise.all([
      InterviewQuestion.countDocuments({
        $or: [{ courseId: course._id }, { domain: domainKey }],
        targetFeature: 'INTERVIEW_ARENA',
        isActive: true
      }),
      Challenge.countDocuments({
        $or: [{ courseId: course._id }, { domain: domainKey }],
        targetFeature: 'GAME_HUB',
        isActive: true
      }),
      InterviewQuestion.countDocuments({
        $or: [{ courseId: course._id }, { domain: domainKey }],
        targetFeature: 'MOCK_INTERVIEW',
        isActive: true
      }),
      DomainTask.countDocuments({
        $or: [{ courseId: course._id }, { domain: domainKey }],
        isActive: true
      }),
      DomainTask.countDocuments({
        $or: [{ courseId: course._id }, { domain: domainKey }],
        isTested: true
      }),
      InterviewQuestion.countDocuments({
        $or: [{ courseId: course._id }, { domain: domainKey }],
        verificationStatus: 'flagged'
      }),
      Challenge.countDocuments({
        $or: [{ courseId: course._id }, { domain: domainKey }],
        verificationStatus: 'flagged'
      }),
      DomainTask.countDocuments({
        $or: [{ courseId: course._id }, { domain: domainKey }],
        verificationStatus: 'flagged'
      }),
      Module.countDocuments({
        $or: [{ courseId: course._id }, { domain: domainKey }],
        isPublished: { $ne: false }
      })
    ]);

    const flaggedQuestionsCount = flaggedArena + flaggedGame + flaggedTask;
    const totalQuestions = interviewArenaCount + gameHubCount + mockInterviewCount + testingPracticeCount;

    return res.json({
      success: true,
      data: {
        courseId: course._id,
        courseTitle: course.title,
        domain: domainKey,
        job: latestJob || {
          status: (interviewArenaCount > 0 || testingPracticeCount > 0) ? 'completed' : 'pending',
          progress: (interviewArenaCount > 0 || testingPracticeCount > 0) ? 100 : 0,
          currentStep: 'Idle'
        },
        counts: {
          interviewArena: interviewArenaCount,
          gameHub: gameHubCount,
          mockInterview: mockInterviewCount,
          testingPractice: testingPracticeCount,
          total: totalQuestions,
          testedSolutions: testedSolutionsCount,
          flagged: flaggedQuestionsCount,
          totalModules: totalModulesCount
        }
      }
    });
  } catch (err) {
    console.error('getGenerationStatus error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────
// 14. GET /api/admin/syllabus/course-questions/:courseId
// Returns questions generated per course, module and target feature
// ─────────────────────────────────────────────────────────
exports.getCourseQuestions = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { targetFeature, moduleId, verificationStatus, search } = req.query;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    const domainKey = (course.slug || course.title).toLowerCase().replace(/[^a-z0-9]/g, '');

    const queryFilter = {
      $or: [{ courseId: course._id }, { domain: domainKey }]
    };
    if (moduleId && mongoose.Types.ObjectId.isValid(moduleId)) {
      queryFilter.moduleId = moduleId;
    }
    if (verificationStatus && verificationStatus !== 'all') {
      queryFilter.verificationStatus = verificationStatus;
    }

    let interviewArenaList = [];
    let moduleQuestionsList = [];
    let gameHubList = [];
    let mockInterviewList = [];
    let testingPracticeList = [];

    // Filter by targetFeature if specified
    if (!targetFeature || targetFeature === 'all' || targetFeature === 'INTERVIEW_ARENA') {
      interviewArenaList = await InterviewQuestion.find({
        ...queryFilter,
        targetFeature: 'INTERVIEW_ARENA'
      }).populate('moduleId', 'title order').sort({ createdAt: -1 }).limit(100);
    }

    if (!targetFeature || targetFeature === 'all' || targetFeature === 'MODULE_QUESTIONS') {
      moduleQuestionsList = await InterviewQuestion.find({
        ...queryFilter,
        targetFeature: 'MODULE_QUESTIONS'
      }).populate('moduleId', 'title order').sort({ createdAt: -1 }).limit(100);
    }

    if (!targetFeature || targetFeature === 'all' || targetFeature === 'GAME_HUB') {
      gameHubList = await Challenge.find({
        ...queryFilter,
        targetFeature: 'GAME_HUB'
      }).populate('moduleId', 'title order').sort({ createdAt: -1 }).limit(100);
    }

    if (!targetFeature || targetFeature === 'all' || targetFeature === 'MOCK_INTERVIEW') {
      mockInterviewList = await InterviewQuestion.find({
        ...queryFilter,
        targetFeature: 'MOCK_INTERVIEW'
      }).populate('moduleId', 'title order').sort({ createdAt: -1 }).limit(100);
    }

    if (!targetFeature || targetFeature === 'all' || targetFeature === 'TESTING_PRACTICE') {
      testingPracticeList = await DomainTask.find({
        ...queryFilter
      }).populate('moduleId', 'title order').sort({ order: 1 }).limit(100);
    }

    return res.json({
      success: true,
      data: {
        course: { _id: course._id, title: course.title, domain: domainKey },
        interviewArena: interviewArenaList,
        moduleQuestions: moduleQuestionsList,
        gameHub: gameHubList,
        mockInterview: mockInterviewList,
        testingPractice: testingPracticeList
      }
    });
  } catch (err) {
    console.error('getCourseQuestions error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────
// 15. POST /api/admin/syllabus/generate-questions/:courseId
// Triggers automatic question generation for all 4 modules asynchronously
// ─────────────────────────────────────────────────────────
exports.triggerGenerateCourseQuestions = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { questionsPerTopic, forceRegenerate } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    const domainKey = normalizeDomainKey(course.slug || course.domain || course.title);

    // Look for an existing job
    let job = await SyllabusGenerationJob.findOne({ courseId }).sort({ createdAt: -1 });

    // If job was actively updated within last 20 seconds and marked generating, don't duplicate
    const isRecentlyActive = job && job.status === 'generating' && (Date.now() - new Date(job.updatedAt).getTime() < 20000);
    if (isRecentlyActive && !forceRegenerate) {
      return res.json({
        success: true,
        message: 'Question generation is currently running in background.',
        data: { jobId: job._id, status: 'generating', progress: job.progress }
      });
    }

    // Initialize or reset job document
    job = await SyllabusGenerationJob.create({
      courseId: course._id,
      domain: domainKey,
      courseTitle: course.title,
      status: 'generating',
      progress: 0,
      currentStep: 'Starting parallel generation for syllabus modules...',
      startedAt: new Date(),
      stats: {
        totalModules: 0,
        completedModules: 0,
        interviewArenaCount: 0,
        gameHubCount: 0,
        mockInterviewCount: 0,
        testingPracticeCount: 0,
        totalQuestions: 0,
        verifiedCount: 0,
        testedCount: 0,
        flaggedCount: 0,
        failedBatches: 0,
        remainingBatches: 0
      }
    });

    // Run syllabus-driven question generation pipeline in background
    setImmediate(async () => {
      try {
        await extractCourseSyllabusTopics(course._id);
        await generateAllSyllabusQuestionBanks(course._id, {
          onProgress: async (p) => {
            job.progress = Math.min(95, Math.round(p.percent));
            job.currentStep = `Module ${p.moduleOrder}: ${p.moduleTitle} (${p.percent}%)`;
            await job.save().catch(() => {});
          }
        });

        job.status = 'completed';
        job.progress = 100;
        job.currentStep = 'All syllabus topics successfully covered across Interview Arena, Module, and Mock banks';
        await job.save().catch(() => {});
      } catch (err) {
        console.error('[Background Generation Fatal Error]:', err);
        job.status = 'failed';
        job.currentStep = err.message;
        await job.save().catch(() => {});
      }
    });

    return res.json({
      success: true,
      message: `Automatic syllabus question generation initiated for ${course.title}. Processing Interview Arena, Module Questions, and Mock Interview banks.`,
      data: {
        jobId: job._id,
        status: 'generating',
        progress: 0
      }
    });
  } catch (err) {
    console.error('triggerGenerateCourseQuestions error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────
// 16. POST /api/admin/syllabus/regenerate-topic
// Regenerates questions for a specific topic without touching others
// ─────────────────────────────────────────────────────────
exports.regenerateTopic = async (req, res) => {
  try {
    const { courseId, moduleId, topic } = req.body;
    if (!courseId || !moduleId || !topic) {
      return res.status(400).json({ success: false, message: 'courseId, moduleId, and topic are required.' });
    }

    const result = await regenerateTopicQuestions({ courseId, moduleId, topic });

    return res.json({
      success: true,
      message: `Topic "${topic}" questions successfully regenerated across all 4 modules!`,
      data: result
    });
  } catch (err) {
    console.error('regenerateTopic error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────
// 17. POST /api/admin/syllabus/retry-generation/:jobId
// Retries a failed or stalled generation job
// ─────────────────────────────────────────────────────────
exports.retryGeneration = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await SyllabusGenerationJob.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    job.status = 'generating';
    job.progress = 5;
    job.currentStep = 'Resuming question generation in background...';
    await job.save();

    setImmediate(() => {
      generateSyllabusQuestions(job.courseId, { jobId: job._id, forceRegenerate: false }).catch(err => {
        console.error('[Retry Background Generation Error]:', err);
      });
    });

    return res.json({
      success: true,
      message: 'Generation job resumed in background.',
      data: { jobId: job._id, status: 'generating' }
    });
  } catch (err) {
    console.error('retryGeneration error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────
// 18. PUT /api/admin/syllabus/question/:type/:id
// Review and edit a question, its answer, or its explanation
// ─────────────────────────────────────────────────────────
exports.updateQuestion = async (req, res) => {
  try {
    const { type, id } = req.params;
    const { title, problemStatement, referenceSolution, explanation, difficulty, instructions, expectedOutput } = req.body;

    if (type === 'interview' || type === 'mock') {
      const q = await InterviewQuestion.findById(id);
      if (!q) return res.status(404).json({ success: false, message: 'Question not found.' });

      if (title !== undefined) q.title = title.trim();
      if (problemStatement !== undefined) q.problemStatement = problemStatement;
      if (referenceSolution !== undefined) q.referenceSolution = referenceSolution;
      if (explanation !== undefined) q.explanation = explanation;
      if (difficulty !== undefined) q.difficulty = difficulty;

      await q.save();
      return res.json({ success: true, message: 'Question updated successfully.', data: q });
    } else if (type === 'game') {
      const c = await Challenge.findById(id);
      if (!c) return res.status(404).json({ success: false, message: 'Challenge not found.' });

      if (title !== undefined) c.title = title.trim();
      if (instructions !== undefined) c.instructions = instructions;
      if (referenceSolution !== undefined) c.solutionCode = referenceSolution;
      if (expectedOutput !== undefined) c.expectedOutput = expectedOutput;
      if (explanation !== undefined) c.explanation = explanation;
      if (difficulty !== undefined) c.difficulty = difficulty;

      await c.save();
      return res.json({ success: true, message: 'Challenge updated successfully.', data: c });
    } else if (type === 'task' || type === 'testing') {
      const t = await DomainTask.findById(id);
      if (!t) return res.status(404).json({ success: false, message: 'Task not found.' });

      if (title !== undefined) t.title = title.trim();
      if (problemStatement !== undefined) t.problemStatement = problemStatement;
      if (referenceSolution !== undefined) t.referenceSolution = referenceSolution;
      if (expectedOutput !== undefined) t.expectedOutput = expectedOutput;
      if (explanation !== undefined) t.explanation = explanation;
      if (difficulty !== undefined) t.difficulty = difficulty;

      await t.save();
      return res.json({ success: true, message: 'Practice task updated successfully.', data: t });
    }

    return res.status(400).json({ success: false, message: 'Invalid question type specified.' });
  } catch (err) {
    console.error('updateQuestion error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────
// 19. PATCH /api/admin/syllabus/question/:type/:id/verification
// Approve, verify, or flag questions
// ─────────────────────────────────────────────────────────
exports.updateVerificationStatus = async (req, res) => {
  try {
    const { type, id } = req.params;
    const { status } = req.body; // 'verified' | 'tested' | 'flagged' | 'pending'

    if (!['verified', 'tested', 'flagged', 'pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid verification status.' });
    }

    let updatedDoc = null;
    if (type === 'interview' || type === 'mock') {
      updatedDoc = await InterviewQuestion.findByIdAndUpdate(id, { verificationStatus: status }, { new: true });
    } else if (type === 'game') {
      updatedDoc = await Challenge.findByIdAndUpdate(id, { verificationStatus: status }, { new: true });
    } else if (type === 'task' || type === 'testing') {
      updatedDoc = await DomainTask.findByIdAndUpdate(id, { verificationStatus: status }, { new: true });
    }

    if (!updatedDoc) {
      return res.status(404).json({ success: false, message: 'Record not found.' });
    }

    return res.json({
      success: true,
      message: `Status updated to "${status}".`,
      data: updatedDoc
    });
  } catch (err) {
    console.error('updateVerificationStatus error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────
// 20. POST /api/admin/syllabus/publish-questions/:courseId
// Publishes verified questions to students
// ─────────────────────────────────────────────────────────
exports.publishCourseQuestions = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    const domainKey = (course.slug || course.title).toLowerCase().replace(/[^a-z0-9]/g, '');

    // Activate all verified questions for this course/domain
    const qRes = await InterviewQuestion.updateMany(
      { $or: [{ courseId: course._id }, { domain: domainKey }], verificationStatus: { $ne: 'flagged' } },
      { $set: { isActive: true } }
    );

    const cRes = await Challenge.updateMany(
      { $or: [{ courseId: course._id }, { domain: domainKey }], verificationStatus: { $ne: 'flagged' } },
      { $set: { isActive: true } }
    );

    const tRes = await DomainTask.updateMany(
      { $or: [{ courseId: course._id }, { domain: domainKey }], verificationStatus: { $ne: 'flagged' } },
      { $set: { isActive: true, isEnabled: true } }
    );

    return res.json({
      success: true,
      message: `Successfully published all verified questions for ${course.title} to students!`,
      data: {
        interviewQuestionsPublished: qRes.modifiedCount,
        challengesPublished: cRes.modifiedCount,
        tasksPublished: tRes.modifiedCount
      }
    });
  } catch (err) {
    console.error('publishCourseQuestions error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────
// 21. GET /api/admin/syllabus/coverage-report
// Generates topic-by-topic syllabus coverage report across all 3 banks
// ─────────────────────────────────────────────────────────
exports.getSyllabusCoverageReport = async (req, res) => {
  try {
    const { courseId, domain } = req.query;
    const { generateSyllabusCoverageReport } = require('../services/syllabusQuestionSeederService');
    const report = await generateSyllabusCoverageReport(courseId, domain);
    return res.json({
      success: true,
      data: report
    });
  } catch (err) {
    console.error('getSyllabusCoverageReport error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────
// 22. POST /api/admin/syllabus/sync-coverage
// Syncs and generates missing questions for all syllabus topics across all 3 banks
// ─────────────────────────────────────────────────────────
exports.syncSyllabusCoverage = async (req, res) => {
  try {
    const { courseId } = req.body;
    const { generateAllSyllabusQuestionBanks, generateSyllabusCoverageReport } = require('../services/syllabusQuestionSeederService');

    let coursesToSync = [];
    if (courseId) {
      const c = await Course.findById(courseId);
      if (c) coursesToSync.push(c);
    } else {
      coursesToSync = await Course.find({ isActive: true });
    }

    const results = [];
    for (const c of coursesToSync) {
      const resData = await generateAllSyllabusQuestionBanks(c._id);
      results.push(resData);
    }

    const report = await generateSyllabusCoverageReport(courseId);

    return res.json({
      success: true,
      message: `Successfully synchronized syllabus questions across ${coursesToSync.length} course(s).`,
      data: {
        syncResults: results,
        report
      }
    });
  } catch (err) {
    console.error('syncSyllabusCoverage error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────
// 23. POST /api/admin/syllabus/generate-all-domains
// Triggers intelligent question generation across ALL domains dynamically from DB
// ─────────────────────────────────────────────────────────
exports.triggerGenerateAllDomains = async (req, res) => {
  try {
    const { forceRegenerate = false, questionsPerTopic = 2 } = req.body;
    const { generateAllDomainsGlobalSyllabusQuestions } = require('../services/syllabusQuestionGeneratorService');

    // Run asynchronously in background so client doesn't time out
    setImmediate(async () => {
      try {
        console.log('[triggerGenerateAllDomains] Background generation across ALL courses started...');
        const result = await generateAllDomainsGlobalSyllabusQuestions({
          forceRegenerate: Boolean(forceRegenerate),
          questionsPerTopic: Number(questionsPerTopic) || 2
        });
        console.log('[triggerGenerateAllDomains] Background multi-domain generation completed successfully:', result.totalCourses, 'courses processed.');
      } catch (err) {
        console.error('[triggerGenerateAllDomains] Background multi-domain generation error:', err);
      }
    });

    return res.status(202).json({
      success: true,
      message: 'Global domain-wise intelligent question generation initiated across all courses dynamically in the background.',
      status: 'initiated'
    });
  } catch (err) {
    console.error('triggerGenerateAllDomains error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
