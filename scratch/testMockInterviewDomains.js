const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/stackqueue';
const { startMockInterview } = require('../controllers/interviewQuestionController');

// Mock req / res helper
function createMockReqRes(body = {}, query = {}) {
  const req = {
    body,
    query,
    user: { _id: new mongoose.Types.ObjectId() }
  };
  let statusCode = 200;
  let responseData = null;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    }
  };

  return { req, res, getResult: () => ({ statusCode, responseData }) };
}

mongoose.connect(MONGODB_URI).then(async () => {
  console.log('=== TEST 1: Java Domain ===');
  const t1 = createMockReqRes({ domain: 'java', difficulty: 'Medium', duration: 30 });
  await startMockInterview(t1.req, t1.res);
  const r1 = t1.getResult();
  console.log('Status:', r1.statusCode, 'Count:', r1.responseData.data?.questions?.length);
  const domains1 = r1.responseData.data?.questions?.map(q => q.domain);
  console.log('Domains returned:', [...new Set(domains1)]);
  const allJava = domains1.every(d => d === 'java');
  console.log('Strict Java verification:', allJava ? 'PASS' : 'FAIL');

  console.log('\n=== TEST 2: Python Domain ===');
  const t2 = createMockReqRes({ domain: 'python', difficulty: 'Easy', duration: 30 });
  await startMockInterview(t2.req, t2.res);
  const r2 = t2.getResult();
  console.log('Status:', r2.statusCode, 'Count:', r2.responseData.data?.questions?.length);
  const domains2 = r2.responseData.data?.questions?.map(q => q.domain);
  console.log('Domains returned:', [...new Set(domains2)]);
  const allPython = domains2.every(d => d === 'python');
  console.log('Strict Python verification:', allPython ? 'PASS' : 'FAIL');

  console.log('\n=== TEST 3: C++ Domain ===');
  const t3 = createMockReqRes({ domain: 'cpp', difficulty: 'Easy', duration: 30 });
  await startMockInterview(t3.req, t3.res);
  const r3 = t3.getResult();
  console.log('Status:', r3.statusCode, 'Count:', r3.responseData.data?.questions?.length);
  const domains3 = r3.responseData.data?.questions?.map(q => q.domain);
  console.log('Domains returned:', [...new Set(domains3)]);
  const allCpp = domains3.every(d => d === 'cpp');
  console.log('Strict C++ verification:', allCpp ? 'PASS' : 'FAIL');

  console.log('\n=== TEST 4: DSA Domain ===');
  const t4 = createMockReqRes({ domain: 'dsa', difficulty: 'Easy', duration: 30 });
  await startMockInterview(t4.req, t4.res);
  const r4 = t4.getResult();
  console.log('Status:', r4.statusCode, 'Count:', r4.responseData.data?.questions?.length);
  const domains4 = r4.responseData.data?.questions?.map(q => q.domain);
  console.log('Domains returned:', [...new Set(domains4)]);
  const allDsa = domains4.every(d => d === 'dsa');
  console.log('Strict DSA verification:', allDsa ? 'PASS' : 'FAIL');

  console.log('\n=== TEST 5: SQL Domain (Empty in DB) ===');
  const t5 = createMockReqRes({ domain: 'sql', difficulty: 'Easy', duration: 30 });
  await startMockInterview(t5.req, t5.res);
  const r5 = t5.getResult();
  console.log('Status:', r5.statusCode, 'Count:', r5.responseData.count, 'Message:', r5.responseData.message);
  console.log('SQL Zero Leaking verification:', r5.responseData.data?.questions?.length === 0 ? 'PASS' : 'FAIL');

  console.log('\n=== TEST 6: Cyber Security Domain (Empty in DB) ===');
  const t6 = createMockReqRes({ domain: 'cybersecurity', difficulty: 'Easy', duration: 30 });
  await startMockInterview(t6.req, t6.res);
  const r6 = t6.getResult();
  console.log('Status:', r6.statusCode, 'Count:', r6.responseData.count, 'Message:', r6.responseData.message);
  console.log('Cyber Zero Leaking verification:', r6.responseData.data?.questions?.length === 0 ? 'PASS' : 'FAIL');

  console.log('\n=== ALL DOMAIN TESTS COMPLETED ===');
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
