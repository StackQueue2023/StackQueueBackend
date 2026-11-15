const mongoose = require('mongoose');
const Course = require('../models/Course');
const Module = require('../models/Module');
const DomainTask = require('../models/DomainTask');
const InterviewQuestion = require('../models/InterviewQuestion');
const InterviewTestCase = require('../models/InterviewTestCase');
const Challenge = require('../models/Challenge');
const QuestionRegistry = require('../models/QuestionRegistry');
const SyllabusGenerationJob = require('../models/SyllabusGenerationJob');
const InterviewSubmission = require('../models/InterviewSubmission');
const StudentDomainProgress = require('../models/StudentDomainProgress');
const { generateFingerprint, normalizeQuestionText } = require('./questionRegistryService');
const { evaluateCode } = require('./interviewCodeRunner');
const { generateQuestionSpec } = require('./questionSpecificationEngine');
const { analyzeModuleScope, buildTopicId, computeModuleSignature } = require('./moduleScopeEngine');
const { allocateQuestionNumbers } = require('./questionNumberAllocator');
const { validateGeneratedQuestion } = require('./questionValidationService');
const { extractCourseSyllabusTopics } = require('./syllabusTopicExtractorService');
const {
  detectTechnology,
  detectIntegrationChallenge,
  getStarterCodeForTechnology
} = require('./technologyDetectionEngine');

/**
 * Normalizes domain strings to clean lowercase keys
 */
function normalizeDomainKey(str) {
  if (!str) return 'general';
  const s = String(str).toLowerCase().trim();
  if (s.includes('java') && !s.includes('javascript')) return 'java';
  if (s.includes('python')) return 'python';
  if (s.includes('cpp') || s.includes('c++')) return 'cpp';
  if (s.includes('react') || s.includes('mern') || s.includes('javascript') || s.includes('js') || s.includes('frontend')) return 'react';
  if (s.includes('data') && s.includes('science')) return 'datascience';
  if (s.includes('devops') || s.includes('cloud')) return 'devops';
  if (s.includes('sql') || s.includes('database')) return 'sql';
  return s.replace(/[^a-z0-9]/g, '');
}

/**
 * Determines primary programming language for domain
 */
function getLanguageForDomain(domainKey) {
  switch (domainKey) {
    case 'java': return 'java';
    case 'python':
    case 'datascience': return 'python';
    case 'cpp': return 'cpp';
    case 'react':
    case 'javascript':
    case 'frontend': return 'javascript';
    default: return 'javascript';
  }
}

/**
 * Global synchronized Question Number Sequence Generator (Atomic & Concurrency-Safe)
 */
async function getNextQNumberBatch(count) {
  return allocateQuestionNumbers(count);
}

/**
 * Helper to build valid, strictly module-scoped code templates and test cases.
 */
function buildQuestionContentForTopic(topic, moduleTitle, courseTitle, domainKey, index, difficulty, scope = null) {
  const detectedTech = detectTechnology({ topic, moduleTitle, courseTitle, domainKey });
  const integrationInfo = detectIntegrationChallenge(topic, moduleTitle, domainKey);

  const effectiveTechnology = scope?.technology || (integrationInfo.isIntegration ? integrationInfo.technology : detectedTech.name);
  const effectiveLang = scope?.language || detectedTech.language || getLanguageForDomain(domainKey);
  const effectiveCompiler = scope?.compiler || detectedTech.compiler;
  const effectiveEvaluationMethod = detectedTech.evaluationMethod || 'coding';

  const spec = generateQuestionSpec({
    title: `${topic} (${difficulty || 'Easy'})`,
    topic,
    moduleTitle,
    moduleDescription: scope?.moduleDescription || '',
    moduleTopics: scope?.topics || [],
    primaryCategories: scope?.primaryCategories || [],
    courseTitle,
    domain: domainKey,
    taskIndex: (index || 0) + 1,
    variationIndex: index || 0,
    difficulty: difficulty || 'Easy'
  });

  const starterCodeStr = (spec.starterCode && spec.starterCode.trim().length > 10)
    ? spec.starterCode
    : getStarterCodeForTechnology(effectiveTechnology, effectiveLang, topic);

  const visibleTestCases = spec.testCases.filter(tc => !tc.isHidden);
  const hiddenTestCases = spec.testCases.filter(tc => tc.isHidden);

  return {
    lang: effectiveLang,
    technology: effectiveTechnology,
    compiler: effectiveCompiler,
    compilerId: detectedTech.compilerId,
    evaluationMethod: effectiveEvaluationMethod,
    category: detectedTech.category,
    categoryKey: spec.categoryKey,
    questionType: spec.questionType || 'coding',
    titleSuffix: spec.titleSuffix,
    isIntegration: integrationInfo.isIntegration,
    description: spec.problemStatement.split('\n\n')[1] || spec.problemStatement,
    starterCode: { [effectiveLang]: starterCodeStr },
    starterCodeStr,
    referenceSolution: spec.referenceSolution,
    inputFormat: spec.inputFormat,
    outputFormat: spec.outputFormat,
    constraints: spec.constraints,
    sampleInput: spec.sampleInput,
    sampleOutput: spec.sampleOutput,
    sampleInput2: spec.sampleInput2,
    sampleOutput2: spec.sampleOutput2,
    explanation: spec.explanation,
    examples: [
      { input: spec.sampleInput, output: spec.sampleOutput, explanation: spec.explanation },
      { input: spec.sampleInput2, output: spec.sampleOutput2, explanation: spec.testCases[1]?.explanation || 'Secondary execution branch.' }
    ],
    visibleTestCases: visibleTestCases.length > 0 ? visibleTestCases : spec.testCases.slice(0, 2),
    hiddenTestCases: hiddenTestCases.length > 0 ? hiddenTestCases : spec.testCases.slice(2),
    testCases: spec.testCases
  };
}

/**
 * Generates and strictly validates a question candidate against all 5 module-scope rules.
 * Rejects & retries with next variation if any rule fails.
 */
