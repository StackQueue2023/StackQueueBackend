const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

async function migrateIndexes() {
  await mongoose.connect(process.env.MONGODB_URI);
  const coll = mongoose.connection.collection('collegetrainingenrollments');
  const indexes = await coll.indexes();
  console.log('Current indexes on collegetrainingenrollments:');
  console.log(indexes.map(i => ({ name: i.name, key: i.key, unique: i.unique })));

  // If old unique index exists, drop it
  const oldIndex = indexes.find(i => i.name === 'studentId_1_collegeTrainingBatchId_1');
  if (oldIndex) {
    console.log('Dropping old restrictive index "studentId_1_collegeTrainingBatchId_1"...');
    await coll.dropIndex('studentId_1_collegeTrainingBatchId_1');
    console.log('Old index dropped successfully.');
  }

  // Create new compound index
  console.log('Creating new index: studentId_1_collegeTrainingBatchId_1_courseId_1...');
  await coll.createIndex(
    { studentId: 1, collegeTrainingBatchId: 1, courseId: 1 },
    { unique: true, background: true }
  );
  console.log('New compound index created successfully.');

  const updatedIndexes = await coll.indexes();
  console.log('Updated indexes:');
  console.log(updatedIndexes.map(i => ({ name: i.name, key: i.key, unique: i.unique })));

  await mongoose.disconnect();
  process.exit(0);
}

migrateIndexes().catch(err => {
  console.error(err);
  process.exit(1);
});
