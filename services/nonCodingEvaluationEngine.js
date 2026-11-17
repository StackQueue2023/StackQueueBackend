/**
 * STACK QUEUE — Dedicated Non-Coding & Hybrid Answer Evaluation Engine
 * 
 * Supports:
 * 1. Objective Validation (exact match + approved alternatives)
 * 2. Descriptive Semantic Evaluation (meaning, factual accuracy, mandatory concepts, completeness, rubric)
 * 3. Scenario-Based Evaluation (Problem Identification, Root Cause Reasoning, Remediation)
 * 4. Practical Workspace State Evaluation (via practicalValidationEngine)
 * 5. Subjective / Creative Rubric Evaluation (with automated confidence and instructor review queue)
 * 6. 6-Case Accuracy Test Battery Runner
 */

const { evaluatePracticalWorkspace } = require('./practicalValidationEngine');

// Common English stopwords for semantic text processing
const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
  'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were',
  'will', 'with', 'the', 'this', 'but', 'they', 'have', 'had', 'what', 'when',
  'where', 'who', 'which', 'why', 'how', 'all', 'any', 'both', 'each', 'few',
  'more', 'most', 'some', 'such', 'nor', 'too', 'very', 'can', 'just', 'should', 'now'
]);

// Negation terms that flip the meaning of a concept
const NEGATION_WORDS = new Set([
  'not', 'no', 'never', 'none', 'neither', 'nor', 'cannot', "can't", "won't",
  "doesn't", "don't", "isn't", "aren't", 'without', 'lacks', 'lacking', 'fails'
]);

/**
 * Normalizes text for robust semantic comparison
 */
function normalizeText(text = '') {
  return String(text || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Tokenizes text into meaningful content words (filtering stopwords)
 */
function extractContentTokens(text = '') {
  const norm = normalizeText(text);
  if (!norm) return [];
  return norm
    .split(' ')
    .filter(token => token.length > 1 && !STOPWORDS.has(token));
}

/**
 * Computes Jaccard / n-gram semantic overlap ratio between two strings
 */
function computeSemanticOverlap(strA = '', strB = '') {
  const tokensA = new Set(extractContentTokens(strA));
  const tokensB = new Set(extractContentTokens(strB));

  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let intersectionCount = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) {
      intersectionCount++;
    } else {
      // Check partial/stem match
      for (const tB of tokensB) {
        if (token.startsWith(tB) || tB.startsWith(token)) {
          intersectionCount += 0.8;
          break;
        }
      }
    }
  }

  const unionCount = tokensA.size + tokensB.size - intersectionCount;
  return unionCount > 0 ? Math.min(1.0, intersectionCount / unionCount) : 0;
}

function stemWord(w) {
  if (!w || w.length <= 3) return w;
  return w
    .replace(/(tions?|sions?|ments?|ables?|ibles?|ities?)$/i, '')
    .replace(/(ing|ed|es|ly|s)$/i, '')
    .replace(/(e|i|a)$/i, '');
}

function isWordMatch(tw, cw) {
  if (!tw || !cw) return false;
  if (tw === cw) return true;
  if (tw.startsWith(cw) || cw.startsWith(tw)) return true;
  const stemT = stemWord(tw);
  const stemC = stemWord(cw);
  if (stemT === stemC) return true;
  if (stemT.length >= 4 && stemC.length >= 4 && (stemT.startsWith(stemC) || stemC.startsWith(stemT))) return true;
  const minPrefix = Math.min(5, Math.min(tw.length, cw.length));
  if (minPrefix >= 5 && tw.slice(0, minPrefix) === cw.slice(0, minPrefix)) {
    if (Math.abs(tw.length - cw.length) <= 5) return true;
  }
  return false;
}

/**
 * Checks if a concept is present in the text and ensures it is NOT negated.
 */
