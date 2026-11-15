/**
 * STACK QUEUE — Adaptive Question Generator Service
 * 
 * Case A – Compiler Available: Generates coding questions with test cases, reference solutions, input/output formats.
 * Case B – No Compiler Available: Generates 4-option MCQs strictly from syllabus with secure backend correct answer.
 */

const mongoose = require('mongoose');
const Course = require('../models/Course');
const Module = require('../models/Module');
const InterviewQuestion = require('../models/InterviewQuestion');
const InterviewTestCase = require('../models/InterviewTestCase');
const QuestionRegistry = require('../models/QuestionRegistry');
const { getCourseCompilerEnvironment } = require('../utils/compilerEnvironmentDetector');
const { allocateQuestionNumbers } = require('./questionNumberAllocator');
const { getStarterCodeForLanguage } = require('../utils/domainCompilerMapping');

/**
 * Domain-specific MCQ Syllabus Banks for Non-Compiler Courses
 * Example: UI UX, Web Designing, Agile, Product Management, etc.
 */
const DOMAIN_MCQ_BANKS = {
  uiux: [
    {
      topic: 'Design Thinking & UX Foundations',
      title: 'Five Stages of Design Thinking',
      problemStatement: 'In the Stanford d.school Design Thinking framework, which of the following represents the correct sequential order of the five stages?',
      options: [
        { optionId: 'A', text: 'Empathize → Define → Ideate → Prototype → Test' },
        { optionId: 'B', text: 'Define → Empathize → Prototype → Ideate → Test' },
        { optionId: 'C', text: 'Ideate → Empathize → Define → Test → Prototype' },
        { optionId: 'D', text: 'Prototype → Test → Define → Ideate → Empathize' }
      ],
      correctAnswer: 'A',
      explanation: 'The standard Design Thinking methodology starts with user Empathy, followed by Defining the problem, Ideating creative solutions, building low-fidelity Prototypes, and Testing with real users.',
      difficulty: 'Easy',
      points: 10
    },
    {
      topic: 'Accessibility & WCAG Standards',
      title: 'WCAG Minimum Color Contrast Ratio',
      problemStatement: 'According to WCAG 2.1 Level AA requirements, what is the minimum color contrast ratio required between normal body text and its background?',
      options: [
        { optionId: 'A', text: '3.0 : 1' },
        { optionId: 'B', text: '4.5 : 1' },
        { optionId: 'C', text: '7.0 : 1' },
        { optionId: 'D', text: '2.5 : 1' }
      ],
      correctAnswer: 'B',
      explanation: 'WCAG 2.1 AA mandates a minimum contrast ratio of 4.5:1 for standard text (below 18pt or 14pt bold). Large text requires a minimum of 3.0:1.',
      difficulty: 'Medium',
      points: 10
    },
    {
      topic: 'Information Architecture & Wireframing',
      title: 'Card Sorting Technique in UX',
      problemStatement: 'Which research method is specifically employed by Information Architects to determine the optimal navigation menu hierarchy and content categorization based on user mental models?',
      options: [
        { optionId: 'A', text: 'A/B Split Testing' },
        { optionId: 'B', text: 'Eye Tracking Heatmaps' },
        { optionId: 'C', text: 'Card Sorting (Open and Closed)' },
        { optionId: 'D', text: 'First Click Testing' }
      ],
      correctAnswer: 'C',
      explanation: 'Card sorting is an established UX research method where participants organize topics into categories, helping architects design intuitive navigation structures.',
      difficulty: 'Medium',
      points: 10
    },
    {
      topic: 'Design Systems & Tokens',
      title: 'Design Tokens Architecture',
      problemStatement: 'In modern design system architecture (e.g., Figma & Design Tokens), what is the primary purpose of defining semantic design tokens?',
      options: [
        { optionId: 'A', text: 'To encrypt vector SVG assets before uploading to cloud storage' },
        { optionId: 'B', text: 'To store design decisions (colors, spacing, typography) as reusable, platform-agnostic variables across web, iOS, and Android' },
        { optionId: 'C', text: 'To calculate user conversion rates on landing pages automatically' },
        { optionId: 'D', text: 'To compress PNG images during design system builds' }
      ],
      correctAnswer: 'B',
      explanation: 'Design tokens are atomic design decisions represented as platform-agnostic key-value pairs (variables), enabling seamless sync between design tools and multi-platform codebases.',
      difficulty: 'Hard',
      points: 15
    },
    {
      topic: 'Interaction Design & Usability',
      title: 'Fitts\'s Law in UI Layout',
      problemStatement: 'According to Fitts\'s Law, which factor directly reduces the time required for a user to rapidly move to and target an interactive UI element (such as a Call-to-Action button)?',
      options: [
        { optionId: 'A', text: 'Decreasing target size and increasing distance from the user cursor' },
        { optionId: 'B', text: 'Increasing target size and decreasing distance from the user current focal position' },
        { optionId: 'C', text: 'Adding complex 3D hover animations to the button' },
        { optionId: 'D', text: 'Placing the button inside a nested dropdown menu' }
      ],
      correctAnswer: 'B',
      explanation: 'Fitts\'s Law states that the time to reach a target is a function of distance to the target and width of the target. Larger targets closer to the user\'s pointer are clicked significantly faster.',
      difficulty: 'Medium',
      points: 10
    },
    {
      topic: 'Typography & Visual Hierarchy',
      title: 'Modular Scale in Typography',
      problemStatement: 'Why do UX/UI designers utilize a modular typographical scale (such as Major Third 1.25 or Golden Ratio 1.618) across digital interfaces?',
      options: [
        { optionId: 'A', text: 'To establish a visually harmonious, mathematically consistent typographic hierarchy between headings, body, and captions' },
        { optionId: 'B', text: 'To prevent fonts from rendering on high-DPI screens' },
        { optionId: 'C', text: 'To force all text elements to have identical pixel heights' },
        { optionId: 'D', text: 'To eliminate the need for responsive font sizes across mobile screens' }
      ],
      correctAnswer: 'A',
      explanation: 'A modular scale establishes mathematical harmony across different type sizes, creating an intuitive visual hierarchy that aids user readability and scannability.',
      difficulty: 'Easy',
      points: 10
    },
    {
      topic: 'User Research & Testing',
      title: 'Heuristic Evaluation Methodology',
      problemStatement: 'What characterizes Jakob Nielsen\'s "Heuristic Evaluation" method compared to a traditional Moderated Usability Test?',
      options: [
        { optionId: 'A', text: 'It is conducted by usability experts evaluating an interface against recognized usability principles rather than end-users' },
        { optionId: 'B', text: 'It requires at least 100 actual customers to complete quantitative surveys' },
        { optionId: 'C', text: 'It only tests backend database latency' },
        { optionId: 'D', text: 'It evaluates source code compilation warnings' }
      ],
      correctAnswer: 'A',
      explanation: 'Heuristic evaluation is an expert review method where UX evaluators inspect an interface against established heuristics (e.g., Nielsen\'s 10 Usability Heuristics).',
      difficulty: 'Medium',
      points: 10
    },
    {
      topic: 'Mobile & Responsive Design',
      title: 'Mobile-First Design Strategy',
      problemStatement: 'What is the foundational philosophy behind the "Mobile-First" responsive design paradigm advocated by Luke Wroblewski?',
      options: [
        { optionId: 'A', text: 'Building for mobile screens forces focus on core content, essential features, and progressive enhancement for larger screens' },
        { optionId: 'B', text: 'Desktop web pages should be discontinued entirely in favor of mobile apps' },
        { optionId: 'C', text: 'Touch gestures must replace all keyboard navigation on desktop websites' },
        { optionId: 'D', text: 'Mobile devices should only display static text without images or styling' }
      ],
      correctAnswer: 'A',
      explanation: 'Mobile-first design prioritizes essential user goals within constrained mobile viewports first, then progressively enhances layout and features as screen real estate expands.',
      difficulty: 'Easy',
      points: 10
    }
  ]
};

