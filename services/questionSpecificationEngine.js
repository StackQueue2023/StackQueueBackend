/**
 * STACK QUEUE — Question Specification & Test Case Engine
 * 
 * Generates question-specific problem statements, input/output specifications,
 * sample cases, edge/boundary test cases, starter code, and executable reference solutions.
 * 
 * Eliminates generic templates (alpha -> ALPHA) entirely and ensures 100% question-specific content.
 */

const { evaluatePracticalCode } = require('./practicalCodeRunner');

function clean(str) {
  return (str || '').replace(/[^\w\s-]/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeDomain(str) {
  if (!str) return 'python';
  const s = String(str).toLowerCase().trim();
  if (s.includes('java') && !s.includes('javascript')) return 'java';
  if (s.includes('python')) return 'python';
  if (s.includes('cpp') || s.includes('c++')) return 'cpp';
  if (s.includes('react') || s.includes('femn') || s.includes('javascript') || s.includes('js') || s.includes('web')) return 'javascript';
  if (s.includes('selenium') || s.includes('test')) return 'java';
  return 'python';
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Generates question specification based on topic, module, course, domain, and task index.
 */
function generateQuestionSpec({
  title = '',
  description = '',
  topic = '',
  moduleTitle = '',
  courseTitle = '',
  domain = 'python',
  taskIndex = 1,
  difficulty = 'Easy'
}) {
  const normDomain = normalizeDomain(domain || courseTitle);
  const cleanTopicName = clean(topic || moduleTitle || title || 'Core Programming').slice(0, 60);
  const fullText = `${cleanTopicName} ${moduleTitle} ${title}`.toLowerCase();

  const isPracticalSuite = title.toLowerCase().includes('practical suite') || title.toLowerCase().includes('practice & test');

  // Task blueprint type based on task index (1..15)
  // Each index 1..15 in a module explores a completely different problem facet
  const archetypeOrder = [
    'syntax_formatting',    // Task 1: Overview & Architectural Foundation
    'variables_casting',    // Task 2: Initial Implementation & Declaration
    'operators_math',       // Task 3: Data Manipulation & Operations
    'conditionals_flow',    // Task 4: Conditional Flows & Algorithmic Handling
    'structured_methods',   // Task 5: Structured Processing & Methods
    'exceptions_debug',     // Task 6: Debug Edge Cases & Runtime Exceptions
    'sorting_filtering',    // Task 7: Assessment / Filtering
    'arrays_traversal',     // Task 8: Hands-on Lab
    'dictionaries_maps',    // Task 9: Real-time Scenario
    'strings_transform',    // Task 10: Error Recovery / String Logic
    'oop_classes',          // Task 11: Programming Challenge
    'nested_structures',    // Task 12: Mini-Project
    'loops_patterns',       // Task 13: Design Pattern
    'search_lookup',        // Task 14: Milestone Quiz
    'matrix_grid'           // Task 15: Mastery Challenge
  ];

  let chosenArchetype = archetypeOrder[(taskIndex - 1) % archetypeOrder.length];

  // Specific domain / topic overrides
  if (fullText.includes('scanner') || fullText.includes('bufferedreader')) {
    chosenArchetype = taskIndex % 2 === 0 ? 'scanner_csv' : 'scanner_tokens';
  } else if (fullText.includes('selenium') || fullText.includes('webdriver')) {
    chosenArchetype = 'selenium_sim';
  } else if (fullText.includes('dom') || fullText.includes('form') || fullText.includes('html') || fullText.includes('flex')) {
    chosenArchetype = 'web_form';
  } else if (fullText.includes('tuple')) {
    chosenArchetype = 'tuples_records';
  } else if (isPracticalSuite) {
    chosenArchetype = taskIndex % 2 === 0 ? 'sorting_filtering' : 'structured_methods';
  }

  const seed = hashString(`${title}_${cleanTopicName}_${taskIndex}_${normDomain}`);
  return buildConcreteSpec(chosenArchetype, cleanTopicName, normDomain, seed, difficulty, title);
}

function buildConcreteSpec(archetype, topicName, domain, seed, difficulty, taskTitle) {
  switch (archetype) {
    case 'syntax_formatting':
      return buildSyntaxFormattingSpec(topicName, domain, seed);
    case 'variables_casting':
      return buildVariablesCastingSpec(topicName, domain, seed);
    case 'operators_math':
      return buildOperatorsMathSpec(topicName, domain, seed);
    case 'conditionals_flow':
      return buildConditionalsFlowSpec(topicName, domain, seed);
    case 'structured_methods':
      return buildStructuredMethodsSpec(topicName, domain, seed);
    case 'exceptions_debug':
      return buildExceptionsDebugSpec(topicName, domain, seed);
    case 'sorting_filtering':
      return buildSortingFilteringSpec(topicName, domain, seed);
    case 'arrays_traversal':
      return buildArraysTraversalSpec(topicName, domain, seed);
    case 'dictionaries_maps':
      return buildDictionariesMapsSpec(topicName, domain, seed);
    case 'strings_transform':
      return buildStringsTransformSpec(topicName, domain, seed);
    case 'oop_classes':
      return buildOOPClassesSpec(topicName, domain, seed);
    case 'nested_structures':
      return buildNestedStructuresSpec(topicName, domain, seed);
    case 'loops_patterns':
      return buildLoopsPatternsSpec(topicName, domain, seed);
    case 'search_lookup':
      return buildSearchLookupSpec(topicName, domain, seed);
    case 'matrix_grid':
      return buildMatrixGridSpec(topicName, domain, seed);
    case 'scanner_tokens':
      return buildScannerTokensSpec(topicName, domain, seed);
    case 'scanner_csv':
      return buildScannerCSVSpec(topicName, domain, seed);
    case 'selenium_sim':
      return buildSeleniumSimSpec(topicName, domain, seed);
    case 'web_form':
      return buildWebFormSpec(topicName, domain, seed);
    case 'tuples_records':
      return buildTuplesRecordsSpec(topicName, domain, seed);
    default:
      return buildSyntaxFormattingSpec(topicName, domain, seed);
  }
}

// ─────────────────────────────────────────────────────────────
// 1. SYNTAX & FORMATTING (Task 1 Archetype)
// ─────────────────────────────────────────────────────────────
function buildSyntaxFormattingSpec(topic, domain, seed) {
  const v = {
    titleSuffix: 'Formatted Runtime Configuration Banner',
    problemStatement: `Write a program for **${topic}** that takes a platform name, major version, and minor version. Format and output a standardized runtime banner in the format "[PLATFORM v<MAJOR>.<MINOR>] STATUS: INITIALIZED".`,
    inputFormat: `Three space-separated parameters: Platform (string), Major (int), Minor (int).`,
    outputFormat: `Formatted banner string.`,
    constraints: `Platform contains letters only. 0 <= Major, Minor <= 99.`,
    pyRef: `import sys\n\ndef solve():\n    parts = sys.stdin.read().split()\n    if len(parts) >= 3:\n        p, maj, mn = parts[0], parts[1], parts[2]\n        print(f"[{p} v{maj}.{mn}] STATUS: INITIALIZED")\n\nif __name__ == '__main__':\n    solve()`,
    javaRef: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNext()) {\n            String p = sc.next();\n            int maj = sc.nextInt();\n            int mn = sc.nextInt();\n            System.out.println("[" + p + " v" + maj + "." + mn + "] STATUS: INITIALIZED");\n        }\n    }\n}`,
    jsRef: `const fs = require('fs');\nconst [p, maj, mn] = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\nconsole.log(\`[\${p} v\${maj}.\${mn}] STATUS: INITIALIZED\`);`,
    samples: [
      { in: 'Python 3 11', out: '[Python v3.11] STATUS: INITIALIZED', exp: 'Formats runtime banner for Python 3.11.' },
      { in: 'NodeJS 20 5', out: '[NodeJS v20.5] STATUS: INITIALIZED', exp: 'Formats NodeJS release string.' }
    ],
    edgeCases: [
      { in: 'Java 21 0', out: '[Java v21.0] STATUS: INITIALIZED', exp: 'Zero minor version.' },
      { in: 'Cpp 1 0', out: '[Cpp v1.0] STATUS: INITIALIZED', exp: 'Single digit major version.' }
    ]
  };
  return assembleSpec(v, topic, domain);
}

// ─────────────────────────────────────────────────────────────
// 2. VARIABLES & TYPE CASTING (Task 2 Archetype)
// ─────────────────────────────────────────────────────────────
function buildVariablesCastingSpec(topic, domain, seed) {
  const v = {
    titleSuffix: 'Variable Definitions and Strict Type Casting',
    problemStatement: `Demonstrate variable declaration and type manipulation for **${topic}**. Read an integer base count and a decimal unit cost. Compute the total cost (count * unit_cost), print the total rounded to 2 decimal places, and also print whether the total exceeds 100.00 as "EXCEEDED" or "WITHIN_BUDGET".`,
    inputFormat: `Two space-separated values: Base Count (int) and Unit Cost (float).`,
    outputFormat: `Formatted as: "Total: <cost> | Budget: <status>".`,
    constraints: `1 <= Base Count <= 10^4, 0.01 <= Unit Cost <= 1000.00.`,
    pyRef: `import sys\n\ndef solve():\n    parts = sys.stdin.read().split()\n    if len(parts) >= 2:\n        cnt = int(parts[0])\n        cost = float(parts[1])\n        tot = cnt * cost\n        status = "EXCEEDED" if tot > 100.0 else "WITHIN_BUDGET"\n        print(f"Total: {tot:.2f} | Budget: {status}")\n\nif __name__ == '__main__':\n    solve()`,
    javaRef: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNext()) {\n            int cnt = sc.nextInt();\n            double cost = sc.nextDouble();\n            double tot = cnt * cost;\n            String status = tot > 100.0 ? "EXCEEDED" : "WITHIN_BUDGET";\n            System.out.printf(Locale.US, "Total: %.2f | Budget: %s%n", tot, status);\n        }\n    }\n}`,
    jsRef: `const fs = require('fs');\nconst [cStr, uStr] = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\nconst cnt = parseInt(cStr, 10);\nconst cost = parseFloat(uStr);\nconst tot = cnt * cost;\nconst status = tot > 100.0 ? "EXCEEDED" : "WITHIN_BUDGET";\nconsole.log(\`Total: \${tot.toFixed(2)} | Budget: \${status}\`);`,
    samples: [
      { in: '5 25.50', out: 'Total: 127.50 | Budget: EXCEEDED', exp: '5 * 25.50 = 127.50, exceeds budget of 100.00.' },
      { in: '4 15.20', out: 'Total: 60.80 | Budget: WITHIN_BUDGET', exp: '4 * 15.20 = 60.80, within budget.' }
    ],
    edgeCases: [
      { in: '1 100.00', out: 'Total: 100.00 | Budget: WITHIN_BUDGET', exp: 'Exact boundary 100.00 is within budget.' },
      { in: '10 0.50', out: 'Total: 5.00 | Budget: WITHIN_BUDGET', exp: 'Small unit cost.' }
    ]
  };
  return assembleSpec(v, topic, domain);
}

