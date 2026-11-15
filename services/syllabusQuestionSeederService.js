const mongoose = require('mongoose');
const Course = require('../models/Course');
const Module = require('../models/Module');
const InterviewQuestion = require('../models/InterviewQuestion');
const InterviewTestCase = require('../models/InterviewTestCase');
const QuestionRegistry = require('../models/QuestionRegistry');
const InterviewSubmission = require('../models/InterviewSubmission');
const { extractCourseSyllabusTopics } = require('./syllabusTopicExtractorService');
const { generateFingerprint, normalizeQuestionText } = require('./questionRegistryService');
const { analyzeModuleScope, buildTopicId } = require('./moduleScopeEngine');
const { allocateQuestionNumbers } = require('./questionNumberAllocator');
const { validateGeneratedQuestion } = require('./questionValidationService');
const {
  detectTechnology,
  detectIntegrationChallenge,
  getStarterCodeForTechnology
} = require('./technologyDetectionEngine');
const { generateQuestionSpec } = require('./questionSpecificationEngine');

/**
 * Global synchronized counter for question numbers to guarantee uniqueness
 */
async function getNextQuestionNumber() {
  return allocateQuestionNumbers(1);
}

/**
 * Generate starter code and solutions strictly scoped to the syllabus module & technology.
 * Validates the generated question against module rules + sandbox and retries variations on rejection.
 */
async function buildValidatedCodeArtifacts({
  domainKey,
  topic,
  moduleTitle = '',
  moduleDescription = '',
  courseTitle = '',
  scope = null,
  diff = 'Easy',
  baseTaskIndex = 1,
  existingFingerprints = null
}) {
  const detectedTech = detectTechnology({ topic, moduleTitle, courseTitle, domainKey });
  const integrationInfo = detectIntegrationChallenge(topic, moduleTitle, domainKey);

  const effectiveTechnology = integrationInfo.isIntegration ? integrationInfo.technology : detectedTech.name;
  const effectiveLang = (scope && scope.language)
    || detectedTech.language
    || (domainKey.includes('java') ? 'java' : domainKey.includes('python') ? 'python' : 'javascript');
  const effectiveCompiler = (scope && scope.compiler) || detectedTech.compiler;
  const effectiveEvaluationMethod = detectedTech.evaluationMethod || 'coding';

  let bestResult = null;
  const MAX_ATTEMPTS = 4;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const spec = generateQuestionSpec({
      title: `${topic} (${diff})`,
      topic,
      moduleTitle,
      moduleDescription,
      courseTitle,
      domain: domainKey,
      taskIndex: baseTaskIndex + attempt * 3,
      difficulty: diff || 'Easy',
      scope
    });

    const starterStr = (spec.starterCode && spec.starterCode.trim().length > 10)
      ? spec.starterCode
      : getStarterCodeForTechnology(effectiveTechnology, effectiveLang, topic);

    const artifact = {
      technology: effectiveTechnology,
      language: effectiveLang,
      compiler: effectiveCompiler,
      evaluationMethod: effectiveEvaluationMethod,
      starterCode: { [effectiveLang]: starterStr },
      referenceSolution: spec.referenceSolution,
      testingSolution: spec.referenceSolution,
      problemStatement: spec.problemStatement,
      titleSuffix: spec.titleSuffix || 'Implementation',
      inputFormat: spec.inputFormat,
      outputFormat: spec.outputFormat,
      constraints: spec.constraints,
      sampleInput: spec.sampleInput,
      sampleOutput: spec.sampleOutput,
      sampleInput2: spec.sampleInput2,
      sampleOutput2: spec.sampleOutput2,
      explanation: spec.explanation,
      testCases: spec.testCases || [],
      categoryKey: spec.categoryKey || ''
    };

    if (!scope) {
      return { code: artifact, validation: { valid: true } };
    }

    const validation = await validateGeneratedQuestion({
      question: {
        title: `${topic} - ${artifact.titleSuffix}`,
        topic,
        problemStatement: artifact.problemStatement,
        inputFormat: artifact.inputFormat,
        outputFormat: artifact.outputFormat,
        programmingLanguage: effectiveLang,
        referenceSolution: artifact.referenceSolution,
        testingSolution: artifact.testingSolution,
        starterCode: artifact.starterCode,
        testCases: artifact.testCases,
        sampleInput: artifact.sampleInput,
        sampleOutput: artifact.sampleOutput
      },
      scope,
      runSandbox: true,
      existingFingerprints
    });

    bestResult = { code: artifact, validation };
    if (validation.valid) {
      if (existingFingerprints) {
        existingFingerprints.add(generateFingerprint(`${topic} - ${artifact.titleSuffix}`, artifact.problemStatement, moduleTitle, domainKey));
      }
      return bestResult;
    }
  }

  return bestResult;
}

