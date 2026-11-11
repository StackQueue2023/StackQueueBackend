const InterviewQuestion = require('../models/InterviewQuestion');
const InterviewTestCase = require('../models/InterviewTestCase');
const InterviewSubmission = require('../models/InterviewSubmission');
const InterviewProgress = require('../models/InterviewProgress');
const InterviewSession = require('../models/InterviewSession');
const User = require('../models/User');
const Course = require('../models/Course');
const Module = require('../models/Module');
const StudentProfile = require('../models/StudentProfile');
const DailyChallengeHistory = require('../models/DailyChallengeHistory');
const { selectUniqueDailyChallenge } = require('../services/questionRegistryService');
const { evaluateCode } = require('../services/interviewCodeRunner');
const { awardXp } = require('../services/xpEngine');
const { logAction } = require('../services/auditLogger');
const { getStudentAllowedLanguages, validateStudentLanguageAccess } = require('../utils/studentLanguageValidator');
const { getDomainCompilerConfig, getStarterCodeForLanguage } = require('../utils/domainCompilerMapping');

// Domain Normalization & Deduplication Helpers
function normalizeDomainKey(str) {
  if (!str || typeof str !== 'string') return '';
  return str.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
}

function formatDomainLabel(key, raw) {
  const norm = normalizeDomainKey(key || raw);
  if (norm === 'java') return 'JAVA';
  if (norm === 'femnstack') return 'FEMN STACK';
  if (norm === 'selenium') return 'Selenium';
  if (norm === 'python') return 'Python';
  if (norm === 'cpp' || norm === 'c') return 'C++';
  if (norm === 'dsa') return 'Data Structures';
  if (norm === 'javascript' || norm === 'js') return 'JavaScript';

  if (raw && typeof raw === 'string') {
    const formatted = raw
      .replace(/([A-Z])/g, ' $1')
      .replace(/[^a-zA-Z0-9]/g, ' ')
      .trim();
    if (formatted) {
      return formatted
        .split(/\s+/)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    }
  }
  return norm ? (norm.charAt(0).toUpperCase() + norm.slice(1)) : 'General';
}

function buildDomainQuery(domainInput) {
  if (!domainInput || domainInput === 'all') return null;
  const norm = normalizeDomainKey(domainInput);
  if (norm === 'femnstack') {
    return { $in: ['femnstack', 'femn-stack', 'FEMN STACK', 'Femnstack', 'femn stack', /^femn[- ]?stack$/i] };
  }
  return { $regex: new RegExp(`^${norm}$`, 'i') };
}

// Find next unanswered question within the track without skipping any questions
async function findNextUnansweredQuestion(studentId, currentQuestion) {
  try {
    const rawDomain = currentQuestion.domain || '';
    const domainNorm = normalizeDomainKey(rawDomain);
    const domainQuery = domainNorm ? buildDomainQuery(domainNorm) : null;

    const filter = {
      isActive: true,
      isDailyOnly: { $ne: true },
      targetFeature: 'INTERVIEW_ARENA'
    };
    if (domainQuery) {
      filter.domain = domainQuery;
    }

    const trackQuestions = await InterviewQuestion.find(filter)
      .sort({ questionNumber: 1, _id: 1 })
      .select('_id questionNumber title difficulty category domain');

    if (!trackQuestions || trackQuestions.length === 0) {
      return { nextQuestion: null, isTrackCompleted: true };
    }

    // Fetch all question IDs this student has PASSED
    const solvedSubmissions = await InterviewSubmission.find({
      studentId,
      status: 'PASSED'
    }).distinct('questionId');

    const solvedIdSet = new Set(solvedSubmissions.map(id => id.toString()));
    solvedIdSet.add(currentQuestion._id.toString());

    // 1. Next unanswered question with questionNumber > current
    let next = trackQuestions.find(q =>
      q.questionNumber > currentQuestion.questionNumber && !solvedIdSet.has(q._id.toString())
    );

    // 2. If none found after current, loop around to check earlier unanswered questions in track
    if (!next) {
      next = trackQuestions.find(q => !solvedIdSet.has(q._id.toString()));
    }

    if (!next) {
      return { nextQuestion: null, isTrackCompleted: true };
    }

    return {
      nextQuestion: {
        _id: next._id,
        questionNumber: next.questionNumber,
        title: next.title,
        difficulty: next.difficulty
      },
      isTrackCompleted: false
    };
  } catch (err) {
    console.error('findNextUnansweredQuestion error:', err);
    return { nextQuestion: null, isTrackCompleted: false };
  }
}