// ─────────────────────────────────────────────────────────────
// 3. OPERATORS & MATH (Task 3 Archetype)
// ─────────────────────────────────────────────────────────────
function buildOperatorsMathSpec(topic, domain, seed) {
  const v = {
    titleSuffix: 'Arithmetic & Modulo Operations Suite',
    problemStatement: `Perform mathematical and modular transformations in **${topic}**. Given positive integers A and B, output their sum, integer division result (A // B), and remainder (A % B).`,
    inputFormat: `Two space-separated integers A and B.`,
    outputFormat: `Formatted as: "Sum: S | Quotient: Q | Remainder: R".`,
    constraints: `1 <= A, B <= 10^7.`,
    pyRef: `import sys\n\ndef solve():\n    parts = sys.stdin.read().split()\n    if len(parts) >= 2:\n        a, b = int(parts[0]), int(parts[1])\n        print(f"Sum: {a + b} | Quotient: {a // b} | Remainder: {a % b}")\n\nif __name__ == '__main__':\n    solve()`,
    javaRef: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextLong()) {\n            long a = sc.nextLong();\n            long b = sc.nextLong();\n            System.out.println("Sum: " + (a + b) + " | Quotient: " + (a / b) + " | Remainder: " + (a % b));\n        }\n    }\n}`,
    jsRef: `const fs = require('fs');\nconst [a, b] = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/).map(Number);\nconsole.log(\`Sum: \${a + b} | Quotient: \${Math.floor(a / b)} | Remainder: \${a % b}\`);`,
    samples: [
      { in: '25 4', out: 'Sum: 29 | Quotient: 6 | Remainder: 1', exp: '25+4=29, 25//4=6, 25%4=1.' },
      { in: '50 10', out: 'Sum: 60 | Quotient: 5 | Remainder: 0', exp: 'Exact division with 0 remainder.' }
    ],
    edgeCases: [
      { in: '7 12', out: 'Sum: 19 | Quotient: 0 | Remainder: 7', exp: 'A is smaller than B.' },
      { in: '100 1', out: 'Sum: 101 | Quotient: 100 | Remainder: 0', exp: 'Divisor is 1.' }
    ]
  };
  return assembleSpec(v, topic, domain);
}

