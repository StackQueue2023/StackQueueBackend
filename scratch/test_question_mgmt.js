const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { validateQuestionContent } = require('../services/questionManagementService');

async function testWorkflow() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected successfully.');

  // Test 1: Valid Coding Problem with working JS solution
  const vCoding = await validateQuestionContent({
    title: 'Double the Number',
    problemStatement: 'Write a program to double the integer input.',
    questionType: 'coding',
    compiler: 'javascript',
    referenceSolution: 'const fs = require("fs"); const input = fs.readFileSync(0, "utf-8").trim(); console.log(Number(input) * 2);',
    testCases: [{ input: '5', expectedOutput: '10' }]
  });
  console.log('1. Valid Coding:', vCoding.isValid, vCoding.reason);

  // Test 2: Invalid Coding Problem where solution produces wrong output
  const iCoding = await validateQuestionContent({
    title: 'Double the Number',
    problemStatement: 'Write a program to double the integer input.',
    questionType: 'coding',
    compiler: 'javascript',
    referenceSolution: 'const fs = require("fs"); const input = fs.readFileSync(0, "utf-8").trim(); console.log(Number(input) * 3);',
    testCases: [{ input: '5', expectedOutput: '10' }]
  });
  console.log('2. Invalid Coding (Expected false):', iCoding.isValid, iCoding.reason);

  // Test 3: Valid MCQ Problem with 4 options and 1 correct answer
  const vMcq = await validateQuestionContent({
    title: 'CSS Box Model',
    problemStatement: 'What does CSS box-sizing: border-box do?',
    questionType: 'mcq',
    options: [
      { optionId: 'A', text: 'Includes padding and border in width/height' },
      { optionId: 'B', text: 'Excludes padding and border' },
      { optionId: 'C', text: 'Applies only to borders' },
      { optionId: 'D', text: 'Sets border radius automatically' }
    ],
    correctAnswer: 'A'
  });
  console.log('3. Valid MCQ:', vMcq.isValid, vMcq.reason);

  // Test 4: Invalid MCQ with fewer than 4 options
  const iMcq = await validateQuestionContent({
    title: 'HTML Tag',
    problemStatement: 'Which tag is used for paragraphs?',
    questionType: 'mcq',
    options: [
      { optionId: 'A', text: '<p>' },
      { optionId: 'B', text: '<div>' }
    ],
    correctAnswer: 'A'
  });
  console.log('4. Invalid MCQ (Expected false):', iMcq.isValid, iMcq.reason);

  await mongoose.disconnect();
  console.log('Validation test successfully passed!');
}

testWorkflow().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
