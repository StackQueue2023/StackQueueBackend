const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

console.log('process.env.MONGODB_URI:', process.env.MONGODB_URI);

async function check(uri, label) {
  try {
    const conn = await mongoose.createConnection(uri).asPromise();
    const count = await conn.db.collection('interviewquestions').countDocuments();
    console.log(`${label} count in interviewquestions: ${count}`);
    const distinctDomains = await conn.db.collection('interviewquestions').distinct('domain');
    console.log(`${label} domains:`, distinctDomains);
    await conn.close();
  } catch (e) {
    console.log(`${label} failed:`, e.message);
  }
}

async function run() {
  await check(process.env.MONGODB_URI, 'Remote stackqueue_2');
  await check('mongodb://127.0.0.1:27017/stackqueue', 'Local stackqueue');
  await check('mongodb://127.0.0.1:27017/codequest_db', 'Local codequest_db');
  process.exit(0);
}
run();