/**
 * Build and persist one bank question (INTERVIEW_ARENA, MODULE_QUESTIONS, MOCK_INTERVIEW, DAILY_CHALLENGE)
 */
async function createValidatedBankQuestion({
  bankType,
  courseId,
  courseTitle,
  domain,
  moduleId,
  moduleOrder,
  moduleTitle,
  moduleDescription,
  topic,
  topicId,
  difficulty,
  baseTaskIndex,
  scope,
  existingFingerprints
}) {
  const { code, validation } = await buildValidatedCodeArtifacts({
    domainKey: domain,
    topic,
    moduleTitle,
    moduleDescription,
    courseTitle,
    scope,
    diff: difficulty,
    baseTaskIndex,
    existingFingerprints
  });

  const qNum = await getNextQuestionNumber();
  const isMock = bankType === 'MOCK_INTERVIEW';
  const isModule = bankType === 'MODULE_QUESTIONS';
  const isDaily = bankType === 'DAILY_CHALLENGE';

  const titlePrefix = isMock
    ? 'Mock Interview Scenario'
    : isModule
      ? 'Module Assessment'
      : isDaily
        ? 'Daily Challenge'
        : 'Interview Arena';

  const title = isModule
    ? `${titlePrefix}: ${topic} — ${code.titleSuffix} [${moduleTitle}]`
    : `${titlePrefix}: ${topic} — ${code.titleSuffix} (${courseTitle})`;

  const problemStatement = isMock
    ? `### Real-World Mock Interview Scenario\n\n` +
      `**Interviewer Prompt**:\n` +
      `You are in an engineering interview for a technical role in **${courseTitle}** (${moduleTitle}).\n\n` +
      `**Problem Statement**:\n` +
      `${code.problemStatement}\n\n` +
      `**Strict Module Scope**:\n` +
      `- Course: ${courseTitle}\n` +
      `- Module [${moduleOrder}]: ${moduleTitle}\n` +
      `- Exact Topic: ${topic}`
    : isModule
      ? `### Module Knowledge & Practical Assessment\n` +
        `This assessment evaluates your mastery of **${topic}** under syllabus **${moduleTitle}**.\n\n` +
        `${code.problemStatement}\n\n` +
        `**Curriculum Details**:\n` +
        `- Course: ${courseTitle}\n` +
        `- Technology: ${code.technology}\n` +
        `- Module [${moduleOrder}]: ${moduleTitle}\n` +
        `- Syllabus Topic: ${topic}\n` +
        `- Difficulty: ${difficulty}`
      : isDaily
        ? `### Daily Challenge (${moduleTitle})\n` +
          `Solve today's strict syllabus challenge for **${topic}**.\n\n` +
          `${code.problemStatement}`
        : `### Technical Problem Statement\n` +
          `In technical interviews for **${courseTitle}**, a firm grasp of **${topic}** is essential.\n\n` +
          `${code.problemStatement}\n\n` +
          `**Syllabus Focus**:\n` +
          `- Course: ${courseTitle}\n` +
          `- Technology: ${code.technology}\n` +
          `- Module [${moduleOrder}]: ${moduleTitle}\n` +
          `- Exact Topic: ${topic}\n` +
          `- Difficulty: ${difficulty}`;

  const qDoc = await InterviewQuestion.create({
    questionNumber: qNum,
    title,
    category: moduleTitle,
    domain,
    technology: code.technology,
    compiler: code.compiler,
    programmingLanguage: code.language,
    evaluationMethod: code.evaluationMethod,
    subtopics: [topic],
    level: isDaily ? 0 : difficulty === 'Easy' ? 2 : difficulty === 'Medium' ? 5 : 8,
    difficulty,
    problemStatement,
    inputFormat: code.inputFormat,
    outputFormat: code.outputFormat,
    constraints: code.constraints,
    examples: [
      { input: code.sampleInput, output: code.sampleOutput, explanation: code.explanation },
      { input: code.sampleInput2 || code.sampleInput, output: code.sampleOutput2 || code.sampleOutput, explanation: 'Secondary verification case' }
    ],
    starterCode: code.starterCode,
    hints: [
      `Stay strictly within the concepts of ${moduleTitle} (${topic}).`,
      `Verify exact input and output formatting.`
    ],
    xp: isMock ? (difficulty === 'Medium' ? 30 : 50) : difficulty === 'Easy' ? 20 : difficulty === 'Medium' ? 35 : 50,
    courseId,
    moduleId,
    topic,
    topicId,
    targetFeature: bankType,
    questionBankType: isModule ? 'MODULE' : bankType,
    questionType: isMock ? 'scenario' : 'coding',
    verificationStatus: validation.valid ? 'tested' : 'flagged',
    isTested: validation.valid,
    referenceSolution: code.referenceSolution,
    testingSolution: code.testingSolution,
    explanation: code.explanation || `Optimal solution for ${topic} within ${moduleTitle}.`,
    tags: [domain, bankType.toLowerCase().replace(/_/g, '-'), `mod-${moduleOrder}`, topic.toLowerCase().replace(/[^a-z0-9]/g, '-'), difficulty.toLowerCase()],
    isActive: true,
    isDailyOnly: isDaily
  });

  const testCasesToCreate = (code.testCases && code.testCases.length > 0)
    ? code.testCases.map((tc, idx) => ({
        questionId: qDoc._id,
        questionNumber: qNum,
        input: tc.input !== undefined ? String(tc.input) : '',
        expectedOutput: tc.expectedOutput !== undefined ? String(tc.expectedOutput) : '',
        isHidden: tc.isHidden !== undefined ? tc.isHidden : (idx >= 2),
        explanation: tc.explanation || (idx < 2 ? 'Sample test case' : 'Hidden evaluation test case')
      }))
    : [
        { questionId: qDoc._id, questionNumber: qNum, input: code.sampleInput, expectedOutput: code.sampleOutput, isHidden: false, explanation: 'Visible test case' },
        { questionId: qDoc._id, questionNumber: qNum, input: code.sampleInput2 || code.sampleInput, expectedOutput: code.sampleOutput2 || code.sampleOutput, isHidden: true, explanation: 'Hidden test case' }
      ];

  await InterviewTestCase.create(testCasesToCreate);

  try {
    await QuestionRegistry.create({
      questionId: qDoc._id,
      source: bankType,
      title,
      normalizedTitle: normalizeQuestionText(title),
      fingerprint: generateFingerprint(title, problemStatement, moduleTitle, domain),
      category: moduleTitle,
      domain,
      isDuplicate: false,
      lastUsedAt: new Date()
    });
  } catch (_) {}

  return qDoc;
}

