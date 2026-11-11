const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const DomainTask = require('../models/DomainTask');
  const sampleTask = await DomainTask.findOne({ domain: 'java' });
  if (sampleTask) {
    console.log('Sample Java DomainTask:', {
      title: sampleTask.title,
      description: sampleTask.description.slice(0, 200),
      sampleInput: sampleTask.sampleInput,
      sampleOutput: sampleTask.sampleOutput,
      testCases: sampleTask.testCases
    });
  }
  await mongoose.disconnect();
}
run();
