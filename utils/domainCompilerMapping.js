// Domain -> Programming Language -> Compiler Mappings for STACK QUEUE

const DOMAIN_COMPILER_CONFIGS = {
  java: {
    key: 'java',
    label: 'JAVA',
    defaultLanguage: 'java',
    allowedLanguages: ['java'],
    compilers: [
      { id: 'java', name: 'Java (JDK 22)', lang: 'java', version: '22' }
    ]
  },
  python: {
    key: 'python',
    label: 'Python',
    defaultLanguage: 'python',
    allowedLanguages: ['python'],
    compilers: [
      { id: 'python', name: 'Python (3.11)', lang: 'python', version: '3.11' }
    ]
  },
  femnstack: {
    key: 'femnstack',
    label: 'FEMN STACK',
    defaultLanguage: 'javascript',
    allowedLanguages: ['javascript'],
    compilers: [
      { id: 'javascript', name: 'JavaScript (Node.js)', lang: 'javascript', version: '20' }
    ]
  },
  selenium: {
    key: 'selenium',
    label: 'Selenium',
    defaultLanguage: 'java',
    allowedLanguages: ['java', 'python'],
    compilers: [
      { id: 'java', name: 'Java (JDK 22)', lang: 'java', version: '22' },
      { id: 'python', name: 'Python (3.11)', lang: 'python', version: '3.11' }
    ]
  },
  cpp: {
    key: 'cpp',
    label: 'C++',
    defaultLanguage: 'cpp',
    allowedLanguages: ['cpp'],
    compilers: [
      { id: 'cpp', name: 'C++ (GCC)', lang: 'cpp', version: '17' }
    ]
  },
  c: {
    key: 'c',
    label: 'C',
    defaultLanguage: 'cpp',
    allowedLanguages: ['cpp'],
    compilers: [
      { id: 'cpp', name: 'C / C++ (GCC)', lang: 'cpp', version: '17' }
    ]
  },
  dsa: {
    key: 'dsa',
    label: 'Data Structures & Algorithms',
    defaultLanguage: 'java',
    allowedLanguages: ['java', 'python', 'cpp', 'javascript'],
    compilers: [
      { id: 'java', name: 'Java (JDK 22)', lang: 'java', version: '22' },
      { id: 'python', name: 'Python (3.11)', lang: 'python', version: '3.11' },
      { id: 'cpp', name: 'C++ (GCC)', lang: 'cpp', version: '17' },
      { id: 'javascript', name: 'JavaScript (Node.js)', lang: 'javascript', version: '20' }
    ]
  },
  sql: {
    key: 'sql',
    label: 'SQL',
    defaultLanguage: 'javascript',
    allowedLanguages: ['javascript', 'python'],
    compilers: [
      { id: 'javascript', name: 'SQL / Node.js Engine', lang: 'javascript', version: '20' },
      { id: 'python', name: 'Python (3.11)', lang: 'python', version: '3.11' }
    ]
  },
  cybersecurity: {
    key: 'cybersecurity',
    label: 'Cyber Security',
    defaultLanguage: 'python',
    allowedLanguages: ['python'],
    compilers: [
      { id: 'python', name: 'Python (3.11)', lang: 'python', version: '3.11' }
    ]
  }
};

function normalizeDomain(str) {
  if (!str || typeof str !== 'string') return '';
  return str.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
}

