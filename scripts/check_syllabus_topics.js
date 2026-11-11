const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

async function checkModules() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/game_project');
  const Course = require('../models/Course');
  const Module = require('../models/Module');
  const DomainTask = require('../models/DomainTask');

  const courses = await Course.find({}).lean();
  for (const c of courses) {
    console.log(`\n======================================================`);
    console.log(`COURSE: ${c.title} (slug: ${c.slug}, domain: ${c.domain})`);
    console.log(`======================================================`);
    const mods = await Module.find({ courseId: c._id }).sort({ order: 1 }).lean();
    for (const m of mods) {
      const tasks = await DomainTask.find({ moduleId: m._id }).sort({ order: 1 }).lean();
      console.log(`  Module ${m.order}: "${m.title}" (${tasks.length} tasks/topics)`);
      tasks.slice(0, 5).forEach(t => console.log(`     - Task [${t.order}]: "${t.title}" (${t.difficulty})`));
      if (tasks.length > 5) console.log(`     ... and ${tasks.length - 5} more tasks`);
    }
  }
  process.exit(0);
}

checkModules().catch(console.error);
