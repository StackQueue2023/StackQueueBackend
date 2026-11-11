const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const InterviewQuestion = require('../models/InterviewQuestion');
    const total = await InterviewQuestion.countDocuments();
    const byTarget = await InterviewQuestion.aggregate([
      { $group: { _id: '$targetFeature', count: { $sum: 1 } } }
    ]);
    const byDomain = await InterviewQuestion.aggregate([
      { $group: { _id: '$domain', count: { $sum: 1 } } }
    ]);
    const alphaCount = await InterviewQuestion.countDocuments({
      $or: [
        { 'examples.input': 'alpha' },
        { inputFormat: /alpha/i },
        { problemStatement: /In enterprise .* engineering, candidate understanding of/i }
      ]
    });
    console.log(JSON.stringify({ total, byTarget, byDomain, alphaCount }, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}
check();
