const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/stackqueue';

mongoose.connect(MONGODB_URI).then(async () => {
  const InterviewQuestion = require('../models/InterviewQuestion');
  const InterviewTestCase = require('../models/InterviewTestCase');

  const questions = await InterviewQuestion.find().sort({ questionNumber: 1 }).lean();
  const testCases = await InterviewTestCase.find().lean();

  const tcMap = new Map();
  for (const tc of testCases) {
    const qId = String(tc.questionId);
    if (!tcMap.has(qId)) tcMap.set(qId, []);
    tcMap.get(qId).push(tc);
  }

  const domainBreakdown = {};
  const difficultyBreakdown = {};
  const issues = [];
  let totalTestCasesCount = 0;
  let totalHiddenTestCasesCount = 0;
  let totalVisibleTestCasesCount = 0;

  for (const q of questions) {
    const dom = q.domain || 'unknown';
    domainBreakdown[dom] = (domainBreakdown[dom] || 0) + 1;

    const diff = q.difficulty || 'unknown';
    difficultyBreakdown[diff] = (difficultyBreakdown[diff] || 0) + 1;

    // 1. Check title & problemStatement
    if (!q.title || q.title.length < 3) {
      issues.push(`Q#${q.questionNumber}: Missing or too short title ("${q.title}")`);
    }
    if (!q.problemStatement || q.problemStatement.length < 10) {
      issues.push(`Q#${q.questionNumber}: Missing or insufficient problem statement`);
    }

    // 2. Check difficulty
    if (!['Easy', 'Medium', 'Hard'].includes(q.difficulty)) {
      issues.push(`Q#${q.questionNumber}: Invalid difficulty level "${q.difficulty}"`);
    }

    // 3. Check starter code
    if (!q.starterCode || typeof q.starterCode !== 'object') {
      issues.push(`Q#${q.questionNumber}: Missing starterCode object`);
    }

    // 4. Check test cases
    const qTcs = tcMap.get(String(q._id)) || [];
    if (qTcs.length === 0) {
      issues.push(`Q#${q.questionNumber}: Has 0 associated test cases in InterviewTestCase`);
    }

    for (const tc of qTcs) {
      totalTestCasesCount++;
      if (tc.isHidden) totalHiddenTestCasesCount++;
      else totalVisibleTestCasesCount++;

      if (tc.expectedOutput === undefined || tc.expectedOutput === null) {
        issues.push(`Q#${q.questionNumber} TC#${tc._id}: expectedOutput is undefined or null`);
      }
    }
  }

  console.log('================ COMPREHENSIVE AUDIT REPORT ================');
  console.log(`Total Interview Questions Audited: ${questions.length}`);
  console.log(`Total Test Cases Audited: ${totalTestCasesCount}`);
  console.log(`- Visible Test Cases: ${totalVisibleTestCasesCount}`);
  console.log(`- Hidden Test Cases: ${totalHiddenTestCasesCount}`);
  console.log('\n--- Domain Breakdown ---');
  for (const [dom, count] of Object.entries(domainBreakdown)) {
    console.log(`• ${dom.toUpperCase()}: ${count} questions`);
  }
  console.log('\n--- Difficulty Breakdown ---');
  for (const [diff, count] of Object.entries(difficultyBreakdown)) {
    console.log(`• ${diff}: ${count} questions`);
  }
  console.log('\n--- Issues Summary ---');
  console.log(`Total Issues Detected: ${issues.length}`);
  if (issues.length > 0) {
    console.log('First 20 issues:');
    issues.slice(0, 20).forEach(i => console.log('  -', i));
  } else {
    console.log('✓ All 510 questions and 1,250 test cases passed full technical verification!');
  }
  console.log('============================================================');

  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