// Helper to dynamically discover unique deduplicated domains from Course, Module, and InterviewQuestion
async function fetchDynamicDomains() {
  const [courses, moduleDomains, questionDomains] = await Promise.all([
    Course.find({ isPublished: { $ne: false } }, 'title domain slug category _id').lean(),
    Module.distinct('domain'),
    InterviewQuestion.distinct('domain')
  ]);

  const domainMap = new Map();

  const getOrCreateEntry = (normKey, candidateLabel, courseDoc = null, category = 'General') => {
    if (!normKey) return null;
    if (!domainMap.has(normKey)) {
      domainMap.set(normKey, {
        key: normKey,
        label: candidateLabel || formatDomainLabel(normKey),
        courseId: courseDoc?._id || null,
        category: category || 'General',
        arenaQuestionsCount: 0,
        mockQuestionsCount: 0,
        moduleQuestionsCount: 0,
        aliases: new Set([normKey])
      });
    }
    const entry = domainMap.get(normKey);
    if (courseDoc && !entry.courseId) {
      entry.courseId = courseDoc._id;
      if (courseDoc.title) entry.label = courseDoc.title;
      if (courseDoc.category) entry.category = courseDoc.category;
    }
    return entry;
  };

  // 1. Populate from configured courses using slug or title (NOT c.domain which is the domain category)
  courses.forEach(c => {
    const normKey = normalizeDomainKey(c.slug) || normalizeDomainKey(c.title);
    if (!normKey) return;
    const entry = getOrCreateEntry(normKey, c.title, c, c.category);
    if (c.slug) entry.aliases.add(c.slug.toLowerCase().trim());
    if (c.title) entry.aliases.add(c.title.toLowerCase().trim());
  });

  // 2. Populate from distinct module and question domains
  const allRawDomains = Array.from(new Set([...moduleDomains, ...questionDomains])).filter(Boolean);
  allRawDomains.forEach(raw => {
    const normKey = normalizeDomainKey(raw);
    if (!normKey) return;
    const entry = getOrCreateEntry(normKey, formatDomainLabel(normKey, raw));
    entry.aliases.add(raw.toLowerCase().trim());
  });

  // 3. Aggregate questions and merge counts into canonical domains
  const qStats = await InterviewQuestion.aggregate([
    {
      $group: {
        _id: { domain: '$domain', targetFeature: '$targetFeature' },
        count: { $sum: 1 }
      }
    }
  ]);

  qStats.forEach(stat => {
    const rawDom = stat._id.domain || '';
    const normKey = normalizeDomainKey(rawDom);
    const feature = stat._id.targetFeature || 'INTERVIEW_ARENA';

    if (domainMap.has(normKey)) {
      const item = domainMap.get(normKey);
      if (feature === 'INTERVIEW_ARENA') {
        item.arenaQuestionsCount += stat.count;
      } else if (feature === 'MOCK_INTERVIEW') {
        item.mockQuestionsCount += stat.count;
      } else if (feature === 'MODULE_QUESTIONS' || feature === 'MODULE') {
        item.moduleQuestionsCount += stat.count;
      }
    }
  });

  return Array.from(domainMap.values()).map(d => {
    const config = getDomainCompilerConfig(d.key);
    return {
      ...d,
      aliases: Array.from(d.aliases),
      defaultLanguage: config.defaultLanguage,
      allowedLanguages: config.allowedLanguages,
      compilers: config.compilers
    };
  });
}

// Helper to get or create InterviewProgress
async function getOrCreateProgress(studentId) {
  let progress = await InterviewProgress.findOne({ studentId });
  if (!progress) {
    progress = await InterviewProgress.create({
      studentId,
      unlockedLevel: 1,
      solvedQuestions: [],
      categoryProgress: {}
    });
  }
  return progress;
}