/**
 * Generate questions topic-by-topic for a course across all InterviewQuestion syllabus banks:
 * 1. INTERVIEW_ARENA
 * 2. MODULE_QUESTIONS
 * 3. MOCK_INTERVIEW
 * 4. DAILY_CHALLENGE
 */
async function generateAllSyllabusQuestionBanks(courseId, options = {}) {
  const { onProgress, forceRegenerate = false } = options;
  const course = await Course.findById(courseId);
  if (!course) throw new Error('Course not found');

  const syllabusData = await extractCourseSyllabusTopics(courseId);
  const { courseTitle, domain, modules } = syllabusData;
  const allModuleDocs = await Module.find({ courseId: course._id }).sort({ order: 1 });
  const moduleDocMap = new Map(allModuleDocs.map(m => [String(m._id), m]));

  // Track existing submissions so we NEVER delete or overwrite solved questions
  const submittedQIds = await InterviewSubmission.distinct('questionId');
  const protectedQIdSet = new Set(submittedQIds.map(id => id.toString()));

  const createdQuestions = {
    arena: 0,
    module: 0,
    mock: 0,
    daily: 0
  };

  const difficulties = ['Easy', 'Medium', 'Hard'];
  const existingFingerprints = new Set();

  for (let mIdx = 0; mIdx < modules.length; mIdx++) {
    const mod = modules[mIdx];
    const { moduleId, moduleOrder, moduleTitle, topics } = mod;
    const modDoc = moduleDocMap.get(String(moduleId));
    const scope = analyzeModuleScope(
      modDoc || { _id: moduleId, order: moduleOrder, title: moduleTitle, description: mod.description || '', topics },
      allModuleDocs,
      course
    );

    const signatureUnchanged = Boolean(
      !forceRegenerate &&
      modDoc &&
      modDoc.topicsSignature &&
      modDoc.topicsSignature === scope.topicsSignature
    );

    if (modDoc && !signatureUnchanged) {
      // Topics changed or first strict pass: prune stale unsubmitted bank questions for this module
      const staleIds = await InterviewQuestion.find({ moduleId }).distinct('_id');
      const deletableIds = staleIds.filter(id => !protectedQIdSet.has(String(id)));
      if (deletableIds.length > 0) {
        await InterviewTestCase.deleteMany({ questionId: { $in: deletableIds } });
        await InterviewQuestion.deleteMany({ _id: { $in: deletableIds } });
      }
    }

    for (let tIdx = 0; tIdx < topics.length; tIdx++) {
      const topic = topics[tIdx];
      const topicId = buildTopicId(moduleId, topic, tIdx);
      const diff = difficulties[(mIdx + tIdx) % difficulties.length];

      const banksForTopic = [
        { bankType: 'INTERVIEW_ARENA', diff, indexOffset: 1, key: 'arena' },
        { bankType: 'MODULE_QUESTIONS', diff, indexOffset: 2, key: 'module' },
        { bankType: 'MOCK_INTERVIEW', diff: diff === 'Easy' ? 'Medium' : diff, indexOffset: 3, key: 'mock' }
      ];

      for (const b of banksForTopic) {
        const existing = await InterviewQuestion.findOne({
          moduleId,
          topic,
          targetFeature: b.bankType
        }).select('_id').lean();

        if (!existing || (forceRegenerate && !protectedQIdSet.has(String(existing._id)))) {
          if (existing) {
            await InterviewTestCase.deleteMany({ questionId: existing._id });
            await InterviewQuestion.deleteOne({ _id: existing._id });
          }
          await createValidatedBankQuestion({
            bankType: b.bankType,
            courseId,
            courseTitle,
            domain,
            moduleId,
            moduleOrder,
            moduleTitle,
            moduleDescription: modDoc?.description || '',
            topic,
            topicId,
            difficulty: b.diff,
            baseTaskIndex: (tIdx % 12) + b.indexOffset,
            scope,
            existingFingerprints
          });
          createdQuestions[b.key]++;
        }
      }
    }

    // Ensure at least one DAILY_CHALLENGE question exists for this module
    if (topics.length > 0) {
      const existingDaily = await InterviewQuestion.findOne({
        moduleId,
        targetFeature: 'DAILY_CHALLENGE'
      }).select('_id').lean();

      if (!existingDaily || (forceRegenerate && !protectedQIdSet.has(String(existingDaily._id)))) {
        if (existingDaily) {
          await InterviewTestCase.deleteMany({ questionId: existingDaily._id });
          await InterviewQuestion.deleteOne({ _id: existingDaily._id });
        }
        const dailyTopic = topics[0];
        const dailyDiff = moduleOrder <= 3 ? 'Easy' : moduleOrder <= 10 ? 'Medium' : 'Hard';
        await createValidatedBankQuestion({
          bankType: 'DAILY_CHALLENGE',
          courseId,
          courseTitle,
          domain,
          moduleId,
          moduleOrder,
          moduleTitle,
          moduleDescription: modDoc?.description || '',
          topic: dailyTopic,
          topicId: buildTopicId(moduleId, dailyTopic, 0),
          difficulty: dailyDiff,
          baseTaskIndex: moduleOrder,
          scope,
          existingFingerprints
        });
        createdQuestions.daily++;
      }
    }

    if (modDoc) {
      await Module.findByIdAndUpdate(moduleId, {
        $set: { topics: scope.topics, topicsSignature: scope.topicsSignature }
      });
    }

    if (onProgress) {
      onProgress({
        moduleOrder,
        moduleTitle,
        percent: Math.round(((mIdx + 1) / modules.length) * 100)
      });
    }
  }

  return {
    success: true,
    courseTitle,
    domain,
    modulesCount: modules.length,
    createdQuestions
  };
}

