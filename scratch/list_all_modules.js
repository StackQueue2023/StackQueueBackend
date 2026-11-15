const path = require('path');
const fs = require('fs');
const envPath = fs.existsSync(path.join(__dirname, '../.env')) ? path.join(__dirname, '../.env') : path.join(__dirname, '../../.env');
require('dotenv').config({ path: envPath });
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const Course = require('../models/Course');
const Module = require('../models/Module');

async function main() {
  await connectDB();
  const courses = await Course.find({ isActive: true }).lean();
  for (const c of courses) {
    console.log(`\n=== COURSE: ${c.title} (${c.slug}) [${c._id}] ===`);
    const mods = await Module.find({ courseId: c._id, isPublished: { $ne: false } }).sort({ order: 1 }).lean();
    for (const m of mods) {
      console.log(`  [${m.order}] ${m.title} | desc: ${m.description} | topics: ${JSON.stringify(m.topics)}`);
    }
  }
  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
