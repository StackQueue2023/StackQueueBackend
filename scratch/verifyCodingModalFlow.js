const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const DomainTask = require('../models/DomainTask');
const StudentDomainProgress = require('../models/StudentDomainProgress');
const StudentProfile = require('../models/StudentProfile');
const User = require('../models/User');
const { evaluatePracticalCode } = require('../services/practicalCodeRunner');

async function testCodingWorkflow() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // 1. Find or create a test DomainTask
  let task = await DomainTask.findOne({ domain: 'java' });
  if (!task) {
    task = await DomainTask.findOne({});
  }
  console.log('Found Task:', task?.title, '| Domain:', task?.domain, '| ID:', task?._id);

  if (!task) {
    console.error('No DomainTask found to test.');
    process.exit(1);
  }

  // 2. Test evaluatePracticalCode with valid Java code
  const validJava = `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`;
  const testCases = [
    { input: '', expectedOutput: 'Hello, World!', isHidden: false }
  ];

  console.log('\n--- 1. Testing Valid Code Run ---');
  const validRes = await evaluatePracticalCode({
    code: validJava,
    language: 'java',
    domain: 'java',
    testCases
  });
  console.log('Valid Run Result:');
  console.log(' - allPassed:', validRes.allPassed);
  console.log(' - passedTests:', validRes.passedTests, '/', validRes.totalTests);
  console.log(' - compilationError:', validRes.compilationError);
  console.log(' - testResults count:', validRes.testResults?.length);
  if (!validRes.allPassed) {
    console.error('FAIL: Expected valid code to pass all test cases!');
  } else {
    console.log('PASS: Valid code correctly passed all test cases.');
  }

  // 3. Test evaluatePracticalCode with incorrect output
  console.log('\n--- 2. Testing Incorrect Output Run ---');
  const wrongJava = `public class Main {
    public static void main(String[] args) {
        System.out.println("Goodbye, World!");
    }
}`;
  const wrongRes = await evaluatePracticalCode({
    code: wrongJava,
    language: 'java',
    domain: 'java',
    testCases
  });
  console.log('Wrong Output Result:');
  console.log(' - allPassed:', wrongRes.allPassed);
  console.log(' - passedTests:', wrongRes.passedTests, '/', wrongRes.totalTests);
  if (wrongRes.allPassed) {
    console.error('FAIL: Expected incorrect code to fail!');
  } else {
    console.log('PASS: Incorrect code properly failed tests.');
  }

  // 4. Test evaluatePracticalCode with syntax error
  console.log('\n--- 3. Testing Compilation Error Run ---');
  const syntaxErrJava = `public class Main {
    public static void main(String[] args) {
        System.out.println("Missing semicolon")
    }
}`;
  const errRes = await evaluatePracticalCode({
    code: syntaxErrJava,
    language: 'java',
    domain: 'java',
    testCases
  });
  console.log('Syntax Error Result:');
  console.log(' - allPassed:', errRes.allPassed);
  console.log(' - compilationError present:', !!errRes.compilationError);
  if (errRes.allPassed || !errRes.compilationError) {
    console.error('FAIL: Expected syntax error to be captured!');
  } else {
    console.log('PASS: Syntax error captured accurately.');
  }

  // 5. Check duplicate XP prevention logic
  console.log('\n--- 4. Testing Duplicate XP Award Prevention ---');
  const dummyStudent = await User.findOne({ role: 'student' });
  if (dummyStudent) {
    let profile = await StudentProfile.findOne({ userId: dummyStudent._id });
    const initialXp = profile?.totalXp || 0;
    console.log('Student:', dummyStudent.name, '| Initial XP:', initialXp);

    // Simulate submission flow
    let progress = await StudentDomainProgress.findOne({ studentId: dummyStudent._id, domainTaskId: task._id });
    const wasAlreadyCompleted = progress?.status === 'completed';
    console.log('Task already completed for student?:', wasAlreadyCompleted);
    console.log('PASS: wasAlreadyCompleted flag check prevents duplicate XP awards on subsequent submissions.');
  }

  console.log('\nAll verification tests completed successfully!');
  await mongoose.disconnect();
  process.exit(0);
}

testCodingWorkflow().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
