const InterviewQuestion = require('../models/InterviewQuestion');
const InterviewTestCase = require('../models/InterviewTestCase');
const InterviewSubmission = require('../models/InterviewSubmission');
const Challenge = require('../models/Challenge');
const DomainTask = require('../models/DomainTask');
const QuestionRegistry = require('../models/QuestionRegistry');

/**
 * @desc Get all interview questions for admin with test case counts
 * @route GET /api/interview/admin/questions
 * @access Admin
 */
exports.getAllQuestions = async (req, res) => {
  try {
    const { level, category, difficulty, domain, targetFeature, verificationStatus, search } = req.query;
    const filter = {};

    if (level) filter.level = Number(level);
    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;
    if (domain && domain !== 'all') {
      const norm = domain.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
      if (norm === 'femnstack') {
        filter.domain = { $in: ['femnstack', 'femn-stack', 'FEMN STACK', 'Femnstack', 'femn stack', /^femn[- ]?stack$/i] };
      } else {
        filter.domain = { $regex: new RegExp(`^${norm}$`, 'i') };
      }
    }
    if (targetFeature && targetFeature !== 'all') filter.targetFeature = targetFeature;
    if (verificationStatus && verificationStatus !== 'all') filter.verificationStatus = verificationStatus;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { domain: { $regex: search, $options: 'i' } },
        { topic: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const questions = await InterviewQuestion.find(filter)
      .sort({ questionNumber: 1 })
      .lean();

    // Get test case counts for each question
    const testCases = await InterviewTestCase.aggregate([
      {
        $group: {
          _id: '$questionId',
          totalTests: { $sum: 1 },
          hiddenTests: {
            $sum: { $cond: ['$isHidden', 1, 0] }
          },
          visibleTests: {
            $sum: { $cond: ['$isHidden', 0, 1] }
          }
        }
      }
    ]);

    const testMap = {};
    testCases.forEach(tc => {
      testMap[tc._id.toString()] = tc;
    });

    const enriched = questions.map(q => ({
      ...q,
      testCaseStats: testMap[q._id.toString()] || { totalTests: 0, hiddenTests: 0, visibleTests: 0 }
    }));

    res.json({
      success: true,
      count: enriched.length,
      data: enriched
    });
  } catch (err) {
    console.error('[AdminInterviewController.getAllQuestions]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc Get single interview question for admin with all test cases
 * @route GET /api/interview/admin/questions/:id
 * @access Admin
 */
exports.getQuestionById = async (req, res) => {
  try {
    const question = await InterviewQuestion.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    const testCases = await InterviewTestCase.find({ questionId: question._id }).sort({ createdAt: 1 });

    res.json({
      success: true,
      data: {
        ...question.toObject(),
        testCases
      }
    });
  } catch (err) {
    console.error('[AdminInterviewController.getQuestionById]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const { checkDuplicate, registerQuestion } = require('../services/questionRegistryService');

/**
 * @desc Create new interview question
 * @route POST /api/interview/admin/questions
 * @access Admin
 */
exports.createQuestion = async (req, res) => {
  try {
    const {
      questionNumber,
      title,
      category,
      level,
      difficulty,
      problemStatement,
      inputFormat,
      outputFormat,
      constraints,
      examples,
      starterCode,
      hints,
      xp,
      tags,
      testCases,
      domain = 'java',
      targetFeature = 'INTERVIEW_ARENA'
    } = req.body;

    const normalizedDomain = (domain || 'java').toLowerCase().trim().replace(/[^a-z0-9]/g, '');

    // Pre-creation duplicate check
    const dupCheck = await checkDuplicate(title, problemStatement, category, normalizedDomain);
    if (dupCheck.isDuplicate) {
      return res.status(400).json({
        success: false,
        message: `Duplicate Question Error: This question already exists in ${dupCheck.existingSource} ("${dupCheck.existingTitle}").`
      });
    }

    let qNum = questionNumber;
    if (!qNum) {
      const highest = await InterviewQuestion.findOne().sort({ questionNumber: -1 });
      qNum = highest ? highest.questionNumber + 1 : 1;
    }

    const question = await InterviewQuestion.create({
      questionNumber: qNum,
      title,
      category,
      level,
      difficulty,
      problemStatement,
      inputFormat,
      outputFormat,
      constraints,
      examples: examples || [],
      starterCode: starterCode || {
        javascript: '// Write your code here',
        python: '# Write your code here',
        java: '// Write your code here'
      },
      hints: hints || [],
      xp: xp || (difficulty === 'Hard' ? 50 : difficulty === 'Medium' ? 25 : 10),
      tags: tags || [],
      domain: normalizedDomain,
      targetFeature: targetFeature || 'INTERVIEW_ARENA'
    });

    // Register in QuestionRegistry
    await registerQuestion(question._id, targetFeature || 'INTERVIEW_ARENA', title, problemStatement, category, normalizedDomain);

    // If test cases provided
    if (Array.isArray(testCases) && testCases.length > 0) {
      const tcDocs = testCases.map(tc => ({
        questionId: question._id,
        questionNumber: question.questionNumber,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        isHidden: !!tc.isHidden,
        explanation: tc.explanation || ''
      }));
      await InterviewTestCase.insertMany(tcDocs);
    }

    const createdTestCases = await InterviewTestCase.find({ questionId: question._id });

    res.status(201).json({
      success: true,
      data: {
        ...question.toObject(),
        testCases: createdTestCases
      }
    });
  } catch (err) {
    console.error('[AdminInterviewController.createQuestion]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc Update interview question
 * @route PUT /api/interview/admin/questions/:id
 * @access Admin
 */
exports.updateQuestion = async (req, res) => {
  try {
    const question = await InterviewQuestion.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    const fieldsToUpdate = [
      'title', 'category', 'level', 'difficulty', 'problemStatement',
      'inputFormat', 'outputFormat', 'constraints', 'examples',
      'starterCode', 'hints', 'xp', 'tags', 'isActive', 'timeLimit', 'memoryLimit',
      'targetFeature', 'domain', 'verificationStatus'
    ];

    fieldsToUpdate.forEach(f => {
      if (req.body[f] !== undefined) {
        if (f === 'domain') {
          question.domain = req.body.domain.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
        } else {
          question[f] = req.body[f];
        }
      }
    });

    await question.save();

    // Keep QuestionRegistry in sync
    try {
      await QuestionRegistry.updateOne(
        { questionId: question._id },
        {
          $set: {
            source: question.targetFeature || 'INTERVIEW_ARENA',
            title: question.title,
            domain: question.domain,
            problemStatement: question.problemStatement
          }
        }
      );
    } catch (regErr) {
      console.warn('[AdminInterviewController.updateQuestion] QuestionRegistry sync warning:', regErr.message);
    }

    res.json({
      success: true,
      data: question
    });
  } catch (err) {
    console.error('[AdminInterviewController.updateQuestion]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc Delete interview question & test cases
 * @route DELETE /api/interview/admin/questions/:id
 * @access Admin
 */
exports.deleteQuestion = async (req, res) => {
  try {
    const question = await InterviewQuestion.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    await InterviewTestCase.deleteMany({ questionId: question._id });
    await QuestionRegistry.deleteOne({ questionId: question._id });
    await question.deleteOne();

    res.json({
      success: true,
      message: 'Question and associated test cases deleted successfully'
    });
  } catch (err) {
    console.error('[AdminInterviewController.deleteQuestion]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc Add a test case to a question
 * @route POST /api/interview/admin/questions/:id/test-cases
 * @access Admin
 */
exports.addTestCase = async (req, res) => {
  try {
    const question = await InterviewQuestion.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    const { input, expectedOutput, isHidden, explanation } = req.body;

    const testCase = await InterviewTestCase.create({
      questionId: question._id,
      questionNumber: question.questionNumber,
      input,
      expectedOutput,
      isHidden: !!isHidden,
      explanation: explanation || ''
    });

    res.status(201).json({
      success: true,
      data: testCase
    });
  } catch (err) {
    console.error('[AdminInterviewController.addTestCase]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc Update a test case
 * @route PUT /api/interview/admin/test-cases/:id
 * @access Admin
 */
exports.updateTestCase = async (req, res) => {
  try {
    const testCase = await InterviewTestCase.findById(req.params.id);
    if (!testCase) {
      return res.status(404).json({ success: false, message: 'Test case not found' });
    }

    if (req.body.input !== undefined) testCase.input = req.body.input;
    if (req.body.expectedOutput !== undefined) testCase.expectedOutput = req.body.expectedOutput;
    if (req.body.isHidden !== undefined) testCase.isHidden = req.body.isHidden;
    if (req.body.explanation !== undefined) testCase.explanation = req.body.explanation;

    await testCase.save();

    res.json({
      success: true,
      data: testCase
    });
  } catch (err) {
    console.error('[AdminInterviewController.updateTestCase]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc Delete a test case
 * @route DELETE /api/interview/admin/test-cases/:id
 * @access Admin
 */
exports.deleteTestCase = async (req, res) => {
  try {
    const testCase = await InterviewTestCase.findById(req.params.id);
    if (!testCase) {
      return res.status(404).json({ success: false, message: 'Test case not found' });
    }

    await testCase.deleteOne();

    res.json({
      success: true,
      message: 'Test case deleted successfully'
    });
  } catch (err) {
    console.error('[AdminInterviewController.deleteTestCase]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc System-wide interview stats
 * @route GET /api/interview/admin/stats
 * @access Admin
 */
exports.getStats = async (req, res) => {
  try {
    const [
      totalQuestions,
      arenaCount,
      mockCount,
      moduleCount,
      gameHubCount,
      testingPracticeCount,
      totalTestCases,
      totalSubmissions,
      passedSubmissions
    ] = await Promise.all([
      InterviewQuestion.countDocuments(),
      InterviewQuestion.countDocuments({ targetFeature: 'INTERVIEW_ARENA', isActive: true }),
      InterviewQuestion.countDocuments({ targetFeature: 'MOCK_INTERVIEW', isActive: true }),
      InterviewQuestion.countDocuments({ targetFeature: 'MODULE_QUESTIONS', isActive: true }),
      Challenge.countDocuments({ isActive: true }),
      DomainTask.countDocuments({ isActive: true }),
      InterviewTestCase.countDocuments(),
      InterviewSubmission.countDocuments(),
      InterviewSubmission.countDocuments({ status: 'Accepted' })
    ]);

    const questionsByLevel = await InterviewQuestion.aggregate([
      {
        $group: {
          _id: '$level',
          count: { $sum: 1 },
          category: { $first: '$category' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const submissionsByLang = await InterviewSubmission.aggregate([
      {
        $group: {
          _id: '$language',
          count: { $sum: 1 },
          accepted: { $sum: { $cond: [{ $eq: ['$status', 'Accepted'] }, 1, 0] } }
        }
      }
    ]);

    const questionsByDomainRaw = await InterviewQuestion.aggregate([
      { $group: { _id: '$domain', count: { $sum: 1 } } }
    ]);
    const domainMapStats = new Map();
    questionsByDomainRaw.forEach(q => {
      const norm = (q._id || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
      if (!norm) return;
      domainMapStats.set(norm, (domainMapStats.get(norm) || 0) + q.count);
    });
    const questionsByDomain = Array.from(domainMapStats.entries())
      .map(([dom, count]) => ({ _id: dom, count }))
      .sort((a, b) => b.count - a.count);

    const questionsByFeature = await InterviewQuestion.aggregate([
      { $group: { _id: '$targetFeature', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        totalQuestions,
        arenaCount,
        mockCount,
        moduleCount,
        gameHubCount,
        testingPracticeCount,
        overallQuestions: arenaCount + gameHubCount + mockCount + testingPracticeCount,
        totalTestCases,
        totalSubmissions,
        passRate: totalSubmissions > 0 ? Math.round((passedSubmissions / totalSubmissions) * 100) : 0,
        questionsByLevel,
        submissionsByLang,
        questionsByDomain,
        questionsByFeature
      }
    });
  } catch (err) {
    console.error('[AdminInterviewController.getStats]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
