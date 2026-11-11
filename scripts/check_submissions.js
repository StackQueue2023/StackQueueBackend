const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const InterviewSubmission = require('../models/InterviewSubmission');
  const StudentDomainProgress = require('../models/StudentDomainProgress');
  const InterviewProgress = require('../models/InterviewProgress');
  const Attempt = require('../models/Attempt');

  const subs = await InterviewSubmission.find({}).lean();
  console.log(`Total InterviewSubmissions: ${subs.length}`);
  const InterviewQuestion = require('../models/InterviewQuestion');
  for (const s of subs) {
    const q = await InterviewQuestion.findById(s.questionId).lean();
    console.log(` - Sub ${s._id} for question ${s.questionId}: status=${s.status}, Q#=${q?.questionNumber}, title="${q?.title}", domain="${q?.domain}"`);
  }

  const progress = await InterviewProgress.find({}).lean();
  console.log(`Total InterviewProgress: ${progress.length}`);
  progress.forEach(p => {
    console.log(` - Progress user ${p.studentId}: unlocked=${p.unlockedLevel}, solved=${p.solvedQuestions?.length}`);
  });

  process.exit(0);
}

main().catch(console.error);
