const Challenge = require('../models/Challenge');
const Attempt = require('../models/Attempt');
const Progress = require('../models/Progress');
const StudentProfile = require('../models/StudentProfile');
const DailyChallenge = require('../models/DailyChallenge');
const ChallengeHistory = require('../models/ChallengeHistory');
const { awardXp, awardQuestionXpIdempotent } = require('../services/xpEngine');
const { evaluateCss } = require('../services/cssEvaluator');
const { executeSqlQuery } = require('../services/sqlSandbox');
const { runTestCases, executeJavaScript, normalizeOutput } = require('../services/executionSandbox');
const xpRules = require('../config/xpRules');
const { selectUniqueDailyChallenge } = require('../services/questionRegistryService');

// GET /api/challenges/:id
exports.getChallengeById = async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ success: false, message: 'Challenge not found' });
    }

    const safeChallenge = challenge.toObject();
    delete safeChallenge.solutionCode; // Strictly ensure solution code is never exposed to student UI

    // Filter hidden test case details
    if (safeChallenge.testCases) {
      safeChallenge.testCases = safeChallenge.testCases.map(tc => ({
        input: tc.input,
        expectedOutput: tc.isHidden ? 'Hidden Test Case' : tc.expectedOutput,
        isHidden: tc.isHidden,
        explanation: tc.explanation || ''
      }));
    }

    // Get student attempts count
    let attemptsCount = 0;
    let isCompleted = false;
    if (req.user && req.user.role === 'student') {
      attemptsCount = await Attempt.countDocuments({
        studentId: req.user._id,
        challengeId: challenge._id
      });
      const passedAttempt = await Attempt.findOne({
        studentId: req.user._id,
        challengeId: challenge._id,
        passed: true
      });
      isCompleted = !!passedAttempt;
    }

    return res.json({
      success: true,
      data: {
        ...safeChallenge,
        attemptsCount,
        isCompleted
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/challenges/:id/run
// Runs student code in sandbox against test cases. DOES NOT AWARD XP OR MARK COMPLETED.
exports.runChallenge = async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ success: false, message: 'Challenge not found' });
    }

    const { submittedCode = '', selectedOption = '', selectedConnections = [], orderedBlocks = [] } = req.body;

    let evalResult = {
      allTestsPassed: false,
      compilationError: null,
      runtimeError: null,
      isTimeout: false,
      executionTimeMs: 0,
      stdout: '',
      stderr: '',
      testCaseResults: [],
      feedback: ''
    };

    if (challenge.type === 'css_rendering') {
      const cssEval = evaluateCss(submittedCode, challenge.targetCondition);
      evalResult = {
        allTestsPassed: cssEval.passed,
        score: cssEval.score,
        feedback: cssEval.feedback,
        stdout: cssEval.feedback,
        testCaseResults: [{
          id: 1,
          input: 'CSS Render Target Condition',
          expectedOutput: 'Target DOM styles match',
          actualOutput: cssEval.feedback,
          passed: cssEval.passed,
          isHidden: false
        }]
      };
    } else if (challenge.type === 'sql_query') {
      const sqlResult = executeSqlQuery(submittedCode, challenge.targetCondition);
      evalResult = {
        allTestsPassed: sqlResult.success && sqlResult.passed,
        feedback: sqlResult.feedback || sqlResult.error,
        stdout: sqlResult.feedback || '',
        stderr: sqlResult.error || '',
        testCaseResults: [{
          id: 1,
          input: 'SQL Query Target Table',
          expectedOutput: 'Query result matches schema target',
          actualOutput: sqlResult.feedback || sqlResult.error,
          passed: sqlResult.success && sqlResult.passed,
          isHidden: false
        }]
      };
    } else if (challenge.type === 'mcq' || challenge.type === 'output_prediction') {
      let passed = false;
      if (selectedOption) {
        const correctOpt = challenge.mcqOptions?.find(o => o.isCorrect);
        passed = correctOpt && correctOpt.id === selectedOption;
      } else {
        passed = normalizeOutput(submittedCode) === normalizeOutput(challenge.expectedOutput);
      }
      evalResult = {
        allTestsPassed: passed,
        feedback: passed ? 'Correct choice selected!' : 'Incorrect option selected. Try analyzing again.',
        testCaseResults: [{
          id: 1,
          input: selectedOption || submittedCode,
          expectedOutput: 'Correct Option',
          actualOutput: passed ? 'Passed' : 'Failed',
          passed,
          isHidden: false
        }]
      };
    } else {
      // Algorithmic Coding Challenge / Test Case Evaluation
      const lang = challenge.language || challenge.gameSlug || 'javascript';
      evalResult = runTestCases(lang, submittedCode, challenge.testCases);
      evalResult.feedback = evalResult.allTestsPassed
        ? '✓ All test cases passed successfully!'
        : (evalResult.runtimeError || evalResult.compilationError || 'One or more test assertions failed.');
    }

    return res.json({
      success: true,
      ...evalResult
    });
  } catch (error) {
    console.error('runChallenge error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/challenges/:id/submit
// Performs SERVER-SIDE RE-VALIDATION. Awards XP and completes challenge ONLY IF all tests pass.
exports.submitChallenge = async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ success: false, message: 'Challenge not found' });
    }

    const studentUserId = req.user._id;
    const { submittedCode = '', selectedOption = '', selectedConnections = [], orderedBlocks = [], hintsUsed = 0 } = req.body;

    // 1. STRICT SERVER-SIDE RE-VALIDATION (Do NOT trust client state)
    let passed = false;
    let score = 0;
    let feedback = '';
    let executionTimeMs = 0;
    let details = {};

    if (challenge.type === 'css_rendering') {
      const evalResult = evaluateCss(submittedCode, challenge.targetCondition);
      passed = evalResult.passed;
      score = evalResult.score;
      feedback = evalResult.feedback;
      details = evalResult;
    } else if (challenge.type === 'sql_query') {
      const sqlResult = executeSqlQuery(submittedCode, challenge.targetCondition);
      passed = sqlResult.success && sqlResult.passed;
      score = passed ? 100 : 30;
      feedback = sqlResult.feedback || sqlResult.error;
      details = sqlResult;
    } else if (challenge.type === 'mcq' || challenge.type === 'output_prediction') {
      if (selectedOption) {
        const correctOpt = challenge.mcqOptions?.find(o => o.isCorrect);
        passed = correctOpt && correctOpt.id === selectedOption;
      } else {
        passed = normalizeOutput(submittedCode) === normalizeOutput(challenge.expectedOutput);
      }
      score = passed ? 100 : 0;
      feedback = passed ? 'Correct answer!' : 'Incorrect option selected.';
    } else {
      const lang = challenge.language || challenge.gameSlug || 'javascript';
      const tcResult = runTestCases(lang, submittedCode, challenge.testCases);
      passed = tcResult.allTestsPassed;
      score = passed ? 100 : 40;
      executionTimeMs = tcResult.executionTimeMs || 0;
      feedback = passed ? 'All test cases passed successfully!' : (tcResult.runtimeError || tcResult.compilationError || 'Re-validation failed.');
      details = tcResult.testCaseResults;
    }

    // Rejection if server validation failed
    if (!passed) {
      return res.status(400).json({
        success: false,
        passed: false,
        message: feedback || 'Submission validation failed. Not all test cases passed.',
        feedback
      });
    }

    // Previous attempts count
    const previousAttemptsCount = await Attempt.countDocuments({
      studentId: studentUserId,
      challengeId: challenge._id
    });
    const attemptNumber = previousAttemptsCount + 1;

    // Record attempt
    await Attempt.create({
      studentId: studentUserId,
      challengeId: challenge._id,
      gameSlug: challenge.gameSlug,
      submittedCode,
      passed: true,
      score: 100,
      xpEarned: 0,
      executionTimeMs,
      hintsUsed,
      attemptNumber,
      evaluationDetails: details
    });

    let xpEarned = 0;
    let levelInfo = null;
    let stars = 0;
    let unlockedNextLevel = false;

    // Check if already passed in past
    const alreadyPassed = await Attempt.findOne({
      studentId: studentUserId,
      challengeId: challenge._id,
      passed: true,
      attemptNumber: { $lt: attemptNumber }
    });

    // Calculate XP
    let baseXp = challenge.xpReward || xpRules.DIFFICULTY_XP[challenge.difficulty] || 20;

    // Deduct hint penalty
    if (hintsUsed > 0) {
      const penalty = Math.min(baseXp * 0.4, hintsUsed * (baseXp * (xpRules.HINT_PENALTY_PERCENT / 100)));
      baseXp = Math.max(5, Math.round(baseXp - penalty));
    }

    // First attempt bonus
    let bonusXp = 0;
    if (attemptNumber === 1 && !alreadyPassed) {
      bonusXp += xpRules.BONUSES.FIRST_ATTEMPT;
    }
    if (hintsUsed === 0 && attemptNumber === 1) {
      bonusXp += xpRules.BONUSES.PERFECT_SCORE;
    }

    // Star calculation
    if (attemptNumber === 1 && hintsUsed === 0) {
      stars = 3;
    } else if (attemptNumber <= 3) {
      stars = 2;
    } else {
      stars = 1;
    }

    xpEarned = baseXp + bonusXp;

    let awardedResult = null;
    const alreadyCompletedBefore = Boolean(alreadyPassed);
    if (!alreadyCompletedBefore && xpEarned > 0) {
      awardedResult = await awardQuestionXpIdempotent({
        studentUserId,
        questionId: challenge._id,
        feature: 'GAME_HUB',
        amount: xpEarned,
        reason: 'challenge_solved',
        referenceId: challenge._id,
        referenceModel: 'Challenge',
        description: `Solved ${challenge.title} in ${challenge.gameSlug}`
      });
      xpEarned = awardedResult.xpAwarded || 0;
    } else {
      xpEarned = 0;
      const curProfile = await StudentProfile.findOne({ userId: studentUserId }).select('totalXp currentLevel').lean();
      awardedResult = {
        awarded: false,
        alreadyCompleted: alreadyCompletedBefore,
        xpAwarded: 0,
        totalXp: curProfile?.totalXp ?? 0,
        level: curProfile?.currentLevel ?? null,
        leveledUp: false
      };
    }

    // Update student profile stats
    const profile = await StudentProfile.findOne({ userId: studentUserId });
    if (profile) {
      if (!alreadyCompletedBefore) {
        profile.stats.challengesSolved += 1;
      }
      profile.stats.totalAttempts += 1;
      await profile.save();
    }

    levelInfo = awardedResult;

    // Update Game Progress
    let progress = await Progress.findOne({ studentId: studentUserId, gameSlug: challenge.gameSlug });
    if (!progress) {
      progress = await Progress.create({
        studentId: studentUserId,
        gameSlug: challenge.gameSlug,
        completedChallenges: [],
        unlockedLevel: 1,
        totalGameXp: 0,
        totalStars: 0
      });
    }

    if (!progress.completedChallenges.includes(challenge._id)) {
      progress.completedChallenges.push(challenge._id);
      progress.totalGameXp += xpEarned;
      progress.totalStars += stars;

      const nextLevelNumber = challenge.levelNumber + 1;
      if (progress.unlockedLevel < nextLevelNumber) {
        progress.unlockedLevel = nextLevelNumber;
        unlockedNextLevel = true;
      }

      await progress.save();
    }

    // Check Daily Challenge integration
    const todayStr = new Date().toISOString().split('T')[0];
    const dailyChallenge = await DailyChallenge.findOne({ date: todayStr });
    if (dailyChallenge) {
      const slotMatch = dailyChallenge.challenges.find(c => c.challengeId.toString() === challenge._id.toString());
      if (slotMatch) {
        let studentComp = dailyChallenge.completions.find(c => c.studentId && c.studentId.toString() === studentUserId.toString());
        if (!studentComp) {
          dailyChallenge.completions.push({
            studentId: studentUserId,
            completedSlots: [slotMatch.slot],
            completedAll: false
          });
          studentComp = dailyChallenge.completions[dailyChallenge.completions.length - 1];
        } else {
          if (!studentComp.completedSlots.includes(slotMatch.slot)) {
            studentComp.completedSlots.push(slotMatch.slot);
          }
        }

        if (studentComp.completedSlots.length >= 4 && !studentComp.completedAll) {
          studentComp.completedAll = true;
          studentComp.completedAt = new Date();
          await awardXp(
            studentUserId,
            dailyChallenge.bonusXp || 100,
            'daily_challenge_all_bonus',
            dailyChallenge._id,
            'DailyChallenge',
            'Completed all 4 Daily Challenges!'
          );
        }
        await dailyChallenge.save();
      }
    }

    // Find next challenge in this game
    const nextChallenge = await Challenge.findOne({
      gameSlug: challenge.gameSlug,
      $or: [
        { levelNumber: challenge.levelNumber, order: { $gt: challenge.order } },
        { levelNumber: { $gt: challenge.levelNumber } }
      ],
      isActive: true
    }).sort({ levelNumber: 1, order: 1 }).select('_id title levelNumber');

    return res.json({
      success: true,
      passed: true,
      score: 100,
      feedback: '✓ Challenge Completed Successfully!',
      xpEarned,
      xpAwarded: xpEarned,
      alreadyCompleted: Boolean(levelInfo?.alreadyCompleted ?? alreadyPassed),
      totalXp: levelInfo?.totalXp ?? 0,
      level: levelInfo?.level ?? null,
      stars,
      levelInfo,
      unlockedNextLevel,
      nextChallengeId: nextChallenge ? nextChallenge._id : null,
      details
    });
  } catch (error) {
    console.error('submitChallenge error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/challenges/daily/my
exports.getMyDailyChallenge = async (req, res) => {
  try {
    const studentId = req.user._id;
    const profile = await StudentProfile.findOne({ userId: studentId }).populate('enrolledCourseId');
    let domain = 'java';
    if (profile) {
      if (profile.domain) {
        domain = profile.domain.toLowerCase().trim();
      } else if (profile.enrolledCourseId) {
        const c = profile.enrolledCourseId;
        domain = (c.slug || c.title || c.domain || 'java').toLowerCase().trim();
      }
    }

    const selection = await selectUniqueDailyChallenge(studentId, domain);
    if (!selection || !selection.question) {
      return res.json({
        success: true,
        data: null,
        message: 'No new Daily Challenge questions are currently available.'
      });
    }

    return res.json({ success: true, data: selection.question, domain: selection.domain });
  } catch (err) {
    console.error('getMyDailyChallenge error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/challenges/daily/submit-domain
exports.submitDomainDailyChallenge = async (req, res) => {
  try {
    const { challengeId, answer, timeTakenSeconds } = req.body;

    const challenge = await Challenge.findById(challengeId);
    if (!challenge) return res.status(404).json({ success: false, message: 'Challenge not found.' });

    let passed = false;
    let score = 0;
    if (challenge.type === 'mcq') {
      const correctOption = challenge.mcqOptions?.find(o => o.isCorrect);
      passed = correctOption && correctOption.id === answer;
      score = passed ? 100 : 0;
    } else {
      passed = true;
      score = 70;
    }

    const prevHistory = await ChallengeHistory.findOne({ studentId: req.user._id, challengeId }).lean();
    const wasAlreadyCompleted = prevHistory?.completionStatus === 'completed';

    const plannedPoints = passed && !wasAlreadyCompleted ? (challenge.xpReward || 20) : 0;

    let xpResult;
    if (passed && plannedPoints > 0) {
      xpResult = await awardQuestionXpIdempotent({
        studentUserId: req.user._id,
        questionId: challenge._id,
        feature: 'DAILY_CHALLENGE',
        amount: plannedPoints,
        reason: 'daily_challenge_solved',
        referenceId: challenge._id,
        referenceModel: 'Challenge',
        description: `Solved Daily Challenge: ${challenge.title || challenge._id}`
      });
      if (xpResult.awarded) {
        await StudentProfile.findOneAndUpdate(
          { userId: req.user._id },
          { $inc: { 'stats.dailyChallengesCompleted': 1 } }
        );
      }
    } else {
      const curProfile = await StudentProfile.findOne({ userId: req.user._id }).select('totalXp currentLevel').lean();
      xpResult = {
        awarded: false,
        alreadyCompleted: Boolean(passed && wasAlreadyCompleted),
        xpAwarded: 0,
        totalXp: curProfile?.totalXp ?? 0,
        level: curProfile?.currentLevel ?? null,
        leveledUp: false
      };
    }

    const pointsEarned = xpResult.xpAwarded || 0;

    const history = await ChallengeHistory.findOneAndUpdate(
      { studentId: req.user._id, challengeId },
      {
        attemptStatus: 'attempted',
        completionStatus: passed ? 'completed' : 'failed',
        score,
        pointsEarned,
        answer: typeof answer === 'string' ? answer : JSON.stringify(answer),
        timeTakenSeconds: timeTakenSeconds || 0
      },
      { new: true }
    );

    return res.json({
      success: true,
      passed,
      score,
      pointsEarned,
      xpAwarded: pointsEarned,
      alreadyCompleted: Boolean(xpResult.alreadyCompleted),
      totalXp: xpResult.totalXp ?? 0,
      level: xpResult.level ?? null,
      levelInfo: xpResult,
      history
    });
  } catch (err) {
    console.error('submitDomainDailyChallenge error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
