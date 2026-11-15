/**
 * STACK QUEUE — Strict Module Concept & Prerequisite Scope Engine
 *
 * Dynamically analyzes a course's syllabus module (title, description, topics, order)
 * and all preceding modules in the database to determine:
 *   1. Exact concepts covered in THIS module (primaryCategories)
 *   2. Prerequisite concepts already taught in earlier modules (prerequisiteCategories)
 *   3. Forbidden future concepts NOT yet taught (forbiddenCategories)
 *   4. Language, compiler, and topic IDs
 *
 * Zero hardcoded order->topic mappings. Works dynamically for every course and module.
 */

const crypto = require('crypto');
const { detectTechnology } = require('./technologyDetectionEngine');

// Ordered concept taxonomy used for both classification and prerequisite/future-concept guarding
const CONCEPT_RULES = [
  {
    key: 'syntax_output',
    label: 'Basic Syntax & Output Statements',
    match: /\b(intro(?:duction)?|basic\s+syntax|output\s+statements?|system\.out|println|printf|print\(\)|escape\s+sequences?|newline|tab\s+formatting|indentation|comments?|docstrings?|keywords?|identifiers?|jvm|jdk|jre|bytecode|classloader|program\s+structure|main\s+method|hello\s+world|environment\s+setup|interactive\s+shell)\b/i
  },
  {
    key: 'variables_types',
    label: 'Variables, Data Types & Type Casting',
    match: /\b(variables?|data\s*types?|datatypes?|primitive|type\s*casting|type\s*conversion|wrapper\s+class|dynamic\s+typing|booleans?|int,\s*float|var,\s*let|const|increment\s*&\s*decrement)\b/i
  },
  {
    key: 'operators_math',
    label: 'Operators & Expressions',
    match: /\b(operators?|arithmetic|modulus|modulo|relational|equality|logical\s+operators?|bitwise|shift\s+operators?|assignment\s+operators?|floor\s+division|membership\s+operators?|identity\s+operators?)\b/i
  },
  {
    key: 'scanner_input',
    label: 'User Input & Scanner / BufferedReader',
    match: /\b(scanner|bufferedreader|user\s+input|nextint|nextline|delimiters?|input\s+mismatch|stdin|reading\s+user)\b/i
  },
  {
    key: 'conditionals',
    label: 'Conditional Statements & Branching',
    match: /\b(conditional|if[-\s]?else|elif|switch[-\s]?case|switch\s+statement|ternary|decision\s+making|short[-\s]?circuit|branching|fall[-\s]?through)\b/i
  },
  {
    key: 'loops',
    label: 'Loops & Iteration',
    match: /\b(loops?|for\s+loop|while\s+loop|do[-\s]?while|enhanced\s+for|for[-\s]?each|range\(\)|break\s+and\s+continue|iteration|counter\s+iteration)\b/i
  },
  {
    key: 'strings',
    label: 'Strings & Text Manipulation',
    match: /\b(strings?|string\s+methods?|stringbuilder|stringbuffer|slicing|f-strings?|substring|charat|regex|regular\s+expression|re\.search|re\.match|re\.findall|re\.sub|immutability)\b/i
  },
  {
    key: 'methods_functions',
    label: 'Functions & Methods',
    match: /\b(functions?|function\s+types?|methods?|method\s+return|parameters?|pass\s+by\s+value|def\b|\*args|\*\*kwargs|lambda|recursion|decorators?|generators?|yield)\b/i
  },
  {
    key: 'arrays_lists',
    label: 'Arrays & Lists',
    match: /\b(arrays?|1d\s+array|multi[-\s]?dimensional|lists?|list\s+creation|list\s+indexing|list\s+comprehension|nested\s+structures?|numpy|ndarray)\b/i
  },
  {
    key: 'tuples_sets',
    label: 'Tuples & Sets',
    match: /\b(tuples?|packing\s*&\s*unpacking|sets?|set\s+uniqueness|set\s+math|union,\s*intersection)\b/i
  },
  {
    key: 'dictionaries_maps',
    label: 'Dictionaries & Maps',
    match: /\b(dictionar(?:y|ies)|key[-\s]?value|hashmap|treemap|map\s+interface|linkedhashmap)\b/i
  },
  {
    key: 'oop_classes',
    label: 'Classes, Objects & Encapsulation',
    match: /\b(classes?\s*(?:and|&)\s*objects?|modules?\s*(?:and|&)\s*classes|classes\b|class\s+definition|object\s+instantiation|constructors?|nested\s+class(?:es)?|access\s+specifier|public\s+and\s+private|protected|encapsulation|__init__|self\s+keyword|this\(\)|static\s+and\s+final|object\s+oriented|oop)\b/i
  },
  {
    key: 'inheritance_poly',
    label: 'Inheritance, Polymorphism & Abstraction',
    match: /\b(inheritance|polymorphism|abstraction|abstract\s+class(?:es)?|overriding|overloading|super\(\)|mro|method\s+resolution|interfaces?)\b/i
  },
  {
    key: 'collections_generics',
    label: 'Collections Framework & Generics',
    match: /\b(collections?|arraylist|linkedlist|hashset|generics?|stream\s+api)\b/i
  },
  {
    key: 'exceptions',
    label: 'Exception Handling & Debugging',
    match: /\b(exception\s+handling|try[-\s]?catch|try\s+and\s+except|finally\s+block|throw\s+vs\s+throws|custom\s+exceptions?|raise\b|debugging)\b/i
  },
  {
    key: 'file_io',
    label: 'File Handling & JSON/Data I/O',
    match: /\b(file\s+handling|filereader|filewriter|buffer(?:ed)?reader|bufferedwriter|open\(\)|read,\s*readline|context\s+managers?|json\b|byte\s+streams?|character\s+streams?)\b/i
  },
  {
    key: 'multithreading',
    label: 'Multithreading & Concurrency',
    match: /\b(thread(?:ing|s)?|runnable|synchronization|deadlock|thread\s+lifecycle)\b/i
  },
  {
    key: 'jdbc_sql',
    label: 'JDBC, SQL & Databases',
    match: /\b(jdbc|sqlite3?|sql\b|preparedstatement|resultset|drivermanager|database\s+connection)\b/i
  },
  {
    key: 'html_structure',
    label: 'HTML Structure, Semantics & Accessibility',
    match: /\b(html|html5|elements|attributes|tags|semantic\s+html|accessibility|wcag|aria|doctype|headings|paragraphs)\b/i
  },
  {
    key: 'html_forms',
    label: 'HTML Forms & Form Validation',
    match: /\b(forms?\s+and\s+form\s+validations?|form\s+elements?|input\s+types?|html5\s+form\s+validation)\b/i
  },
  {
    key: 'css_layout',
    label: 'CSS Styling, Box Model, Flexbox & Grid',
    match: /\b(css|selectors?|box\s+model|positioning|flexbox|css\s+grid|responsive|media\s+queries|transitions?|transforms?|keyframes|animations?)\b/i
  },
  {
    key: 'js_dom',
    label: 'JavaScript DOM & Event Handling',
    match: /\b(dom\s+tree|dom\s+manipulation|event\s+handling|queryselector|getelementbyid|addeventlistener|event\s+bubbling)\b/i
  },
  {
    key: 'js_async',
    label: 'ES6+, APIs, JSON & Async JavaScript',
    match: /\b(es6|arrow\s+functions?|destructuring|spread|promises?|async\/await|fetch\(\)|working\s+with\s+apis?|rest\s+api)\b/i
  },
  {
    key: 'node_express',
    label: 'Node.js, Express, Middleware & Auth',
    match: /\b(node\.?js|package\s+management|npm|yarn|express|middleware|handling\s+requests|restful\s+apis?|jwt|json\s+web\s+tokens?|bcrypt|routing)\b/i
  },
  {
    key: 'mongodb_mongoose',
    label: 'NoSQL, MongoDB & Mongoose',
    match: /\b(nosql|mongodb|mongoose|crud\s+operations?|data\s+modeling|schema\s+design|aggregation\s+framework|indexing\s+for\s+performance)\b/i
  },
  {
    key: 'react_hooks',
    label: 'React Components, Props & Hooks',
    match: /\b(react|jsx|usestate|useeffect|props|component\s+tree)\b/i
  },
  {
    key: 'selenium_basics',
    label: 'Selenium Setup & WebDriver Navigation',
    match: /\b(selenium\s+driver|eclipse\s+project|maven\s+pom|webdriver\s+basics|browser\s+navigation|driver\.get|driver\.close|driver\.quit|jars)\b/i
  },
  {
    key: 'selenium_locators',
    label: 'Selenium WebElements, Locators & Interactions',
    match: /\b(webelements?|weblocators?|locators?|xpath|css\s+selectors?|actions\s+class|alerts?|window\s+handles?|select\s+class|dropdown)\b/i
  },
  {
    key: 'selenium_waits',
    label: 'Selenium Waits & Synchronization',
    match: /\b(implicit\s+wait|explicit\s+wait|fluentwait|webdriverwait|expectedconditions|thread\.sleep)\b/i
  },
  {
    key: 'selenium_pom_testng',
    label: 'Page Object Model, Keyword Driven & TestNG',
    match: /\b(page\s+object\s+model|pom|pagefactory|@findby|keyword\s+driven|testng|assertions?|dataprovider|apache\s+poi)\b/i
  },
  {
    key: 'selenium_bdd',
    label: 'Cucumber BDD, Jenkins CI/CD & Add-ons',
    match: /\b(cucumber|bdd|gherkin|jenkins|ci\/cd|sonarqube|takesscreenshot|javascriptexecutor|log4j)\b/i
  },
  {
    key: 'c_cpp_memory',
    label: 'Pointers, Structures & Memory Management',
    match: /\b(pointers?|malloc|calloc|free|c\s+structs?|struct\s+\w+|unions?|dynamic\s+memory|stl|vectors?|templates?)\b/i
  },
  {
    key: 'sql_databases',
    label: 'SQL Queries, Joins & Relational Databases',
    match: /\b(sql|mysql|postgresql|sqlite|select\s+from|inner\s+join|left\s+join|group\s+by|subquer(?:y|ies)|normalization|primary\s+key|foreign\s+key|rdbms)\b/i
  },
  {
    key: 'data_science',
    label: 'Data Science, Pandas, NumPy & Machine Learning',
    match: /\b(data\s*science|pandas|dataframe|matplotlib|seaborn|scikit|regression|classification|clustering|machine\s+learning|statistics|eda)\b/i
  },
  {
    key: 'capstone_project',
    label: 'Module/Course Integration Project',
    match: /\b(console\s+application|gui\s+project|real\s*time\s+application|capstone|end-to-end\s+application|fullstack\s+client-server)\b/i
  }
];

