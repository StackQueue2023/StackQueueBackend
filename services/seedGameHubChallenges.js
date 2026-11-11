const mongoose = require('mongoose');
const Challenge = require('../models/Challenge');
const Game = require('../models/Game');
const { generateAllGameHubChallenges, GAME_TRACKS } = require('../data/generators/generateGameHubChallenges');

async function seedGameHubChallenges() {
  console.log('[GameHubSeeder] Generating 100 challenges for each of the 11 topics...');
  const allChallenges = generateAllGameHubChallenges();
  console.log(`[GameHubSeeder] Generated ${allChallenges.length} total challenges.`);

  // Clean existing challenges for these 11 games
  const slugs = GAME_TRACKS.map(t => t.slug);
  await Challenge.deleteMany({ gameSlug: { $in: slugs } });
  console.log(`[GameHubSeeder] Cleared previous challenges for ${slugs.length} games.`);

  // Insert in batches
  const BATCH_SIZE = 200;
  for (let i = 0; i < allChallenges.length; i += BATCH_SIZE) {
    const batch = allChallenges.slice(i, i + BATCH_SIZE);
    await Challenge.insertMany(batch);
    console.log(`[GameHubSeeder] Inserted challenges ${i + 1} to ${Math.min(i + BATCH_SIZE, allChallenges.length)}`);
  }

  // Update Game documents with totalLevels: 100
  for (const track of GAME_TRACKS) {
    await Game.updateOne(
      { slug: track.slug },
      { $set: { totalLevels: 100, isActive: true } },
      { upsert: false }
    );
  }

  const finalCounts = await Challenge.aggregate([
    { $match: { gameSlug: { $in: slugs } } },
    { $group: { _id: '$gameSlug', count: { $sum: 1 } } }
  ]);

  console.log('[GameHubSeeder] Final Challenge Distribution:');
  finalCounts.forEach(fc => {
    console.log(`  ✔ ${fc._id}: ${fc.count} challenges`);
  });

  return finalCounts;
}

if (require.main === module) {
  mongoose.connect('mongodb://127.0.0.1:27017/codequest_db')
    .then(async () => {
      await seedGameHubChallenges();
      process.exit(0);
    })
    .catch(err => {
      console.error('[GameHubSeeder] Error:', err);
      process.exit(1);
    });
}

module.exports = { seedGameHubChallenges };
