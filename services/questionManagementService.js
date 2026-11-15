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

/**
 * Calculates current accurate dashboard counts strictly from database records.
 * Ensures a question is NEVER counted as both tested and flagged.
 */
async function calculateCourseQuestionCounts(courseId, domainKey) {
  const cId = mongoose.Types.ObjectId.isValid(courseId) ? new mongoose.Types.ObjectId(courseId) : null;
  const dKey = domainKey || '';

  const courseQuery = cId ? { $or: [{ courseId: cId }, { domain: dKey }] } : { domain: dKey };

  const [
    interviewArenaCount,
    mockInterviewCount,
    testingPracticeCount,
    testedDomainTasks,
    testedInterviewQuestions,
    flaggedInterviewQuestions,
    flaggedDomainTasks,
    totalModulesCount
  ] = await Promise.all([
    InterviewQuestion.countDocuments({
      ...courseQuery,
      targetFeature: 'INTERVIEW_ARENA',
      isActive: true
    }),
    InterviewQuestion.countDocuments({
      ...courseQuery,
      targetFeature: 'MOCK_INTERVIEW',
      isActive: true
    }),
    DomainTask.countDocuments({
      ...courseQuery,
      isActive: true
    }),
    DomainTask.countDocuments({
      ...courseQuery,
      isTested: true,
      verificationStatus: { $ne: 'flagged' },
      isActive: true
    }),
    InterviewQuestion.countDocuments({
      ...courseQuery,
      isTested: true,
      verificationStatus: { $ne: 'flagged' },
      isActive: true
    }),
    InterviewQuestion.countDocuments({
      ...courseQuery,
      verificationStatus: 'flagged',
      isActive: true
    }),
    DomainTask.countDocuments({
      ...courseQuery,
      verificationStatus: 'flagged',
      isActive: true
    }),
    Module.countDocuments({
      ...courseQuery,
      isPublished: { $ne: false }
    })
  ]);

  const testedSolutionsCount = testedDomainTasks + testedInterviewQuestions;
  const flaggedCount = flaggedInterviewQuestions + flaggedDomainTasks;
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
}

module.exports = {
  validateQuestionContent,
  calculateCourseQuestionCounts
};
