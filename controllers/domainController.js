const StudentProfile = require('../models/StudentProfile');
const StudentDomainProgress = require('../models/StudentDomainProgress');
const StudentModuleStatus = require('../models/StudentModuleStatus');
const StudentInternship = require('../models/StudentInternship');
const DomainTask = require('../models/DomainTask');
const Module = require('../models/Module');
const Course = require('../models/Course');
const InterviewQuestion = require('../models/InterviewQuestion');
const InterviewTestCase = require('../models/InterviewTestCase');
const InterviewSubmission = require('../models/InterviewSubmission');
const { evaluateCode } = require('../services/interviewCodeRunner');
const { awardXp } = require('../services/xpEngine');
const { validateStudentLanguageAccess } = require('../utils/studentLanguageValidator');

// Domain code → slug mapping
const DOMAIN_CODES = {
  java: 'JA',
  python: 'PY',
  cpp: 'CPP',
  react: 'RE'
};

const DOMAIN_LABELS = {
  java: 'Java',
  python: 'Python',
  cpp: 'C++',
  react: 'React'
};

async function resolveCourseForStudent(profile, requestedCourseId, requestedDomain) {
  let course = null;

  // 1. If explicit requestedCourseId is supplied, prioritize it
  if (requestedCourseId) {
    course = await Course.findById(requestedCourseId);
    if (course) {
      const modCount = await Module.countDocuments({ courseId: course._id });
      if (modCount === 0) {
        const searchDomain = (course.slug || course.domain || '').toLowerCase();
        if (searchDomain) {
          const altCourse = await Course.findOne({
            _id: { $ne: course._id },
            $or: [
              { slug: searchDomain },
              { slug: new RegExp(`^${searchDomain}$`, 'i') },
              { title: new RegExp(`^${searchDomain}$`, 'i') }
            ]
          });
          if (altCourse) {
            const altMods = await Module.countDocuments({ courseId: altCourse._id });
            if (altMods > 0) {
              course = altCourse;
            }
          }
        }
      }
    }
  }

  // 2. Student's official enrolledCourseId from profile is the primary source of truth
  if (!course && profile?.enrolledCourseId) {
    const cId = profile.enrolledCourseId._id || profile.enrolledCourseId;
    course = await Course.findById(cId);
  }

  // 3. Fallback to requestedDomain or profile.domain ONLY if no enrolledCourseId exists
  if (!course && (requestedDomain || profile?.domain)) {
    const targetDomain = (requestedDomain || profile?.domain || '').toLowerCase().trim();
    if (targetDomain) {
      const candidateCourses = await Course.find({
        $or: [
          { slug: targetDomain },
          { slug: new RegExp(`^${targetDomain}$`, 'i') },
          { title: new RegExp(`^${targetDomain}$`, 'i') },
          { domain: targetDomain }
        ]
      });

      if (candidateCourses && candidateCourses.length > 0) {
        for (const cand of candidateCourses) {
          const cMods = await Module.countDocuments({ courseId: cand._id });
          if (cMods > 0) {
            course = cand;
            break;
          }
        }
        if (!course) course = candidateCourses[0];
      }
    }
  }

  // 4. Default active course
  if (!course) {
    course = await Course.findOne({ isActive: true }).sort({ createdAt: -1 });
  }

  if (!course) {
    course = await Course.findOne().sort({ createdAt: -1 });
  }

  // Keep student profile enrolledCourseId and domain in strict sync
  if (course && profile) {
    const courseSlug = (course.slug || course.title || 'general').toLowerCase().trim();
    const currentCourseIdStr = profile.enrolledCourseId?._id?.toString() || profile.enrolledCourseId?.toString();
    const needsCourseUpdate = !currentCourseIdStr || currentCourseIdStr !== course._id.toString();
    const needsDomainUpdate = profile.domain !== courseSlug;

    if (needsCourseUpdate || needsDomainUpdate) {
      profile.enrolledCourseId = course._id;
      profile.domain = courseSlug;
      await StudentProfile.updateOne(
        { _id: profile._id },
        { $set: { enrolledCourseId: course._id, domain: courseSlug } }
      ).catch(() => {});
    }
  }

  return course;
}

