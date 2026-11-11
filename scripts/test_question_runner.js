const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const InterviewTestCase = require('../models/InterviewTestCase');
const { evaluateCode } = require('../services/interviewCodeRunner');

async function testRunner() {
  await mongoose.connect(process.env.MONGODB_URI);
  const qId = '6aec842a2d74146a202eef29';
  const testCases = await InterviewTestCase.find({ questionId: qId }).sort({ isHidden: 1, createdAt: 1 });
  console.log(`Loaded ${testCases.length} test cases from DB for question ${qId}.`);

  // 1. Flawed student code (fails on negative numbers because second is initialized to 0 or -1)
  const flawedCode = `
import sys

def solve():
    raw = sys.stdin.read().strip()
    if not raw:
        return
    nums = [int(x) for x in raw.split()]
    unique = list(set(nums))
    if len(unique) < 2:
        print(-1)
        return
    unique.sort(reverse=True)
    # Bug: if all numbers are negative and someone writes flawed check
    print(unique[1])

solve()
`;

  console.log('\n--- Running Correct Code ---');
  const res1 = await evaluateCode({
    language: 'python',
    code: flawedCode,
    testCases,
    isSubmit: false
  });
  console.log(`Result: passedTests=${res1.passedTests}/${res1.totalTests}, allPassed=${res1.allPassed}`);
  res1.testResults.forEach(tr => {
    console.log(`  Case ${tr.caseNumber} (isHidden=${tr.isHidden}): passed=${tr.passed}, actual=${JSON.stringify(tr.actual)}`);
  });

  // 2. Code that fails case 4 (like many students write):
  const buggyCode = `
import sys
raw = sys.stdin.read().strip()
nums = [int(x) for x in raw.split()]
# Common student mistake: second initialized to 0
first = -999999
second = -1
for x in nums:
    if x > first:
        second = first
        first = x
    elif x > second and x != first:
        second = x
if second == -999999 or second == -1:
    print(-1)
else:
    print(second)
`;

  console.log('\n--- Running Buggy Code ---');
  const res2 = await evaluateCode({
    language: 'python',
    code: buggyCode,
    testCases,
    isSubmit: false
  });
  console.log(`Result: passedTests=${res2.passedTests}/${res2.totalTests}, allPassed=${res2.allPassed}`);
  res2.testResults.forEach(tr => {
    console.log(`  Case ${tr.caseNumber} (isHidden=${tr.isHidden}): passed=${tr.passed}, actual=${JSON.stringify(tr.actual)}`);
  });

  process.exit(0);
}

testRunner().catch(err => {
  console.error(err);
  process.exit(1);
});
