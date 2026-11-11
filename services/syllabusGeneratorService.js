const pdfParseModule = require('pdf-parse');
const { generateQuestionSpec } = require('./questionSpecificationEngine');

/**
 * syllabusGeneratorService.js
 * Extracts text from PDF syllabus, splits into modules,
 * and auto-generates 10-15 comprehensive, sequential tasks per module.
 */

// Common tech keywords to craft context-aware tasks
const TECH_KEYWORDS = {
  java: ['JVM', 'OOP', 'Inheritance', 'Collections', 'HashMap', 'Streams', 'Exceptions', 'Threads', 'Spring Boot', 'REST API', 'Hibernate', 'JDBC'],
  python: ['Syntax', 'Lists', 'Dictionaries', 'Functions', 'Comprehensions', 'OOP', 'Decorators', 'Generators', 'Django', 'FastAPI', 'Pandas', 'NumPy'],
  cpp: ['Pointers', 'References', 'Memory Allocation', 'Classes', 'Constructors', 'Operator Overloading', 'STL Vector', 'STL Map', 'Templates', 'Smart Pointers', 'RAII'],
  react: ['JSX', 'Components', 'Props', 'useState', 'useEffect', 'Custom Hooks', 'Context API', 'Redux', 'Tailwind', 'Routing', 'Formik', 'API Integration']
};

/**
 * 1. Extract plain text from PDF buffer
 */
async function extractTextFromPdf(buffer) {
  try {
    if (typeof pdfParseModule === 'function') {
      const data = await pdfParseModule(buffer);
      return data.text || '';
    } else if (pdfParseModule && pdfParseModule.PDFParse) {
      const parser = new pdfParseModule.PDFParse({ data: buffer });
      const result = await parser.getText();
      return result.text || '';
    } else if (pdfParseModule && typeof pdfParseModule.default === 'function') {
      const data = await pdfParseModule.default(buffer);
      return data.text || '';
    }
    throw new Error('Unsupported pdf-parse module export format');
  } catch (err) {
    console.error('Error parsing PDF buffer:', err);
    throw new Error('Failed to parse PDF document. Please ensure the file is a valid PDF.');
  }
}

/**
 * Helper: Detect and skip table header lines
 */
