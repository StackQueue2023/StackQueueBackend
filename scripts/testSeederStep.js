const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });

const { buildJavaQuestions } = require('../data/questionBanks/javaArenaBuilder');

async function test() {
  const javaQs = buildJavaQuestions();
  console.log(`Generated ${javaQs.length} Java Easy questions.`);
  console.log('Sample question 1:', {
    title: javaQs[0].title,
    examples: javaQs[0].examples,
    testCases: javaQs[0].testCases
  });
}

test();
