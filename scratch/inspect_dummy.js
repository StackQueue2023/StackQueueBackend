const mongoose = require('mongoose');

async function inspectDummy() {
  await mongoose.connect('mongodb://127.0.0.1:27017/codequest_db');
  const User = require('../models/User');
  const TrainerProfile = require('../models/TrainerProfile');
  const College = require('../models/College');

  console.log('--- NON-ADMIN USERS ---');
  const nonAdminUsers = await User.find({ role: { $ne: 'admin' } });
  console.log(JSON.stringify(nonAdminUsers, null, 2));

  console.log('--- TRAINER PROFILES ---');
  const trainerProfiles = await TrainerProfile.find();
  console.log(JSON.stringify(trainerProfiles, null, 2));

  console.log('--- COLLEGES ---');
  const colleges = await College.find();
  console.log(JSON.stringify(colleges, null, 2));

  mongoose.disconnect();
}

inspectDummy();
