const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: 'd:/Game_project/server/.env' });

const Course = require('../models/Course');
const Internship = require('../models/Internship');
const Project = require('../models/Project');
const College = require('../models/College');
const CollegeTraining = require('../models/CollegeTraining');
const Batch = require('../models/Batch');
const FeePlan = require('../models/FeePlan');
const StudentProfile = require('../models/StudentProfile');
const ProjectAssignment = require('../models/ProjectAssignment');
const ProjectRequirement = require('../models/ProjectRequirement');
const User = require('../models/User');

async function inspect() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('--- DB RECORD COUNTS ---');
  console.log('Courses:', await Course.countDocuments());
  console.log('Internships:', await Internship.countDocuments());
  console.log('Projects:', await Project.countDocuments());
  console.log('Colleges:', await College.countDocuments());
  console.log('CollegeTrainings:', await CollegeTraining.countDocuments());
  console.log('Batches:', await Batch.countDocuments());
  console.log('FeePlans:', await FeePlan.countDocuments());
  console.log('StudentProfiles:', await StudentProfile.countDocuments());
  console.log('ProjectAssignments:', await ProjectAssignment.countDocuments());
  console.log('ProjectRequirements:', await ProjectRequirement.countDocuments());
  console.log('Users:', await User.countDocuments());

  const feePlanCats = await FeePlan.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 }, totalFee: { $sum: '$totalAgreedFee' } } }
  ]);
  console.log('FeePlans by Category:', JSON.stringify(feePlanCats, null, 2));

  const courses = await Course.find().select('title category level isActive').limit(3);
  console.log('Sample Courses:', courses);

  const internships = await Internship.find().select('title domain stipend isActive').limit(3);
  console.log('Sample Internships:', internships);

  const batches = await Batch.find().select('name collegeId department').limit(3);
  console.log('Sample Batches:', batches);

  const trainings = await CollegeTraining.find().limit(3);
  console.log('Sample CollegeTrainings:', trainings);

  await mongoose.disconnect();
}
inspect().catch(err => {
  console.error(err);
  process.exit(1);
});
