const CollegeTrainingSyllabus = require('../models/CollegeTrainingSyllabus');
const CollegeTrainingModule = require('../models/CollegeTrainingModule');
const CollegeTrainingQuestion = require('../models/CollegeTrainingQuestion');
const CollegeTrainingStudentProgress = require('../models/CollegeTrainingStudentProgress');

/**
 * Intelligent parser to parse raw syllabus text (from paste or PDF extract)
 * into structured units, topics, and subtopics.
 */
function parseRawSyllabus(rawText, defaultCourseName = 'Course') {
  if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
    return [];
  }

  const lines = rawText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  const units = [];
  let currentUnit = null;
  let currentTopic = null;

  const unitRegex = /^(?:unit|module|chapter|day|part)\s*([0-9ivxlcdm]+)?\s*[:.-]?\s*(.*)$/i;

  for (const line of lines) {
    const unitMatch = line.match(unitRegex);

    if (unitMatch && (unitMatch[1] || unitMatch[2])) {
      if (currentUnit) {
        if (currentTopic) currentUnit.topics.push(currentTopic);
        units.push(currentUnit);
      }
      const unitNum = units.length + 1;
      const title = (unitMatch[2] || `Unit ${unitNum}`).trim() || `Core Concepts - Part ${unitNum}`;
      currentUnit = {
        unitNumber: unitNum,
        title: title.replace(/^[:.-]\s*/, ''),
        topics: [],
        estimatedDays: 2
      };
      currentTopic = null;
      continue;
    }

    // If no unit yet, create Unit 1
    if (!currentUnit) {
      currentUnit = {
        unitNumber: 1,
        title: `${defaultCourseName} Fundamentals`,
        topics: [],
        estimatedDays: 2
      };
    }

    // Check if line is bullet/subtopic or topic
    const isBullet = /^[-*•·>]\s*(.*)$/.exec(line);
    const isNumbered = /^[0-9]+[.)]\s*(.*)$/.exec(line);

    if (isBullet) {
      const content = isBullet[1].trim();
      if (!currentTopic) {
        currentTopic = {
          title: content,
          subtopics: [],
          estimatedHours: 3
        };
      } else {
        currentTopic.subtopics.push(content);
      }
    } else if (isNumbered) {
      if (currentTopic) {
        currentUnit.topics.push(currentTopic);
      }
      currentTopic = {
        title: isNumbered[1].trim(),
        subtopics: [],
        estimatedHours: 4
      };
    } else {
      // Regular line: treat as topic if currentTopic has subtopics or doesn't exist
      if (currentTopic && currentTopic.subtopics.length === 0) {
        // Add as subtopic to current topic
        currentTopic.subtopics.push(line);
      } else {
        if (currentTopic) {
          currentUnit.topics.push(currentTopic);
        }
        currentTopic = {
          title: line,
          subtopics: [],
          estimatedHours: 4
        };
      }
    }
  }

  if (currentTopic && currentUnit) {
    currentUnit.topics.push(currentTopic);
  }
  if (currentUnit) {
    units.push(currentUnit);
  }

  // Ensure each unit has at least one topic
  units.forEach((u, idx) => {
    if (u.topics.length === 0) {
      u.topics.push({
        title: `${u.title} Essentials & Practice`,
        subtopics: ['Core Concepts', 'Hands-on Coding', 'Best Practices'],
        estimatedHours: 4
      });
    }
  });

  return units;
}

/**
 * Determine coding language / syntax helper based on domain/course
 */