async function buildValidatedContentForTopic({
  topic,
  mod,
  scope,
  courseTitle,
  domainKey,
  baseIndex = 0,
  difficulty = 'Easy',
  runSandbox = true,
  existingFingerprints = null
}) {
  const maxAttempts = 6;
  let lastReason = '';

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const content = buildQuestionContentForTopic(
      topic,
      mod.title,
      courseTitle,
      domainKey,
      baseIndex + attempt,
      difficulty,
      scope
    );

    const candidateTitle = `${topic} — ${content.titleSuffix}`;
    const candidate = {
      title: candidateTitle,
      categoryKey: content.categoryKey,
      problemStatement: content.description,
      inputFormat: content.inputFormat,
      outputFormat: content.outputFormat,
      referenceSolution: content.referenceSolution,
      testCases: content.testCases,
      fingerprint: generateFingerprint(candidateTitle, content.description, mod.title, domainKey)
    };

    const validation = await validateGeneratedQuestion({
      question: candidate,
      scope,
      runSandbox,
      existingFingerprints
    });

    if (validation.valid) {
      if (existingFingerprints && candidate.fingerprint) {
        existingFingerprints.add(candidate.fingerprint);
      }
      return { content, validation, rejectedReasons: [] };
    }

    lastReason = validation.reason;
    console.warn(`[QuestionValidator] REJECTED attempt ${attempt + 1} for Module ${mod.order} (${mod.title}) / "${topic}": ${lastReason}`);
  }

  // Return last attempt marked flagged if all retries failed
  const fallbackContent = buildQuestionContentForTopic(topic, mod.title, courseTitle, domainKey, baseIndex, difficulty, scope);
  return {
    content: fallbackContent,
    validation: { valid: false, reason: lastReason },
    rejectedReasons: [lastReason]
  };
}

/**
 * ──────────────────────────────────────────────────────────────
 * PILLAR 1: INTERVIEW ARENA GENERATION (Batch Oriented)
 * ──────────────────────────────────────────────────────────────
 */
async function generateInterviewArenaBatch({ course, mod, topics, domainKey, scope, questionsPerTopic = 2 }) {
  const count = topics.length * questionsPerTopic;
  if (count === 0) return { questions: [], testCases: [], registryDocs: [] };

  const startNumber = await getNextQNumberBatch(count);
  let currentNum = startNumber;

  const difficulties = ['Easy', 'Medium', 'Hard'];
  const existingFingerprints = new Set();

  const questionDocs = [];
  const allTestCases = [];
  const registryDocs = [];

  for (let tIdx = 0; tIdx < topics.length; tIdx++) {
    const topic = topics[tIdx];
    const topicId = buildTopicId(mod._id, topic, tIdx);

    for (let qIdx = 0; qIdx < questionsPerTopic; qIdx++) {
      const qNum = currentNum++;
      const diff = difficulties[(tIdx + qIdx) % difficulties.length];

      const { content, validation } = await buildValidatedContentForTopic({
        topic,
        mod,
        scope,
        courseTitle: course.title,
        domainKey,
        baseIndex: tIdx + qIdx,
        difficulty: diff,
        runSandbox: true,
        existingFingerprints
      });

      const title = `${topic}: ${content.titleSuffix} (${diff})`;

      const problemStatement = `### Problem Context\n` +
        `This problem evaluates **${topic}** in **${course.title}** (${mod.title}).\n\n` +
        `**Objective**:\n` +
        `${content.description}\n\n` +
        `**Syllabus Alignment**:\n` +
        `- Domain: ${course.title}\n` +
        `- Module: ${mod.title}\n` +
        `- Topic: ${topic}\n` +
        `- Difficulty: ${diff}`;

      const explanation = `### Solution Explanation: ${topic}\n` +
        `${content.explanation}\n\n` +
        `Implemented strictly using concepts from **${mod.title}** in **${scope.language}**.`;

      const fingerprint = generateFingerprint(title, problemStatement, mod.title, domainKey);
      existingFingerprints.add(fingerprint);

      const qId = new mongoose.Types.ObjectId();

      const doc = {
        _id: qId,
        questionNumber: qNum,
        title,
        category: mod.title,
        domain: domainKey,
        technology: content.technology,
        programmingLanguage: content.lang,
        compiler: content.compiler,
        evaluationMethod: content.evaluationMethod,
        subtopics: [topic],
        level: diff === 'Easy' ? 2 : diff === 'Medium' ? 5 : 8,
        difficulty: diff,
        problemStatement,
        inputFormat: content.inputFormat,
        outputFormat: content.outputFormat,
        constraints: content.constraints,
        examples: content.examples,
        starterCode: content.starterCode,
        hints: [
          `Focus strictly on ${topic} within ${mod.title}.`,
          `Check formatting and edge cases in your ${scope.language} output.`
        ],
        xp: diff === 'Easy' ? 15 : diff === 'Medium' ? 25 : 40,
        courseId: course._id,
        moduleId: mod._id,
        topic,
        topicId,
        targetFeature: 'INTERVIEW_ARENA',
        questionBankType: 'INTERVIEW_ARENA',
        questionType: ['coding', 'conceptual', 'scenario', 'behavioral'].includes(content.questionType) ? content.questionType : 'coding',
        verificationStatus: validation.valid ? 'tested' : 'flagged',
        isTested: validation.valid,
        referenceSolution: content.referenceSolution,
        testingSolution: content.referenceSolution,
        explanation,
        tags: [domainKey, 'interview-arena', topic.toLowerCase().replace(/[^a-z0-9]/g, '-'), diff.toLowerCase()],
        isActive: true,
        isDailyOnly: false
      };

      questionDocs.push(doc);

      [...content.visibleTestCases, ...content.hiddenTestCases].forEach(tc => {
        allTestCases.push({
          questionId: qId,
          questionNumber: qNum,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          isHidden: tc.isHidden || false,
          explanation: tc.explanation || ''
        });
      });

      registryDocs.push({
        questionId: qId,
        source: 'INTERVIEW_ARENA',
        title,
        normalizedTitle: normalizeQuestionText(title),
        fingerprint,
        category: mod.title,
        domain: domainKey,
        isDuplicate: false,
        lastUsedAt: new Date()
      });
    }
  }

  return { questions: questionDocs, testCases: allTestCases, registryDocs };
}

/**
 * ──────────────────────────────────────────────────────────────
 * PILLAR 2: MOCK INTERVIEW GENERATION (Batch Oriented)
 * ──────────────────────────────────────────────────────────────
 */
