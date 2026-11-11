const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });
const InterviewTestCase = require('../models/InterviewTestCase');

async function clean1001() {
  await mongoose.connect(process.env.MONGODB_URI);
  const deleted = await InterviewTestCase.deleteMany({
    questionNumber: 1001,
    input: { $in: ['alpha', 'sample data', 'hidden edge case', '123 test 456'] }
  });
  console.log('Deleted old test cases for 1001:', deleted.deletedCount);
  const remaining = await InterviewTestCase.find({ questionNumber: 1001 }).lean();
  console.log('Remaining test cases for 1001:', remaining.length);
  await mongoose.disconnect();
}
clean1001();