// ─────────────────────────────────────────────────────────────
// 4. CONDITIONALS & LOGICAL FLOW (Task 4 Archetype)
// ─────────────────────────────────────────────────────────────
function buildConditionalsFlowSpec(topic, domain, seed) {
  const v = {
    titleSuffix: 'Conditional Range & Classification Logic',
    problemStatement: `Implement decision logic for **${topic}**. Given a student numerical score (0 to 100): \n- 90 to 100: "GRADE_A"\n- 75 to 89: "GRADE_B"\n- 50 to 74: "GRADE_C"\n- Below 50: "RETRY".\nPrint the corresponding grade.`,
    inputFormat: `A single integer score between 0 and 100.`,
    outputFormat: `Grade string.`,
    constraints: `0 <= Score <= 100.`,
    pyRef: `import sys\n\ndef solve():\n    raw = sys.stdin.read().strip()\n    if raw:\n        s = int(raw)\n        if s >= 90: print("GRADE_A")\n        elif s >= 75: print("GRADE_B")\n        elif s >= 50: print("GRADE_C")\n        else: print("RETRY")\n\nif __name__ == '__main__':\n    solve()`,
    javaRef: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextInt()) {\n            int s = sc.nextInt();\n            if (s >= 90) System.out.println("GRADE_A");\n            else if (s >= 75) System.out.println("GRADE_B");\n            else if (s >= 50) System.out.println("GRADE_C");\n            else System.out.println("RETRY");\n        }\n    }\n}`,
    jsRef: `const fs = require('fs');\nconst s = Number(fs.readFileSync(0, 'utf-8').trim());\nif (s >= 90) console.log("GRADE_A");\nelse if (s >= 75) console.log("GRADE_B");\nelse if (s >= 50) console.log("GRADE_C");\nelse console.log("RETRY");`,
    samples: [
      { in: '95', out: 'GRADE_A', exp: 'Score 95 qualifies for GRADE_A.' },
      { in: '62', out: 'GRADE_C', exp: 'Score 62 falls in 50-74 range.' }
    ],
    edgeCases: [
      { in: '90', out: 'GRADE_A', exp: 'Exact boundary for Grade A.' },
      { in: '75', out: 'GRADE_B', exp: 'Exact boundary for Grade B.' },
      { in: '49', out: 'RETRY', exp: 'Boundary for Retry.' },
      { in: '0', out: 'RETRY', exp: 'Minimum score.' }
    ]
  };
  return assembleSpec(v, topic, domain);
}

// ─────────────────────────────────────────────────────────────
// 5. STRUCTURED PROCESSING & METHODS (Task 5 Archetype)
// ─────────────────────────────────────────────────────────────
function buildStructuredMethodsSpec(topic, domain, seed) {
  const v = {
    titleSuffix: 'Modular Function: GCD & LCM Calculator',
    problemStatement: `Implement structured reusable methods for **${topic}**. Create helper functions to calculate the Greatest Common Divisor (GCD) and Least Common Multiple (LCM) of two positive integers X and Y.`,
    inputFormat: `Two space-separated integers X and Y.`,
    outputFormat: `Formatted as: "GCD: <gcd> | LCM: <lcm>".`,
    constraints: `1 <= X, Y <= 10^8.`,
    pyRef: `import sys\n\ndef gcd(a, b):\n    while b:\n        a, b = b, a % b\n    return a\n\ndef solve():\n    parts = sys.stdin.read().split()\n    if len(parts) >= 2:\n        x, y = int(parts[0]), int(parts[1])\n        g = gcd(x, y)\n        l = (x * y) // g\n        print(f"GCD: {g} | LCM: {l}")\n\nif __name__ == '__main__':\n    solve()`,
    javaRef: `import java.util.*;\n\npublic class Main {\n    static long gcd(long a, long b) {\n        while (b != 0) {\n            long t = b;\n            b = a % b;\n            a = t;\n        }\n        return a;\n    }\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextLong()) {\n            long x = sc.nextLong();\n            long y = sc.nextLong();\n            long g = gcd(x, y);\n            long l = (x / g) * y;\n            System.out.println("GCD: " + g + " | LCM: " + l);\n        }\n    }\n}`,
    jsRef: `const fs = require('fs');\nconst [x, y] = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/).map(BigInt);\nfunction gcd(a, b) {\n  while (b !== 0n) { let t = b; b = a % b; a = t; }\n  return a;\n}\nconst g = gcd(x, y);\nconst l = (x / g) * y;\nconsole.log(\`GCD: \${g.toString()} | LCM: \${l.toString()}\`);`,
    samples: [
      { in: '12 18', out: 'GCD: 6 | LCM: 36', exp: 'GCD is 6, LCM is 36.' },
      { in: '15 25', out: 'GCD: 5 | LCM: 75', exp: 'GCD is 5, LCM is 75.' }
    ],
    edgeCases: [
      { in: '7 13', out: 'GCD: 1 | LCM: 91', exp: 'Co-prime integers.' },
      { in: '100 100', out: 'GCD: 100 | LCM: 100', exp: 'Identical numbers.' }
    ]
  };
  return assembleSpec(v, topic, domain);
}

// ─────────────────────────────────────────────────────────────
// 6. EXCEPTIONS & DEBUGGING (Task 6 Archetype)
// ─────────────────────────────────────────────────────────────
function buildExceptionsDebugSpec(topic, domain, seed) {
  const v = {
    titleSuffix: 'Safe Division & ZeroDivision Exception Guard',
    problemStatement: `Implement exception handling in **${topic}**. Read two integers Numerator and Denominator. Safely divide Numerator by Denominator. If Denominator is zero, catch the exception and print "ERROR: DIVISION_BY_ZERO". Otherwise print integer quotient.`,
    inputFormat: `Two space-separated integers: Numerator and Denominator.`,
    outputFormat: `Integer quotient or "ERROR: DIVISION_BY_ZERO".`,
    constraints: `-10^6 <= Numerator <= 10^6, -10^6 <= Denominator <= 10^6.`,
    pyRef: `import sys\n\ndef solve():\n    parts = sys.stdin.read().split()\n    if len(parts) >= 2:\n        num, den = int(parts[0]), int(parts[1])\n        try:\n            res = num // den\n            print(res)\n        except ZeroDivisionError:\n            print("ERROR: DIVISION_BY_ZERO")\n\nif __name__ == '__main__':\n    solve()`,
    javaRef: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextInt()) {\n            int num = sc.nextInt();\n            int den = sc.nextInt();\n            try {\n                int res = num / den;\n                System.out.println(res);\n            } catch (ArithmeticException e) {\n                System.out.println("ERROR: DIVISION_BY_ZERO");\n            }\n        }\n    }\n}`,
    jsRef: `const fs = require('fs');\nconst [num, den] = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/).map(Number);\nif (den === 0) console.log("ERROR: DIVISION_BY_ZERO");\nelse console.log(Math.floor(num / den));`,
    samples: [
      { in: '20 4', out: '5', exp: '20 // 4 = 5.' },
      { in: '15 0', out: 'ERROR: DIVISION_BY_ZERO', exp: 'Division by zero safely trapped.' }
    ],
    edgeCases: [
      { in: '0 5', out: '0', exp: 'Zero numerator is valid and equals 0.' },
      { in: '-30 6', out: '-5', exp: 'Negative numerator.' }
    ]
  };
  return assembleSpec(v, topic, domain);
}

// ─────────────────────────────────────────────────────────────
// 7. SORTING & FILTERING (Task 7 Archetype)
// ─────────────────────────────────────────────────────────────
function buildSortingFilteringSpec(topic, domain, seed) {
  const v = {
    titleSuffix: 'Even Number Filter & Descending Sort',
    problemStatement: `Filter and sort elements for **${topic}**. Given an array of integers, extract all even integers, eliminate duplicates, and output them in strictly descending order. If no even integers exist, print "NONE".`,
    inputFormat: `A single line of space-separated integers.`,
    outputFormat: `Space-separated unique even integers in descending order, or "NONE".`,
    constraints: `1 <= array.length <= 10^4. Integers are between -1000 and 1000.`,
    pyRef: `import sys\n\ndef solve():\n    nums = list(map(int, sys.stdin.read().split()))\n    evens = sorted(list(set(x for x in nums if x % 2 == 0)), reverse=True)\n    print(" ".join(map(str, evens)) if evens else "NONE")\n\nif __name__ == '__main__':\n    solve()`,
    javaRef: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        TreeSet<Integer> set = new TreeSet<>(Collections.reverseOrder());\n        while (sc.hasNextInt()) {\n            int v = sc.nextInt();\n            if (v % 2 == 0) set.add(v);\n        }\n        if (set.isEmpty()) {\n            System.out.println("NONE");\n        } else {\n            StringBuilder sb = new StringBuilder();\n            for (int v : set) {\n                if (sb.length() > 0) sb.append(" ");\n                sb.append(v);\n            }\n            System.out.println(sb.toString());\n        }\n    }\n}`,
    jsRef: `const fs = require('fs');\nconst nums = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/).map(Number);\nconst evens = Array.from(new Set(nums.filter(x => x % 2 === 0))).sort((a,b)=>b-a);\nconsole.log(evens.length ? evens.join(' ') : "NONE");`,
    samples: [
      { in: '10 3 4 8 3 10 7', out: '10 8 4', exp: 'Even numbers are 10, 4, 8, deduplicated and sorted descending.' },
      { in: '1 3 5 7 9', out: 'NONE', exp: 'No even integers.' }
    ],
    edgeCases: [
      { in: '0 -2 -4', out: '0 -2 -4', exp: 'Includes zero and negative evens.' },
      { in: '2 2 2', out: '2', exp: 'All duplicates of single even.' }
    ]
  };
  return assembleSpec(v, topic, domain);
}

