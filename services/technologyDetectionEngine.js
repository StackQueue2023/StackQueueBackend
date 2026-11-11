/**
 * STACK QUEUE — Global Technology Detection & Environment Resolution Engine
 * 
 * Automatically detects technologies, frameworks, programming languages,
 * compilers, execution environments, and evaluation methods from actual course syllabi.
 */

const TECHNOLOGY_DEFINITIONS = [
  // ── 1. Web & Frontend Technologies ──
  {
    name: 'HTML',
    match: /\b(html|html5|semantic\s+tags?|doctype|headings?|paragraph|anchor|form\s+elements?|wcag|accessibility|screen\s+reader|aria)\b/i,
    language: 'javascript',
    compiler: 'HTML/CSS Live Preview',
    compilerId: 'html',
    evaluationMethod: 'preview'
  },
  {
    name: 'CSS',
    match: /\b(css|css3|box\s*model|flexbox|css\s+grid|grid\s+layout|selectors?|cascade|specificity|responsive|media\s+quer(?:y|ies)|transitions?|transforms?|keyframes|animations?)\b/i,
    language: 'javascript',
    compiler: 'HTML/CSS Live Preview',
    compilerId: 'css',
    evaluationMethod: 'preview'
  },
  {
    name: 'React',
    match: /\b(react|jsx|usestate|useeffect|usecontext|usereducer|usememo|usecallback|react\s+components?|functional\s+component|props|react\s+hooks?|virtual\s+dom)\b/i,
    language: 'javascript',
    compiler: 'JavaScript (Node.js)',
    compilerId: 'javascript',
    evaluationMethod: 'coding'
  },
  {
    name: 'JavaScript',
    match: /\b(javascript|es6|ecmascript|dom|queryselector|event\s+listener|arrow\s+functions?|destructuring|spread\s+operator|promises?|async\s*\/\s*await|closures?|prototypes?|prompt)\b/i,
    language: 'javascript',
    compiler: 'JavaScript (Node.js)',
    compilerId: 'javascript',
    evaluationMethod: 'coding'
  },
  {
    name: 'Node.js',
    match: /\b(node\.?js|v8\s+engine|event\s+loop|non[- ]blocking\s+i\/?o|npm|package\.json|commonjs|file\s+system\s+module|child_process)\b/i,
    language: 'javascript',
    compiler: 'JavaScript (Node.js)',
    compilerId: 'javascript',
    evaluationMethod: 'coding'
  },
  {
    name: 'Express.js',
    match: /\b(express(?:\.?js)?|express\s+routing|middleware|req\.body|res\.json|rest\s+api|http\s+methods?|route\s+parameters?)\b/i,
    language: 'javascript',
    compiler: 'JavaScript (Node.js)',
    compilerId: 'javascript',
    evaluationMethod: 'coding'
  },
  {
    name: 'MongoDB',
    match: /\b(mongodb|mongoose|nosql|document\s+database|bson|crud|collection|schema\s+validation|aggregate|atlas)\b/i,
    language: 'javascript',
    compiler: 'JavaScript (Node.js)',
    compilerId: 'javascript',
    evaluationMethod: 'coding'
  },

  // ── 2. Java Enterprise & Full Stack Technologies ──
  {
    name: 'Spring Boot',
    match: /\b(spring\s*boot|spring\s+mvc|spring\s+data|restcontroller|autowired|dependency\s+injection|applicationcontext|microservices?|actuator)\b/i,
    language: 'java',
    compiler: 'Java (JDK 22)',
    compilerId: 'java',
    evaluationMethod: 'coding'
  },
  {
    name: 'Hibernate',
    match: /\b(hibernate|jpa|orm|entity\s+manager|hql|jpql|sessionfactory|object[- ]relational\s+mapping)\b/i,
    language: 'java',
    compiler: 'Java (JDK 22)',
    compilerId: 'java',
    evaluationMethod: 'coding'
  },
  {
    name: 'Servlets & JSP',
    match: /\b(servlets?|jsp|httpservlet|httpservletrequest|httpservletresponse|httpsession|web\.xml|filter|jstl)\b/i,
    language: 'java',
    compiler: 'Java (JDK 22)',
    compilerId: 'java',
    evaluationMethod: 'coding'
  },
  {
    name: 'JDBC',
    match: /\b(jdbc|drivermanager|preparedstatement|resultset|callablestatement|connection\s+pool|sql\s+injection)\b/i,
    language: 'java',
    compiler: 'Java (JDK 22)',
    compilerId: 'java',
    evaluationMethod: 'coding'
  },
  {
    name: 'Core Java',
    match: /\b(java|jvm|jdk|jre|classloader|scanner|oop|inheritance|polymorphism|encapsulation|abstract|interface|collections?|arraylist|hashmap|multithreading|threads?|exceptions?|generics?|lambda|stream\s+api)\b/i,
    language: 'java',
    compiler: 'Java (JDK 22)',
    compilerId: 'java',
    evaluationMethod: 'coding'
  },

  // ── 3. Python & Data Technologies ──
  {
    name: 'Pandas',
    match: /\b(pandas|dataframe|series|read_csv|groupby|pivot_table|merge|join|fillna|dropna)\b/i,
    language: 'python',
    compiler: 'Python (3.11)',
    compilerId: 'python',
    evaluationMethod: 'coding'
  },
  {
    name: 'NumPy',
    match: /\b(numpy|ndarray|broadcasting|matrix|vectorization|linspace|arange|dot\s+product)\b/i,
    language: 'python',
    compiler: 'Python (3.11)',
    compilerId: 'python',
    evaluationMethod: 'coding'
  },
  {
    name: 'Machine Learning',
    match: /\b(machine\s+learning|scikit[- ]learn|sklearn|regression|classification|clustering|k[- ]means|decision\s+trees?|random\s+forest|model\s+evaluation|train_test_split)\b/i,
    language: 'python',
    compiler: 'Python (3.11)',
    compilerId: 'python',
    evaluationMethod: 'coding'
  },
  {
    name: 'Python',
    match: /\b(python|def|indentation|tuples?|dictionar(?:y|ies)|sets?|list\s+comprehension|generators?|yield|decorators?|dunder|magic\s+methods?|sqlite3|open\(|with\s+statement)\b/i,
    language: 'python',
    compiler: 'Python (3.11)',
    compilerId: 'python',
    evaluationMethod: 'coding'
  },

  // ── 4. Selenium & QA Automation Technologies ──
  {
    name: 'Cucumber BDD',
    match: /\b(cucumber|bdd|gherkin|feature\s+file|given\s+when\s+then|step\s+definition|cucumberoptions|testrunner)\b/i,
    language: 'java',
    compiler: 'Java (JDK 22)',
    compilerId: 'java',
    evaluationMethod: 'scenario'
  },
  {
    name: 'Jenkins CI/CD',
    match: /\b(jenkins|ci\/?cd|continuous\s+integration|build\s+pipeline|maven\s+build|nightly\s+build)\b/i,
    language: 'java',
    compiler: 'Java (JDK 22)',
    compilerId: 'java',
    evaluationMethod: 'scenario'
  },
  {
    name: 'TestNG',
    match: /\b(testng|testng\.xml|@test|@beforemethod|@aftermethod|dataprovider|assertions?|softassert)\b/i,
    language: 'java',
    compiler: 'Java (JDK 22)',
    compilerId: 'java',
    evaluationMethod: 'coding'
  },
  {
    name: 'Selenium WebDriver',
    match: /\b(selenium|webdriver|chromedriver|geckodriver|webelement|findelement|locators?|xpath|css\s+selector|actions\s+class|wait|expectedconditions|takesscreenshot|pom|page\s*object\s*model|pagefactory|javascriptexecutor)\b/i,
    language: 'java',
    compiler: 'Java (JDK 22)',
    compilerId: 'java',
    evaluationMethod: 'coding'
  },

  // ── 5. C & C++ Technologies ──
  {
    name: 'C++',
    match: /\b(c\+\+|cpp|stl|vector|std::|templates?|virtual\s+functions?|polymorphism|operator\s+overloading|namespaces?|references?|destructors?)\b/i,
    language: 'cpp',
    compiler: 'C++ (GCC)',
    compilerId: 'cpp',
    evaluationMethod: 'coding'
  },
  {
    name: 'C Language',
    match: /\b(c\s+language|malloc|calloc|free|pointers?|structures?|struct|union|header\s+files?|stdio\.h|pointers\s+arithmetic)\b/i,
    language: 'cpp',
    compiler: 'C++ (GCC)',
    compilerId: 'cpp',
    evaluationMethod: 'coding'
  },

  // ── 6. Database & SQL Technologies ──
  {
    name: 'SQL',
    match: /\b(sql|mysql|postgresql|sqlite|relational\s+database|ddl|dml|queries|joins?|inner\s+join|left\s+join|group\s+by|having|aggregate\s+functions?|primary\s+key|foreign\s+key|indexes?|transactions?)\b/i,
    language: 'javascript',
    compiler: 'JavaScript (Node.js)',
    compilerId: 'javascript',
    evaluationMethod: 'coding'
  }
];

/**
 * Intelligent technology detector for any topic, module, or course
 * Supports both object parameter ({ topic, moduleTitle, courseTitle, domainKey })
 * and positional parameters (topic, moduleTitle, courseTitle, domainKey)
 */
function detectTechnology(param1 = '', param2 = '', param3 = '', param4 = '') {
  let topic = '';
  let moduleTitle = '';
  let courseTitle = '';
  let domainKey = '';

  if (typeof param1 === 'object' && param1 !== null) {
    topic = param1.topic || '';
    moduleTitle = param1.moduleTitle || '';
    courseTitle = param1.courseTitle || '';
    domainKey = param1.domainKey || param1.domain || '';
  } else {
    topic = param1 || '';
    moduleTitle = param2 || '';
    courseTitle = param3 || '';
    domainKey = param4 || '';
  }

  const combinedText = `${topic} ${moduleTitle} ${courseTitle} ${domainKey}`.toLowerCase();
  const dNorm = (domainKey || courseTitle || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  // Sort definitions to prioritize domain matching technologies first
  const prioritizedDefs = [...TECHNOLOGY_DEFINITIONS].sort((a, b) => {
    const aMatch = (
      (dNorm.includes('selenium') && (a.name.includes('Selenium') || a.name.includes('TestNG') || a.name.includes('Cucumber'))) ||
      (dNorm.includes('java') && !dNorm.includes('script') && a.language === 'java') ||
      (dNorm.includes('python') && a.language === 'python') ||
      ((dNorm.includes('femn') || dNorm.includes('react') || dNorm.includes('web')) && a.language === 'javascript') ||
      ((dNorm.includes('cpp') || dNorm.includes('c++')) && a.language === 'cpp')
    );
    const bMatch = (
      (dNorm.includes('selenium') && (b.name.includes('Selenium') || b.name.includes('TestNG') || b.name.includes('Cucumber'))) ||
      (dNorm.includes('java') && !dNorm.includes('script') && b.language === 'java') ||
      (dNorm.includes('python') && b.language === 'python') ||
      ((dNorm.includes('femn') || dNorm.includes('react') || dNorm.includes('web')) && b.language === 'javascript') ||
      ((dNorm.includes('cpp') || dNorm.includes('c++')) && b.language === 'cpp')
    );
    if (aMatch && !bMatch) return -1;
    if (!aMatch && bMatch) return 1;
    return 0;
  });

  for (const def of prioritizedDefs) {
    if (def.match.test(combinedText)) {
      return {
        name: def.name,
        technology: def.name,
        language: def.language,
        primaryLanguage: def.language,
        compiler: def.compiler,
        compilerId: def.compilerId,
        evaluationMethod: def.evaluationMethod
      };
    }
  }

  // Fallback inferred from domainKey
  if (dNorm.includes('python')) {
    return {
      name: 'Python',
      technology: 'Python',
      language: 'python',
      primaryLanguage: 'python',
      compiler: 'Python (3.11)',
      compilerId: 'python',
      evaluationMethod: 'coding'
    };
  }

  if (dNorm.includes('java') && !dNorm.includes('script')) {
    return {
      name: 'Core Java',
      technology: 'Core Java',
      language: 'java',
      primaryLanguage: 'java',
      compiler: 'Java (JDK 22)',
      compilerId: 'java',
      evaluationMethod: 'coding'
    };
  }

  if (dNorm.includes('selenium')) {
    return {
      name: 'Selenium WebDriver',
      technology: 'Selenium WebDriver',
      language: 'java',
      primaryLanguage: 'java',
      compiler: 'Java (JDK 22)',
      compilerId: 'java',
      evaluationMethod: 'coding'
    };
  }

  if (dNorm.includes('cpp') || dNorm.includes('c++')) {
    return {
      name: 'C++',
      technology: 'C++',
      language: 'cpp',
      primaryLanguage: 'cpp',
      compiler: 'C++ (GCC)',
      compilerId: 'cpp',
      evaluationMethod: 'coding'
    };
  }

  // Default web / JS
  return {
    name: 'JavaScript',
    technology: 'JavaScript',
    language: 'javascript',
    primaryLanguage: 'javascript',
    compiler: 'JavaScript (Node.js)',
    compilerId: 'javascript',
    evaluationMethod: 'coding'
  };
}

/**
 * Detects if a topic represents an integrated full-stack challenge
 */
function detectIntegrationChallenge(param1 = '', param2 = '', param3 = '') {
  let topic = '';
  let moduleTitle = '';
  let domainKey = '';

  if (typeof param1 === 'object' && param1 !== null) {
    topic = param1.topic || '';
    moduleTitle = param1.moduleTitle || '';
    domainKey = param1.domainKey || param1.domain || '';
  } else {
    topic = param1 || '';
    moduleTitle = param2 || '';
    domainKey = param3 || '';
  }

  const text = `${topic} ${moduleTitle}`.toLowerCase();

  const isFullstack = /\b(fullstack|full-stack|client-server\s+integration|end-to-end|crud\s+application\s+lifecycle|connecting\s+react\s+to\s+express)\b/i.test(text);

  if (isFullstack) {
    const dNorm = (domainKey || '').toLowerCase();
    if (dNorm.includes('femn') || dNorm.includes('mern') || dNorm.includes('web')) {
      return {
        isIntegration: true,
        technology: 'React + Node.js + Express + MongoDB',
        components: ['HTML/CSS/JS', 'React Frontend', 'Express REST API', 'MongoDB Data Layer']
      };
    }
    if (dNorm.includes('java')) {
      return {
        isIntegration: true,
        technology: 'Java + Spring Boot + MySQL',
        components: ['Core Java', 'Spring Boot Service', 'Hibernate/JPA', 'MySQL Relational Layer']
      };
    }
  }

  return { isIntegration: false, technology: null, components: [] };
}

/**
 * Generates technology-specific starter code
 */
function getStarterCodeForTechnology(technology, language, topic = '') {
  const t = (technology || '').toLowerCase();
  const lang = (language || 'javascript').toLowerCase();
  const cleanTopic = topic || 'Problem Solution';

  if (t === 'html' || t === 'css') {
    return `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>${cleanTopic}</title>\n  <style>\n    /* Write your CSS styling here */\n  </style>\n</head>\n<body>\n  <!-- Write your semantic HTML structure here -->\n</body>\n</html>\n`;
  }

  if (lang === 'python') {
    return `# Solution for: ${cleanTopic} (${technology})\nimport sys\n\ndef solve():\n    raw_input = sys.stdin.read().strip()\n    # Implement ${technology} logic here\n    if raw_input:\n        print(f"Solved: {raw_input.upper()}")\n    else:\n        print("Solved: READY")\n\nif __name__ == '__main__':\n    solve()\n`;
  }

  if (lang === 'java') {
    return `// Solution for: ${cleanTopic} (${technology})\nimport java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextLine()) {\n            String input = sc.nextLine().trim();\n            // Implement ${technology} solution here\n            System.out.println("Solved: " + input.toUpperCase());\n        } else {\n            System.out.println("Solved: READY");\n        }\n    }\n}\n`;
  }

  if (lang === 'cpp') {
    return `// Solution for: ${cleanTopic} (${technology})\n#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    string input;\n    if (getline(cin, input)) {\n        // Implement ${technology} solution here\n        cout << "Solved: " << input << endl;\n    } else {\n        cout << "Solved: READY" << endl;\n    }\n    return 0;\n}\n`;
  }

  // Default JavaScript with prompt() support
  return `// Solution for: ${cleanTopic} (${technology})\nfunction solution() {\n    const str = prompt("");\n    // Implement ${technology} solution here\n    return str;\n}\n\nconst res = solution();\nconsole.log(res);\n`;
}

module.exports = {
  TECHNOLOGY_DEFINITIONS,
  detectTechnology,
  detectIntegrationChallenge,
  getStarterCodeForTechnology
};
