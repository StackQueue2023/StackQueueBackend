const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });

const InterviewQuestion = require('../models/InterviewQuestion');
const InterviewTestCase = require('../models/InterviewTestCase');
const InterviewSubmission = require('../models/InterviewSubmission');
const StudentProfile = require('../models/StudentProfile');

async function testEndpoints() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Testing question database queries...');

  // 1. Domains check
  const domains = await InterviewQuestion.aggregate([
    {
      $group: {
        _id: { domain: '$domain', target: '$targetFeature' },
        count: { $sum: 1 }
      }
    }
  ]);
  console.log('Domain stats:', domains);

  // 2. Sample Java Arena question 1001
  const q1001 = await InterviewQuestion.findOne({ questionNumber: 1001 }).lean();
  console.log('Question 1001:', {
    id: q1001._id,
    title: q1001.title,
    difficulty: q1001.difficulty,
    examples: q1001.examples
  });

  // Test cases for 1001
  const tc1001 = await InterviewTestCase.find({ questionId: q1001._id }).lean();
  console.log('Test cases for 1001 count:', tc1001.length);
  tc1001.forEach(t => console.log({ input: t.input, expected: t.expectedOutput, isHidden: t.isHidden }));

  // 3. Submissions check
  const subs = await InterviewSubmission.find({ questionId: q1001._id }).lean();
  console.log('Submissions on 1001 count:', subs.length);

  await mongoose.disconnect();
}

testEndpoints();