/**
 * Deterministic hash of a module's syllabus content so we detect changes accurately.
 */
function computeModuleSignature(mod) {
  const title = (mod.title || '').trim();
  const desc = (mod.description || '').trim();
  const topics = Array.isArray(mod.topics) ? mod.topics.map(t => (t || '').trim()).join('|') : '';
  return crypto.createHash('sha256').update(`${title}::${desc}::${topics}`).digest('hex').slice(0, 24);
}

/**
 * Deterministic topic ID derived from moduleId and topic name.
 */
function buildTopicId(moduleId, topicName, topicIndex = 0) {
  const slug = String(topicName || 'topic')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  const modPrefix = moduleId ? String(moduleId).slice(-6) : 'mod';
  return `${modPrefix}-t${topicIndex + 1}-${slug || 'core'}`;
}

/**
 * Classifies a text block (module title/desc/topics or single topic) into matching concept keys.
 */
function classifyConceptCategories(text) {
  if (!text || typeof text !== 'string') return [];
  const matched = [];
  for (const rule of CONCEPT_RULES) {
    if (rule.match.test(text)) {
      matched.push(rule.key);
    }
  }
  return matched;
}

/**
 * Determines primary language for a course + module.
 */
function resolveModuleLanguage(course, mod) {
  const courseStr = `${course?.slug || ''} ${course?.domain || ''} ${course?.title || ''}`.toLowerCase();
  const modStr = `${mod?.title || ''} ${mod?.description || ''} ${(mod?.topics || []).join(' ')}`.toLowerCase();

  const detected = detectTechnology({
    topic: (mod?.topics || [])[0] || mod?.title || '',
    moduleTitle: mod?.title || '',
    courseTitle: course?.title || '',
    domainKey: course?.slug || course?.domain || ''
  });

  if (courseStr.includes('python') || courseStr.includes('data science') || courseStr.includes('datascience') || courseStr.includes('machine learning')) {
    return { language: 'python', compiler: 'Python (3.11)', technology: detected.name || 'Python' };
  }
  if (courseStr.includes('sql') || courseStr.includes('database') || courseStr.includes('rdbms')) {
    return { language: 'sql', compiler: 'SQLite / ANSI SQL', technology: detected.name || 'SQL' };
  }
  if (courseStr.includes('selenium')) {
    return { language: 'java', compiler: 'Java (JDK 22)', technology: detected.name || 'Selenium WebDriver' };
  }
  if (courseStr.includes('java') && !courseStr.includes('javascript')) {
    return { language: 'java', compiler: 'Java (JDK 22)', technology: detected.name || 'Core Java' };
  }
  if (courseStr.includes('cpp') || courseStr.includes('c++')) {
    return { language: 'cpp', compiler: 'C++ (GCC 13)', technology: detected.name || 'C++' };
  }
  if (/(?:^|\W)c(?:\W|$)/.test(courseStr) && !courseStr.includes('css') && !courseStr.includes('react') && !courseStr.includes('science')) {
    return { language: 'c', compiler: 'C (GCC 13)', technology: detected.name || 'C Programming' };
  }
  if (courseStr.includes('femn') || courseStr.includes('mern') || courseStr.includes('react') || courseStr.includes('web') || courseStr.includes('html') || courseStr.includes('css') || courseStr.includes('node') || courseStr.includes('javascript') || courseStr.includes('fullstack') || courseStr.includes('full stack')) {
    return { language: 'javascript', compiler: detected.compiler || 'JavaScript (Node.js)', technology: detected.name || 'JavaScript' };
  }

  // Fallback to module-level detection
  if (modStr.includes('python')) return { language: 'python', compiler: 'Python (3.11)', technology: detected.name || 'Python' };
  if (modStr.includes('java') && !modStr.includes('javascript')) return { language: 'java', compiler: 'Java (JDK 22)', technology: detected.name || 'Core Java' };
  return {
    language: detected.language || 'javascript',
    compiler: detected.compiler || 'JavaScript (Node.js)',
    technology: detected.name || course?.title || 'Programming'
  };
}

