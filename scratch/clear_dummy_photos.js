const mongoose = require('mongoose');

async function clearDummyPhotos() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/codequest_db');
    console.log('Connected to MongoDB...');

    const TrainerProfile = require('../models/TrainerProfile');
    const res = await TrainerProfile.updateMany(
      { profilePhotoUrl: { $regex: /unsplash|stock|dummy/i } },
      { $set: { profilePhotoUrl: '' } }
    );

    console.log('Cleared dummy stock photo URLs from DB:', res);
    mongoose.disconnect();
  } catch (err) {
    console.error('Error clearing dummy photos:', err);
    process.exit(1);
  }
}

clearDummyPhotos();
