const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });

const InterviewQuestion = require('../models/InterviewQuestion');
const InterviewTestCase = require('../models/InterviewTestCase');
const InterviewSubmission = require('../models/InterviewSubmission');
const { isGenericTemplateQuestion } = require('../services/questionUniquenessService');

async function audit() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('--- FINAL DATABASE QUESTION AUDIT ---');

  const total = await InterviewQuestion.countDocuments();
  const byTarget = await InterviewQuestion.aggregate([
    { $group: { _id: '$targetFeature', count: { $sum: 1 } } }
  ]);
  const byDomain = await InterviewQuestion.aggregate([
    { $group: { _id: { domain: '$domain', target: '$targetFeature' }, count: { $sum: 1 } } }
  ]);
  const byDiff = await InterviewQuestion.aggregate([
    { $group: { _id: { target: '$targetFeature', diff: '$difficulty' }, count: { $sum: 1 } } }
  ]);

  const alphaQuestions = await InterviewQuestion.countDocuments({
    $or: [
      { 'examples.input': 'alpha' },
      { inputFormat: /alpha/i },
      { problemStatement: /In enterprise .* engineering, candidate understanding of/i }
    ]
  });

  const allQuestions = await InterviewQuestion.find({}).lean();
  let genericMatches = 0;
  for (const q of allQuestions) {
    if (isGenericTemplateQuestion(q)) genericMatches++;
  }

  const submissions = await InterviewSubmission.find({}).lean();
  let submissionValid = false;
  for (const s of submissions) {
    const q = await InterviewQuestion.findById(s.questionId).lean();
    if (q && q.questionNumber === 1001) {
      submissionValid = true;
      console.log(`Student submission linked to question 1001 verified! Question title: "${q.title}", domain: "${q.domain}"`);
    }
  }

  const totalTestCases = await InterviewTestCase.countDocuments();

  console.log(JSON.stringify({
    totalQuestions: total,
    byTarget,
    byDomain,
    byDiff,
    alphaQuestions,
    genericMatches,
    submissionValid,
    totalTestCases
  }, null, 2));

  await mongoose.disconnect();
}

audit();
