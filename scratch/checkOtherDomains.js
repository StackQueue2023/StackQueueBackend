const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/stackqueue';

mongoose.connect(MONGODB_URI).then(async () => {
  const InterviewQuestion = require('../models/InterviewQuestion');
  const sqlCount = await InterviewQuestion.countDocuments({
    $or: [
      { domain: /sql/i },
      { category: /sql/i },
      { title: /sql/i },
      { tags: /sql/i }
    ]
  });
  const cyberCount = await InterviewQuestion.countDocuments({
    $or: [
      { domain: /cyber|security/i },
      { category: /cyber|security/i },
      { title: /cyber|security/i },
      { tags: /cyber|security/i }
    ]
  });
  console.log('SQL questions in InterviewQuestion:', sqlCount);
  console.log('Cyber Security questions in InterviewQuestion:', cyberCount);

  // Check all collections for SQL or cyber security questions/challenges
  const challenges = mongoose.connection.db.collection('challenges');
  const sqlChallenges = await challenges.countDocuments({
    $or: [
      { gameId: /sql/i },
      { category: /sql/i },
      { title: /sql/i }
    ]
  });
  console.log('SQL challenges in challenges collection:', sqlChallenges);

  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