// ─────────────────────────────────────────────────────────────
// 8. ARRAYS TRAVERSAL (Task 8 Archetype)
// ─────────────────────────────────────────────────────────────
function buildArraysTraversalSpec(topic, domain, seed) {
  const v = {
    titleSuffix: 'Two Sum Target Index Pair Finder',
    problemStatement: `Solve the Two-Sum problem for **${topic}**. Given an array of integers and a target integer T, find the two 0-based indices whose elements sum up to T. Print the smaller index first. Assume exactly one valid pair exists.`,
    inputFormat: `Line 1: Target integer T. Line 2: Space-separated integers.`,
    outputFormat: `Two space-separated indices: "i j".`,
    constraints: `2 <= array.length <= 10^4. Target fits in integer range.`,
    pyRef: `import sys\n\ndef solve():\n    lines = [l.strip() for l in sys.stdin.read().splitlines() if l.strip()]\n    if len(lines) >= 2:\n        target = int(lines[0])\n        nums = list(map(int, lines[1].split()))\n        seen = {}\n        for i, x in enumerate(nums):\n            rem = target - x\n            if rem in seen:\n                print(f"{seen[rem]} {i}")\n                return\n            seen[x] = i\n\nif __name__ == '__main__':\n    solve()`,
    javaRef: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int target = sc.nextInt();\n        List<Integer> list = new ArrayList<>();\n        while (sc.hasNextInt()) list.add(sc.nextInt());\n        Map<Integer, Integer> map = new HashMap<>();\n        for (int i = 0; i < list.size(); i++) {\n            int rem = target - list.get(i);\n            if (map.containsKey(rem)) {\n                System.out.println(map.get(rem) + " " + i);\n                return;\n            }\n            map.put(list.get(i), i);\n        }\n    }\n}`,
    jsRef: `const fs = require('fs');\nconst lines = fs.readFileSync(0, 'utf-8').trim().split('\\n').map(s=>s.trim()).filter(Boolean);\nconst target = Number(lines[0]);\nconst nums = lines[1].split(/\\s+/).map(Number);\nconst map = new Map();\nfor (let i = 0; i < nums.length; i++) {\n  const rem = target - nums[i];\n  if (map.has(rem)) {\n    console.log(\`\${map.get(rem)} \${i}\`);\n    process.exit(0);\n  }\n  map.set(nums[i], i);\n}`,
    samples: [
      { in: '9\n2 7 11 15', out: '0 1', exp: 'nums[0] + nums[1] = 2 + 7 = 9.' },
      { in: '6\n3 2 4', out: '1 2', exp: 'nums[1] + nums[2] = 2 + 4 = 6.' }
    ],
    edgeCases: [
      { in: '6\n3 3', out: '0 1', exp: 'Identical elements forming target.' },
      { in: '0\n-5 5', out: '0 1', exp: 'Negative and positive summing to zero.' }
    ]
  };
  return assembleSpec(v, topic, domain);
}

// ─────────────────────────────────────────────────────────────
// 9. DICTIONARIES & MAPS (Task 9 Archetype)
// ─────────────────────────────────────────────────────────────
function buildDictionariesMapsSpec(topic, domain, seed) {
  const v = {
    titleSuffix: 'Word Frequency Map and Top Token',
    problemStatement: `Build a frequency mapping dictionary for **${topic}**. Read space-separated words, count occurrences of each word (case-insensitive), and print: total unique word count, and the word with the highest frequency.`,
    inputFormat: `A single line of space-separated words.`,
    outputFormat: `Formatted as: "Unique: <count> | Most Frequent: <word> (<freq>)".`,
    constraints: `1 <= words.length <= 10^4.`,
    pyRef: `import sys\nfrom collections import Counter\n\ndef solve():\n    words = [w.lower() for w in sys.stdin.read().split()]\n    if not words: return\n    c = Counter(words)\n    top_w, top_cnt = c.most_common(1)[0]\n    print(f"Unique: {len(c)} | Most Frequent: {top_w} ({top_cnt})")\n\nif __name__ == '__main__':\n    solve()`,
    javaRef: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        Map<String, Integer> map = new LinkedHashMap<>();\n        while (sc.hasNext()) {\n            String w = sc.next().toLowerCase();\n            map.put(w, map.getOrDefault(w, 0) + 1);\n        }\n        if (map.isEmpty()) return;\n        String topW = "";\n        int maxC = 0;\n        for (Map.Entry<String, Integer> e : map.entrySet()) {\n            if (e.getValue() > maxC) {\n                maxC = e.getValue();\n                topW = e.getKey();\n            }\n        }\n        System.out.println("Unique: " + map.size() + " | Most Frequent: " + topW + " (" + maxC + ")");\n    }\n}`,
    jsRef: `const fs = require('fs');\nconst words = fs.readFileSync(0, 'utf-8').trim().toLowerCase().split(/\\s+/).filter(Boolean);\nif (!words.length) process.exit(0);\nconst map = {};\nfor (const w of words) map[w] = (map[w] || 0) + 1;\nlet topW = '', maxC = 0;\nfor (const [w, c] of Object.entries(map)) {\n  if (c > maxC) { maxC = c; topW = w; }\n}\nconsole.log(\`Unique: \${Object.keys(map).length} | Most Frequent: \${topW} (\${maxC})\`);`,
    samples: [
      { in: 'python code python clean code python', out: 'Unique: 3 | Most Frequent: python (3)', exp: 'python occurs 3 times, code 2 times, clean 1 time.' },
      { in: 'data data structures', out: 'Unique: 2 | Most Frequent: data (2)', exp: 'data is top word.' }
    ],
    edgeCases: [
      { in: 'single', out: 'Unique: 1 | Most Frequent: single (1)', exp: 'Single word.' },
      { in: 'A a A a', out: 'Unique: 1 | Most Frequent: a (4)', exp: 'Case-insensitivity test.' }
    ]
  };
  return assembleSpec(v, topic, domain);
}

