const Project = require('../models/Project');
const ProjectTask = require('../models/ProjectTask');
const StudentProfile = require('../models/StudentProfile');
const { awardXp } = require('../services/xpEngine');
const xpRules = require('../config/xpRules');

// GET /api/projects
exports.getProjects = async (req, res) => {
  try {
    let filter = {};
    if (req.user && req.user.role === 'student') {
      filter = {
        $or: [
          { assignedStudentId: req.user._id },
          { teamMembers: req.user._id }
        ]
      };
    }
    const projects = await Project.find(filter)
      .populate('courseId', 'title')
      .populate('teamMembers', 'name avatar email');
    return res.json({ success: true, data: projects });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/projects/:id
exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('courseId', 'title')
      .populate('teamMembers', 'name avatar email')
      .populate('assignedStudentId', 'name email');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (req.user && req.user.role === 'student') {
      const isAssigned = (project.assignedStudentId && String(project.assignedStudentId._id || project.assignedStudentId) === String(req.user._id)) ||
        (project.teamMembers && project.teamMembers.some(m => String(m._id || m) === String(req.user._id)));
      if (!isAssigned) {
        return res.status(403).json({ success: false, message: 'Access denied: You are not assigned to this project.' });
      }
    }

    const tasks = await ProjectTask.find({ projectId: project._id })
      .sort({ order: 1 })
      .populate('assignedTo', 'name avatar');

    return res.json({
      success: true,
      data: {
        project,
        tasks
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/projects/:id/tasks/:taskId
exports.updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const task = await ProjectTask.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    task.status = status;

    // Award XP when task is moved to Completed for the first time
    if (status === 'Completed' && !task.xpAwarded && req.user.role === 'student') {
      task.xpAwarded = true;
      await awardXp(
        req.user._id,
        xpRules.BONUSES.PROJECT_TASK_COMPLETED || 50,
        'project_task_completed',
        task._id,
        'ProjectTask',
        `Completed project task: ${task.title}`
      );
    }

    await task.save();

    // Recalculate project progress percentage
    const allTasks = await ProjectTask.find({ projectId: task.projectId });
    const completedCount = allTasks.filter(t => t.status === 'Completed').length;
    const progressPercentage = Math.round((completedCount / allTasks.length) * 100);

    const project = await Project.findByIdAndUpdate(
      task.projectId,
      { progressPercentage },
      { new: true }
    );

    return res.json({ success: true, data: { task, project } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/projects/:id/submit
exports.submitProject = async (req, res) => {
  try {
    const { githubRepoUrl, liveDemoUrl, screenshots = [] } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    project.githubRepoUrl = githubRepoUrl || project.githubRepoUrl;
    project.liveDemoUrl = liveDemoUrl || project.liveDemoUrl;
    if (screenshots.length > 0) project.screenshots = screenshots;
    project.status = 'Under Review';

    await project.save();

    // Update student stats
    if (req.user.role === 'student') {
      const profile = await StudentProfile.findOne({ userId: req.user._id });
      if (profile) {
        profile.stats.projectsSubmitted += 1;
        await profile.save();
      }
    }

    return res.json({ success: true, data: project });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/projects/:id/review (Trainer / Admin)
exports.reviewProject = async (req, res) => {
  try {
    const { status, grade, trainerFeedback } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    project.status = status || project.status;
    project.grade = grade || project.grade;
    project.trainerFeedback = trainerFeedback || project.trainerFeedback;

    await project.save();

    // If approved / completed, award project completion XP to team
    if ((status === 'Completed' || status === 'Approved') && project.assignedStudentId) {
      await awardXp(
        project.assignedStudentId,
        project.xpReward || xpRules.BONUSES.PROJECT_COMPLETED || 300,
        'project_completed',
        project._id,
        'Project',
        `Successfully delivered project: ${project.title}`
      );
    }

    return res.json({ success: true, data: project });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
