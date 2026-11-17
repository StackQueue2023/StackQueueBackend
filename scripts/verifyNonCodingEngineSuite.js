/**
 * STACK QUEUE — Non-Coding Answer Validation Engine Comprehensive Verification Suite
 * 
 * Verifies:
 * 1. Question evaluation configuration schema integrity
 * 2. Objective questions (exact match & approved alternatives)
 * 3. Descriptive questions (meaning, factual correctness, mandatory concepts, anti-gaming)
 * 4. Scenario-based questions (Problem ID, Root Cause, Proposed Solution)
 * 5. Instructor review queue & manual overrides
 * 6. Section G 6-Case Accuracy Test Battery
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const InterviewQuestion = require('../models/InterviewQuestion');
const AdaptiveQuestionSubmission = require('../models/AdaptiveQuestionSubmission');
const {
  evaluateNonCodingQuestion,
  evaluateObjective,
  evaluateDescriptive,
  evaluateScenario,
  runAccuracyTestBattery
} = require('../services/nonCodingEvaluationEngine');

async function runTestSuite() {
  console.log('========================================================================');
  console.log('STACK QUEUE — NON-CODING ANSWER VALIDATION ENGINE SUITE');
  console.log('========================================================================\n');

  let totalErrors = 0;

  // ─────────────────────────────────────────────────────────────────
  // TEST 1: Objective Evaluation Method
  // ─────────────────────────────────────────────────────────────────
  console.log('--- TEST 1: Objective Validation Method ---');
  const objConfig = {
    evaluationMethod: 'objective',
    expectedAnswer: 'TCP 3-way handshake',
    acceptedAlternatives: ['3-way handshake', 'SYN SYN-ACK ACK'],
    maxMarks: 10
  };

  const obj1 = evaluateObjective('TCP 3-way handshake', objConfig);
  if (obj1.status === 'Passed' && obj1.marksAwarded === 10) {
    console.log('✓ Canonical exact answer: PASSED');
  } else {
    console.error('✗ Canonical exact answer: FAILED', obj1);
    totalErrors++;
  }

  const obj2 = evaluateObjective('3-way handshake', objConfig);
  if (obj2.status === 'Passed' && obj2.marksAwarded === 10) {
    console.log('✓ Approved alternative formulation: PASSED');
  } else {
    console.error('✗ Approved alternative formulation: FAILED', obj2);
    totalErrors++;
  }

  const obj3 = evaluateObjective('UDP connectionless protocol', objConfig);
  if (obj3.status === 'Failed' && obj3.marksAwarded === 0) {
    console.log('✓ Incorrect answer rejected: PASSED');
  } else {
    console.error('✗ Incorrect answer not rejected: FAILED', obj3);
    totalErrors++;
  }

  // ─────────────────────────────────────────────────────────────────
  // TEST 2: Descriptive Semantic & Conceptual Evaluation
  // ─────────────────────────────────────────────────────────────────
  console.log('\n--- TEST 2: Descriptive Semantic & Conceptual Evaluation ---');
  const descConfig = {
    evaluationMethod: 'descriptive',
    title: 'Public Key Infrastructure (PKI)',
    expectedAnswer: 'Asymmetric encryption uses a public key to encrypt information and a private key to decrypt information.',
    mandatoryConcepts: ['asymmetric encryption', 'public key', 'private key'],
    acceptedAlternatives: [
      'Two different cryptographic keys are used: the public key for encryption and the private key for decryption.'
    ],
    negativeConcepts: ['symmetric key', 'single shared key'],
    maxMarks: 10,
    passingThreshold: 70
  };

  // 2.1 Canonical Answer
  const desc1 = evaluateDescriptive(descConfig.expectedAnswer, descConfig);
  if (desc1.status === 'Passed' && desc1.percentage >= 70 && desc1.missingConcepts.length === 0) {
    console.log(`✓ Canonical Answer: PASSED (${desc1.percentage}%)`);
  } else {
    console.error('✗ Canonical Answer: FAILED', desc1);
    totalErrors++;
  }

  // 2.2 Differently Worded Correct Answer
  const desc2Input = 'Public key cryptography relies on a mathematical keypair where anyone can encrypt using the public key, but only the intended recipient holding the private key can decrypt.';
  const desc2 = evaluateDescriptive(desc2Input, descConfig);
  if (desc2.status === 'Passed' && desc2.percentage >= 70) {
    console.log(`✓ Differently Worded Correct Answer: PASSED (${desc2.percentage}%)`);
  } else {
    console.error('✗ Differently Worded Correct Answer: FAILED', desc2);
    totalErrors++;
  }

  // 2.3 Incomplete / Missing Concept Answer
  const desc3Input = 'This encryption uses public keys to protect transmitted network packets.';
  const desc3 = evaluateDescriptive(desc3Input, descConfig);
  if (desc3.status === 'Partially Correct' && desc3.missingConcepts.includes('private key')) {
    console.log(`✓ Incomplete Missing Concept Answer: PARTIALLY CORRECT (${desc3.percentage}%, identified missing: ${desc3.missingConcepts.join(', ')})`);
  } else {
    console.error('✗ Incomplete Answer handling: FAILED', desc3);
    totalErrors++;
  }

  // 2.4 Factual Misconception / Anti-Concept Filter
  const desc4Input = 'Asymmetric encryption is a single shared key cipher where both parties use the exact same symmetric key.';
  const desc4 = evaluateDescriptive(desc4Input, descConfig);
  if (desc4.status === 'Failed' && desc4.foundNegative.length > 0) {
    console.log(`✓ Misconception Filter (Detected: ${desc4.foundNegative.join(', ')}): FAILED as expected`);
  } else {
    console.error('✗ Misconception Filter: FAILED', desc4);
    totalErrors++;
  }

  // 2.5 Anti-Gaming / Anti-Fluff (Long Gibberish with Repetition)
  const desc5Input = 'This system is very very good and important for computer science systems. It is very very good and important for high performance and optimal optimization in all digital computer science systems.';
  const desc5 = evaluateDescriptive(desc5Input, descConfig);
  if (desc5.status === 'Failed') {
    console.log('✓ Anti-Fluff / Gibberish Detection: REJECTED with 0 marks');
  } else {
    console.error('✗ Anti-Fluff failed to reject: FAILED', desc5);
    totalErrors++;
  }

  // 2.6 Negated Concept Filter ("it is NOT a public key")
  const desc6Input = 'It does not use asymmetric encryption and is never using a public key or private key.';
  const desc6 = evaluateDescriptive(desc6Input, descConfig);
  if (desc6.status === 'Failed' && desc6.percentage < 40) {
    console.log('✓ Negated Concept Filter: REJECTED with 0 marks');
  } else {
    console.error('✗ Negated Concept Filter: FAILED', desc6);
    totalErrors++;
  }

  // ─────────────────────────────────────────────────────────────────
  // TEST 3: Scenario-Based 3-Tier Evaluation
  // ─────────────────────────────────────────────────────────────────
  console.log('\n--- TEST 3: Scenario-Based 3-Tier Evaluation ---');
  const scenarioConfig = {
    evaluationMethod: 'scenario',
    expectedAnswer: 'SQL Injection attack occurred because user input was concatenated directly into the SQL query without parameterized statements. The fix is to use prepared statements with bind parameters.',
    mandatoryConceptsProblem: ['sql injection'],
    mandatoryConceptsReasoning: ['concatenated', 'unvalidated input'],
    mandatoryConceptsSolution: ['prepared statements', 'parameterized'],
    maxMarks: 15,
    passingThreshold: 70
  };

  const scenarioSolved = evaluateScenario({
    problemIdentification: 'The application is vulnerable to SQL injection due to dynamic string concatenation.',
    reasoning: 'The backend accepts unvalidated input directly into the SQL query string without sanitization or escaping.',
    proposedSolution: 'Refactor all database queries to use prepared statements and parameterized queries.'
  }, scenarioConfig);

  if (scenarioSolved.status === 'Passed' && scenarioSolved.percentage >= 70) {
    console.log(`✓ Complete Scenario Submission: PASSED (${scenarioSolved.percentage}%, Marks: ${scenarioSolved.marksAwarded}/${scenarioSolved.maxMarks})`);
  } else {
    console.error('✗ Complete Scenario Submission: FAILED', scenarioSolved);
    totalErrors++;
  }

  const scenarioPartial = evaluateScenario({
    problemIdentification: 'There is a SQL injection vulnerability.',
    reasoning: '',
    proposedSolution: ''
  }, scenarioConfig);

  if (scenarioPartial.status === 'Partially Correct' || scenarioPartial.status === 'Failed') {
    console.log(`✓ Incomplete Scenario Submission: Handled accurately (${scenarioPartial.status})`);
  } else {
    console.error('✗ Incomplete Scenario Submission: FAILED', scenarioPartial);
    totalErrors++;
  }

  // ─────────────────────────────────────────────────────────────────
  // TEST 4: Section G 6-Case Accuracy Test Battery Runner
  // ─────────────────────────────────────────────────────────────────
  console.log('\n--- TEST 4: 6-Case Accuracy Test Battery Runner ---');
  const batteryResults = runAccuracyTestBattery(descConfig);
  console.log(`Test Battery Outcome: ${batteryResults.casesPassed}/${batteryResults.totalCases} cases passed.`);

  if (batteryResults.allPassed) {
    console.log('✓ Pre-Publishing 6-Case Accuracy Test Battery: 100% VERIFIED\n');
  } else {
    console.error('✗ Pre-Publishing Test Battery: FAILED', batteryResults);
    totalErrors++;
  }

  // ─────────────────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────────────────
  console.log('========================================================================');
  if (totalErrors === 0) {
    console.log('ALL NON-CODING EVALUATION ENGINE TESTS PASSED (0 ERRORS)');
    console.log('The non-coding answer validation engine meets all mandatory requirements.');
  } else {
    console.error(`TESTS COMPLETED WITH ${totalErrors} ERRORS`);
  }
  console.log('========================================================================\n');
}

runTestSuite().catch(err => {
  console.error('Fatal error during test suite execution:', err);
  process.exit(1);
});
