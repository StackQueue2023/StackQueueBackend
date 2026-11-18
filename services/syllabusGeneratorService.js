const { generateQuestionSpec } = require('./questionSpecificationEngine');
const { analyzeModuleScope, buildTopicId } = require('./moduleScopeEngine');

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

const zlib = require('zlib');

/**
 * Native Node.js fallback PDF text stream extraction using built-in zlib.
 * Decompresses FlateDecode streams and extracts standard PDF text tokens.
 */
function extractRawPdfTextFallback(buffer) {
  if (!buffer || !Buffer.isBuffer(buffer)) return '';
  const content = buffer.toString('binary');
  const streamRegex = /stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g;
  let match;
  let extracted = '';

  while ((match = streamRegex.exec(content)) !== null) {
    const rawStream = Buffer.from(match[1], 'binary');
    let decompressed = '';
    try {
      decompressed = zlib.inflateSync(rawStream).toString('utf-8');
    } catch {
      decompressed = match[1];
    }

    const textMatches = decompressed.match(/\(([^)]+)\)\s*Tj/g);
    if (textMatches) {
      textMatches.forEach(m => {
        const t = m.replace(/^\(/, '').replace(/\)\s*Tj$/, '').replace(/\\([()\\])/g, '$1');
        if (t.trim()) extracted += t + ' ';
      });
      extracted += '\n';
    }

    const arrayMatches = decompressed.match(/\[([^\]]+)\]\s*TJ/g);
    if (arrayMatches) {
      arrayMatches.forEach(m => {
        const inner = m.match(/\(([^)]+)\)/g);
        if (inner) {
          extracted += inner.map(s => s.replace(/^\(/, '').replace(/\)$/, '').replace(/\\([()\\])/g, '$1')).join('') + ' ';
        }
      });
      extracted += '\n';
    }
  }
  return extracted.trim();
}

/**
 * 1. Extract plain text from PDF buffer
 * Resilient multi-strategy engine with pure native fallback for serverless Lambda environments.
 */
async function extractTextFromPdf(buffer) {
  let pdfParseModule = null;
  try {
    pdfParseModule = require('pdf-parse');
  } catch (modErr) {
    console.warn('[pdf-parse load warning]:', modErr.message);
  }

  // Strategy 1: Modern pdf-parse class constructor (v2+)
  if (pdfParseModule && pdfParseModule.PDFParse) {
    try {
      const parser = new pdfParseModule.PDFParse({ data: buffer });
      const res = await parser.getText();
      const txt = (res && res.text) ? res.text : (typeof res === 'string' ? res : '');
      if (txt && txt.trim()) return txt;
    } catch (e1) {
      console.warn('[PDFParse Class Strategy Note]:', e1.message);
    }
  }

  // Strategy 2: Direct function invocation (v1)
  if (typeof pdfParseModule === 'function') {
    try {
      const data = await pdfParseModule(buffer);
      if (data && data.text && data.text.trim()) return data.text;
    } catch (e2) {
      console.warn('[pdfParse Function Strategy Note]:', e2.message);
    }
  }

  // Strategy 3: Default export function
  if (pdfParseModule && typeof pdfParseModule.default === 'function') {
    try {
      const data = await pdfParseModule.default(buffer);
      if (data && data.text && data.text.trim()) return data.text;
    } catch (e3) {
      console.warn('[pdfParse.default Strategy Note]:', e3.message);
    }
  }

  // Strategy 4: Native Node.js built-in stream decompression fallback (Guaranteed serverless safe)
  try {
    const fallbackText = extractRawPdfTextFallback(buffer);
    if (fallbackText && fallbackText.trim()) {
      return fallbackText;
    }
  } catch (fbErr) {
    console.warn('[PDF Native Fallback Note]:', fbErr.message);
  }

  throw new Error('Unable to extract text from the provided PDF file. Please ensure it contains readable text.');
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
 * 3. Generate 10 to 15 strict module-scoped questions/tasks for each module
 */
function generateTasksForModule(mod, domainKey = 'java', questionsCount = 12, allModules = [], course = null) {
  const count = Math.min(15, Math.max(10, questionsCount));
  const modTitle = mod.title;
  const topics = mod.topics && mod.topics.length > 0 ? mod.topics : [modTitle];
  const scope = analyzeModuleScope(mod, allModules, course || { slug: domainKey, domain: domainKey, title: domainKey });

  const tasks = [];
  const levels = [
    { diff: 'Easy', type: 'reading', pts: 10, time: '15 mins', prefix: 'Concept Primer' },
    { diff: 'Easy', type: 'coding', pts: 10, time: '20 mins', prefix: 'Basic Implementation' },
    { diff: 'Medium', type: 'coding', pts: 15, time: '25 mins', prefix: 'Structured Practice' },
    { diff: 'Medium', type: 'practical', pts: 15, time: '30 mins', prefix: 'Hands-on Lab' },
    { diff: 'Hard', type: 'challenge', pts: 25, time: '35 mins', prefix: 'Module Mastery' }
  ];

  for (let i = 0; i < count; i++) {
    const topicIdx = i % topics.length;
    const topic = topics[topicIdx] || modTitle;
    const lvl = levels[i % levels.length];
    const variationIndex = Math.floor(i / topics.length);

    const spec = generateQuestionSpec({
      title: `${topic} (${lvl.diff})`,
      topic,
      moduleTitle: modTitle,
      moduleDescription: mod.description || '',
      moduleTopics: topics,
      primaryCategories: scope.primaryCategories,
      courseTitle: course?.title || domainKey,
      domain: domainKey,
      taskIndex: i + 1,
      variationIndex,
      difficulty: lvl.diff
    });

    const taskTitle = `Task ${i + 1} — ${lvl.prefix}: ${topic} (${spec.titleSuffix})`;
    const topicId = buildTopicId(mod._id, topic, topicIdx);

    tasks.push({
      order: i + 1,
      title: taskTitle,
      topic,
      topicId,
      description: `Focused ${lvl.diff.toLowerCase()} practice strictly covering ${topic} within ${modTitle}.`,
      instructions: `1. Review ${topic} concepts.\n2. Implement your solution using only ${modTitle} concepts.\n3. Verify all sample and hidden test cases pass.`,
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
      testingSolution: spec.referenceSolution,
      explanation: spec.explanation,
      testCases: spec.testCases,
      taskType: lvl.type,
      difficulty: lvl.diff,
      points: lvl.pts,
      estimatedTime: lvl.time,
      technology: scope.technology,
      compiler: scope.compiler,
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
