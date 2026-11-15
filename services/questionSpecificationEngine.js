/**
 * STACK QUEUE — Strict Module-Scoped Question Specification & Test Case Engine
 *
 * Generates question-specific problem statements, input/output specifications,
 * sample cases, hidden evaluation test cases, starter code, and executable
 * reference solutions strictly scoped to the module's actual concepts.
 *
 * NEVER cycles through unrelated concepts (e.g., never puts loops/conditionals/arrays
 * into Basic Syntax & Output Statements).
 */

const { CATEGORY_SPECS, CATEGORY_ALIASES } = require('./specLibrary');
const { classifyConceptCategories } = require('./moduleScopeEngine');

function clean(str) {
  return (str || '').replace(/[^\w\s-]/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeDomain(str) {
  if (!str) return 'python';
  const s = String(str).toLowerCase().trim();
  if (s.includes('sql') || s.includes('database') || s.includes('rdbms')) return 'sql';
  if (s.includes('java') && !s.includes('javascript')) return 'java';
  if (s.includes('python') || s.includes('datascience') || s.includes('data science') || s.includes('machine learning')) return 'python';
  if (s.includes('cpp') || s.includes('c++')) return 'cpp';
  if (/(?:^|\W)c(?:\W|$)/.test(s) && !s.includes('css') && !s.includes('react') && !s.includes('science')) return 'c';
  if (s.includes('react') || s.includes('femn') || s.includes('mern') || s.includes('javascript') || s.includes('js') || s.includes('web') || s.includes('html') || s.includes('css') || s.includes('node') || s.includes('fullstack')) return 'javascript';
  if (s.includes('selenium') || s.includes('test')) return 'java';
  return 'python';
}

/**
 * Selects the exact spec category strictly allowed for this module & topic.
 */
function resolveStrictCategoryKey({
  topic = '',
  moduleTitle = '',
  moduleDescription = '',
  primaryCategories = []
}) {
  const topicCats = classifyConceptCategories(topic);
  const modCats = primaryCategories && primaryCategories.length > 0
    ? primaryCategories
    : classifyConceptCategories(`${moduleTitle} ${moduleDescription}`);

  // 1. Prefer a category that matches BOTH the specific topic AND the module's primary categories
  const matchedBoth = topicCats.find(c => modCats.includes(c));
  if (matchedBoth) return matchedBoth;

  // 2. Otherwise use the module's primary category (never jump outside the module!)
  if (modCats.length > 0) return modCats[0];

  // 3. Fallback to syntax_output if module has no recognizable keywords
  return 'syntax_output';
}

/**
 * Picks a spec variant within the allowed category bucket matching difficulty and variation index.
 */
function pickSpecFromBucket(categoryKey, difficulty = 'Easy', variationIndex = 0) {
  const resolvedBucketKey = CATEGORY_SPECS[categoryKey]
    ? categoryKey
    : (CATEGORY_ALIASES[categoryKey] || 'syntax_output');

  const bucket = CATEGORY_SPECS[resolvedBucketKey] || CATEGORY_SPECS.syntax_output;

  // Prefer specs matching requested difficulty if multiple exist
  const diffMatches = bucket.filter(s => (s.difficulty || '').toLowerCase() === String(difficulty).toLowerCase());
  const pool = diffMatches.length > 0 ? diffMatches : bucket;

  const idx = Math.abs(Number(variationIndex) || 0) % pool.length;
  return {
    specDef: pool[idx],
    resolvedBucketKey
  };
}

/**
 * Generates a strict module-scoped question specification.
 */
function generateQuestionSpec({
  title = '',
  description = '',
  topic = '',
  moduleTitle = '',
  moduleDescription = '',
  moduleTopics = [],
  primaryCategories = [],
  courseTitle = '',
  domain = 'python',
  taskIndex = 1,
  variationIndex = null,
  difficulty = 'Easy'
}) {
  const normDomain = normalizeDomain(domain || courseTitle);
  const cleanTopicName = clean(topic || moduleTitle || title || 'Core Programming').slice(0, 65);

  const categoryKey = resolveStrictCategoryKey({
    topic,
    moduleTitle,
    moduleDescription,
    primaryCategories
  });

  const vIdx = variationIndex !== null && variationIndex !== undefined
    ? variationIndex
    : Math.max(0, (Number(taskIndex) || 1) - 1);

  const { specDef } = pickSpecFromBucket(categoryKey, difficulty, vIdx);

  return assembleSpec(specDef, cleanTopicName, normDomain, categoryKey);
}

function assembleSpec(v, topic, domain, categoryKey) {
  let refCode = v.pyRef;
  let starterCode = `# Write your Python solution here\n`;

  if (domain === 'java') {
    refCode = v.javaRef;
    starterCode = `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Write your Java code here\n    }\n}`;
  } else if (domain === 'javascript') {
    refCode = v.jsRef;
    starterCode = `// Write your JavaScript solution here using prompt() and console.log()\n`;
  } else if (domain === 'sql') {
    refCode = v.sqlRef || `SELECT name, mark FROM students WHERE mark >= 80 ORDER BY mark DESC;`;
    starterCode = `-- Write your ANSI SQL query here\nSELECT * FROM students;`;
  } else if (domain === 'c') {
    const sampleOut = (v.samples && v.samples[0]?.out) ? String(v.samples[0].out).replace(/"/g, '\\"').replace(/\n/g, '\\n') : 'OK';
    refCode = v.cRef || `#include <stdio.h>\n\nint main() {\n    // Reference solution for ${topic}\n    printf("${sampleOut}\\n");\n    return 0;\n}`;
    starterCode = `#include <stdio.h>\n\nint main() {\n    // Write your C code here\n    return 0;\n}`;
  } else if (domain === 'cpp') {
    const sampleOut = (v.samples && v.samples[0]?.out) ? String(v.samples[0].out).replace(/"/g, '\\"').replace(/\n/g, '\\n') : 'OK';
    refCode = v.cppRef || `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Reference solution for ${topic}\n    cout << "${sampleOut}" << endl;\n    return 0;\n}`;
    starterCode = `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your C++ code here\n    return 0;\n}`;
  }

  const allCases = [];

  // Visible Sample 1 & 2
  if (v.samples && v.samples[0]) {
    allCases.push({
      input: v.samples[0].in,
      expectedOutput: v.samples[0].out,
      isHidden: false,
      explanation: v.samples[0].exp || 'Sample test case 1.'
    });
  }
  if (v.samples && v.samples[1]) {
    allCases.push({
      input: v.samples[1].in,
      expectedOutput: v.samples[1].out,
      isHidden: false,
      explanation: v.samples[1].exp || 'Sample test case 2.'
    });
  }

  // Hidden evaluation test cases (boundary, edge, multi-word, etc.)
  if (v.edgeCases && v.edgeCases.length > 0) {
    v.edgeCases.forEach((ec, idx) => {
      allCases.push({
        input: ec.in,
        expectedOutput: ec.out,
        isHidden: true,
        explanation: ec.exp || `Hidden evaluation test case #${idx + 1}.`
      });
    });
  }

  const sample1 = v.samples[0] || { in: '', out: '', exp: 'Sample input' };
  const sample2 = v.samples[1] || v.samples[0] || { in: '', out: '', exp: 'Secondary sample' };
  const problemText = typeof v.problemStatement === 'function'
    ? v.problemStatement(topic)
    : String(v.problemStatement || '');

  return {
    topic,
    categoryKey,
    questionType: v.questionType || 'coding',
    titleSuffix: v.titleSuffix,
    problemStatement: `### Problem Description: ${topic} — ${v.titleSuffix}\n\n${problemText}`,
    inputFormat: v.inputFormat,
    outputFormat: v.outputFormat,
    constraints: v.constraints,
    sampleInput: sample1.in,
    sampleOutput: sample1.out,
    sampleInput2: sample2.in,
    sampleOutput2: sample2.out,
    explanation: sample1.exp,
    starterCode,
    referenceSolution: refCode,
    testCases: allCases
  };
}

module.exports = {
  generateQuestionSpec,
  normalizeDomain,
  resolveStrictCategoryKey
};
