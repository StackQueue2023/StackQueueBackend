const mongoose = require('mongoose');
require('dotenv').config();
const Course = require('../models/Course');
const Module = require('../models/Module');
const StudentProfile = require('../models/StudentProfile');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/game_project');
  console.log('--- ALL COURSES ---');
  const courses = await Course.find();
  for (const c of courses) {
    const mods = await Module.find({ courseId: c._id });
    console.log(`Course ID: ${c._id} | Title: "${c.title}" | Slug: "${c.slug}" | Modules by courseId: ${mods.length}`);
    mods.forEach(m => console.log(`   - Module ID: ${m._id} | Order: ${m.order} | Title: "${m.title}" | Domain: "${m.domain}"`));
  }

  console.log('\n--- ALL MODULES IN DB ---');
  const allMods = await Module.find();
  console.log(`Total Modules in DB: ${allMods.length}`);
  allMods.forEach(m => console.log(`Module ID: ${m._id} | CourseId: ${m.courseId} | Domain: "${m.domain}" | Title: "${m.title}"`));

  console.log('\n--- ALL STUDENT PROFILES ---');
  const profiles = await StudentProfile.find().populate('enrolledCourseId');
  for (const p of profiles) {
    console.log(`StudentProfile ID: ${p._id} | User: ${p.userId} | domain: "${p.domain}" | enrolledCourseId: ${p.enrolledCourseId ? p.enrolledCourseId._id + ' (' + p.enrolledCourseId.title + ')' : 'null'}`);
  }

  await mongoose.disconnect();
}
check().catch(err => console.error(err));