function checkConceptWithNegation(text = '', concept = '') {
  const normText = normalizeText(text);
  const normConcept = normalizeText(concept);

  if (!normText || !normConcept) return { found: false, negated: false };

  // Direct phrase match
  const phraseIndex = normText.indexOf(normConcept);
  if (phraseIndex !== -1) {
    // Check preceding 4 words for negations
    const textBefore = normText.substring(Math.max(0, phraseIndex - 35), phraseIndex);
    const precedingTokens = textBefore.split(' ').filter(Boolean);
    const isNegated = precedingTokens.some(tok => NEGATION_WORDS.has(tok));
    return { found: true, negated: isNegated, matchedAs: normConcept };
  }

  // Token-level presence (all core concept words present)
  const conceptWords = extractContentTokens(normConcept);
  if (conceptWords.length === 0) return { found: false, negated: false };

  const normTokens = normText.split(' ').filter(Boolean);
  const allWordsPresent = conceptWords.every(cw => {
    return normTokens.some(tw => isWordMatch(tw, cw));
  });

  if (allWordsPresent) {
    let firstWordIndex = -1;
    for (const tw of normTokens) {
      if (isWordMatch(tw, conceptWords[0])) {
        firstWordIndex = normText.indexOf(tw);
        break;
      }
    }
    const textBefore = firstWordIndex > 0 ? normText.substring(Math.max(0, firstWordIndex - 35), firstWordIndex) : '';
    const isNegated = textBefore.split(' ').some(tok => NEGATION_WORDS.has(tok));
    return { found: true, negated: isNegated, matchedAs: conceptWords.join(' ') };
  }

  return { found: false, negated: false };
}

/**
 * ─────────────────────────────────────────────────────────────
 * METHOD 1: OBJECTIVE VALIDATION
 * ─────────────────────────────────────────────────────────────
 */
function evaluateObjective(submissionText = '', config = {}) {
  const normSub = normalizeText(submissionText);
  const expected = normalizeText(config.expectedAnswer || '');
  const acceptedAlternatives = (config.acceptedAlternatives || []).map(normalizeText);

  const maxMarks = Number(config.maxMarks) || 10;
  const isMatch = (normSub === expected) || acceptedAlternatives.some(alt => normSub === alt);

  if (isMatch) {
    return {
      status: 'Passed',
      isCorrect: true,
      marksAwarded: maxMarks,
      maxMarks,
      percentage: 100,
      feedback: 'Correct Answer! The submitted answer matches the approved objective specification.',
      missingConcepts: [],
      identifiedConcepts: [config.expectedAnswer],
      correctionGuidance: '',
      evaluationEvidence: {
        method: 'objective',
        matchedTarget: normSub === expected ? 'expectedAnswer' : 'acceptedAlternatives',
        rawMatch: true
      }
    };
  }

  return {
    status: 'Failed',
    isCorrect: false,
    marksAwarded: 0,
    maxMarks,
    percentage: 0,
    feedback: 'Incorrect Answer. The submitted answer does not match the approved solution.',
    missingConcepts: [config.expectedAnswer],
    identifiedConcepts: [],
    correctionGuidance: 'Please review the core definition and provide the exact terminology or approved answer.',
    evaluationEvidence: {
      method: 'objective',
      matchedTarget: null,
      rawMatch: false
    }
  };
}

/**
 * ─────────────────────────────────────────────────────────────
 * METHOD 2: DESCRIPTIVE SEMANTIC & CONCEPTUAL EVALUATION
 * ─────────────────────────────────────────────────────────────
 */
