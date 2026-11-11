const mongoose = require('mongoose');
const Course = require('../models/Course');
const Module = require('../models/Module');
const InterviewQuestion = require('../models/InterviewQuestion');
const InterviewTestCase = require('../models/InterviewTestCase');
const QuestionRegistry = require('../models/QuestionRegistry');
const InterviewSubmission = require('../models/InterviewSubmission');
const { extractCourseSyllabusTopics } = require('./syllabusTopicExtractorService');
const { generateFingerprint, normalizeQuestionText } = require('./questionRegistryService');
const {
  detectTechnology,
  detectIntegrationChallenge,
  getStarterCodeForTechnology
} = require('./technologyDetectionEngine');
const { generateQuestionSpec } = require('./questionSpecificationEngine');

/**
 * Global synchronized counter for question numbers to guarantee uniqueness
 */
let questionNumberCounter = 0;
let isInitialized = false;

async function initQuestionCounter() {
  if (!isInitialized) {
    const highest = await InterviewQuestion.findOne().sort({ questionNumber: -1 }).select('questionNumber').lean();
    questionNumberCounter = Math.max(highest?.questionNumber || 1000, 1000);
    isInitialized = true;
  }
}

async function getNextQuestionNumber() {
  await initQuestionCounter();
  questionNumberCounter += 1;
  return questionNumberCounter;
}

/**
 * Generate starter code and solutions tailored to the syllabus domain & technology
 */
function buildCodeArtifacts(domainKey, topic, moduleTitle = '', courseTitle = '', type = 'arena', diff = 'Easy', taskIndex = 1) {
  const detectedTech = detectTechnology({ topic, moduleTitle, courseTitle, domainKey });
  const integrationInfo = detectIntegrationChallenge(topic, moduleTitle, domainKey);

  const effectiveTechnology = integrationInfo.isIntegration ? integrationInfo.technology : detectedTech.name;
  const effectiveLang = detectedTech.language || (domainKey.includes('java') ? 'java' : domainKey.includes('python') ? 'python' : 'javascript');
  const effectiveCompiler = detectedTech.compiler;
  const effectiveEvaluationMethod = detectedTech.evaluationMethod || 'coding';

  const spec = generateQuestionSpec({
    title: `${topic} (${diff})`,
    topic,
    moduleTitle,
    courseTitle,
    domain: domainKey,
    taskIndex: taskIndex || 1,
    difficulty: diff || 'Easy'
  });

  const starterStr = (spec.starterCode && spec.starterCode.trim().length > 10)
    ? spec.starterCode
    : getStarterCodeForTechnology(effectiveTechnology, effectiveLang, topic);

  return {
    technology: effectiveTechnology,
    language: effectiveLang,
    compiler: effectiveCompiler,
    evaluationMethod: effectiveEvaluationMethod,
    starterCode: { [effectiveLang]: starterStr },
    referenceSolution: spec.referenceSolution,
    problemStatement: spec.problemStatement,
    inputFormat: spec.inputFormat,
    outputFormat: spec.outputFormat,
    constraints: spec.constraints,
    sampleInput: spec.sampleInput,
    sampleOutput: spec.sampleOutput,
    sampleInput2: spec.sampleInput2,
    sampleOutput2: spec.sampleOutput2,
    explanation: spec.explanation,
    testCases: spec.testCases
  };
}

/**
 * Generate questions topic-by-topic for a course across all 3 question banks:
 * 1. Interview Arena
 * 2. Module Questions
 * 3. Mock Interview
 */
