/**
 * STACK QUEUE — Adaptive Question System & Evaluation Controller
 * 
 * Enforces:
 * 1. Automatic format selection (Compiler -> Coding, No Compiler -> 4-Option MCQ)
 * 2. One question at a time
 * 3. Immediate answer evaluation ("Correct Answer!" vs "Wrong Answer!")
 * 4. Never reveal correct answer or explanation to students on wrong submission
 * 5. Secure database-backed points with idempotent unique tracking
 * 6. Admin question management (coding & MCQ separated, preview 4 options, explanations, stats)
 */

const mongoose = require('mongoose');
const Course = require('../models/Course');
const InterviewQuestion = require('../models/InterviewQuestion');
const InterviewTestCase = require('../models/InterviewTestCase');
const AdaptiveQuestionSubmission = require('../models/AdaptiveQuestionSubmission');
const StudentProfile = require('../models/StudentProfile');
const User = require('../models/User');
const CourseEnvironmentConfig = require('../models/CourseEnvironmentConfig');
const WorkspaceState = require('../models/WorkspaceState');
const { getCourseCompilerEnvironment } = require('../utils/compilerEnvironmentDetector');
const { awardQuestionXpIdempotent } = require('../services/xpEngine');
const { evaluateCode } = require('../services/interviewCodeRunner');
const { evaluatePracticalWorkspace } = require('../services/practicalValidationEngine');
const { evaluateNonCodingQuestion, runAccuracyTestBattery } = require('../services/nonCodingEvaluationEngine');
const { generateAdaptiveQuestionsForCourse } = require('../services/adaptiveQuestionGeneratorService');
const { allocateQuestionNumbers } = require('../services/questionNumberAllocator');

/**
 * ─────────────────────────────────────────────────────────────
 * STUDENT: GET CURRENT QUESTION (ONE QUESTION AT A TIME)
 * ─────────────────────────────────────────────────────────────
 */