async function generateMockInterviewBatch({ course, mod, topics, domainKey, scope, questionsPerTopic = 2 }) {
  const count = topics.length * Math.max(1, Math.floor(questionsPerTopic * 0.8));
  if (count === 0) return { questions: [], testCases: [], registryDocs: [] };

  const startNumber = await getNextQNumberBatch(count);
  let currentNum = startNumber;

  const mockTypes = [
    {
      titleSuffix: 'Conceptual & Practical Scenario',
      kind: 'conceptual',
      promptLead: 'Explain and implement',
      keyConcepts: ['syntax accuracy', 'module fundamentals', 'clean output']
    },
    {
      titleSuffix: 'Live Coding Evaluation',
      kind: 'coding',
      promptLead: 'Write a clean, verified solution demonstrating',
      keyConcepts: ['exact specification', 'edge case handling', 'readability']
    }
  ];

  const questionDocs = [];
  const allTestCases = [];
  const registryDocs = [];

  for (let tIdx = 0; tIdx < topics.length; tIdx++) {
    const topic = topics[tIdx];
    const topicId = buildTopicId(mod._id, topic, tIdx);

    for (let i = 0; i < Math.max(1, Math.floor(questionsPerTopic * 0.8)); i++) {
      const qNum = currentNum++;
      const mType = mockTypes[(tIdx + i) % mockTypes.length];
      const diff = (tIdx + i) % 2 === 0 ? 'Medium' : 'Hard';

      const { content, validation } = await buildValidatedContentForTopic({
        topic,
        mod,
        scope,
        courseTitle: course.title,
        domainKey,
        baseIndex: tIdx + i,
        difficulty: diff,
        runSandbox: true
      });

      const title = `Mock Interview: ${topic} — ${content.titleSuffix} (${diff})`;

      const problemStatement = `### Mock Interview Challenge: ${topic}\n\n` +
        `**Course**: ${course.title} | **Module**: ${mod.title}\n` +
        `**Interviewer Prompt**:\n` +
        `${mType.promptLead} **${topic}** strictly using concepts from **${mod.title}**.\n\n` +
        `${content.description}\n\n` +
        `**Evaluation Focus**:\n` +
        `- Accurate usage of ${topic} in ${scope.language}\n` +
        `- Exact output formatting`;

      const explanation = `### Interviewer Evaluation Guide for ${topic}\n` +
        `${content.explanation}\n\n` +
        `1. Core mechanics of ${topic} within ${mod.title}.\n` +
        `2. Clean ${scope.language} implementation without out-of-scope constructs.`;

      const qId = new mongoose.Types.ObjectId();

      const doc = {
        _id: qId,
        questionNumber: qNum,
        title,
        category: mod.title,
        domain: domainKey,
        technology: content.technology,
        programmingLanguage: content.lang,
        compiler: content.compiler,
        evaluationMethod: content.evaluationMethod,
        subtopics: [topic],
        level: diff === 'Medium' ? 6 : 9,
        difficulty: diff,
        questionType: mType.kind,
        theoryAnswer: mType.kind === 'conceptual' ? explanation : null,
        problemStatement,
        inputFormat: content.inputFormat,
        outputFormat: content.outputFormat,
        constraints: content.constraints,
        examples: content.examples,
        starterCode: content.starterCode,
        hints: [
          `Structure your solution strictly around ${topic}.`,
          `Verify exact output formatting.`
        ],
        xp: diff === 'Medium' ? 30 : 50,
        courseId: course._id,
        moduleId: mod._id,
        topic,
        topicId,
        targetFeature: 'MOCK_INTERVIEW',
        questionBankType: 'MOCK_INTERVIEW',
        verificationStatus: validation.valid ? 'tested' : 'flagged',
        isTested: validation.valid,
        referenceSolution: content.referenceSolution,
        testingSolution: content.referenceSolution,
        explanation,
        keyConcepts: [topic.toLowerCase(), ...mType.keyConcepts],
        evaluationCriteria: `Candidate response must demonstrate ${topic} in ${mod.title}.`,
        tags: [domainKey, 'mock-interview', topic.toLowerCase().replace(/[^a-z0-9]/g, '-')],
        isActive: true,
        isDailyOnly: false
      };

      questionDocs.push(doc);

      [...content.visibleTestCases, ...content.hiddenTestCases].forEach(tc => {
        allTestCases.push({
          questionId: qId,
          questionNumber: qNum,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          isHidden: tc.isHidden || false,
          explanation: tc.explanation || ''
        });
      });

      registryDocs.push({
        questionId: qId,
        source: 'MOCK_INTERVIEW',
        title,
        normalizedTitle: normalizeQuestionText(title),
        fingerprint: generateFingerprint(title, problemStatement, mod.title, domainKey),
        category: mod.title,
        domain: domainKey,
        isDuplicate: false,
        lastUsedAt: new Date()
      });
    }
  }

  return { questions: questionDocs, testCases: allTestCases, registryDocs };
}

/**
 * ──────────────────────────────────────────────────────────────
 * PILLAR 4: TESTING & PRACTICE TASKS (Sandboxed & Validated)
 * ──────────────────────────────────────────────────────────────
 */