/**
 * Generates an MCQ question object adhering strictly to the 4-option specification.
 */
function createMcqQuestionRecord({
  questionNumber,
  courseId,
  moduleId = null,
  topic = 'General Concept',
  title,
  problemStatement,
  options,
  correctAnswer,
  explanation,
  difficulty = 'Easy',
  points = 10,
  domain = 'general'
}) {
  // Enforce exactly four options
  if (!Array.isArray(options) || options.length !== 4) {
    throw new Error('Every MCQ must contain exactly four options (A, B, C, D).');
  }

  // Validate option IDs
  const validOptionIds = ['A', 'B', 'C', 'D'];
  const formattedOptions = options.map((opt, idx) => ({
    optionId: validOptionIds[idx],
    text: String(opt.text || opt).trim()
  }));

  if (!validOptionIds.includes(correctAnswer)) {
    throw new Error('Correct answer must be one of A, B, C, or D.');
  }

  return {
    questionNumber,
    courseId,
    moduleId,
    topic,
    title: title || `${topic} Question`,
    problemStatement: String(problemStatement).trim(),
    questionType: 'mcq',
    options: formattedOptions,
    correctAnswer,
    explanation: String(explanation || '').trim(),
    difficulty,
    points: Number(points) || 10,
    domain: domain.toLowerCase(),
    category: 'Multiple Choice Assessment',
    level: difficulty === 'Hard' ? 3 : difficulty === 'Medium' ? 2 : 1,
    verificationStatus: 'verified',
    isActive: true
  };
}

