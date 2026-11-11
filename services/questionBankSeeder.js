const path = require('path');
const mongoose = require('mongoose');
const InterviewQuestion = require('../models/InterviewQuestion');
const InterviewTestCase = require('../models/InterviewTestCase');
const QuestionRegistry = require('../models/QuestionRegistry');
const questionsData500 = require('../data/questionsData500');
const { registerQuestion } = require('./questionRegistryService');

/**
 * Seeds and ensures EVERY active domain has exactly 100 unique questions
 * (35 Easy, 40 Medium, 25 Hard = 100 Total per domain).
 */
async function seedAll100QuestionsPerDomain() {
  const existingCount = await InterviewQuestion.countDocuments({ isActive: true });
  if (existingCount >= 500) {
    console.log(`[QuestionBankSeeder] Question bank already populated (${existingCount} questions). Skipping re-seed.`);
    const tcCount = await InterviewTestCase.countDocuments();
    return {
      seededQuestionsCount: existingCount,
      seededTestCasesCount: tcCount
    };
  }

  console.log(`[QuestionBankSeeder] Starting fast batch seeding for 100 questions per active domain (${questionsData500.length} total questions)...`);

  // Clear existing interview questions & test cases to guarantee fresh, non-duplicate 100 Qs per domain
  await InterviewQuestion.deleteMany({});
  await InterviewTestCase.deleteMany({});

  const questionDocs = [];
  const testCaseDocs = [];

  for (const q of questionsData500) {
    const qDomain = (q.domain || 'java').toLowerCase();
    const qId = new mongoose.Types.ObjectId();

    const safeExamples = (q.examples || []).map(ex => ({
      input: ex.input !== undefined && ex.input !== null && String(ex.input).trim() !== '' ? String(ex.input) : 'NONE',
      output: ex.output !== undefined && ex.output !== null && String(ex.output).trim() !== '' ? String(ex.output) : 'SUCCESS',
      explanation: ex.explanation || ''
    }));

    questionDocs.push({
      _id: qId,
      questionNumber: q.questionNumber,
      title: q.title,
      category: q.category,
      domain: qDomain,
      level: Math.min(10, Math.max(1, q.level || 1)),
      difficulty: q.difficulty,
      problemStatement: q.problemStatement,
      inputFormat: q.inputFormat || 'Formatted input',
      outputFormat: q.outputFormat || 'Expected output',
      constraints: q.constraints || 'Standard constraints',
      examples: safeExamples,
      starterCode: q.starterCode,
      hints: q.hints,
      xp: q.xp,
      timeLimit: q.timeLimit || 2000,
      memoryLimit: q.memoryLimit || 256,
      tags: Array.from(new Set([...(q.tags || []), qDomain])),
      isActive: true
    });

    if (Array.isArray(q.visibleTestCases)) {
      for (const tc of q.visibleTestCases) {
        testCaseDocs.push({
          questionId: qId,
          questionNumber: q.questionNumber,
          input: tc.input !== undefined && tc.input !== null && String(tc.input).trim() !== '' ? String(tc.input) : 'NONE',
          expectedOutput: tc.expectedOutput !== undefined && tc.expectedOutput !== null && String(tc.expectedOutput).trim() !== '' ? String(tc.expectedOutput) : 'SUCCESS',
          isHidden: false,
          explanation: tc.explanation || 'Example Test Case'
        });
      }
    }

    if (Array.isArray(q.hiddenTestCases)) {
      for (const tc of q.hiddenTestCases) {
        testCaseDocs.push({
          questionId: qId,
          questionNumber: q.questionNumber,
          input: tc.input !== undefined && tc.input !== null && String(tc.input).trim() !== '' ? String(tc.input) : 'NONE',
          expectedOutput: tc.expectedOutput !== undefined && tc.expectedOutput !== null && String(tc.expectedOutput).trim() !== '' ? String(tc.expectedOutput) : 'SUCCESS',
          isHidden: true,
          explanation: 'Hidden Validation Case'
        });
      }
    }
  }

  // Insert in fast chunks
  for (let i = 0; i < questionDocs.length; i += 100) {
    await InterviewQuestion.insertMany(questionDocs.slice(i, i + 100));
  }
  for (let i = 0; i < testCaseDocs.length; i += 250) {
    await InterviewTestCase.insertMany(testCaseDocs.slice(i, i + 250));
  }

  console.log(`[QuestionBankSeeder] Seeding complete! Seeded ${questionDocs.length} questions and ${testCaseDocs.length} test cases across active domains.`);

  const validation = await validateQuestionBank();
  return {
    seededQuestionsCount: questionDocs.length,
    seededTestCasesCount: testCaseDocs.length,
    validation
  };
}

/**
 * Validates database question counts and difficulty breakdown per active domain.
 */
async function validateQuestionBank() {
  const allQuestions = await InterviewQuestion.find({ isActive: true });

  const activeDomains = ['java', 'python', 'javascript', 'dsa', 'cpp'];
  const domainStats = {};

  activeDomains.forEach(dom => {
    domainStats[dom] = { total: 0, Easy: 0, Medium: 0, Hard: 0 };
  });

  allQuestions.forEach(q => {
    const dom = (q.domain || 'java').toLowerCase();
    if (!domainStats[dom]) {
      domainStats[dom] = { total: 0, Easy: 0, Medium: 0, Hard: 0 };
    }
    const diff = q.difficulty || 'Easy';
    domainStats[dom].total++;
    if (domainStats[dom][diff] !== undefined) {
      domainStats[dom][diff]++;
    }
  });

  let isHealthy = true;
  const reportLines = [];

  activeDomains.forEach(dom => {
    const stats = domainStats[dom];
    const isDomainHealthy = stats.total === 100 && stats.Easy === 35 && stats.Medium === 40 && stats.Hard === 25;
    if (!isDomainHealthy) isHealthy = false;

    reportLines.push(
      `Domain [${dom.toUpperCase()}]: Total = ${stats.total} Qs (Easy: ${stats.Easy}/35, Medium: ${stats.Medium}/40, Hard: ${stats.Hard}/25) -> ${isDomainHealthy ? 'OK' : 'MISMATCH'}`
    );
  });

  return {
    totalQuestions: allQuestions.length,
    activeDomains,
    domainStats,
    isHealthy,
    reportLines
  };
}

module.exports = {
  seedAll100QuestionsPerDomain,
  validateQuestionBank
};

// Standalone execution support
if (require.main === module) {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
  const connectDB = require('../config/db');
  connectDB().then(async () => {
    const res = await seedAll100QuestionsPerDomain();
    console.log('\n===== QUESTION BANK VALIDATION REPORT =====');
    res.validation.reportLines.forEach(l => console.log(l));
    console.log(`Overall Health Status: ${res.validation.isHealthy ? 'HEALTHY (100 Qs per active domain)' : 'NEEDS ATTENTION'}`);
    process.exit(0);
  }).catch(err => {
    console.error('[QuestionBankSeeder] Execution error:', err);
    process.exit(1);
  });
}
