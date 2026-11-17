const mongoose = require('mongoose');
const { evaluateCode } = require('./interviewCodeRunner');
const InterviewQuestion = require('../models/InterviewQuestion');
const DomainTask = require('../models/DomainTask');
const Module = require('../models/Module');
const Course = require('../models/Course');
const SyllabusGenerationJob = require('../models/SyllabusGenerationJob');

/**
 * Validates a Question or DomainTask based on its format (Coding vs MCQ).
 * For Coding: Runs compiler and test-case execution sandbox.
 * For MCQ: Validates exactly 4 options (A, B, C, D) and 1 correct answer.
 */
async function validateQuestionContent(param = {}) {
  const { doc, fields = {}, language = 'javascript' } = param;
  const docObj = doc ? (doc.toObject ? doc.toObject() : doc) : {};
  const merged = { ...docObj, ...fields, ...(!doc && !param.fields ? param : {}) };
  const questionType = String(merged.questionType || merged.taskType || 'coding').toLowerCase();

  // ──────────────────────────────────────────────
  // 1. MCQ VALIDATION
  // ──────────────────────────────────────────────
  if (questionType === 'mcq' || (Array.isArray(merged.options) && merged.options.length > 0)) {
    const title = (merged.title || merged.problemStatement || '').trim();
    if (!title) {
      return {
        isValid: false,
        reason: 'Question statement incomplete.',
        compilerError: null,
        failedTestCases: []
      };
    }

    const options = merged.options;
    if (!Array.isArray(options) || options.length !== 4) {
      return {
        isValid: false,
        reason: 'MCQ must have exactly four options (A, B, C, D).',
        compilerError: null,
        failedTestCases: []
      };
    }

    const expectedKeys = ['A', 'B', 'C', 'D'];
    const seenTexts = new Set();
    for (let i = 0; i < 4; i++) {
      const opt = options[i];
      const optText = (opt?.text || opt?.value || (typeof opt === 'string' ? opt : '')).trim();
      const optKey = (opt?.optionId || expectedKeys[i] || '').toUpperCase();

      if (!optText) {
        return {
          isValid: false,
          reason: `Option ${optKey} has an empty statement text.`,
          compilerError: null,
          failedTestCases: []
        };
      }

      if (seenTexts.has(optText.toLowerCase())) {
        return {
          isValid: false,
          reason: 'Duplicate option text detected among MCQ choices.',
          compilerError: null,
          failedTestCases: []
        };
      }
      seenTexts.add(optText.toLowerCase());
    }

    const ans = (merged.correctAnswer || '').trim().toUpperCase();
    if (!ans) {
      return {
        isValid: false,
        reason: 'No correct answer configured for MCQ.',
        compilerError: null,
        failedTestCases: []
      };
    }

    if (!expectedKeys.includes(ans)) {
      return {
        isValid: false,
        reason: `Invalid correct answer "${ans}". Must be one of A, B, C, or D.`,
        compilerError: null,
        failedTestCases: []
      };
    }

    return {
      isValid: true,
      isTested: true,
      reason: '',
      compilerError: null,
      failedTestCases: []
    };
  }

  // ──────────────────────────────────────────────
  // 2. CODING VALIDATION
  // ──────────────────────────────────────────────
  const title = (merged.title || merged.problemStatement || '').trim();
  if (!title) {
    return {
      isValid: false,
      reason: 'Problem statement is incomplete.',
      compilerError: null,
      failedTestCases: []
    };
  }

  const solution = (merged.referenceSolution || merged.testingSolution || merged.starterCode || '').trim();
  if (!solution) {
    return {
      isValid: false,
      reason: 'Reference solution is missing or empty.',
      compilerError: null,
      failedTestCases: []
    };
  }

  const rawTestCases = merged.testCases || [];
  if (!Array.isArray(rawTestCases) || rawTestCases.length === 0) {
    return {
      isValid: false,
      reason: 'Test cases are missing or invalid.',
      compilerError: null,
      failedTestCases: []
    };
  }

  // Format test cases for runner
  const normalizedTestCases = rawTestCases.map((tc, idx) => ({
    _id: tc._id || `tc-${idx + 1}`,
    input: tc.input !== undefined && tc.input !== null ? String(tc.input) : '',
    expectedOutput: tc.expectedOutput !== undefined && tc.expectedOutput !== null ? String(tc.expectedOutput) : '',
    isHidden: Boolean(tc.isHidden)
  }));

  const effectiveLang = (
    merged.compiler ||
    merged.programmingLanguage ||
    merged.technology ||
    language ||
    'javascript'
  ).toLowerCase().trim();

  try {
    const evalRes = await evaluateCode({
      code: solution,
      language: effectiveLang,
      testCases: normalizedTestCases,
      isSubmit: true
    });

    if (evalRes && evalRes.allPassed) {
      return {
        isValid: true,
        isTested: true,
        reason: '',
        compilerError: null,
        failedTestCases: [],
        evalRes
      };
    }

    // Identify exact failure reason
    let flagReason = 'Reference solution failed one or more test cases.';
    let compilerError = evalRes?.error || null;

    if (evalRes?.status === 'COMPILATION_ERROR' || evalRes?.verdict === 'Compilation Error') {
      flagReason = 'Reference solution compilation failed.';
    } else if (evalRes?.status === 'RUNTIME_ERROR' || evalRes?.verdict === 'Runtime Error') {
      flagReason = 'Runtime error occurred during execution.';
    } else if (evalRes?.status === 'TIME_LIMIT_EXCEEDED' || evalRes?.verdict === 'Time Limit Exceeded') {
      flagReason = 'Validation timed out (Time Limit Exceeded).';
    } else if (evalRes?.status === 'SECURITY_VIOLATION') {
      flagReason = 'Security violation detected in solution code.';
    } else if (evalRes?.testResults && evalRes.testResults.some(r => !r.passed)) {
      flagReason = 'Reference solution failed one or more test cases. Expected output does not match actual output.';
    }

    const failedCases = (evalRes?.testResults || [])
      .filter(r => !r.passed)
      .map(r => ({
        input: String(r.input || ''),
        expectedOutput: String(r.expected || ''),
        actualOutput: String(r.actual || ''),
        error: r.error || (r.status !== 'PASSED' ? r.status : '')
      }));

    return {
      isValid: false,
      isTested: false,
      reason: flagReason,
      compilerError: compilerError || (failedCases[0]?.error || null),
      failedTestCases: failedCases,
      evalRes
    };
  } catch (err) {
    return {
      isValid: false,
      isTested: false,
      reason: `Compiler or validation service error: ${err.message}`,
      compilerError: err.message,
      failedTestCases: []
    };
  }
}

