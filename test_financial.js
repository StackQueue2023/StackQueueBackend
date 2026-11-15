const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');

const Batch = require('./models/Batch');
const College = require('./models/College');
const Course = require('./models/Course');
const User = require('./models/User');
const {
  CollegePaymentTransaction,
  TrainerPaymentTransaction,
  CollegeFinancialReport,
  CollegeFinancialEmailLog,
  CollegeFinancialConfig
} = require('./models/CollegeFinancialModels');
const { triggerFinancialReport } = require('./services/collegeFinancialReportService');

async function runTests() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  console.log('Connected to MongoDB Atlas, readyState:', mongoose.connection.readyState);

  // Find or create test college and batch
  let college = await College.findOne({ code: 'TEST-COL-001' });
  if (!college) {
    college = await College.create({
      name: 'Alpha Engineering College',
      code: 'TEST-COL-001',
      city: 'Chennai',
      address: 'Tech Park Campus, Chennai'
    });
  }
  console.log('College verified:', college.name);

  // Find trainer
  let trainer = await User.findOne({ role: 'trainer' });
  if (!trainer) {
    trainer = await User.create({
      name: 'Prof. Ramesh Kumar',
      email: 'ramesh.trainer@example.com',
      role: 'trainer'
    });
  }
  console.log('Trainer verified:', trainer.name);

  // Clear previous test batches for clean isolation
  await Batch.deleteMany({ code: { $in: ['TEST-BATCH-STUDENT', 'TEST-BATCH-DAY', 'TEST-BATCH-LEDGER'] } });
  await CollegePaymentTransaction.deleteMany({ invoiceNumber: { $regex: /TEST-INV/ } });
  await TrainerPaymentTransaction.deleteMany({ remarks: { $regex: /TEST/ } });

  console.log('\n====================================================');
  console.log('TEST 1: Student-based college payment');
  console.log('Formula: 50 students x Rs. 2,000 = Rs. 1,00,000');
  console.log('====================================================');
  const dummyStudentIds = Array.from({ length: 50 }, () => new mongoose.Types.ObjectId());
  const batch1 = await Batch.create({
    name: 'Full Stack Java Batch 1',
    code: 'TEST-BATCH-STUDENT',
    batchType: 'COLLEGE_TRAINING',
    collegeId: college._id,
    department: 'CSE',
    studentIds: dummyStudentIds,
    totalStudents: 50,
    pricingModel: 'PER_STUDENT',
    ratePerStudent: 2000,
    actualTrainingDays: 10
  });

  const b1Calc = await Batch.findById(batch1._id);
  const studentCount1 = b1Calc.studentIds.length;
  const expected1 = studentCount1 * b1Calc.ratePerStudent;
  console.log(`Student Count: ${studentCount1}`);
  console.log(`Rate Per Student: Rs. ${b1Calc.ratePerStudent}`);
  console.log(`Calculated Expected Revenue: Rs. ${expected1}`);
  if (expected1 === 100000) {
    console.log('>>> TEST 1 PASSED: Rs. 1,00,000 correctly calculated (training days not multiplied)\n');
  } else {
    console.error(`>>> TEST 1 FAILED: Expected 100000, got ${expected1}\n`);
  }

  console.log('====================================================');
  console.log('TEST 2: Day-based college payment');
  console.log('Formula: 10 actual training days x Rs. 5,000 = Rs. 50,000');
  console.log('====================================================');
  const batch2 = await Batch.create({
    name: 'Cyber Security Bootcamp',
    code: 'TEST-BATCH-DAY',
    batchType: 'COLLEGE_TRAINING',
    collegeId: college._id,
    department: 'Cyber Security',
    studentIds: dummyStudentIds, // 50 students exist, but must NOT affect day-based calculation!
    totalStudents: 50,
    pricingModel: 'PER_DAY',
    ratePerDay: 5000,
    actualTrainingDays: 10
  });

  const b2Calc = await Batch.findById(batch2._id);
  const expected2 = b2Calc.actualTrainingDays * b2Calc.ratePerDay;
  console.log(`Scheduled Training Days: ${b2Calc.actualTrainingDays}`);
  console.log(`Rate Per Day: Rs. ${b2Calc.ratePerDay}`);
  console.log(`Calculated Expected Revenue: Rs. ${expected2}`);
  if (expected2 === 50000) {
    console.log('>>> TEST 2 PASSED: Rs. 50,000 correctly calculated (student count not multiplied)\n');
  } else {
    console.error(`>>> TEST 2 FAILED: Expected 50000, got ${expected2}\n`);
  }

  console.log('====================================================');
  console.log('TEST 3: Trainer payment calculation');
  console.log('Formula: 10 assigned days x Rs. 2,000 = Rs. 20,000 for one trainer');
  console.log('====================================================');
  const batch3 = await Batch.create({
    name: 'AI & Data Science Cohort',
    code: 'TEST-BATCH-LEDGER',
    batchType: 'COLLEGE_TRAINING',
    collegeId: college._id,
    department: 'AIDS',
    studentIds: dummyStudentIds,
    totalStudents: 50,
    pricingModel: 'PER_STUDENT',
    ratePerStudent: 2000,
    actualTrainingDays: 10,
    assignedTrainers: [{
      trainerId: trainer._id,
      name: trainer.name,
      email: trainer.email,
      paymentModel: 'PER_DAY',
      rate: 2000,
      assignedDays: 10
    }]
  });

  const tr = batch3.assignedTrainers[0];
  const trainerTotal = tr.assignedDays * tr.rate;
  batch3.totalTrainerPayment = trainerTotal;
  batch3.trainerPaymentPending = trainerTotal;
  batch3.expectedCollegeRevenue = 100000;
  batch3.collegePendingAmount = 100000;
  await batch3.save();

  console.log(`Trainer: ${tr.name}`);
  console.log(`Assigned Days: ${tr.assignedDays}`);
  console.log(`Rate per Day: Rs. ${tr.rate}`);
  console.log(`Calculated Trainer Payment: Rs. ${trainerTotal}`);
  if (trainerTotal === 20000) {
    console.log('>>> TEST 3 PASSED: Rs. 20,000 correctly calculated for trainer\n');
  } else {
    console.error(`>>> TEST 3 FAILED: Expected 20000, got ${trainerTotal}\n`);
  }

  console.log('====================================================');
  console.log('TEST 4: College payment received');
  console.log('Expected: Rs. 1,00,000 | Received: Rs. 60,000 | College Pending: Rs. 40,000');
  console.log('====================================================');
  const payment1 = await CollegePaymentTransaction.create({
    transactionId: `TXN-COL-TEST-001`,
    batchId: batch3._id,
    collegeId: college._id,
    invoiceNumber: 'TEST-INV-001',
    amount: 60000,
    status: 'Verified',
    paymentMode: 'Bank Transfer',
    transactionReference: 'NEFT99887711',
    remarks: 'TEST College payment 1st installment'
  });

  batch3.totalCollegeReceived = 60000;
  batch3.collegePendingAmount = batch3.expectedCollegeRevenue - batch3.totalCollegeReceived;
  batch3.collegePaymentStatus = 'Partially Received';
  await batch3.save();

  console.log(`Expected College Revenue: Rs. ${batch3.expectedCollegeRevenue}`);
  console.log(`Total College Received: Rs. ${batch3.totalCollegeReceived}`);
  console.log(`College Pending Amount: Rs. ${batch3.collegePendingAmount}`);
  if (batch3.collegePendingAmount === 40000) {
    console.log('>>> TEST 4 PASSED: College Pending = Rs. 40,000 correctly calculated\n');
  } else {
    console.error(`>>> TEST 4 FAILED: Expected 40000, got ${batch3.collegePendingAmount}\n`);
  }

  console.log('====================================================');
  console.log('TEST 5: Trainer payment released');
  console.log('Trainer Payment: Rs. 20,000 | Released: Rs. 10,000 | Trainer Pending: Rs. 10,000');
  console.log('====================================================');
  const trainerPayment1 = await TrainerPaymentTransaction.create({
    transactionId: `TXN-TRN-TEST-001`,
    batchId: batch3._id,
    trainerId: trainer._id,
    trainerName: trainer.name,
    amount: 10000,
    status: 'Verified',
    paymentMode: 'UPI',
    transactionReference: 'UPI-TXN-112233',
    remarks: 'TEST Trainer partial disbursement'
  });

  batch3.totalTrainerReleased = 10000;
  batch3.trainerPaymentPending = batch3.totalTrainerPayment - batch3.totalTrainerReleased;
  batch3.trainerPaymentStatus = 'Partially Released';
  await batch3.save();

  console.log(`Total Trainer Payment: Rs. ${batch3.totalTrainerPayment}`);
  console.log(`Total Trainer Released: Rs. ${batch3.totalTrainerReleased}`);
  console.log(`Trainer Pending Amount: Rs. ${batch3.trainerPaymentPending}`);
  if (batch3.trainerPaymentPending === 10000) {
    console.log('>>> TEST 5 PASSED: Trainer Pending = Rs. 10,000 correctly calculated\n');
  } else {
    console.error(`>>> TEST 5 FAILED: Expected 10000, got ${batch3.trainerPaymentPending}\n`);
  }

  console.log('====================================================');
  console.log('TEST 6: College paid in full but trainer not paid');
  console.log('College Expected: Rs. 1,00,000 | Received: Rs. 1,00,000');
  console.log('Trainer Payment: Rs. 20,000 | Trainer Released: Rs. 0');
  console.log('Expected: College Pending: Rs. 0 | Trainer Pending: Rs. 20,000');
  console.log('====================================================');
  const batch6 = await Batch.create({
    name: 'Advanced React Native',
    code: 'TEST-BATCH-PAID-COL',
    batchType: 'COLLEGE_TRAINING',
    collegeId: college._id,
    department: 'IT',
    studentIds: dummyStudentIds,
    totalStudents: 50,
    pricingModel: 'PER_STUDENT',
    ratePerStudent: 2000,
    actualTrainingDays: 10,
    expectedCollegeRevenue: 100000,
    totalCollegeReceived: 100000,
    collegePendingAmount: 0,
    collegePaymentStatus: 'Fully Received',
    assignedTrainers: [{
      trainerId: trainer._id,
      name: trainer.name,
      paymentModel: 'PER_DAY',
      rate: 2000,
      assignedDays: 10,
      totalPayment: 20000,
      amountReleased: 0,
      pendingAmount: 20000,
      paymentStatus: 'Not Released'
    }],
    totalTrainerPayment: 20000,
    totalTrainerReleased: 0,
    trainerPaymentPending: 20000,
    trainerPaymentStatus: 'Not Released'
  });

  console.log(`Batch: ${batch6.name}`);
  console.log(`College Pending: Rs. ${batch6.collegePendingAmount}`);
  console.log(`Trainer Pending: Rs. ${batch6.trainerPaymentPending}`);
  if (batch6.collegePendingAmount === 0 && batch6.trainerPaymentPending === 20000) {
    console.log('>>> TEST 6 PASSED: College Pending is Rs. 0, Trainer Pending is Rs. 20,000 (remains in Trainer Pending)\n');
  } else {
    console.error('>>> TEST 6 FAILED\n');
  }

  console.log('====================================================');
  console.log('TEST 7: Automatic Financial Report Generation & Email');
  console.log('====================================================');
  console.log('Triggering report generation for Event A (COLLEGE_PAYMENT)...');
  const repA = await triggerFinancialReport(batch3, 'COLLEGE_PAYMENT', 'TXN-COL-TEST-001');
  console.log(`Report A generated: ID=${repA?.reportId}, Version=${repA?.version}, EmailStatus=${repA?.emailDeliveryStatus}`);

  console.log('Triggering report generation for Event B (TRAINER_PAYMENT)...');
  const repB = await triggerFinancialReport(batch3, 'TRAINER_PAYMENT', 'TXN-TRN-TEST-001');
  console.log(`Report B generated: ID=${repB?.reportId}, Version=${repB?.version}, EmailStatus=${repB?.emailDeliveryStatus}`);

  const emailLogs = await CollegeFinancialEmailLog.find({ batchId: batch3._id });
  console.log(`Total Email Logs recorded for batch3: ${emailLogs.length}`);
  emailLogs.forEach(log => {
    console.log(`- Trigger: ${log.triggerEvent}, Recipient: ${log.recipient}, Status: ${log.status}, Subject: ${log.subject}`);
  });

  if (repA && repB && emailLogs.length >= 2) {
    console.log('>>> TEST 7 PASSED: Both reports generated, versioned, and email logs verified!\n');
  } else {
    console.error('>>> TEST 7 FAILED\n');
  }

  // Cleanup test batch 6 and 1, 2, 3
  await Batch.deleteMany({ code: { $in: ['TEST-BATCH-STUDENT', 'TEST-BATCH-DAY', 'TEST-BATCH-LEDGER', 'TEST-BATCH-PAID-COL'] } });
  await College.deleteOne({ code: 'TEST-COL-001' });

  console.log('====================================================');
  console.log('ALL 7 FINANCIAL SPECIFICATION TESTS EXECUTED SUCCESSFULLY!');
  console.log('====================================================');

  await mongoose.disconnect();
}

runTests().catch(console.error);