// ─────────────────────────────────────────────────────────────
// 10. STRINGS TRANSFORM (Task 10 Archetype)
// ─────────────────────────────────────────────────────────────
function buildStringsTransformSpec(topic, domain, seed) {
  const v = {
    titleSuffix: 'Palindrome Alphanumeric Sanitize & Verification',
    problemStatement: `Implement text normalization in **${topic}**. Determine if a sentence is a Palindrome considering only alphanumeric characters and ignoring casing. Print "PALINDROME" if true, else "NOT_PALINDROME".`,
    inputFormat: `A single line containing a string sentence.`,
    outputFormat: `"PALINDROME" or "NOT_PALINDROME".`,
    constraints: `1 <= string.length <= 10^5.`,
    pyRef: `import sys\nimport re\n\ndef solve():\n    raw = sys.stdin.read().strip()\n    clean = re.sub(r'[^a-zA-Z0-9]', '', raw).lower()\n    if clean == clean[::-1]:\n        print("PALINDROME")\n    else:\n        print("NOT_PALINDROME")\n\nif __name__ == '__main__':\n    solve()`,
    javaRef: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextLine()) return;\n        String raw = sc.nextLine();\n        String clean = raw.replaceAll("[^a-zA-Z0-9]", "").toLowerCase();\n        String rev = new StringBuilder(clean).reverse().toString();\n        if (clean.equals(rev)) System.out.println("PALINDROME");\n        else System.out.println("NOT_PALINDROME");\n    }\n}`,
    jsRef: `const fs = require('fs');\nconst raw = fs.readFileSync(0, 'utf-8').trim();\nconst clean = raw.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();\nconst rev = clean.split('').reverse().join('');\nconsole.log(clean === rev ? "PALINDROME" : "NOT_PALINDROME");`,
    samples: [
      { in: 'A man, a plan, a canal: Panama', out: 'PALINDROME', exp: 'Becomes "amanaplanacanalpanama" which reads identical reversed.' },
      { in: 'race a car', out: 'NOT_PALINDROME', exp: '"raceacar" is not a palindrome.' }
    ],
    edgeCases: [
      { in: 'Was it a car or a cat I saw?', out: 'PALINDROME', exp: 'Complex sentence palindrome.' },
      { in: 'a', out: 'PALINDROME', exp: 'Single character.' }
    ]
  };
  return assembleSpec(v, topic, domain);
}

// ─────────────────────────────────────────────────────────────
// 11. OOP & CLASSES (Task 11 Archetype)
// ─────────────────────────────────────────────────────────────
function buildOOPClassesSpec(topic, domain, seed) {
  const v = {
    titleSuffix: 'Encapsulated Employee Payroll Class',
    problemStatement: `Design an Employee class for **${topic}**. Given an employee ID, base salary, and bonus percentage, calculate the gross payout: base + (base * bonus / 100). Output formatted payroll record.`,
    inputFormat: `Three space-separated parameters: EmployeeID (string), BaseSalary (int), BonusPercent (int).`,
    outputFormat: `Formatted as: "Employee: <ID> | Net Payout: <payout>".`,
    constraints: `BaseSalary >= 1000. 0 <= BonusPercent <= 100.`,
    pyRef: `import sys\n\ndef solve():\n    parts = sys.stdin.read().split()\n    if len(parts) >= 3:\n        eid = parts[0]\n        base = int(parts[1])\n        bonus = int(parts[2])\n        payout = base + (base * bonus // 100)\n        print(f"Employee: {eid} | Net Payout: {payout}")\n\nif __name__ == '__main__':\n    solve()`,
    javaRef: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNext()) {\n            String eid = sc.next();\n            long base = sc.nextLong();\n            int bonus = sc.nextInt();\n            long payout = base + (base * bonus / 100);\n            System.out.println("Employee: " + eid + " | Net Payout: " + payout);\n        }\n    }\n}`,
    jsRef: `const fs = require('fs');\nconst [eid, bStr, bonStr] = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\nconst base = Number(bStr), bonus = Number(bonStr);\nconst payout = base + Math.floor(base * bonus / 100);\nconsole.log(\`Employee: \${eid} | Net Payout: \${payout}\`);`,
    samples: [
      { in: 'EMP-101 50000 10', out: 'Employee: EMP-101 | Net Payout: 55000', exp: '50000 + 10% = 55000.' },
      { in: 'EMP-205 80000 0', out: 'Employee: EMP-205 | Net Payout: 80000', exp: 'Zero bonus.' }
    ],
    edgeCases: [
      { in: 'EMP-300 100000 25', out: 'Employee: EMP-300 | Net Payout: 125000', exp: 'Quarter bonus.' },
      { in: 'EMP-001 10000 100', out: 'Employee: EMP-001 | Net Payout: 20000', exp: 'Double bonus.' }
    ]
  };
  return assembleSpec(v, topic, domain);
}

// ─────────────────────────────────────────────────────────────
// 12. NESTED STRUCTURES (Task 12 Archetype)
// ─────────────────────────────────────────────────────────────
function buildNestedStructuresSpec(topic, domain, seed) {
  const v = {
    titleSuffix: 'Flatten 2D Grid to Sorted Unique List',
    problemStatement: `Process nested multi-dimensional structures in **${topic}**. Given N rows where each row contains space-separated integers, flatten the 2D grid into a 1D sequence, remove duplicates, and output sorted ascending.`,
    inputFormat: `Line 1: integer N (row count). Followed by N lines of space-separated integers.`,
    outputFormat: `Space-separated sorted unique integers.`,
    constraints: `1 <= N <= 50. Row elements fit in standard integer range.`,
    pyRef: `import sys\n\ndef solve():\n    lines = [l.strip() for l in sys.stdin.read().splitlines() if l.strip()]\n    if not lines: return\n    n = int(lines[0])\n    nums = []\n    for l in lines[1:n+1]:\n        nums.extend(map(int, l.split()))\n    uniq = sorted(list(set(nums)))\n    print(" ".join(map(str, uniq)))\n\nif __name__ == '__main__':\n    solve()`,
    javaRef: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextInt()) return;\n        int n = sc.nextInt();\n        TreeSet<Integer> set = new TreeSet<>();\n        while (sc.hasNextInt()) {\n            set.add(sc.nextInt());\n        }\n        StringBuilder sb = new StringBuilder();\n        for (int v : set) {\n            if (sb.length() > 0) sb.append(" ");\n            sb.append(v);\n        }\n        System.out.println(sb.toString());\n    }\n}`,
    jsRef: `const fs = require('fs');\nconst lines = fs.readFileSync(0, 'utf-8').trim().split('\\n').map(s=>s.trim()).filter(Boolean);\nif (!lines.length) process.exit(0);\nconst n = Number(lines[0]);\nconst all = [];\nfor (let i = 1; i <= n && i < lines.length; i++) {\n  all.push(...lines[i].split(/\\s+/).map(Number));\n}\nconst uniq = Array.from(new Set(all)).sort((a,b)=>a-b);\nconsole.log(uniq.join(' '));`,
    samples: [
      { in: '3\n1 5 3\n5 8 2\n9 1 4', out: '1 2 3 4 5 8 9', exp: 'Flattens 3 rows, removes duplicate 1 and 5, sorts 1..9.' },
      { in: '2\n10 20\n30 40', out: '10 20 30 40', exp: '2x2 grid sorted.' }
    ],
    edgeCases: [
      { in: '1\n7 7 7', out: '7', exp: 'Single row of identical numbers.' },
      { in: '2\n-5 0\n0 5', out: '-5 0 5', exp: 'Negative numbers and zero.' }
    ]
  };
  return assembleSpec(v, topic, domain);
}

// ─────────────────────────────────────────────────────────────
// 13. LOOPS PATTERNS (Task 13 Archetype)
// ─────────────────────────────────────────────────────────────
function buildLoopsPatternsSpec(topic, domain, seed) {
  const v = {
    titleSuffix: 'Number Triangle Generator',
    problemStatement: `Generate an ascending number triangle for **${topic}**. Given integer N, print N lines where the i-th line contains numbers 1 to i separated by space.`,
    inputFormat: `A single integer N.`,
    outputFormat: `N rows of numbers.`,
    constraints: `1 <= N <= 10.`,
    pyRef: `import sys\n\ndef solve():\n    raw = sys.stdin.read().strip()\n    if not raw: return\n    n = int(raw)\n    for i in range(1, n + 1):\n        print(" ".join(str(x) for x in range(1, i + 1)))\n\nif __name__ == '__main__':\n    solve()`,
    javaRef: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextInt()) {\n            int n = sc.nextInt();\n            for (int i = 1; i <= n; i++) {\n                StringBuilder sb = new StringBuilder();\n                for (int j = 1; j <= i; j++) {\n                    if (j > 1) sb.append(" ");\n                    sb.append(j);\n                }\n                System.out.println(sb.toString());\n            }\n        }\n    }\n}`,
    jsRef: `const fs = require('fs');\nconst n = Number(fs.readFileSync(0, 'utf-8').trim());\nfor (let i = 1; i <= n; i++) {\n  const row = [];\n  for (let j = 1; j <= i; j++) row.push(j);\n  console.log(row.join(' '));\n}`,
    samples: [
      { in: '4', out: '1\n1 2\n1 2 3\n1 2 3 4', exp: '4 rows triangle.' },
      { in: '2', out: '1\n1 2', exp: '2 rows triangle.' }
    ],
    edgeCases: [
      { in: '1', out: '1', exp: 'Base case single row.' },
      { in: '3', out: '1\n1 2\n1 2 3', exp: '3 rows triangle.' }
    ]
  };
  return assembleSpec(v, topic, domain);
}

