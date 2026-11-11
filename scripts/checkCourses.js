require('dotenv').config();
const connectDB = require('../config/db');
const Course = require('../models/Course');

async function main() {
  await connectDB();
  const courses = await Course.find();
  console.log('COURSES_RESULT:', JSON.stringify(courses.map(c => ({ id: c._id, title: c.title, slug: c.slug }))));
  process.exit(0);
}
main();
