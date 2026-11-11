const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const questionsDataPath = path.join(__dirname, '..', 'data', 'interview100Questions.js');
const InterviewQuestion = require('../models/InterviewQuestion');

// Pattern for 10 questions in a level: 4 Easy, 4 Medium, 2 Hard
const LEVEL_PATTERN = [
  { difficulty: 'Easy', xp: 10 },
  { difficulty: 'Easy', xp: 10 },
  { difficulty: 'Medium', xp: 20 },
  { difficulty: 'Easy', xp: 10 },
  { difficulty: 'Medium', xp: 20 },
  { difficulty: 'Easy', xp: 10 },
  { difficulty: 'Medium', xp: 20 },
  { difficulty: 'Medium', xp: 20 },
  { difficulty: 'Hard', xp: 30 },
  { difficulty: 'Hard', xp: 30 }
];

async function updateDifficulties() {
  console.log('Reading interview100Questions.js...');
  const rawData = require('../data/interview100Questions');

  const updatedData = rawData.map(q => {
    const idxInLevel = (q.questionNumber - 1) % 10;
    const { difficulty, xp } = LEVEL_PATTERN[idxInLevel];

    // Filter out old difficulty tags and insert new difficulty tag
    const filteredTags = (q.tags || []).filter(t => !['Easy', 'Medium', 'Hard'].includes(t));
    filteredTags.push(difficulty);

    return {
      ...q,
      difficulty,
      xp,
      tags: filteredTags
    };
  });

  // Write back to interview100Questions.js file
  const fileContent = `/**\n * Complete 100 Programming Interview Game Questions Dataset\n * Levels 1 to 10 (Q1 to Q100)\n * Mixed Easy/Medium/Hard per level\n */\n\nmodule.exports = ${JSON.stringify(updatedData, null, 2)};\n`;
  fs.writeFileSync(questionsDataPath, fileContent, 'utf8');
  console.log('Updated interview100Questions.js dataset with mixed difficulties!');

  // Update MongoDB documents
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/codequest_db';
  console.log(`Connecting to MongoDB at ${MONGO_URI}...`);
  await mongoose.connect(MONGO_URI);

  let updatedCount = 0;
  for (const q of updatedData) {
    const res = await InterviewQuestion.updateOne(
      { questionNumber: q.questionNumber },
      {
        $set: {
          difficulty: q.difficulty,
          xp: q.xp,
          tags: q.tags
        }
      }
    );
    if (res.modifiedCount > 0 || res.matchedCount > 0) {
      updatedCount++;
    }
  }

  console.log(`Successfully updated ${updatedCount} InterviewQuestion documents in MongoDB!`);
  await mongoose.disconnect();
  console.log('Done!');
}

updateDifficulties().catch(err => {
  console.error('Error updating difficulties:', err);
  process.exit(1);
});