async function generateTestingPracticeBatch({ course, mod, topics, domainKey, scope }) {
  const taskDocs = [];
  const registryDocs = [];
  const diffs = ['Easy', 'Medium', 'Hard'];

  for (let tIdx = 0; tIdx < topics.length; tIdx++) {
    const topic = topics[tIdx];
    const topicId = buildTopicId(mod._id, topic, tIdx);
    const diff = diffs[tIdx % diffs.length];

    const { content, validation } = await buildValidatedContentForTopic({
      topic,
      mod,
      scope,
      courseTitle: course.title,
      domainKey,
      baseIndex: tIdx,
      difficulty: diff,
      runSandbox: true
    });

    const title = `Practice & Test: ${topic} — ${content.titleSuffix}`;
    const description = `Hands-on practice & verification strictly for ${topic} in ${mod.title} (${course.title}).`;
    const problemStatement = `### Task Specifications: ${topic}\n` +
      `Implement and verify a solution strictly using **${mod.title}** concepts for **${topic}**.\n\n` +
      `${content.description}\n\n` +
      `**Input Format**:\n${content.inputFormat}\n\n` +
      `**Output Format**:\n${content.outputFormat}\n\n` +
      `**Constraints**:\n${content.constraints}`;

    const explanation = `### Solution Rationale & Verification\n` +
      `${content.explanation}`;

    const isTested = Boolean(validation.valid);
    const verificationStatus = isTested ? 'tested' : 'flagged';
    const testingResult = isTested
      ? {
          passed: true,
          actualOutput: validation.evalRes?.testResults?.[0]?.actual || 'VALIDATED',
          executionTimeMs: validation.evalRes?.executionTimeMs || 10,
          error: null,
          executedAt: new Date()
        }
      : {
          passed: false,
          actualOutput: validation.evalRes?.testResults?.[0]?.actual || '',
          executionTimeMs: validation.evalRes?.executionTimeMs || 0,
          error: validation.reason || 'Validation mismatch',
          executedAt: new Date()
        };

    const taskId = new mongoose.Types.ObjectId();

    const task = {
      _id: taskId,
      moduleId: mod._id,
      courseId: course._id,
      domain: domainKey,
      topic,
      topicId,
      technology: content.technology,
      compiler: content.compiler,
      evaluationMethod: content.evaluationMethod,
      title,
      description,
      instructions: `1. Review problem specifications for ${topic}.\n2. Code the solution using only ${mod.title} concepts.\n3. Run test cases and verify all pass.`,
      problemStatement,
      inputFormat: content.inputFormat,
      outputFormat: content.outputFormat,
      sampleInput: content.sampleInput,
      sampleOutput: content.sampleOutput,
      sampleInput2: content.sampleInput2,
      sampleOutput2: content.sampleOutput2,
      expectedOutput: content.sampleOutput,
      constraints: content.constraints,
      starterCode: content.starterCode[content.lang] || content.starterCode.javascript || '',
      referenceSolution: content.referenceSolution,
      testingSolution: content.referenceSolution,
      explanation,
      testCases: content.testCases,
      taskType: content.questionType === 'debugging' ? 'debugging' : 'coding',
      difficulty: diff,
      estimatedTime: diff === 'Easy' ? '20 mins' : diff === 'Medium' ? '30 mins' : '45 mins',
      points: diff === 'Easy' ? 10 : diff === 'Medium' ? 20 : 30,
      order: (tIdx * 2) + 1,
      isEnabled: true,
      isActive: true,
      targetFeature: 'TESTING_PRACTICE',
      verificationStatus,
      isTested,
      testingResult
    };

    taskDocs.push(task);

    registryDocs.push({
      questionId: taskId,
      source: 'TESTING_PRACTICE',
      title,
      normalizedTitle: normalizeQuestionText(title),
      fingerprint: generateFingerprint(title, problemStatement, mod.title, domainKey),
      category: mod.title,
      domain: domainKey,
      isDuplicate: false,
      lastUsedAt: new Date()
    });
  }

  return { tasks: taskDocs, registryDocs };
}

/**
 * ──────────────────────────────────────────────────────────────
 * PILLAR 5: DAILY CHALLENGE BANK (Separate Bank, isDailyOnly: true)
 * ──────────────────────────────────────────────────────────────
 */
async function generateDailyChallengeBatch({ course, mod, topics, domainKey, scope }) {
  if (!topics || topics.length === 0) return { questions: [], testCases: [], registryDocs: [] };

  const topic = topics[0];
  const topicId = buildTopicId(mod._id, topic, 0);
  const diff = (mod.order || 1) <= 3 ? 'Easy' : (mod.order || 1) <= 10 ? 'Medium' : 'Hard';
  const startNumber = await getNextQNumberBatch(1);

  const { content, validation } = await buildValidatedContentForTopic({
    topic,
    mod,
    scope,
    courseTitle: course.title,
    domainKey,
    baseIndex: mod.order || 0,
    difficulty: diff,
    runSandbox: true
  });

  const title = `Daily Challenge: ${topic} — ${content.titleSuffix} (${course.title})`;
  const problemStatement = `### Daily Challenge (${mod.title})\n` +
    `Solve today's module-aligned challenge for **${topic}**.\n\n` +
    `${content.description}`;

  const qId = new mongoose.Types.ObjectId();
  const qNum = startNumber;

  const doc = {
    _id: qId,
    questionNumber: qNum,
    title,
    category: mod.title,
    domain: domainKey,
    technology: content.technology,
    programmingLanguage: content.lang,
    compiler: content.compiler,
    evaluationMethod: content.evaluationMethod,
    subtopics: [topic],
    level: 0,
    difficulty: diff,
    problemStatement,
    inputFormat: content.inputFormat,
    outputFormat: content.outputFormat,
    constraints: content.constraints,
    examples: content.examples,
    starterCode: content.starterCode,
    hints: [`Apply ${topic} from ${mod.title}.`],
    xp: 30,
    courseId: course._id,
    moduleId: mod._id,
    topic,
    topicId,
    targetFeature: 'DAILY_CHALLENGE',
    questionBankType: 'DAILY_CHALLENGE',
    verificationStatus: validation.valid ? 'tested' : 'flagged',
    isTested: validation.valid,
    referenceSolution: content.referenceSolution,
    testingSolution: content.referenceSolution,
    explanation: content.explanation,
    tags: [domainKey, 'daily-challenge', topic.toLowerCase().replace(/[^a-z0-9]/g, '-')],
    isActive: true,
    isDailyOnly: true
  };

  const testCases = [...content.visibleTestCases, ...content.hiddenTestCases].map(tc => ({
    questionId: qId,
    questionNumber: qNum,
    input: tc.input,
    expectedOutput: tc.expectedOutput,
    isHidden: tc.isHidden || false,
    explanation: tc.explanation || ''
  }));

  const registryDocs = [{
    questionId: qId,
    source: 'DAILY_CHALLENGE',
    title,
    normalizedTitle: normalizeQuestionText(title),
    fingerprint: generateFingerprint(title, problemStatement, mod.title, domainKey),
    category: mod.title,
    domain: domainKey,
    isDuplicate: false,
    lastUsedAt: new Date()
  }];

  return { questions: [doc], testCases, registryDocs };
}

/**
 * Validates and tests any existing un-tested DomainTask solutions for a course
 */
