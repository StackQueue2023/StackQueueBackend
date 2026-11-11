const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });

async function syncCourseDomains() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const Course = mongoose.model('Course', new mongoose.Schema({}, { strict: false }));

    const explicitOverrides = {
      'JAVA': 'java',
      'Java Full Stack': 'java',
      'Java FullStack': 'java',
      'Core Java': 'java',
      'Java Full Stack Enterprise Engineering': 'java',
      'Python (Basics)': 'python',
      'Python + MySQL': 'python',
      'Data Science using Python': 'python',
      'Data Analytics': 'dataanalytics',
      'REACT': 'react',
      'Angular': 'angular',
      'UI UX': 'uiux',
      'Selenium': 'selenium',
      'MERN STACK': 'mernstack',
      'C PROGRAMMING': 'cpp',
      'C': 'cpp',
      'C + Java': 'java',
      'AWS': 'cloudcomputingaws',
      'AWS-AZURE-DEVOPS': 'devopsengineering',
      'Fullstack Development': 'fullstackwebdevelopment',
      'FEMN stack Development': 'mernstack',
      'Mysql': 'mysql',
      'DCA': 'dca'
    };

    for (const [title, dom] of Object.entries(explicitOverrides)) {
      await Course.updateMany({ title: new RegExp(`^${title}$`, 'i') }, { $set: { domain: dom } });
      console.log(`Updated "${title}" -> domain: "${dom}"`);
    }

    console.log('Explicit course domain mappings set.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

syncCourseDomains();
