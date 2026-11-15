const mongoose = require('mongoose');
require('dotenv').config();
const TrainingTaskAssignment = require('./models/TrainingTaskAssignment');

async function checkTask() {
  await mongoose.connect(process.env.MONGODB_URI);
  const count = await TrainingTaskAssignment.countDocuments();
  console.log('TrainingTaskAssignment count:', count);
  const sample = await TrainingTaskAssignment.findOne().lean();
  console.log('Sample task:', sample);
  await mongoose.disconnect();
}
checkTask().catch(console.error);