async function generateAllSyllabusQuestionBanks(courseId, options = {}) {
  const { onProgress } = options;
  const syllabusData = await extractCourseSyllabusTopics(courseId);
  const { courseTitle, domain, modules } = syllabusData;

  // Track existing submissions so we NEVER delete or overwrite solved questions
  const submittedQIds = await InterviewSubmission.distinct('questionId');
  const protectedQIdSet = new Set(submittedQIds.map(id => id.toString()));

  const createdQuestions = {
    arena: 0,
    module: 0,
    mock: 0
  };

  const difficulties = ['Easy', 'Medium', 'Hard'];

  for (let mIdx = 0; mIdx < modules.length; mIdx++) {
    const mod = modules[mIdx];
    const { moduleId, moduleOrder, moduleTitle, topics } = mod;

    for (let tIdx = 0; tIdx < topics.length; tIdx++) {
      const topic = topics[tIdx];
      const diff = difficulties[(mIdx + tIdx) % difficulties.length];

      // ─────────────────────────────────────────────────────────────
      // BANK 1: INTERVIEW ARENA QUESTION
      // ─────────────────────────────────────────────────────────────
      const existingArena = await InterviewQuestion.findOne({
        moduleId,
        topic,
        targetFeature: 'INTERVIEW_ARENA'
      });

      if (!existingArena) {
        const qNum = await getNextQuestionNumber();
        const code = buildCodeArtifacts(domain, topic, moduleTitle, courseTitle, 'arena', diff, (tIdx % 15) + 1);
        const title = `Interview Arena: ${topic} (${courseTitle})`;

        const problemStatement = `### Technical Problem Statement\n` +
          `In technical software interviews for **${courseTitle}**, a firm grasp of **${topic}** is critical.\n\n` +
          `**Challenge Context**:\n` +
          `${code.problemStatement.split('\n\n')[1] || code.problemStatement}\n\n` +
          `**Syllabus Focus**:\n` +
          `- Course: ${courseTitle}\n` +
          `- Technology: ${code.technology}\n` +
          `- Module: ${moduleTitle}\n` +
          `- Exact Topic: ${topic}\n` +
          `- Interview Difficulty: ${diff}`;

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
          level: diff === 'Easy' ? 2 : diff === 'Medium' ? 5 : 8,
          difficulty: diff,
          problemStatement,
          inputFormat: code.inputFormat,
          outputFormat: code.outputFormat,
          constraints: code.constraints,
          examples: [
            { input: code.sampleInput, output: code.sampleOutput, explanation: code.explanation },
            { input: code.sampleInput2 || 'ready', output: code.sampleOutput2 || 'Solved: READY', explanation: 'Secondary execution branch' }
          ],
          starterCode: code.starterCode,
          hints: [
            `Analyze the input structure required for ${topic}.`,
            `Ensure edge cases such as empty input or boundaries are handled cleanly.`
          ],
          xp: diff === 'Easy' ? 20 : diff === 'Medium' ? 35 : 50,
          courseId,
          moduleId,
          topic,
          targetFeature: 'INTERVIEW_ARENA',
          questionBankType: 'INTERVIEW_ARENA',
          verificationStatus: 'verified',
          referenceSolution: code.referenceSolution,
          explanation: code.explanation || `Optimal solution for ${topic} leveraging idiomatic ${domain} language features.`,
          tags: [domain, 'interview-arena', topic.toLowerCase().replace(/[^a-z0-9]/g, '-'), diff.toLowerCase()],
          isActive: true
        });

        // Insert test cases from specification engine
        const testCasesToCreate = (code.testCases && code.testCases.length > 0)
          ? code.testCases.map((tc, idx) => ({
              questionId: qDoc._id,
              questionNumber: qNum,
              input: tc.input || '',
              expectedOutput: tc.expectedOutput || '',
              isHidden: tc.isHidden !== undefined ? tc.isHidden : (idx >= 2),
              explanation: tc.explanation || (idx < 2 ? 'Sample test case' : 'Evaluation test case')
            }))
          : [
              { questionId: qDoc._id, questionNumber: qNum, input: code.sampleInput, expectedOutput: code.sampleOutput, isHidden: false, explanation: 'Visible test case' },
              { questionId: qDoc._id, questionNumber: qNum, input: code.sampleInput2 || 'ready', expectedOutput: code.sampleOutput2 || 'Solved: READY', isHidden: true, explanation: 'Hidden boundary test case' }
            ];

        await InterviewTestCase.create(testCasesToCreate);

        createdQuestions.arena++;
      }

      // ─────────────────────────────────────────────────────────────
      // BANK 2: MODULE QUESTIONS (Curriculum Assessment)
      // ─────────────────────────────────────────────────────────────
      const existingModuleQ = await InterviewQuestion.findOne({
        moduleId,
        topic,
        targetFeature: 'MODULE_QUESTIONS'
      });

      if (!existingModuleQ) {
        const qNum = await getNextQuestionNumber();
        const code = buildCodeArtifacts(domain, topic, moduleTitle, courseTitle, 'module', diff, ((tIdx + 1) % 15) + 1);
        const title = `Module Assessment: ${topic} [${moduleTitle}]`;

        const problemStatement = `### Module Knowledge & Practical Assessment\n` +
          `This assessment evaluates your direct mastery of **${topic}** under syllabus **${moduleTitle}**.\n\n` +
          `**Assessment Objective**:\n` +
          `${code.problemStatement.split('\n\n')[1] || code.problemStatement}\n\n` +
          `**Curriculum Details**:\n` +
          `- Course: ${courseTitle}\n` +
          `- Technology: ${code.technology}\n` +
          `- Module [${moduleOrder}]: ${moduleTitle}\n` +
          `- Syllabus Topic: ${topic}\n` +
          `- Evaluation Difficulty: ${diff}`;

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
          level: diff === 'Easy' ? 1 : diff === 'Medium' ? 4 : 7,
          difficulty: diff,
          problemStatement,
          inputFormat: code.inputFormat,
          outputFormat: code.outputFormat,
          constraints: code.constraints,
          examples: [
            { input: code.sampleInput, output: code.sampleOutput, explanation: code.explanation },
            { input: code.sampleInput2 || 'ready', output: code.sampleOutput2 || 'Solved: READY', explanation: 'Secondary execution test' }
          ],
          starterCode: code.starterCode,
          hints: [
            `Review the module notes for ${topic}.`,
            `Verify function signatures and expected output format.`
          ],
          xp: diff === 'Easy' ? 15 : diff === 'Medium' ? 25 : 35,
          courseId,
          moduleId,
          topic,
          targetFeature: 'MODULE_QUESTIONS',
          questionBankType: 'MODULE',
          questionType: 'coding',
          verificationStatus: 'verified',
          referenceSolution: code.referenceSolution,
          explanation: code.explanation || `Module evaluation benchmark for ${topic}.`,
          tags: [domain, 'module-questions', `mod-${moduleOrder}`, topic.toLowerCase().replace(/[^a-z0-9]/g, '-')],
          isActive: true
        });

        const testCasesToCreate = (code.testCases && code.testCases.length > 0)
          ? code.testCases.map((tc, idx) => ({
              questionId: qDoc._id,
              questionNumber: qNum,
              input: tc.input || '',
              expectedOutput: tc.expectedOutput || '',
              isHidden: tc.isHidden !== undefined ? tc.isHidden : (idx >= 2),
              explanation: tc.explanation || (idx < 2 ? 'Module sample test case' : 'Module evaluation test case')
            }))
          : [
              { questionId: qDoc._id, questionNumber: qNum, input: code.sampleInput, expectedOutput: code.sampleOutput, isHidden: false, explanation: 'Module test case' },
              { questionId: qDoc._id, questionNumber: qNum, input: code.sampleInput2 || 'test', expectedOutput: code.sampleOutput2 || 'Solved: READY', isHidden: true, explanation: 'Hidden verification' }
            ];

        await InterviewTestCase.create(testCasesToCreate);

        createdQuestions.module++;
      }

      // ─────────────────────────────────────────────────────────────
      // BANK 3: MOCK INTERVIEW QUESTION (Scenario & Architecture)
      // ─────────────────────────────────────────────────────────────
      const existingMock = await InterviewQuestion.findOne({
        moduleId,
        topic,
        targetFeature: 'MOCK_INTERVIEW'
      });

      if (!existingMock) {
        const qNum = await getNextQuestionNumber();
        const mockDiff = diff === 'Easy' ? 'Medium' : diff; // Mock interviews focus on Medium/Hard
        const code = buildCodeArtifacts(domain, topic, moduleTitle, courseTitle, 'mock', mockDiff, ((tIdx + 2) % 15) + 1);
        const title = `Mock Interview Scenario: ${topic} (${courseTitle})`;

        const problemStatement = `### Real-World Mock Interview Scenario\n\n` +
          `**Interviewer Prompt**:\n` +
          `You are in an engineering interview for a technical role in **${courseTitle}**. ` +
          `The interviewer asks you to solve an enterprise-scale challenge involving **${topic}** in **${code.technology}**.\n\n` +
          `**Scenario Requirements**:\n` +
          `Explain and implement a solution managing **${topic}** within **${moduleTitle}**. Address error recovery, performance under load, and architectural trade-offs.\n\n` +
          `**Candidate Deliverables**:\n` +
          `- Clean, production-grade code implementation\n` +
          `- Proper error boundary handling\n` +
          `- Verified execution output matching the test contract`;

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
          level: mockDiff === 'Medium' ? 6 : 9,
          difficulty: mockDiff,
          problemStatement,
          inputFormat: code.inputFormat,
          outputFormat: code.outputFormat,
          constraints: code.constraints,
          examples: [
            { input: code.sampleInput, output: code.sampleOutput, explanation: code.explanation },
            { input: code.sampleInput2 || 'ready', output: code.sampleOutput2 || 'Solved: READY', explanation: 'Secondary test branch' }
          ],
          starterCode: code.starterCode,
          hints: [
            `Focus on production stability and trade-offs for ${topic}.`,
            `Structure your code with defensive validation.`
          ],
          xp: mockDiff === 'Medium' ? 30 : 50,
          courseId,
          moduleId,
          topic,
          targetFeature: 'MOCK_INTERVIEW',
          questionBankType: 'MOCK_INTERVIEW',
          questionType: 'scenario',
          verificationStatus: 'verified',
          referenceSolution: code.referenceSolution,
          explanation: code.explanation || `Comprehensive mock interview rationale and design architecture for ${topic}.`,
          tags: [domain, 'mock-interview', topic.toLowerCase().replace(/[^a-z0-9]/g, '-'), mockDiff.toLowerCase()],
          isActive: true
        });

        const testCasesToCreate = (code.testCases && code.testCases.length > 0)
          ? code.testCases.map((tc, idx) => ({
              questionId: qDoc._id,
              questionNumber: qNum,
              input: tc.input || '',
              expectedOutput: tc.expectedOutput || '',
              isHidden: tc.isHidden !== undefined ? tc.isHidden : (idx >= 2),
              explanation: tc.explanation || (idx < 2 ? 'Scenario test case' : 'Scenario evaluation test case')
            }))
          : [
              { questionId: qDoc._id, questionNumber: qNum, input: code.sampleInput, expectedOutput: code.sampleOutput, isHidden: false, explanation: 'Scenario test case' },
              { questionId: qDoc._id, questionNumber: qNum, input: code.sampleInput2 || 'live-traffic', expectedOutput: code.sampleOutput2 || 'Solved: READY', isHidden: true, explanation: 'Hidden load case' }
            ];

        await InterviewTestCase.create(testCasesToCreate);

        createdQuestions.mock++;
      }
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