exports.getCurrentQuestionForCourse = async (req, res) => {
  try {
    const studentUserId = req.user._id;
    const { courseId } = req.params;

    const course = await Course.findById(courseId).lean();
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const courseEnvConfig = await CourseEnvironmentConfig.findOne({ courseId }).lean();
    const env = getCourseCompilerEnvironment(course);
    if (courseEnvConfig) {
      env.classification = courseEnvConfig.classification;
      env.environmentType = courseEnvConfig.environmentType;
      env.environmentName = courseEnvConfig.environmentName;
      env.compilerLanguage = courseEnvConfig.compilerLanguage || env.language;
      env.supportedLanguages = courseEnvConfig.supportedLanguages || [env.language];
      env.workspaceTools = courseEnvConfig.workspaceTools || [];
      env.validationStrategy = courseEnvConfig.validationStrategy;
    }

    // 1. Fetch all active questions for this course
    let queryFilter = {
      courseId,
      isActive: { $ne: false }
    };

    if (courseEnvConfig?.classification === 'non-coding') {
      queryFilter.questionType = { $in: ['practical', 'mcq'] };
    } else if (courseEnvConfig?.classification === 'coding') {
      queryFilter.questionType = { $in: ['coding', 'mcq'] };
    }

    let questions = await InterviewQuestion.find(queryFilter)
      .sort({ questionNumber: 1, _id: 1 })
      .lean();

    // If no questions matching the required format exist yet, auto-seed them
    if (questions.length === 0) {
      await generateAdaptiveQuestionsForCourse(courseId, { force: true });
      questions = await InterviewQuestion.find({
        courseId,
        isActive: { $ne: false }
      })
        .sort({ questionNumber: 1, _id: 1 })
        .lean();
    }

    // 2. Fetch all completed submissions by this student for this course
    const completedSubmissions = await AdaptiveQuestionSubmission.find({
      studentId: studentUserId,
      courseId
    }).lean();

    const submittedQIdSet = new Set(completedSubmissions.map(s => String(s.questionId)));

    // 3. Find the FIRST unanswered question (ONE QUESTION AT A TIME)
    const currentQIndex = questions.findIndex(q => !submittedQIdSet.has(String(q._id)));

    // Fetch student's current total points / XP
    const profile = await StudentProfile.findOne({ userId: studentUserId }).select('totalXp stats').lean();
    const studentTotalPoints = profile?.totalXp || 0;

    // 4. If all questions are completed, return comprehensive completion summary
    if (currentQIndex === -1 && questions.length > 0) {
      const totalQuestions = questions.length;
      const totalAttempted = completedSubmissions.length;
      const correctCount = completedSubmissions.filter(s => s.isCorrect).length;
      const wrongCount = completedSubmissions.filter(s => !s.isCorrect).length;
      const totalPointsEarned = completedSubmissions.reduce((sum, s) => sum + (s.pointsAwarded || 0), 0);
      const accuracyPercent = totalAttempted > 0 ? Math.round((correctCount / totalAttempted) * 100) : 0;

      return res.json({
        success: true,
        completed: true,
        courseTitle: course.title,
        courseId: course._id,
        environment: env,
        totalQuestions,
        totalAttempted,
        correctCount,
        wrongCount,
        totalPointsEarned,
        accuracyPercent,
        studentTotalPoints
      });
    }

    // 5. Package current question with strict security (NEVER SEND CORRECT ANSWER OR EXPLANATION)
    const rawQ = questions[currentQIndex];

    const safeQuestion = {
      _id: rawQ._id,
      questionNumber: rawQ.questionNumber,
      title: rawQ.title,
      problemStatement: rawQ.problemStatement,
      questionType: rawQ.questionType || env.format,
      difficulty: rawQ.difficulty || 'Easy',
      points: rawQ.points || rawQ.xp || 10,
      topic: rawQ.topic || course.title,
      domain: rawQ.domain || course.domain,
      environment: env,
      environmentType: rawQ.environmentType || courseEnvConfig?.environmentType || env.environmentType || 'frontend_web',
      classification: courseEnvConfig?.classification || 'hybrid'
    };

    if (safeQuestion.questionType === 'mcq') {
      // Ensure exactly four options are returned, NEVER WITH isCorrect or correctAnswer
      safeQuestion.options = (rawQ.options || []).map(opt => ({
        optionId: opt.optionId,
        text: opt.text
      }));
    } else if (safeQuestion.questionType === 'practical') {
      safeQuestion.rubric = rawQ.rubric || {};
      safeQuestion.environmentType = rawQ.environmentType || courseEnvConfig?.environmentType || 'generic';
      safeQuestion.workspaceTools = courseEnvConfig?.workspaceTools || [];

      // Auto-fetch saved workspace state for continuous persistence
      const savedState = await WorkspaceState.findOne({
        userId: studentUserId,
        courseId,
        questionId: rawQ._id
      }).lean();
      safeQuestion.savedWorkspaceState = savedState?.stateData || null;
      safeQuestion.lastExecutionResult = savedState?.lastExecutionResult || null;
    } else if (['descriptive', 'scenario', 'conceptual', 'objective', 'subjective_rubric'].includes(safeQuestion.questionType)) {
      // Non-Coding Evaluation Details (without leaking expected answers or anti-concepts)
      safeQuestion.evaluationMethod = rawQ.evaluationMethod || rawQ.questionType;
      safeQuestion.maxMarks = rawQ.maxMarks || rawQ.points || 10;
      safeQuestion.passingThreshold = rawQ.passingThreshold || 70;
      safeQuestion.reviewMode = rawQ.reviewMode || 'automatic';
      safeQuestion.evaluationRubric = (rawQ.evaluationRubric && rawQ.evaluationRubric.length > 0)
        ? rawQ.evaluationRubric.map(r => ({
            criterion: r.criterion,
            maxScore: r.maxScore,
            description: r.description
          }))
        : [];

      // Auto-fetch saved text answer or previous attempt
      const savedState = await WorkspaceState.findOne({
        userId: studentUserId,
        courseId,
        questionId: rawQ._id
      }).lean();
      safeQuestion.savedAnswer = savedState?.stateData?.submittedAnswer || '';
      safeQuestion.savedScenario = savedState?.stateData?.scenarioResponse || null;
      safeQuestion.lastExecutionResult = savedState?.lastExecutionResult || null;
    } else {
      // Coding Question Details
      safeQuestion.inputFormat = rawQ.inputFormat || '';
      safeQuestion.outputFormat = rawQ.outputFormat || '';
      safeQuestion.constraints = rawQ.constraints || '';
      safeQuestion.examples = rawQ.examples || [];
      safeQuestion.starterCode = rawQ.starterCode || {};
      safeQuestion.programmingLanguage = rawQ.programmingLanguage || env.compilerLanguage || env.language || 'java';
      safeQuestion.compiler = rawQ.compiler || env.compilerName;

      // Auto-fetch saved code from WorkspaceState if present
      const savedState = await WorkspaceState.findOne({
        userId: studentUserId,
        courseId,
        questionId: rawQ._id
      }).lean();
      if (savedState?.stateData?.code) {
        safeQuestion.savedCode = savedState.stateData.code;
      }
    }

    return res.json({
      success: true,
      completed: false,
      courseTitle: course.title,
      courseId: course._id,
      environment: env,
      questionIndex: currentQIndex + 1,
      totalQuestions: questions.length,
      studentTotalPoints,
      question: safeQuestion
    });
  } catch (err) {
    console.error('[getCurrentQuestionForCourse] Error:', err);
    return res.status(500).json({ success: false, message: 'Server error retrieving current question' });
  }
};

