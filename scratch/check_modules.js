const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });
const Course = require('../models/Course');
const Module = require('../models/Module');
const DomainTask = require('../models/DomainTask');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const courses = await Course.find({}, 'title slug domain').lean();
  for (const c of courses) {
    const modsByCourseId = await Module.countDocuments({ courseId: c._id });
    const tasksByCourseId = await DomainTask.countDocuments({ courseId: c._id });
    console.log(`Course: "${c.title}" (ID: ${c._id}, slug: "${c.slug}", domain: "${c.domain}")`);
    console.log(`  Modules with courseId: ${modsByCourseId}`);
    console.log(`  Tasks with courseId: ${tasksByCourseId}`);
  }

  // Check modules with null courseId
  const orphanMods = await Module.countDocuments({ courseId: null });
  console.log(`\nModules with null courseId: ${orphanMods}`);
  if (orphanMods > 0) {
    const orphans = await Module.find({ courseId: null }, 'title domain').lean();
    console.log('Orphan modules:', orphans);
  }

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
