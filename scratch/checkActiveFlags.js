const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/stackqueue';

mongoose.connect(MONGODB_URI).then(async () => {
  const InterviewQuestion = require('../models/InterviewQuestion');
  const total = await InterviewQuestion.countDocuments();
  const activeCount = await InterviewQuestion.countDocuments({ isActive: true });
  const inactiveCount = await InterviewQuestion.countDocuments({ isActive: false });
  const isDailyOnlyTrue = await InterviewQuestion.countDocuments({ isDailyOnly: true });
  const isDailyOnlyFalse = await InterviewQuestion.countDocuments({ isDailyOnly: false });
  const isDailyOnlyMissing = await InterviewQuestion.countDocuments({ isDailyOnly: { $exists: false } });

  console.log({
    total,
    activeCount,
    inactiveCount,
    isDailyOnlyTrue,
    isDailyOnlyFalse,
    isDailyOnlyMissing
  });

  const sampleInactive = await InterviewQuestion.find({ isActive: false }).limit(3).select('questionNumber title isActive domain');
  console.log('Sample inactive:', sampleInactive);

  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
