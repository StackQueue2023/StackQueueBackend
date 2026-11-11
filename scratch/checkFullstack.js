const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/stackqueue';

mongoose.connect(MONGODB_URI).then(async () => {
  const InterviewQuestion = require('../models/InterviewQuestion');
  const fsQuestions = await InterviewQuestion.find({
    $or: [
      { domain: /fullstack/i },
      { category: /fullstack/i },
      { tags: /fullstack/i }
    ]
  }).select('questionNumber title domain category tags');
  console.log('Fullstack questions count:', fsQuestions.length);
  if (fsQuestions.length > 0) {
    console.log(fsQuestions);
  }
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
