const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const Challenge = require('../models/Challenge');

async function inspectChallenges() {
  await mongoose.connect(process.env.MONGODB_URI);
  const total = await Challenge.countDocuments();
  console.log('Total Challenges in DB:', total);

  const byGameSlug = await Challenge.aggregate([
    { $group: { _id: '$gameSlug', count: { $sum: 1 }, types: { $addToSet: '$type' } } }
  ]);
  console.log('Challenges by gameSlug:', JSON.stringify(byGameSlug, null, 2));

  const byType = await Challenge.aggregate([
    { $group: { _id: '$type', count: { $sum: 1 } } }
  ]);
  console.log('Challenges by type:', JSON.stringify(byType, null, 2));

  await mongoose.disconnect();
}

inspectChallenges().catch(console.error);
