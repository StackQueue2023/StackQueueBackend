const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

async function fixRoles() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/codequest_db';
    await mongoose.connect(uri);
    console.log('Connected to MongoDB:', uri);

    const User = require('../models/User');
    const TrainerProfile = require('../models/TrainerProfile');

    const profiles = await TrainerProfile.find();
    console.log(`Found ${profiles.length} TrainerProfiles.`);

    for (const p of profiles) {
      if (p.userId) {
        const res = await User.updateOne(
          { _id: p.userId },
          { $set: { role: 'trainer' } }
        );
        console.log(`Updated user ${p.userId} (${p.fullName}) to role 'trainer':`, res);
      }
    }

    // Also update any user with role 'tutor' to 'trainer'
    const tutorRoleRes = await User.updateMany(
      { role: 'tutor' },
      { $set: { role: 'trainer' } }
    );
    console.log(`Updated users with role 'tutor' to 'trainer':`, tutorRoleRes);

    process.exit(0);
  } catch (err) {
    console.error('Error fixing roles:', err);
    process.exit(1);
  }
}

fixRoles();