/**
 * ─────────────────────────────────────────────────────────────
 * STUDENT: SUBMIT MCQ ANSWER WITH IMMEDIATE EVALUATION
 * ─────────────────────────────────────────────────────────────
 */
exports.submitMcqAnswer = async (req, res) => {
  try {
    const studentUserId = req.user._id;
    const { courseId, questionId, selectedOption } = req.body;

    if (!courseId || !questionId || !selectedOption) {
      return res.status(400).json({
        success: false,
        message: 'courseId, questionId, and selectedOption are required.'
      });
    }

    const cleanOption = String(selectedOption).trim().toUpperCase();
    if (!['A', 'B', 'C', 'D'].includes(cleanOption)) {
      return res.status(400).json({
        success: false,
        message: 'selectedOption must be one of A, B, C, or D.'
      });
    }

    // 1. Prevent duplicate submission (idempotency check)
    const existingSubmission = await AdaptiveQuestionSubmission.findOne({
      studentId: studentUserId,
      courseId,
      questionId
    });

    if (existingSubmission) {
      return res.status(409).json({
        success: false,
        message: 'Question has already been submitted and evaluated. No multiple submissions permitted.',
        isCorrect: existingSubmission.isCorrect,
        pointsAwarded: 0
      });
    }

    // 2. Fetch question securely with correctAnswer
    const question = await InterviewQuestion.findById(questionId);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    if (question.questionType !== 'mcq') {
      return res.status(400).json({ success: false, message: 'This question is not an MCQ.' });
    }

    // 3. Immediate backend evaluation
    const isCorrect = (String(question.correctAnswer).trim().toUpperCase() === cleanOption);
    const configuredPoints = Number(question.points) || 10;
    const pointsToAward = isCorrect ? configuredPoints : 0;

    // 4. Save submission record in database
    const submission = await AdaptiveQuestionSubmission.create({
      studentId: studentUserId,
      courseId,
      questionId,
      questionType: 'mcq',
      selectedOption: cleanOption,
      isCorrect,
      pointsAwarded: pointsToAward,
      attemptNumber: 1,
      evaluatedAt: new Date()
    });

    let newTotalPoints = 0;

    // 5. Award points if correct (using idempotent XP engine)
    if (isCorrect) {
      const xpResult = await awardQuestionXpIdempotent({
        studentUserId,
        questionId: question._id,
        feature: 'ADAPTIVE_MCQ',
        amount: pointsToAward,
        reason: 'adaptive_mcq_solved',
        description: `Solved MCQ: ${question.title}`
      });
      newTotalPoints = xpResult.totalXp;
    } else {
      const profile = await StudentProfile.findOne({ userId: studentUserId }).select('totalXp').lean();
      newTotalPoints = profile?.totalXp || 0;
    }

    // 6. Return response
    // IMPORTANT REQUIREMENT:
    // "Never display the correct answer after a wrong submission. The student should only see whether the selected answer was correct or wrong."
    if (isCorrect) {
      return res.json({
        success: true,
        isCorrect: true,
        message: 'Correct Answer!',
        pointsAwarded: pointsToAward,
        totalPoints: newTotalPoints
      });
    } else {
      return res.json({
        success: true,
        isCorrect: false,
        message: 'Wrong Answer!',
        pointsAwarded: 0,
        totalPoints: newTotalPoints
        // Notice: NO correctAnswer, NO explanation, NO reveal of correct option!
      });
    }
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate submission detected. Points are awarded only once.'
      });
    }
    console.error('[submitMcqAnswer] Error:', err);
    return res.status(500).json({ success: false, message: 'Server error evaluating answer' });
  }
};

/**
 * ─────────────────────────────────────────────────────────────
 * STUDENT: SUBMIT CODING SOLUTION (FOR COMPILER COURSES)
 * ─────────────────────────────────────────────────────────────
 */