async function resolveCourseModules(course) {
  if (!course) return [];

  // Strictly query modules assigned to this specific course ID
  let modules = await Module.find({
    courseId: course._id,
    isPublished: { $ne: false }
  }).sort({ order: 1 });

  // Fallback: If 0 modules have courseId set, match strictly on this course's own slug/domain
  if (!modules || modules.length === 0) {
    const courseDomain = (course.slug || course.domain || '').toLowerCase().trim();
    if (courseDomain) {
      modules = await Module.find({
        domain: courseDomain,
        isPublished: { $ne: false }
      }).sort({ order: 1 });
    }
  }

  return modules || [];
}

// ─────────────────────────────────────────────
// GET /api/domain/my
// Returns student's assigned domain + course info (or requested completed course)
// ─────────────────────────────────────────────
exports.getMyDomain = async (req, res) => {
  try {
    let profile = await StudentProfile.findOne({ userId: req.user._id })
      .populate('enrolledCourseId', 'title slug description icon color durationWeeks totalHours')
      .populate('assignedTutorId', 'name email phone avatar')
      .populate('batchId', 'name code batchType startDate endDate startTime endTime trainerId')
      .populate('previousCourses.courseId', 'title slug description icon color durationWeeks totalHours');

    if (!profile) {
      profile = await StudentProfile.create({ userId: req.user._id });
    }

    const requestedDomain = req.query.domain;
    const requestedCourseId = req.query.courseId;

    let activeCourse = profile.enrolledCourseId || null;
    let isCompletedCourse = false;
    let completedInfo = null;

    if (requestedDomain || requestedCourseId) {
      const prev = profile.previousCourses?.find(p => {
        const pId = p.courseId?._id?.toString() || p.courseId?.toString();
        if (requestedCourseId && pId === requestedCourseId) return true;
        if (requestedDomain && p.domain === requestedDomain) return true;
        return false;
      });

      if (prev) {
        activeCourse = prev.courseId;
        isCompletedCourse = true;
        completedInfo = {
          completedAt: prev.completedAt,
          finalPoints: prev.finalPoints || 350,
          finalProgress: 100
        };
      } else if (requestedCourseId) {
        const c = await Course.findById(requestedCourseId);
        if (c) activeCourse = c;
      }
    }

    if (!activeCourse && !isCompletedCourse) {
      activeCourse = await resolveCourseForStudent(profile, requestedCourseId, requestedDomain);
    }

    const activeDomain = (activeCourse?.slug || activeCourse?.domain || profile.domain || 'general').toLowerCase().trim();

    // Keep profile.domain synchronized with the student's assigned course
    if (!isCompletedCourse && activeCourse && profile.domain !== activeDomain) {
      profile.domain = activeDomain;
      await StudentProfile.updateOne({ _id: profile._id }, { $set: { domain: activeDomain } }).catch(() => {});
    }

    const internships = await StudentInternship.find({ studentId: req.user._id })
      .populate('internshipId');

    const hasBatch = Boolean(profile.batchId && profile.batchId.name);

    return res.json({
      success: true,
      data: {
        domain: activeDomain,
        domainLabel: DOMAIN_LABELS[activeDomain] || activeCourse?.title || activeDomain,
        domainCode: DOMAIN_CODES[activeDomain] || '',
        course: activeCourse,
        batch: profile.batchId || null,
        batchName: hasBatch ? profile.batchId.name : null,
        batchCode: hasBatch ? profile.batchId.code : null,
        hasBatch,
        isIndividual: !hasBatch,
        tutor: profile.assignedTutorId,
        studentId: profile.studentId,
        totalXp: profile.totalXp,
        currentLevel: profile.currentLevel,
        isCompletedCourse,
        completedInfo,
        currentEnrolledCourse: profile.enrolledCourseId || activeCourse,
        currentDomain: activeDomain,
        previousCourses: profile.previousCourses || [],
        internships: internships || []
      }
    });
  } catch (err) {
    console.error('getMyDomain error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// GET /api/domain/analytics
// Returns domain analytics for current or completed course
// ─────────────────────────────────────────────
exports.getDomainAnalytics = async (req, res) => {
  try {
    let profile = await StudentProfile.findOne({ userId: req.user._id })
      .populate('enrolledCourseId')
      .populate('previousCourses.courseId');
    if (!profile) {
      profile = await StudentProfile.create({ userId: req.user._id });
    }

    const requestedDomain = req.query.domain;
    const requestedCourseId = req.query.courseId;

    let isCompleted = false;
    let completedItem = null;
    let activeCourse = profile.enrolledCourseId || null;

    if (requestedDomain || requestedCourseId) {
      const prev = profile.previousCourses?.find(p => {
        const pId = p.courseId?._id?.toString() || p.courseId?.toString();
        if (requestedCourseId && pId === requestedCourseId) return true;
        if (requestedDomain && p.domain === requestedDomain) return true;
        return false;
      });
      if (prev) {
        activeCourse = prev.courseId?._id ? prev.courseId : await Course.findById(prev.courseId);
        isCompleted = true;
        completedItem = prev;
      } else if (requestedCourseId) {
        const c = await Course.findById(requestedCourseId);
        if (c) activeCourse = c;
      }
    }

    if (!activeCourse) {
      activeCourse = await resolveCourseForStudent(profile, requestedCourseId, requestedDomain);
    }

    const domain = (activeCourse?.slug || activeCourse?.domain || profile.domain || 'general').toLowerCase().trim();

    // Strictly resolve modules for this specific course
    const modules = await resolveCourseModules(activeCourse);
    const moduleIds = modules.map(m => m._id);

    // Total domain tasks strictly for this course/modules
    let totalTasks = await DomainTask.countDocuments({
      $or: [
        { moduleId: { $in: moduleIds } },
        ...(activeCourse ? [{ courseId: activeCourse._id }] : [])
      ],
      isActive: true
    });

    // Student's completed tasks strictly for this course/modules
    let completedTasks = await StudentDomainProgress.countDocuments({
      studentId: req.user._id,
      status: 'completed',
      $or: [
        { moduleId: { $in: moduleIds } },
        ...(activeCourse ? [{ courseId: activeCourse._id }] : [])
      ]
    });

    let inProgressTasks = await StudentDomainProgress.countDocuments({
      studentId: req.user._id,
      status: 'in_progress',
      $or: [
        { moduleId: { $in: moduleIds } },
        ...(activeCourse ? [{ courseId: activeCourse._id }] : [])
      ]
    });

    // Total points earned strictly for this course/modules
    let totalPoints = 0;
    const pointsAgg = await StudentDomainProgress.aggregate([
      {
        $match: {
          studentId: req.user._id,
          status: 'completed',
          $or: [
            { moduleId: { $in: moduleIds } },
            ...(activeCourse ? [{ courseId: activeCourse._id }] : [])
          ]
        }
      },
      { $group: { _id: null, total: { $sum: '$pointsEarned' } } }
    ]);
    totalPoints = pointsAgg[0]?.total || 0;

    let syllabusProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    if (isCompleted) {
      syllabusProgress = 100;
      completedTasks = totalTasks;
      totalPoints = Math.max(totalPoints, completedItem?.finalPoints || 0, totalTasks * 10);
      inProgressTasks = 0;
    }

    const statuses = await StudentModuleStatus.find({ studentId: req.user._id });
    const statusMap = {};
    statuses.forEach(s => { statusMap[s.moduleId.toString()] = s.status; });

    const moduleStats = await Promise.all(modules.map(async (mod) => {
      const modTotal = await DomainTask.countDocuments({ moduleId: mod._id, isActive: true });
      let modCompleted = await StudentDomainProgress.countDocuments({
        studentId: req.user._id,
        moduleId: mod._id,
        status: 'completed'
      });
      if (isCompleted) {
        modCompleted = modTotal;
      }
      const defaultStatus = mod.order === 1 ? 'processing' : 'not_started';
      const mStatus = isCompleted ? 'completed' : (statusMap[mod._id.toString()] || defaultStatus);
      return {
        moduleId: mod._id,
        title: mod.title,
        description: mod.description,
        order: mod.order,
        totalTasks: modTotal,
        completedTasks: modCompleted,
        status: mStatus,
        isLocked: mStatus === 'not_started',
        progress: isCompleted ? 100 : (modTotal > 0 ? Math.round((modCompleted / modTotal) * 100) : 0)
      };
    }));

    return res.json({
      success: true,
      data: {
        domain,
        domainLabel: DOMAIN_LABELS[domain] || activeCourse?.title || domain,
        course: activeCourse ? { _id: activeCourse._id, title: activeCourse.title, slug: activeCourse.slug, description: activeCourse.description, durationWeeks: activeCourse.durationWeeks } : null,
        totalTasks,
        completedTasks: isCompleted ? totalTasks : completedTasks,
        inProgressTasks: isCompleted ? 0 : inProgressTasks,
        lockedTasks: isCompleted ? 0 : Math.max(0, totalTasks - completedTasks - inProgressTasks),
        totalPoints,
        syllabusProgress: isCompleted ? 100 : syllabusProgress,
        overallProgress: isCompleted ? 100 : syllabusProgress,
        isCompletedCourse: isCompleted,
        completedInfo: completedItem ? {
          completedAt: completedItem.completedAt,
          finalPoints: totalPoints,
          finalProgress: 100
        } : null,
        moduleStats
      }
    });
  } catch (err) {
    console.error('getDomainAnalytics error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// GET /api/domain/modules
// Returns all modules for the current or requested domain course
// ─────────────────────────────────────────────
exports.getModules = async (req, res) => {
  try {
    let profile = await StudentProfile.findOne({ userId: req.user._id })
      .populate('enrolledCourseId')
      .populate('previousCourses.courseId');
    if (!profile) {
      profile = await StudentProfile.create({ userId: req.user._id });
    }

    const requestedDomain = req.query.domain;
    const requestedCourseId = req.query.courseId;

    let activeCourse = profile.enrolledCourseId || null;
    let isCompletedCourse = false;

    if (requestedDomain || requestedCourseId) {
      const prev = profile.previousCourses?.find(p => {
        const pId = p.courseId?._id?.toString() || p.courseId?.toString();
        if (requestedCourseId && pId === requestedCourseId) return true;
        if (requestedDomain && p.domain === requestedDomain) return true;
        return false;
      });
      if (prev) {
        activeCourse = prev.courseId?._id ? prev.courseId : await Course.findById(prev.courseId);
        isCompletedCourse = true;
      } else if (requestedCourseId) {
        const c = await Course.findById(requestedCourseId);
        if (c) activeCourse = c;
      }
    }

    if (!activeCourse) {
      activeCourse = await resolveCourseForStudent(profile, requestedCourseId, requestedDomain);
    }

    const modules = await resolveCourseModules(activeCourse);

    const statuses = await StudentModuleStatus.find({ studentId: req.user._id });
    const statusMap = {};
    statuses.forEach(s => { statusMap[s.moduleId.toString()] = s.status; });

    const modulesWithStatus = modules.map(mod => {
      const m = mod.toObject ? mod.toObject() : { ...mod };
      if (isCompletedCourse) {
        m.status = 'completed';
        m.isLocked = false;
      } else {
        const defaultStatus = mod.order === 1 ? 'processing' : 'not_started';
        const s = statusMap[mod._id.toString()] || defaultStatus;
        m.status = s;
        m.isLocked = (s === 'not_started');
      }
      return m;
    });

    return res.json({ success: true, data: modulesWithStatus });
  } catch (err) {
    console.error('getModules error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// GET /api/domain/modules/:moduleId/tasks
// Returns tasks for a module with student's progress status
// ─────────────────────────────────────────────
exports.getModuleTasks = async (req, res) => {
  try {
    const { moduleId } = req.params;
    let profile = await StudentProfile.findOne({ userId: req.user._id })
      .populate('previousCourses.courseId');
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found.' });
    }

    let tasks = await DomainTask.find({ moduleId, isActive: true }).sort({ order: 1 });
    const mod = await Module.findById(moduleId);

    if ((!tasks || tasks.length === 0) && mod) {
      const defaultTasks = [
        { order: 1, title: `Task 1: ${mod.title} Overview & Setup`, diff: 'Easy', pts: 10, input: 'Start', output: 'Initialized' },
        { order: 2, title: `Task 2: ${mod.title} Core Operations`, diff: 'Easy', pts: 10, input: '10 20', output: '30' },
        { order: 3, title: `Task 3: ${mod.title} Practical Implementation`, diff: 'Medium', pts: 15, input: 'Sample', output: 'Processed Sample' }
      ];
      for (const tData of defaultTasks) {
        await DomainTask.create({
          moduleId: mod._id,
          courseId: mod.courseId || mod._id,
          domain: mod.domain,
          title: tData.title,
          description: `Practical exercise for ${mod.title}.`,
          sampleInput: tData.input,
          sampleOutput: tData.output,
          expectedOutput: tData.output,
          difficulty: tData.diff,
          points: tData.pts,
          order: tData.order,
          isEnabled: true,
          isActive: true,
          testCases: [{ input: tData.input, expectedOutput: tData.output, isHidden: false }]
        });
      }
      tasks = await DomainTask.find({ moduleId, isActive: true }).sort({ order: 1 });
    }

    const isCompletedCourse = profile.previousCourses?.some(p => {
      const pCourseId = p.courseId?._id?.toString() || p.courseId?.toString();
      const mCourseId = mod?.courseId?.toString();
      return (pCourseId && mCourseId && pCourseId === mCourseId) || (p.domain && mod?.domain && p.domain === mod.domain);
    });

    const modStatusDoc = await StudentModuleStatus.findOne({ studentId: req.user._id, moduleId });
    const modStatus = isCompletedCourse ? 'completed' : (modStatusDoc?.status || (mod?.order === 1 ? 'processing' : 'not_started'));
    const isModuleLocked = (modStatus === 'not_started');

    const progressRecords = await StudentDomainProgress.find({
      studentId: req.user._id,
      moduleId
    });

    const progressMap = {};
    progressRecords.forEach(p => { progressMap[p.taskId?.toString() || p.domainTaskId?.toString()] = p; });

    const tasksWithStatus = tasks.map(task => {
      const progress = progressMap[task._id.toString()];
      let status = 'locked';
      if (isCompletedCourse) {
        status = 'completed';
      } else if (isModuleLocked) {
        status = 'locked';
      } else {
        status = progress?.status || 'available';
      }

      return {
        _id: task._id,
        moduleId: task.moduleId,
        courseId: task.courseId,
        domain: task.domain,
        title: task.title,
        description: task.description,
        instructions: task.instructions || task.description,
        problemStatement: task.problemStatement || task.description,
        inputFormat: task.inputFormat || task.inputDescription || '',
        outputFormat: task.outputFormat || '',
        constraints: task.constraints || 'Standard memory 256MB. Execution <= 2000ms.',
        sampleInput: task.sampleInput || '',
        sampleOutput: task.sampleOutput || '',
        sampleInput2: task.sampleInput2 || '',
        sampleOutput2: task.sampleOutput2 || '',
        expectedOutput: task.expectedOutput || '',
        explanation: task.explanation || '',
        starterCode: task.starterCode || (task.domain === 'python'
          ? `# Write your Python code here\n`
          : task.domain === 'cpp'
          ? `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    return 0;\n}`
          : task.domain === 'react' || task.domain === 'javascript'
          ? `function solution() {\n    // Write your code here\n}`
          : `public class Main {\n    public static void main(String[] args) {\n        // Write your code here\n    }\n}`),
        timeLimit: task.timeLimit || 2000,
        difficulty: task.difficulty || 'Easy',
        points: task.points || 10,
        taskType: task.taskType || 'coding',
        order: task.order,
        isEnabled: !isModuleLocked,
        status,
        submittedCode: progress?.submittedCode || '',
        testCases: (task.testCases || []).map(tc => ({
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          isHidden: false,
          explanation: tc.explanation || ''
        })),
        progress: progress || (isCompletedCourse ? { status: 'completed' } : null)
      };
    });

    return res.json({
      success: true,
      data: tasksWithStatus,
      moduleStatus: modStatus,
      isLocked: isModuleLocked
    });
  } catch (err) {
    console.error('getModuleTasks error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};


// ─────────────────────────────────────────────
// POST /api/domain/tasks/:taskId/start
// Student starts a task (available → in_progress)
// ─────────────────────────────────────────────
exports.startTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await DomainTask.findById(taskId);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    // Check if parent module is unlocked for this student
    const modStatusDoc = await StudentModuleStatus.findOne({ studentId: req.user._id, moduleId: task.moduleId });
    const modStatus = modStatusDoc?.status || 'not_started';
    if (modStatus === 'not_started') {
      return res.status(403).json({ success: false, message: 'This module is locked by your tutor. Wait for your tutor to start this module.' });
    }

    if (!task.isEnabled) return res.status(403).json({ success: false, message: 'Task is locked. Wait for your tutor to enable it.' });

    let progress = await StudentDomainProgress.findOne({ studentId: req.user._id, domainTaskId: taskId });
    if (!progress) {
      progress = await StudentDomainProgress.create({
        studentId: req.user._id,
        domainTaskId: taskId,
        moduleId: task.moduleId,
        courseId: task.courseId,
        domain: task.domain,
        status: 'in_progress',
        startedAt: new Date()
      });
    } else if (progress.status === 'available') {
      progress.status = 'in_progress';
      progress.startedAt = new Date();
      await progress.save();
    }

    return res.json({ success: true, data: progress });
  } catch (err) {
    console.error('startTask error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// POST /api/domain/tasks/:taskId/run
// Student runs code against visible test cases
// ─────────────────────────────────────────────
exports.runTaskCode = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { code, language } = req.body;

    const task = await DomainTask.findById(taskId);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    // STRICT BACKEND SECURITY VALIDATION: Check if student has access to this language
    const langToValidate = language || task.domain;
    const isAllowed = await validateStudentLanguageAccess(req.user, langToValidate);
    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        message: `You are not authorized to run code in ${langToValidate.toUpperCase()}. Please complete the corresponding course domain first.`
      });
    }

    // Check module lock
    const modStatusDoc = await StudentModuleStatus.findOne({ studentId: req.user._id, moduleId: task.moduleId });
    const modStatus = modStatusDoc?.status || 'not_started';
    if (modStatus === 'not_started') {
      return res.status(403).json({ success: false, message: 'This module is locked by your tutor. Wait for your tutor to start this module.' });
    }

    let testCasesToRun = (task.testCases && task.testCases.length > 0)
      ? task.testCases
      : [];

    if (testCasesToRun.length === 0) {
      testCasesToRun = [{
        input: task.sampleInput || '',
        expectedOutput: task.sampleOutput || task.expectedOutput || '',
        isHidden: false
      }];
    }

    const { evaluatePracticalCode } = require('../services/practicalCodeRunner');
    const result = await evaluatePracticalCode({
      code,
      language: language || task.domain,
      domain: task.domain,
      testCases: testCasesToRun
    });

    // Save student's active code and test results in progress
    await StudentDomainProgress.findOneAndUpdate(
      { studentId: req.user._id, domainTaskId: taskId },
      {
        $set: {
          submittedCode: code,
          language: language || task.domain,
          lastRunResults: result.testResults || []
        },
        $setOnInsert: {
          studentId: req.user._id,
          domainTaskId: taskId,
          moduleId: task.moduleId,
          courseId: task.courseId,
          domain: task.domain,
          status: 'in_progress',
          startedAt: new Date()
        }
      },
      { upsert: true }
    );

    return res.json({
      success: true,
      ...result
    });
  } catch (err) {
    console.error('runTaskCode error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// POST /api/domain/tasks/:taskId/submit
// Student submits practical code solution
// ─────────────────────────────────────────────
exports.submitTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { code, language, textAnswer, githubUrl, fileUrl } = req.body;

    const task = await DomainTask.findById(taskId);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    // STRICT BACKEND SECURITY VALIDATION: Check if student has access to this language
    const langToValidate = language || task.domain;
    const isAllowed = await validateStudentLanguageAccess(req.user, langToValidate);
    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        message: `You are not authorized to submit code in ${langToValidate.toUpperCase()}. Please complete the corresponding course domain first.`
      });
    }

    // Check module lock
    const modStatusDoc = await StudentModuleStatus.findOne({ studentId: req.user._id, moduleId: task.moduleId });
    const modStatus = modStatusDoc?.status || 'not_started';
    if (modStatus === 'not_started') {
      return res.status(403).json({ success: false, message: 'This module is locked by your tutor.' });
    }

    let progress = await StudentDomainProgress.findOne({ studentId: req.user._id, domainTaskId: taskId });
    if (!progress) {
      progress = new StudentDomainProgress({
        studentId: req.user._id,
        domainTaskId: taskId,
        moduleId: task.moduleId,
        courseId: task.courseId,
        domain: task.domain,
        status: 'in_progress'
      });
    }

    progress.attemptCount = (progress.attemptCount || 0) + 1;

    let evaluation = null;
    let earnedPoints = 0;
    let isCompleted = false;

    if (code && typeof code === 'string') {
      const allTestCases = (task.testCases && task.testCases.length > 0)
        ? task.testCases
        : [{ input: task.sampleInput || '', expectedOutput: task.sampleOutput || task.expectedOutput || '', isHidden: false }];

      const { evaluatePracticalCode } = require('../services/practicalCodeRunner');
      evaluation = await evaluatePracticalCode({
        code,
        language: language || task.domain,
        domain: task.domain,
        testCases: allTestCases
      });

      progress.submittedCode = code;
      progress.language = language || task.domain;
      progress.testCasesPassed = evaluation.passedTests;
      progress.totalTestCases = evaluation.totalTests;

      if (evaluation.allPassed) {
        isCompleted = true;
        earnedPoints = task.points;
      }
    } else {
      isCompleted = true;
      earnedPoints = task.points;
    }

    const wasAlreadyCompleted = progress.status === 'completed';

    if (isCompleted) {
      progress.status = 'completed';
      progress.completedAt = new Date();
      progress.pointsEarned = earnedPoints;
      if (!wasAlreadyCompleted && earnedPoints > 0) {
        await StudentProfile.findOneAndUpdate(
          { userId: req.user._id },
          { $inc: { totalXp: earnedPoints } }
        );
      }
    } else {
      progress.status = 'in_progress';
    }

    progress.submission = {
      textAnswer: textAnswer || '',
      githubUrl: githubUrl || '',
      fileUrl: fileUrl || '',
      submittedAt: new Date()
    };

    if (!progress.submissions) progress.submissions = [];
    progress.submissions.push({
      code: code || '',
      language: language || task.domain,
      score: earnedPoints,
      testCasesPassed: evaluation ? evaluation.passedTests : 0,
      totalTestCases: evaluation ? evaluation.totalTests : 0,
      status: isCompleted ? 'passed' : 'failed',
      submittedAt: new Date(),
      testResults: evaluation?.testResults || []
    });

    await progress.save();

    return res.json({
      success: true,
      message: isCompleted ? 'Challenge passed! Full points awarded.' : 'Some test cases failed. Please review your logic and try again.',
      data: {
        status: progress.status,
        pointsEarned: progress.pointsEarned,
        allPassed: isCompleted,
        attemptCount: progress.attemptCount,
        evaluation
      }
    });
  } catch (err) {
    console.error('submitTask error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// GET /api/domain/modules/:moduleId/questions
// Dedicated Module Practice Questions
// ─────────────────────────────────────────────
exports.getModuleQuestions = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const mod = await Module.findById(moduleId);
    if (!mod) {
      return res.status(404).json({ success: false, message: 'Module not found.' });
    }

    const questions = await InterviewQuestion.find({
      moduleId: mod._id,
      $or: [
        { targetFeature: 'MODULE_QUESTIONS' },
        { targetFeature: 'MODULE' },
        { questionBankType: 'MODULE' }
      ],
      isActive: true
    }).sort({ questionNumber: 1 });

    const studentId = req.user._id;

    // Fetch test cases for these questions (visible only)
    const qIds = questions.map(q => q._id);
    const visibleCases = await InterviewTestCase.find({
      questionId: { $in: qIds },
      isHidden: false
    }).select('questionId input expectedOutput explanation');

    const casesMap = {};
    visibleCases.forEach(tc => {
      const qId = tc.questionId.toString();
      if (!casesMap[qId]) casesMap[qId] = [];
      casesMap[qId].push(tc);
    });

    // Check solved status
    const submissions = await InterviewSubmission.find({
      studentId,
      questionId: { $in: qIds }
    }).sort({ createdAt: -1 });

    const submissionMap = {};
    submissions.forEach(sub => {
      const qId = sub.questionId.toString();
      if (!submissionMap[qId]) {
        submissionMap[qId] = sub;
      }
    });

    const enriched = questions.map(q => {
      const lastSub = submissionMap[q._id.toString()];
      const isSolved = lastSub && (lastSub.status === 'Accepted' || lastSub.status === 'PASSED');
      return {
        _id: q._id,
        questionNumber: q.questionNumber,
        title: q.title,
        domain: q.domain,
        topic: q.topic,
        difficulty: q.difficulty,
        questionType: q.questionType || 'coding',
        problemStatement: q.problemStatement,
        inputFormat: q.inputFormat,
        outputFormat: q.outputFormat,
        constraints: q.constraints,
        examples: q.examples || [],
        starterCode: q.starterCode || {},
        hints: q.hints || [],
        xp: q.xp || 20,
        isSolved: !!isSolved,
        lastVerdict: lastSub ? lastSub.status : null,
        visibleTestCases: casesMap[q._id.toString()] || []
      };
    });

    return res.json({
      success: true,
      module: {
        _id: mod._id,
        title: mod.title,
        order: mod.order,
        domain: mod.domain,
        courseId: mod.courseId
      },
      questions: enriched
    });
  } catch (err) {
    console.error('getModuleQuestions error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// POST /api/domain/questions/:questionId/run
// Run Module Question against visible test cases
// ─────────────────────────────────────────────
exports.runModuleQuestionCode = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { code, language, customInput } = req.body;

    const question = await InterviewQuestion.findById(questionId);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found.' });
    }

    let testCasesToRun = [];
    if (customInput !== undefined && customInput !== null && customInput.trim() !== '') {
      testCasesToRun = [{
        input: customInput.trim(),
        expectedOutput: '',
        isHidden: false
      }];
    } else {
      testCasesToRun = await InterviewTestCase.find({
        questionId: question._id,
        isHidden: false
      }).select('input expectedOutput');
    }

    const runResult = await evaluateCode({
      language: language || 'javascript',
      code,
      testCases: testCasesToRun,
      isSubmit: false
    });

    return res.json({
      success: true,
      data: runResult
    });
  } catch (err) {
    console.error('runModuleQuestionCode error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// POST /api/domain/questions/:questionId/submit
// Submit Module Question (Coding or Conceptual)
// ─────────────────────────────────────────────
exports.submitModuleQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { code, answer, language } = req.body;
    const studentId = req.user._id;

    const question = await InterviewQuestion.findById(questionId);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found.' });
    }

    const isCoding = (question.questionType || 'coding') === 'coding';
    let verdict = 'Wrong Answer';
    let allPassed = false;
    let evalResult = null;
    let xpAwarded = 0;

    if (isCoding) {
      const allTestCases = await InterviewTestCase.find({ questionId: question._id });
      evalResult = await evaluateCode({
        code: code || '',
        language: language || 'javascript',
        testCases: allTestCases,
        isSubmit: true
      });

      allPassed = evalResult.allPassed;
      verdict = evalResult.verdict || (allPassed ? 'Accepted' : 'Wrong Answer');
    } else {
      // Conceptual / Scenario question rubric evaluation
      const userText = (answer || code || '').trim();
      const minWords = 10;
      const wordCount = userText.split(/\s+/).filter(Boolean).length;

      if (wordCount >= minWords) {
        allPassed = true;
        verdict = 'Accepted';
      } else {
        allPassed = false;
        verdict = 'Needs Improvement';
      }

      evalResult = {
        allPassed,
        verdict,
        status: allPassed ? 'SUCCESS' : 'FAILED',
        passedTests: allPassed ? 1 : 0,
        totalTests: 1,
        executionTimeMs: 0,
        testResults: [
          {
            caseNumber: 1,
            passed: allPassed,
            status: allPassed ? 'PASSED' : 'FAILED',
            error: allPassed ? null : `Answer too brief (${wordCount} words). Minimum ${minWords} words required.`
          }
        ]
      };
    }

    if (allPassed) {
      const alreadySolved = await InterviewSubmission.findOne({
        studentId,
        questionId: question._id,
        status: { $in: ['Accepted', 'PASSED'] }
      });

      if (!alreadySolved) {
        xpAwarded = question.xp || 20;
        await awardXp(
          studentId,
          xpAwarded,
          'module_question_solved',
          question._id,
          'InterviewQuestion',
          `Solved Module Practice Q${question.questionNumber}: ${question.title}`
        );
      }
    }

    const submission = await InterviewSubmission.create({
      studentId,
      questionId: question._id,
      questionNumber: question.questionNumber,
      language: language || (isCoding ? 'javascript' : 'theory'),
      code: isCoding ? (code || '') : (answer || code || ''),
      status: verdict,
      passedTests: evalResult ? evalResult.passedTests : 0,
      totalTests: evalResult ? evalResult.totalTests : 0,
      testResults: evalResult ? evalResult.testResults : [],
      executionTimeMs: evalResult ? evalResult.executionTimeMs : 0,
      xpAwarded
    });

    const safeResults = evalResult && evalResult.testResults ? evalResult.testResults.map(tr => ({
      caseNumber: tr.caseNumber,
      passed: tr.passed,
      isHidden: tr.isHidden,
      input: tr.isHidden ? '[Hidden Test Case]' : tr.input,
      expected: tr.isHidden ? '[Hidden]' : tr.expected,
      actual: tr.isHidden ? (tr.passed ? '[Passed]' : '[Failed]') : tr.actual,
      error: tr.error
    })) : [];

    return res.json({
      success: true,
      verdict,
      allPassed,
      xpAwarded,
      data: {
        submissionId: submission._id,
        status: verdict,
        allPassed,
        passedTests: evalResult ? evalResult.passedTests : 0,
        totalTests: evalResult ? evalResult.totalTests : 0,
        executionTimeMs: evalResult ? evalResult.executionTimeMs : 0,
        testResults: safeResults
      }
    });
  } catch (err) {
    console.error('submitModuleQuestion error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
