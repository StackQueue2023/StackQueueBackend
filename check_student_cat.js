const mongoose = require('mongoose');
require('dotenv').config();
const Batch = require('./models/Batch');
const User = require('./models/User');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const b = await Batch.findById('6af57cd08c5f53e128171f61').lean();
  console.log('Batch students count:', b.studentIds ? b.studentIds.length : 0);
  if (b.studentIds && b.studentIds.length > 0) {
    const s = await User.findById(b.studentIds[0]).lean();
    console.log('Sample student:', s.name, s.email, 'role:', s.role, 'studentCategory:', s.studentCategory, 'studentType:', s.studentType);
    const countWithCategory = await User.countDocuments({ _id: { $in: b.studentIds }, studentCategory: 'TRAINING_TEMPORARY' });
    console.log('Count with TRAINING_TEMPORARY:', countWithCategory);
  }
  await mongoose.disconnect();
}
check().catch(console.error);