exports.submitCodingSolution = async (req, res) => {
  try {
    const studentUserId = req.user._id;
    const { courseId, questionId, code, language = 'java' } = req.body;

    if (!courseId || !questionId || !code) {
      return res.status(400).json({
        success: false,
        message: 'courseId, questionId, and code are required.'
      });
    }

    const question = await InterviewQuestion.findById(questionId);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    // 1. Check if already solved
    const existingSolved = await AdaptiveQuestionSubmission.findOne({
      studentId: studentUserId,
      courseId,
      questionId,
      isCorrect: true
    });

    if (existingSolved) {
      return res.status(409).json({
        success: false,
        message: 'Coding problem has already been solved and awarded points.',
        pointsAwarded: 0
      });
    }

    // 2. Fetch test cases (including hidden test cases)
    const testCases = await InterviewTestCase.find({ questionId: question._id }).lean();

    // 3. Evaluate code via execution engine
    const evaluation = await evaluateCode({
      language,
      code,
      testCases: testCases.map(tc => ({
        input: tc.input || '',
        expectedOutput: tc.expectedOutput || '',
        isHidden: tc.isHidden || false
      }))
    });

    const isCorrect = (evaluation.allPassed === true);
    const configuredPoints = Number(question.points) || Number(question.xp) || 15;
    const pointsToAward = isCorrect ? configuredPoints : 0;

    // 4. Record submission in database
    await AdaptiveQuestionSubmission.findOneAndUpdate(
      { studentId: studentUserId, courseId, questionId },
      {
        $set: {
          questionType: 'coding',
          submittedCode: code,
          language,
          isCorrect,
          pointsAwarded: pointsToAward,
          evaluatedAt: new Date()
        },
        $inc: { attemptNumber: 1 }
      },
      { upsert: true, new: true }
    );

    let newTotalPoints = 0;
    if (isCorrect) {
      const xpResult = await awardQuestionXpIdempotent({
        studentUserId,
        questionId: question._id,
        feature: 'ADAPTIVE_CODING',
        amount: pointsToAward,
        reason: 'adaptive_coding_solved',
        description: `Solved Coding Problem: ${question.title}`
      });
      newTotalPoints = xpResult.totalXp;
    } else {
      const profile = await StudentProfile.findOne({ userId: studentUserId }).select('totalXp').lean();
      newTotalPoints = profile?.totalXp || 0;
    }

    if (isCorrect) {
      return res.json({
        success: true,
        isCorrect: true,
        message: 'Correct Answer! All test cases passed.',
        pointsAwarded: pointsToAward,
        totalPoints: newTotalPoints,
        evaluation
      });
    } else {
      return res.json({
        success: true,
        isCorrect: false,
        message: 'Wrong Answer!',
        pointsAwarded: 0,
        totalPoints: newTotalPoints,
        evaluation: {
          allPassed: false,
          passedTests: evaluation.passedTests || 0,
          totalTests: evaluation.totalTests || 1,
          error: evaluation.error || 'Test case verification failed'
        }
      });
    }
  } catch (err) {
    console.error('[submitCodingSolution] Error:', err);
    return res.status(500).json({ success: false, message: 'Server error evaluating code solution' });
  }
};

/**
 * ─────────────────────────────────────────────────────────────
 * STUDENT: SUBMIT PRACTICAL WORKSPACE SOLUTION
 * Evaluates non-coding and hybrid domain submissions
 * (UI/UX, 3D CAD, Cloud Topology, QA Testing, RPA, Analytics, Cyber)
 * ─────────────────────────────────────────────────────────────
 */
exports.submitPracticalSolution = async (req, res) => {
  try {
    const studentUserId = req.user._id;
    const { courseId, questionId, environmentType, stateData } = req.body;

    if (!courseId || !questionId) {
      return res.status(400).json({ success: false, message: 'Missing courseId or questionId' });
    }

    const question = await InterviewQuestion.findById(questionId).lean();
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    // 1. Check if already solved
    const existingSolved = await AdaptiveQuestionSubmission.findOne({
      studentId: studentUserId,
      courseId,
      questionId,
      isCorrect: true
    });

    if (existingSolved) {
      return res.status(409).json({
        success: false,
        message: 'Practical task has already been solved and awarded points.',
        pointsAwarded: 0
      });
    }

    // 2. Evaluate workspace stateData using practicalValidationEngine
    const targetEnv = environmentType || question.environmentType || 'generic';
    const rubric = question.rubric || {};
    const evalResult = evaluatePracticalWorkspace(targetEnv, stateData, rubric);

    const isCorrect = (evalResult.passed === true);
    const configuredPoints = Number(question.points) || Number(question.xp) || 20;
    const pointsToAward = isCorrect ? configuredPoints : 0;

    // 3. Persist workspace state & submission in DB
    await WorkspaceState.findOneAndUpdate(
      { userId: studentUserId, courseId, questionId },
      {
        userId: studentUserId,
        courseId,
        questionId,
        environmentType: targetEnv,
        stateData: stateData || {},
        lastExecutedAt: new Date(),
        lastExecutionResult: evalResult,
        isCompleted: isCorrect,
        completedAt: isCorrect ? new Date() : null
      },
      { upsert: true, new: true }
    );

    await AdaptiveQuestionSubmission.findOneAndUpdate(
      { studentId: studentUserId, courseId, questionId },
      {
        $set: {
          questionType: 'practical',
          stateData,
          evaluationResult: evalResult,
          isCorrect,
          pointsAwarded: pointsToAward,
          evaluatedAt: new Date()
        },
        $inc: { attemptNumber: 1 }
      },
      { upsert: true, new: true }
    );

    let newTotalPoints = 0;
    if (isCorrect) {
      const xpResult = await awardQuestionXpIdempotent({
        studentUserId,
        questionId: question._id,
        feature: 'ADAPTIVE_PRACTICAL',
        amount: pointsToAward,
        reason: 'adaptive_practical_solved',
        description: `Completed Practical Challenge: ${question.title}`
      });
      newTotalPoints = xpResult.totalXp;
    } else {
      const profile = await StudentProfile.findOne({ userId: studentUserId }).select('totalXp').lean();
      newTotalPoints = profile?.totalXp || 0;
    }

    return res.json({
      success: true,
      isCorrect,
      score: evalResult.score,
      maxScore: evalResult.maxScore,
      message: evalResult.feedback,
      checks: evalResult.checks,
      pointsAwarded: pointsToAward,
      totalPoints: newTotalPoints
    });
  } catch (err) {
    console.error('[submitPracticalSolution] Error:', err);
    return res.status(500).json({ success: false, message: 'Server error evaluating practical solution' });
  }
};

