const mongoose = require('mongoose');
const Module = require('../models/Module');
const DomainTask = require('../models/DomainTask');

async function inspectModules() {
  await mongoose.connect('mongodb://127.0.0.1:27017/codequest_db');
  console.log('Distinct Module Domains:', await Module.distinct('domain'));
  console.log('Distinct Task Domains:', await DomainTask.distinct('domain'));

  const modulesByDomain = await Module.aggregate([
    { $group: { _id: { domain: '$domain', courseId: '$courseId' }, count: { $sum: 1 } } }
  ]);
  console.log('Modules Grouped by Domain & CourseId:', modulesByDomain);

  process.exit();
}

inspectModules();
