/**
 * STACK QUEUE — Centralized Question Uniqueness & Duplicate Detection Service
 * Validates question uniqueness across INTERVIEW_ARENA, MODULE, and MOCK_INTERVIEW question banks.
 */

function normalizeText(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .replace(/[^\w\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(str) {
  const norm = normalizeText(str);
  if (!norm) return new Set();
  const stopwords = new Set(['the', 'is', 'at', 'which', 'on', 'in', 'a', 'an', 'and', 'or', 'to', 'for', 'of', 'with', 'by']);
  const tokens = norm.split(' ').filter(w => w.length > 2 && !stopwords.has(w));
  return new Set(tokens);
}

function calculateJaccardSimilarity(setA, setB) {
  if (!setA.size || !setB.size) return 0;
  let intersectionCount = 0;
  for (const token of setA) {
    if (setB.has(token)) intersectionCount++;
  }
  const unionCount = setA.size + setB.size - intersectionCount;
  return unionCount === 0 ? 0 : intersectionCount / unionCount;
}

/**
 * Checks if a question uses the banned synthetic template
 * e.g. input "alpha" -> output "ALPHA", "sample data" -> "SAMPLE DATA"
 */
function isGenericTemplateQuestion(question) {
  if (!question) return false;

  const testCases = question.testCases || [];
  const examples = question.examples || [];

  const genericInputs = new Set(['alpha', 'sample data', 'beta test', 'edge-case-test', '123 test 456']);
  const genericOutputs = new Set(['ALPHA', 'SAMPLE DATA', 'BETA TEST', 'EDGE-CASE-TEST', '123 TEST 456']);

  for (const tc of testCases) {
    const input = (tc.input || '').trim().toLowerCase();
    const expected = (tc.expectedOutput || '').trim();
    if (genericInputs.has(input) && genericOutputs.has(expected)) {
      return true;
    }
  }

  for (const ex of examples) {
    const input = (ex.input || '').trim().toLowerCase();
    const output = (ex.output || '').trim();
    if (genericInputs.has(input) && genericOutputs.has(output)) {
      return true;
    }
  }

  const statement = (question.problemStatement || '').toLowerCase();
  if (statement.includes('in enterprise') && statement.includes('engineering, candidate understanding of') && statement.includes('is critical')) {
    return true;
  }

  return false;
}

/**
 * Validates candidate question against an array or set of existing questions.
 * Checks:
 * 1. Exact title match
 * 2. Exact problem statement match
 * 3. Normalized semantic similarity > 0.75
 * 4. Duplicate input/output pairs
 * 5. Generic template usage
 */
function validateQuestionUniqueness(candidate, existingList = []) {
  if (!candidate) {
    return { isUnique: false, reason: 'Candidate question is undefined.' };
  }

  // Check 1: Generic synthetic template prohibition
  if (isGenericTemplateQuestion(candidate)) {
    return {
      isUnique: false,
      reason: 'Rejected: Question matches generic template (alpha -> ALPHA).'
    };
  }

  const candTitleNorm = normalizeText(candidate.title || '');
  const candStatementTokens = tokenize(candidate.problemStatement || '');
  const candInput = normalizeText(candidate.examples?.[0]?.input || candidate.testCases?.[0]?.input || '');
  const candOutput = normalizeText(candidate.examples?.[0]?.output || candidate.testCases?.[0]?.expectedOutput || '');

  for (const existing of existingList) {
    if (!existing) continue;

    // Check same question (ignore self if updating)
    if (candidate._id && existing._id && candidate._id.toString() === existing._id.toString()) {
      continue;
    }

    // 2. Exact title comparison
    const existTitleNorm = normalizeText(existing.title || '');
    if (candTitleNorm && existTitleNorm && candTitleNorm === existTitleNorm) {
      return {
        isUnique: false,
        reason: `Duplicate title matched with question #${existing.questionNumber || existing._id}: "${existing.title}"`
      };
    }

    // 3. Jaccard token similarity on problem statement
    const existStatementTokens = tokenize(existing.problemStatement || '');
    const sim = calculateJaccardSimilarity(candStatementTokens, existStatementTokens);
    if (sim > 0.80) {
      return {
        isUnique: false,
        reason: `High semantic similarity (${Math.round(sim * 100)}%) with question #${existing.questionNumber || existing._id}: "${existing.title}"`
      };
    }

    // 4. Identical problem logic & input/output check
    const existInput = normalizeText(existing.examples?.[0]?.input || existing.testCases?.[0]?.input || '');
    const existOutput = normalizeText(existing.examples?.[0]?.output || existing.testCases?.[0]?.expectedOutput || '');
    if (candInput && existInput && candInput === existInput && candOutput === existOutput && sim > 0.60) {
      return {
        isUnique: false,
        reason: `Duplicate logic and identical test IO matched with question #${existing.questionNumber || existing._id}: "${existing.title}"`
      };
    }
  }

  return { isUnique: true };
}

module.exports = {
  normalizeText,
  tokenize,
  calculateJaccardSimilarity,
  isGenericTemplateQuestion,
  validateQuestionUniqueness
};
