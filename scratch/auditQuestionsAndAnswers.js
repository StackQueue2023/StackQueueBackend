const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/stackqueue';

mongoose.connect(MONGODB_URI).then(async () => {
  const InterviewQuestion = require('../models/InterviewQuestion');
  const InterviewTestCase = require('../models/InterviewTestCase');

  const allQuestions = await InterviewQuestion.find().sort({ questionNumber: 1 });
  console.log(`Total questions in InterviewQuestion: ${allQuestions.length}`);

  const allTestCases = await InterviewTestCase.find().lean();
  console.log(`Total test cases in InterviewTestCase: ${allTestCases.length}`);

  const testCasesByQuestion = {};
  for (const tc of allTestCases) {
    const qIdStr = tc.questionId ? tc.questionId.toString() : 'unknown';
    if (!testCasesByQuestion[qIdStr]) testCasesByQuestion[qIdStr] = [];
    testCasesByQuestion[qIdStr].push(tc);
  }

  const domainStats = {};
  const issues = [];
  const domainMismatch = [];
  const missingStarterCode = [];
  const missingTestCases = [];

  for (const q of allQuestions) {
    domainStats[q.domain] = (domainStats[q.domain] || 0) + 1;

    // Check title, problemStatement, difficulty
    if (!q.title || q.title.trim() === '') {
      issues.push(`Q#${q.questionNumber} (${q._id}): Missing title`);
    }
    if (!q.problemStatement || q.problemStatement.trim() === '') {
      issues.push(`Q#${q.questionNumber} (${q._id}): Missing problem statement`);
    }
    if (!q.difficulty) {
      issues.push(`Q#${q.questionNumber} (${q._id}): Missing difficulty`);
    }

    // Check domain relevance
    const titleLower = (q.title || '').toLowerCase();
    const dom = q.domain;

    if (dom === 'java') {
      if (titleLower.includes('python') || titleLower.includes('c++') || (titleLower.includes('javascript') && !titleLower.includes('java'))) {
        domainMismatch.push(`Q#${q.questionNumber} domain is java but title is "${q.title}"`);
      }
    } else if (dom === 'python') {
      if (titleLower.includes('java ') || titleLower.includes('c++') || titleLower.includes('javascript')) {
        domainMismatch.push(`Q#${q.questionNumber} domain is python but title is "${q.title}"`);
      }
    } else if (dom === 'cpp') {
      if (titleLower.includes('python') || (titleLower.includes('java') && !titleLower.includes('javascript')) || titleLower.includes('javascript')) {
        domainMismatch.push(`Q#${q.questionNumber} domain is cpp but title is "${q.title}"`);
      }
    } else if (dom === 'javascript') {
      if (titleLower.includes('python') || titleLower.includes('c++') || (titleLower.includes('java ') && !titleLower.includes('javascript'))) {
        domainMismatch.push(`Q#${q.questionNumber} domain is javascript but title is "${q.title}"`);
      }
    }

    // Check starter code
    if (!q.starterCode || Object.keys(q.starterCode).length === 0) {
      missingStarterCode.push(`Q#${q.questionNumber} (${q.title}) has no starter code`);
    }

    // Check test cases
    const tc = testCasesByQuestion[q._id.toString()] || [];
    if (tc.length === 0) {
      missingTestCases.push(`Q#${q.questionNumber} "${q.title}" has 0 test cases`);
    } else {
      for (const t of tc) {
        if (t.expectedOutput === undefined || t.expectedOutput === null) {
          issues.push(`Q#${q.questionNumber} test case has null expectedOutput`);
        }
      }
    }
  }

  console.log('Domain stats:', domainStats);
  console.log(`General Issues: ${issues.length}`);
  if (issues.length > 0) console.log(issues.slice(0, 10));

  console.log(`Domain mismatches: ${domainMismatch.length}`);
  if (domainMismatch.length > 0) console.log(domainMismatch);

  console.log(`Missing starter code: ${missingStarterCode.length}`);
  if (missingStarterCode.length > 0) console.log(missingStarterCode.slice(0, 10));

  console.log(`Questions missing test cases: ${missingTestCases.length}`);
  if (missingTestCases.length > 0) console.log(missingTestCases.slice(0, 10));

  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
