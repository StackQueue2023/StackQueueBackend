const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

async function runSync() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB. Starting Syllabus-Based Question Generation...');

  const Course = require('../models/Course');
  const { generateAllSyllabusQuestionBanks, generateSyllabusCoverageReport } = require('../services/syllabusQuestionSeederService');

  const courses = await Course.find({ isActive: true }).sort({ title: 1 });
  console.log(`Found ${courses.length} active courses in DB.`);

  for (const c of courses) {
    console.log(`\n=============================================================`);
    console.log(`Processing Syllabus for Course: "${c.title}" (${c.slug})`);
    console.log(`=============================================================`);

    const result = await generateAllSyllabusQuestionBanks(c._id, {
      onProgress: (p) => {
        console.log(`  -> Module ${p.moduleOrder}: "${p.moduleTitle}" [${p.percent}%]`);
      }
    });

    console.log(`Completed ${c.title}:`, result.createdQuestions);
  }

  console.log('\n=============================================================');
  console.log('Generating Syllabus Coverage Report...');
  console.log('=============================================================');
  const report = await generateSyllabusCoverageReport();
  console.log('Summary:', JSON.stringify(report.summary, null, 2));
  console.log(`Total Topics in Coverage Report: ${report.rows.length}`);
  console.log(`First 5 Rows Preview:`);
  report.rows.slice(0, 5).forEach((r, idx) => {
    console.log(`  [${idx + 1}] ${r.courseName} | ${r.moduleTitle} -> Topic: "${r.topic}" | Arena: ${r.arenaCount}, Module: ${r.moduleCount}, Mock: ${r.mockCount} | Status: ${r.validationStatus}`);
  });

  // Verify Kumar's submission on Q1001
  const InterviewSubmission = require('../models/InterviewSubmission');
  const subs = await InterviewSubmission.find({}).lean();
  console.log(`\nVerified Student Submissions Count: ${subs.length}`);
  subs.forEach(s => {
    console.log(`  - Submission ID ${s._id}: Question ${s.questionId}, Status=${s.status}`);
  });

  process.exit(0);
}

runSync().catch(err => {
  console.error('Error during syllabus question sync:', err);
  process.exit(1);
});
