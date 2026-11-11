const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/stackqueue';

mongoose.connect(MONGODB_URI).then(async () => {
  const Course = require('../models/Course');
  const courses = await Course.find();
  console.log('Courses count:', courses.length);
  courses.forEach(c => {
    console.log(`Course: id=${c._id}, title="${c.title}", domain="${c.domain}", code="${c.courseCode}"`);
  });

  const InterviewQuestion = require('../models/InterviewQuestion');
  // Check if any question has courseId or domainId
  const withCourse = await InterviewQuestion.countDocuments({ courseId: { $exists: true } });
  const withDomainId = await InterviewQuestion.countDocuments({ domainId: { $exists: true } });
  console.log('InterviewQuestions with courseId:', withCourse, 'with domainId:', withDomainId);

  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
