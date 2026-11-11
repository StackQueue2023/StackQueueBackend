const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Course = require('../models/Course');
const InterviewQuestion = require('../models/InterviewQuestion');
const { generateSyllabusCoverageReport } = require('../services/syllabusQuestionSeederService');

async function verify() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB.\n');

  const courses = await Course.find({ isActive: true }).lean();
  console.log(`Active Courses (${courses.length}):`);

  for (const c of courses) {
    const domainKey = (c.slug || c.title).toLowerCase().replace(/[^a-z0-9]/g, '');
    const arena = await InterviewQuestion.countDocuments({
      $or: [{ courseId: c._id }, { domain: domainKey }],
      targetFeature: 'INTERVIEW_ARENA',
      isActive: true
    });
    const modQ = await InterviewQuestion.countDocuments({
      $or: [{ courseId: c._id }, { domain: domainKey }],
      targetFeature: 'MODULE_QUESTIONS',
      isActive: true
    });
    const mock = await InterviewQuestion.countDocuments({
      $or: [{ courseId: c._id }, { domain: domainKey }],
      targetFeature: 'MOCK_INTERVIEW',
      isActive: true
    });

    console.log(`- ${c.title} (${domainKey}):`);
    console.log(`    Interview Arena   : ${arena} Qs`);
    console.log(`    Module Questions  : ${modQ} Qs`);
    console.log(`    Mock Interview    : ${mock} Qs`);
    console.log(`    Total Course Qs   : ${arena + modQ + mock} Qs`);
  }

  const report = await generateSyllabusCoverageReport();
  console.log('\n--- Overall Syllabus Coverage Summary ---');
  console.log(JSON.stringify(report.summary, null, 2));

  process.exit(0);
}

verify().catch(err => {
  console.error(err);
  process.exit(1);
});
