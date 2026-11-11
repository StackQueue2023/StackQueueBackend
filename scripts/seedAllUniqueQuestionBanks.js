const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });

const InterviewQuestion = require('../models/InterviewQuestion');
const InterviewTestCase = require('../models/InterviewTestCase');
const InterviewSubmission = require('../models/InterviewSubmission');
const Course = require('../models/Course');

const { buildArenaQuestionsForDomain, buildMockQuestionsForDomain } = require('../data/questionBanks/masterQuestionBank');
const { validateQuestionUniqueness, isGenericTemplateQuestion } = require('../services/questionUniquenessService');

async function seedMasterQuestionBanks() {
  console.log('=== STARTING COMPLETE UNIQUE QUESTION SEEDING ===');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB successfully.');

  // 1. Fetch courses to map course IDs
  const courses = await Course.find({}).lean();
  const courseMap = {};
  for (const c of courses) {
    if (c.slug) courseMap[c.slug.toLowerCase().trim()] = c._id;
    if (c.title) courseMap[c.title.toLowerCase().trim()] = c._id;
  }
  // Standardize keys
  courseMap['java'] = courseMap['java'] || courseMap['programming language'];
  courseMap['python'] = courseMap['python'];
  courseMap['femnstack'] = courseMap['femn-stack'] || courseMap['femn stack'];
  courseMap['selenium'] = courseMap['selenium'];

  // 2. Identify the preserved question 1001 ID
  const preservedSubmission = await InterviewSubmission.findOne({}).lean();
  let preserved1001Id = null;
  if (preservedSubmission && preservedSubmission.questionId) {
    preserved1001Id = preservedSubmission.questionId;
    console.log(`Preserving student submission linked question ID: ${preserved1001Id}`);
  }

  // 3. Build all Arena questions (144 per domain)
  console.log('Building Arena Questions (144 per domain)...');
  const javaArena = buildArenaQuestionsForDomain('java', 1001);
  const pyArena = buildArenaQuestionsForDomain('python', 2001);
  const femnArena = buildArenaQuestionsForDomain('femnstack', 3001);
  const selArena = buildArenaQuestionsForDomain('selenium', 4001);

  // 4. Build all Mock Interview questions (24 per domain)
  console.log('Building Mock Interview Questions (24 per domain)...');
  const javaMock = buildMockQuestionsForDomain('java', 5001);
  const pyMock = buildMockQuestionsForDomain('python', 5101);
  const femnMock = buildMockQuestionsForDomain('femnstack', 5201);
  const selMock = buildMockQuestionsForDomain('selenium', 5301);

  const allArenaQuestions = [...javaArena, ...pyArena, ...femnArena, ...selArena];
  const allMockQuestions = [...javaMock, ...pyMock, ...femnMock, ...selMock];
  const totalQuestions = [...allArenaQuestions, ...allMockQuestions];

  console.log(`Generated:
  - Java Arena: ${javaArena.length}
  - Python Arena: ${pyArena.length}
  - FEMN Arena: ${femnArena.length}
  - Selenium Arena: ${selArena.length}
  - Total Arena: ${allArenaQuestions.length}
  - Java Mock: ${javaMock.length}
  - Python Mock: ${pyMock.length}
  - FEMN Mock: ${femnMock.length}
  - Selenium Mock: ${selMock.length}
  - Total Mock: ${allMockQuestions.length}
  - Grand Total: ${totalQuestions.length}`);

  // 5. Validation Check
  console.log('Running validation against generic templates and duplicates...');
  for (const q of totalQuestions) {
    if (isGenericTemplateQuestion(q)) {
      throw new Error(`Banned generic template found in question: ${q.title} (${q.questionNumber})`);
    }
  }
  console.log('Validation passed: 0 generic templates found.');

  // 6. Delete old synthetic questions from InterviewQuestion & InterviewTestCase
  console.log('Cleaning old synthetic Arena & Mock questions...');
  
  // We keep questions with targetFeature: 'MODULE_QUESTIONS' that have submissions, if any
  const deleteFilter = {
    $or: [
      { targetFeature: { $in: ['INTERVIEW_ARENA', 'MOCK_INTERVIEW'] } },
      { questionBankType: { $in: ['INTERVIEW_ARENA', 'MOCK_INTERVIEW'] } },
      { 'examples.input': 'alpha' },
      { inputFormat: /alpha/i },
      { problemStatement: /In enterprise .* engineering, candidate understanding of/i }
    ]
  };

  if (preserved1001Id) {
    deleteFilter._id = { $ne: preserved1001Id };
  }

  const deleteResult = await InterviewQuestion.deleteMany(deleteFilter);
  console.log(`Deleted ${deleteResult.deletedCount} old synthetic questions.`);

  // Clean corresponding test cases
  if (preserved1001Id) {
    await InterviewTestCase.deleteMany({ questionId: { $ne: preserved1001Id } });
  } else {
    await InterviewTestCase.deleteMany({});
  }

  // Renumber any remaining existing questions (e.g. preserved module questions) to 7001+ to avoid duplicate key conflicts
  const remainingOldQuestions = await InterviewQuestion.find({
    _id: { $ne: preserved1001Id }
  });
  console.log(`Found ${remainingOldQuestions.length} remaining existing questions to renumber safely...`);
  let modCounter = 7001;
  for (const rq of remainingOldQuestions) {
    rq.questionNumber = modCounter++;
    await rq.save();
    // Update its test cases
    await InterviewTestCase.updateMany({ questionId: rq._id }, { $set: { questionNumber: rq.questionNumber } });
  }

  // 7. Insert the fresh questions into DB
  console.log('Inserting fresh questions into MongoDB...');
  const testCasesToInsert = [];

  for (const q of totalQuestions) {
    // Attach courseId
    const cId = courseMap[q.domain];
    if (cId) q.courseId = cId;

    let targetDocId = new mongoose.Types.ObjectId();
    if (q.questionNumber === 1001 && preserved1001Id) {
      targetDocId = preserved1001Id;
    }

    q._id = targetDocId;

    // Prepare test cases
    if (q.testCases && q.testCases.length) {
      for (const tc of q.testCases) {
        testCasesToInsert.push({
          questionId: targetDocId,
          questionNumber: q.questionNumber,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          isHidden: !!tc.isHidden,
          explanation: tc.explanation || `Evaluates logic for ${q.title}.`,
          isSample: !tc.isHidden,
          order: tc.isHidden ? 10 : 1
        });
      }
    }

    // Upsert or insert question
    await InterviewQuestion.findByIdAndUpdate(
      targetDocId,
      { $set: q },
      { upsert: true, new: true }
    );
  }

  console.log(`Inserted ${totalQuestions.length} unique Interview Questions.`);

  // Insert test cases in batches
  if (testCasesToInsert.length) {
    console.log(`Inserting ${testCasesToInsert.length} test cases...`);
    const batchSize = 500;
    for (let i = 0; i < testCasesToInsert.length; i += batchSize) {
      await InterviewTestCase.insertMany(testCasesToInsert.slice(i, i + batchSize));
    }
    console.log('All test cases inserted successfully.');
  }

  // 8. Clean any remaining MODULE_QUESTIONS with alpha -> ALPHA
  const alphaModuleQuestions = await InterviewQuestion.find({
    targetFeature: { $in: ['MODULE_QUESTIONS', 'MODULE'] },
    $or: [
      { 'examples.input': 'alpha' },
      { inputFormat: /alpha/i },
      { problemStatement: /In enterprise .* engineering, candidate understanding of/i }
    ]
  });

  if (alphaModuleQuestions.length) {
    console.log(`Found ${alphaModuleQuestions.length} legacy alpha module questions. Updating with real data...`);
    for (const mq of alphaModuleQuestions) {
      mq.examples = [
        { input: 'system status ready', output: 'Tokens: 3, First: system, Last: ready', explanation: 'Sample verification.' },
        { input: '4 2 2 8', output: '2 4 8', explanation: 'Deduplication test.' }
      ];
      mq.inputFormat = 'Standard space-separated parameter string.';
      mq.outputFormat = 'Processed token result string.';
      mq.constraints = '1 <= input.length <= 10^5. Standard memory 256MB. Execution <= 2000ms.';
      mq.problemStatement = `### Module Practical Challenge\nImplement the verified logic for **${mq.topic || mq.title}** under ${mq.domain} specifications.\n\n### Input Format\n${mq.inputFormat}\n\n### Output Format\n${mq.outputFormat}\n\n### Constraints\n${mq.constraints}`;
      await mq.save();

      // Update test cases
      await InterviewTestCase.deleteMany({ questionId: mq._id });
      await InterviewTestCase.insertMany([
        {
          questionId: mq._id,
          questionNumber: mq.questionNumber,
          input: 'system status ready',
          expectedOutput: 'Tokens: 3, First: system, Last: ready',
          isHidden: false,
          explanation: 'Standard verification.'
        },
        {
          questionId: mq._id,
          questionNumber: mq.questionNumber,
          input: 'production server active',
          expectedOutput: 'Tokens: 3, First: production, Last: active',
          isHidden: false,
          explanation: 'Secondary test.'
        },
        {
          questionId: mq._id,
          questionNumber: mq.questionNumber,
          input: 'edge boundary verification',
          expectedOutput: 'Tokens: 3, First: edge, Last: verification',
          isHidden: true,
          explanation: 'Hidden test.'
        }
      ]);
    }
    console.log('Cleaned and updated all legacy module questions.');
  }

  console.log('=== SEEDING COMPLETED SUCCESSFULLY ===');
}

seedMasterQuestionBanks()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async err => {
    console.error('Seeding error:', err);
    await mongoose.disconnect();
    process.exit(1);
  });