// ─────────────────────────────────────────────────────────────
// 14. SEARCH & LOOKUP (Task 14 Archetype)
// ─────────────────────────────────────────────────────────────
function buildSearchLookupSpec(topic, domain, seed) {
  const v = {
    titleSuffix: 'First and Last Occurrence Search',
    problemStatement: `Implement binary or linear search in **${topic}**. Given a sorted array of integers and a target integer T, find the first and last 0-based index of T. If T is not present, print "-1 -1".`,
    inputFormat: `Line 1: Target T. Line 2: Space-separated integers.`,
    outputFormat: `Two space-separated indices: "first last".`,
    constraints: `1 <= array.length <= 10^5.`,
    pyRef: `import sys\n\ndef solve():\n    lines = [l.strip() for l in sys.stdin.read().splitlines() if l.strip()]\n    if len(lines) >= 2:\n        target = int(lines[0])\n        nums = list(map(int, lines[1].split()))\n        first = -1\n        last = -1\n        for i, x in enumerate(nums):\n            if x == target:\n                if first == -1: first = i\n                last = i\n        print(f"{first} {last}")\n\nif __name__ == '__main__':\n    solve()`,
    javaRef: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int target = sc.nextInt();\n        int first = -1, last = -1, idx = 0;\n        while (sc.hasNextInt()) {\n            int x = sc.nextInt();\n            if (x == target) {\n                if (first == -1) first = idx;\n                last = idx;\n            }\n            idx++;\n        }\n        System.out.println(first + " " + last);\n    }\n}`,
    jsRef: `const fs = require('fs');\nconst lines = fs.readFileSync(0, 'utf-8').trim().split('\\n').map(s=>s.trim()).filter(Boolean);\nconst target = Number(lines[0]);\nconst nums = lines[1].split(/\\s+/).map(Number);\nconst first = nums.indexOf(target);\nconst last = nums.lastIndexOf(target);\nconsole.log(\`\${first} \${last}\`);`,
    samples: [
      { in: '3\n1 2 3 3 3 4 5', out: '2 4', exp: '3 first appears at index 2, last at index 4.' },
      { in: '8\n1 2 4 5 7', out: '-1 -1', exp: '8 is not in the array.' }
    ],
    edgeCases: [
      { in: '5\n5', out: '0 0', exp: 'Single element array equals target.' },
      { in: '2\n2 2 2 2', out: '0 3', exp: 'All elements equal target.' }
    ]
  };
  return assembleSpec(v, topic, domain);
}

// ─────────────────────────────────────────────────────────────
// 15. MATRIX / GRID (Task 15 Archetype)
// ─────────────────────────────────────────────────────────────
function buildMatrixGridSpec(topic, domain, seed) {
  const v = {
    titleSuffix: 'Matrix Diagonal Difference',
    problemStatement: `Compute matrix geometry for **${topic}**. Given a square matrix of size N x N, calculate the absolute difference between the sums of its primary diagonal (top-left to bottom-right) and secondary diagonal (top-right to bottom-left).`,
    inputFormat: `Line 1: N (matrix size). Followed by N lines of N integers each.`,
    outputFormat: `A single integer representing absolute diagonal difference.`,
    constraints: `1 <= N <= 100. -1000 <= Matrix[i][j] <= 1000.`,
    pyRef: `import sys\n\ndef solve():\n    lines = [l.strip() for l in sys.stdin.read().splitlines() if l.strip()]\n    if not lines: return\n    n = int(lines[0])\n    diag1 = 0\n    diag2 = 0\n    for i in range(n):\n        row = list(map(int, lines[i + 1].split()))\n        diag1 += row[i]\n        diag2 += row[n - 1 - i]\n    print(abs(diag1 - diag2))\n\nif __name__ == '__main__':\n    solve()`,
    javaRef: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextInt()) return;\n        int n = sc.nextInt();\n        long d1 = 0, d2 = 0;\n        for (int i = 0; i < n; i++) {\n            for (int j = 0; j < n; j++) {\n                long val = sc.nextLong();\n                if (i == j) d1 += val;\n                if (i + j == n - 1) d2 += val;\n            }\n        }\n        System.out.println(Math.abs(d1 - d2));\n    }\n}`,
    jsRef: `const fs = require('fs');\nconst lines = fs.readFileSync(0, 'utf-8').trim().split('\\n').map(s=>s.trim()).filter(Boolean);\nif (!lines.length) process.exit(0);\nconst n = Number(lines[0]);\nlet d1 = 0, d2 = 0;\nfor (let i = 0; i < n; i++) {\n  const row = lines[i + 1].split(/\\s+/).map(Number);\n  d1 += row[i];\n  d2 += row[n - 1 - i];\n}\nconsole.log(Math.abs(d1 - d2));`,
    samples: [
      { in: '3\n11 2 4\n4 5 6\n10 8 -12', out: '15', exp: 'Primary diagonal = 11 + 5 + (-12) = 4. Secondary = 4 + 5 + 10 = 19. |4 - 19| = 15.' },
      { in: '2\n1 2\n3 4', out: '0', exp: 'Primary = 1 + 4 = 5. Secondary = 2 + 3 = 5. |5 - 5| = 0.' }
    ],
    edgeCases: [
      { in: '1\n10', out: '0', exp: '1x1 matrix has identical diagonals, difference 0.' },
      { in: '2\n-1 -2\n-3 -4', out: '0', exp: 'Negative numbers matrix.' }
    ]
  };
  return assembleSpec(v, topic, domain);
}

// ─────────────────────────────────────────────────────────────
// SPECIALIZED: SCANNER TOKENS & CSV
// ─────────────────────────────────────────────────────────────
function buildScannerTokensSpec(topic, domain, seed) {
  const v = {
    titleSuffix: 'Scanner Class: Token Counting & Integer Sum',
    problemStatement: `In Java/Python input parsing for **${topic}**, read space-separated tokens from standard input. Filter and sum all valid integer tokens, and count non-integer words. Output formatted statistics.`,
    inputFormat: `A single line of space-separated tokens.`,
    outputFormat: `Formatted as: "Sum: <sum> | Skipped: <skipped_count>".`,
    constraints: `1 <= tokens.length <= 100.`,
    pyRef: `import sys\n\ndef solve():\n    tokens = sys.stdin.read().split()\n    s = 0\n    skipped = 0\n    for t in tokens:\n        try:\n            s += int(t)\n        except ValueError:\n            skipped += 1\n    print(f"Sum: {s} | Skipped: {skipped}")\n\nif __name__ == '__main__':\n    solve()`,
    javaRef: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int sum = 0, skipped = 0;\n        while (sc.hasNext()) {\n            String tok = sc.next();\n            try {\n                sum += Integer.parseInt(tok);\n            } catch (NumberFormatException e) {\n                skipped++;\n            }\n        }\n        System.out.println("Sum: " + sum + " | Skipped: " + skipped);\n    }\n}`,
    jsRef: `const fs = require('fs');\nconst tokens = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/).filter(Boolean);\nlet s = 0, skipped = 0;\nfor (const t of tokens) {\n  const num = Number(t);\n  if (!isNaN(num) && Number.isInteger(num)) s += num;\n  else skipped++;\n}\nconsole.log(\`Sum: \${s} | Skipped: \${skipped}\`);`,
    samples: [
      { in: '10 apple 20 banana -5', out: 'Sum: 25 | Skipped: 2', exp: '10 + 20 + (-5) = 25, while apple and banana are skipped.' },
      { in: '1 2 3 4 5', out: 'Sum: 15 | Skipped: 0', exp: 'All tokens are valid integers.' }
    ],
    edgeCases: [
      { in: 'alpha beta gamma', out: 'Sum: 0 | Skipped: 3', exp: 'No integers.' },
      { in: '-50 50', out: 'Sum: 0 | Skipped: 0', exp: 'Negative and positive cancel out.' }
    ]
  };
  return assembleSpec(v, topic, domain);
}

