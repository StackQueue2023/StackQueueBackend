const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const InterviewQuestion = require('../models/InterviewQuestion');
const InterviewTestCase = require('../models/InterviewTestCase');

async function inspect() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const total = await InterviewQuestion.countDocuments();
  console.log('Total InterviewQuestions in DB:', total);

  const byDomain = await InterviewQuestion.aggregate([
    { $group: { _id: '$domain', count: { $sum: 1 }, sample: { $first: '$title' } } }
  ]);
  console.log('Grouped by domain:', JSON.stringify(byDomain, null, 2));

  const byDifficulty = await InterviewQuestion.aggregate([
    { $group: { _id: '$difficulty', count: { $sum: 1 } } }
  ]);
  console.log('Grouped by difficulty:', JSON.stringify(byDifficulty, null, 2));

  const testCasesCount = await InterviewTestCase.countDocuments();
  console.log('Total InterviewTestCases in DB:', testCasesCount);

  // Check categories
  const categories = await InterviewQuestion.aggregate([
    { $group: { _id: { domain: '$domain', category: '$category' }, count: { $sum: 1 } } },
    { $sort: { '_id.domain': 1, count: -1 } }
  ]);
  console.log('Categories breakdown (first 20):', JSON.stringify(categories.slice(0, 20), null, 2));

  // Check if there are other questions or courses in the DB
  const Course = require('../models/Course');
  const courses = await Course.find({}, 'title code category domain');
  console.log('Courses in DB:', JSON.stringify(courses, null, 2));

  // Check DomainTask model (which also has domain tasks)
  const DomainTask = require('../models/DomainTask');
  const domainTasksCount = await DomainTask.countDocuments();
  console.log('Total DomainTasks in DB:', domainTasksCount);
  const domainTasksByDomain = await DomainTask.aggregate([
    { $group: { _id: '$domain', count: { $sum: 1 } } }
  ]);
  console.log('DomainTasks grouped by domain:', JSON.stringify(domainTasksByDomain, null, 2));

  await mongoose.disconnect();
  process.exit(0);
}

inspect().catch(e => {
  console.error(e);
  process.exit(1);
});
