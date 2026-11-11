const mongoose = require('mongoose');
require('dotenv').config();
const Course = require('../models/Course');
const Module = require('../models/Module');
const DomainTask = require('../models/DomainTask');
const StudentProfile = require('../models/StudentProfile');
const { getModulesWithTasks } = require('../controllers/adminSyllabusController');

async function testSync() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/game_project');

  console.log('=== ADMIN SIDE DATA ===');
  const adminCourse = await Course.findOne({
    $or: [{ slug: 'java-fullstack' }, { title: new RegExp('java fullstack', 'i') }]
  });

  console.log(`Admin Course: "${adminCourse.title}" (${adminCourse._id})`);
  const adminMods = await Module.find({
    $or: [{ courseId: adminCourse._id }, { domain: 'javafullstack' }, { domain: 'java-fullstack' }]
  }).sort({ order: 1 });

  console.log(`Admin Modules Count: ${adminMods.length}`);
  adminMods.forEach((m, i) => console.log(`   ${i + 1}. [Order ${m.order}] "${m.title}" (ID: ${m._id})`));

  console.log('\n=== STUDENT SIDE DATA FOR ALL JAVA STUDENTS ===');
  const studentProfiles = await StudentProfile.find({
    $or: [{ domain: 'java' }, { domain: 'java-fullstack' }]
  }).populate('enrolledCourseId');

  for (const p of studentProfiles) {
    const studentCourse = p.enrolledCourseId;
    const domainSlug = (studentCourse?.slug || studentCourse?.domain || studentCourse?.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const slugs = [studentCourse?.slug, studentCourse?.domain, domainSlug, p.domain].filter(Boolean);

    const studentMods = await Module.find({
      isPublished: { $ne: false },
      $or: [
        { courseId: studentCourse?._id },
        { domain: { $in: slugs } }
      ]
    }).sort({ order: 1 });

    console.log(`Student Profile [${p._id}] User [${p.userId}]`);
    console.log(`   Enrolled Course: "${studentCourse ? studentCourse.title : 'None'}" (${studentCourse ? studentCourse._id : 'N/A'})`);
    console.log(`   Student Modules Count: ${studentMods.length}`);
    studentMods.forEach((m, i) => console.log(`      ${i + 1}. [Order ${m.order}] "${m.title}"`));

    // Assert exact 1-to-1 match
    if (studentMods.length !== adminMods.length) {
      console.error(`❌ MISMATCH! Admin has ${adminMods.length} modules, Student has ${studentMods.length} modules.`);
    } else {
      let isIdentical = true;
      for (let k = 0; k < adminMods.length; k++) {
        if (adminMods[k].title !== studentMods[k].title) {
          isIdentical = false;
          break;
        }
      }
      if (isIdentical) {
        console.log(`   ✅ 100% IDENTICAL TO ADMIN SYLLABUS!`);
      } else {
        console.error(`❌ MODULE NAME MISMATCH!`);
      }
    }
  }

  await mongoose.disconnect();
}

testSync().catch(err => console.error(err));