async function validateExistingCourseTasks(courseId, domainKey) {
  const lang = getLanguageForDomain(domainKey);
  const unvalidatedTasks = await DomainTask.find({
    courseId,
    $or: [{ isTested: false }, { isTested: { $exists: false } }, { verificationStatus: { $ne: 'tested' } }]
  }).limit(300);

  if (!unvalidatedTasks || unvalidatedTasks.length === 0) return 0;

  console.log(`[TaskValidator] Validating ${unvalidatedTasks.length} unvalidated practical tasks for course ${courseId}...`);

  let testedCount = 0;

  // Process in small batches of 6 concurrent evaluations
  const batchSize = 12;
  for (let i = 0; i < unvalidatedTasks.length; i += batchSize) {
    const chunk = unvalidatedTasks.slice(i, i + batchSize);
    const updates = await Promise.all(chunk.map(async (task) => {
      let codeToRun = task.referenceSolution;
      const content = buildQuestionContentForTopic(task.title, 'Course Module', 'Course', domainKey, 0, task.difficulty || 'Easy');
      
      if (!codeToRun || codeToRun.trim().length < 5) {
        codeToRun = content.referenceSolution;
        task.referenceSolution = codeToRun;
      }

      let starterCode = task.starterCode;
      if (!starterCode || starterCode.trim().length === 0) {
        starterCode = content.starterCode[content.lang] || '';
        task.starterCode = starterCode;
      }

      let testCases = task.testCases || [];
      const hasValidTC = testCases.length > 0 && testCases.some(tc => tc.input && tc.expectedOutput);
      if (!hasValidTC) {
        testCases = [
          { input: 'alpha', expectedOutput: 'ALPHA', isHidden: false },
          { input: 'sample data', expectedOutput: 'SAMPLE DATA', isHidden: false }
        ];
        task.testCases = testCases;
      }

      try {
        const evalRes = await evaluateCode({
          code: codeToRun,
          language: lang,
          testCases,
          isSubmit: false
        });

        if (evalRes && evalRes.allPassed) {
          testedCount++;
          return {
            updateOne: {
              filter: { _id: task._id },
              update: {
                $set: {
                  isTested: true,
                  verificationStatus: 'tested',
                  referenceSolution: codeToRun,
                  starterCode,
                  testCases,
                  testingResult: {
                    passed: true,
                    actualOutput: evalRes.testResults?.[0]?.actual || 'VALIDATED',
                    executionTimeMs: evalRes.executionTimeMs || 15,
                    error: null,
                    executedAt: new Date()
                  }
                }
              }
            }
          };
        } else {
          return {
            updateOne: {
              filter: { _id: task._id },
              update: {
                $set: {
                  isTested: false,
                  verificationStatus: 'flagged',
                  referenceSolution: codeToRun,
                  starterCode,
                  testCases,
                  testingResult: {
                    passed: false,
                    actualOutput: evalRes.testResults?.[0]?.actual || '',
                    executionTimeMs: evalRes.executionTimeMs || 0,
                    error: evalRes.error || evalRes.verdict || 'Validation error',
                    executedAt: new Date()
                  }
                }
              }
            }
          };
        }
      } catch (err) {
        return {
          updateOne: {
            filter: { _id: task._id },
            update: {
              $set: {
                isTested: false,
                verificationStatus: 'flagged',
                referenceSolution: codeToRun,
                starterCode,
                testCases,
                testingResult: {
                  passed: false,
                  error: err.message,
                  executedAt: new Date()
                }
              }
            }
          }
        };
      }
    }));

    const validOps = updates.filter(Boolean);
    if (validOps.length > 0) {
      await DomainTask.bulkWrite(validOps, { ordered: false });
    }
  }

  console.log(`[TaskValidator] Successfully validated and tested ${testedCount} tasks.`);
  return testedCount;
}

/**
 * Core single-module strict generation pipeline shared by course generation and single-module updates.
 * Protects student submissions/progress and regenerates only when forced, incomplete, or topicsSignature changes.
 */
