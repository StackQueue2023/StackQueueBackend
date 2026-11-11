const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const Course = require('../models/Course');
const Module = require('../models/Module');
const InterviewQuestion = require('../models/InterviewQuestion');

async function checkDomains() {
  await mongoose.connect(process.env.MONGODB_URI);
  const courses = await Course.find().select('title slug category domain');
  console.log('Courses count:', courses.length);
  console.log('Courses sample:', courses.slice(0, 10).map(c => ({ title: c.title, slug: c.slug, domain: c.domain })));
  const qDomains = await InterviewQuestion.distinct('domain');
  console.log('InterviewQuestion domains in DB:', qDomains);
  const mDomains = await Module.distinct('domain');
  console.log('Module domains in DB:', mDomains);
  process.exit(0);
}
checkDomains().catch(err => { console.error(err); process.exit(1); });
