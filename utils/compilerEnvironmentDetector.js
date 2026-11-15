/**
 * STACK QUEUE — Course Compiler & Execution Environment Detector
 * 
 * Determines whether a course has a working compiler / code execution environment
 * or if it requires Multiple-Choice Questions (MCQs).
 */

const { DOMAIN_COMPILER_CONFIGS } = require('./domainCompilerMapping');

// Keywords that indicate non-programming or design courses with NO suitable compiler
const NO_COMPILER_KEYWORDS = [
  'ui', 'ux', 'ui ux', 'ui/ux', 'design', 'web design', 'web designing',
  'graphic design', 'figma', 'photoshop', 'illustrator',
  'product management', 'business analyst', 'digital marketing',
  'cyber law', 'agile', 'scrum', 'itil', 'project management',
  'human resources', 'seo', 'content strategy'
];

// Keywords that indicate programming languages or test runners with a WORKING compiler
const COMPILER_KEYWORDS = [
  { match: /java(?!script)/i, lang: 'java', compilerName: 'Java (JDK 22)' },
  { match: /python/i, lang: 'python', compilerName: 'Python (3.11)' },
  { match: /c\+\+|cpp/i, lang: 'cpp', compilerName: 'C++ (GCC)' },
  { match: /\bc\b/i, lang: 'cpp', compilerName: 'C (GCC)' },
  { match: /javascript|node|react|mern|femn|full\s*stack/i, lang: 'javascript', compilerName: 'JavaScript (Node.js)' },
  { match: /selenium|automation\s*testing/i, lang: 'java', compilerName: 'Selenium Java Engine' },
  { match: /sql|database|mysql/i, lang: 'javascript', compilerName: 'SQL Engine (Node.js)' },
  { match: /dsa|data\s*structures/i, lang: 'java', compilerName: 'Java / Python / C++ Runner' }
];

/**
 * Checks whether a course has a working compiler/execution environment.
 * 
 * @param {Object} course - The course object (title, domain, category, executionEnvironment, hasCompiler)
 * @returns {Object} { hasCompiler: Boolean, format: 'coding' | 'mcq', language: String, compilerName: String, reason: String }
 */
function getCourseCompilerEnvironment(course) {
  if (!course) {
    return {
      hasCompiler: false,
      format: 'mcq',
      language: '',
      compilerName: 'None (MCQ Assessment)',
      reason: 'No course provided'
    };
  }

  // 1. Explicit admin configuration on course
  if (course.executionEnvironment === 'MCQ' || course.hasCompiler === false) {
    return {
      hasCompiler: false,
      format: 'mcq',
      language: '',
      compilerName: 'None (MCQ Assessment)',
      reason: 'Course explicitly configured for Multiple-Choice Questions (MCQs)'
    };
  }

  if (course.executionEnvironment === 'COMPILER' || course.hasCompiler === true) {
    const lang = course.compilerLanguage || 'java';
    return {
      hasCompiler: true,
      format: 'coding',
      language: lang,
      compilerName: `Compiler: ${lang.toUpperCase()}`,
      reason: 'Course explicitly configured for Practical Coding'
    };
  }

  // 2. Automatic domain & title analysis
  const courseTitle = String(course.title || '').trim().toLowerCase();
  const domain = String(course.domain || '').trim().toLowerCase();
  const category = String(course.category || '').trim().toLowerCase();
  const fullText = `${courseTitle} ${domain} ${category}`;

  // Check for non-compiler domains first
  for (const kw of NO_COMPILER_KEYWORDS) {
    const regex = new RegExp(`(^|\\b)${kw}(\\b|$)`, 'i');
    if (regex.test(courseTitle) || regex.test(domain) || regex.test(category)) {
      return {
        hasCompiler: false,
        format: 'mcq',
        language: '',
        compilerName: 'None (MCQ Assessment)',
        reason: `Course domain "${domain || courseTitle}" does not require a code compiler. Four-option MCQs selected.`
      };
    }
  }

  // Check for programming/compiler domains
  for (const item of COMPILER_KEYWORDS) {
    if (item.match.test(courseTitle) || item.match.test(domain) || item.match.test(category)) {
      return {
        hasCompiler: true,
        format: 'coding',
        language: item.lang,
        compilerName: item.compilerName,
        reason: `Working code compiler available for ${item.compilerName}. Coding questions selected.`
      };
    }
  }

  // Fallback: If not recognized as a known programming language, default to MCQ
  return {
    hasCompiler: false,
    format: 'mcq',
    language: '',
    compilerName: 'None (MCQ Assessment)',
    reason: 'No suitable code compiler environment configured. Defaulted to Multiple-Choice Questions.'
  };
}

module.exports = {
  getCourseCompilerEnvironment,
  NO_COMPILER_KEYWORDS,
  COMPILER_KEYWORDS
};