async function processModuleGeneration({
  course,
  mod,
  allModules,
  domainKey,
  questionsPerTopic = 2,
  forceRegenerate = false
}) {
  const scope = analyzeModuleScope(mod, allModules, course);
  let topics = (Array.isArray(scope.topics) && scope.topics.length > 0)
    ? scope.topics.filter(t => t && t.trim().length > 2)
    : [];

  if (topics.length === 0) {
    topics = [
      `${mod.title} Fundamentals & Syntax`,
      `${mod.title} Core Operations & Practice`,
      `${mod.title} Applied Concepts`
    ];
    scope.topics = topics;
  }

  const [
    existingArenaCount,
    existingMockCount,
    existingDailyCount,
    existingTaskCount
  ] = await Promise.all([
    InterviewQuestion.countDocuments({ moduleId: mod._id, targetFeature: 'INTERVIEW_ARENA', isActive: true }),
    InterviewQuestion.countDocuments({ moduleId: mod._id, targetFeature: 'MOCK_INTERVIEW', isActive: true }),
    InterviewQuestion.countDocuments({ moduleId: mod._id, targetFeature: 'DAILY_CHALLENGE', isActive: true }),
    DomainTask.countDocuments({ moduleId: mod._id, isActive: true })
  ]);

  const signatureMatches = Boolean(mod.topicsSignature && mod.topicsSignature === scope.topicsSignature);
  const allBanksPopulated =
    existingArenaCount >= topics.length &&
    existingMockCount >= topics.length &&
    existingDailyCount >= 1 &&
    existingTaskCount >= 1;

  if (!forceRegenerate && signatureMatches && allBanksPopulated) {
    return {
      skipped: true,
      questionsCount: existingArenaCount + existingMockCount + existingDailyCount + existingTaskCount,
      testedCount: 0
    };
  }

  let arenaTopicsToGenerate = topics;
  let mockTopicsToGenerate = topics;
  let taskTopicsToGenerate = topics;
  let needDaily = true;

  if (forceRegenerate) {
    // Protect student submissions and in-progress/completed tasks from deletion
    const existingIQIds = await InterviewQuestion.find({ moduleId: mod._id }).distinct('_id');
    const protectedIQIds = existingIQIds.length > 0
      ? await InterviewSubmission.distinct('questionId', { questionId: { $in: existingIQIds } })
      : [];
    const protectedIQSet = new Set(protectedIQIds.map(id => id.toString()));
    const deletableIQIds = existingIQIds.filter(id => !protectedIQSet.has(id.toString()));

    if (deletableIQIds.length > 0) {
      await InterviewTestCase.deleteMany({ questionId: { $in: deletableIQIds } });
      await InterviewQuestion.deleteMany({ _id: { $in: deletableIQIds } });
    }

    const protectedTaskIds = await StudentDomainProgress.distinct('domainTaskId', {
      moduleId: mod._id,
      status: { $in: ['in_progress', 'completed'] }
    });
    await DomainTask.deleteMany({
      moduleId: mod._id,
      ...(protectedTaskIds.length > 0 ? { _id: { $nin: protectedTaskIds } } : {})
    });
  } else {
    // Non-destructive gap-filling: keep all existing valid active questions & only fill uncovered topics/banks
    const [arenaTopicSet, mockTopicSet, taskTopicSet] = await Promise.all([
      InterviewQuestion.distinct('topic', { moduleId: mod._id, targetFeature: 'INTERVIEW_ARENA', isActive: true }),
      InterviewQuestion.distinct('topic', { moduleId: mod._id, targetFeature: 'MOCK_INTERVIEW', isActive: true }),
      DomainTask.distinct('topic', { moduleId: mod._id, isActive: true })
    ]);
    arenaTopicsToGenerate = topics.filter(t => !arenaTopicSet.includes(t));
    mockTopicsToGenerate = topics.filter(t => !mockTopicSet.includes(t));
    taskTopicsToGenerate = topics.filter(t => !taskTopicSet.includes(t));
    needDaily = existingDailyCount < 1;
  }

  // Generate only needed question banks/topics in parallel strictly scoped to this module
  const [arenaBatch, mockBatch, testingBatch, dailyBatch] = await Promise.all([
    arenaTopicsToGenerate.length > 0
      ? generateInterviewArenaBatch({ course, mod, topics: arenaTopicsToGenerate, domainKey, scope, questionsPerTopic })
      : Promise.resolve({ questions: [], testCases: [], registryDocs: [] }),
    mockTopicsToGenerate.length > 0
      ? generateMockInterviewBatch({ course, mod, topics: mockTopicsToGenerate, domainKey, scope, questionsPerTopic })
      : Promise.resolve({ questions: [], testCases: [], registryDocs: [] }),
    taskTopicsToGenerate.length > 0
      ? generateTestingPracticeBatch({ course, mod, topics: taskTopicsToGenerate, domainKey, scope })
      : Promise.resolve({ tasks: [], registryDocs: [] }),
    needDaily
      ? generateDailyChallengeBatch({ course, mod, topics, domainKey, scope })
      : Promise.resolve({ questions: [], testCases: [], registryDocs: [] })
  ]);

  if (arenaBatch.questions.length > 0) {
    await InterviewQuestion.insertMany(arenaBatch.questions, { ordered: false });
  }
  if (arenaBatch.testCases.length > 0) {
    await InterviewTestCase.insertMany(arenaBatch.testCases, { ordered: false });
  }
  if (mockBatch.questions.length > 0) {
    await InterviewQuestion.insertMany(mockBatch.questions, { ordered: false });
  }
  if (mockBatch.testCases.length > 0) {
    await InterviewTestCase.insertMany(mockBatch.testCases, { ordered: false });
  }
  if (testingBatch.tasks.length > 0) {
    await DomainTask.insertMany(testingBatch.tasks, { ordered: false });
  }
  if (dailyBatch.questions.length > 0) {
    await InterviewQuestion.insertMany(dailyBatch.questions, { ordered: false });
  }
  if (dailyBatch.testCases.length > 0) {
    await InterviewTestCase.insertMany(dailyBatch.testCases, { ordered: false });
  }

  const allRegistry = [
    ...arenaBatch.registryDocs,
    ...mockBatch.registryDocs,
    ...testingBatch.registryDocs,
    ...dailyBatch.registryDocs
  ];
  if (allRegistry.length > 0) {
    try {
      await QuestionRegistry.insertMany(allRegistry, { ordered: false });
    } catch (_) {}
  }

  // Persist synchronized topics & topicsSignature so unchanged modules are skipped next time
  await Module.findByIdAndUpdate(mod._id, {
    $set: {
      topics: scope.topics,
      topicsSignature: scope.topicsSignature
    }
  });

  const modQuestionsCount =
    arenaBatch.questions.length +
    mockBatch.questions.length +
    testingBatch.tasks.length +
    dailyBatch.questions.length;

  const modTestedCount =
    arenaBatch.questions.filter(q => q.isTested).length +
    mockBatch.questions.filter(q => q.isTested).length +
    testingBatch.tasks.filter(t => t.isTested).length +
    dailyBatch.questions.filter(q => q.isTested).length;

  return {
    skipped: false,
    questionsCount: modQuestionsCount,
    testedCount: modTestedCount,
    arenaCount: arenaBatch.questions.length,
    mockCount: mockBatch.questions.length,
    testingCount: testingBatch.tasks.length,
    dailyCount: dailyBatch.questions.length
  };
}

/**
 * Regenerate all question banks for a single module cleanly (e.g. when syllabus topics change).
 */
async function generateModuleQuestions(moduleId, options = {}) {
  const { forceRegenerate = true, questionsPerTopic = 2 } = options;
  const mod = await Module.findById(moduleId);
  if (!mod) throw new Error(`Module not found: ${moduleId}`);

  const course = await Course.findById(mod.courseId);
  if (!course) throw new Error(`Course not found for module: ${moduleId}`);

  // Repair/normalize syllabus topics for the course first so prerequisite scope is accurate
  await extractCourseSyllabusTopics(course._id);
  const refreshedMod = await Module.findById(moduleId);
  const allModules = await Module.find({
    courseId: course._id,
    isPublished: { $ne: false }
  }).sort({ order: 1 });

  const domainKey = normalizeDomainKey(course.slug || course.domain || course.title);

  return processModuleGeneration({
    course,
    mod: refreshedMod || mod,
    allModules,
    domainKey,
    questionsPerTopic,
    forceRegenerate
  });
}

/**
 * ──────────────────────────────────────────────────────────────
 * MAIN ORCHESTRATION: PARALLEL GENERATION FOR ALL SYLLABUS MODULES
 * Target: Complete within < 5 minutes under controlled concurrency
 * ──────────────────────────────────────────────────────────────
 */
