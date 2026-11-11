const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/stackqueue';

mongoose.connect(MONGODB_URI).then(async () => {
  const InterviewQuestion = require('../models/InterviewQuestion');
  const cppQuestions = await InterviewQuestion.find({ domain: 'cpp' }).limit(5);
  for (const q of cppQuestions) {
    console.log(`Q#${q.questionNumber}: starterCode keys:`, Object.keys(q.starterCode || {}));
    console.log(q.starterCode);
  }
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