/**
 * Generates coding question records adhering strictly to Case A.
 */
async function createCodingQuestionRecord({
  questionNumber,
  courseId,
  moduleId = null,
  topic,
  title,
  problemStatement,
  description = '',
  inputFormat = '',
  outputFormat = '',
  constraints = '',
  sampleInput = '',
  sampleOutput = '',
  hiddenTestCases = [],
  referenceSolution = '',
  language = 'java',
  compiler = 'Java (JDK 22)',
  difficulty = 'Easy',
  points = 15,
  domain = 'java'
}) {
  const starterCode = getStarterCodeForLanguage(language, domain, topic);

  const doc = new InterviewQuestion({
    questionNumber,
    courseId,
    moduleId,
    topic,
    title: title || `${topic} Problem`,
    problemStatement: problemStatement || `Implement a solution for ${topic}.\n\n${description}`,
    inputFormat,
    outputFormat,
    constraints,
    examples: [{
      input: sampleInput,
      output: sampleOutput,
      explanation: 'Sample evaluation test case.'
    }],
    starterCode: {
      [language]: starterCode
    },
    referenceSolution,
    questionType: 'coding',
    programmingLanguage: language,
    compiler,
    evaluationMethod: 'coding',
    difficulty,
    points: Number(points) || 15,
    xp: Number(points) || 15,
    domain: domain.toLowerCase(),
    category: 'Coding Practice',
    level: difficulty === 'Hard' ? 3 : difficulty === 'Medium' ? 2 : 1,
    verificationStatus: 'verified',
    isActive: true
  });

  const savedQ = await doc.save();

  // Save sample test case (visible)
  if (sampleInput || sampleOutput) {
    await InterviewTestCase.create({
      questionId: savedQ._id,
      input: sampleInput,
      expectedOutput: sampleOutput,
      isHidden: false,
      explanation: 'Public sample test case'
    });
  }

  // Save hidden test cases
  for (let i = 0; i < hiddenTestCases.length; i++) {
    const htc = hiddenTestCases[i];
    await InterviewTestCase.create({
      questionId: savedQ._id,
      input: htc.input || '',
      expectedOutput: htc.expectedOutput || '',
      isHidden: true,
      explanation: `Hidden test case #${i + 1}`
    });
  }

  return savedQ;
}

/**
 * Automatically seeds or generates adaptive questions for a course
 * by strictly checking its compiler environment first.
 */
