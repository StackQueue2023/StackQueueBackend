const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');
  const FeePlan = require('../models/FeePlan');
  const MonthlyInstallment = require('../models/MonthlyInstallment');
  const User = require('../models/User');

  const dummyPlans = await FeePlan.find({
    $or: [
      { isDummy: true },
      { studentEmail: /@example\.com$/ },
      { studentCode: /^STU-2026/ }
    ]
  });
  console.log('Dummy FeePlans count:', dummyPlans.length);

  const dummyInstallments = await MonthlyInstallment.find({
    $or: [
      { isDummy: true },
      { studentEmail: /@example\.com$/ },
      { studentCode: /^STU-2026/ }
    ]
  });
  console.log('Dummy Installments count:', dummyInstallments.length);

  const dummyUsers = await User.find({
    email: /@example\.com$/
  });
  console.log('Dummy Users with @example.com:', dummyUsers.length);

  process.exit(0);
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