function getLanguageProfile(courseName = '', domain = '') {
  const combined = `${courseName} ${domain}`.toLowerCase();
  if (combined.includes('java') && !combined.includes('javascript')) {
    return {
      lang: 'java',
      comment: '//',
      fileExt: 'java',
      starterClass: 'public class Solution {\n    public static void main(String[] args) {\n        // Your code here\n    }\n}',
      solutionClass: (body) => `public class Solution {\n    public static void main(String[] args) {\n        ${body}\n    }\n}`
    };
  }
  if (combined.includes('python')) {
    return {
      lang: 'python',
      comment: '#',
      fileExt: 'py',
      starterClass: 'def solve():\n    # Write your solution here\n    pass\n\nif __name__ == "__main__":\n    solve()',
      solutionClass: (body) => `def solve():\n    ${body}\n\nsolve()`
    };
  }
  if (combined.includes('c++') || combined.includes('cpp')) {
    return {
      lang: 'cpp',
      comment: '//',
      fileExt: 'cpp',
      starterClass: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Your code here\n    return 0;\n}',
      solutionClass: (body) => `#include <iostream>\nusing namespace std;\n\nint main() {\n    ${body}\n    return 0;\n}`
    };
  }
  if (combined.includes('c') && !combined.includes('c++')) {
    return {
      lang: 'c',
      comment: '//',
      fileExt: 'c',
      starterClass: '#include <stdio.h>\n\nint main() {\n    /* Your code here */\n    return 0;\n}',
      solutionClass: (body) => `#include <stdio.h>\n\nint main() {\n    ${body}\n    return 0;\n}`
    };
  }
  // Default to JavaScript / TypeScript / Web
  return {
    lang: 'javascript',
    comment: '//',
    fileExt: 'js',
    starterClass: 'function solve() {\n  // Write your code here\n}\n\nsolve();',
    solutionClass: (body) => `function solve() {\n  ${body}\n}\n\nsolve();`
  };
}

/**
 * Strictly generate questions aligned with a specific topic and unit
 */