async function generateAdaptiveQuestionsForCourse(courseId, options = {}) {
  const course = await Course.findById(courseId).lean();
  if (!course) {
    throw new Error('Course not found');
  }

  const env = getCourseCompilerEnvironment(course);
  const results = {
    courseId: course._id,
    courseTitle: course.title,
    environment: env,
    generatedCount: 0,
    questionType: env.format
  };

  // ─────────────────────────────────────────────────────────────
  // CASE B: NO COMPILER AVAILABLE → GENERATE 4-OPTION MCQS
  // ─────────────────────────────────────────────────────────────
  if (!env.hasCompiler) {
    console.log(`[AdaptiveGenerator] Course "${course.title}" has NO compiler (${env.reason}). Generating 4-Option MCQs.`);

    // Check existing questions count for this course
    const existingCount = await InterviewQuestion.countDocuments({ courseId: course._id, questionType: 'mcq' });
    if (existingCount >= 8 && !options.force) {
      results.generatedCount = existingCount;
      results.message = `Course already has ${existingCount} MCQs configured.`;
      return results;
    }

    const domainKey = (course.domain || course.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    let mcqTemplates = DOMAIN_MCQ_BANKS.uiux; // Default robust set for design / non-compiler
    if (domainKey.includes('ui') || domainKey.includes('ux') || domainKey.includes('design')) {
      mcqTemplates = DOMAIN_MCQ_BANKS.uiux;
    }

    const startQNum = await allocateQuestionNumbers(mcqTemplates.length);

    const createdQuestions = [];
    for (let i = 0; i < mcqTemplates.length; i++) {
      const tmpl = mcqTemplates[i];
      const qNum = startQNum + i;

      const qData = createMcqQuestionRecord({
        questionNumber: qNum,
        courseId: course._id,
        topic: tmpl.topic,
        title: tmpl.title,
        problemStatement: tmpl.problemStatement,
        options: tmpl.options,
        correctAnswer: tmpl.correctAnswer,
        explanation: tmpl.explanation,
        difficulty: tmpl.difficulty,
        points: tmpl.points || 10,
        domain: course.domain || 'UI/UX'
      });

      const qDoc = await InterviewQuestion.create(qData);
      createdQuestions.push(qDoc);
    }

    results.generatedCount = createdQuestions.length;
    results.message = `Generated ${createdQuestions.length} multiple-choice questions with 4 options each.`;
    return results;
  }

  // ─────────────────────────────────────────────────────────────
  // CASE A: COMPILER AVAILABLE → GENERATE CODING PROBLEMS
  // ─────────────────────────────────────────────────────────────
  console.log(`[AdaptiveGenerator] Course "${course.title}" HAS a compiler (${env.compilerName}). Generating Coding Problems.`);

  const existingCodingCount = await InterviewQuestion.countDocuments({ courseId: course._id, questionType: 'coding' });
  if (existingCodingCount >= 5 && !options.force) {
    results.generatedCount = existingCodingCount;
    results.message = `Course already has ${existingCodingCount} coding problems configured.`;
    return results;
  }

  // Predefined coding seeds for compiler courses
  const codingTemplates = [
    {
      topic: `${course.title} Logic: String & Array Processing`,
      title: 'Valid Data Element Processor',
      problemStatement: `Write a program that reads an integer N followed by N elements, and outputs the sum of all positive integers.`,
      description: 'Implement an algorithm that filters and calculates the summation of positive elements.',
      inputFormat: 'The first line contains integer N. The next line contains N space-separated integers.',
      outputFormat: 'Print a single integer representing the sum.',
      constraints: '1 <= N <= 1000\n-10000 <= Elements <= 10000',
      sampleInput: '5\n1 -2 3 4 -5',
      sampleOutput: '8',
      hiddenTestCases: [
        { input: '3\n10 20 30', expectedOutput: '60' },
        { input: '4\n-1 -2 -3 -4', expectedOutput: '0' },
        { input: '1\n99', expectedOutput: '99' }
      ],
      difficulty: 'Easy',
      points: 15
    },
    {
      topic: `${course.title} Algorithmic Logic: Frequency Counting`,
      title: 'Target Character Frequency Counter',
      problemStatement: `Write a program that takes a string S and outputs the most frequent non-space character in lowercase. If multiple have same frequency, print the lexicographically smallest.`,
      description: 'Count frequencies and output the highest frequency character.',
      inputFormat: 'A single string S.',
      outputFormat: 'Print the most frequent character.',
      constraints: '1 <= length(S) <= 10000',
      sampleInput: 'stack queue developer',
      sampleOutput: 'e',
      hiddenTestCases: [
        { input: 'hello world', expectedOutput: 'l' },
        { input: 'banana', expectedOutput: 'a' }
      ],
      difficulty: 'Medium',
      points: 20
    }
  ];

  const startQNum = await allocateQuestionNumbers(codingTemplates.length);
  const createdCoding = [];

  for (let i = 0; i < codingTemplates.length; i++) {
    const tmpl = codingTemplates[i];
    const qDoc = await createCodingQuestionRecord({
      questionNumber: startQNum + i,
      courseId: course._id,
      topic: tmpl.topic,
      title: tmpl.title,
      problemStatement: tmpl.problemStatement,
      description: tmpl.description,
      inputFormat: tmpl.inputFormat,
      outputFormat: tmpl.outputFormat,
      constraints: tmpl.constraints,
      sampleInput: tmpl.sampleInput,
      sampleOutput: tmpl.sampleOutput,
      hiddenTestCases: tmpl.hiddenTestCases,
      referenceSolution: tmpl.referenceSolution || '',
      language: env.language || 'java',
      compiler: env.compilerName,
      difficulty: tmpl.difficulty,
      points: tmpl.points,
      domain: course.domain || 'General'
    });
    createdCoding.push(qDoc);
  }

  results.generatedCount = createdCoding.length;
  results.message = `Generated ${createdCoding.length} coding questions with test cases and execution compiler.`;
  return results;
}

module.exports = {
  createMcqQuestionRecord,
  createCodingQuestionRecord,
  generateAdaptiveQuestionsForCourse,
  DOMAIN_MCQ_BANKS
};
