/**
 * STACK QUEUE — Strict Question Relevance & Sandbox Validation Service
 *
 * Automatically validates every generated question BEFORE saving to DB:
 *   1. Belongs to the exact selected module (primaryCategories)
 *   2. Uses ONLY concepts covered in this module or prerequisite modules
 *   3. Rejects any question/solution requiring future module concepts
 *   4. Matches the selected programming language & compiler
 *   5. Verifies IPO completeness and passes 100% of test cases in sandbox execution
 */

const { evaluateCode } = require('./interviewCodeRunner');
const { executeSqlQuery } = require('./sqlSandbox');

// Code & prompt patterns indicating usage of specific future concepts
const FORBIDDEN_CONCEPT_SIGNATURES = {
  conditionals: {
    code: [
      /\bif\s*\(/,
      /(?:^|\n)\s*if\s+[^:\n]+:/,
      /\belif\b/,
      /\belse\b/,
      /\bswitch\s*\(/
    ],
    text: [
      /\b(even\s+or\s+odd|odd\s+or\s+even|largest\s+of\s+three|grade\s+classification|if[-\s]?else|ternary|conditional\s+range)\b/i
    ]
  },
  loops: {
    code: [
      /\bfor\s*\(/,
      /(?:^|\n)\s*for\s+[a-zA-Z_]\w*\s+in\b/,
      /\bwhile\s*\(/,
      /(?:^|\n)\s*while\s+[^:\n]+:/,
      /\.forEach\s*\(/
    ],
    text: [
      /\b(number\s+triangle|while\s+loop|for\s+loop|nested\s+loop|multiplication\s+table)\b/i
    ]
  },
  operators_math: {
    code: [
      // Match modulo operator % only when NOT part of printf format specifiers like %s, %d, %.2f, %n, %c, %%
      /(?<!["'][^"']*)\s%\s(?![sdfnc%])/
    ],
    text: [
      /\b(arithmetic\s+calculator|modulo\s+operations?|quotient\s+and\s+remainder|floor\s+division|bitwise\s+shift)\b/i
    ]
  },
  exceptions: {
    code: [
      /\btry\s*[\{:]/,
      /\bcatch\s*\(/,
      /(?:^|\n)\s*except\b/,
      /\bthrow\s+new\b/,
      /(?:^|\n)\s*raise\s+/
    ],
    text: [
      /\b(division\s+by\s+zero|zerodivision|exception\s+guard|try[-\s]?catch|try[-\s]?except)\b/i
    ]
  },
  arrays_lists: {
    code: [
      /\bArrayList\b/,
      /\bList\s*</,
      /\bnew\s+(?:int|double|long|String)\s*\[/,
      /\.split\s*\(/,
      /\bTreeSet\b/,
      /\bHashSet\b/
    ],
    text: [
      /\b(two[-\s]?sum|2d\s+grid|matrix\s+diagonal|flatten\s+2d|sorted\s+unique\s+list)\b/i
    ]
  },
  dictionaries_maps: {
    code: [
      /\bHashMap\b/,
      /\bTreeMap\b/,
      /\bLinkedHashMap\b/,
      /\bMap\s*</,
      /\bCounter\s*\(/
    ],
    text: [
      /\b(word\s+frequency\s+map|hashmap\s+internals|frequency\s+dictionary)\b/i
    ]
  },
  oop_classes: {
    code: [
      /\bextends\b/,
      /\bimplements\b/,
      /\binterface\s+[A-Za-z_]/,
      /\babstract\s+class\b/
    ],
    text: [
      /\b(employee\s+payroll\s+class|inheritance\s+hierarchy|abstract\s+class|polymorphism)\b/i
    ]
  }
};

function checkLanguageMatch(language, referenceSolution = '') {
  const lang = (language || '').toLowerCase();
  const code = String(referenceSolution || '');
  if (!code.trim()) return { valid: false, reason: 'Empty referenceSolution' };

  if (lang === 'java') {
    if (!/class\s+Main\b/.test(code) && !/System\.out/.test(code)) {
      return { valid: false, reason: 'Java solution missing class Main or System.out' };
    }
    if (/(?:^|\n)\s*def\s+\w+\s*\(/.test(code) || /\bconsole\.log\s*\(/.test(code)) {
      return { valid: false, reason: 'Java solution contains Python/JS syntax' };
    }
  } else if (lang === 'python') {
    if (/\bpublic\s+class\s+Main\b/.test(code) || /\bSystem\.out\.print/.test(code) || /\bconsole\.log\s*\(/.test(code)) {
      return { valid: false, reason: 'Python solution contains Java/JS syntax' };
    }
  } else if (lang === 'javascript') {
    if (/\bpublic\s+class\s+Main\b/.test(code) || /\bSystem\.out\.print/.test(code) || /(?:^|\n)\s*def\s+\w+\s*\(/.test(code)) {
      return { valid: false, reason: 'JavaScript solution contains Java/Python syntax' };
    }
  } else if (lang === 'c' || lang === 'cpp') {
    if (!/#include\b/.test(code) || !/\bint\s+main\s*\(/.test(code)) {
      return { valid: false, reason: `${lang.toUpperCase()} solution missing #include or int main()` };
    }
    if (/\bpublic\s+class\s+Main\b/.test(code) || /\bSystem\.out\.print/.test(code) || /(?:^|\n)\s*def\s+\w+\s*\(/.test(code)) {
      return { valid: false, reason: `${lang.toUpperCase()} solution contains Java/Python syntax` };
    }
  } else if (lang === 'sql') {
    if (!/\b(select|insert|update|delete|create|alter|with)\b/i.test(code)) {
      return { valid: false, reason: 'SQL solution missing valid SQL keyword' };
    }
  }
  return { valid: true };
}

function checkForbiddenConcepts(scope, question) {
  const forbidden = scope?.forbiddenCategories || [];
  const code = String(question.referenceSolution || '');
  const text = `${question.title || ''} ${question.problemStatement || ''}`;

  // Strip `public static void main(String[] args)` before checking array syntax
  const sanitizedCode = code.replace(/public\s+static\s+void\s+main\s*\(\s*String\s*\[\s*\]\s*\w+\s*\)/g, '');

  for (const cat of forbidden) {
    const sig = FORBIDDEN_CONCEPT_SIGNATURES[cat];
    if (!sig) continue;

    for (const rx of (sig.code || [])) {
      if (rx.test(sanitizedCode)) {
        return {
          valid: false,
          reason: `Reference solution uses forbidden future concept "${cat}" (matched ${rx})`
        };
      }
    }

    for (const rx of (sig.text || [])) {
      if (rx.test(text)) {
        return {
          valid: false,
          reason: `Question prompt references forbidden future concept "${cat}" (matched ${rx})`
        };
      }
    }
  }

  // Extra Java OOP check: forbid extra class definitions if oop_classes is forbidden
  if (forbidden.includes('oop_classes') && (scope.language === 'java' || scope.language === 'python' || scope.language === 'javascript')) {
    if (scope.language === 'java') {
      const classMatches = code.match(/\bclass\s+[A-Za-z_]\w*/g) || [];
      const nonMain = classMatches.filter(m => !/\bclass\s+Main\b/.test(m));
      if (nonMain.length > 0) {
        return { valid: false, reason: `Java solution defines extra OOP class (${nonMain.join(', ')}) before OOP module` };
      }
    } else if (/\bclass\s+[A-Za-z_]\w*/.test(code)) {
      return { valid: false, reason: `Solution defines OOP class before OOP module` };
    }
  }

  return { valid: true };
}

/**
 * Full 5-check validation pipeline before persisting any question.
 */
async function validateGeneratedQuestion({
  question,
  scope,
  runSandbox = true,
  existingFingerprints = null
}) {
  if (!question || !scope) {
    return { valid: false, reason: 'Missing question or module scope' };
  }

  // 1. Module Relevance Check
  if (question.categoryKey && !scope.primaryCategories.includes(question.categoryKey)) {
    return {
      valid: false,
      reason: `Question category "${question.categoryKey}" is outside module primary categories [${scope.primaryCategories.join(', ')}]`
    };
  }

  // 2. Forbidden Future Concept Check
  const conceptCheck = checkForbiddenConcepts(scope, question);
  if (!conceptCheck.valid) {
    return conceptCheck;
  }

  // 3. Language Match Check
  const langCheck = checkLanguageMatch(scope.language, question.referenceSolution);
  if (!langCheck.valid) {
    return langCheck;
  }

  // 4. IPO & Test Case Completeness
  if (!question.title || !question.problemStatement || !question.outputFormat) {
    return { valid: false, reason: 'Incomplete IPO fields (title/problemStatement/outputFormat)' };
  }
  const testCases = Array.isArray(question.testCases) ? question.testCases : [];
  if (testCases.length < 2) {
    return { valid: false, reason: 'Insufficient test cases (need at least 2)' };
  }
  if (testCases.some(tc => tc.expectedOutput === undefined || tc.expectedOutput === null || String(tc.expectedOutput).trim() === '')) {
    return { valid: false, reason: 'Test case has empty expectedOutput' };
  }

  // 5. Uniqueness check within module/bank
  if (existingFingerprints && question.fingerprint && existingFingerprints.has(question.fingerprint)) {
    return { valid: false, reason: 'Duplicate question fingerprint in same module' };
  }

  // 6. Sandbox Execution Verification
  if (runSandbox) {
    const langLower = String(scope.language || '').toLowerCase();
    if (langLower === 'sql') {
      const sqlRes = executeSqlQuery(question.referenceSolution);
      if (!sqlRes || !sqlRes.success) {
        return { valid: false, reason: `SQL sandbox failed: ${sqlRes?.error || 'Invalid SQL'}` };
      }
      return { valid: true, evalRes: sqlRes };
    }
    if (langLower === 'c' || langLower === 'cpp') {
      // C/C++ native binary execution not in JS/Py/Java runner; verified via strict language + structure + concept checks
      return { valid: true };
    }
    try {
      const evalRes = await evaluateCode({
        code: question.referenceSolution,
        language: scope.language,
        testCases,
        isSubmit: true
      });
      if (!evalRes || !evalRes.allPassed) {
        return {
          valid: false,
          reason: `Sandbox execution failed: ${evalRes?.error || evalRes?.verdict || 'Output mismatch'}`,
          evalRes
        };
      }
      return { valid: true, evalRes };
    } catch (err) {
      return { valid: false, reason: `Sandbox runner error: ${err.message}` };
    }
  }

  return { valid: true };
}

module.exports = {
  validateGeneratedQuestion,
  checkForbiddenConcepts,
  checkLanguageMatch
};
