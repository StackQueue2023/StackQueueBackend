const mongoose = require('mongoose');

const CATEGORY_MAP = {
  'Software Development': 'Enterprise Software',
  'Data Science & AI': 'Artificial Intelligence',
  'Web Engineering': 'Modern Web Engineering',
  'Web Development': 'Modern Web Engineering',
  'Cloud & DevOps': 'Cloud Architecture',
  'Cybersecurity': 'Security Engineering',
  'Mobile Development': 'Cross-Platform Mobile',
  'Data & Analytics': 'Data Architecture'
};

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/codequest_db');
  console.log('Connected to MongoDB');

  const collections = await mongoose.connection.db.listCollections().toArray();
  for (const col of collections) {
    const name = col.name;
    const items = await mongoose.connection.collection(name).find({}).toArray();
    let updatedCount = 0;
    for (const item of items) {
      let needsUpdate = false;
      const updates = {};

      if (item.category && CATEGORY_MAP[item.category]) {
        updates.category = CATEGORY_MAP[item.category];
        needsUpdate = true;
      }
      if (item.domain && CATEGORY_MAP[item.domain]) {
        updates.domain = CATEGORY_MAP[item.domain];
        needsUpdate = true;
      }

      if (needsUpdate) {
        await mongoose.connection.collection(name).updateOne(
          { _id: item._id },
          { $set: updates }
        );
        updatedCount++;
      }
    }
    if (updatedCount > 0) {
      console.log(`Updated ${updatedCount} records in ${name}`);
    }
  }

  // Verify courses
  const courses = await mongoose.connection.collection('courses').find({}).toArray();
  console.log('\nVerified Courses:');
  courses.forEach(c => {
    console.log(`- ${c.title}: category = "${c.category}"`);
  });

  await mongoose.disconnect();
  console.log('Done!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