function evaluateDescriptive(submissionText = '', config = {}) {
  const maxMarks = Number(config.maxMarks) || 10;
  const passingThreshold = Number(config.passingThreshold) || 70;
  const rawText = String(submissionText || '').trim();

  // 1. Length & Empty Check
  if (!rawText) {
    return {
      status: 'Failed',
      isCorrect: false,
      marksAwarded: 0,
      maxMarks,
      percentage: 0,
      feedback: 'Submission is empty. Please provide a detailed response.',
      missingConcepts: config.mandatoryConcepts || [],
      identifiedConcepts: [],
      correctionGuidance: 'Write an explanation answering the question prompt.',
      evaluationEvidence: { reason: 'EMPTY_SUBMISSION' }
    };
  }

  const tokens = extractContentTokens(rawText);
  if (tokens.length < 3) {
    return {
      status: 'Failed',
      isCorrect: false,
      marksAwarded: 0,
      maxMarks,
      percentage: 10,
      feedback: 'Response is too brief to evaluate. Please provide a comprehensive explanation.',
      missingConcepts: config.mandatoryConcepts || [],
      identifiedConcepts: [],
      correctionGuidance: 'Elaborate on the key mechanisms, definitions, and operational principles.',
      evaluationEvidence: { reason: 'TOO_BRIEF', tokenCount: tokens.length }
    };
  }

  // 2. Anti-Gaming Fluff & Gibberish Detection
  const uniqueTokens = new Set(tokens);
  const lexicalDiversity = uniqueTokens.size / tokens.length;
  if (tokens.length > 25 && lexicalDiversity < 0.25) {
    return {
      status: 'Failed',
      isCorrect: false,
      marksAwarded: 0,
      maxMarks,
      percentage: 0,
      feedback: 'Answer contains excessive repetition without substantive conceptual explanations.',
      missingConcepts: config.mandatoryConcepts || [],
      identifiedConcepts: [],
      correctionGuidance: 'Provide a structured, authentic explanation instead of repeating phrases.',
      evaluationEvidence: { reason: 'LOW_LEXICAL_DIVERSITY', lexicalDiversity }
    };
  }

  // 3. Negative Concepts / Misconceptions Filter
  const negativeConcepts = config.negativeConcepts || [];
  const foundNegative = [];
  for (const nc of negativeConcepts) {
    const res = checkConceptWithNegation(rawText, nc);
    if (res.found && !res.negated) {
      foundNegative.push(nc);
    }
  }

  // 4. Mandatory Concepts Verification
  const mandatoryConcepts = config.mandatoryConcepts || [];
  const identifiedConcepts = [];
  const missingConcepts = [];
  const negatedConcepts = [];

  for (const mc of mandatoryConcepts) {
    let res = checkConceptWithNegation(rawText, mc);
    if (!res.found && config.contextFallbackText) {
      const fallbackRes = checkConceptWithNegation(config.contextFallbackText, mc);
      if (fallbackRes.found) {
        res = fallbackRes;
      }
    }
    if (res.found && !res.negated) {
      identifiedConcepts.push(mc);
    } else {
      missingConcepts.push(mc);
      if (res.negated) {
        negatedConcepts.push(mc);
      }
    }
  }

  const conceptCoverageRatio = mandatoryConcepts.length > 0
    ? (identifiedConcepts.length / mandatoryConcepts.length)
    : 1.0;

  // 5. Semantic Intent & Meaning Overlap
  const expectedText = config.expectedAnswer || '';
  const overlapWithExpected = computeSemanticOverlap(rawText, expectedText);

  let bestAltOverlap = 0;
  for (const alt of (config.acceptedAlternatives || [])) {
    const o = computeSemanticOverlap(rawText, alt);
    if (o > bestAltOverlap) bestAltOverlap = o;
  }
  const semanticScore = Math.max(overlapWithExpected, bestAltOverlap);

  // If answer semantically aligns with an approved alternative or canonical definition without negations, recognize alternative wording
  const isAlternativeMatch = (
    (semanticScore >= 0.28 || bestAltOverlap >= 0.20) &&
    negatedConcepts.length === 0 &&
    foundNegative.length === 0
  );
  if (isAlternativeMatch && (identifiedConcepts.length >= Math.ceil(mandatoryConcepts.length * 0.5) || semanticScore >= 0.30)) {
    missingConcepts.length = 0;
  }

  const effectiveConceptRatio = isAlternativeMatch
    ? Math.max(conceptCoverageRatio, 0.95)
    : (negatedConcepts.length > 0 ? 0 : conceptCoverageRatio);

  // 6. Rubric Scoring Breakdown
  const rubrics = (config.evaluationRubric && config.evaluationRubric.length > 0)
    ? config.evaluationRubric
    : [
        { criterion: 'Conceptual Understanding & Mandatory Concepts', weight: 0.5, maxScore: 50 },
        { criterion: 'Semantic Accuracy & Completeness', weight: 0.3, maxScore: 30 },
        { criterion: 'Clarity & Correct Terminology', weight: 0.2, maxScore: 20 }
      ];

  let rubricScores = [];
  let totalRubricPoints = 0;
  let maxRubricPoints = 0;

  // Calculate rubric points
  rubrics.forEach((r, idx) => {
    const rMax = r.maxScore || 10;
    maxRubricPoints += rMax;
    let earned = 0;

    if (idx === 0) {
      earned = Math.round(rMax * effectiveConceptRatio);
    } else if (idx === 1) {
      // Scale semantic score (0.35+ is a strong natural language match)
      const scaledSemantic = Math.min(1.0, semanticScore * 2.2);
      earned = Math.round(rMax * scaledSemantic);
    } else {
      // General clarity & absence of misconceptions
      const clarityRatio = foundNegative.length > 0 ? 0.2 : (tokens.length >= 8 ? 0.95 : 0.5);
      earned = Math.round(rMax * clarityRatio);
    }

    rubricScores.push({
      criterion: r.criterion,
      earned,
      maxScore: rMax,
      notes: r.description || ''
    });
    totalRubricPoints += earned;
  });

  // Calculate final percentage score
  let percentage = maxRubricPoints > 0 ? Math.round((totalRubricPoints / maxRubricPoints) * 100) : 0;

  // Severe penalty if negative concepts / misconceptions present
  if (foundNegative.length > 0) {
    percentage = Math.max(0, percentage - (foundNegative.length * 25));
  }
  if (negatedConcepts.length > 0) {
    percentage = Math.max(0, percentage - (negatedConcepts.length * 30));
  }

  const marksAwarded = Math.round((percentage / 100) * maxMarks * 10) / 10;

  // 7. Status Determination
  let status = 'Failed';
  const isPassedScore = percentage >= passingThreshold;
  const allMandatoryCovered = (missingConcepts.length === 0);

  if (config.reviewMode === 'instructor_review') {
    status = 'Instructor Review Required';
  } else if (isPassedScore && allMandatoryCovered && foundNegative.length === 0) {
    status = 'Passed';
  } else if (percentage >= 40) {
    status = 'Partially Correct';
  } else if (percentage >= (passingThreshold - 10) && config.reviewMode === 'hybrid_uncertain') {
    status = 'Instructor Review Required';
  } else {
    status = 'Failed';
  }

  // Constructive feedback and guidance
  let feedback = '';
  let correctionGuidance = '';

  if (status === 'Passed') {
    feedback = 'Passed! Your explanation demonstrates accurate conceptual understanding, factual correctness, and covers all mandatory principles.';
  } else if (status === 'Partially Correct') {
    feedback = `Partially Correct (${percentage}%). Your response captures some key ideas but is missing critical concepts or precision.`;
    if (missingConcepts.length > 0) {
      correctionGuidance = `To achieve full marks, address: ${missingConcepts.join(', ')}.`;
    }
    if (foundNegative.length > 0) {
      correctionGuidance += ` Clarify the misconception regarding: ${foundNegative.join(', ')}.`;
    }
  } else if (status === 'Instructor Review Required') {
    feedback = 'Submitted for Instructor Review. Your response has been queued for evaluation by course staff.';
    correctionGuidance = 'Staff will review your reasoning and update your marks shortly.';
  } else {
    feedback = 'Answer Did Not Pass. The explanation does not adequately demonstrate understanding of the required concepts.';
    if (missingConcepts.length > 0) {
      correctionGuidance = `Key missing concepts to cover: ${missingConcepts.join(', ')}.`;
    }
  }

  return {
    status,
    isCorrect: (status === 'Passed'),
    marksAwarded,
    maxMarks,
    percentage,
    feedback,
    missingConcepts,
    identifiedConcepts,
    foundNegative,
    correctionGuidance,
    evaluationEvidence: {
      method: 'descriptive',
      conceptCoverageRatio,
      semanticScore,
      rubricScores,
      foundNegative,
      passingThreshold
    }
  };
}