/**
 * ─────────────────────────────────────────────────────────────
 * STUDENT: SUBMIT NON-CODING ANSWER (DESCRIPTIVE, SCENARIO, OBJECTIVE, SUBJECTIVE)
 * Evaluates semantic understanding, concepts, factual accuracy, and rubrics
 * ─────────────────────────────────────────────────────────────
 */
exports.submitNonCodingAnswer = async (req, res) => {
  try {
    const studentUserId = req.user._id;
    const { courseId, questionId, submittedAnswer, scenarioResponse } = req.body;

    if (!courseId || !questionId) {
      return res.status(400).json({ success: false, message: 'Missing courseId or questionId' });
    }

    const question = await InterviewQuestion.findById(questionId).lean();
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    // 1. Check if already solved and points awarded
    const existingSolved = await AdaptiveQuestionSubmission.findOne({
      studentId: studentUserId,
      courseId,
      questionId,
      evaluationStatus: 'Passed'
    });

    if (existingSolved) {
      return res.status(409).json({
        success: false,
        message: 'Question has already been completed and points awarded.',
        pointsAwarded: 0
      });
    }

    // 2. Prepare submission payload
    const submissionPayload = scenarioResponse || submittedAnswer || '';

    // 3. Evaluate using dedicated nonCodingEvaluationEngine
    const evalResult = evaluateNonCodingQuestion(submissionPayload, question);

    const isPassed = (evalResult.status === 'Passed');
    const configuredPoints = Number(question.points) || Number(question.maxMarks) || 10;
    const pointsToAward = isPassed ? configuredPoints : 0;

    // 4. Save working state to WorkspaceState
    await WorkspaceState.findOneAndUpdate(
      { userId: studentUserId, courseId, questionId },
      {
        userId: studentUserId,
        courseId,
        questionId,
        environmentType: question.environmentType || 'non_coding',
        stateData: { submittedAnswer, scenarioResponse },
        lastExecutedAt: new Date(),
        lastExecutionResult: evalResult,
        isCompleted: isPassed,
        completedAt: isPassed ? new Date() : null
      },
      { upsert: true, new: true }
    );

    // 5. Record submission in AdaptiveQuestionSubmission
    await AdaptiveQuestionSubmission.findOneAndUpdate(
      { studentId: studentUserId, courseId, questionId },
      {
        $set: {
          questionType: question.questionType || 'descriptive',
          submittedAnswer: typeof submittedAnswer === 'string' ? submittedAnswer : '',
          scenarioResponse: typeof scenarioResponse === 'object' ? scenarioResponse : {},
          evaluationStatus: evalResult.status,
          marksAwarded: evalResult.marksAwarded,
          maxMarks: evalResult.maxMarks,
          percentage: evalResult.percentage,
          feedback: evalResult.feedback,
          missingConcepts: evalResult.missingConcepts || [],
          identifiedConcepts: evalResult.identifiedConcepts || [],
          correctionGuidance: evalResult.correctionGuidance || '',
          evaluationEvidence: evalResult.evaluationEvidence || {},
          isCorrect: isPassed,
          pointsAwarded: pointsToAward,
          evaluatedAt: new Date(),
          retryAllowed: !isPassed
        },
        $inc: { attemptNumber: 1 }
      },
      { upsert: true, new: true }
    );

    let newTotalPoints = 0;
    if (isPassed) {
      const xpResult = await awardQuestionXpIdempotent({
        studentUserId,
        questionId: question._id,
        feature: 'ADAPTIVE_NON_CODING',
        amount: pointsToAward,
        reason: 'adaptive_non_coding_passed',
        description: `Passed Non-Coding Assessment: ${question.title}`
      });
      newTotalPoints = xpResult.totalXp;
    } else {
      const profile = await StudentProfile.findOne({ userId: studentUserId }).select('totalXp').lean();
      newTotalPoints = profile?.totalXp || 0;
    }

    return res.json({
      success: true,
      status: evalResult.status,
      isCorrect: isPassed,
      marksAwarded: evalResult.marksAwarded,
      maxMarks: evalResult.maxMarks,
      percentage: evalResult.percentage,
      message: evalResult.feedback,
      feedback: evalResult.feedback,
      missingConcepts: evalResult.missingConcepts,
      identifiedConcepts: evalResult.identifiedConcepts,
      correctionGuidance: evalResult.correctionGuidance,
      evaluationEvidence: evalResult.evaluationEvidence,
      pointsAwarded: pointsToAward,
      totalPoints: newTotalPoints,
      retryAllowed: !isPassed
    });
  } catch (err) {
    console.error('[submitNonCodingAnswer] Error:', err);
    return res.status(500).json({ success: false, message: 'Server error evaluating non-coding answer' });
  }
};