function buildScannerCSVSpec(topic, domain, seed) {
  const v = {
    titleSuffix: 'Scanner Delimiter Parsing for User Record',
    problemStatement: `Parse comma-delimited input stream for **${topic}**. Given "Name,Department,Salary", output: "User: <Name> | Dept: <Department> | Gross: <Salary>".`,
    inputFormat: `A single line formatted as Name,Department,Salary.`,
    outputFormat: `Formatted profile string.`,
    constraints: `Fields are separated by commas.`,
    pyRef: `import sys\n\ndef solve():\n    raw = sys.stdin.read().strip()\n    parts = [p.strip() for p in raw.split(',')]\n    if len(parts) >= 3:\n        print(f"User: {parts[0]} | Dept: {parts[1]} | Gross: {parts[2]}")\n\nif __name__ == '__main__':\n    solve()`,
    javaRef: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextLine()) {\n            String[] parts = sc.nextLine().split(",");\n            if (parts.length >= 3) {\n                System.out.println("User: " + parts[0].trim() + " | Dept: " + parts[1].trim() + " | Gross: " + parts[2].trim());\n            }\n        }\n    }\n}`,
    jsRef: `const fs = require('fs');\nconst line = fs.readFileSync(0, 'utf-8').trim();\nconst parts = line.split(',').map(s=>s.trim());\nconsole.log(\`User: \${parts[0]} | Dept: \${parts[1]} | Gross: \${parts[2]}\`);`,
    samples: [
      { in: 'Aravind,Engineering,85000', out: 'User: Aravind | Dept: Engineering | Gross: 85000', exp: 'Parses Aravind user record.' },
      { in: 'Priya,Design,65000', out: 'User: Priya | Dept: Design | Gross: 65000', exp: 'Parses Priya user record.' }
    ],
    edgeCases: [
      { in: 'Kavitha , Marketing , 72000', out: 'User: Kavitha | Dept: Marketing | Gross: 72000', exp: 'Padded spaces around commas.' },
      { in: 'Z,HR,40000', out: 'User: Z | Dept: HR | Gross: 40000', exp: 'Short field length.' }
    ]
  };
  return assembleSpec(v, topic, domain);
}

// ─────────────────────────────────────────────────────────────
// SPECIALIZED: SELENIUM & WEB
// ─────────────────────────────────────────────────────────────
function buildSeleniumSimSpec(topic, domain, seed) {
  const v = {
    titleSuffix: 'Selenium Locator Matcher & Element Text Extractor',
    problemStatement: `Simulate Selenium WebDriver findElement locator evaluation for **${topic}**. Given lines of "locatorType locatorValue expectedText", print: "LOCATOR_VERIFIED: <locatorValue>" if expectedText is non-empty, otherwise "LOCATOR_FAILED: <locatorValue>".`,
    inputFormat: `Line of: locatorType locatorValue expectedText.`,
    outputFormat: `"LOCATOR_VERIFIED: <val>" or "LOCATOR_FAILED: <val>".`,
    constraints: `Locator type is one of: id, xpath, css.`,
    pyRef: `import sys\n\ndef solve():\n    parts = sys.stdin.read().split()\n    if len(parts) >= 3:\n        ltype, lval, txt = parts[0], parts[1], parts[2]\n        if txt and txt != 'NONE':\n            print(f"LOCATOR_VERIFIED: {lval}")\n        else:\n            print(f"LOCATOR_FAILED: {lval}")\n\nif __name__ == '__main__':\n    solve()`,
    javaRef: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNext()) {\n            String ltype = sc.next();\n            String lval = sc.next();\n            String txt = sc.next();\n            if (txt != null && !txt.equals("NONE")) {\n                System.out.println("LOCATOR_VERIFIED: " + lval);\n            } else {\n                System.out.println("LOCATOR_FAILED: " + lval);\n            }\n        }\n    }\n}`,
    jsRef: `const fs = require('fs');\nconst [ltype, lval, txt] = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\nif (txt && txt !== 'NONE') console.log(\`LOCATOR_VERIFIED: \${lval}\`);\nelse console.log(\`LOCATOR_FAILED: \${lval}\`);`,
    samples: [
      { in: 'id loginBtn Submit', out: 'LOCATOR_VERIFIED: loginBtn', exp: 'Button text verified.' },
      { in: 'xpath //div[@id="error"] NONE', out: 'LOCATOR_FAILED: //div[@id="error"]', exp: 'No text found.' }
    ],
    edgeCases: [
      { in: 'css .header TitleText', out: 'LOCATOR_VERIFIED: .header', exp: 'CSS selector verified.' },
      { in: 'id modal NONE', out: 'LOCATOR_FAILED: modal', exp: 'Empty modal element.' }
    ]
  };
  return assembleSpec(v, topic, domain);
}

