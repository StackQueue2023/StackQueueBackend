const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });

async function scanAndFixBranding() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB. Scanning database for old dummy branding...');

    const collections = await mongoose.connection.db.listCollections().toArray();
    for (const c of collections) {
      const collName = c.name;
      const coll = mongoose.connection.db.collection(collName);

      const docs = await coll.find({
        $or: [
          { title: { $regex: 'CodeQuest', $options: 'i' } },
          { name: { $regex: 'CodeQuest', $options: 'i' } },
          { message: { $regex: 'CodeQuest', $options: 'i' } },
          { description: { $regex: 'CodeQuest', $options: 'i' } },
          { subject: { $regex: 'CodeQuest', $options: 'i' } },
          { email: { $regex: 'codequest', $options: 'i' } }
        ]
      }).toArray();

      if (docs.length > 0) {
        console.log(`Found ${docs.length} records in collection "${collName}" with old branding.`);
        for (const doc of docs) {
          const updates = {};
          if (doc.title && /codequest/i.test(doc.title)) {
            updates.title = doc.title.replace(/CodeQuest/gi, 'STACK QUEUE');
          }
          if (doc.name && /codequest/i.test(doc.name)) {
            updates.name = doc.name.replace(/CodeQuest/gi, 'STACK QUEUE');
          }
          if (doc.message && /codequest/i.test(doc.message)) {
            updates.message = doc.message.replace(/CodeQuest/gi, 'STACK QUEUE');
          }
          if (doc.description && /codequest/i.test(doc.description)) {
            updates.description = doc.description.replace(/CodeQuest/gi, 'STACK QUEUE');
          }
          if (doc.subject && /codequest/i.test(doc.subject)) {
            updates.subject = doc.subject.replace(/CodeQuest/gi, 'STACK QUEUE');
          }
          if (doc.email && /codequest/i.test(doc.email)) {
            updates.email = doc.email.replace(/codequest/gi, 'stackqueue');
          }

          if (Object.keys(updates).length > 0) {
            await coll.updateOne({ _id: doc._id }, { $set: updates });
            console.log(`  Updated doc ${doc._id} in "${collName}":`, updates);
          }
        }
      }
    }

    console.log('Database branding scan and cleanup completed.');
    process.exit(0);
  } catch (err) {
    console.error('Error during DB branding scan:', err);
    process.exit(1);
  }
}

scanAndFixBranding();