/**
 * ─────────────────────────────────────────────────────────────
 * ADMIN: RUN 6-CASE ACCURACY TEST BATTERY ON QUESTION CONFIG
 * ─────────────────────────────────────────────────────────────
 */
exports.adminRunAccuracyTestBattery = async (req, res) => {
  try {
    const { questionId } = req.params;
    const question = await InterviewQuestion.findById(questionId).lean();
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    const testResults = runAccuracyTestBattery(question);

    await InterviewQuestion.findByIdAndUpdate(questionId, {
      testBatteryResults: testResults,
      isVerifiedForPublish: testResults.allPassed
    });

    return res.json({
      success: true,
      results: testResults
    });
  } catch (err) {
    console.error('[adminRunAccuracyTestBattery] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to run accuracy test battery' });
  }
};

/**
 * ─────────────────────────────────────────────────────────────
 * ADMIN: GET PENDING INSTRUCTOR REVIEWS
 * ─────────────────────────────────────────────────────────────
 */
exports.adminGetPendingReviews = async (req, res) => {
  try {
    const pendingSubmissions = await AdaptiveQuestionSubmission.find({
      evaluationStatus: 'Instructor Review Required'
    })
      .populate('studentId', 'name email rollNumber')
      .populate('questionId', 'title questionNumber courseId rubric maxMarks expectedAnswer')
      .sort({ updatedAt: -1 })
      .lean();

    return res.json({
      success: true,
      submissions: pendingSubmissions
    });
  } catch (err) {
    console.error('[adminGetPendingReviews] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch pending reviews' });
  }
};

/**
 * ─────────────────────────────────────────────────────────────
 * ADMIN: OVERRIDE INSTRUCTOR REVIEW RESULT
 * ─────────────────────────────────────────────────────────────
 */
exports.adminOverrideReview = async (req, res) => {
  try {
    const adminUserId = req.user._id;
    const { submissionId, overrideStatus, overrideMarks, reason } = req.body;

    if (!submissionId || !overrideStatus) {
      return res.status(400).json({ success: false, message: 'Missing submissionId or overrideStatus' });
    }

    const submission = await AdaptiveQuestionSubmission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    const isPassed = (overrideStatus === 'Passed');
    const marks = Number(overrideMarks !== undefined ? overrideMarks : (isPassed ? submission.maxMarks : 0));

    submission.evaluationStatus = overrideStatus;
    submission.marksAwarded = marks;
    submission.isCorrect = isPassed;
    submission.pointsAwarded = isPassed ? marks : 0;
    submission.retryAllowed = !isPassed;
    submission.instructorReview = {
      reviewedBy: adminUserId,
      reviewedAt: new Date(),
      overrideMarks: marks,
      overrideStatus,
      reason: reason || 'Instructor manual evaluation override'
    };
    await submission.save();

    // If passed, award XP to student and update workspace
    if (isPassed) {
      await awardQuestionXpIdempotent({
        studentUserId: submission.studentId,
        questionId: submission.questionId,
        feature: 'ADAPTIVE_INSTRUCTOR_OVERRIDE',
        amount: marks,
        reason: 'instructor_override_passed',
        description: `Passed via Instructor Review Override: Reason: ${reason}`
      });

      await WorkspaceState.findOneAndUpdate(
        { userId: submission.studentId, courseId: submission.courseId, questionId: submission.questionId },
        { isCompleted: true, completedAt: new Date() }
      );
    }

    return res.json({
      success: true,
      message: `Review successfully updated to ${overrideStatus}.`,
      submission
    });
  } catch (err) {
    console.error('[adminOverrideReview] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to override review' });
  }
};