/**
 * ─────────────────────────────────────────────────────────────
 * METHOD 3: SCENARIO-BASED 3-TIER EVALUATION
 * (Problem Identification, Root Cause Reasoning, Proposed Solution)
 * ─────────────────────────────────────────────────────────────
 */
function evaluateScenario(submissionData, config = {}) {
  const maxMarks = Number(config.maxMarks) || 15;
  const passingThreshold = Number(config.passingThreshold) || 70;

  let textProb = '';
  let textReason = '';
  let textSol = '';

  if (typeof submissionData === 'object' && submissionData !== null) {
    textProb = submissionData.problemIdentification || '';
    textReason = submissionData.reasoning || '';
    textSol = submissionData.proposedSolution || '';
  } else {
    const raw = String(submissionData || '').trim();
    // Composite text: evaluate across full text
    textProb = raw;
    textReason = raw;
    textSol = raw;
  }

  const mandatoryProb = config.mandatoryConceptsProblem || config.mandatoryConcepts || [];
  const mandatoryReason = config.mandatoryConceptsReasoning || [];
  const mandatorySol = config.mandatoryConceptsSolution || config.requiredOutcomes || [];

  const fullContextText = [textProb, textReason, textSol].filter(Boolean).join(' ');

  // Evaluate Tier 1: Problem Identification (30% weight)
  const evalProb = evaluateDescriptive(textProb, {
    expectedAnswer: config.expectedProblem || config.expectedAnswer,
    mandatoryConcepts: mandatoryProb,
    maxMarks: 30,
    passingThreshold: 60,
    contextFallbackText: fullContextText
  });

  // Evaluate Tier 2: Root Cause Reasoning (35% weight)
  const evalReason = evaluateDescriptive(textReason, {
    expectedAnswer: config.expectedReasoning || config.explanation,
    mandatoryConcepts: mandatoryReason,
    maxMarks: 35,
    passingThreshold: 60,
    contextFallbackText: fullContextText
  });

  // Evaluate Tier 3: Proposed Solution / Remediation (35% weight)
  const evalSol = evaluateDescriptive(textSol, {
    expectedAnswer: config.expectedSolution || config.expectedAnswer,
    mandatoryConcepts: mandatorySol,
    maxMarks: 35,
    passingThreshold: 60,
    contextFallbackText: fullContextText
  });

  const totalScore100 = Math.round(
    (evalProb.percentage * 0.3) +
    (evalReason.percentage * 0.35) +
    (evalSol.percentage * 0.35)
  );

  const marksAwarded = Math.round((totalScore100 / 100) * maxMarks * 10) / 10;
  const missingAll = [
    ...evalProb.missingConcepts.map(c => `[Problem] ${c}`),
    ...evalReason.missingConcepts.map(c => `[Reasoning] ${c}`),
    ...evalSol.missingConcepts.map(c => `[Solution] ${c}`)
  ];

  const identifiedAll = [
    ...evalProb.identifiedConcepts,
    ...evalReason.identifiedConcepts,
    ...evalSol.identifiedConcepts
  ];

  let status = 'Failed';
  if (totalScore100 >= passingThreshold && missingAll.length === 0) {
    status = 'Passed';
  } else if (totalScore100 >= 40) {
    status = 'Partially Correct';
  } else {
    status = 'Failed';
  }

  return {
    status,
    isCorrect: (status === 'Passed'),
    marksAwarded,
    maxMarks,
    percentage: totalScore100,
    feedback: status === 'Passed'
      ? 'Scenario Solution Approved: Accurate root cause identification, coherent technical reasoning, and viable remediation strategy.'
      : (status === 'Partially Correct'
        ? `Scenario Partially Solved (${totalScore100}%). Review the missing components below.`
        : 'Scenario Incomplete or Incorrect. Ensure you identify the root issue, explain why it happened, and propose a concrete resolution.'),
    missingConcepts: missingAll,
    identifiedConcepts: identifiedAll,
    correctionGuidance: missingAll.length > 0 ? `Refine the following requirements: ${missingAll.join('; ')}` : '',
    evaluationEvidence: {
      method: 'scenario',
      problemIdentification: { score: evalProb.percentage, missing: evalProb.missingConcepts },
      reasoning: { score: evalReason.percentage, missing: evalReason.missingConcepts },
      proposedSolution: { score: evalSol.percentage, missing: evalSol.missingConcepts }
    }
  };
}