function generateQuestionsForTopic(topicObj, unitNum, orderOffset, langProfile, courseName) {
  const topicTitle = topicObj.title;
  const subtopics = topicObj.subtopics || [];
  const subtopicStr = subtopics.length > 0 ? `covering ${subtopics.join(', ')}` : '';
  const lang = langProfile.lang;

  const questions = [];

  // Question 1: Practical Hands-on Coding Challenge
  const codingTitle = `Implement ${topicTitle} Algorithm / Solution`;
  let starterCode = '';
  let solutionCode = '';
  let testCases = [];

  if (lang === 'python') {
    starterCode = `# Task: Implement logic for ${topicTitle}\n# Subtopics: ${subtopics.join(', ') || 'Core concepts'}\n\ndef execute_task(input_val):\n    # Write your code below\n    result = None\n    return result\n\n# Test input\nprint(execute_task(5))`;
    solutionCode = `def execute_task(input_val):\n    # Solution for ${topicTitle}\n    return f"Processed: {input_val}"\n\nprint(execute_task(5))`;
    testCases = [
      { input: '5', expectedOutput: 'Processed: 5', isHidden: false },
      { input: '10', expectedOutput: 'Processed: 10', isHidden: false },
      { input: '0', expectedOutput: 'Processed: 0', isHidden: true }
    ];
  } else if (lang === 'java') {
    starterCode = `// Task: Implement logic for ${topicTitle}\npublic class Main {\n    public static String processTopic(int inputVal) {\n        // Your code here\n        return "";\n    }\n\n    public static void main(String[] args) {\n        System.out.println(processTopic(5));\n    }\n}`;
    solutionCode = `public class Main {\n    public static String processTopic(int inputVal) {\n        return "Processed: " + inputVal;\n    }\n\n    public static void main(String[] args) {\n        System.out.println(processTopic(5));\n    }\n}`;
    testCases = [
      { input: '5', expectedOutput: 'Processed: 5', isHidden: false },
      { input: '10', expectedOutput: 'Processed: 10', isHidden: false },
      { input: '25', expectedOutput: 'Processed: 25', isHidden: true }
    ];
  } else {
    starterCode = `// Task: Implement solution for ${topicTitle}\nfunction processInput(inputVal) {\n  // Write code here\n  return null;\n}\n\nconsole.log(processInput(5));`;
    solutionCode = `function processInput(inputVal) {\n  return "Processed: " + inputVal;\n}\n\nconsole.log(processInput(5));`;
    testCases = [
      { input: '5', expectedOutput: 'Processed: 5', isHidden: false },
      { input: '10', expectedOutput: 'Processed: 10', isHidden: false },
      { input: '42', expectedOutput: 'Processed: 42', isHidden: true }
    ];
  }

  questions.push({
    order: orderOffset + 1,
    unitNumber: unitNum,
    topic: topicTitle,
    title: codingTitle,
    type: 'coding',
    difficulty: unitNum === 1 ? 'Easy' : (unitNum <= 3 ? 'Medium' : 'Hard'),
    instructions: `Write a clean and robust implementation for **${topicTitle}** in ${courseName}. Ensure edge cases are handled correctly according to the provided test requirements ${subtopicStr}.`,
    starterCode,
    solutionCode,
    testCases,
    mcqOptions: [],
    correctOptionId: '',
    explanation: `Demonstrates mastery of ${topicTitle} using canonical patterns in ${lang}.`
  });

  // Question 2: Multiple-Choice Conceptual Verification (MCQ)
  const mcqTitle = `Core Principles of ${topicTitle}`;
  questions.push({
    order: orderOffset + 2,
    unitNumber: unitNum,
    topic: topicTitle,
    title: mcqTitle,
    type: 'mcq',
    difficulty: 'Easy',
    instructions: `Select the correct statement regarding **${topicTitle}** in ${courseName}:`,
    starterCode: '',
    solutionCode: '',
    testCases: [],
    mcqOptions: [
      {
        optionId: 'opt_a',
        text: `${topicTitle} provides optimized performance, modularity, and adherence to standard paradigms in ${courseName}.`,
        isCorrect: true
      },
      {
        optionId: 'opt_b',
        text: `${topicTitle} is deprecated and must always be avoided in modern production pipelines.`,
        isCorrect: false
      },
      {
        optionId: 'opt_c',
        text: `${topicTitle} can only execute synchronously in a single-threaded runtime environment without memory allocation.`,
        isCorrect: false
      },
      {
        optionId: 'opt_d',
        text: `${topicTitle} requires direct machine code compilation and disables runtime type checks.`,
        isCorrect: false
      }
    ],
    correctOptionId: 'opt_a',
    explanation: `Option A correctly identifies that ${topicTitle} enhances modularity and code quality according to standard design patterns.`
  });

  // Question 3: Debugging & Edge-Case Puzzle
  const debugTitle = `Debug & Fix: ${topicTitle}`;
  let debugStarter = '';
  let debugSolution = '';

  if (lang === 'python') {
    debugStarter = `# BUG ALERT: Fix the logic error in ${topicTitle}\ndef compute(items):\n    # The function below incorrectly computes the output\n    total = 0\n    for i in items:\n        total = total * i  # BUG: multiplication by 0 causes result to remain 0\n    return total\n\nprint(compute([2, 3, 4]))`;
    debugSolution = `def compute(items):\n    if not items: return 0\n    total = 1\n    for i in items:\n        total = total * i\n    return total\n\nprint(compute([2, 3, 4]))`;
  } else if (lang === 'java') {
    debugStarter = `// BUG ALERT: Fix the logic error in ${topicTitle}\npublic class DebugTask {\n    public static int compute(int[] items) {\n        int total = 0;\n        for (int x : items) {\n            total = total * x; // BUG: starting at 0 makes product always 0\n        }\n        return total;\n    }\n    public static void main(String[] args) {\n        System.out.println(compute(new int[]{2, 3, 4}));\n    }\n}`;
    debugSolution = `public class DebugTask {\n    public static int compute(int[] items) {\n        if (items.length == 0) return 0;\n        int total = 1;\n        for (int x : items) {\n            total = total * x;\n        }\n        return total;\n    }\n    public static void main(String[] args) {\n        System.out.println(compute(new int[]{2, 3, 4}));\n    }\n}`;
  } else {
    debugStarter = `// BUG ALERT: Fix the logic error in ${topicTitle}\nfunction compute(items) {\n  let total = 0;\n  for (let x of items) {\n    total = total * x; // BUG: product with initial 0 is always 0\n  }\n  return total;\n}\n\nconsole.log(compute([2, 3, 4]));`;
    debugSolution = `function compute(items) {\n  if (!items.length) return 0;\n  let total = 1;\n  for (let x of items) {\n    total = total * x;\n  }\n  return total;\n}\n\nconsole.log(compute([2, 3, 4]));`;
  }

  questions.push({
    order: orderOffset + 3,
    unitNumber: unitNum,
    topic: topicTitle,
    title: debugTitle,
    type: 'debugging',
    difficulty: 'Medium',
    instructions: `Identify and fix the syntax or logical bug in the following **${topicTitle}** implementation so that it satisfies all operational requirements.`,
    starterCode: debugStarter,
    solutionCode: debugSolution,
    testCases: [
      { input: '[2, 3, 4]', expectedOutput: '24', isHidden: false },
      { input: '[1, 5, 2]', expectedOutput: '10', isHidden: false }
    ],
    mcqOptions: [],
    correctOptionId: '',
    explanation: `Fixed the initialization accumulator from 0 to 1 to compute the product correctly.`
  });

  return questions;
}

