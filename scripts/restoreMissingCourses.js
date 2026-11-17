const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const Course = require('../models/Course');
const CourseEnvironmentConfig = require('../models/CourseEnvironmentConfig');

const pdfCourses = [
  'Artificial Intelligence',
  'Machine Learning(Python)',
  'Deep Learning',
  'Robotic Process Automation',
  'Data Science(Python)',
  'Data Analytics',
  'Business Analytics',
  'Big Data Engineering(Spark / Kafka)',
  'Full Stack Web Development',
  'MERN Stack Development',
  'MEAN Stack Development',
  'Java Full Stack Development',
  'Python Full Stack Development',
  'Frontend Development (React / Angular)',
  'Backend Development (Node.js / Spring Boot)',
  'Cloud Computing (AWS)',
  'Cloud Computing (Microsoft Azure)',
  'Cloud Computing (Google Cloud)',
  'DevOps Engineering',
  'Docker & Kubernetes',
  'Cybersecurity',
  'Ethical Hacking',
  'Network Security',
  'Penetration Testing',
  'Mobile App Development (Android)',
  'Cross-Platform App Development (Flutter / React Native)',
  'UI/UX Design',
  'Web Design (HTML, CSS, JS)',
  'Software Testing (Manual Testing)',
  'Software Testing (Automation Testing – Selenium)',
  'Blockchain Development',
  'Data Structures & Algorithms (DSA)',
  'API Development & Integration',
  'Microservices Architecture',
  'Database Management (SQL / NoSQL)',
  'C Language',
  'C++',
  'Java',
  'Python',
  'Catia',
  'SolidWorks',
  'Creo'
];

async function restore() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB.');

  const javaId = new mongoose.Types.ObjectId('6ae483e65e156d57676c8cde');
  const pythonId = new mongoose.Types.ObjectId('6aeb178ff65f7ac7b713389e');
  const progLangDomainId = new mongoose.Types.ObjectId('6aeaf89c1eedcdf24ae87f9e');

  // Check if Java exists
  let javaCourse = await Course.findById(javaId);
  if (!javaCourse) {
    javaCourse = await Course.create({
      _id: javaId,
      title: 'Java',
      slug: 'java-programming',
      description: 'Core Java, OOP principles, Collections Framework, Streams API, multi-threading, compiled with Java JDK 22.',
      category: 'Programming Languages',
      domain: 'Programming Language',
      domainId: progLangDomainId,
      hasCompiler: true,
      compilerLanguage: 'java',
      executionEnvironment: 'COMPILER',
      durationValue: 12,
      durationUnit: 'Weeks',
      durationWeeks: 12,
      durationMonths: 3,
      durationText: '12 Weeks',
      totalCourseFee: 24000,
      monthlyInstallment: 2000,
      totalHours: 120,
      coursePrefix: 'SQ-CRS',
      studentIdPrefix: 'SQ-STU',
      startingSequence: 1,
      currentSequence: 0,
      studentIdFormat: 'SQ-STU-0001',
      subjects: [],
      level: 'All Levels',
      isActive: true
    });
    console.log(`[RESTORED] Course Java: ${javaCourse._id}`);
  } else {
    javaCourse.isActive = true;
    await javaCourse.save();
    console.log(`[EXISTS] Course Java: ${javaCourse._id}`);
  }

  // Check if Python exists
  let pythonCourse = await Course.findById(pythonId);
  if (!pythonCourse) {
    pythonCourse = await Course.create({
      _id: pythonId,
      title: 'Python',
      slug: 'python-programming',
      description: 'Python 3.11 syntax, data structures (lists, dicts, sets, tuples), OOP, decorators, generators, and automated test cases.',
      category: 'Programming Languages',
      domain: 'Programming Language',
      domainId: progLangDomainId,
      hasCompiler: true,
      compilerLanguage: 'python',
      executionEnvironment: 'COMPILER',
      durationValue: 12,
      durationUnit: 'Weeks',
      durationWeeks: 12,
      durationMonths: 3,
      durationText: '12 Weeks',
      totalCourseFee: 24000,
      monthlyInstallment: 2000,
      totalHours: 120,
      coursePrefix: 'SQ-CRS',
      studentIdPrefix: 'SQ-STU',
      startingSequence: 1,
      currentSequence: 0,
      studentIdFormat: 'SQ-STU-0001',
      subjects: [],
      level: 'All Levels',
      isActive: true
    });
    console.log(`[RESTORED] Course Python: ${pythonCourse._id}`);
  } else {
    pythonCourse.isActive = true;
    await pythonCourse.save();
    console.log(`[EXISTS] Course Python: ${pythonCourse._id}`);
  }

  // Ensure CourseEnvironmentConfigs match
  await CourseEnvironmentConfig.findOneAndUpdate(
    { courseId: javaId },
    { $set: { isActive: true, courseTitle: 'Java', courseSlug: 'java-programming' } },
    { upsert: true }
  );
  await CourseEnvironmentConfig.findOneAndUpdate(
    { courseId: pythonId },
    { $set: { isActive: true, courseTitle: 'Python', courseSlug: 'python-programming' } },
    { upsert: true }
  );

  // Now audit all 42 courses
  const allCourses = await Course.find({}).sort({ title: 1 }).lean();
  console.log(`\n======================================================`);
  console.log(`TOTAL COURSES IN DATABASE: ${allCourses.length}`);
  console.log(`======================================================`);

  const norm = str => str.toLowerCase().replace(/[^a-z0-9]/g, '');
  let matched = 0;
  for (const pc of pdfCourses) {
    const found = allCourses.find(c => norm(c.title) === norm(pc));
    if (found) {
      matched++;
      console.log(`✓ [${matched}/42] ${pc} -> DB ID: ${found._id} | slug: ${found.slug} | isActive: ${found.isActive}`);
    } else {
      console.error(`✗ MISSING: ${pc}`);
    }
  }

  console.log(`\nMatched ${matched} / ${pdfCourses.length} courses.`);

  // Check for duplicates
  const titleCounts = {};
  allCourses.forEach(c => {
    const k = norm(c.title);
    titleCounts[k] = (titleCounts[k] || 0) + 1;
  });
  const dups = Object.entries(titleCounts).filter(([k, count]) => count > 1);
  if (dups.length === 0) {
    console.log('✓ ZERO DUPLICATES FOUND.');
  } else {
    console.error('✗ DUPLICATES FOUND:', dups);
  }

  process.exit(0);
}

restore().catch(err => {
  console.error(err);
  process.exit(1);
});
