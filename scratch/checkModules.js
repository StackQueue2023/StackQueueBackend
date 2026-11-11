const mongoose = require('mongoose');
const Course = require('../models/Course');
const Module = require('../models/Module');
const StudentProfile = require('../models/StudentProfile');

async function checkJava() {
  await mongoose.connect('mongodb://127.0.0.1:27017/codequest_db');

  console.log('=== ALL COURSES ===');
  const courses = await Course.find({});
  console.log(courses);

  console.log('=== JAVA COURSES ===');
  const javaCourses = await Course.find({
    $or: [{ domain: /java/i }, { slug: /java/i }, { title: /java/i }]
  });
  console.log(javaCourses);

  console.log('=== MODULES FOR JAVA ===');
  const javaModules = await Module.find({
    $or: [
      { domain: /java/i },
      { courseId: { $in: javaCourses.map(c => c._id) } }
    ]
  });
  console.log('Java modules count:', javaModules.length);
  console.log(javaModules);

  console.log('=== STUDENT PROFILES ===');
  const profiles = await StudentProfile.find({}).populate('enrolledCourseId');
  console.log(profiles.map(p => ({
    studentId: p.studentId,
    domain: p.domain,
    enrolledCourseId: p.enrolledCourseId ? { id: p.enrolledCourseId._id, title: p.enrolledCourseId.title, slug: p.enrolledCourseId.slug, domain: p.enrolledCourseId.domain } : null
  })));

  process.exit();
}

checkJava();
