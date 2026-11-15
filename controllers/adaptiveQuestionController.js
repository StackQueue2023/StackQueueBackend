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
const { getCourseCompilerEnvironment } = require('../utils/compilerEnvironmentDetector');
const { awardQuestionXpIdempotent } = require('../services/xpEngine');
const { evaluateCode } = require('../services/interviewCodeRunner');
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

    const env = getCourseCompilerEnvironment(course);

    // 1. Fetch all active questions for this course matching the required adaptive format
    // When compiler is available -> fetch coding questions.
    // When no compiler is available -> fetch MCQs.
    let questions = await InterviewQuestion.find({
      courseId,
      questionType: env.format,
      isActive: { $ne: false }
    })
      .sort({ questionNumber: 1, _id: 1 })
      .lean();

    // If no questions matching the required format exist yet, auto-seed them
    if (questions.length === 0) {
      await generateAdaptiveQuestionsForCourse(courseId, { force: true });
      questions = await InterviewQuestion.find({
        courseId,
        questionType: env.format,
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
      environment: env
    };

    if (safeQuestion.questionType === 'mcq') {
      // Ensure exactly four options are returned, NEVER WITH isCorrect or correctAnswer
      safeQuestion.options = (rawQ.options || []).map(opt => ({
        optionId: opt.optionId,
        text: opt.text
      }));
    } else {
      // Coding Question Details
      safeQuestion.inputFormat = rawQ.inputFormat || '';
      safeQuestion.outputFormat = rawQ.outputFormat || '';
      safeQuestion.constraints = rawQ.constraints || '';
      safeQuestion.examples = rawQ.examples || [];
      safeQuestion.starterCode = rawQ.starterCode || {};
      safeQuestion.programmingLanguage = rawQ.programmingLanguage || env.language || 'java';
      safeQuestion.compiler = rawQ.compiler || env.compilerName;
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
