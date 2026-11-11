const mongoose = require('mongoose');
const Module = require('../models/Module');
const Course = require('../models/Course');
const DomainTask = require('../models/DomainTask');

async function check() {
  await mongoose.connect('mongodb://127.0.0.1:27017/codequest_db');

  const javaCourses = await Course.find({
    $or: [
      { slug: 'java' },
      { slug: 'java-fullstack' },
      { domain: 'java' },
      { title: /java/i }
    ]
  });

  console.log('=== JAVA COURSES ===');
  console.log(javaCourses.map(c => ({ id: c._id, title: c.title, slug: c.slug })));

  const javaCourseIds = javaCourses.map(c => c._id);

  console.log('=== MODULES IN DB ===');
  const modules = await Module.find({
    $or: [
      { domain: 'java' },
      { domain: 'java-fullstack' },
      { courseId: { $in: javaCourseIds } }
    ]
  });

  console.log(`Found ${modules.length} Java modules:`);
  console.log(modules.map(m => ({ id: m._id, title: m.title, domain: m.domain, courseId: m.courseId })));

  // If Java course (JAVA - 6ab786c131c7dd8047174937) does not have modules linked, let's link or duplicate them for both JAVA and JAVA FULLSTACK
  for (const course of javaCourses) {
    for (let order = 1; order <= 8; order++) {
      let mod = await Module.findOne({ courseId: course._id, order });
      if (!mod) {
        const sourceMod = modules.find(m => m.order === order);
        const title = sourceMod ? sourceMod.title : `Java Module ${order}`;
        const description = sourceMod ? sourceMod.description : `Comprehensive Java module covering Module ${order}`;

        mod = await Module.create({
          courseId: course._id,
          domain: 'java',
          title,
          description,
          order,
          isPublished: true
        });
        console.log(`Created missing Module ${order} "${title}" for course ${course.title} (${course._id})`);
      }

      // Ensure tasks exist for this module
      const taskCount = await DomainTask.countDocuments({ moduleId: mod._id });
      if (taskCount === 0) {
        console.log(`Seeding tasks for module ${mod.title} (${mod._id})...`);
        for (let tOrder = 1; tOrder <= 10; tOrder++) {
          await DomainTask.create({
            moduleId: mod._id,
            courseId: course._id,
            domain: 'java',
            title: `${mod.title} - Task 0${tOrder}`,
            description: `Hands-on practical exercise for ${mod.title} (Task 0${tOrder}).`,
            instructions: `1. Read topic guidelines.\n2. Write clean Java code and verify output.`,
            expectedOutput: `Success output for Task 0${tOrder}`,
            taskType: tOrder === 1 ? 'reading' : tOrder === 10 ? 'challenge' : 'coding',
            difficulty: tOrder <= 3 ? 'Easy' : tOrder <= 7 ? 'Medium' : 'Hard',
            points: tOrder <= 3 ? 10 : tOrder <= 7 ? 15 : 25,
            estimatedTime: '20 mins',
            order: tOrder,
            isActive: true,
            isEnabled: true
          });
        }
      }
    }
  }

  console.log('\n=== VERIFICATION FOR ALL JAVA COURSES ===');
  for (const course of javaCourses) {
    const cMods = await Module.find({ courseId: course._id }).sort({ order: 1 });
    console.log(`Course "${course.title}" (${course._id}) has ${cMods.length} modules.`);
  }

  process.exit();
}

check();