// GET /api/interview/domains
exports.getAvailableDomains = async (req, res) => {
  try {
    const domains = await fetchDynamicDomains();
    let studentDomain = null;
    let enrolledCourse = null;

    if (req.user) {
      const profile = await StudentProfile.findOne({ userId: req.user._id }).populate('enrolledCourseId');
      const c = profile?.enrolledCourseId;
      studentDomain = profile?.domain || (c ? (normalizeDomainKey(c.slug) || normalizeDomainKey(c.title)) : null);
      enrolledCourse = c ? {
        id: c._id,
        title: c.title,
        domain: c.domain,
        slug: c.slug
      } : null;
    }

    return res.json({
      success: true,
      domains,
      studentDomain,
      enrolledCourse
    });
  } catch (err) {
    console.error('getAvailableDomains error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/interview/select-domain
exports.selectStudentDomain = async (req, res) => {
  try {
    const { domain, courseId } = req.body;
    if (!domain) {
      return res.status(400).json({ success: false, message: 'Domain is required.' });
    }

    const normDomain = normalizeDomainKey(domain);
    const updateFields = { domain: normDomain };
    if (courseId) {
      updateFields.enrolledCourseId = courseId;
    }

    const profile = await StudentProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $set: updateFields },
      { upsert: true, new: true }
    );

    return res.json({
      success: true,
      domain: normDomain,
      profile,
      message: `Domain switched to ${domain} successfully.`
    });
  } catch (err) {
    console.error('selectStudentDomain error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/interview/questions
exports.getQuestions = async (req, res) => {
  try {
    let { level, difficulty, category, domain, search } = req.query;

    let activeDomain = domain && domain !== 'all' ? domain.toLowerCase().trim() : null;

    // If no domain provided, check student profile
    if (!activeDomain && req.user) {
      const profile = await StudentProfile.findOne({ userId: req.user._id }).populate('enrolledCourseId');
      if (profile?.domain) {
        activeDomain = profile.domain.toLowerCase().trim();
      } else if (profile?.enrolledCourseId) {
        const c = profile.enrolledCourseId;
        activeDomain = normalizeDomainKey(c.slug) || normalizeDomainKey(c.title) || normalizeDomainKey(c.domain);
      }
    }

    const availableDomains = await fetchDynamicDomains();

    // If still no domain, tell frontend to prompt the user to choose
    if (!activeDomain) {
      return res.json({
        success: true,
        needsDomainSelection: true,
        availableDomains,
        domain: null,
        data: [],
        totalQuestions: 0,
        message: 'Please select a domain to explore Interview Arena challenges.'
      });
    }

    const domainQuery = buildDomainQuery(activeDomain);

    // STRICT DOMAIN ISOLATION & TRACK FILTERING
    const filter = {
      isActive: true,
      isDailyOnly: { $ne: true },
      targetFeature: 'INTERVIEW_ARENA',
      domain: domainQuery
    };

    if (level) filter.level = Number(level);
    if (difficulty) filter.difficulty = difficulty;
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { problemStatement: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }

    const questions = await InterviewQuestion.find(filter)
      .sort({ questionNumber: 1 })
      .select('-hiddenTestCases');

    let solvedSet = new Set();
    let unlockedLevel = 10;

    if (req.user && req.user.role === 'student') {
      const progress = await getOrCreateProgress(req.user._id);
      progress.solvedQuestions.forEach(sq => solvedSet.add(sq.questionNumber));
    }

    const enriched = questions.map(q => ({
      ...q.toObject(),
      isSolved: solvedSet.has(q.questionNumber),
      isLocked: false
    }));

    return res.json({
      success: true,
      domain: activeDomain,
      availableDomains,
      data: enriched,
      unlockedLevel,
      totalQuestions: enriched.length
    });
  } catch (error) {
    console.error('getQuestions error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/interview/questions/:id
exports.getQuestionById = async (req, res) => {
  try {
    const query = req.params.id.match(/^[0-9a-fA-F]{24}$/)
      ? { _id: req.params.id }
      : { questionNumber: Number(req.params.id) };

    const question = await InterviewQuestion.findOne(query);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    // Single Source of Truth: Fetch ALL test cases configured for this question in the DB directly
    const allDbTestCases = await InterviewTestCase.find({
      questionId: question._id
    }).sort({ createdAt: 1 });

    // Deliver all test cases directly with real inputs, expected outputs and explanations
    const clientTestCases = allDbTestCases.map((tc, idx) => ({
      _id: tc._id,
      caseNumber: idx + 1,
      input: tc.input || '',
      expectedOutput: tc.expectedOutput || '',
      explanation: tc.explanation || '',
      isHidden: false
    }));

    let isSolved = false;
    let attemptsCount = 0;
    let recentSubmissions = [];
    let submittedCode = null;

    // Identify domain-appropriate compilers and allowed languages
    const domainConfig = getDomainCompilerConfig(question.domain, question);
    const allowedLanguages = domainConfig.allowedLanguages;
    const defaultLanguage = domainConfig.defaultLanguage;

    if (req.user) {
      attemptsCount = await InterviewSubmission.countDocuments({
        studentId: req.user._id,
        questionId: question._id
      });
      const passed = await InterviewSubmission.findOne({
        studentId: req.user._id,
        questionId: question._id,
        status: 'PASSED'
      });
      isSolved = !!passed;

      recentSubmissions = await InterviewSubmission.find({
        studentId: req.user._id,
        questionId: question._id
      })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('language status passedTests totalTests executionTimeMs createdAt');

      const latestSub = await InterviewSubmission.findOne({
        studentId: req.user._id,
        questionId: question._id
      }).sort({ createdAt: -1 }).select('code');
      if (latestSub && latestSub.code) {
        submittedCode = latestSub.code;
      }
    }

    // Resolve domain-appropriate starter code for all allowed languages
    const resolvedStarter = {};
    allowedLanguages.forEach(lang => {
      if (question.starterCode && question.starterCode[lang] && question.starterCode[lang].trim()) {
        resolvedStarter[lang] = question.starterCode[lang];
      } else {
        resolvedStarter[lang] = getStarterCodeForLanguage(lang, question.domain, question.topic || question.title);
      }
    });

    return res.json({
      success: true,
      data: {
        ...question.toObject(),
        starterCode: resolvedStarter,
        submittedCode,
        testCases: clientTestCases,
        totalTestCasesCount: allDbTestCases.length,
        visibleTestCasesCount: allDbTestCases.length,
        hiddenTestCasesCount: 0,
        isSolved,
        attemptsCount,
        recentSubmissions,
        allowedLanguages,
        defaultLanguage,
        compilerOptions: domainConfig.compilers
      }
    });
  } catch (error) {
    console.error('getQuestionById error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/interview/run (Run against all configured test cases from database)
exports.runCode = async (req, res) => {
  try {
    const { questionId, language, code, customInput } = req.body;

    if (!questionId || !language || !code) {
      return res.status(400).json({ success: false, message: 'questionId, language, and code are required.' });
    }

    let testCasesToRun = [];

    if (customInput !== undefined && customInput !== null && customInput.trim() !== '') {
      testCasesToRun = [{
        input: customInput.trim(),
        expectedOutput: '',
        isHidden: false
      }];
    } else {
      // Single Source of Truth: Execute ALL configured test cases from database
      testCasesToRun = await InterviewTestCase.find({
        questionId
      }).sort({ isHidden: 1, createdAt: 1 });
    }

    const runResult = await evaluateCode({
      language,
      code,
      testCases: testCasesToRun,
      isSubmit: false
    });

    return res.json({
      success: true,
      data: runResult
    });
  } catch (error) {
    console.error('runCode error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/interview/submit (Judge against visible AND hidden test cases)
exports.submitSolution = async (req, res) => {
  try {
    const { questionId, language, code, hintsUsed = 0 } = req.body;
    const studentId = req.user._id;

    if (!questionId || !language || !code) {
      return res.status(400).json({ success: false, message: 'questionId, language, and code are required.' });
    }

    const question = await InterviewQuestion.findById(questionId);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found.' });
    }

    // Load both visible and hidden test cases
    const allTestCases = await InterviewTestCase.find({ questionId }).sort({ isHidden: 1 });

    const evalResult = await evaluateCode({
      language,
      code,
      testCases: allTestCases,
      isSubmit: true
    });

    const previousAttempts = await InterviewSubmission.countDocuments({
      studentId,
      questionId
    });

    const alreadySolved = await InterviewSubmission.findOne({
      studentId,
      questionId,
      status: 'PASSED'
    });

    let status = evalResult.allPassed ? 'PASSED' : 'FAILED';
    if (evalResult.error && !evalResult.allPassed && evalResult.passedTests === 0) {
      status = 'ERROR';
    }

    let xpAwarded = 0;
    let unlockedNextLevel = false;

    if (evalResult.allPassed && !alreadySolved) {
      // Base XP
      xpAwarded = question.xp || 10;

      // Check if this question is today's active Daily Challenge
      const todayStr = new Date().toISOString().split('T')[0];
      const isDailyBonusDoc = await DailyQuestionLog.findOne({ date: todayStr, question: question._id });
      let isDailyBonus = false;
      if (isDailyBonusDoc) {
        xpAwarded += 20; // Extra +20 Bonus XP for solving Daily Challenge!
        isDailyBonus = true;
      }

      // First attempt bonus
      if (previousAttempts === 0) {
        xpAwarded += 10;
      }

      // No hints used bonus
      if (Number(hintsUsed) === 0) {
        xpAwarded += 5;
      }

      // Award XP into user gamification engine
      await awardXp(
        studentId,
        xpAwarded,
        isDailyBonus ? 'daily_challenge_solved' : 'challenge_solved',
        question._id,
        'InterviewQuestion',
        isDailyBonus
          ? `Solved Daily Challenge Q${question.questionNumber}: ${question.title} (+20 Bonus XP)`
          : `Solved Interview Q${question.questionNumber}: ${question.title}`
      );

      // Update InterviewProgress
      const progress = await getOrCreateProgress(studentId);
      progress.solvedQuestions.push({
        questionId: question._id,
        questionNumber: question.questionNumber,
        difficulty: question.difficulty,
        category: question.category,
        language,
        attempts: previousAttempts + 1
      });

      progress.totalSolved = progress.solvedQuestions.length;
      if (question.difficulty === 'Easy') progress.easySolved++;
      else if (question.difficulty === 'Medium') progress.mediumSolved++;
      else if (question.difficulty === 'Hard') progress.hardSolved++;

      // Category counts
      const catCount = progress.categoryProgress.get(question.category) || 0;
      progress.categoryProgress.set(question.category, catCount + 1);

      progress.totalInterviewXp += xpAwarded;

      // Unlock progression: If student solves >= 6 questions in their current level, unlock next level
      const currentLevelSolved = progress.solvedQuestions.filter(sq => {
        return sq.questionNumber >= (progress.unlockedLevel - 1) * 10 + 1 &&
               sq.questionNumber <= progress.unlockedLevel * 10;
      }).length;

      if (currentLevelSolved >= 6 && progress.unlockedLevel < 10) {
        progress.unlockedLevel += 1;
        unlockedNextLevel = true;
      }

      progress.totalAttempts += 1;
      await progress.save();
    } else {
      // Record failed attempt in progress stats
      const progress = await getOrCreateProgress(studentId);
      progress.totalAttempts += 1;
      await progress.save();
    }

    // Record submission history
    const submission = await InterviewSubmission.create({
      studentId,
      questionId,
      questionNumber: question.questionNumber,
      language,
      code,
      status,
      passedTests: evalResult.passedTests,
      totalTests: evalResult.totalTests,
      testResults: evalResult.testResults,
      executionTimeMs: evalResult.executionTimeMs,
      attemptNumber: previousAttempts + 1,
      hintsUsed: Number(hintsUsed),
      xpAwarded
    });

    await logAction(studentId, 'INTERVIEW_SUBMISSION', 'InterviewSubmission', submission._id, {
      questionNumber: question.questionNumber,
      status,
      xpAwarded
    });

    // Sanitized test results: NEVER expose hidden inputs or expected outputs
    const safeResults = evalResult.testResults.map(tr => ({
      caseNumber: tr.caseNumber,
      passed: tr.passed,
      isHidden: tr.isHidden,
      input: tr.isHidden ? '[Hidden Test Case]' : tr.input,
      expected: tr.isHidden ? '[Hidden]' : tr.expected,
      actual: tr.isHidden ? (tr.passed ? '[Passed]' : '[Failed]') : tr.actual,
      error: tr.error
    }));

    // Find next unanswered question within the track
    let nextQuestion = null;
    let isTrackCompleted = false;
    if (evalResult.allPassed) {
      const nextInfo = await findNextUnansweredQuestion(studentId, question);
      nextQuestion = nextInfo.nextQuestion;
      isTrackCompleted = nextInfo.isTrackCompleted;
    }

    return res.json({
      success: true,
      data: {
        submissionId: submission._id,
        status,
        allPassed: evalResult.allPassed,
        passedTests: evalResult.passedTests,
        totalTests: evalResult.totalTests,
        executionTimeMs: evalResult.executionTimeMs,
        testResults: safeResults,
        xpAwarded,
        unlockedNextLevel,
        attemptNumber: previousAttempts + 1,
        nextQuestion,
        isTrackCompleted
      }
    });
  } catch (error) {
    console.error('submitSolution error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/interview/submissions
exports.getSubmissions = async (req, res) => {
  try {
    const studentId = req.params.studentId || req.user._id;
    const { questionId } = req.query;

    const filter = { studentId };
    if (questionId) filter.questionId = questionId;

    const submissions = await InterviewSubmission.find(filter)
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('questionId', 'title questionNumber difficulty category');

    return res.json({
      success: true,
      data: submissions
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const DailyQuestionLog = require('../models/DailyQuestionLog');

// GET /api/interview/daily-challenge
exports.getDailyChallenge = async (req, res) => {
  try {
    const studentId = req.user ? req.user._id : null;
    let domain = 'java';

    if (studentId) {
      const profile = await StudentProfile.findOne({ userId: studentId }).populate('enrolledCourseId');
      if (profile) {
        if (profile.domain) {
          domain = profile.domain.toLowerCase().trim();
        } else if (profile.enrolledCourseId?.domain) {
          domain = profile.enrolledCourseId.domain.toLowerCase().trim();
        }
      }
    }

    const selection = await selectUniqueDailyChallenge(studentId, domain);

    if (!selection || !selection.question) {
      return res.json({
        success: true,
        available: false,
        message: 'No new Daily Challenge questions are currently available.',
        data: null
      });
    }

    let isSolved = false;
    if (studentId && selection.question) {
      const solved = await InterviewSubmission.findOne({
        studentId,
        questionNumber: selection.question.questionNumber,
        status: 'PASSED'
      });
      isSolved = !!solved;
    }

    return res.json({
      success: true,
      available: true,
      data: {
        question: selection.question,
        domain: selection.domain,
        bonusXp: 20,
        isSolved,
        date: selection.date
      }
    });
  } catch (error) {
    console.error('getDailyChallenge error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/interview/daily-challenge/refresh
exports.refreshDailyChallenge = async (req, res) => {
  try {
    const studentId = req.user ? req.user._id : null;
    const { currentQuestionId } = req.body;

    let domain = 'java';
    if (studentId) {
      const profile = await StudentProfile.findOne({ userId: studentId }).populate('enrolledCourseId');
      if (profile) {
        if (profile.domain) {
          domain = profile.domain.toLowerCase().trim();
        } else if (profile.enrolledCourseId?.domain) {
          domain = profile.enrolledCourseId.domain.toLowerCase().trim();
        }
      }
    }

    const excludeQuestionIds = currentQuestionId ? [currentQuestionId] : [];
    const selection = await selectUniqueDailyChallenge(studentId, domain, {
      forceRefresh: true,
      excludeQuestionIds
    });

    if (!selection || !selection.question) {
      return res.json({
        success: true,
        available: false,
        message: 'No new Daily Challenge questions are currently available.',
        data: null
      });
    }

    let isSolved = false;
    if (studentId && selection.question) {
      const solved = await InterviewSubmission.findOne({
        studentId,
        questionNumber: selection.question.questionNumber,
        status: 'PASSED'
      });
      isSolved = !!solved;
    }

    return res.json({
      success: true,
      available: true,
      data: {
        question: selection.question,
        domain: selection.domain,
        bonusXp: 20,
        isSolved,
        date: selection.date
      }
    });
  } catch (error) {
    console.error('refreshDailyChallenge error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET / POST /api/interview/mock-interview/start (Start Interview Mode)
exports.startMockInterview = async (req, res) => {
  try {
    let studentId = req.user?._id;
    if (!studentId) {
      // Find fallback demo student so guest can practice seamlessly
      const demoUser = await User.findOne({ username: 'student01' });
      studentId = demoUser?._id;
    }

    const rawDomain = (req.body?.domain || req.query?.domain || '').toLowerCase().trim();
    const rawDiff = (req.query.difficulty || req.body?.difficulty || 'Mixed').trim();
    const durationMinutes = Number(req.query.duration || req.query.durationMinutes || req.body?.duration || req.body?.durationMinutes || 30);

    // Map input domain string to database domain values
    let targetDomains = [];
    let selectedDomainKey = rawDomain || 'java';

    const normalizedKey = rawDomain.replace(/[^a-z0-9]/g, '');

    if (!rawDomain || normalizedKey === 'java') {
      targetDomains = ['java', 'JAVA', 'Java'];
      selectedDomainKey = 'java';
    } else if (normalizedKey === 'python') {
      targetDomains = ['python', 'PYTHON', 'Python'];
      selectedDomainKey = 'python';
    } else if (normalizedKey === 'femnstack') {
      targetDomains = ['femnstack', 'femn-stack', 'FEMN STACK', 'Femnstack', 'femn stack'];
      selectedDomainKey = 'femnstack';
    } else if (normalizedKey === 'selenium') {
      targetDomains = ['selenium', 'SELENIUM', 'Selenium'];
      selectedDomainKey = 'selenium';
    } else if (normalizedKey === 'cpp' || rawDomain === 'c++') {
      targetDomains = ['cpp', 'c++', 'C++'];
      selectedDomainKey = 'cpp';
    } else if (normalizedKey === 'dsa' || rawDomain.includes('data structure') || rawDomain.includes('algorithm')) {
      targetDomains = ['dsa'];
      selectedDomainKey = 'dsa';
    } else if (normalizedKey === 'javascript' || normalizedKey === 'web' || rawDomain.includes('web dev')) {
      targetDomains = ['javascript', 'react', 'web'];
      selectedDomainKey = 'javascript';
    } else if (rawDomain.includes('fullstack') || rawDomain.includes('full stack')) {
      targetDomains = ['fullstack'];
      selectedDomainKey = 'fullstack';
    } else if (rawDomain.includes('sql') || rawDomain.includes('database')) {
      targetDomains = ['sql'];
      selectedDomainKey = 'sql';
    } else if (rawDomain.includes('cyber') || rawDomain.includes('security')) {
      targetDomains = ['cybersecurity'];
      selectedDomainKey = 'cybersecurity';
    } else {
      targetDomains = Array.from(new Set([rawDomain, normalizedKey, rawDomain.replace(/-/g, '')]));
      selectedDomainKey = rawDomain;
    }

    // Default language based on domain
    let defaultLang = 'java';
    if (selectedDomainKey === 'python') defaultLang = 'python';
    else if (selectedDomainKey === 'javascript' || selectedDomainKey === 'web' || selectedDomainKey === 'femnstack') defaultLang = 'javascript';
    else if (selectedDomainKey === 'selenium') defaultLang = 'java';
    else if (selectedDomainKey === 'cpp') defaultLang = 'java'; // or 'cpp'
    else defaultLang = 'java';

    const language = (req.query.language || req.body?.language || defaultLang).toLowerCase();

    // 1. Strict domain & Mock Interview bank constraint
    const domainMatch = {
      $or: [
        { domain: { $in: targetDomains } },
        { domain: { $regex: new RegExp(`^${normalizedKey}$`, 'i') } }
      ],
      $and: [
        {
          $or: [
            { targetFeature: 'MOCK_INTERVIEW' },
            { questionBankType: 'MOCK_INTERVIEW' }
          ]
        }
      ],
      isActive: true
    };
    const domainQuestionCount = await InterviewQuestion.countDocuments(domainMatch);

    if (domainQuestionCount === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        message: 'No questions available for this domain',
        data: {
          sessionId: null,
          domain: selectedDomainKey,
          durationMinutes,
          questions: []
        }
      });
    }

    // Fetch student's solved questions to prefer fresh unique questions
    const solvedSubmissions = await InterviewSubmission.find({ studentId, status: 'PASSED' }).select('questionNumber');
    const solvedNums = solvedSubmissions.map(s => s.questionNumber).filter(Boolean);
    const solvedQuestions = await InterviewQuestion.find({ ...domainMatch, questionNumber: { $in: solvedNums } }).select('_id');
    const solvedIds = solvedQuestions.map(q => q._id);

    let sampleQuestions = [];
    const diffRegex = new RegExp(`^${rawDiff}$`, 'i');

    // 1. Prefer un-solved questions matching difficulty strictly within the selected domain
    if (rawDiff.toLowerCase() !== 'mixed') {
      sampleQuestions = await InterviewQuestion.aggregate([
        { $match: { ...domainMatch, difficulty: { $regex: diffRegex }, _id: { $nin: solvedIds } } },
        { $sample: { size: 5 } }
      ]);
    }

    // 2. If fewer than 5 found, sample un-solved questions from any difficulty strictly within the selected domain
    if (sampleQuestions.length < 5) {
      const needed = 5 - sampleQuestions.length;
      const excludeIds = [...solvedIds, ...sampleQuestions.map(q => q._id)];
      const additional = await InterviewQuestion.aggregate([
        { $match: { ...domainMatch, _id: { $nin: excludeIds } } },
        { $sample: { size: needed } }
      ]);
      sampleQuestions = [...sampleQuestions, ...additional];
    }

    // 3. Fallback: if still fewer than 5 (all questions in domain solved), sample strictly within the selected domain
    if (sampleQuestions.length < 5) {
      const needed = 5 - sampleQuestions.length;
      const excludeIds = sampleQuestions.map(q => q._id);
      const fallback = await InterviewQuestion.aggregate([
        { $match: { ...domainMatch, _id: { $nin: excludeIds } } },
        { $sample: { size: needed } }
      ]);
      sampleQuestions = [...sampleQuestions, ...fallback];
    }

    const sessionDomainConfig = getDomainCompilerConfig(selectedDomainKey);
    const sessionAllowedLangs = sessionDomainConfig.allowedLanguages;
    const sessionDefaultLang = sessionDomainConfig.defaultLanguage;

    const session = await InterviewSession.create({
      studentId: studentId || null,
      domain: selectedDomainKey,
      language: sessionDefaultLang,
      durationMinutes: durationMinutes || 30,
      difficulty: rawDiff,
      questionIds: sampleQuestions.map(q => q._id),
      startTime: new Date(),
      status: 'IN_PROGRESS'
    });

    return res.status(201).json({
      success: true,
      count: sampleQuestions.length,
      data: {
        sessionId: session._id,
        domain: selectedDomainKey,
        durationMinutes: session.durationMinutes,
        domainConfig: {
          key: sessionDomainConfig.key,
          label: sessionDomainConfig.label,
          defaultLanguage: sessionDefaultLang,
          allowedLanguages: sessionAllowedLangs,
          compilers: sessionDomainConfig.compilers
        },
        questions: sampleQuestions.map(q => {
          const qDomainConfig = getDomainCompilerConfig(q.domain || selectedDomainKey, q);
          const qAllowedLangs = qDomainConfig.allowedLanguages;
          const qStarter = {};
          qAllowedLangs.forEach(lang => {
            if (q.starterCode && q.starterCode[lang] && q.starterCode[lang].trim()) {
              qStarter[lang] = q.starterCode[lang];
            } else {
              qStarter[lang] = getStarterCodeForLanguage(lang, q.domain || selectedDomainKey, q.topic || q.title);
            }
          });
          return {
            _id: q._id,
            questionNumber: q.questionNumber,
            title: q.title,
            domain: q.domain || selectedDomainKey,
            category: q.category,
            difficulty: q.difficulty,
            problemStatement: q.problemStatement,
            examples: q.examples || [],
            starterCode: qStarter,
            allowedLanguages: qAllowedLangs,
            defaultLanguage: qDomainConfig.defaultLanguage,
            compilers: qDomainConfig.compilers
          };
        })
      }
    });
  } catch (error) {
    console.error('startMockInterview error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/interview/mock-interview/submit (Complete Mock Interview)
exports.submitMockInterview = async (req, res) => {
  try {
    const sessionId = req.body.sessionId || req.params.id;
    const session = await InterviewSession.findById(sessionId).populate('questionIds');
    if (!session) {
      return res.status(404).json({ success: false, message: 'Interview session not found.' });
    }

    const now = new Date();
    const timeSpentSeconds = Math.round((now.getTime() - session.startTime.getTime()) / 1000);

    let results = req.body.results || [];

    // Evaluate all session questions ensuring every question is included in final breakdown
    if (!results || results.length === 0) {
      const submissionsMap = new Map();
      if (Array.isArray(req.body.submissions)) {
        req.body.submissions.forEach(sub => {
          if (sub && sub.questionId) {
            submissionsMap.set(sub.questionId.toString(), sub);
          }
        });
      }

      const sessionQuestions = session.questionIds || [];
      results = [];

      for (const q of sessionQuestions) {
        if (!q) continue;
        const qIdStr = (q._id || q).toString();

        let qDoc = q;
        if (!qDoc.title) {
          qDoc = await InterviewQuestion.findById(qIdStr);
        }
        if (!qDoc) continue;

        const sub = submissionsMap.get(qIdStr);
        const testCases = await InterviewTestCase.find({ questionId: qDoc._id });

        let evalRes = { allPassed: false, passedTests: 0, totalTests: testCases ? testCases.length : 0 };
        const answerText = sub ? (sub.code || sub.answer || '').trim() : '';

        if (answerText.length > 0) {
          // If question has keyConcepts (conceptual / open-ended): evaluate against key concepts rather than requiring exact match
          if (Array.isArray(qDoc.keyConcepts) && qDoc.keyConcepts.length > 0 && (!testCases || testCases.length === 0)) {
            const lowerAns = answerText.toLowerCase();
            const matchedConcepts = qDoc.keyConcepts.filter(kc => lowerAns.includes(kc.toLowerCase()));
            const matchRatio = matchedConcepts.length / qDoc.keyConcepts.length;
            evalRes.allPassed = matchRatio >= 0.4 || matchedConcepts.length >= 2;
            evalRes.passedTests = matchedConcepts.length;
            evalRes.totalTests = qDoc.keyConcepts.length;
          } else if (testCases && testCases.length > 0) {
            evalRes = await evaluateCode(sub.code || answerText, sub.language || 'javascript', testCases);
          } else {
            // General open-ended validation
            evalRes.allPassed = answerText.length >= 20;
            evalRes.passedTests = 1;
            evalRes.totalTests = 1;
          }
        }

        results.push({
          questionId: qDoc._id,
          questionNumber: qDoc.questionNumber,
          title: qDoc.title,
          category: qDoc.category,
          difficulty: qDoc.difficulty,
          passed: evalRes.allPassed,
          passedTests: evalRes.passedTests,
          totalTests: evalRes.totalTests
        });
      }
    }

    let passedCount = 0;
    let failedCount = 0;
    results.forEach(r => {
      if (r.passed) passedCount++;
      else failedCount++;
    });

    const totalQuestions = session.questionIds?.length || results.length || 5;
    const score = totalQuestions > 0 ? Math.round((passedCount / totalQuestions) * 100) : 0;
    const accuracy = results.length > 0 ? Math.round((passedCount / results.length) * 100) : 0;

    session.status = 'COMPLETED';
    session.endTime = now;
    session.results = results;
    session.score = score;
    session.stats = {
      questionsAttempted: results.length,
      questionsPassed: passedCount,
      questionsFailed: failedCount,
      timeUsedSeconds: timeSpentSeconds
    };

    await session.save();

    return res.json({
      success: true,
      data: {
        sessionId: session._id,
        score,
        accuracy,
        passedCount,
        failedCount,
        totalQuestions,
        timeSpentSeconds,
        durationMinutes: session.durationMinutes,
        stats: session.stats,
        results
      }
    });
  } catch (error) {
    console.error('submitMockInterview error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/interview/progress/:studentId
exports.getInterviewProgress = async (req, res) => {
  try {
    const studentId = req.params.studentId || req.user._id;
    const progress = await getOrCreateProgress(studentId);

    const totalQuestions = await InterviewQuestion.countDocuments({ isActive: true });
    const accuracy = progress.totalAttempts > 0
      ? Math.round((progress.totalSolved / progress.totalAttempts) * 100)
      : 100;

    // Categories list
    const categories = [
      'Programming Basics', 'Number Logic', 'Strings', 'Arrays',
      'Searching and Sorting', 'Hashing', 'Two Pointer', 'Sliding Window',
      'Stack', 'Queue', 'Linked List', 'Binary Tree', 'Graph', 'Dynamic Programming'
    ];

    const categoryStats = categories.map(cat => ({
      category: cat,
      solved: progress.categoryProgress.get(cat) || 0
    }));

    return res.json({
      success: true,
      data: {
        totalSolved: progress.totalSolved,
        totalQuestions,
        easySolved: progress.easySolved,
        mediumSolved: progress.mediumSolved,
        hardSolved: progress.hardSolved,
        accuracy,
        totalAttempts: progress.totalAttempts,
        totalInterviewXp: progress.totalInterviewXp,
        unlockedLevel: progress.unlockedLevel,
        categoryStats,
        recentSolved: progress.solvedQuestions.slice(-10).reverse()
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
