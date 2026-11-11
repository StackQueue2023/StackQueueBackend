const TutorLearning = require('../models/TutorLearning');
const LearningTopic = require('../models/LearningTopic');
const TutorProject = require('../models/TutorProject');
const ProjectDailyProgress = require('../models/ProjectDailyProgress');
const TrainingInterview = require('../models/TrainingInterview');
const InterviewFailureAnalysis = require('../models/InterviewFailureAnalysis');
const InterviewCorrectiveAction = require('../models/InterviewCorrectiveAction');
const ReInterview = require('../models/ReInterview');
const CollegeTraining = require('../models/CollegeTraining');

/**
 * 1. GET /api/tutor/progress/learning
 */
exports.getTutorLearning = async (req, res) => {
  try {
    const tutorId = req.user._id;
    const learnings = await TutorLearning.find({ tutorId }).sort({ date: -1, createdAt: -1 });

    const formatted = await Promise.all(learnings.map(async (l) => {
      const topics = await LearningTopic.find({ learningId: l._id });
      return {
        ...l.toObject(),
        topics
      };
    }));

    return res.json({ success: true, data: formatted });
  } catch (error) {
    console.error('getTutorLearning error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 2. POST /api/tutor/progress/learning
 */
exports.createTutorLearning = async (req, res) => {
  try {
    const tutorId = req.user._id;
    const {
      learningType, courseName, technology, startDate, date,
      summary, confidence, hoursSpent, nextLearningGoal, topics
    } = req.body;

    if (!courseName) {
      return res.status(400).json({ success: false, message: 'Course/Subject name is required.' });
    }

    const todayDate = date || new Date().toISOString().split('T')[0];

    const learning = await TutorLearning.create({
      tutorId,
      learningType: learningType || 'Learning a New Course',
      courseName: courseName.trim(),
      technology: technology ? technology.trim() : '',
      startDate: startDate || todayDate,
      date: todayDate,
      summary: summary ? summary.trim() : '',
      confidence: confidence || 4,
      hoursSpent: hoursSpent || 2,
      nextLearningGoal: nextLearningGoal ? nextLearningGoal.trim() : ''
    });

    let savedTopics = [];
    if (topics && Array.isArray(topics) && topics.length > 0) {
      for (const t of topics) {
        if (t.topicName && t.topicName.trim()) {
          const top = await LearningTopic.create({
            learningId: learning._id,
            tutorId,
            topicName: t.topicName.trim(),
            understandingPercentage: t.understandingPercentage || 80,
            strengthLevel: t.strengthLevel || 'Intermediate',
            whatUnderstood: t.whatUnderstood || '',
            difficulties: t.difficulties || '',
            practiceCompleted: t.practiceCompleted || ''
          });
          savedTopics.push(top);
        }
      }
    }

    return res.json({
      success: true,
      message: 'Today learning progress saved successfully!',
      data: {
        ...learning.toObject(),
        topics: savedTopics
      }
    });
  } catch (error) {
    console.error('createTutorLearning error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 3. GET /api/tutor/progress/projects
 */
exports.getTutorProjects = async (req, res) => {
  try {
    const tutorId = req.user._id;
    const projects = await TutorProject.find({ tutorId }).sort({ createdAt: -1 });

    const formatted = await Promise.all(projects.map(async (p) => {
      const dailyLogs = await ProjectDailyProgress.find({ projectId: p._id }).sort({ date: -1 });
      return {
        ...p.toObject(),
        dailyLogs
      };
    }));

    return res.json({ success: true, data: formatted });
  } catch (error) {
    console.error('getTutorProjects error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 4. POST /api/tutor/progress/projects
 */
exports.createTutorProject = async (req, res) => {
  try {
    const tutorId = req.user._id;
    const { projectName, projectType, technologyStack, startDate, status, progressPercentage } = req.body;

    if (!projectName) {
      return res.status(400).json({ success: false, message: 'Project Name is required.' });
    }

    const project = await TutorProject.create({
      tutorId,
      projectName: projectName.trim(),
      projectType: projectType || 'Full Stack Web App',
      technologyStack: technologyStack || 'MERN Stack',
      startDate: startDate || new Date().toISOString().split('T')[0],
      status: status || 'Development',
      progressPercentage: progressPercentage || 10
    });

    return res.json({ success: true, message: 'Project created successfully!', data: project });
  } catch (error) {
    console.error('createTutorProject error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 5. POST /api/tutor/progress/projects/:projectId/progress
 */
exports.addProjectDailyProgress = async (req, res) => {
  try {
    const tutorId = req.user._id;
    const { projectId } = req.params;
    const {
      date, dailyGoal, completedToday, flowCompleted,
      problemsFaced, solutionImplemented, nextStep, testingDone, progressPercentage
    } = req.body;

    const project = await TutorProject.findOne({ _id: projectId, tutorId });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const todayDate = date || new Date().toISOString().split('T')[0];

    const log = await ProjectDailyProgress.create({
      projectId,
      tutorId,
      date: todayDate,
      dailyGoal: dailyGoal || '',
      completedToday: completedToday || '',
      flowCompleted: Array.isArray(flowCompleted) ? flowCompleted : [],
      problemsFaced: problemsFaced || '',
      solutionImplemented: solutionImplemented || '',
      nextStep: nextStep || '',
      testingDone: testingDone || '',
      progressPercentage: progressPercentage || project.progressPercentage
    });

    if (progressPercentage !== undefined) {
      project.progressPercentage = progressPercentage;
      if (progressPercentage >= 100) project.status = 'Completed';
      await project.save();
    }

    return res.json({ success: true, message: 'Project daily progress saved!', data: log });
  } catch (error) {
    console.error('addProjectDailyProgress error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const TutorImprovementUpdate = require('../models/TutorImprovementUpdate');
const User = require('../models/User');
const notificationService = require('../services/notificationService');

/**
 * 6. GET /api/tutor/progress/interviews
 */
exports.getTutorInterviews = async (req, res) => {
  try {
    const tutorId = req.user._id;
    const interviews = await TrainingInterview.find({ tutorId })
      .populate('collegeTrainingId')
      .sort({ interviewDate: -1, createdAt: -1 });

    const formatted = await Promise.all(interviews.map(async (inv) => {
      const tutorImprovement = await TutorImprovementUpdate.findOne({ interviewId: inv._id });
      const failureAnalysis = await InterviewFailureAnalysis.findOne({ interviewId: inv._id });
      let correctiveAction = null;
      if (failureAnalysis) {
        correctiveAction = await InterviewCorrectiveAction.findOne({ failureAnalysisId: failureAnalysis._id });
      }
      const reInterviews = await ReInterview.find({ previousInterviewId: inv._id }).sort({ scheduledDate: -1 });

      const collegeTraining = inv.collegeTrainingId ? inv.collegeTrainingId.toObject() : null;

      return {
        ...inv.toObject(),
        collegeTraining,
        tutorImprovement,
        failureAnalysis,
        correctiveAction,
        reInterviews
      };
    }));

    const total = formatted.length;
    const passed = formatted.filter(i => i.result === 'Passed').length;
    const failed = formatted.filter(i => i.result === 'Failed').length;
    const pending = formatted.filter(i => i.result === 'Pending').length;

    return res.json({
      success: true,
      data: {
        summary: { total, passed, failed, pending },
        interviews: formatted
      }
    });
  } catch (error) {
    console.error('getTutorInterviews error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/tutor/progress/interviews/:interviewId/improvement
 */
exports.saveTutorImprovementUpdate = async (req, res) => {
  try {
    const tutorId = req.user._id;
    const { interviewId } = req.params;
    const {
      improvementAction,
      topicsImproved,
      practiceCompleted,
      actionBasedOnFeedback,
      improvementStatus
    } = req.body;

    const interview = await TrainingInterview.findOne({ _id: interviewId, tutorId });
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview record not found or access denied.' });
    }

    const improvementUpdate = await TutorImprovementUpdate.findOneAndUpdate(
      { interviewId },
      {
        interviewId,
        tutorId,
        improvementAction: improvementAction ? improvementAction.trim() : '',
        topicsImproved: topicsImproved ? topicsImproved.trim() : '',
        practiceCompleted: practiceCompleted ? practiceCompleted.trim() : '',
        actionBasedOnFeedback: actionBasedOnFeedback ? actionBasedOnFeedback.trim() : '',
        improvementStatus: improvementStatus || 'In Progress',
        submittedAt: new Date()
      },
      { upsert: true, new: true }
    );

    // Create In-App Notification for Admins
    try {
      const admins = await User.find({ role: 'admin' });
      for (const admin of admins) {
        await notificationService.createInAppNotification(
          admin._id,
          `Tutor Improvement Update: ${req.user.name}`,
          `Tutor ${req.user.name} submitted an improvement update for ${interview.collegeName} - ${interview.trainingName}. Status: ${improvementStatus || 'In Progress'}`,
          'tutor_improvement',
          '/admin/tutor-improvements'
        );
      }
    } catch (notifErr) {
      console.error('Error creating admin notification for improvement update:', notifErr.message);
    }

    return res.json({
      success: true,
      message: 'Improvement update submitted successfully to Admin!',
      data: improvementUpdate
    });
  } catch (error) {
    console.error('saveTutorImprovementUpdate error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 7. POST /api/tutor/progress/interviews
 */
exports.createTrainingInterview = async (req, res) => {
  try {
    const tutorId = req.user._id;
    const { collegeName, trainingName, interviewDate, round, interviewer, result, score, feedback } = req.body;

    if (!collegeName || !trainingName) {
      return res.status(400).json({ success: false, message: 'College name and training name are required.' });
    }

    const interview = await TrainingInterview.create({
      tutorId,
      collegeName: collegeName.trim(),
      trainingName: trainingName.trim(),
      interviewDate: interviewDate || new Date().toISOString().split('T')[0],
      round: round || 'Technical Round',
      interviewer: interviewer || 'Senior Technical Lead',
      result: result || 'Pending',
      score: score || '85/100',
      feedback: feedback || ''
    });

    return res.json({ success: true, message: 'Interview record saved!', data: interview });
  } catch (error) {
    console.error('createTrainingInterview error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 8. POST /api/tutor/progress/interviews/:interviewId/failure-analysis
 */
exports.saveFailureAnalysis = async (req, res) => {
  try {
    const tutorId = req.user._id;
    const { interviewId } = req.params;
    const { failureReason, improvementPlan, topicsToImprove, practicePlanned, resourcesUsed, targetCompletionDate } = req.body;

    if (!failureReason || !improvementPlan) {
      return res.status(400).json({ success: false, message: 'Failure reason and improvement plan are required.' });
    }

    const analysis = await InterviewFailureAnalysis.findOneAndUpdate(
      { interviewId },
      {
        interviewId,
        tutorId,
        failureReason: failureReason.trim(),
        improvementPlan: improvementPlan.trim(),
        topicsToImprove: topicsToImprove || '',
        practicePlanned: practicePlanned || '',
        resourcesUsed: resourcesUsed || '',
        targetCompletionDate: targetCompletionDate || ''
      },
      { upsert: true, new: true }
    );

    return res.json({ success: true, message: 'Failure analysis recorded!', data: analysis });
  } catch (error) {
    console.error('saveFailureAnalysis error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 9. POST /api/tutor/progress/interviews/:interviewId/corrective-action
 */
exports.saveCorrectiveAction = async (req, res) => {
  try {
    const tutorId = req.user._id;
    const { interviewId } = req.params;
    const {
      failureAnalysisId, actionTaken, effectObserved, improvementObserved,
      confidenceLevel, technicalImprovement, communicationImprovement, trainingDeliveryImprovement, resultAfterImprovement
    } = req.body;

    if (!actionTaken) {
      return res.status(400).json({ success: false, message: 'Action taken is required.' });
    }

    const action = await InterviewCorrectiveAction.findOneAndUpdate(
      { interviewId },
      {
        failureAnalysisId,
        interviewId,
        tutorId,
        actionTaken: actionTaken.trim(),
        effectObserved: effectObserved || '',
        improvementObserved: improvementObserved || '',
        confidenceLevel: confidenceLevel || 4,
        technicalImprovement: technicalImprovement || 80,
        communicationImprovement: communicationImprovement || 80,
        trainingDeliveryImprovement: trainingDeliveryImprovement || 80,
        resultAfterImprovement: resultAfterImprovement || ''
      },
      { upsert: true, new: true }
    );

    return res.json({ success: true, message: 'Corrective action effect saved!', data: action });
  } catch (error) {
    console.error('saveCorrectiveAction error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 10. POST /api/tutor/progress/interviews/:interviewId/re-interview
 */
exports.scheduleReInterview = async (req, res) => {
  try {
    const tutorId = req.user._id;
    const { interviewId } = req.params;
    const { scheduledDate, result, feedback } = req.body;

    const reInv = await ReInterview.create({
      previousInterviewId: interviewId,
      tutorId,
      scheduledDate: scheduledDate || new Date().toISOString().split('T')[0],
      result: result || 'Pending',
      feedback: feedback || ''
    });

    if (result && result !== 'Pending') {
      await TrainingInterview.findByIdAndUpdate(interviewId, { result });
    }

    return res.json({ success: true, message: 'Re-interview logged successfully!', data: reInv });
  } catch (error) {
    console.error('scheduleReInterview error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 11. GET /api/tutor/progress/dashboard
 * Summary stats specifically for Tutor Dashboard cards.
 */
exports.getTutorProgressDashboard = async (req, res) => {
  try {
    const tutorId = req.user._id;

    // Latest Learning
    const latestLearning = await TutorLearning.findOne({ tutorId }).sort({ date: -1, createdAt: -1 });
    let latestTopicsCount = 0;
    if (latestLearning) {
      latestTopicsCount = await LearningTopic.countDocuments({ learningId: latestLearning._id });
    }

    // Active Project
    const activeProject = await TutorProject.findOne({ tutorId, status: { $ne: 'Completed' } }).sort({ updatedAt: -1 });

    // College Training
    const activeCollegeTraining = await CollegeTraining.findOne({ tutorId, status: 'ACTIVE' }).sort({ createdAt: -1 });
    const completedTrainingsCount = await CollegeTraining.countDocuments({ tutorId, status: 'COMPLETED' });

    // Interviews
    const interviews = await TrainingInterview.find({ tutorId });
    const interviewStats = {
      total: interviews.length,
      passed: interviews.filter(i => i.result === 'Passed').length,
      failed: interviews.filter(i => i.result === 'Failed').length,
      pending: interviews.filter(i => i.result === 'Pending').length
    };

    return res.json({
      success: true,
      data: {
        currentLearning: latestLearning ? {
          courseName: latestLearning.courseName,
          technology: latestLearning.technology,
          topicsCount: latestTopicsCount,
          date: latestLearning.date
        } : null,
        activeProject: activeProject ? {
          projectName: activeProject.projectName,
          progressPercentage: activeProject.progressPercentage,
          status: activeProject.status
        } : null,
        collegeTraining: activeCollegeTraining ? {
          collegeName: activeCollegeTraining.collegeName,
          trainingName: activeCollegeTraining.trainingName,
          batchName: activeCollegeTraining.batchName,
          currentDay: activeCollegeTraining.currentDay,
          totalDays: activeCollegeTraining.totalDays
        } : null,
        completedTrainingsCount,
        interviewStats
      }
    });
  } catch (error) {
    console.error('getTutorProgressDashboard error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