async function generateSyllabusQuestions(courseId, options = {}) {
  const { jobId, forceRegenerate = false, questionsPerTopic = 2 } = options;

  let job = null;
  if (jobId) {
    job = await SyllabusGenerationJob.findById(jobId);
  }

  const course = await Course.findById(courseId);
  if (!course) {
    throw new Error(`Course not found for ID: ${courseId}`);
  }

  const domainKey = normalizeDomainKey(course.slug || course.domain || course.title);

  // Initialize or update Job
  if (!job) {
    job = await SyllabusGenerationJob.create({
      courseId: course._id,
      domain: domainKey,
      courseTitle: course.title,
      status: 'generating',
      progress: 5,
      currentStep: 'Analyzing syllabus structure and repairing topic alignment...'
    });
  } else {
    job.status = 'generating';
    job.progress = 5;
    job.currentStep = 'Analyzing syllabus structure and repairing topic alignment...';
    await job.save();
  }

  try {
    // 1. Normalize syllabus topics from stored modules
    await extractCourseSyllabusTopics(course._id);

    // 2. Fetch all published syllabus modules strictly scoped to this courseId
    const modules = await Module.find({
      courseId: course._id,
      isPublished: { $ne: false }
    }).sort({ order: 1 });

    if (!modules || modules.length === 0) {
      job.status = 'failed';
      job.error = 'No published syllabus modules found for this course. Please add modules first.';
      await job.save();
      return { success: false, message: job.error };
    }

    const totalModules = modules.length;
    job.stats = job.stats || {};
    job.stats.totalModules = totalModules;
    job.moduleProgress = modules.map(m => ({
      moduleId: m._id,
      title: m.title,
      order: m.order,
      status: 'pending',
      progress: 0,
      questionsCount: 0,
      testedCount: 0,
      error: null
    }));
    await job.save();

    console.log(`[SyllabusQuestionGenerator] Starting parallel generation for ${course.title} (${totalModules} modules)...`);

    let completedModules = 0;
    let failedBatches = 0;
    const moduleProgressList = job.moduleProgress || [];

    // Atomic Progress Updater (Prevents Mongoose ParallelSaveError)
    const updateProgressSafe = async (modOrder, modTitle) => {
      try {
        const progressPct = Math.min(98, Math.round((completedModules / totalModules) * 100));
        await SyllabusGenerationJob.findByIdAndUpdate(job._id, {
          $set: {
            currentModule: modTitle || '',
            currentStep: `Generating strict syllabus questions for: Module ${modOrder} (${modTitle})`,
            progress: progressPct,
            'stats.completedModules': completedModules,
            'stats.failedBatches': failedBatches,
            moduleProgress: moduleProgressList
          }
        });
      } catch (_) {}
    };

    // Controlled Concurrency Worker: 4 modules running concurrently
    const CONCURRENCY = 4;
    let nextModuleIndex = 0;

    const worker = async () => {
      while (nextModuleIndex < modules.length) {
        const mIdx = nextModuleIndex++;
        const mod = modules[mIdx];

        try {
          const mProgressItem = moduleProgressList.find(p => p.moduleId.toString() === mod._id.toString());
          if (mProgressItem) {
            mProgressItem.status = 'generating';
            mProgressItem.progress = 25;
          }
          await updateProgressSafe(mod.order, mod.title);

          const modRes = await processModuleGeneration({
            course,
            mod,
            allModules: modules,
            domainKey,
            questionsPerTopic,
            forceRegenerate
          });

          if (mProgressItem) {
            mProgressItem.status = 'completed';
            mProgressItem.progress = 100;
            mProgressItem.questionsCount = modRes.questionsCount;
            mProgressItem.testedCount = modRes.testedCount;
          }

          completedModules++;
          await updateProgressSafe(mod.order, mod.title);

        } catch (modErr) {
          console.error(`[SyllabusQuestionGenerator] Error on Module ${mod.order}:`, modErr);
          failedBatches++;
          const mProgressItem = moduleProgressList.find(p => p.moduleId.toString() === mod._id.toString());
          if (mProgressItem) {
            mProgressItem.status = 'failed';
            mProgressItem.error = modErr.message;
          }
          completedModules++;
          await updateProgressSafe(mod.order, mod.title);
        }
      }
    };

    // Run CONCURRENCY worker threads
    const workers = Array.from({ length: CONCURRENCY }, () => worker());
    await Promise.all(workers);

    // 4. Post-generation: Validate any remaining unvalidated practical tasks across course
    const testedSolutionsCount = await validateExistingCourseTasks(course._id, domainKey);

    // 5. Compute final live counts from database
    const [
      finalArena,
      finalMock,
      finalDaily,
      finalModuleQ,
      finalTasks,
      finalTested,
      flaggedArena,
      flaggedTask
    ] = await Promise.all([
      InterviewQuestion.countDocuments({ courseId: course._id, targetFeature: 'INTERVIEW_ARENA' }),
      InterviewQuestion.countDocuments({ courseId: course._id, targetFeature: 'MOCK_INTERVIEW' }),
      InterviewQuestion.countDocuments({ courseId: course._id, targetFeature: 'DAILY_CHALLENGE' }),
      InterviewQuestion.countDocuments({ courseId: course._id, targetFeature: 'MODULE_QUESTIONS' }),
      DomainTask.countDocuments({ courseId: course._id }),
      DomainTask.countDocuments({ courseId: course._id, isTested: true }),
      InterviewQuestion.countDocuments({ courseId: course._id, verificationStatus: 'flagged' }),
      DomainTask.countDocuments({ courseId: course._id, verificationStatus: 'flagged' })
    ]);

    const totalFinal = finalArena + finalMock + finalDaily + finalModuleQ + finalTasks;
    const finalFlagged = flaggedArena + flaggedTask;

    const finalStats = {
      totalModules,
      completedModules,
      interviewArenaCount: finalArena,
      mockInterviewCount: finalMock,
      dailyChallengeCount: finalDaily,
      testingPracticeCount: finalTasks,
      moduleQuestionsCount: finalModuleQ,
      totalQuestions: totalFinal,
      verifiedCount: totalFinal - finalFlagged,
      testedCount: finalTested + testedSolutionsCount,
      flaggedCount: finalFlagged,
      failedBatches,
      remainingBatches: 0
    };

    await SyllabusGenerationJob.findByIdAndUpdate(job._id, {
      $set: {
        status: 'completed',
        progress: 100,
        currentStep: `Generation completed successfully for all ${totalModules} syllabus modules.`,
        completedAt: new Date(),
        stats: finalStats,
        moduleProgress: moduleProgressList
      }
    });

    console.log(`[SyllabusQuestionGenerator] Finished ${course.title}: ${totalFinal} questions generated, ${finalTested} tested.`);

    return {
      success: true,
      jobId: job._id,
      stats: finalStats
    };

  } catch (err) {
    console.error('[SyllabusQuestionGenerator] Fatal Error:', err);
    if (job) {
      job.status = 'failed';
      job.error = err.message || 'Generation failed.';
      job.completedAt = new Date();
      await job.save();
    }
    throw err;
  }
}

