require('dotenv').config();
const connectDB = require('../config/db');
const { seedDatabase } = require('./seedService');

async function run() {
  try {
    await connectDB();
    await seedDatabase();
    console.log('[SeedRunner] Seeding finished successfully.');
    process.exit(0);
  } catch (err) {
    console.error('[SeedRunner] Seeding failed:', err);
    process.exit(1);
  }
}

run();