function getDomainCompilerConfig(domainInput, questionOrCourse = null) {
  // 1. Direct Question-level Technology & Compiler Check (Highest Precision)
  if (questionOrCourse) {
    const tech = (questionOrCourse.technology || '').toLowerCase().trim();
    const qLang = (questionOrCourse.programmingLanguage || '').toLowerCase().trim();
    const qCompiler = questionOrCourse.compiler || '';
    const evalMethod = questionOrCourse.evaluationMethod || '';

    if (tech === 'html' || tech === 'css' || evalMethod === 'preview') {
      return {
        key: 'web-preview',
        label: questionOrCourse.technology || 'HTML/CSS Preview',
        defaultLanguage: 'javascript',
        allowedLanguages: ['javascript'],
        compilers: [
          { id: 'html', name: 'HTML/CSS Live Preview', lang: 'javascript', version: 'HTML5/CSS3' }
        ]
      };
    }

    if (tech.includes('python') || tech.includes('numpy') || tech.includes('pandas') || qLang === 'python') {
      return { ...DOMAIN_COMPILER_CONFIGS.python };
    }

    if (tech.includes('spring') || tech.includes('hibernate') || tech.includes('jdbc') || tech.includes('servlets') || tech.includes('core java') || qLang === 'java') {
      return { ...DOMAIN_COMPILER_CONFIGS.java };
    }

    if (tech.includes('selenium')) {
      return { ...DOMAIN_COMPILER_CONFIGS.selenium };
    }

    if (tech.includes('c++') || tech.includes('cpp') || tech === 'c' || qLang === 'cpp') {
      return { ...DOMAIN_COMPILER_CONFIGS.cpp };
    }

    if (tech.includes('node') || tech.includes('express') || tech.includes('react') || tech.includes('mongo') || tech.includes('javascript') || qLang === 'javascript') {
      return { ...DOMAIN_COMPILER_CONFIGS.femnstack };
    }
  }

  let norm = normalizeDomain(domainInput);

  if (norm.includes('selenium')) norm = 'selenium';
  else if (norm.includes('femn') || norm.includes('react') || norm.includes('web') || norm.includes('javascript') || norm.includes('js')) norm = 'femnstack';
  else if (norm.includes('java') && !norm.includes('script')) norm = 'java';
  else if (norm.includes('python')) norm = 'python';
  else if (norm.includes('cpp') || norm.includes('c++')) norm = 'cpp';
  else if (norm === 'c') norm = 'c';
  else if (norm.includes('dsa') || norm.includes('structure') || norm.includes('algo')) norm = 'dsa';
  else if (norm.includes('sql') || norm.includes('data')) norm = 'sql';
  else if (norm.includes('cyber') || norm.includes('sec')) norm = 'cybersecurity';

  const config = DOMAIN_COMPILER_CONFIGS[norm];
  if (config) {
    return { ...config };
  }

  // Fallback if programmingLanguage is explicitly specified
  if (questionOrCourse && questionOrCourse.programmingLanguage) {
    const pl = questionOrCourse.programmingLanguage.toLowerCase().trim();
    if (pl.includes('java') && !pl.includes('script')) return { ...DOMAIN_COMPILER_CONFIGS.java };
    if (pl.includes('python')) return { ...DOMAIN_COMPILER_CONFIGS.python };
    if (pl.includes('cpp') || pl.includes('c++')) return { ...DOMAIN_COMPILER_CONFIGS.cpp };
    if (pl.includes('javascript') || pl.includes('react')) return { ...DOMAIN_COMPILER_CONFIGS.femnstack };
  }

  // Fallback for general domain
  return {
    key: norm || 'general',
    label: domainInput || 'General',
    defaultLanguage: 'java',
    allowedLanguages: ['java', 'python', 'javascript', 'cpp'],
    compilers: [
      { id: 'java', name: 'Java (JDK 22)', lang: 'java' },
      { id: 'python', name: 'Python (3.11)', lang: 'python' },
      { id: 'javascript', name: 'JavaScript (Node.js)', lang: 'javascript' },
      { id: 'cpp', name: 'C++ (GCC)', lang: 'cpp' }
    ]
  };
}

function getStarterCodeForLanguage(language, domain = '', topic = '') {
  const lang = (language || 'java').toLowerCase().trim();
  const cleanTopic = topic || 'Problem Solution';

  if (lang === 'python') {
    return `# Solution for: ${cleanTopic}\nimport sys\n\ndef solve():\n    raw_input = sys.stdin.read().strip()\n    # Implement your solution here\n    if raw_input:\n        print(f"Solved: {raw_input.upper()}")\n    else:\n        print("Solved: READY")\n\nif __name__ == '__main__':\n    solve()\n`;
  }

  if (lang === 'javascript') {
    return `// Solution for: ${cleanTopic}\nfunction solution() {\n    const str = prompt("");\n    // Implement your solution here\n    return str;\n}\n\nconst res = solution();\nconsole.log(res);\n`;
  }

  if (lang === 'cpp') {
    return `// Solution for: ${cleanTopic}\n#include <iostream>\n#include <string>\n#include <algorithm>\nusing namespace std;\n\nint main() {\n    string input;\n    if (getline(cin, input)) {\n        // Implement your solution here\n        cout << "Solved: " << input << endl;\n    } else {\n        cout << "Solved: READY" << endl;\n    }\n    return 0;\n}\n`;
  }

  // Default Java
  return `// Solution for: ${cleanTopic}\nimport java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextLine()) {\n            String input = sc.nextLine().trim();\n            // Implement your solution here\n            System.out.println("Solved: " + input.toUpperCase());\n        } else {\n            System.out.println("Solved: READY");\n        }\n    }\n}\n`;
}

module.exports = {
  DOMAIN_COMPILER_CONFIGS,
  getDomainCompilerConfig,
  getStarterCodeForLanguage,
  normalizeDomain
};
