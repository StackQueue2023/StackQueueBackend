const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });

async function listCourses() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Course = require('../models/Course');
  const courses = await Course.find({}).lean();
  console.log('Courses count:', courses.length);
  for (const c of courses) {
    console.log({
      id: c._id,
      title: c.title,
      slug: c.slug,
      domain: c.domain,
      courseIdPrefix: c.courseIdPrefix,
      studentIdPrefix: c.studentIdPrefix,
      modulesCount: c.modules?.length
    });
  }
  await mongoose.disconnect();
}
listCourses();
