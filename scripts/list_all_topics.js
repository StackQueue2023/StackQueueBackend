const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

async function listTopics() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Course = require('../models/Course');
  const Module = require('../models/Module');
  const DomainTask = require('../models/DomainTask');

  const courses = await Course.find({}).lean();
  for (const c of courses) {
    console.log(`\n=================== ${c.title} (${c.slug}) ===================`);
    const mods = await Module.find({ courseId: c._id }).sort({ order: 1 }).lean();
    for (const m of mods) {
      console.log(`Module ${m.order}: "${m.title}"`);
      // check if tasks have subtopics
      const tasks = await DomainTask.find({ moduleId: m._id }).sort({ order: 1 }).lean();
      const distinctTaskTitles = [...new Set(tasks.map(t => {
        let title = t.title || '';
        title = title.replace(/^Task\s+\d+\s*[-—:]*\s*(?:Overview & Architectural Foundation|Initial Implementation & Declaration|Data Manipulation & Operations in|Conditional Flows & Algorithmic Handling in|Structured Processing & Methods|Practice & Test)*[:\s-]*/i, '').trim();
        title = title.replace(/\s+(?:Fundamentals & Syntax Practical Suite|Core Operations & Logic Practical Suite|Practical Suite)$/i, '').trim();
        return title;
      }))].filter(t => t && t.length > 2 && !t.includes('of 2 --'));
      console.log(`   Distinct Topics extracted (${distinctTaskTitles.length}):`, distinctTaskTitles.slice(0, 5).join(' | '));
    }
  }
  process.exit(0);
}

listTopics().catch(console.error);