/**
 * ─────────────────────────────────────────────────────────────
 * ADMIN: UPDATE NON-CODING QUESTION EVALUATION CONFIGURATION
 * ─────────────────────────────────────────────────────────────
 */
exports.adminUpdateEvaluationConfig = async (req, res) => {
  try {
    const { questionId } = req.params;
    const {
      expectedAnswer,
      explanation,
      mandatoryConcepts,
      acceptedAlternatives,
      negativeConcepts,
      requiredOutcomes,
      evaluationRubric,
      maxMarks,
      passingThreshold,
      reviewMode,
      evaluationMethod
    } = req.body;

    const updated = await InterviewQuestion.findByIdAndUpdate(
      questionId,
      {
        expectedAnswer,
        explanation,
        mandatoryConcepts,
        acceptedAlternatives,
        negativeConcepts,
        requiredOutcomes,
        evaluationRubric,
        maxMarks: Number(maxMarks) || 10,
        passingThreshold: Number(passingThreshold) || 70,
        reviewMode: reviewMode || 'automatic',
        evaluationMethod: evaluationMethod || 'descriptive',
        updatedBy: req.user._id
      },
      { new: true }
    );

    return res.json({
      success: true,
      message: 'Question evaluation configuration saved.',
      question: updated
    });
  } catch (err) {
    console.error('[adminUpdateEvaluationConfig] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update evaluation configuration' });
  }
};

/**
 * ─────────────────────────────────────────────────────────────
 * ADMIN: GET QUESTIONS WITH CODING & MCQ SEPARATION
 * ─────────────────────────────────────────────────────────────
 */
exports.adminGetQuestions = async (req, res) => {
  try {
    const { courseId, questionType, difficulty, search, page = 1, limit = 50 } = req.query;

    const filter = { isActive: { $ne: false } };

    if (courseId && courseId !== 'all') {
      filter.courseId = courseId;
    }

    if (questionType && questionType !== 'all') {
      filter.questionType = questionType;
    }

    if (difficulty && difficulty !== 'all') {
      filter.difficulty = difficulty;
    }

    if (search && search.trim()) {
      const qRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { title: qRegex },
        { problemStatement: qRegex },
        { topic: qRegex }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [questions, totalCount, codingCount, mcqCount] = await Promise.all([
      InterviewQuestion.find(filter)
        .populate('courseId', 'title domain category hasCompiler executionEnvironment')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      InterviewQuestion.countDocuments(filter),
      InterviewQuestion.countDocuments({ ...filter, questionType: 'coding' }),
      InterviewQuestion.countDocuments({ ...filter, questionType: 'mcq' })
    ]);

    return res.json({
      success: true,
      questions,
      totalCount,
      counts: {
        total: totalCount,
        coding: codingCount,
        mcq: mcqCount
      },
      page: Number(page),
      totalPages: Math.ceil(totalCount / Number(limit))
    });
  } catch (err) {
    console.error('[adminGetQuestions] Error:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching questions' });
  }
};

/**
 * ─────────────────────────────────────────────────────────────
 * ADMIN: CREATE OR EDIT QUESTION (MCQ OR CODING)
 * ─────────────────────────────────────────────────────────────
 */
