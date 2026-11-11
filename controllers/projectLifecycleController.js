const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const ProjectRequirement = require('../models/ProjectRequirement');
const ProjectAssignment = require('../models/ProjectAssignment');
const ProjectSubmission = require('../models/ProjectSubmission');
const ProjectReview = require('../models/ProjectReview');
const AdminFinalApproval = require('../models/AdminFinalApproval');
const GitHubSyncRecord = require('../models/GitHubSyncRecord');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Project = require('../models/Project'); // Legacy compatibility
const StudentProfile = require('../models/StudentProfile');
const { awardXp } = require('../services/xpEngine');
const xpRules = require('../config/xpRules');
const {
  parseGitHubUrl,
  verifyRepoAccessibility,
  getLatestCommitSha,
  syncApprovedProjectToInstituteRepo
} = require('../services/githubService');
const { streamProjectZip } = require('../services/projectArchiveService');
const { syncAllProjectsToRequirements } = require('../services/projectSyncService');

// Helper to send notification
async function createNotification(userId, title, message, type, link = '') {
  try {
    await Notification.create({
      userId,
      title,
      message,
      type,
      link
    });
  } catch (err) {
    console.error('Notification creation failed:', err.message);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. ADMIN – PROJECT REQUIREMENTS MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

// POST /api/projects/requirements
exports.createRequirement = async (req, res) => {
  try {
    const {
      title,
      category,
      description,
      problemStatement,
      objectives,
      requiredFeatures,
      technicalRequirements,
      technologies,
      expectedOutput,
      uiUxRequirements,
      guidelines,
      deadline,
      difficulty,
      evaluationCriteria,
      referenceGithubUrl,
      assignedTutors,
      status
    } = req.body;

    if (!title || !description || !problemStatement) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and problem statement are required.'
      });
    }

    // Auto-generate unique Project ID
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    const projectId = `PRJ-${randomHex}`;

    // Generate unique slug
    let baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    let slug = baseSlug;
    let count = 1;
    while (await ProjectRequirement.findOne({ slug })) {
      slug = `${baseSlug}-${count++}`;
    }

    // Parse array fields if passed as JSON strings from FormData
    const parseIfJson = (field) => {
      if (typeof field === 'string') {
        try { return JSON.parse(field); } catch { return field ? [field] : []; }
      }
      return Array.isArray(field) ? field : [];
    };

    const parsedObjectives = parseIfJson(objectives);
    const parsedFeatures = parseIfJson(requiredFeatures);
    const parsedTech = parseIfJson(technologies);
    const parsedCriteria = parseIfJson(evaluationCriteria).map(c => ({
      criterion: typeof c === 'string' ? c : (c.criterion || c.criteriaName || 'Core Evaluation'),
      weightage: c.weightage || 20,
      description: c.description || ''
    }));
    const parsedTutors = parseIfJson(assignedTutors);

    // Process uploaded files
    const referenceFiles = [];
    let thumbnailUrl = '';

    if (req.files) {
      if (req.files.thumbnail && req.files.thumbnail[0]) {
        thumbnailUrl = `/uploads/projects/${req.files.thumbnail[0].filename}`;
      }
      if (req.files.referenceDocs) {
        req.files.referenceDocs.forEach(f => {
          referenceFiles.push({
            originalName: f.originalname,
            filename: f.filename,
            url: `/uploads/projects/${f.filename}`,
            size: f.size,
            mimeType: f.mimetype
          });
        });
      }
    }

    const requirement = await ProjectRequirement.create({
      projectId,
      title,
      slug,
      category: category || 'Enterprise Software',
      description,
      problemStatement,
      objectives: parsedObjectives,
      requiredFeatures: parsedFeatures,
      technicalRequirements: technicalRequirements || '',
      technologies: parsedTech,
      expectedOutput: expectedOutput || '',
      uiUxRequirements: uiUxRequirements || '',
      guidelines: guidelines || '',
      referenceFiles,
      thumbnailUrl,
      deadline: deadline ? new Date(deadline) : undefined,
      difficulty: difficulty || 'Intermediate',
      evaluationCriteria: parsedCriteria,
      referenceGithubUrl: referenceGithubUrl || '',
      status: status || 'Published',
      assignedTutors: parsedTutors,
      createdBy: req.user._id
    });

    // Notify assigned tutors or all tutors if published
    if (requirement.status === 'Published') {
      let targetTutorIds = parsedTutors;
      if (!targetTutorIds || targetTutorIds.length === 0) {
        const tutors = await User.find({ role: { $in: ['trainer', 'tutor'] } }, '_id');
        targetTutorIds = tutors.map(t => t._id);
      }
      for (const tId of targetTutorIds) {
        await createNotification(
          tId,
          'New Project Requirement Published',
          `Admin published new project "${requirement.title}" (${requirement.projectId}). Available for assignment.`,
          'project_requirement_published',
          '/projects'
        );
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Project requirement created successfully',
      data: requirement
    });
  } catch (error) {
    console.error('Error creating project requirement:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/projects/requirements
exports.getRequirements = async (req, res) => {
  try {
    // Ensure all admin domain projects are synchronized into requirements
    await syncAllProjectsToRequirements();

    const { category, difficulty, status, search } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { projectId: { $regex: search, $options: 'i' } },
        { technologies: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const requirements = await ProjectRequirement.find(filter)
      .populate('createdBy', 'name email')
      .populate('assignedTutors', 'name email')
      .sort({ createdAt: -1 });

    return res.json({ success: true, count: requirements.length, data: requirements });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/projects/requirements/:id
exports.getRequirementById = async (req, res) => {
  try {
    const requirement = await ProjectRequirement.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('assignedTutors', 'name email');

    if (!requirement) {
      return res.status(404).json({ success: false, message: 'Project requirement not found' });
    }

    const assignmentsCount = await ProjectAssignment.countDocuments({ projectRequirementId: requirement._id });

    return res.json({
      success: true,
      data: {
        requirement,
        assignmentsCount
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/projects/requirements/:id
exports.updateRequirement = async (req, res) => {
  try {
    const requirement = await ProjectRequirement.findById(req.params.id);
    if (!requirement) {
      return res.status(404).json({ success: false, message: 'Project requirement not found' });
    }

    const parseIfJson = (field, fallback) => {
      if (typeof field === 'string') {
        try { return JSON.parse(field); } catch { return field ? [field] : fallback; }
      }
      return Array.isArray(field) ? field : fallback;
    };

    const body = req.body;
    if (body.title) requirement.title = body.title;
    if (body.category) requirement.category = body.category;
    if (body.description) requirement.description = body.description;
    if (body.problemStatement) requirement.problemStatement = body.problemStatement;
    if (body.technicalRequirements !== undefined) requirement.technicalRequirements = body.technicalRequirements;
    if (body.expectedOutput !== undefined) requirement.expectedOutput = body.expectedOutput;
    if (body.uiUxRequirements !== undefined) requirement.uiUxRequirements = body.uiUxRequirements;
    if (body.guidelines !== undefined) requirement.guidelines = body.guidelines;
    if (body.difficulty) requirement.difficulty = body.difficulty;
    if (body.deadline) requirement.deadline = new Date(body.deadline);
    if (body.referenceGithubUrl !== undefined) requirement.referenceGithubUrl = body.referenceGithubUrl;
    if (body.status) requirement.status = body.status;

    if (body.objectives) requirement.objectives = parseIfJson(body.objectives, requirement.objectives);
    if (body.requiredFeatures) requirement.requiredFeatures = parseIfJson(body.requiredFeatures, requirement.requiredFeatures);
    if (body.technologies) requirement.technologies = parseIfJson(body.technologies, requirement.technologies);
    if (body.evaluationCriteria) requirement.evaluationCriteria = parseIfJson(body.evaluationCriteria, requirement.evaluationCriteria);
    if (body.assignedTutors) requirement.assignedTutors = parseIfJson(body.assignedTutors, requirement.assignedTutors);

    if (req.files) {
      if (req.files.thumbnail && req.files.thumbnail[0]) {
        requirement.thumbnailUrl = `/uploads/projects/${req.files.thumbnail[0].filename}`;
      }
      if (req.files.referenceDocs) {
        req.files.referenceDocs.forEach(f => {
          requirement.referenceFiles.push({
            originalName: f.originalname,
            filename: f.filename,
            url: `/uploads/projects/${f.filename}`,
            size: f.size,
            mimeType: f.mimetype
          });
        });
      }
    }

    await requirement.save();

    return res.json({
      success: true,
      message: 'Project requirement updated successfully',
      data: requirement
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/projects/requirements/:id/status
exports.updateRequirementStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Draft', 'Published', 'Archived'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const requirement = await ProjectRequirement.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    return res.json({ success: true, data: requirement });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};


// ═══════════════════════════════════════════════════════════════════════════
// 2. TUTOR – VIEW REQUIREMENTS & ASSIGN PROJECTS
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/projects/tutor/students
exports.getAssignableStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student', isActive: true })
      .select('name studentId email avatar phone')
      .sort({ name: 1 })
      .lean();
    return res.json({ success: true, count: students.length, data: students });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/projects/tutor/requirements
exports.getTutorRequirements = async (req, res) => {
  try {
    // Ensure all admin domain projects are synchronized into requirements
    await syncAllProjectsToRequirements();

    // Tutors see Published requirements
    const filter = { status: 'Published' };
    const requirements = await ProjectRequirement.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    return res.json({ success: true, data: requirements });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/projects/tutor/assignments
exports.getTutorAssignments = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'trainer' || req.user.role === 'tutor') {
      filter.tutorId = req.user._id;
    }

    const assignments = await ProjectAssignment.find(filter)
      .populate('projectRequirementId')
      .populate('studentId', 'name studentId email avatar phone')
      .populate('tutorId', 'name email')
      .sort({ updatedAt: -1 });

    return res.json({ success: true, data: assignments });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/projects/tutor/assign
exports.assignProjectToStudent = async (req, res) => {
  try {
    const {
      projectRequirementId,
      studentId,
      deadline,
      tutorInstructions,
      expectedDeliverables
    } = req.body;

    if (!projectRequirementId || !studentId || !deadline) {
      return res.status(400).json({
        success: false,
        message: 'Project requirement, student, and deadline are required.'
      });
    }

    // Verify requirement exists
    const requirement = await ProjectRequirement.findById(projectRequirementId);
    if (!requirement) {
      return res.status(404).json({ success: false, message: 'Project requirement not found' });
    }

    // Verify student exists and is active
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(400).json({ success: false, message: 'Valid student recipient required.' });
    }

    // Prevent duplicate active assignment
    const existing = await ProjectAssignment.findOne({
      projectRequirementId,
      studentId,
      status: { $nin: ['Rejected'] }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Student already has an active assignment for this project (Status: ${existing.status}).`
      });
    }

    const deliverables = Array.isArray(expectedDeliverables)
      ? expectedDeliverables
      : (typeof expectedDeliverables === 'string' ? expectedDeliverables.split(',').map(s => s.trim()) : []);

    const assignment = await ProjectAssignment.create({
      projectRequirementId,
      studentId,
      tutorId: req.user._id,
      assignmentDate: new Date(),
      deadline: new Date(deadline),
      tutorInstructions: tutorInstructions || '',
      expectedDeliverables: deliverables.length > 0 ? deliverables : [
        'GitHub Repository with complete source code',
        'README with installation instructions',
        'Live demonstration or preview video',
        'Comprehensive project report'
      ],
      status: 'Assigned'
    });

    // Notify student
    await createNotification(
      studentId,
      'Final Project Assigned',
      `Tutor ${req.user.name} assigned you final project "${requirement.title}". Due date: ${new Date(deadline).toLocaleDateString()}.`,
      'project_assigned',
      '/projects'
    );

    return res.status(201).json({
      success: true,
      message: 'Project assigned to student successfully',
      data: assignment
    });
  } catch (error) {
    console.error('Error assigning project:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};


// ═══════════════════════════════════════════════════════════════════════════
// 3. STUDENT – COMPLETE & SUBMIT PROJECT
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/projects/student/my-projects
exports.getStudentProjects = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const assignments = await ProjectAssignment.find({ studentId: req.user._id })
      .populate('projectRequirementId')
      .populate('tutorId', 'name email phone avatar')
      .sort({ updatedAt: -1 });

    // Attach latest submission and reviews to each assignment
    const enriched = await Promise.all(assignments.map(async (a) => {
      const submissions = await ProjectSubmission.find({ assignmentId: a._id })
        .sort({ versionNumber: -1 });
      const reviews = await ProjectReview.find({ assignmentId: a._id })
        .populate('tutorId', 'name email')
        .sort({ createdAt: -1 });
      const latestApproval = await AdminFinalApproval.findOne({ assignmentId: a._id })
        .populate('adminId', 'name email')
        .sort({ createdAt: -1 });

      return {
        ...a.toObject(),
        submissions,
        reviews,
        latestApproval
      };
    }));

    return res.json({ success: true, data: enriched });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/projects/student/submit/:assignmentId
exports.submitStudentProject = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const {
      title,
      implementationNotes,
      githubRepoUrl,
      liveDemoUrl,
      submissionComments
    } = req.body;

    const assignment = await ProjectAssignment.findById(assignmentId)
      .populate('projectRequirementId');

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment record not found' });
    }

    if (String(assignment.studentId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'You can only submit your own assigned projects.' });
    }

    if (assignment.isLocked) {
      return res.status(400).json({
        success: false,
        message: 'This assignment is locked under final executive review. New submissions are paused.'
      });
    }

    // Validate GitHub Repo URL
    const parsedRepo = parseGitHubUrl(githubRepoUrl);
    if (!parsedRepo) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid GitHub repository URL (e.g. https://github.com/username/project).'
      });
    }

    // Check accessibility via GitHub API
    const accessCheck = await verifyRepoAccessibility(parsedRepo.owner, parsedRepo.repo);
    let commitSha = '';
    if (accessCheck.accessible) {
      commitSha = await getLatestCommitSha(parsedRepo.owner, parsedRepo.repo, accessCheck.defaultBranch);
    }

    // Calculate new version number
    const lastSubmission = await ProjectSubmission.findOne({ assignmentId: assignment._id })
      .sort({ versionNumber: -1 });
    const versionNumber = (lastSubmission?.versionNumber || 0) + 1;

    // Process uploaded screenshots and supporting documents
    const supportingDocuments = [];
    const screenshots = [];

    if (req.files) {
      if (req.files.documents) {
        req.files.documents.forEach(f => {
          supportingDocuments.push({
            originalName: f.originalname,
            filename: f.filename,
            url: `/uploads/projects/${f.filename}`,
            size: f.size,
            mimeType: f.mimetype
          });
        });
      }
      if (req.files.screenshots) {
        req.files.screenshots.forEach(f => {
          screenshots.push({
            originalName: f.originalname,
            filename: f.filename,
            url: `/uploads/projects/${f.filename}`
          });
        });
      }
    }

    const submission = await ProjectSubmission.create({
      assignmentId: assignment._id,
      projectRequirementId: assignment.projectRequirementId._id,
      studentId: req.user._id,
      versionNumber,
      title: title || assignment.projectRequirementId.title,
      implementationNotes: implementationNotes || '',
      githubRepoUrl: parsedRepo.canonicalUrl,
      liveDemoUrl: liveDemoUrl || '',
      commitSha: commitSha || `V${versionNumber}-COMMIT`,
      supportingDocuments,
      screenshots,
      submissionComments: submissionComments || '',
      status: versionNumber > 1 ? 'Resubmitted' : 'Submitted'
    });

    // Update assignment state
    assignment.status = versionNumber > 1 ? 'Resubmitted' : 'Submitted';
    assignment.activeSubmissionVersion = versionNumber;
    await assignment.save();

    // Notify assigned tutor
    await createNotification(
      assignment.tutorId,
      `Project ${versionNumber > 1 ? 'Resubmitted' : 'Submitted'}: ${assignment.projectRequirementId.title}`,
      `Student ${req.user.name} submitted version ${versionNumber} for project code review. GitHub: ${parsedRepo.canonicalUrl}`,
      'project_submitted',
      '/projects'
    );

    // Update student profile stats
    const profile = await StudentProfile.findOne({ userId: req.user._id });
    if (profile) {
      profile.stats.projectsSubmitted = (profile.stats.projectsSubmitted || 0) + 1;
      await profile.save();
    }

    return res.status(201).json({
      success: true,
      message: `Project version ${versionNumber} submitted successfully for tutor review`,
      data: submission
    });
  } catch (error) {
    console.error('Error submitting project:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};


// ═══════════════════════════════════════════════════════════════════════════
// 4 & 5. TUTOR – REVIEW, FEEDBACK & SEND TO ADMIN
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/projects/tutor/reviews/:assignmentId
exports.getTutorReviewDetail = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const assignment = await ProjectAssignment.findById(assignmentId)
      .populate('projectRequirementId')
      .populate('studentId', 'name studentId email avatar phone')
      .populate('tutorId', 'name email');

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    if (req.user.role !== 'admin' && String(assignment.tutorId?._id || assignment.tutorId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'You are not authorized to review this assignment.' });
    }

    const submissions = await ProjectSubmission.find({ assignmentId: assignment._id })
      .sort({ versionNumber: -1 });

    const reviews = await ProjectReview.find({ assignmentId: assignment._id })
      .populate('tutorId', 'name email')
      .sort({ createdAt: -1 });

    const adminApprovals = await AdminFinalApproval.find({ assignmentId: assignment._id })
      .populate('adminId', 'name email')
      .sort({ createdAt: -1 });

    const syncRecord = await GitHubSyncRecord.findOne({ assignmentId: assignment._id });

    // Verify current GitHub accessibility
    let repoHealth = { verified: false };
    const latestSub = submissions[0];
    if (latestSub?.githubRepoUrl) {
      const parsed = parseGitHubUrl(latestSub.githubRepoUrl);
      if (parsed) {
        repoHealth = await verifyRepoAccessibility(parsed.owner, parsed.repo);
      }
    }

    return res.json({
      success: true,
      data: {
        assignment,
        submissions,
        reviews,
        adminApprovals,
        syncRecord,
        repoHealth
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/projects/tutor/review/:assignmentId
exports.submitTutorReview = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const {
      remarks,
      missingFeatures,
      bugsIdentified,
      requiredImprovements,
      completedRequirements,
      privateEvaluationNotes,
      testingResults,
      knownIssues,
      decision // 'ApprovedForAdmin', 'RevisionRequired', 'Rejected'
    } = req.body;

    if (!remarks || !decision) {
      return res.status(400).json({
        success: false,
        message: 'Tutor remarks and a valid review decision are required.'
      });
    }

    const assignment = await ProjectAssignment.findById(assignmentId)
      .populate('projectRequirementId')
      .populate('studentId', 'name email');

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    const latestSubmission = await ProjectSubmission.findOne({ assignmentId: assignment._id })
      .sort({ versionNumber: -1 });

    if (!latestSubmission) {
      return res.status(400).json({
        success: false,
        message: 'No student submission found to review.'
      });
    }

    const parseList = (f) => Array.isArray(f) ? f : (typeof f === 'string' ? f.split('\n').map(s => s.trim()).filter(Boolean) : []);

    const review = await ProjectReview.create({
      assignmentId: assignment._id,
      submissionId: latestSubmission._id,
      submissionVersion: latestSubmission.versionNumber,
      tutorId: req.user._id,
      remarks,
      missingFeatures: parseList(missingFeatures),
      bugsIdentified: parseList(bugsIdentified),
      requiredImprovements: parseList(requiredImprovements),
      completedRequirements: parseList(completedRequirements),
      privateEvaluationNotes: privateEvaluationNotes || '',
      testingResults: testingResults || '',
      knownIssues: parseList(knownIssues),
      decision
    });

    if (decision === 'RevisionRequired') {
      assignment.status = 'Revision Required';
      latestSubmission.status = 'Revision Required';
      await latestSubmission.save();
      await assignment.save();

      // Notify student
      await createNotification(
        assignment.studentId._id,
        'Project Revision Requested by Tutor',
        `Tutor provided remarks on version ${latestSubmission.versionNumber}. Please resolve identified items and resubmit.`,
        'project_revision_requested',
        '/projects'
      );
    } else if (decision === 'ApprovedForAdmin') {
      // Tutor is satisfied and submitting to admin for final executive approval
      assignment.status = 'Sent for Admin Approval';
      assignment.isLocked = true;
      assignment.lockedCommitSha = latestSubmission.commitSha || 'HEAD-LOCKED';
      latestSubmission.status = 'Sent for Admin Approval';
      await latestSubmission.save();
      await assignment.save();

      // Notify Admins
      const admins = await User.find({ role: 'admin' }, '_id');
      for (const adm of admins) {
        await createNotification(
          adm._id,
          'Project Submitted for Final Executive Approval',
          `Tutor ${req.user.name} approved student ${assignment.studentId.name}'s project "${assignment.projectRequirementId.title}" (Version ${latestSubmission.versionNumber}). Final testing & approval required.`,
          'project_sent_to_admin',
          '/projects'
        );
      }
    } else if (decision === 'Rejected') {
      assignment.status = 'Rejected';
      latestSubmission.status = 'Rejected';
      await latestSubmission.save();
      await assignment.save();

      await createNotification(
        assignment.studentId._id,
        'Project Submission Rejected',
        `Your submission for "${assignment.projectRequirementId.title}" was not approved by tutor. Remarks: ${remarks.slice(0, 100)}...`,
        'project_rejected',
        '/projects'
      );
    }

    return res.status(201).json({
      success: true,
      message: `Tutor review recorded (${decision})`,
      data: review
    });
  } catch (error) {
    console.error('Error submitting tutor review:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};


// ═══════════════════════════════════════════════════════════════════════════
// 6 & 7. ADMIN – FINAL TESTING, APPROVAL & AUTOMATED GITHUB SYNC
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/projects/admin/pending-approvals
exports.getPendingAdminApprovals = async (req, res) => {
  try {
    const pendingAssignments = await ProjectAssignment.find({
      status: 'Sent for Admin Approval'
    })
      .populate('projectRequirementId')
      .populate('studentId', 'name studentId email avatar phone')
      .populate('tutorId', 'name email avatar')
      .sort({ updatedAt: -1 });

    const enriched = await Promise.all(pendingAssignments.map(async (a) => {
      const latestSubmission = await ProjectSubmission.findOne({ assignmentId: a._id })
        .sort({ versionNumber: -1 });
      const latestReview = await ProjectReview.findOne({ assignmentId: a._id })
        .sort({ createdAt: -1 });
      return {
        ...a.toObject(),
        latestSubmission,
        latestReview
      };
    }));

    return res.json({ success: true, count: enriched.length, data: enriched });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/projects/admin/approvals/:assignmentId
exports.handleAdminApproval = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const {
      decision, // 'Approved', 'Rejected', 'RevisionRequired'
      adminFeedback,
      testingResults,
      rejectionReason
    } = req.body;

    if (!decision || !['Approved', 'Rejected', 'RevisionRequired'].includes(decision)) {
      return res.status(400).json({ success: false, message: 'Valid decision (Approved, Rejected, RevisionRequired) is required.' });
    }

    const assignment = await ProjectAssignment.findById(assignmentId)
      .populate('projectRequirementId')
      .populate('studentId', 'name studentId email')
      .populate('tutorId', 'name email');

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    const latestSubmission = await ProjectSubmission.findOne({ assignmentId: assignment._id })
      .sort({ versionNumber: -1 });

    if (!latestSubmission) {
      return res.status(400).json({ success: false, message: 'No student submission found for this assignment.' });
    }

    // Record Admin Approval decision
    const approvalRecord = await AdminFinalApproval.create({
      assignmentId: assignment._id,
      submissionId: latestSubmission._id,
      submissionVersion: latestSubmission.versionNumber,
      adminId: req.user._id,
      tutorId: assignment.tutorId._id,
      studentId: assignment.studentId._id,
      decision,
      adminFeedback: adminFeedback || '',
      rejectionReason: rejectionReason || '',
      testingResults: testingResults || '',
      approvedCommitSha: latestSubmission.commitSha || 'VERIFIED-HEAD'
    });

    if (decision === 'Approved') {
      assignment.status = 'Approved';
      assignment.isLocked = true;
      assignment.lockedCommitSha = latestSubmission.commitSha || 'HEAD';
      latestSubmission.status = 'Approved';
      await latestSubmission.save();
      await assignment.save();

      // Trigger automated replication to Institute's GitHub account!
      const syncResult = await syncApprovedProjectToInstituteRepo({
        studentRepoUrl: latestSubmission.githubRepoUrl,
        projectTitle: assignment.projectRequirementId.title,
        studentName: assignment.studentId.name,
        projectId: assignment.projectRequirementId.projectId,
        commitSha: latestSubmission.commitSha
      });

      // Record Sync Audit
      const syncRecord = await GitHubSyncRecord.create({
        assignmentId: assignment._id,
        projectRequirementId: assignment.projectRequirementId._id,
        studentRepoUrl: latestSubmission.githubRepoUrl,
        sourceCommitSha: latestSubmission.commitSha,
        destinationRepoName: syncResult.destinationRepoName || '',
        destinationRepoUrl: syncResult.destinationRepoUrl || '',
        destinationRepoId: syncResult.destinationRepoId || '',
        destinationOwner: syncResult.destinationOwner || '',
        destinationCommitSha: syncResult.destinationCommitSha || '',
        syncedFilesCount: syncResult.syncedFilesCount || 0,
        status: syncResult.status || (syncResult.success ? 'SYNCED' : 'FAILED'),
        errorLog: syncResult.errorLog || '',
        sensitiveFilesDetected: syncResult.sensitiveFilesDetected || []
      });

      // Update assignment GitHub state
      assignment.githubSyncStatus = syncResult.status || 'SYNCED';
      assignment.destinationGithubRepoUrl = syncResult.destinationRepoUrl || '';
      assignment.destinationRepoName = syncResult.destinationRepoName || '';
      assignment.syncError = syncResult.errorLog || '';
      await assignment.save();

      // Award XP to student
      await awardXp(
        assignment.studentId._id,
        xpRules.BONUSES.PROJECT_COMPLETED || 500,
        'project_approved',
        assignment._id,
        'ProjectAssignment',
        `Final Executive Project Approved: ${assignment.projectRequirementId.title}`
      );

      // Mirror into legacy Project model so existing portal/courses views seamlessly find it
      try {
        await Project.findOneAndUpdate(
          { slug: assignment.projectRequirementId.slug },
          {
            title: assignment.projectRequirementId.title,
            slug: assignment.projectRequirementId.slug,
            category: assignment.projectRequirementId.category,
            description: assignment.projectRequirementId.description,
            technologies: assignment.projectRequirementId.technologies,
            difficulty: assignment.projectRequirementId.difficulty,
            githubRepoUrl: syncResult.destinationRepoUrl || latestSubmission.githubRepoUrl,
            liveDemoUrl: latestSubmission.liveDemoUrl || '',
            status: 'Approved',
            assignedStudentId: assignment.studentId._id,
            progressPercentage: 100,
            trainerFeedback: adminFeedback || 'Approved by Executive Admin'
          },
          { upsert: true, new: true }
        );
      } catch (legacyErr) {
        console.warn('Legacy Project mirror notice:', legacyErr.message);
      }

      // Notify Student & Tutor
      await createNotification(
        assignment.studentId._id,
        '🎉 Final Project Approved by Admin!',
        `Your final project "${assignment.projectRequirementId.title}" passed executive testing and is officially approved! +500 XP Awarded.`,
        'project_approved',
        '/projects'
      );

      await createNotification(
        assignment.tutorId._id,
        'Student Project Approved by Admin',
        `Project "${assignment.projectRequirementId.title}" for student ${assignment.studentId.name} has been approved and synced to GitHub.`,
        'project_approved',
        '/projects'
      );

      return res.json({
        success: true,
        message: 'Project approved, files synchronized to institute GitHub, and archived successfully',
        data: {
          approval: approvalRecord,
          syncRecord,
          assignment
        }
      });
    } else if (decision === 'RevisionRequired') {
      assignment.status = 'Revision Required';
      assignment.isLocked = false;
      latestSubmission.status = 'Revision Required';
      await latestSubmission.save();
      await assignment.save();

      await createNotification(
        assignment.studentId._id,
        'Admin Executive Revision Requested',
        `Admin testing identified necessary revisions: ${adminFeedback}`,
        'project_revision_requested',
        '/projects'
      );

      await createNotification(
        assignment.tutorId._id,
        'Admin Requested Student Project Revisions',
        `Admin testing requested corrections for student ${assignment.studentId.name}. Notes: ${adminFeedback}`,
        'project_revision_requested',
        '/projects'
      );

      return res.json({
        success: true,
        message: 'Project returned for revisions through tutor and student',
        data: { approval: approvalRecord, assignment }
      });
    } else if (decision === 'Rejected') {
      assignment.status = 'Rejected';
      assignment.isLocked = false;
      latestSubmission.status = 'Rejected';
      await latestSubmission.save();
      await assignment.save();

      await createNotification(
        assignment.studentId._id,
        'Project Rejected by Executive Admin',
        `Reason: ${rejectionReason || adminFeedback || 'Requirements not satisfied.'}`,
        'project_rejected',
        '/projects'
      );

      return res.json({
        success: true,
        message: 'Project rejected',
        data: { approval: approvalRecord, assignment }
      });
    }
  } catch (error) {
    console.error('Error handling admin approval:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/projects/admin/github-sync/:assignmentId/retry
exports.retryGitHubSync = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const assignment = await ProjectAssignment.findById(assignmentId)
      .populate('projectRequirementId')
      .populate('studentId', 'name email');

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    if (assignment.status !== 'Approved') {
      return res.status(400).json({ success: false, message: 'Only approved projects can be synchronized to GitHub.' });
    }

    const latestSubmission = await ProjectSubmission.findOne({ assignmentId: assignment._id })
      .sort({ versionNumber: -1 });

    const syncResult = await syncApprovedProjectToInstituteRepo({
      studentRepoUrl: latestSubmission?.githubRepoUrl || assignment.destinationGithubRepoUrl,
      projectTitle: assignment.projectRequirementId.title,
      studentName: assignment.studentId.name,
      projectId: assignment.projectRequirementId.projectId,
      commitSha: latestSubmission?.commitSha || assignment.lockedCommitSha
    });

    const syncRecord = await GitHubSyncRecord.findOneAndUpdate(
      { assignmentId: assignment._id },
      {
        studentRepoUrl: latestSubmission?.githubRepoUrl || '',
        destinationRepoName: syncResult.destinationRepoName || '',
        destinationRepoUrl: syncResult.destinationRepoUrl || '',
        destinationRepoId: syncResult.destinationRepoId || '',
        destinationOwner: syncResult.destinationOwner || '',
        destinationCommitSha: syncResult.destinationCommitSha || '',
        syncedFilesCount: syncResult.syncedFilesCount || 0,
        status: syncResult.status || (syncResult.success ? 'SYNCED' : 'FAILED'),
        errorLog: syncResult.errorLog || '',
        sensitiveFilesDetected: syncResult.sensitiveFilesDetected || [],
        lastAttemptAt: new Date()
      },
      { upsert: true, new: true }
    );

    assignment.githubSyncStatus = syncResult.status || 'SYNCED';
    assignment.destinationGithubRepoUrl = syncResult.destinationRepoUrl || assignment.destinationGithubRepoUrl;
    assignment.destinationRepoName = syncResult.destinationRepoName || assignment.destinationRepoName;
    assignment.syncError = syncResult.errorLog || '';
    await assignment.save();

    return res.json({
      success: true,
      message: syncResult.success ? 'GitHub replication completed' : 'GitHub replication attempt failed',
      data: { syncRecord, assignment }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/projects/admin/publish-homepage/:assignmentId
exports.toggleHomepagePublication = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { isPublishedToHomepage } = req.body;

    const assignment = await ProjectAssignment.findById(assignmentId)
      .populate('projectRequirementId')
      .populate('studentId', 'name email');

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    if (isPublishedToHomepage && assignment.status !== 'Approved') {
      return res.status(400).json({
        success: false,
        message: 'Only approved projects that have completed executive review can be published to the public homepage.'
      });
    }

    assignment.isPublishedToHomepage = Boolean(isPublishedToHomepage);
    if (assignment.isPublishedToHomepage) {
      assignment.publishedAt = new Date();
    }
    await assignment.save();

    // Mirror to legacy Project model active status
    try {
      await Project.findOneAndUpdate(
        { slug: assignment.projectRequirementId.slug },
        { status: assignment.isPublishedToHomepage ? 'Approved' : 'Under Review' }
      );
    } catch {}

    if (assignment.isPublishedToHomepage) {
      await createNotification(
        assignment.studentId._id,
        '🌟 Project Featured on Public Homepage!',
        `Your approved project "${assignment.projectRequirementId.title}" is now published on the Stack Queue official homepage showcase!`,
        'project_approved',
        '/'
      );
    }

    return res.json({
      success: true,
      message: assignment.isPublishedToHomepage ? 'Project published to public homepage' : 'Project removed from public homepage',
      data: assignment
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};


// ═══════════════════════════════════════════════════════════════════════════
// 8. ALL PROJECTS CENTRALIZED LIBRARY
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/projects/admin/all
exports.getAllProjectsLibrary = async (req, res) => {
  try {
    const {
      search,
      category,
      difficulty,
      status,
      isPublished,
      tutorId,
      studentId
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (isPublished !== undefined) filter.isPublishedToHomepage = isPublished === 'true';
    if (tutorId) filter.tutorId = tutorId;
    if (studentId) filter.studentId = studentId;

    let assignments = await ProjectAssignment.find(filter)
      .populate('projectRequirementId')
      .populate('studentId', 'name studentId email avatar phone')
      .populate('tutorId', 'name email avatar')
      .sort({ updatedAt: -1 });

    // Client/query level filtering for requirement fields
    if (category) {
      assignments = assignments.filter(a => a.projectRequirementId?.category === category);
    }
    if (difficulty) {
      assignments = assignments.filter(a => a.projectRequirementId?.difficulty === difficulty);
    }
    if (search) {
      const q = search.toLowerCase();
      assignments = assignments.filter(a => {
        const titleMatch = a.projectRequirementId?.title?.toLowerCase().includes(q);
        const idMatch = a.projectRequirementId?.projectId?.toLowerCase().includes(q);
        const studentMatch = a.studentId?.name?.toLowerCase().includes(q) || a.studentId?.studentId?.toLowerCase().includes(q);
        const tutorMatch = a.tutorId?.name?.toLowerCase().includes(q);
        const techMatch = a.projectRequirementId?.technologies?.some(t => t.toLowerCase().includes(q));
        return titleMatch || idMatch || studentMatch || tutorMatch || techMatch;
      });
    }

    const assignmentIds = assignments.map(a => a._id);

    // Batch query all related sub-documents in parallel (eliminates N+1 query overhead completely)
    const [allSubmissions, allReviews, allApprovals, allSyncs, metrics] = await Promise.all([
      ProjectSubmission.find({ assignmentId: { $in: assignmentIds } }).sort({ versionNumber: -1 }).lean(),
      ProjectReview.find({ assignmentId: { $in: assignmentIds } }).sort({ createdAt: -1 }).lean(),
      AdminFinalApproval.find({ assignmentId: { $in: assignmentIds } }).populate('adminId', 'name email').sort({ createdAt: -1 }).lean(),
      GitHubSyncRecord.find({ assignmentId: { $in: assignmentIds } }).lean(),
      Promise.all([
        ProjectAssignment.countDocuments(),
        ProjectAssignment.countDocuments({ status: 'Sent for Admin Approval' }),
        ProjectAssignment.countDocuments({ status: 'Approved' }),
        ProjectAssignment.countDocuments({ isPublishedToHomepage: true }),
        GitHubSyncRecord.countDocuments({ status: 'SYNCED' })
      ]).then(([totalAssignments, pendingApprovals, approvedCount, publishedCount, syncedReposCount]) => ({
        totalAssignments,
        pendingApprovals,
        approvedCount,
        publishedCount,
        syncedReposCount
      }))
    ]);

    // Fast in-memory grouping
    const submissionsByAssign = new Map();
    allSubmissions.forEach(s => {
      const aId = s.assignmentId.toString();
      if (!submissionsByAssign.has(aId)) submissionsByAssign.set(aId, []);
      submissionsByAssign.get(aId).push(s);
    });

    const reviewsByAssign = new Map();
    allReviews.forEach(r => {
      const aId = r.assignmentId.toString();
      if (!reviewsByAssign.has(aId)) reviewsByAssign.set(aId, r);
    });

    const approvalsByAssign = new Map();
    allApprovals.forEach(ap => {
      const aId = ap.assignmentId.toString();
      if (!approvalsByAssign.has(aId)) approvalsByAssign.set(aId, ap);
    });

    const syncsByAssign = new Map();
    allSyncs.forEach(sy => {
      const aId = sy.assignmentId.toString();
      if (!syncsByAssign.has(aId)) syncsByAssign.set(aId, sy);
    });

    const enriched = assignments.map(a => {
      const aId = a._id.toString();
      return {
        ...(a.toObject ? a.toObject() : a),
        submissions: submissionsByAssign.get(aId) || [],
        latestReview: reviewsByAssign.get(aId) || null,
        approval: approvalsByAssign.get(aId) || null,
        syncRecord: syncsByAssign.get(aId) || null
      };
    });

    return res.json({
      success: true,
      metrics,
      count: enriched.length,
      data: enriched
    });
  } catch (error) {
    console.error('Error fetching All Projects library:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};


// ═══════════════════════════════════════════════════════════════════════════
// 9. DOWNLOAD FULL PROJECT TO ADMIN'S LAPTOP
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/projects/assignments/:assignmentId/download
exports.downloadProjectZip = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const assignment = await ProjectAssignment.findById(assignmentId)
      .populate('projectRequirementId')
      .populate('studentId', 'name studentId email')
      .populate('tutorId', 'name email');

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    // Role security check: only admin, assigned tutor, or assigned student can download
    const isAuthorized = req.user.role === 'admin' ||
      (assignment.tutorId && String(assignment.tutorId._id || assignment.tutorId) === String(req.user._id)) ||
      (assignment.studentId && String(assignment.studentId._id || assignment.studentId) === String(req.user._id));

    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to project source package.' });
    }

    // Local mirror path
    const repoName = assignment.destinationRepoName || assignment.projectRequirementId.slug;
    const localPath = path.join(__dirname, '..', 'uploads', 'synced_repos', repoName);

    await streamProjectZip({
      res,
      projectRequirement: assignment.projectRequirementId,
      assignment,
      student: assignment.studentId,
      tutor: assignment.tutorId,
      localSourcePath: localPath
    });
  } catch (error) {
    console.error('Error streaming project zip:', error);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
};


// ═══════════════════════════════════════════════════════════════════════════
// 10. PUBLIC HOMEPAGE APPROVED PROJECTS
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/projects/public/approved
exports.getPublicApprovedProjects = async (req, res) => {
  try {
    const published = await ProjectAssignment.find({
      status: 'Approved',
      isPublishedToHomepage: true
    })
      .populate('projectRequirementId')
      .populate('studentId', 'name avatar')
      .sort({ publishedAt: -1, updatedAt: -1 });

    const formatted = published.map(p => {
      const reqDoc = p.projectRequirementId || {};
      return {
        id: p._id,
        _id: p._id,
        assignmentId: p._id,
        projectId: reqDoc.projectId || 'PRJ-PORTFOLIO',
        title: reqDoc.title || 'Enterprise Project',
        slug: reqDoc.slug || 'project',
        category: reqDoc.category || 'Software Engineering',
        description: reqDoc.description || '',
        shortDescription: reqDoc.description ? reqDoc.description.slice(0, 180) + '...' : '',
        problemStatement: reqDoc.problemStatement || '',
        technologies: reqDoc.technologies || [],
        technology: (reqDoc.technologies || []).join(', ') || 'Modern Stack',
        keyFeatures: (reqDoc.requiredFeatures || []).map(f => f.title),
        thumbnailUrl: reqDoc.thumbnailUrl || '',
        githubRepoUrl: p.destinationGithubRepoUrl || '#',
        liveDemoUrl: p.liveDemoUrl || '#',
        difficulty: reqDoc.difficulty || 'Intermediate',
        studentName: p.studentId?.name || 'Stack Queue Fellow',
        publishedAt: p.publishedAt || p.updatedAt
      };
    });

    return res.json({ success: true, count: formatted.length, data: formatted });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/projects/public/:id
exports.getPublicProjectDetail = async (req, res) => {
  try {
    const assignment = await ProjectAssignment.findOne({
      _id: req.params.id,
      status: 'Approved',
      isPublishedToHomepage: true
    })
      .populate('projectRequirementId')
      .populate('studentId', 'name avatar');

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Public project not found or not published.' });
    }

    const latestSubmission = await ProjectSubmission.findOne({ assignmentId: assignment._id })
      .sort({ versionNumber: -1 });

    const reqDoc = assignment.projectRequirementId || {};

    return res.json({
      success: true,
      data: {
        id: assignment._id,
        _id: assignment._id,
        projectId: reqDoc.projectId,
        title: reqDoc.title,
        slug: reqDoc.slug,
        category: reqDoc.category,
        description: reqDoc.description,
        problemStatement: reqDoc.problemStatement,
        objectives: reqDoc.objectives || [],
        requiredFeatures: reqDoc.requiredFeatures || [],
        technologies: reqDoc.technologies || [],
        expectedOutput: reqDoc.expectedOutput || '',
        uiUxRequirements: reqDoc.uiUxRequirements || '',
        guidelines: reqDoc.guidelines || '',
        thumbnailUrl: reqDoc.thumbnailUrl || '',
        screenshots: latestSubmission?.screenshots || [],
        githubRepoUrl: assignment.destinationGithubRepoUrl || latestSubmission?.githubRepoUrl || '',
        liveDemoUrl: latestSubmission?.liveDemoUrl || '',
        studentName: assignment.studentId?.name || 'Stack Queue Student',
        publishedAt: assignment.publishedAt || assignment.updatedAt
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
