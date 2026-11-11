const path = require('path');
const { seedAll100QuestionsPerDomain } = require('./questionBankSeeder');

async function seedInterviewQuestions() {
  console.log('[SeedInterview] Delegating to QuestionBankSeeder for 100 questions per active domain...');
  const res = await seedAll100QuestionsPerDomain();
  return {
    questionsCount: res.seededQuestionsCount,
    testCasesCount: res.seededTestCasesCount,
    validation: res.validation
  };
}

module.exports = { seedInterviewQuestions };

// Allow standalone execution
if (require.main === module) {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
  const connectDB = require('../config/db');
  connectDB().then(async () => {
    await seedInterviewQuestions();
    process.exit(0);
  }).catch(err => {
    console.error(err);
    process.exit(1);
  });
}
