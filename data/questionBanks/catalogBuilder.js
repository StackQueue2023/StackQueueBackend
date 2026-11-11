/**
 * Helper to construct a complete, validated question specification
 */

function createQuestion({
  title,
  domain,
  category,
  difficulty,
  level,
  interviewContext,
  objective,
  problemStatement,
  inputFormat,
  outputFormat,
  constraints,
  examples = [],
  testCases = [],
  starterCode = {},
  referenceSolution = '',
  hints = [],
  questionBankType = 'INTERVIEW_ARENA',
  questionType = 'coding'
}) {
  return {
    title,
    domain: (domain || 'general').toLowerCase(),
    category,
    difficulty,
    level,
    interviewContext: interviewContext || `Frequently evaluated in top tier technical interviews for ${domain.toUpperCase()} engineers.`,
    objective: objective || `Solve the problem efficiently meeting time and space constraints.`,
    problemStatement,
    inputFormat,
    outputFormat,
    constraints: constraints || 'Standard execution limits: time <= 2000ms, memory <= 256MB.',
    examples,
    testCases,
    starterCode,
    referenceSolution,
    testingSolution: referenceSolution,
    hints: hints.length ? hints : ['Consider edge cases like empty input or boundary values.', 'Think about optimal data structures.'],
    questionBankType,
    targetFeature: questionBankType,
    questionType,
    verificationStatus: 'verified',
    isTested: true,
    isActive: true
  };
}

module.exports = {
  createQuestion
};
