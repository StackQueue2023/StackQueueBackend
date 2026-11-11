const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/stackqueue';
const { evaluateCode } = require('../services/interviewCodeRunner');

mongoose.connect(MONGODB_URI).then(async () => {
  const InterviewQuestion = require('../models/InterviewQuestion');
  const InterviewTestCase = require('../models/InterviewTestCase');

  const testLangs = ['java', 'python', 'javascript', 'cpp'];
  for (const lang of testLangs) {
    const q = await InterviewQuestion.findOne({ domain: lang === 'cpp' ? 'cpp' : lang });
    if (!q) {
      console.log(`No question found for domain ${lang}`);
      continue;
    }
    const tcs = await InterviewTestCase.find({ questionId: q._id }).limit(2);
    console.log(`\nTesting ${lang.toUpperCase()} on Q#${q.questionNumber}: "${q.title}"`);
    const code = q.starterCode?.[lang];
    if (!code) {
      console.log(`No starter code for ${lang} in Q#${q.questionNumber}`);
      continue;
    }
    console.log(`Code preview: ${code.slice(0, 60).replace(/\n/g, ' ')}...`);
    try {
      const res = await evaluateCode({
        language: lang,
        code,
        testCases: tcs,
        isSubmit: false
      });
      console.log(`Result for ${lang}: passed=${res.passedTests}/${res.totalTests}, allPassed=${res.allPassed}, error=${res.error || 'none'}`);
    } catch (e) {
      console.error(`Runner failed for ${lang}:`, e.message);
    }
  }

  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