/**
 * Generate full syllabus coverage report for Admin verification
 */
async function generateSyllabusCoverageReport(filterCourseId = null, filterDomain = null) {
  const query = {};
  if (filterCourseId) query._id = filterCourseId;

  const courses = await Course.find(query).sort({ title: 1 }).lean();
  const rows = [];

  let summary = {
    totalCourses: courses.length,
    totalModules: 0,
    totalTopics: 0,
    arenaQuestions: 0,
    moduleQuestions: 0,
    mockQuestions: 0,
    totalQuestions: 0,
    coveragePercentage: 100
  };

  for (const c of courses) {
    const dKey = (c.slug || c.domain || c.title).toLowerCase().replace(/[^a-z0-9]/g, '');
    let domainKey = 'java';
    if (dKey.includes('python')) domainKey = 'python';
    else if (dKey.includes('femn') || dKey.includes('mern') || dKey.includes('react') || dKey.includes('web')) domainKey = 'femnstack';
    else if (dKey.includes('selenium') || dKey.includes('test')) domainKey = 'selenium';
    else if (dKey.includes('java')) domainKey = 'java';

    if (filterDomain && filterDomain !== 'all' && domainKey !== filterDomain.toLowerCase()) {
      continue;
    }

    const modules = await Module.find({
      $or: [{ courseId: c._id }, { domain: domainKey }]
    }).sort({ order: 1 }).lean();

    summary.totalModules += modules.length;

    // Fetch all active questions for this course in a single query to eliminate N+1 queries
    const allCourseQuestions = await InterviewQuestion.find({
      $or: [
        { courseId: c._id },
        { domain: domainKey },
        { category: { $in: modules.map(m => m.title) } },
        { moduleId: { $in: modules.map(m => m._id) } }
      ],
      isActive: true
    }).select('moduleId category topic targetFeature difficulty').lean();

    // Index questions by moduleId/category and topic
    const qIndex = {};
    for (const q of allCourseQuestions) {
      const modKey = q.moduleId ? String(q.moduleId) : (q.category ? q.category.trim() : '');
      const topKey = q.topic ? q.topic.trim() : '';
      const key = `${modKey}:::${topKey}`;
      if (!qIndex[key]) qIndex[key] = [];
      qIndex[key].push(q);
      
      // Also index by just topic for fallback matching
      if (topKey && !qIndex[`*:::${topKey}`]) {
        qIndex[`*:::${topKey}`] = [];
      }
      if (topKey) qIndex[`*:::${topKey}`].push(q);
    }

    for (const m of modules) {
      let topics = Array.isArray(m.topics) && m.topics.length > 0 ? m.topics : [m.title];
      summary.totalTopics += topics.length;

      for (const t of topics) {
        const modKey = String(m._id);
        const catKey = m.title ? m.title.trim() : '';
        const topKey = t ? t.trim() : '';

        // Match questions for this topic
        const matchedQs = qIndex[`${modKey}:::${topKey}`] 
          || qIndex[`${catKey}:::${topKey}`]
          || qIndex[`*:::${topKey}`]
          || [];

        // Deduplicate matched questions by _id
        const uniqueQsMap = new Map();
        matchedQs.forEach(q => uniqueQsMap.set(String(q._id), q));
        const uniqueQs = Array.from(uniqueQsMap.values());

        const arenaCount = uniqueQs.filter(q => q.targetFeature === 'INTERVIEW_ARENA').length;
        const moduleCount = uniqueQs.filter(q => q.targetFeature === 'MODULE_QUESTIONS').length;
        const mockCount = uniqueQs.filter(q => q.targetFeature === 'MOCK_INTERVIEW').length;

        const totalForTopic = arenaCount + moduleCount + mockCount;
        summary.arenaQuestions += arenaCount;
        summary.moduleQuestions += moduleCount;
        summary.mockQuestions += mockCount;
        summary.totalQuestions += totalForTopic;

        const diffMap = { Easy: 0, Medium: 0, Hard: 0 };
        uniqueQs.forEach(q => {
          if (diffMap[q.difficulty] !== undefined) diffMap[q.difficulty]++;
        });

        rows.push({
          courseId: c._id,
          courseName: c.title,
          domain: domainKey,
          moduleId: m._id,
          moduleOrder: m.order,
          moduleTitle: m.title,
          topic: t,
          arenaCount,
          moduleCount,
          mockCount,
          totalCount: totalForTopic,
          difficultyDistribution: diffMap,
          validationStatus: totalForTopic > 0 ? 'verified' : 'pending'
        });
      }
    }
  }

  const coveredTopicsCount = rows.filter(r => r.totalCount > 0).length;
  summary.coveragePercentage = rows.length > 0 ? Math.round((coveredTopicsCount / rows.length) * 100) : 100;

  return {
    summary,
    rows
  };
}

module.exports = {
  generateAllSyllabusQuestionBanks,
  generateSyllabusCoverageReport
};