// In-memory TTL Cache for question counts to prevent serverless database overload
const countsCache = new Map();
const COUNTS_CACHE_TTL_MS = 15000; // 15 seconds

/**
 * Calculates current accurate dashboard counts strictly from database records.
 * Uses intelligent TTL caching and fast single-aggregation queries to avoid timeouts.
 */
async function calculateCourseQuestionCounts(courseId, domainKey) {
  const cId = mongoose.Types.ObjectId.isValid(courseId) ? new mongoose.Types.ObjectId(courseId) : null;
  const dKey = domainKey || '';
  const cacheKey = `${cId ? cId.toString() : 'nocId'}_${dKey}`;

  // Return cached result if available and fresh (< 15 seconds)
  const cached = countsCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < COUNTS_CACHE_TTL_MS)) {
    return cached.counts;
  }

  const courseQuery = cId ? { $or: [{ courseId: cId }, { domain: dKey }] } : { domain: dKey };

  try {
    const countsPromise = (async () => {
      const [qAgg, dtAgg, totalModulesCount] = await Promise.all([
        InterviewQuestion.aggregate([
          { $match: { ...courseQuery, isActive: true } },
          { $group: {
              _id: {
                targetFeature: '$targetFeature',
                isTested: '$isTested',
                verificationStatus: '$verificationStatus'
              },
              count: { $sum: 1 }
          }}
        ]),
        DomainTask.aggregate([
          { $match: { ...courseQuery, isActive: true } },
          { $group: {
              _id: {
                isTested: '$isTested',
                verificationStatus: '$verificationStatus'
              },
              count: { $sum: 1 }
          }}
        ]),
        Module.countDocuments({ ...courseQuery, isPublished: { $ne: false } })
      ]);

      let interviewArenaCount = 0;
      let mockInterviewCount = 0;
      let testedQuestions = 0;
      let flaggedQuestions = 0;

      qAgg.forEach(r => {
        const { targetFeature, isTested, verificationStatus } = r._id;
        if (targetFeature === 'INTERVIEW_ARENA') interviewArenaCount += r.count;
        if (targetFeature === 'MOCK_INTERVIEW') mockInterviewCount += r.count;
        if (isTested && verificationStatus !== 'flagged') testedQuestions += r.count;
        if (verificationStatus === 'flagged') flaggedQuestions += r.count;
      });

      let testingPracticeCount = 0;
      let testedDomainTasks = 0;
      let flaggedDomainTasks = 0;

      dtAgg.forEach(r => {
        const { isTested, verificationStatus } = r._id;
        testingPracticeCount += r.count;
        if (isTested && verificationStatus !== 'flagged') testedDomainTasks += r.count;
        if (verificationStatus === 'flagged') flaggedDomainTasks += r.count;
      });

      const testedSolutionsCount = testedDomainTasks + testedQuestions;
      const flaggedCount = flaggedQuestions + flaggedDomainTasks;
      const totalQuestions = interviewArenaCount + mockInterviewCount + testingPracticeCount;

      return {
        interviewArena: interviewArenaCount,
        mockInterview: mockInterviewCount,
        testingPractice: testingPracticeCount,
        total: totalQuestions,
        testedSolutions: testedSolutionsCount,
        flagged: flaggedCount,
        totalModules: totalModulesCount
      };
    })();

    // 4000ms safety timeout guard: prevents serverless timeout if Atlas is sluggish
    const timeoutFallback = new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          interviewArena: 0,
          mockInterview: 0,
          testingPractice: 0,
          total: 0,
          testedSolutions: 0,
          flagged: 0,
          totalModules: 4
        });
      }, 4000);
    });

    const counts = await Promise.race([countsPromise, timeoutFallback]);
    countsCache.set(cacheKey, { timestamp: Date.now(), counts });
    return counts;
  } catch (err) {
    console.warn('[calculateCourseQuestionCounts Error]:', err.message);
    return {
      interviewArena: 0,
      mockInterview: 0,
      testingPractice: 0,
      total: 0,
      testedSolutions: 0,
      flagged: 0,
      totalModules: 4
    };
  }
}

module.exports = {
  validateQuestionContent,
  calculateCourseQuestionCounts
};
