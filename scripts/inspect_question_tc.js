const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const InterviewQuestion = require('../models/InterviewQuestion');
const InterviewTestCase = require('../models/InterviewTestCase');

async function inspect() {
  await mongoose.connect(process.env.MONGODB_URI);
  const q = await InterviewQuestion.findById('6aec842a2d74146a202eef29');
  console.log('QUESTION:', q ? `${q.title} (Q#${q.questionNumber}, domain: ${q.domain})` : 'NOT FOUND');
  if (q) {
    const tcs = await InterviewTestCase.find({ questionId: q._id }).sort({ isHidden: 1 });
    console.log(`TOTAL TEST CASES IN DB: ${tcs.length}`);
    tcs.forEach((tc, idx) => {
      console.log(`  [${idx + 1}] ID: ${tc._id} | isHidden: ${tc.isHidden} | Input: ${JSON.stringify(tc.input)} | Expected: ${JSON.stringify(tc.expectedOutput)}`);
    });
  }
  process.exit(0);
}

inspect().catch(err => {
  console.error(err);
  process.exit(1);
});
