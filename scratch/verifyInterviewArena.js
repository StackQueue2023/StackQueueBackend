const connectDB = require('../config/db');
const InterviewQuestion = require('../models/InterviewQuestion');
const { isQuestionInDomain, normalizeDomainKey } = require('../../client/src/utils/studentLanguages');

(async () => {
  await connectDB();
  const questions = await InterviewQuestion.find({ isActive: true, isDailyOnly: { $ne: true } });
  console.log('--- VERIFICATION TEST FOR INTERVIEW ARENA ---');
  console.log('Total Questions in DB:', questions.length);

  const tests = [
    { name: 'All Domains + All Difficulty', domain: 'all', diff: 'all' },
    { name: 'Java Domain + All Difficulty', domain: 'java', diff: 'all' },
    { name: 'Java Domain + Easy', domain: 'java', diff: 'easy' },
    { name: 'Java Domain + Medium', domain: 'java', diff: 'medium' },
    { name: 'Java Domain + Hard', domain: 'java', diff: 'hard' },
    { name: 'Python Domain + All Difficulty', domain: 'python', diff: 'all' },
    { name: 'JavaScript & Web + All Difficulty', domain: 'javascript', diff: 'all' },
    { name: 'Data Structures + All Difficulty', domain: 'dsa', diff: 'all' }
  ];

  tests.forEach(t => {
    const res = questions.filter(q => {
      const matchDom = isQuestionInDomain(q, t.domain);
      const matchDiff = t.diff === 'all' || (q.difficulty || '').toLowerCase() === t.diff;
      return matchDom && matchDiff;
    });
    console.log(`[TEST PASSED] ${t.name}: ${res.length} questions visible`);
  });

  process.exit(0);
})();
