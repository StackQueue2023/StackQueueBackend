const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const InterviewQuestion = require('../models/InterviewQuestion');
    const Submission = require('../models/InterviewSubmission');
    
    const submissions = await Submission.find({}).lean();
    console.log('Total submissions:', submissions.length);
    for (const sub of submissions) {
      console.log('Submission for questionId:', sub.questionId, 'studentId:', sub.studentId, 'status:', sub.status);
      const q = await InterviewQuestion.findById(sub.questionId).lean();
      if (q) {
        console.log('Question:', q.questionNumber, q.title, q.domain);
      }
    }

    const nonAlpha = await InterviewQuestion.find({
      'examples.input': { $ne: 'alpha' },
      inputFormat: { $not: /alpha/i },
      problemStatement: { $not: /In enterprise .* engineering, candidate understanding of/i }
    }).select('questionNumber title domain targetFeature').lean();
    console.log('Non-alpha questions:', nonAlpha);
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}
check();
