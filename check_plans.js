const path = require('path');
const fs = require('fs');
const envPath = fs.existsSync(path.join(__dirname, '.env')) ? path.join(__dirname, '.env') : path.join(__dirname, '..', '.env');
require('dotenv').config({ path: envPath });
const mongoose = require('mongoose');

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    const FeePlan = require('./models/FeePlan');
    const PaymentTransaction = require('./models/PaymentTransaction');
    const count = await FeePlan.countDocuments();
    const plans = await FeePlan.find().limit(3).lean();
    const txns = await PaymentTransaction.find().lean();
    console.log('FeePlan count:', count);
    if (plans[0]) {
      console.log('Sample plan:', {
        category: plans[0].category,
        programName: plans[0].programName,
        totalFee: plans[0].totalFee,
        collected: plans[0].collectedAmount,
        pending: plans[0].remainingBalance,
        studentName: plans[0].studentName
      });
    }
    console.log('Txns count:', txns.length);
    txns.forEach(t => {
      console.log({ id: t._id, amount: t.amount, status: t.status, category: t.category, method: t.paymentMethod });
    });
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

check();