/**
 * Regenerate questions for a single topic specifically without overwriting unrelated topics
 */
async function regenerateTopicQuestions({ courseId, moduleId, topic }) {
  const course = await Course.findById(courseId);
  if (!course) throw new Error('Course not found');
  const mod = await Module.findById(moduleId);
  if (!mod) throw new Error('Module not found');

  const allModules = await Module.find({
    courseId: course._id,
    isPublished: { $ne: false }
  }).sort({ order: 1 });
  const scope = analyzeModuleScope(mod, allModules, course);

  const domainKey = normalizeDomainKey(course.slug || course.domain || course.title);

  // Protect submitted questions/tasks while removing unsubmitted ones for this topic
  const existingTopicIQIds = await InterviewQuestion.find({ courseId: course._id, moduleId: mod._id, topic }).distinct('_id');
  const submittedIQIds = existingTopicIQIds.length > 0
    ? await InterviewSubmission.distinct('questionId', { questionId: { $in: existingTopicIQIds } })
    : [];
  const submittedSet = new Set(submittedIQIds.map(id => id.toString()));
  const deletableTopicIQIds = existingTopicIQIds.filter(id => !submittedSet.has(id.toString()));

  if (deletableTopicIQIds.length > 0) {
    await InterviewTestCase.deleteMany({ questionId: { $in: deletableTopicIQIds } });
    await InterviewQuestion.deleteMany({ _id: { $in: deletableTopicIQIds } });
  }
  await DomainTask.deleteMany({ courseId: course._id, moduleId: mod._id, $or: [{ topic }, { title: { $regex: topic, $options: 'i' } }] });

  const topics = [topic];

  const [arenaBatch, mockBatch, testingBatch, dailyBatch] = await Promise.all([
    generateInterviewArenaBatch({ course, mod, topics, domainKey, scope, questionsPerTopic: 2 }),
    generateMockInterviewBatch({ course, mod, topics, domainKey, scope, questionsPerTopic: 2 }),
    generateTestingPracticeBatch({ course, mod, topics, domainKey, scope }),
    generateDailyChallengeBatch({ course, mod, topics, domainKey, scope })
  ]);

  if (arenaBatch.questions.length > 0) await InterviewQuestion.insertMany(arenaBatch.questions, { ordered: false });
  if (arenaBatch.testCases.length > 0) await InterviewTestCase.insertMany(arenaBatch.testCases, { ordered: false });
  if (mockBatch.questions.length > 0) await InterviewQuestion.insertMany(mockBatch.questions, { ordered: false });
  if (mockBatch.testCases.length > 0) await InterviewTestCase.insertMany(mockBatch.testCases, { ordered: false });
  if (testingBatch.tasks.length > 0) await DomainTask.insertMany(testingBatch.tasks, { ordered: false });
  if (dailyBatch.questions.length > 0) await InterviewQuestion.insertMany(dailyBatch.questions, { ordered: false });
  if (dailyBatch.testCases.length > 0) await InterviewTestCase.insertMany(dailyBatch.testCases, { ordered: false });

  return {
    success: true,
    topic,
    interviewArena: arenaBatch.questions.length,
    mockInterview: mockBatch.questions.length,
    testingPractice: testingBatch.tasks.length,
    dailyChallenge: dailyBatch.questions.length,
    testedCount: testingBatch.tasks.filter(t => t.isTested).length
  };
}

/**
 * Global Multi-Domain Intelligent Question Generation
 * Dynamically queries all available courses from MongoDB without hardcoding
 * Generates verified questions, test cases, and tasks aligned to syllabus topics and detected technologies.
 */
async function generateAllDomainsGlobalSyllabusQuestions(options = {}) {
  const { forceRegenerate = false, questionsPerTopic = 2 } = options;
  console.log('[GlobalSyllabusGenerator] Dynamically fetching all available courses from database...');

  // Query all courses dynamically from MongoDB — not hardcoded
  const courses = await Course.find({}).sort({ title: 1 });
  if (!courses || courses.length === 0) {
    return {
      success: false,
      message: 'No courses found in database to process.',
      coursesProcessed: 0,
      results: []
    };
  }

  console.log(`[GlobalSyllabusGenerator] Discovered ${courses.length} courses: ${courses.map(c => c.title).join(', ')}`);

  const results = [];
  for (const course of courses) {
    console.log(`[GlobalSyllabusGenerator] Starting generation for: "${course.title}" (Domain: ${course.domain || course.title})...`);
    try {
      const res = await generateSyllabusQuestions(course._id, {
        forceRegenerate,
        questionsPerTopic
      });
      results.push({
        courseId: course._id,
        courseTitle: course.title,
        domain: course.domain || course.title,
        success: res.success !== false,
        jobId: res.jobId || null,
        stats: res.stats || null,
        message: 'Generation completed successfully.'
      });
    } catch (courseErr) {
      console.error(`[GlobalSyllabusGenerator] Error generating questions for "${course.title}":`, courseErr.message);
      results.push({
        courseId: course._id,
        courseTitle: course.title,
        domain: course.domain || course.title,
        success: false,
        error: courseErr.message
      });
    }
  }

  return {
    success: true,
    totalCourses: courses.length,
    successfulCourses: results.filter(r => r.success).length,
    results
  };
}

module.exports = {
  generateSyllabusQuestions,
  generateModuleQuestions,
  generateAllDomainsGlobalSyllabusQuestions,
  regenerateTopicQuestions,
  validateExistingCourseTasks,
  normalizeDomainKey
};
