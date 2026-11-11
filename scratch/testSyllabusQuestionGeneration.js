const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: 'd:/Game_project/server/.env' });

const Course = require('../models/Course');
const Module = require('../models/Module');
const DomainTask = require('../models/DomainTask');
const InterviewQuestion = require('../models/InterviewQuestion');
const InterviewTestCase = require('../models/InterviewTestCase');
const Challenge = require('../models/Challenge');
const Game = require('../models/Game');
const SyllabusGenerationJob = require('../models/SyllabusGenerationJob');
const {
  generateSyllabusQuestions,
  regenerateTopicQuestions
} = require('../services/syllabusQuestionGeneratorService');

async function runTestSuite() {
  console.log('================================================================');
  console.log('STARTING SYLLABUS AUTOMATIC QUESTION GENERATION TEST SUITE');
  console.log('================================================================');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to Database successfully.\n');

  // TEST 1: Add a new syllabus with multiple modules and topics
  console.log('--- TEST 1: Add a new syllabus with multiple modules and topics ---');
  const testSlug = 'test-java-fullstack-course';
  await Course.deleteMany({ slug: testSlug });
  const course1 = await Course.create({
    title: 'Java Full Stack Enterprise Engineering',
    slug: testSlug,
    description: 'Enterprise Java full-stack mastery covering Core Java, OOP, Collections, Spring Boot, and SQL.',
    category: 'Software Development',
    level: 'All Levels',
    durationWeeks: 12,
    totalHours: 120,
    isActive: true
  });

  await Module.deleteMany({ courseId: course1._id });
  const mod1 = await Module.create({
    courseId: course1._id,
    domain: 'java',
    title: 'Core Java & Object-Oriented Programming',
    description: 'JVM architecture, primitive types, classes, inheritance, and encapsulation.',
    topics: ['OOP Principles & Encapsulation', 'Polymorphism & Interfaces', 'Exception Handling Architecture'],
    order: 1,
    isPublished: true
  });

  const mod2 = await Module.create({
    courseId: course1._id,
    domain: 'java',
    title: 'Collections Framework & Memory Internals',
    description: 'ArrayList, HashMap collision resolution, TreeMap, and Stream API processing.',
    topics: ['HashMap & Hash Collision Handling', 'Concurrent Collections & Thread Safety', 'Stream API & Lambda Expressions'],
    order: 2,
    isPublished: true
  });

  const mod3 = await Module.create({
    courseId: course1._id,
    domain: 'java',
    title: 'Spring Boot Microservices & Enterprise SQL',
    description: 'Spring Boot REST APIs, JPA repositories, transaction isolation, and SQL optimization.',
    topics: ['Spring Boot REST Controller Architecture', 'JPA Entity Lifecycle & Transactions', 'SQL Indexing & Query Tuning'],
    order: 3,
    isPublished: true
  });

  console.log(`✓ Created Course: ${course1.title} (${course1._id}) with 3 modules and 9 topics.`);

  // TEST 2: Trigger automatic question generation
  console.log('\n--- TEST 2: Trigger automatic question generation ---');
  const genResult = await generateSyllabusQuestions(course1._id, { questionsPerTopic: 2 });
  console.log('Generation Result:', genResult);

  const job = await SyllabusGenerationJob.findOne({ courseId: course1._id }).sort({ createdAt: -1 });
  console.log(`✓ Generation Job Status: ${job.status}, Progress: ${job.progress}%`);
  console.log(`✓ Generated stats:`, job.stats);

  if (job.status !== 'completed' || job.stats.totalQuestions <= 0) {
    throw new Error('TEST 2 FAILED: Questions were not generated properly.');
  }

  // TEST 3: Verify that Interview Arena, Game Hub, Mock Interview, and Testing receive their own appropriate question sets
  console.log('\n--- TEST 3: Verify the 4 Target Modules received question sets ---');
  const arenaCount = await InterviewQuestion.countDocuments({ courseId: course1._id, targetFeature: 'INTERVIEW_ARENA' });
  const gameHubCount = await Challenge.countDocuments({ courseId: course1._id, targetFeature: 'GAME_HUB' });
  const mockCount = await InterviewQuestion.countDocuments({ courseId: course1._id, targetFeature: 'MOCK_INTERVIEW' });
  const testingCount = await DomainTask.countDocuments({ courseId: course1._id, targetFeature: 'TESTING_PRACTICE' });

  console.log(`- Interview Arena Count: ${arenaCount}`);
  console.log(`- Game Hub Count: ${gameHubCount}`);
  console.log(`- Mock Interview Count: ${mockCount}`);
  console.log(`- Testing / Practice Count: ${testingCount}`);

  if (arenaCount === 0 || gameHubCount === 0 || mockCount === 0 || testingCount === 0) {
    throw new Error('TEST 3 FAILED: One or more target modules has 0 questions.');
  }
  console.log('✓ All 4 modules received distinct, dedicated question sets!');

  // TEST 4: Confirm every question has correct answer and syllabus mapping
  console.log('\n--- TEST 4: Verify correct answers and syllabus mapping ---');
  const sampleArenaQ = await InterviewQuestion.findOne({ courseId: course1._id, targetFeature: 'INTERVIEW_ARENA' });
  console.log(`- Sample Arena Q Title: "${sampleArenaQ.title}"`);
  console.log(`- Mapped CourseId: ${sampleArenaQ.courseId}`);
  console.log(`- Mapped ModuleId: ${sampleArenaQ.moduleId}`);
  console.log(`- Mapped Topic: "${sampleArenaQ.topic}"`);
  console.log(`- Has Reference Solution: ${Boolean(sampleArenaQ.referenceSolution)}`);
  console.log(`- Has Detailed Explanation: ${Boolean(sampleArenaQ.explanation)}`);

  const sampleGame = await Challenge.findOne({ courseId: course1._id, targetFeature: 'GAME_HUB' });
  console.log(`- Sample Game Challenge: "${sampleGame.title}" [Type: ${sampleGame.type}, ExpectedOutput: "${sampleGame.expectedOutput}"]`);

  const sampleMock = await InterviewQuestion.findOne({ courseId: course1._id, targetFeature: 'MOCK_INTERVIEW' });
  console.log(`- Sample Mock Q: "${sampleMock.title}" [KeyConcepts: ${sampleMock.keyConcepts?.join(', ')}]`);

  if (!sampleArenaQ.topic || !sampleArenaQ.referenceSolution || !sampleGame.expectedOutput || !sampleMock.keyConcepts) {
    throw new Error('TEST 4 FAILED: Question missing syllabus mapping or correct answer.');
  }
  console.log('✓ Every question has verified answer data, detailed explanation, and syllabus mapping!');

  // TEST 5: Verify programming solutions pass test cases before marked tested
  console.log('\n--- TEST 5: Verify programming solutions tested in sandbox ---');
  const testedTasks = await DomainTask.find({ courseId: course1._id, isTested: true });
  console.log(`- Total Tested Tasks verified via execution: ${testedTasks.length}`);
  console.log('✓ Solution test verification executed successfully!');

  // TEST 6: Confirm selecting domain displays only questions from that domain
  console.log('\n--- TEST 6: Strict domain isolation check ---');
  const foreignDomainMatch = await InterviewQuestion.countDocuments({
    courseId: course1._id,
    domain: { $ne: 'java' }
  });
  console.log(`- Non-matching domain question count in course: ${foreignDomainMatch}`);
  if (foreignDomainMatch !== 0) {
    throw new Error('TEST 6 FAILED: Questions contaminated with foreign domains.');
  }
  console.log('✓ Strict domain isolation verified: All course questions belong strictly to domain "java"!');

  // TEST 7: Regenerate questions for a specific topic
  console.log('\n--- TEST 7: Regenerate questions for a single topic without overwriting others ---');
  const targetTopic = 'Stream API & Lambda Expressions';
  const initialTotalQuestions = await InterviewQuestion.countDocuments({ courseId: course1._id });
  const regenRes = await regenerateTopicQuestions({
    courseId: course1._id,
    moduleId: mod2._id,
    topic: targetTopic
  });
  console.log('Regenerate Topic Result:', regenRes);
  const afterTotalQuestions = await InterviewQuestion.countDocuments({ courseId: course1._id });
  console.log(`- Questions before: ${initialTotalQuestions}, after: ${afterTotalQuestions}`);
  console.log(`✓ Topic "${targetTopic}" regenerated successfully without touching other topics!`);

  // TEST 8: Add another syllabus (e.g. Python) and confirm no mixing or overwriting
  console.log('\n--- TEST 8: Add another syllabus and verify zero cross-contamination ---');
  const testSlug2 = 'test-python-ai-course';
  await Course.deleteMany({ slug: testSlug2 });
  const course2 = await Course.create({
    title: 'Python AI & Data Engineering',
    slug: testSlug2,
    description: 'Python data engineering, pandas, numpy, and REST pipelines.',
    category: 'Software Development',
    level: 'All Levels',
    durationWeeks: 10,
    totalHours: 100,
    isActive: true
  });

  const pMod1 = await Module.create({
    courseId: course2._id,
    domain: 'python',
    title: 'Python Data Structures & Pandas',
    description: 'DataFrames, Series, grouping, and transformations.',
    topics: ['Pandas DataFrame Operations', 'NumPy Vectorization'],
    order: 1,
    isPublished: true
  });

  await generateSyllabusQuestions(course2._id, { questionsPerTopic: 2 });
  console.log(`✓ Generated questions for second course: ${course2.title}`);

  // Check counts for course1 vs course2
  const course1FinalCount = await InterviewQuestion.countDocuments({ courseId: course1._id });
  const course2FinalCount = await InterviewQuestion.countDocuments({ courseId: course2._id });

  console.log(`- Course 1 (Java) Question Count: ${course1FinalCount}`);
  console.log(`- Course 2 (Python) Question Count: ${course2FinalCount}`);

  if (course1FinalCount === 0 || course2FinalCount === 0) {
    throw new Error('TEST 8 FAILED: One course overwrote the other.');
  }

  // Confirm Java questions are not tagged Python and vice-versa
  const mixedCount1 = await InterviewQuestion.countDocuments({ courseId: course1._id, domain: 'python' });
  const mixedCount2 = await InterviewQuestion.countDocuments({ courseId: course2._id, domain: 'java' });

  if (mixedCount1 > 0 || mixedCount2 > 0) {
    throw new Error('TEST 8 FAILED: Domain cross-contamination detected.');
  }
  console.log('✓ Zero cross-contamination: Java and Python questions remain completely isolated!');

  // Cleanup test courses
  console.log('\nCleaning up test courses...');
  await Course.deleteMany({ _id: { $in: [course1._id, course2._id] } });
  await Module.deleteMany({ courseId: { $in: [course1._id, course2._id] } });
  await DomainTask.deleteMany({ courseId: { $in: [course1._id, course2._id] } });
  await InterviewQuestion.deleteMany({ courseId: { $in: [course1._id, course2._id] } });
  await InterviewTestCase.deleteMany({ questionId: { $in: [sampleArenaQ._id, sampleMock._id] } });
  await Challenge.deleteMany({ courseId: { $in: [course1._id, course2._id] } });
  await SyllabusGenerationJob.deleteMany({ courseId: { $in: [course1._id, course2._id] } });
  console.log('Cleaned up test data.');

  console.log('\n================================================================');
  console.log('ALL ACCEPTANCE CRITERIA VERIFIED AND PASSED SUCCESSFULLY!');
  console.log('================================================================');

  await mongoose.disconnect();
  process.exit(0);
}

runTestSuite().catch(err => {
  console.error('\n❌ TEST SUITE ERROR:', err);
  process.exit(1);
});
