const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const Course = require('../models/Course');
const Module = require('../models/Module');
const Batch = require('../models/Batch');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const users = await User.find({ role: 'student' }).lean();
  console.log('Students count:', users.length);
  for (const u of users) {
    const p = await StudentProfile.findOne({ userId: u._id })
      .populate('enrolledCourseId')
      .populate('batchId')
      .populate('assignedTutorId')
      .lean();
    if (p) {
      console.log('\n-----------------------------------------------');
      console.log('STUDENT:', u.name, '| Email:', u.email, '| StudentID:', p.studentId);
      console.log('  Profile.domain:', p.domain);
      console.log('  EnrolledCourseId:', p.enrolledCourseId ? { id: p.enrolledCourseId._id, title: p.enrolledCourseId.title, slug: p.enrolledCourseId.slug, domain: p.enrolledCourseId.domain } : null);
      console.log('  Batch:', p.batchId ? { id: p.batchId._id, name: p.batchId.name, courseId: p.batchId.courseId } : null);
      console.log('  Tutor:', p.assignedTutorId ? p.assignedTutorId.name : null);
      console.log('  PreviousCourses:', p.previousCourses);
    }
  }
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