/**
 * Analyzes a module within its full course syllabus context.
 * Computes exact primary concepts, prerequisite concepts from earlier modules,
 * and forbidden future concepts.
 */
function analyzeModuleScope(mod, allCourseModules = [], course = null) {
  const sortedMods = [...(allCourseModules || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
  const modTitle = mod?.title || '';
  const modDesc = mod?.description || '';
  const modTopics = Array.isArray(mod?.topics) ? mod.topics : [];

  // 1. Classify primary concepts strictly from THIS module's title, description, and topics
  const titleCategories = classifyConceptCategories(modTitle);
  const fullModText = `${modTitle} ${modDesc} ${modTopics.join(' ')}`;
  let primaryCategories = classifyConceptCategories(fullModText);

  // If title clearly identifies a specific concept (e.g., "Basic Syntax & Output Statements" or "Conditional Statements"),
  // prioritize titleCategories so stray words in description don't hijack the module's focus.
  if (titleCategories.length > 0) {
    // Keep title categories first, then any additional categories explicitly listed in topics
    const topicCats = classifyConceptCategories(modTopics.join(' '));
    const combined = Array.from(new Set([...titleCategories, ...topicCats]));
    primaryCategories = combined;
  }

  // Fallback if module title/topics are generic (e.g., "Module 1")
  if (primaryCategories.length === 0) {
    if ((mod?.order || 1) === 1) {
      primaryCategories = ['syntax_output'];
    } else {
      primaryCategories = ['syntax_output'];
    }
  }

  // 2. Map each individual topic in mod.topics to its best category within primaryCategories
  const topicCategoryMap = {};
  for (const t of modTopics) {
    const tCats = classifyConceptCategories(t);
    const matchingPrimary = tCats.find(c => primaryCategories.includes(c));
    topicCategoryMap[t] = matchingPrimary || tCats[0] || primaryCategories[0];
  }

  // 3. Compute prerequisite concepts from strictly earlier modules (order < mod.order)
  const prerequisiteSet = new Set(['syntax_output']); // Printing output is always allowed as a basic I/O mechanism
  for (const prevMod of sortedMods) {
    if ((prevMod.order || 0) < (mod?.order || 1)) {
      const prevText = `${prevMod.title || ''} ${prevMod.description || ''} ${(prevMod.topics || []).join(' ')}`;
      const prevCats = classifyConceptCategories(prevText);
      prevCats.forEach(c => prerequisiteSet.add(c));
    }
  }
  primaryCategories.forEach(c => prerequisiteSet.add(c));

  const prerequisiteCategories = Array.from(prerequisiteSet);

  // 4. Compute future concepts introduced in strictly later modules of THIS course
  const futureCourseSet = new Set();
  for (const laterMod of sortedMods) {
    if ((laterMod.order || 0) > (mod?.order || 1)) {
      const laterText = `${laterMod.title || ''} ${laterMod.description || ''} ${(laterMod.topics || []).join(' ')}`;
      const laterCats = classifyConceptCategories(laterText);
      laterCats.forEach(c => {
        if (!prerequisiteSet.has(c)) futureCourseSet.add(c);
      });
    }
  }

  // 5. Compute forbidden future concepts:
  //    - Always forbid any concept explicitly appearing in a LATER syllabus module of this course
  //    - For introductory core modules (syntax, variables, operators, scanner, html/css), also forbid all higher control-flow/OOP/collection concepts
  const INTRODUCTORY_CORE = new Set([
    'syntax_output', 'variables_types', 'operators_math', 'scanner_input',
    'html_structure', 'css_layout'
  ]);
  const STRICT_FUTURE_FOR_INTRO = new Set([
    'conditionals', 'loops', 'strings', 'methods_functions', 'arrays_lists',
    'tuples_sets', 'dictionaries_maps', 'oop_classes', 'inheritance_poly',
    'collections_generics', 'exceptions', 'file_io', 'multithreading', 'jdbc_sql',
    'c_cpp_memory'
  ]);

  const isIntroModule = primaryCategories.every(c => INTRODUCTORY_CORE.has(c));
  const isPureSyntaxModule = primaryCategories.length === 1 && primaryCategories[0] === 'syntax_output';

  const allCategoryKeys = CONCEPT_RULES.map(r => r.key);
  const forbiddenCategories = allCategoryKeys.filter(k => {
    if (prerequisiteSet.has(k)) return false;
    if (futureCourseSet.has(k)) return true;
    if (isPureSyntaxModule && (k === 'variables_types' || k === 'operators_math' || k === 'scanner_input')) {
      return true;
    }
    if (isIntroModule && STRICT_FUTURE_FOR_INTRO.has(k)) return true;
    return false;
  });

  const langInfo = resolveModuleLanguage(course, mod);

  return {
    moduleId: mod?._id,
    moduleOrder: mod?.order || 1,
    moduleTitle: modTitle,
    moduleDescription: modDesc,
    topics: modTopics,
    topicsSignature: computeModuleSignature(mod),
    primaryCategories,
    topicCategoryMap,
    prerequisiteCategories,
    forbiddenCategories,
    language: langInfo.language,
    compiler: langInfo.compiler,
    technology: langInfo.technology
  };
}

module.exports = {
  CONCEPT_RULES,
  analyzeModuleScope,
  classifyConceptCategories,
  computeModuleSignature,
  buildTopicId,
  resolveModuleLanguage
};
