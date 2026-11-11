const mongoose = require('mongoose');
require('dotenv').config();
const Course = require('../models/Course');
const Module = require('../models/Module');
const DomainTask = require('../models/DomainTask');
const StudentProfile = require('../models/StudentProfile');

async function fixSync() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/game_project');

  console.log('=== STEP 1: CLEANUP HARDCODED FAKE FALLBACK MODULES ===');
  const fakeModTitles = [
    /Fundamentals & Core Syntax/i,
    /Control Structures & Logic Building/i,
    /Functions & Modular Code Design/i,
    /Advanced Concepts & Mini Capstone/i
  ];

  const fakeMods = await Module.find({
    $or: fakeModTitles.map(titleRegex => ({ title: titleRegex }))
  });

  console.log(`Found ${fakeMods.length} fake auto-generated modules to clean up:`);
  for (const fm of fakeMods) {
    console.log(`   - Deleting fake module: "${fm.title}" (${fm._id})`);
    await DomainTask.deleteMany({ moduleId: fm._id });
    await Module.findByIdAndDelete(fm._id);
  }

  console.log('\n=== STEP 2: LINK ADMIN MODULES TO THEIR EXACT COURSE IDs ===');
  const courses = await Course.find();
  for (const c of courses) {
    const domainSlug = (c.slug || c.domain || c.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const matchingMods = await Module.find({
      $or: [
        { courseId: c._id },
        { domain: c.slug },
        { domain: c.domain },
        { domain: domainSlug }
      ]
    });

    console.log(`Course "${c.title}" (${c._id}) [slug: "${c.slug}"]: found ${matchingMods.length} modules`);
    for (const m of matchingMods) {
      if (!m.courseId || m.courseId.toString() !== c._id.toString()) {
        m.courseId = c._id;
        await m.save();
        console.log(`   -> Linked Module "${m.title}" (${m._id}) to Course "${c.title}" (${c._id})`);
      } else {
        console.log(`   -> Verified Module "${m.title}" (${m._id}) order=${m.order}`);
      }
    }
  }

  console.log('\n=== STEP 3: MAP JAVA STUDENT PROFILES TO ACTIVE ADMIN COURSE ===');
  // Find primary active Java course managed by Admin (e.g. JAVA FULLSTACK or JAVA)
  let javaCourse = await Course.findOne({
    $or: [
      { slug: 'java-fullstack' },
      { title: new RegExp('java fullstack', 'i') },
      { slug: 'java' }
    ]
  }).sort({ createdAt: -1 });

  if (!javaCourse) {
    javaCourse = await Course.findOne().sort({ createdAt: -1 });
  }

  console.log(`Target Java Course for Students: "${javaCourse.title}" (${javaCourse._id})`);

  const studentProfiles = await StudentProfile.find();
  for (const p of studentProfiles) {
    const pCourse = p.enrolledCourseId ? await Course.findById(p.enrolledCourseId) : null;
    // If student profile points to an old deleted course or generic java course without 5 modules, link to javaCourse
    if (p.domain === 'java' || (pCourse && pCourse.title.toLowerCase().includes('java'))) {
      if (!p.enrolledCourseId || p.enrolledCourseId.toString() !== javaCourse._id.toString()) {
        p.enrolledCourseId = javaCourse._id;
        p.domain = javaCourse.slug || 'java-fullstack';
        await p.save();
        console.log(`   -> Updated StudentProfile (${p._id}) to Course "${javaCourse.title}" (${javaCourse._id})`);
      }
    }
  }

  console.log('\n=== VERIFICATION SUMMARY ===');
  const finalMods = await Module.find({ courseId: javaCourse._id }).sort({ order: 1 });
  console.log(`Course "${javaCourse.title}" (${javaCourse._id}) now has ${finalMods.length} modules on Admin and Student side:`);
  finalMods.forEach((m, idx) => console.log(`   ${idx + 1}. [Order ${m.order}] "${m.title}" (ID: ${m._id})`));

  await mongoose.disconnect();
}

fixSync().catch(err => console.error(err));