function buildWebFormSpec(topic, domain, seed) {
  const v = {
    titleSuffix: 'Form Field Validation & Payload Sanitizer',
    problemStatement: `Implement form validator logic for a web app in **${topic}**: given "username email age", verify: \n1. Username length >= 3\n2. Email contains "@" and "."\n3. Age is integer >= 18.\nOutput "VALID" if all rules pass, otherwise print the first failing error message: "INVALID_USERNAME", "INVALID_EMAIL", or "UNDERAGE".`,
    inputFormat: `A single line containing username, email, and age separated by space.`,
    outputFormat: `"VALID" or error message.`,
    constraints: `Username has no spaces. Age is an integer.`,
    pyRef: `import sys\n\ndef solve():\n    parts = sys.stdin.read().split()\n    if len(parts) >= 3:\n        u, e, a = parts[0], parts[1], int(parts[2])\n        if len(u) < 3:\n            print("INVALID_USERNAME")\n        elif '@' not in e or '.' not in e:\n            print("INVALID_EMAIL")\n        elif a < 18:\n            print("UNDERAGE")\n        else:\n            print("VALID")\n\nif __name__ == '__main__':\n    solve()`,
    javaRef: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNext()) {\n            String u = sc.next();\n            String e = sc.next();\n            int a = sc.nextInt();\n            if (u.length() < 3) System.out.println("INVALID_USERNAME");\n            else if (!e.contains("@") || !e.contains(".")) System.out.println("INVALID_EMAIL");\n            else if (a < 18) System.out.println("UNDERAGE");\n            else System.out.println("VALID");\n        }\n    }\n}`,
    jsRef: `const fs = require('fs');\nconst [u, e, aStr] = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\nconst a = Number(aStr);\nif (u.length < 3) console.log("INVALID_USERNAME");\nelse if (!e.includes('@') || !e.includes('.')) console.log("INVALID_EMAIL");\nelse if (a < 18) console.log("UNDERAGE");\nelse console.log("VALID");`,
    samples: [
      { in: 'alice alice@example.com 22', out: 'VALID', exp: 'All three validations succeed.' },
      { in: 'al test@mail.com 25', out: 'INVALID_USERNAME', exp: 'Username has only 2 characters.' }
    ],
    edgeCases: [
      { in: 'john john_at_mail 20', out: 'INVALID_EMAIL', exp: 'Email missing @ and .' },
      { in: 'mark mark@web.org 16', out: 'UNDERAGE', exp: 'Age under 18.' },
      { in: 'bob bob@net.in 18', out: 'VALID', exp: 'Boundary age 18.' }
    ]
  };
  return assembleSpec(v, topic, domain);
}

function buildTuplesRecordsSpec(topic, domain, seed) {
  const v = {
    titleSuffix: 'Immutable Tuple Unpacking & Aggregation',
    problemStatement: `Given pairs of items and quantities in the format "item:qty item:qty", parse them into immutable records for **${topic}**. Find the item with the highest quantity and compute the total sum of all quantities.`,
    inputFormat: `A single line of space-separated item:qty pairs.`,
    outputFormat: `Formatted as: "Top: <item> (<max_qty>) | Total: <sum>".`,
    constraints: `1 <= items <= 50.`,
    pyRef: `import sys\n\ndef solve():\n    pairs = sys.stdin.read().split()\n    records = []\n    for p in pairs:\n        name, q = p.split(':')\n        records.append((name, int(q)))\n    top = max(records, key=lambda x: x[1])\n    total = sum(r[1] for r in records)\n    print(f"Top: {top[0]} ({top[1]}) | Total: {total}")\n\nif __name__ == '__main__':\n    solve()`,
    javaRef: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String topName = "";\n        int maxQ = -1;\n        int total = 0;\n        while (sc.hasNext()) {\n            String[] parts = sc.next().split(":");\n            String name = parts[0];\n            int q = Integer.parseInt(parts[1]);\n            total += q;\n            if (q > maxQ) {\n                maxQ = q;\n                topName = name;\n            }\n        }\n        System.out.println("Top: " + topName + " (" + maxQ + ") | Total: " + total);\n    }\n}`,
    jsRef: `const fs = require('fs');\nconst pairs = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\nlet topName = '', maxQ = -1, total = 0;\nfor (const p of pairs) {\n  const [name, qStr] = p.split(':');\n  const q = Number(qStr);\n  total += q;\n  if (q > maxQ) { maxQ = q; topName = name; }\n}\nconsole.log(\`Top: \${topName} (\${maxQ}) | Total: \${total}\`);`,
    samples: [
      { in: 'apples:15 bananas:40 oranges:25', out: 'Top: bananas (40) | Total: 80', exp: 'bananas has 40, total items = 80.' },
      { in: 'pens:10 books:5', out: 'Top: pens (10) | Total: 15', exp: 'pens has 10, total = 15.' }
    ],
    edgeCases: [
      { in: 'single:100', out: 'Top: single (100) | Total: 100', exp: 'Single pair.' },
      { in: 'a:1 b:2 c:3 d:4', out: 'Top: d (4) | Total: 10', exp: 'Ascending sequence.' }
    ]
  };
  return assembleSpec(v, topic, domain);
}

// ─────────────────────────────────────────────────────────────
// ASSEMBLY HELPER
// ─────────────────────────────────────────────────────────────
function assembleSpec(v, topic, domain) {
  let refCode = v.pyRef;
  let starterCode = `# Write your Python solution here\nimport sys\n\ndef solve():\n    pass\n\nif __name__ == '__main__':\n    solve()`;

  if (domain === 'java') {
    refCode = v.javaRef;
    starterCode = `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Write your Java code here\n    }\n}`;
  } else if (domain === 'javascript') {
    refCode = v.jsRef;
    starterCode = `const fs = require('fs');\n// Write your JavaScript code here\nconst input = fs.readFileSync(0, 'utf-8').trim();\n`;
  } else if (domain === 'cpp') {
    refCode = v.pyRef;
    starterCode = `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your C++ code here\n    return 0;\n}`;
  }

  const allCases = [];

  // Sample 1
  if (v.samples && v.samples[0]) {
    allCases.push({
      input: v.samples[0].in,
      expectedOutput: v.samples[0].out,
      isHidden: false,
      explanation: v.samples[0].exp || 'Sample verification case 1.'
    });
  }

  // Sample 2
  if (v.samples && v.samples[1]) {
    allCases.push({
      input: v.samples[1].in,
      expectedOutput: v.samples[1].out,
      isHidden: false,
      explanation: v.samples[1].exp || 'Sample verification case 2.'
    });
  }

  // Edge cases (boundaries, negative, edge cases)
  if (v.edgeCases && v.edgeCases.length > 0) {
    v.edgeCases.forEach((ec, idx) => {
      allCases.push({
        input: ec.in,
        expectedOutput: ec.out,
        isHidden: false,
        explanation: ec.exp || `Boundary & constraint test case #${idx + 1}.`
      });
    });
  }

  const sample1 = v.samples[0] || { in: '1 2 3', out: '6', exp: 'Sample input' };
  const sample2 = v.samples[1] || v.samples[0] || { in: '4 5', out: '9', exp: 'Secondary sample' };

  return {
    topic,
    titleSuffix: v.titleSuffix,
    problemStatement: `### Problem Description: ${topic} — ${v.titleSuffix}\n\n${v.problemStatement}`,
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
  normalizeDomain
};
