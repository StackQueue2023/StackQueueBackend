const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const InterviewQuestion = require('../models/InterviewQuestion');

async function checkDomains() {
  await mongoose.connect(process.env.MONGODB_URI);

  const searchTerms = ['sql', 'security', 'web', 'fullstack', 'database', 'cyber'];
  for (const term of searchTerms) {
    const reg = new RegExp(term, 'i');
    const count = await InterviewQuestion.countDocuments({
      $or: [{ domain: reg }, { category: reg }, { tags: reg }, { title: reg }]
    });
    console.log(`Count for term "${term}":`, count);
  }

  // Also inspect what unique domains exist in DomainTask
  const DomainTask = require('../models/DomainTask');
  const dTasks = await DomainTask.aggregate([
    { $group: { _id: '$domain', count: { $sum: 1 } } }
  ]);
  console.log('\nDomainTask unique domains count:', dTasks.length);

  await mongoose.disconnect();
}

checkDomains().catch(console.error);
