const path = require('path');
const fs = require('fs');
const envPath = fs.existsSync(path.join(__dirname, '../.env')) ? path.join(__dirname, '../.env') : path.join(__dirname, '../../.env');
require('dotenv').config({ path: envPath });
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const Course = require('../models/Course');
const Module = require('../models/Module');
const DomainTask = require('../models/DomainTask');
const InterviewQuestion = require('../models/InterviewQuestion');
const Challenge = require('../models/Challenge');

async function main() {
  await connectDB();
  console.log('Connected to DB');

  const courses = await Course.find({ isActive: true }).lean();
  console.log('\n=== COURSES ===');
  for (const c of courses) {
    console.log(`- ${c.title} (slug: ${c.slug}, _id: ${c._id})`);
    const mods = await Module.find({ courseId: c._id }).sort({ order: 1 }).lean();
    console.log(`  Modules (${mods.length}):`);
    for (const m of mods.slice(0, 5)) {
      console.log(`    [${m.order}] ${m.title} | desc: ${(m.description || '').slice(0, 80)} | topics: ${JSON.stringify(m.topics)}`);
      const tasks = await DomainTask.find({ moduleId: m._id }).sort({ order: 1 }).select('title difficulty taskType').lean();
      console.log(`       Tasks (${tasks.length}): ${tasks.slice(0, 4).map(t => t.title).join(' ; ')}`);
      const iqs = await InterviewQuestion.find({ moduleId: m._id }).select('title targetFeature topic difficulty').lean();
      console.log(`       InterviewQuestions (${iqs.length}): ${iqs.slice(0, 3).map(q => `[${q.targetFeature}] ${q.title}`).join(' ; ')}`);
    }
  }

  // Also check modules without courseId or domain mismatches
  const allModsCount = await Module.countDocuments();
  console.log(`\nTotal Modules in DB: ${allModsCount}`);
  console.log(`Total DomainTasks: ${await DomainTask.countDocuments()}`);
  console.log(`Total InterviewQuestions: ${await InterviewQuestion.countDocuments()}`);
  console.log(`Total Challenges: ${await Challenge.countDocuments()}`);

  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