function isTableHeaderLine(line) {
  if (!line) return true;
  const l = line.toLowerCase().trim();
  if (l.startsWith('s.no') || l.startsWith('sno') || l.startsWith('sl.no') || l === 's.no.' || l === '#' || l === 'no.') return true;
  if (l.includes('s.no') && (l.includes('description') || l.includes('duration') || l.includes('topic'))) return true;
  if (/^(?:s\.?no\.?|sl\.?no\.?|serial no\.?|no\.?|#)\s*[\t\s|.-]*\s*(?:description|topic|module|title|subject)\s*[\t\s|.-]*\s*(?:duration|hours?|hrs?|time)?$/i.test(l)) return true;
  if (/^(?:python|java|cpp|c\+\+|react|web|node|data science)\s+syllabus$/i.test(l)) return true;
  return false;
}

/**
 * Helper: Combine table cells split across lines by pdf-parse
 */
function normalizeTableLines(rawText) {
  if (!rawText || !rawText.trim()) return [];
  const rawLines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const lines = [];

  for (let i = 0; i < rawLines.length; i++) {
    const l1 = rawLines[i];
    const l2 = rawLines[i + 1];
    const l3 = rawLines[i + 2];

    // Check if pdf-parse split 3 columns into 3 separate consecutive lines: "1", "Introduction to Python", "3 hrs"
    if (/^\d+$/.test(l1) && l2 && !/^\d+$/.test(l2) && l3 && /^\d+\s*(?:hrs?|hours?|h|mins?)/i.test(l3)) {
      lines.push(`${l1} ${l2} ${l3}`);
      i += 2;
    } else {
      lines.push(l1);
    }
  }

  return lines;
}

/**
 * 2. Parse syllabus text and intelligently split into modules
 */
function splitTextIntoModules(rawText, domainKey = 'general') {
  if (!rawText || !rawText.trim()) {
    return [];
  }

  const lines = normalizeTableLines(rawText);
  const modules = [];

  // 1. Explicit keyword: Module 1: Introduction to Python
  const moduleHeaderRegex = /^(?:module|unit|chapter|week|section|part)\s*(\d+)[:\s.-]*(.*)$/i;

  // 2. Table / Serial Number format: 1 Introduction to Python 3 hrs  OR  1. Introduction to Python  OR  1 | Introduction to Python | 3 hrs
  const tableRowRegex = /^(\d+)[\t\s|.-]+([A-Za-z0-9\s&,/()\--]+?)(?:[\t\s|.-]+\d+\s*(?:hrs?|hours?|h|mins?|minutes?))?$/i;

  let currentModule = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (isTableHeaderLine(line)) {
      continue;
    }

    const matchModule = line.match(moduleHeaderRegex);
    const matchTableRow = !matchModule && line.match(tableRowRegex);

    if (matchModule || matchTableRow) {
      if (currentModule && currentModule.title) {
        modules.push(finalizeModule(currentModule));
      }

      const rawNum = matchModule ? matchModule[1] : matchTableRow[1];
      const modOrder = parseInt(rawNum, 10);
      let rawTitle = matchModule ? matchModule[2] : matchTableRow[2];

      // Clean title from duration suffixes if present
      rawTitle = (rawTitle || '').replace(/\b\d+\s*(?:hrs?|hours?|h|mins?|minutes?)\b/gi, '').replace(/^[-–—:\s|]+|[-–—:\s|]+$/g, '').trim();

      if (!rawTitle || rawTitle.length < 2) {
        rawTitle = `Module ${modOrder}`;
      }

      currentModule = {
        order: modOrder || modules.length + 1,
        title: rawTitle,
        description: `Comprehensive module covering ${rawTitle}.`,
        topics: [rawTitle]
      };
    } else if (currentModule) {
      // Collect description or subtopics
      if (line.startsWith('-') || line.startsWith('•') || line.startsWith('*') || /^\d+\.\d+/.test(line)) {
        const cleanTopic = line.replace(/^[-•*\d.]+\s*/, '').trim();
        if (cleanTopic.length > 2) {
          currentModule.topics.push(cleanTopic);
        }
      } else if (!currentModule.description || currentModule.description.startsWith('Comprehensive module')) {
        if (line.length > 15 && !line.match(/^\d+\s*hrs?/i)) {
          currentModule.description = line;
        }
      } else if (line.length > 3 && line.length < 80 && !line.match(/^\d+\s*hrs?/i)) {
        currentModule.topics.push(line);
      }
    }
  }

  if (currentModule && currentModule.title) {
    modules.push(finalizeModule(currentModule));
  }

  if (modules.length === 0) {
    return fallbackSegmentModules(lines, domainKey);
  }

  return modules;
}

function finalizeModule(m) {
  return {
    order: m.order,
    title: m.title.length > 3 ? m.title : `Module ${m.order}`,
    description: m.description || (m.topics.length > 0 ? m.topics.slice(0, 3).join(', ') : `Comprehensive training on ${m.title}`),
    topics: m.topics.length > 0 ? m.topics : [m.title, 'Fundamental Concepts', 'Hands-on Practice', 'Milestone Assessment']
  };
}

/**
 * Fallback module splitter when syllabus doesn't contain "Module X" keywords
 */
function fallbackSegmentModules(lines, domainKey) {
  const chunkSize = Math.max(4, Math.floor(lines.length / 5));
  const modules = [];

  const defaultTitles = {
    java: ['Java Basics & Core Syntax', 'Object-Oriented Programming (OOP)', 'Collections & Generics', 'Exception Handling & File I/O', 'Spring Boot & REST APIs', 'Enterprise Project Implementation'],
    python: ['Python Essentials & Data Types', 'Control Flow & Built-in Structures', 'Functions & Functional Programming', 'OOP & Module Architecture', 'Web Framework & Database Integration', 'Capstone Project & Automation'],
    cpp: ['C++ Fundamentals & Compilers', 'Pointers & Dynamic Memory Management', 'Classes, Constructors & Destructors', 'Inheritance, Polymorphism & Templates', 'STL Containers & Algorithms', 'High-Performance Systems Project'],
    react: ['Modern React & JSX Foundations', 'Components, Props & State', 'Hooks Deep Dive (useEffect, useMemo)', 'Component Architecture & Forms', 'Routing, Context & State Management', 'Fullstack React Application Capstone']
  };

  const domainTitles = defaultTitles[domainKey] || [
    'Foundational Architecture & Basics',
    'Core Logic & Data Operations',
    'Advanced Principles & Patterns',
    'Practical Application & Integration',
    'Enterprise Project & Assessment'
  ];

  for (let i = 0; i < domainTitles.length; i++) {
    const start = i * chunkSize;
    const end = start + chunkSize;
    const chunkLines = lines.slice(start, end);

    modules.push({
      order: i + 1,
      title: domainTitles[i],
      description: chunkLines.slice(0, 2).join(' ') || `Covers core concepts for ${domainTitles[i]}.`,
      topics: chunkLines.filter(l => l.length > 4 && l.length < 80).slice(0, 6)
    });
  }

  return modules;
}

/**
 * 3. Generate 10 to 15 questions/tasks for each module
 */
function generateTasksForModule(mod, domainKey = 'java', questionsCount = 12) {
  const count = Math.min(15, Math.max(10, questionsCount));
  const modTitle = mod.title;
  const topics = mod.topics && mod.topics.length > 0 ? mod.topics : [modTitle];

  const tasks = [];

  // Blueprint for 15 progressive tasks
  const blueprints = [
    {
      prefix: 'Concept Primer',
      type: 'reading',
      diff: 'Easy',
      pts: 10,
      time: '15 mins',
      tmpl: (t) => `Overview & Architectural Foundation: ${t}`,
      desc: (t) => `Read and understand core principles, syntax rules, and use cases for ${t}.`,
      inst: (t) => `1. Review the conceptual architecture of ${t}.\n2. Note down primary keywords and execution lifecycle.\n3. Answer the reflection prompt.`
    },
    {
      prefix: 'Basic Syntax',
      type: 'coding',
      diff: 'Easy',
      pts: 10,
      time: '20 mins',
      tmpl: (t) => `Initial Implementation & Declaration: ${t}`,
      desc: (t) => `Write your first working code declaring and utilizing ${t}.`,
      inst: (t) => `1. Set up variable and component definitions.\n2. Write the main logic block demonstrating ${t}.\n3. Verify output matches expected format.`,
      output: 'Execution verified with zero errors'
    },
    {
      prefix: 'Core Operations',
      type: 'coding',
      diff: 'Easy',
      pts: 10,
      time: '20 mins',
      tmpl: (t) => `Data Manipulation & Operations in ${t}`,
      desc: (t) => `Perform input handling, transformations, and output formatting for ${t}.`,
      inst: (t) => `1. Accept required input values.\n2. Apply transformation logic.\n3. Print formatted result.`
    },
    {
      prefix: 'Logic Building',
      type: 'coding',
      diff: 'Easy',
      pts: 10,
      time: '25 mins',
      tmpl: (t) => `Conditional Flows & Algorithmic Handling in ${t}`,
      desc: (t) => `Implement conditional evaluation and looping rules around ${t}.`,
      inst: (t) => `1. Construct decision pathways (if-else / match).\n2. Handle boundary cases.\n3. Confirm branch coverage.`
    },
    {
      prefix: 'Intermediate Implementation',
      type: 'coding',
      diff: 'Medium',
      pts: 15,
      time: '25 mins',
      tmpl: (t) => `Structured Processing & Methods: ${t}`,
      desc: (t) => `Organize reusable helper functions and methods for ${t}.`,
      inst: (t) => `1. Decouple logic into distinct modular functions.\n2. Ensure proper parameter validation.\n3. Return processed results.`
    },
    {
      prefix: 'Validation & Debugging',
      type: 'debugging',
      diff: 'Medium',
      pts: 15,
      time: '25 mins',
      tmpl: (t) => `Debug Edge Cases & Runtime Exceptions in ${t}`,
      desc: (t) => `Identify deliberate logic flaws or null exceptions in provided snippet and fix them.`,
      inst: (t) => `1. Inspect the provided buggy code block.\n2. Trace edge cases (empty input, null pointers, out-of-bounds).\n3. Submit corrected code.`
    },
    {
      prefix: 'Concept Verification Quiz',
      type: 'mcq',
      diff: 'Medium',
      pts: 15,
      time: '15 mins',
      tmpl: (t) => `Multiple Choice Assessment on ${t}`,
      desc: (t) => `Evaluate deep understanding of memory management, scope, and best practices for ${t}.`,
      inst: (t) => `1. Analyze the 4 options carefully.\n2. Choose the optimal time-complexity answer.\n3. Review detailed explanation.`
    },
    {
      prefix: 'Practical Task',
      type: 'practical',
      diff: 'Medium',
      pts: 15,
      time: '30 mins',
      tmpl: (t) => `Hands-on Lab Exercise: ${t}`,
      desc: (t) => `Complete an end-to-end practical exercise following industry coding standards.`,
      inst: (t) => `1. Scaffold clean project directory.\n2. Implement business logic.\n3. Write console logs confirming behavior.`
    },
    {
      prefix: 'Real-World Scenario',
      type: 'coding',
      diff: 'Medium',
      pts: 20,
      time: '30 mins',
      tmpl: (t) => `Industry Scenario: Real-time Handling of ${t}`,
      desc: (t) => `Simulate a customer order, transaction, or user-state processing scenario with ${t}.`,
      inst: (t) => `1. Parse incoming mock payload.\n2. Apply business rules.\n3. Generate sanitized response JSON or console object.`
    },
    {
      prefix: 'Error Handling & Resilience',
      type: 'debugging',
      diff: 'Medium',
      pts: 15,
      time: '25 mins',
      tmpl: (t) => `Exception Recovery & Safe State in ${t}`,
      desc: (t) => `Implement robust try-catch blocks and graceful fallbacks for unexpected failures.`,
      inst: (t) => `1. Wrap hazardous calls in exception handlers.\n2. Log specific error message.\n3. Return safe default value.`
    },
    {
      prefix: 'Programming Challenge',
      type: 'challenge',
      diff: 'Hard',
      pts: 25,
      time: '35 mins',
      tmpl: (t) => `Competitive Coding Challenge: ${t}`,
      desc: (t) => `Solve an algorithmic challenge optimizing time and space complexity with ${t}.`,
      inst: (t) => `1. Achieve O(N) or optimal complexity.\n2. Pass all hidden test cases.\n3. Handle extreme boundary values.`
    },
    {
      prefix: 'Capstone Mini-Project',
      type: 'project',
      diff: 'Hard',
      pts: 30,
      time: '45 mins',
      tmpl: (t) => `Mini-Project: Interactive ${t} Solution`,
      desc: (t) => `Design and code a complete self-contained module demonstrating end-to-end mastery.`,
      inst: (t) => `1. Combine all concepts learned in this module.\n2. Ensure code is modular, commented, and testable.\n3. Submit implementation or GitHub repository URL.`
    },
    {
      prefix: 'Design Pattern Exercise',
      type: 'practical',
      diff: 'Hard',
      pts: 20,
      time: '35 mins',
      tmpl: (t) => `Architecture & Design Pattern Application for ${t}`,
      desc: (t) => `Apply standard design patterns (Factory, Singleton, Observer, or MVC) to ${t}.`,
      inst: (t) => `1. Identify pattern requirement.\n2. Refactor procedural code into clean object/functional design.\n3. Verify extensibility.`
    },
    {
      prefix: 'Module Assessment Quiz',
      type: 'quiz',
      diff: 'Medium',
      pts: 20,
      time: '20 mins',
      tmpl: (t) => `Module Milestone Quiz: ${t}`,
      desc: (t) => `Test comprehensive theoretical and practical knowledge across all topics in ${modTitle}.`,
      inst: (t) => `1. Complete all 10 questions.\n2. Score 80%+ to earn completion badge.`
    },
    {
      prefix: 'Mastery Arena Challenge',
      type: 'challenge',
      diff: 'Hard',
      pts: 30,
      time: '45 mins',
      tmpl: (t) => `Final Mastery Evaluation: ${t}`,
      desc: (t) => `A timed capstone evaluation testing speed, precision, and architectural cleanliness.`,
      inst: (t) => `1. Read problem statement.\n2. Code solution within time budget.\n3. Pass automated test suite.`
    }
  ];

  for (let i = 0; i < count; i++) {
    const bp = blueprints[i] || blueprints[i % blueprints.length];
    const topic = topics[i % topics.length] || modTitle;
    const taskTitle = `Task ${i + 1} — ${bp.tmpl(topic)}`;

    const spec = generateQuestionSpec({
      title: taskTitle,
      topic,
      moduleTitle: modTitle,
      domain: domainKey,
      taskIndex: i + 1,
      difficulty: bp.diff
    });

    tasks.push({
      order: i + 1,
      title: taskTitle,
      description: bp.desc(topic),
      instructions: bp.inst(topic),
      problemStatement: spec.problemStatement,
      inputFormat: spec.inputFormat,
      outputFormat: spec.outputFormat,
      constraints: spec.constraints,
      sampleInput: spec.sampleInput,
      sampleOutput: spec.sampleOutput,
      sampleInput2: spec.sampleInput2,
      sampleOutput2: spec.sampleOutput2,
      expectedOutput: spec.sampleOutput,
      starterCode: spec.starterCode,
      referenceSolution: spec.referenceSolution,
      explanation: spec.explanation,
      testCases: spec.testCases,
      taskType: bp.type,
      difficulty: bp.diff,
      points: bp.pts,
      estimatedTime: bp.time,
      isActive: true,
      isEnabled: true
    });
  }

  return tasks;
}

module.exports = {
  extractTextFromPdf,
  splitTextIntoModules,
  generateTasksForModule
};