exports.adminSaveQuestion = async (req, res) => {
  try {
    const {
      _id,
      courseId,
      questionType = 'mcq',
      title,
      problemStatement,
      options,
      correctAnswer,
      explanation,
      difficulty = 'Easy',
      points = 10,
      topic = 'General',
      // Coding specific fields:
      inputFormat,
      outputFormat,
      constraints,
      referenceSolution,
      programmingLanguage,
      compiler
    } = req.body;

    if (!title || !problemStatement) {
      return res.status(400).json({ success: false, message: 'Title and problem statement are required.' });
    }

    // Validation for MCQ
    if (questionType === 'mcq') {
      if (!Array.isArray(options) || options.length !== 4) {
        return res.status(400).json({
          success: false,
          message: 'Every MCQ must have exactly four options (A, B, C, D).'
        });
      }
      if (!['A', 'B', 'C', 'D'].includes(String(correctAnswer).toUpperCase())) {
        return res.status(400).json({
          success: false,
          message: 'Correct answer must be one of A, B, C, or D.'
        });
      }
    }

    let questionDoc;

    if (_id) {
      // Update existing question
      questionDoc = await InterviewQuestion.findById(_id);
      if (!questionDoc) {
        return res.status(404).json({ success: false, message: 'Question not found' });
      }

      questionDoc.title = title;
      questionDoc.problemStatement = problemStatement;
      questionDoc.questionType = questionType;
      questionDoc.difficulty = difficulty;
      questionDoc.points = Number(points) || 10;
      questionDoc.topic = topic;
      if (courseId) questionDoc.courseId = courseId;

      if (questionType === 'mcq') {
        questionDoc.options = options.map((opt, idx) => ({
          optionId: ['A', 'B', 'C', 'D'][idx],
          text: String(opt.text || opt).trim()
        }));
        questionDoc.correctAnswer = String(correctAnswer).toUpperCase();
        questionDoc.explanation = explanation || '';
      } else {
        questionDoc.inputFormat = inputFormat || '';
        questionDoc.outputFormat = outputFormat || '';
        questionDoc.constraints = constraints || '';
        questionDoc.referenceSolution = referenceSolution || '';
        if (programmingLanguage) questionDoc.programmingLanguage = programmingLanguage;
        if (compiler) questionDoc.compiler = compiler;
      }

      await questionDoc.save();
    } else {
      // Create new question
      const [qNum] = await allocateQuestionNumbers(1);

      const newQData = {
        questionNumber: qNum,
        courseId,
        questionType,
        title,
        problemStatement,
        difficulty,
        points: Number(points) || 10,
        topic,
        verificationStatus: 'verified',
        isActive: true
      };

      if (questionType === 'mcq') {
        newQData.options = options.map((opt, idx) => ({
          optionId: ['A', 'B', 'C', 'D'][idx],
          text: String(opt.text || opt).trim()
        }));
        newQData.correctAnswer = String(correctAnswer).toUpperCase();
        newQData.explanation = explanation || '';
      } else {
        newQData.inputFormat = inputFormat || '';
        newQData.outputFormat = outputFormat || '';
        newQData.constraints = constraints || '';
        newQData.referenceSolution = referenceSolution || '';
        newQData.programmingLanguage = programmingLanguage || 'java';
        newQData.compiler = compiler || 'Java (JDK 22)';
      }

      questionDoc = await InterviewQuestion.create(newQData);
    }

    return res.json({
      success: true,
      message: _id ? 'Question updated successfully' : 'Question created successfully',
      question: questionDoc
    });
  } catch (err) {
    console.error('[adminSaveQuestion] Error:', err);
    return res.status(500).json({ success: false, message: 'Server error saving question: ' + err.message });
  }
};

/**
 * ─────────────────────────────────────────────────────────────
 * ADMIN: TRIGGER ADAPTIVE QUESTION GENERATION FOR COURSE
 * ─────────────────────────────────────────────────────────────
 */
exports.adminGenerateCourseQuestions = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { force = false } = req.body;

    const result = await generateAdaptiveQuestionsForCourse(courseId, { force });
    return res.json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (err) {
    console.error('[adminGenerateCourseQuestions] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate questions: ' + err.message });
  }
};

/**
 * ─────────────────────────────────────────────────────────────
 * ADMIN: VIEW STUDENT PERFORMANCE AND QUESTION-WISE RESULTS
 * ─────────────────────────────────────────────────────────────
 */
exports.adminGetStudentResults = async (req, res) => {
  try {
    const { courseId, questionId, studentId } = req.query;

    const filter = {};
    if (courseId) filter.courseId = courseId;
    if (questionId) filter.questionId = questionId;
    if (studentId) filter.studentId = studentId;

    const submissions = await AdaptiveQuestionSubmission.find(filter)
      .populate('studentId', 'name email username studentId')
      .populate('courseId', 'title domain')
      .populate('questionId', 'title questionNumber questionType points correctAnswer')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const totalSubmissions = await AdaptiveQuestionSubmission.countDocuments(filter);
    const correctCount = await AdaptiveQuestionSubmission.countDocuments({ ...filter, isCorrect: true });
    const wrongCount = await AdaptiveQuestionSubmission.countDocuments({ ...filter, isCorrect: false });

    return res.json({
      success: true,
      submissions,
      summary: {
        total: totalSubmissions,
        correct: correctCount,
        wrong: wrongCount,
        accuracyPercent: totalSubmissions > 0 ? Math.round((correctCount / totalSubmissions) * 100) : 0
      }
    });
  } catch (err) {
    console.error('[adminGetStudentResults] Error:', err);
    return res.status(500).json({ success: false, message: 'Server error retrieving student results' });
  }
};
