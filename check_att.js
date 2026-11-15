const mongoose = require('mongoose');
require('dotenv').config();
const StudentAttendance = require('./models/StudentAttendance');

async function checkAtt() {
  await mongoose.connect(process.env.MONGODB_URI);
  const count = await StudentAttendance.countDocuments();
  console.log('StudentAttendance records count:', count);
  const sample = await StudentAttendance.findOne().lean();
  console.log('Sample attendance:', sample);
  await mongoose.disconnect();
}
checkAtt().catch(console.error);