/**
 * ─────────────────────────────────────────────────────────────
 * METHOD 4: MASTER NON-CODING DISPATCHER
 * ─────────────────────────────────────────────────────────────
 */
function evaluateNonCodingQuestion(submission, questionConfig) {
  const method = (
    questionConfig.evaluationMethod ||
    questionConfig.questionType ||
    'descriptive'
  ).toLowerCase();

  if (method === 'objective' || method === 'mcq') {
    const text = typeof submission === 'string' ? submission : (submission?.answer || submission?.selectedOption);
    return evaluateObjective(text, questionConfig);
  }

  if (method === 'scenario') {
    return evaluateScenario(submission, questionConfig);
  }

  if (method === 'practical') {
    const stateData = typeof submission === 'object' && submission !== null ? (submission.stateData || submission) : {};
    const evalRes = evaluatePracticalWorkspace(questionConfig.environmentType, stateData, questionConfig.rubric);
    const maxMarks = Number(questionConfig.maxMarks) || 20;
    const marksAwarded = evalRes.passed ? maxMarks : Math.round((evalRes.score / 100) * maxMarks);

    return {
      status: evalRes.passed ? 'Passed' : (evalRes.score >= 40 ? 'Partially Correct' : 'Failed'),
      isCorrect: evalRes.passed,
      marksAwarded,
      maxMarks,
      percentage: evalRes.score,
      feedback: evalRes.feedback,
      missingConcepts: evalRes.checks ? evalRes.checks.filter(c => !c.passed).map(c => c.criterion) : [],
      identifiedConcepts: evalRes.checks ? evalRes.checks.filter(c => c.passed).map(c => c.criterion) : [],
      correctionGuidance: evalRes.passed ? '' : 'Adjust your workspace parameters to satisfy all rubric checks.',
      evaluationEvidence: {
        method: 'practical',
        checks: evalRes.checks,
        score: evalRes.score
      }
    };
  }

  // Default: Descriptive semantic & conceptual evaluation
  const submissionText = typeof submission === 'string' ? submission : (submission?.answer || submission?.submittedAnswer || '');
  return evaluateDescriptive(submissionText, questionConfig);
}

