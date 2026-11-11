const mongoose = require('mongoose');
require('dotenv').config();

const { syncAllQuestionsRegistry } = require('../services/questionRegistryService');

async function main() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/game_project';
    console.log('Connecting to MongoDB at:', mongoUri);
    await mongoose.connect(mongoUri);

    console.log('--- SYNCING GLOBAL QUESTION REGISTRY & FINGERPRINTS ---');
    await syncAllQuestionsRegistry();
    console.log('✓ Question Registry sync completed successfully!');

    process.exit(0);
  } catch (err) {
    console.error('Error in syncQuestionDatabase:', err);
    process.exit(1);
  }
}

main();