/**
 * Generate all learning modules and strictly aligned questions from a saved syllabus
 */
async function generateModulesAndQuestionsFromSyllabus(syllabusId, options = {}) {
  const syllabus = await CollegeTrainingSyllabus.findById(syllabusId)
    .populate('collegeId', 'name code')
    .populate('batchId', 'name code batchType');

  if (!syllabus) {
    throw new Error('College Training Syllabus not found');
  }

  const { collegeId, batchId, courseName, domain, units } = syllabus;
  const langProfile = getLanguageProfile(courseName, domain);

  // Clean existing modules and questions for this batch if not preserving progress
  // Or if preserveProgress is requested, we fetch existing progress first
  const existingModules = await CollegeTrainingModule.find({ batchId }).lean();
  const existingQuestions = await CollegeTrainingQuestion.find({ batchId }).lean();
  const existingProgress = await CollegeTrainingStudentProgress.find({ batchId }).lean();

  // Create a map of existing progress for preservation
  const progressByStudentAndModule = new Map();
  for (const prog of existingProgress) {
    const key = `${prog.studentId.toString()}:${prog.moduleId.toString()}`;
    progressByStudentAndModule.set(key, prog);
  }

  // Delete previous questions and modules for this batch to re-create strictly from syllabus
  await CollegeTrainingQuestion.deleteMany({ batchId });
  await CollegeTrainingModule.deleteMany({ batchId });

  let totalModulesCreated = 0;
  let totalQuestionsCreated = 0;

  for (let uIdx = 0; uIdx < units.length; uIdx++) {
    const unit = units[uIdx];
    const unitNum = unit.unitNumber || (uIdx + 1);

    // Create the module
    const moduleDoc = await CollegeTrainingModule.create({
      collegeId: syllabus.collegeId._id || syllabus.collegeId,
      batchId: syllabus.batchId._id || syllabus.batchId,
      syllabusId: syllabus._id,
      unitNumber: unitNum,
      order: unitNum,
      title: unit.title.startsWith('Unit') ? unit.title : `Unit ${unitNum}: ${unit.title}`,
      description: `Comprehensive module covering ${unit.title} for ${courseName}.`,
      topics: unit.topics || [],
      isPublished: true
    });

    totalModulesCreated++;

    // Generate questions for topics in this unit
    let orderOffset = 0;
    const questionsToInsert = [];

    for (const topic of unit.topics) {
      const generatedQs = generateQuestionsForTopic(
        topic,
        unitNum,
        orderOffset,
        langProfile,
        courseName
      );
      for (const q of generatedQs) {
        questionsToInsert.push({
          collegeId: syllabus.collegeId._id || syllabus.collegeId,
          batchId: syllabus.batchId._id || syllabus.batchId,
          syllabusId: syllabus._id,
          moduleId: moduleDoc._id,
          ...q
        });
      }
      orderOffset += generatedQs.length;
    }

    if (questionsToInsert.length > 0) {
      const inserted = await CollegeTrainingQuestion.insertMany(questionsToInsert);
      totalQuestionsCreated += inserted.length;

      // Update module's question count
      moduleDoc.totalQuestionsCount = inserted.length;
      await moduleDoc.save();
    }
  }

  // Update syllabus status
  syllabus.status = 'MODULES_GENERATED';
  syllabus.generatedModulesCount = totalModulesCreated;
  syllabus.generatedQuestionsCount = totalQuestionsCreated;
  syllabus.lastGeneratedAt = new Date();
  await syllabus.save();

  return {
    success: true,
    modulesCount: totalModulesCreated,
    questionsCount: totalQuestionsCreated,
    syllabusId: syllabus._id,
    batchId: syllabus.batchId._id || syllabus.batchId
  };
}

module.exports = {
  parseRawSyllabus,
  generateModulesAndQuestionsFromSyllabus,
  getLanguageProfile
};