/**
 * ─────────────────────────────────────────────────────────────
 * SECTION G: 6-CASE ACCURACY TEST BATTERY RUNNER
 * Verifies evaluation engine behavior before question publishing
 * ─────────────────────────────────────────────────────────────
 */
function runAccuracyTestBattery(questionConfig) {
  const results = {
    testDate: new Date().toISOString(),
    casesPassed: 0,
    totalCases: 6,
    allPassed: false,
    cases: []
  };

  const expected = questionConfig.expectedAnswer || 'Asymmetric encryption uses a public key for encryption and a private key for decryption.';
  const mandatory = questionConfig.mandatoryConcepts || ['asymmetric encryption', 'public key', 'private key'];

  // Case 1: Exact canonical correct answer -> Must PASS
  const case1Res = evaluateNonCodingQuestion(expected, questionConfig);
  const case1Passed = (case1Res.status === 'Passed');
  results.cases.push({
    testCase: '1. Canonical Correct Answer',
    input: expected,
    expectedStatus: 'Passed',
    actualStatus: case1Res.status,
    passed: case1Passed,
    score: case1Res.percentage
  });
  if (case1Passed) results.casesPassed++;

  // Case 2: Differently worded but correct answer -> Must PASS
  const case2Input = `In this system, two distinct cryptographic keys are utilized. One key, termed the public key, performs the data encryption, whereas the confidential private key alone can decrypt the resulting ciphertext.`;
  const case2Res = evaluateNonCodingQuestion(case2Input, questionConfig);
  const case2Passed = (case2Res.status === 'Passed' || case2Res.percentage >= (questionConfig.passingThreshold || 70));
  results.cases.push({
    testCase: '2. Differently Worded Correct Answer',
    input: case2Input,
    expectedStatus: 'Passed',
    actualStatus: case2Res.status,
    passed: case2Passed,
    score: case2Res.percentage
  });
  if (case2Passed) results.casesPassed++;

  // Case 3: Partially correct answer (missing private key) -> Must be PARTIALLY CORRECT
  const case3Input = `The encryption relies on public keys to secure messages sent over the web network.`;
  const case3Res = evaluateNonCodingQuestion(case3Input, questionConfig);
  const case3Passed = (case3Res.status === 'Partially Correct' || (case3Res.percentage >= 30 && case3Res.percentage < 70));
  results.cases.push({
    testCase: '3. Partially Correct Answer',
    input: case3Input,
    expectedStatus: 'Partially Correct',
    actualStatus: case3Res.status,
    passed: case3Passed,
    score: case3Res.percentage
  });
  if (case3Passed) results.casesPassed++;

  // Case 4: Completely incorrect answer -> Must FAIL
  const case4Input = `Data is sorted into alphabetical order using a quicksort partitioning algorithm.`;
  const case4Res = evaluateNonCodingQuestion(case4Input, questionConfig);
  const case4Passed = (case4Res.status === 'Failed' && case4Res.percentage < 30);
  results.cases.push({
    testCase: '4. Incorrect Answer',
    input: case4Input,
    expectedStatus: 'Failed',
    actualStatus: case4Res.status,
    passed: case4Passed,
    score: case4Res.percentage
  });
  if (case4Passed) results.casesPassed++;

  // Case 5: Irrelevant / Gibberish long answer (Anti-fluff) -> Must FAIL
  const case5Input = `This concept is very very important in computer science. The user should always remember to do this properly because doing it properly gives optimal results and great efficiency across all enterprise workloads and digital platforms.`;
  const case5Res = evaluateNonCodingQuestion(case5Input, questionConfig);
  const case5Passed = (case5Res.status === 'Failed');
  results.cases.push({
    testCase: '5. Long Irrelevant / Fluff Answer',
    input: case5Input,
    expectedStatus: 'Failed',
    actualStatus: case5Res.status,
    passed: case5Passed,
    score: case5Res.percentage
  });
  if (case5Passed) results.casesPassed++;

  // Case 6: Ambiguous / Negated answer -> Must NOT Pass (Failed or Partially Correct or Review Required)
  const case6Input = `It is not an asymmetric encryption algorithm and does not use public key or private key mechanisms.`;
  const case6Res = evaluateNonCodingQuestion(case6Input, questionConfig);
  const case6Passed = (case6Res.status !== 'Passed');
  results.cases.push({
    testCase: '6. Ambiguous / Negated Assertion Answer',
    input: case6Input,
    expectedStatus: 'Failed or Review Required',
    actualStatus: case6Res.status,
    passed: case6Passed,
    score: case6Res.percentage
  });
  if (case6Passed) results.casesPassed++;

  results.allPassed = (results.casesPassed === results.totalCases);
  return results;
}

module.exports = {
  evaluateNonCodingQuestion,
  evaluateObjective,
  evaluateDescriptive,
  evaluateScenario,
  runAccuracyTestBattery,
  computeSemanticOverlap,
  checkConceptWithNegation
};
