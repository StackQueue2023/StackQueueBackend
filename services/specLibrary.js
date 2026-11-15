/**
 * STACK QUEUE — Module-Scoped Specification Library
 *
 * Every category contains multiple distinct real-world variations across Easy, Medium, and Hard.
 * Early categories strictly avoid future concepts (no if/else, no loops, no arrays/split, no try/catch)
 * in both problem statements and reference solutions.
 */

const CATEGORY_SPECS = {
  // ─────────────────────────────────────────────────────────────
  // 1. BASIC SYNTAX & OUTPUT STATEMENTS (Zero conditionals, zero loops, zero arrays)
  // ─────────────────────────────────────────────────────────────
  syntax_output: [
    {
      difficulty: 'Easy',
      titleSuffix: 'Program Structure & Multi-Line Welcome Banner',
      problemStatement: (topic) =>
        `Demonstrate basic program structure and standard output statements for **${topic}**. Read a learner's name from input and print a two-line welcome message:\nLine 1: \`Welcome to STACK QUEUE, <Name>!\`\nLine 2: \`Status: Ready to Code\``,
      inputFormat: 'A single line containing the learner name (string).',
      outputFormat: 'Two lines of formatted welcome output.',
      constraints: 'Name is a non-empty string without leading/trailing spaces.',
      pyRef: `name = input().strip()\nprint(f"Welcome to STACK QUEUE, {name}!")\nprint("Status: Ready to Code")`,
      javaRef: `import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String name = sc.nextLine().trim();\n        System.out.println("Welcome to STACK QUEUE, " + name + "!");\n        System.out.println("Status: Ready to Code");\n    }\n}`,
      jsRef: `const name = prompt("").trim();\nconsole.log("Welcome to STACK QUEUE, " + name + "!");\nconsole.log("Status: Ready to Code");`,
      samples: [
        { in: 'Roshini', out: 'Welcome to STACK QUEUE, Roshini!\nStatus: Ready to Code', exp: 'Prints two lines using standard output statements.' },
        { in: 'Arjun', out: 'Welcome to STACK QUEUE, Arjun!\nStatus: Ready to Code', exp: 'Greets Arjun with status on the second line.' }
      ],
      edgeCases: [
        { in: 'Priya Nair', out: 'Welcome to STACK QUEUE, Priya Nair!\nStatus: Ready to Code', exp: 'Preserves space inside full name.' },
        { in: 'A', out: 'Welcome to STACK QUEUE, A!\nStatus: Ready to Code', exp: 'Single character name.' }
      ]
    },
    {
      difficulty: 'Easy',
      titleSuffix: 'Inline vs Newline Output (print vs println)',
      problemStatement: (topic) =>
        `Practice combining inline and newline output statements for **${topic}**. Read a course title and a module number on separate lines, then print them on a single line formatted as: \`Course: <Course> | Module: <Number>\` followed by \`Verified\` on the next line.`,
      inputFormat: 'Line 1: Course title (string). Line 2: Module number (string/int).',
      outputFormat: 'Two lines showing combined inline output and newline output.',
      constraints: 'Inputs are single-line strings.',
      pyRef: `course = input().strip()\nmod = input().strip()\nprint("Course: " + course, end=" | ")\nprint("Module: " + mod)\nprint("Verified")`,
      javaRef: `import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String course = sc.nextLine().trim();\n        String mod = sc.nextLine().trim();\n        System.out.print("Course: " + course + " | ");\n        System.out.println("Module: " + mod);\n        System.out.println("Verified");\n    }\n}`,
      jsRef: `const course = prompt("").trim();\nconst mod = prompt("").trim();\nconsole.log("Course: " + course + " | Module: " + mod);\nconsole.log("Verified");`,
      samples: [
        { in: 'Java\n1', out: 'Course: Java | Module: 1\nVerified', exp: 'Combines inline print and newline println.' },
        { in: 'Python\n2', out: 'Course: Python | Module: 2\nVerified', exp: 'Formats Python Module 2 output.' }
      ],
      edgeCases: [
        { in: 'Selenium\n10', out: 'Course: Selenium | Module: 10\nVerified', exp: 'Two-digit module number.' },
        { in: 'Web Dev\n3', out: 'Course: Web Dev | Module: 3\nVerified', exp: 'Course title with space.' }
      ]
    },
    {
      difficulty: 'Medium',
      titleSuffix: 'Escape Sequences & Tab-Aligned Receipt',
      problemStatement: (topic) =>
        `Use escape sequences (\`\\n\`, \`\\t\`, \`\\"\`) to format structured console output for **${topic}**. Given an item name and price on two lines, print:\nLine 1: \`"RECEIPT"\` (with literal double quotes)\nLine 2: \`Item\\tPrice\` (tab-separated)\nLine 3: \`<Item>\\t<Price>\` (tab-separated)`,
      inputFormat: 'Line 1: Item name (string). Line 2: Price (string).',
      outputFormat: 'Three lines using escape sequences for quotes, tabs, and newlines.',
      constraints: 'Item name has no tabs.',
      pyRef: `item = input().strip()\nprice = input().strip()\nprint("\\"RECEIPT\\"\\nItem\\tPrice\\n" + item + "\\t" + price)`,
      javaRef: `import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String item = sc.nextLine().trim();\n        String price = sc.nextLine().trim();\n        System.out.print("\\"RECEIPT\\"\\nItem\\tPrice\\n" + item + "\\t" + price + "\\n");\n    }\n}`,
      jsRef: `const item = prompt("").trim();\nconst price = prompt("").trim();\nconsole.log("\\"RECEIPT\\"\\nItem\\tPrice\\n" + item + "\\t" + price);`,
      samples: [
        { in: 'Notebook\n45.00', out: '"RECEIPT"\nItem\tPrice\nNotebook\t45.00', exp: 'Uses escaped quotes, tab, and newline characters.' },
        { in: 'Pen\n12.50', out: '"RECEIPT"\nItem\tPrice\nPen\t12.50', exp: 'Formats Pen receipt with tab alignment.' }
      ],
      edgeCases: [
        { in: 'USB Cable\n199.00', out: '"RECEIPT"\nItem\tPrice\nUSB Cable\t199.00', exp: 'Item name containing a space.' },
        { in: 'Book\n0.00', out: '"RECEIPT"\nItem\tPrice\nBook\t0.00', exp: 'Zero price formatting.' }
      ]
    },
    {
      difficulty: 'Hard',
      titleSuffix: 'Formatted Precision & Column Alignment (printf / f-string)',
      problemStatement: (topic) =>
        `Master formatted output specifiers for **${topic}**. Read a runtime name (string), major version (int), and memory usage in MB (float) on three separate lines. Print a single formatted line using \`printf\` / f-string formatting:\n\`[<Name> v<Major>] Memory: <Memory with 2 decimal places> MB\``,
      inputFormat: 'Line 1: Runtime name (string). Line 2: Major version (int). Line 3: Memory MB (float).',
      outputFormat: 'Single formatted status line with 2-decimal precision.',
      constraints: '0 <= Major <= 99, 0.0 <= Memory <= 65536.0.',
      pyRef: `name = input().strip()\nmaj = int(input().strip())\nmem = float(input().strip())\nprint(f"[{name} v{maj}] Memory: {mem:.2f} MB")`,
      javaRef: `import java.util.Locale;\nimport java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String name = sc.nextLine().trim();\n        int maj = Integer.parseInt(sc.nextLine().trim());\n        double mem = Double.parseDouble(sc.nextLine().trim());\n        System.out.printf(Locale.US, "[%s v%d] Memory: %.2f MB%n", name, maj, mem);\n    }\n}`,
      jsRef: `const name = prompt("").trim();\nconst maj = parseInt(prompt("").trim(), 10);\nconst mem = parseFloat(prompt("").trim());\nconsole.log(\`[\${name} v\${maj}] Memory: \${mem.toFixed(2)} MB\`);`,
      samples: [
        { in: 'Java\n22\n128.5', out: '[Java v22] Memory: 128.50 MB', exp: 'Formats string, integer, and 2-decimal float.' },
        { in: 'Python\n3\n64.126', out: '[Python v3] Memory: 64.13 MB', exp: 'Rounds 64.126 to 64.13.' }
      ],
      edgeCases: [
        { in: 'Node\n20\n0', out: '[Node v20] Memory: 0.00 MB', exp: 'Formats integer zero as 0.00.' },
        { in: 'JVM\n17\n1024.999', out: '[JVM v17] Memory: 1025.00 MB', exp: 'Rounding carry-over.' }
      ]
    },
    {
      difficulty: 'Medium',
      questionType: 'output_prediction',
      titleSuffix: 'Trace & Reproduce Console Output Formatting',
      problemStatement: (topic) =>
        `Output prediction & formatting verification for **${topic}**. Given two labels \`L1\` and \`L2\` on separate lines, write a single print statement using \`\\t\` and \`\\n\` so the program outputs:\nLine 1: \`[HEADER]\\t<L1>\`\nLine 2: \`[BODY]\\t<L2>\``,
      inputFormat: 'Line 1: L1 (string). Line 2: L2 (string).',
      outputFormat: 'Two tab-delimited labeled lines.',
      constraints: 'L1 and L2 are non-empty single-line strings.',
      pyRef: `l1 = input().strip()\nl2 = input().strip()\nprint(f"[HEADER]\\t{l1}\\n[BODY]\\t{l2}")`,
      javaRef: `import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String l1 = sc.nextLine().trim();\n        String l2 = sc.nextLine().trim();\n        System.out.println("[HEADER]\\t" + l1 + "\\n[BODY]\\t" + l2);\n    }\n}`,
      jsRef: `const l1 = prompt("").trim();\nconst l2 = prompt("").trim();\nconsole.log(\`[HEADER]\\t\${l1}\\n[BODY]\\t\${l2}\`);`,
      samples: [
        { in: 'Start\nDone', out: '[HEADER]\tStart\n[BODY]\tDone', exp: 'Reproduces exact tab and newline layout.' },
        { in: 'Alpha\nBeta', out: '[HEADER]\tAlpha\n[BODY]\tBeta', exp: 'Formats Alpha and Beta rows.' }
      ],
      edgeCases: [
        { in: 'Mod 1\nOK', out: '[HEADER]\tMod 1\n[BODY]\tOK', exp: 'Preserves space inside label.' },
        { in: 'X\nY', out: '[HEADER]\tX\n[BODY]\tY', exp: 'Minimal single-char labels.' }
      ]
    },
    {
      difficulty: 'Easy',
      questionType: 'debugging',
      titleSuffix: 'Fix Broken Entry-Point Output Statement',
      problemStatement: (topic) =>
        `Syntax debugging practice for **${topic}**. Fix a broken output snippet so that given a tag string \`T\` on line 1, it correctly compiles and outputs:\n\`TAG="<T>"\\nREADY\``,
      inputFormat: 'Single line string T.',
      outputFormat: 'Quoted tag line followed by READY on line 2.',
      constraints: 'T is alphanumeric without double quotes.',
      pyRef: `t = input().strip()\nprint(f'TAG="{t}"')\nprint("READY")`,
      javaRef: `import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String t = sc.nextLine().trim();\n        System.out.println("TAG=\\"" + t + "\\"");\n        System.out.println("READY");\n    }\n}`,
      jsRef: `const t = prompt("").trim();\nconsole.log('TAG="' + t + '"');\nconsole.log("READY");`,
      samples: [
        { in: 'v1', out: 'TAG="v1"\nREADY', exp: 'Properly escapes double quotes around T.' },
        { in: 'core', out: 'TAG="core"\nREADY', exp: 'Outputs TAG="core" and READY.' }
      ],
      edgeCases: [
        { in: 'build_9', out: 'TAG="build_9"\nREADY', exp: 'Underscore inside tag.' },
        { in: 'A1', out: 'TAG="A1"\nREADY', exp: 'Short alphanumeric tag.' }
      ]
    }
  ],

  // ─────────────────────────────────────────────────────────────
  // 2. VARIABLES, DATA TYPES & TYPE CASTING (No conditionals, no loops, no arrays)
  // ─────────────────────────────────────────────────────────────
  variables_types: [
    {
      difficulty: 'Easy',
      titleSuffix: 'Typed Variable Declaration & Profile Output',
      problemStatement: (topic) =>
        `Declare and store typed variables for **${topic}**. Read an employee ID (int), department code (string), and hourly rate (float) on separate lines. Output: \`ID: <id> | Dept: <dept> | Rate: <rate to 2 decimals>\`.`,
      inputFormat: 'Line 1: ID (int). Line 2: Dept (string). Line 3: Rate (float).',
      outputFormat: 'Single formatted line with typed values.',
      constraints: '1 <= ID <= 99999.',
      pyRef: `emp_id = int(input().strip())\ndept = input().strip()\nrate = float(input().strip())\nprint(f"ID: {emp_id} | Dept: {dept} | Rate: {rate:.2f}")`,
      javaRef: `import java.util.Locale;\nimport java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int empId = Integer.parseInt(sc.nextLine().trim());\n        String dept = sc.nextLine().trim();\n        double rate = Double.parseDouble(sc.nextLine().trim());\n        System.out.printf(Locale.US, "ID: %d | Dept: %s | Rate: %.2f%n", empId, dept, rate);\n    }\n}`,
      jsRef: `const empId = parseInt(prompt("").trim(), 10);\nconst dept = prompt("").trim();\nconst rate = parseFloat(prompt("").trim());\nconsole.log(\`ID: \${empId} | Dept: \${dept} | Rate: \${rate.toFixed(2)}\`);`,
      samples: [
        { in: '101\nENG\n45.5', out: 'ID: 101 | Dept: ENG | Rate: 45.50', exp: 'Stores int, string, and float types.' },
        { in: '205\nQA\n30', out: 'ID: 205 | Dept: QA | Rate: 30.00', exp: 'Formats whole rate with 2 decimals.' }
      ],
      edgeCases: [
        { in: '1\nHR\n0.75', out: 'ID: 1 | Dept: HR | Rate: 0.75', exp: 'Fractional rate under 1.' },
        { in: '9999\nOPS\n125.99', out: 'ID: 9999 | Dept: OPS | Rate: 125.99', exp: 'Large ID and rate.' }
      ]
    },
    {
      difficulty: 'Medium',
      titleSuffix: 'Explicit Narrowing & Widening Type Casting',
      problemStatement: (topic) =>
        `Practice explicit type casting for **${topic}**. Read a decimal measurement (double/float) from input. Print both its widened/exact value rounded to 2 decimal places AND its truncated integer value (cast to \`int\`): \`Float: <val> | Int: <truncated>\`.`,
      inputFormat: 'A single decimal number.',
      outputFormat: 'Formatted string showing float and explicit integer cast.',
      constraints: '0.0 <= value <= 100000.0.',
      pyRef: `val = float(input().strip())\ntrunc = int(val)\nprint(f"Float: {val:.2f} | Int: {trunc}")`,
      javaRef: `import java.util.Locale;\nimport java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        double val = Double.parseDouble(sc.nextLine().trim());\n        int trunc = (int) val;\n        System.out.printf(Locale.US, "Float: %.2f | Int: %d%n", val, trunc);\n    }\n}`,
      jsRef: `const val = parseFloat(prompt("").trim());\nconst trunc = Math.trunc(val);\nconsole.log(\`Float: \${val.toFixed(2)} | Int: \${trunc}\`);`,
      samples: [
        { in: '98.76', out: 'Float: 98.76 | Int: 98', exp: 'Explicit cast truncates .76 to 98.' },
        { in: '15.0', out: 'Float: 15.00 | Int: 15', exp: 'Exact integer decimal.' }
      ],
      edgeCases: [
        { in: '0.99', out: 'Float: 0.99 | Int: 0', exp: 'Truncates below 1 to 0.' },
        { in: '500.45', out: 'Float: 500.45 | Int: 500', exp: 'Mid-range decimal.' }
      ]
    },
    {
      difficulty: 'Hard',
      titleSuffix: 'String-to-Numeric Parsing & Total Billing',
      problemStatement: (topic) =>
        `Convert string inputs to numeric types for **${topic}**. Read quantity (int) and unit price (float) on separate lines, compute \`total = quantity * unit_price\`, and output \`Qty: <qty> | Total: <total to 2 decimals>\`.`,
      inputFormat: 'Line 1: Quantity (int). Line 2: Unit price (float).',
      outputFormat: 'Formatted billing summary.',
      constraints: '1 <= Qty <= 1000, 0.01 <= Price <= 9999.99.',
      pyRef: `qty = int(input().strip())\nprice = float(input().strip())\ntotal = qty * price\nprint(f"Qty: {qty} | Total: {total:.2f}")`,
      javaRef: `import java.util.Locale;\nimport java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int qty = Integer.parseInt(sc.nextLine().trim());\n        double price = Double.parseDouble(sc.nextLine().trim());\n        double total = qty * price;\n        System.out.printf(Locale.US, "Qty: %d | Total: %.2f%n", qty, total);\n    }\n}`,
      jsRef: `const qty = parseInt(prompt("").trim(), 10);\nconst price = parseFloat(prompt("").trim());\nconst total = qty * price;\nconsole.log(\`Qty: \${qty} | Total: \${total.toFixed(2)}\`);`,
      samples: [
        { in: '5\n25.50', out: 'Qty: 5 | Total: 127.50', exp: '5 * 25.50 = 127.50.' },
        { in: '4\n15.20', out: 'Qty: 4 | Total: 60.80', exp: '4 * 15.20 = 60.80.' }
      ],
      edgeCases: [
        { in: '1\n99.99', out: 'Qty: 1 | Total: 99.99', exp: 'Single item.' },
        { in: '10\n0.50', out: 'Qty: 10 | Total: 5.00', exp: 'Fractional unit price.' }
      ]
    }
  ],

  // ─────────────────────────────────────────────────────────────
  // 3. OPERATORS & EXPRESSIONS
  // ─────────────────────────────────────────────────────────────
  operators_math: [
    {
      difficulty: 'Easy',
      titleSuffix: 'Arithmetic & Modulo Operations',
      problemStatement: (topic) =>
        `Perform arithmetic and modulo operations for **${topic}**. Given two positive integers A and B on separate lines, output: \`Sum: <A+B> | Quotient: <A//B> | Remainder: <A%B>\`.`,
      inputFormat: 'Line 1: Integer A. Line 2: Integer B.',
      outputFormat: 'Formatted arithmetic results.',
      constraints: '1 <= A, B <= 10^6.',
      pyRef: `a = int(input().strip())\nb = int(input().strip())\nprint(f"Sum: {a + b} | Quotient: {a // b} | Remainder: {a % b}")`,
      javaRef: `import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int a = Integer.parseInt(sc.nextLine().trim());\n        int b = Integer.parseInt(sc.nextLine().trim());\n        System.out.println("Sum: " + (a + b) + " | Quotient: " + (a / b) + " | Remainder: " + (a % b));\n    }\n}`,
      jsRef: `const a = parseInt(prompt("").trim(), 10);\nconst b = parseInt(prompt("").trim(), 10);\nconsole.log(\`Sum: \${a + b} | Quotient: \${Math.floor(a / b)} | Remainder: \${a % b}\`);`,
      samples: [
        { in: '25\n4', out: 'Sum: 29 | Quotient: 6 | Remainder: 1', exp: '25+4=29, 25//4=6, 25%4=1.' },
        { in: '50\n10', out: 'Sum: 60 | Quotient: 5 | Remainder: 0', exp: 'Exact division with 0 remainder.' }
      ],
      edgeCases: [
        { in: '7\n12', out: 'Sum: 19 | Quotient: 0 | Remainder: 7', exp: 'A smaller than B.' },
        { in: '100\n1', out: 'Sum: 101 | Quotient: 100 | Remainder: 0', exp: 'Divisor is 1.' }
      ]
    },
    {
      difficulty: 'Medium',
      titleSuffix: 'Relational & Logical Operator Evaluation',
      problemStatement: (topic) =>
        `Evaluate relational and logical expressions for **${topic}**. Read an integer age and a boolean/int flag \`hasId\` (1 or 0) on separate lines. Output \`Eligible: <true/false>\` where eligibility is \`(age >= 18) && (hasId == 1)\`.`,
      inputFormat: 'Line 1: Age (int). Line 2: hasId (1 or 0).',
      outputFormat: 'Eligible: true or Eligible: false (lowercase).',
      constraints: '0 <= age <= 120.',
      pyRef: `age = int(input().strip())\nhas_id = int(input().strip())\neligible = (age >= 18) and (has_id == 1)\nprint("Eligible:", str(eligible).lower())`,
      javaRef: `import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int age = Integer.parseInt(sc.nextLine().trim());\n        int hasId = Integer.parseInt(sc.nextLine().trim());\n        boolean eligible = (age >= 18) && (hasId == 1);\n        System.out.println("Eligible: " + eligible);\n    }\n}`,
      jsRef: `const age = parseInt(prompt("").trim(), 10);\nconst hasId = parseInt(prompt("").trim(), 10);\nconst eligible = (age >= 18) && (hasId === 1);\nconsole.log("Eligible: " + eligible);`,
      samples: [
        { in: '21\n1', out: 'Eligible: true', exp: 'Both age >= 18 and hasId == 1 are true.' },
        { in: '16\n1', out: 'Eligible: false', exp: 'Age is under 18.' }
      ],
      edgeCases: [
        { in: '18\n1', out: 'Eligible: true', exp: 'Exact boundary age 18.' },
        { in: '25\n0', out: 'Eligible: false', exp: 'Missing ID.' }
      ]
    },
    {
      difficulty: 'Hard',
      titleSuffix: 'Bitwise AND, OR, XOR & Left Shift',
      problemStatement: (topic) =>
        `Apply bitwise operators for **${topic}**. Given two integers X and Y on separate lines, print \`AND: <X&Y> | OR: <X|Y> | XOR: <X^Y>\`.`,
      inputFormat: 'Line 1: X (int). Line 2: Y (int).',
      outputFormat: 'Formatted bitwise operation outputs.',
      constraints: '0 <= X, Y <= 1024.',
      pyRef: `x = int(input().strip())\ny = int(input().strip())\nprint(f"AND: {x & y} | OR: {x | y} | XOR: {x ^ y}")`,
      javaRef: `import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int x = Integer.parseInt(sc.nextLine().trim());\n        int y = Integer.parseInt(sc.nextLine().trim());\n        System.out.println("AND: " + (x & y) + " | OR: " + (x | y) + " | XOR: " + (x ^ y));\n    }\n}`,
      jsRef: `const x = parseInt(prompt("").trim(), 10);\nconst y = parseInt(prompt("").trim(), 10);\nconsole.log(\`AND: \${x & y} | OR: \${x | y} | XOR: \${x ^ y}\`);`,
      samples: [
        { in: '6\n3', out: 'AND: 2 | OR: 7 | XOR: 5', exp: '6 (110) and 3 (011): AND=010(2), OR=111(7), XOR=101(5).' },
        { in: '12\n10', out: 'AND: 8 | OR: 14 | XOR: 6', exp: 'Bitwise ops on 12 and 10.' }
      ],
      edgeCases: [
        { in: '0\n0', out: 'AND: 0 | OR: 0 | XOR: 0', exp: 'Zero operands.' },
        { in: '15\n15', out: 'AND: 15 | OR: 15 | XOR: 0', exp: 'Identical operands have XOR 0.' }
      ]
    }
  ],

  // ─────────────────────────────────────────────────────────────
  // 4. SCANNER / USER INPUT
  // ─────────────────────────────────────────────────────────────
  scanner_input: [
    {
      difficulty: 'Easy',
      titleSuffix: 'Reading Multi-Type User Input Tokens',
      problemStatement: (topic) =>
        `Practice reading structured user input for **${topic}**. Read a student name (string), roll number (int), and GPA (double) on separate lines, then output: \`Student: <Name> (#<Roll>) - GPA: <GPA to 2 decimals>\`.`,
      inputFormat: 'Line 1: Name. Line 2: Roll (int). Line 3: GPA (float).',
      outputFormat: 'Single formatted student summary line.',
      constraints: '0.0 <= GPA <= 10.0.',
      pyRef: `name = input().strip()\nroll = int(input().strip())\ngpa = float(input().strip())\nprint(f"Student: {name} (#{roll}) - GPA: {gpa:.2f}")`,
      javaRef: `import java.util.Locale;\nimport java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String name = sc.nextLine().trim();\n        int roll = Integer.parseInt(sc.nextLine().trim());\n        double gpa = Double.parseDouble(sc.nextLine().trim());\n        System.out.printf(Locale.US, "Student: %s (#%d) - GPA: %.2f%n", name, roll, gpa);\n    }\n}`,
      jsRef: `const name = prompt("").trim();\nconst roll = parseInt(prompt("").trim(), 10);\nconst gpa = parseFloat(prompt("").trim());\nconsole.log(\`Student: \${name} (#\${roll}) - GPA: \${gpa.toFixed(2)}\`);`,
      samples: [
        { in: 'Kavya\n42\n9.25', out: 'Student: Kavya (#42) - GPA: 9.25', exp: 'Reads string, int, and float cleanly.' },
        { in: 'Karthik\n7\n8.5', out: 'Student: Karthik (#7) - GPA: 8.50', exp: 'Formats GPA to 2 decimal places.' }
      ],
      edgeCases: [
        { in: 'Meera Devi\n100\n10', out: 'Student: Meera Devi (#100) - GPA: 10.00', exp: 'Multi-word name.' },
        { in: 'Sam\n1\n0', out: 'Student: Sam (#1) - GPA: 0.00', exp: 'Zero GPA.' }
      ]
    },
    {
      difficulty: 'Medium',
      titleSuffix: 'Structured Token & Line Input Parsing',
      problemStatement: (topic) =>
        `Practice token and multi-field scanning for **${topic}**. Read a user's first name (single word token), department (line/token), and salary (integer) across sequential input lines, then output: \`User: <Name> | Dept: <Department> | Gross: <Salary>\`.`,
      inputFormat: 'Line 1: Name. Line 2: Department. Line 3: Salary (integer).',
      outputFormat: 'Formatted user profile string.',
      constraints: 'Non-empty strings and positive integer salary.',
      pyRef: `name = input().strip()\ndept = input().strip()\nsalary = int(input().strip())\nprint(f"User: {name} | Dept: {dept} | Gross: {salary}")`,
      javaRef: `import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String name = sc.nextLine().trim();\n        String dept = sc.nextLine().trim();\n        int salary = Integer.parseInt(sc.nextLine().trim());\n        System.out.println("User: " + name + " | Dept: " + dept + " | Gross: " + salary);\n    }\n}`,
      jsRef: `const name = prompt("").trim();\nconst dept = prompt("").trim();\nconst salary = parseInt(prompt("").trim(), 10);\nconsole.log(\`User: \${name} | Dept: \${dept} | Gross: \${salary}\`);`,
      samples: [
        { in: 'Aravind\nEngineering\n85000', out: 'User: Aravind | Dept: Engineering | Gross: 85000', exp: 'Reads and trims three sequential user inputs.' },
        { in: 'Priya\nDesign\n65000', out: 'User: Priya | Dept: Design | Gross: 65000', exp: 'Parses Design department record.' }
      ],
      edgeCases: [
        { in: 'Kavitha \n Marketing \n 72000', out: 'User: Kavitha | Dept: Marketing | Gross: 72000', exp: 'Trims whitespace around scanned fields.' },
        { in: 'Z\nHR\n40000', out: 'User: Z | Dept: HR | Gross: 40000', exp: 'Single-char name.' }
      ]
    }
  ],

  // ─────────────────────────────────────────────────────────────
  // 5. CONDITIONALS & BRANCHING
  // ─────────────────────────────────────────────────────────────
  conditionals: [
    {
      difficulty: 'Easy',
      titleSuffix: 'Even or Odd & Sign Classification',
      problemStatement: (topic) =>
        `Implement conditional branching for **${topic}**. Given an integer N, print \`EVEN\` if N is divisible by 2, otherwise print \`ODD\`.`,
      inputFormat: 'A single integer N.',
      outputFormat: '"EVEN" or "ODD".',
      constraints: '-10^6 <= N <= 10^6.',
      pyRef: `n = int(input().strip())\nif n % 2 == 0:\n    print("EVEN")\nelse:\n    print("ODD")`,
      javaRef: `import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        if (n % 2 == 0) System.out.println("EVEN");\n        else System.out.println("ODD");\n    }\n}`,
      jsRef: `const n = parseInt(prompt("").trim(), 10);\nconsole.log(n % 2 === 0 ? "EVEN" : "ODD");`,
      samples: [
        { in: '14', out: 'EVEN', exp: '14 % 2 == 0.' },
        { in: '9', out: 'ODD', exp: '9 % 2 != 0.' }
      ],
      edgeCases: [
        { in: '0', out: 'EVEN', exp: '0 is even.' },
        { in: '-7', out: 'ODD', exp: 'Negative odd integer.' }
      ]
    },
    {
      difficulty: 'Medium',
      titleSuffix: 'Multi-Branch Grade Classification',
      problemStatement: (topic) =>
        `Implement multi-way conditional branching for **${topic}**. Given a score (0..100): 90-100 -> \`GRADE_A\`, 75-89 -> \`GRADE_B\`, 50-74 -> \`GRADE_C\`, below 50 -> \`RETRY\`.`,
      inputFormat: 'A single integer score between 0 and 100.',
      outputFormat: 'Grade string.',
      constraints: '0 <= Score <= 100.',
      pyRef: `s = int(input().strip())\nif s >= 90:\n    print("GRADE_A")\nelif s >= 75:\n    print("GRADE_B")\nelif s >= 50:\n    print("GRADE_C")\nelse:\n    print("RETRY")`,
      javaRef: `import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int s = sc.nextInt();\n        if (s >= 90) System.out.println("GRADE_A");\n        else if (s >= 75) System.out.println("GRADE_B");\n        else if (s >= 50) System.out.println("GRADE_C");\n        else System.out.println("RETRY");\n    }\n}`,
      jsRef: `const s = parseInt(prompt("").trim(), 10);\nif (s >= 90) console.log("GRADE_A");\nelse if (s >= 75) console.log("GRADE_B");\nelse if (s >= 50) console.log("GRADE_C");\nelse console.log("RETRY");`,
      samples: [
        { in: '95', out: 'GRADE_A', exp: '95 >= 90 -> GRADE_A.' },
        { in: '62', out: 'GRADE_C', exp: '62 is in 50..74 -> GRADE_C.' }
      ],
      edgeCases: [
        { in: '90', out: 'GRADE_A', exp: 'Boundary 90.' },
        { in: '49', out: 'RETRY', exp: 'Boundary 49.' }
      ]
    },
    {
      difficulty: 'Hard',
      titleSuffix: 'Nested Conditional Tiered Discount Engine',
      problemStatement: (topic) =>
        `Build a nested decision rule for **${topic}**. Given membership (\`VIP\` or \`REG\`) and purchase amount (int) on separate lines: if \`VIP\` and amount >= 500 -> \`20%\`, if \`VIP\` and amount < 500 -> \`10%\`, if \`REG\` and amount >= 500 -> \`5%\`, otherwise \`0%\`.`,
      inputFormat: 'Line 1: Membership ("VIP" or "REG"). Line 2: Amount (int).',
      outputFormat: 'Discount percentage string (e.g. "20%").',
      constraints: 'Amount >= 0.',
      pyRef: `tier = input().strip()\namt = int(input().strip())\nif tier == "VIP":\n    print("20%" if amt >= 500 else "10%")\nelse:\n    print("5%" if amt >= 500 else "0%")`,
      javaRef: `import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String tier = sc.nextLine().trim();\n        int amt = Integer.parseInt(sc.nextLine().trim());\n        if (tier.equals("VIP")) {\n            System.out.println(amt >= 500 ? "20%" : "10%");\n        } else {\n            System.out.println(amt >= 500 ? "5%" : "0%");\n        }\n    }\n}`,
      jsRef: `const tier = prompt("").trim();\nconst amt = parseInt(prompt("").trim(), 10);\nif (tier === "VIP") console.log(amt >= 500 ? "20%" : "10%");\nelse console.log(amt >= 500 ? "5%" : "0%");`,
      samples: [
        { in: 'VIP\n600', out: '20%', exp: 'VIP with amount >= 500 gets 20%.' },
        { in: 'REG\n300', out: '0%', exp: 'REG under 500 gets 0%.' }
      ],
      edgeCases: [
        { in: 'VIP\n499', out: '10%', exp: 'VIP below 500.' },
        { in: 'REG\n500', out: '5%', exp: 'REG at exact 500 boundary.' }
      ]
    }
  ],

  // ─────────────────────────────────────────────────────────────
  // 6. LOOPS & ITERATION
  // ─────────────────────────────────────────────────────────────
  loops: [
    {
      difficulty: 'Easy',
      titleSuffix: 'Sum of First N Natural Numbers',
      problemStatement: (topic) =>
        `Use a loop to accumulate values for **${topic}**. Given positive integer N, compute and print the sum of integers from 1 to N.`,
      inputFormat: 'A single integer N.',
      outputFormat: 'Single integer sum.',
      constraints: '1 <= N <= 10^4.',
      pyRef: `n = int(input().strip())\ntotal = 0\nfor i in range(1, n + 1):\n    total += i\nprint(total)`,
      javaRef: `import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        long total = 0;\n        for (int i = 1; i <= n; i++) total += i;\n        System.out.println(total);\n    }\n}`,
      jsRef: `const n = parseInt(prompt("").trim(), 10);\nlet total = 0;\nfor (let i = 1; i <= n; i++) total += i;\nconsole.log(total);`,
      samples: [
        { in: '5', out: '15', exp: '1 + 2 + 3 + 4 + 5 = 15.' },
        { in: '10', out: '55', exp: 'Sum from 1 to 10 is 55.' }
      ],
      edgeCases: [
        { in: '1', out: '1', exp: 'Single element N=1.' },
        { in: '100', out: '5050', exp: 'N=100.' }
      ]
    },
    {
      difficulty: 'Medium',
      titleSuffix: 'Factorial Calculation via Loop',
      problemStatement: (topic) =>
        `Compute factorial iteratively for **${topic}**. Given non-negative integer N, print \`N!\` using a loop.`,
      inputFormat: 'A single integer N.',
      outputFormat: 'Factorial integer.',
      constraints: '0 <= N <= 15.',
      pyRef: `n = int(input().strip())\nfact = 1\nfor i in range(2, n + 1):\n    fact *= i\nprint(fact)`,
      javaRef: `import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        long fact = 1;\n        for (int i = 2; i <= n; i++) fact *= i;\n        System.out.println(fact);\n    }\n}`,
      jsRef: `const n = parseInt(prompt("").trim(), 10);\nlet fact = 1;\nfor (let i = 2; i <= n; i++) fact *= i;\nconsole.log(fact);`,
      samples: [
        { in: '5', out: '120', exp: '5! = 120.' },
        { in: '0', out: '1', exp: '0! = 1.' }
      ],
      edgeCases: [
        { in: '1', out: '1', exp: '1! = 1.' },
        { in: '10', out: '3628800', exp: '10! = 3628800.' }
      ]
    },
    {
      difficulty: 'Hard',
      titleSuffix: 'Nested Loop Number Triangle Pattern',
      problemStatement: (topic) =>
        `Generate an ascending number triangle using nested loops for **${topic}**. Given integer N, print N lines where the i-th line contains numbers \`1\` to \`i\` separated by spaces.`,
      inputFormat: 'A single integer N.',
      outputFormat: 'N lines forming a number triangle.',
      constraints: '1 <= N <= 10.',
      pyRef: `n = int(input().strip())\nfor i in range(1, n + 1):\n    print(" ".join(str(x) for x in range(1, i + 1)))`,
      javaRef: `import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        for (int i = 1; i <= n; i++) {\n            StringBuilder sb = new StringBuilder();\n            for (int j = 1; j <= i; j++) {\n                if (j > 1) sb.append(" ");\n                sb.append(j);\n            }\n            System.out.println(sb.toString());\n        }\n    }\n}`,
      jsRef: `const n = parseInt(prompt("").trim(), 10);\nfor (let i = 1; i <= n; i++) {\n  let row = [];\n  for (let j = 1; j <= i; j++) row.push(j);\n  console.log(row.join(' '));\n}`,
      samples: [
        { in: '4', out: '1\n1 2\n1 2 3\n1 2 3 4', exp: '4 rows triangle.' },
        { in: '2', out: '1\n1 2', exp: '2 rows triangle.' }
      ],
      edgeCases: [
        { in: '1', out: '1', exp: 'Base case single row.' },
        { in: '3', out: '1\n1 2\n1 2 3', exp: '3 rows triangle.' }
      ]
    }
  ],

  // ─────────────────────────────────────────────────────────────
  // 7. STRINGS & TEXT MANIPULATION
  // ─────────────────────────────────────────────────────────────
  strings: [
    {
      difficulty: 'Easy',
      titleSuffix: 'String Trimming, Length & Case Transformation',
      problemStatement: (topic) =>
        `Practice built-in string methods for **${topic}**. Given a text label, trim leading and trailing whitespace and output: \`Trimmed: <trimmed> | Upper: <UPPERCASE> | Len: <length>\`.`,
      inputFormat: 'A single line string (at least 1 non-space character).',
      outputFormat: 'Formatted summary with trimmed string, uppercase text, and character count.',
      constraints: '1 <= trimmed.length <= 200.',
      pyRef: `s = input().strip()\nprint(f"Trimmed: {s} | Upper: {s.upper()} | Len: {len(s)}")`,
      javaRef: `import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String s = sc.nextLine().trim();\n        System.out.println("Trimmed: " + s + " | Upper: " + s.toUpperCase() + " | Len: " + s.length());\n    }\n}`,
      jsRef: `const s = prompt("").trim();\nconsole.log(\`Trimmed: \${s} | Upper: \${s.toUpperCase()} | Len: \${s.length}\`);`,
      samples: [
        { in: '  Stack Queue  ', out: 'Trimmed: Stack Queue | Upper: STACK QUEUE | Len: 11', exp: 'Trims outer spaces and converts to uppercase.' },
        { in: 'JavaBasics', out: 'Trimmed: JavaBasics | Upper: JAVABASICS | Len: 10', exp: 'Uppercase and length calculation.' }
      ],
      edgeCases: [
        { in: '   core   ', out: 'Trimmed: core | Upper: CORE | Len: 4', exp: 'Removes multiple surrounding spaces.' },
        { in: 'A', out: 'Trimmed: A | Upper: A | Len: 1', exp: 'Single character string.' }
      ]
    },
    {
      difficulty: 'Medium',
      titleSuffix: 'Substring Extraction, charAt & Character Replacement',
      problemStatement: (topic) =>
        `Practice string slicing and character inspection for **${topic}**. Given a string of length >= 3, extract its first character, 3-character prefix, and space-to-hyphen slug, printing: \`First: <c0> | Prefix: <first3> | Slug: <lowercase_hyphenated>\`.`,
      inputFormat: 'A single line string with trimmed length >= 3.',
      outputFormat: 'Single formatted line with First character, 3-char Prefix, and lowercase hyphenated Slug.',
      constraints: '3 <= length <= 200.',
      pyRef: `s = input().strip()\nprint(f"First: {s[0]} | Prefix: {s[:3]} | Slug: {s.lower().replace(' ', '-')}")`,
      javaRef: `import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String s = sc.nextLine().trim();\n        System.out.println("First: " + s.charAt(0) + " | Prefix: " + s.substring(0, 3) + " | Slug: " + s.toLowerCase().replace(' ', '-'));\n    }\n}`,
      jsRef: `const s = prompt("").trim();\nconsole.log(\`First: \${s.charAt(0)} | Prefix: \${s.substring(0, 3)} | Slug: \${s.toLowerCase().replaceAll(' ', '-')}\`);`,
      samples: [
        { in: 'Hello World', out: 'First: H | Prefix: Hel | Slug: hello-world', exp: 'Extracts charAt(0), substring(0,3), and replaces spaces.' },
        { in: 'String Lab', out: 'First: S | Prefix: Str | Slug: string-lab', exp: 'Handles space replacement cleanly.' }
      ],
      edgeCases: [
        { in: 'Code', out: 'First: C | Prefix: Cod | Slug: code', exp: 'Single word without spaces.' },
        { in: 'Java Core API', out: 'First: J | Prefix: Jav | Slug: java-core-api', exp: 'Multiple spaces converted to hyphens.' }
      ]
    }
  ],

  // ─────────────────────────────────────────────────────────────
  // 8. FUNCTIONS & METHODS
  // ─────────────────────────────────────────────────────────────
  methods_functions: [
    {
      difficulty: 'Easy',
      titleSuffix: 'Modular Helper Methods: Rectangle Area & Perimeter',
      problemStatement: (topic) =>
        `Write reusable functions/methods for **${topic}**. Define two helper methods \`computeArea(w, h)\` and \`computePerimeter(w, h)\` and output \`Area: <area> | Perimeter: <perimeter>\`.`,
      inputFormat: 'Line 1: width (int). Line 2: height (int).',
      outputFormat: 'Single line formatted as: "Area: <area> | Perimeter: <perimeter>".',
      constraints: '1 <= w, h <= 1000.',
      pyRef: `def compute_area(w, h):\n    return w * h\n\ndef compute_perimeter(w, h):\n    return 2 * (w + h)\n\nw = int(input().strip())\nh = int(input().strip())\nprint(f"Area: {compute_area(w, h)} | Perimeter: {compute_perimeter(w, h)}")`,
      javaRef: `import java.util.Scanner;\n\npublic class Main {\n    static int computeArea(int w, int h) {\n        return w * h;\n    }\n    static int computePerimeter(int w, int h) {\n        return 2 * (w + h);\n    }\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int w = sc.nextInt();\n        int h = sc.nextInt();\n        System.out.println("Area: " + computeArea(w, h) + " | Perimeter: " + computePerimeter(w, h));\n    }\n}`,
      jsRef: `function computeArea(w, h) { return w * h; }\nfunction computePerimeter(w, h) { return 2 * (w + h); }\nconst w = parseInt(prompt("").trim(), 10);\nconst h = parseInt(prompt("").trim(), 10);\nconsole.log(\`Area: \${computeArea(w, h)} | Perimeter: \${computePerimeter(w, h)}\`);`,
      samples: [
        { in: '5\n3', out: 'Area: 15 | Perimeter: 16', exp: '5*3=15 and 2*(5+3)=16.' },
        { in: '10\n4', out: 'Area: 40 | Perimeter: 28', exp: '10*4=40 and 2*(10+4)=28.' }
      ],
      edgeCases: [
        { in: '1\n1', out: 'Area: 1 | Perimeter: 4', exp: 'Unit square.' },
        { in: '12\n8', out: 'Area: 96 | Perimeter: 40', exp: 'Larger rectangle.' }
      ]
    },
    {
      difficulty: 'Medium',
      titleSuffix: 'Method Composition & Parameter Passing Semantics',
      problemStatement: (topic) =>
        `Practice helper method return values and parameter passing for **${topic}**. Define a method \`applyBonus(x)\` that returns \`x + 50\` and a method \`doubleValue(x)\` that returns \`x * 2\`, keeping the caller variable unchanged when verifying pass-by-value semantics. Output: \`Original: <n> | Bonus: <applyBonus(n)> | Doubled: <doubleValue(n)>\`.`,
      inputFormat: 'A single integer N.',
      outputFormat: 'Single line: "Original: <N> | Bonus: <N+50> | Doubled: <2*N>".',
      constraints: '0 <= N <= 100000.',
      pyRef: `def apply_bonus(x):\n    x = x + 50\n    return x\n\ndef double_value(x):\n    x = x * 2\n    return x\n\nn = int(input().strip())\nbonus = apply_bonus(n)\ndoubled = double_value(n)\nprint(f"Original: {n} | Bonus: {bonus} | Doubled: {doubled}")`,
      javaRef: `import java.util.Scanner;\n\npublic class Main {\n    static int applyBonus(int x) {\n        x = x + 50;\n        return x;\n    }\n    static int doubleValue(int x) {\n        x = x * 2;\n        return x;\n    }\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        int bonus = applyBonus(n);\n        int doubled = doubleValue(n);\n        System.out.println("Original: " + n + " | Bonus: " + bonus + " | Doubled: " + doubled);\n    }\n}`,
      jsRef: `function applyBonus(x) { x = x + 50; return x; }\nfunction doubleValue(x) { x = x * 2; return x; }\nconst n = parseInt(prompt("").trim(), 10);\nconst bonus = applyBonus(n);\nconst doubled = doubleValue(n);\nconsole.log(\`Original: \${n} | Bonus: \${bonus} | Doubled: \${doubled}\`);`,
      samples: [
        { in: '20', out: 'Original: 20 | Bonus: 70 | Doubled: 40', exp: 'Caller n stays 20 after helper modifications.' },
        { in: '100', out: 'Original: 100 | Bonus: 150 | Doubled: 200', exp: 'Pass-by-value preserves original argument.' }
      ],
      edgeCases: [
        { in: '0', out: 'Original: 0 | Bonus: 50 | Doubled: 0', exp: 'Zero baseline.' },
        { in: '7', out: 'Original: 7 | Bonus: 57 | Doubled: 14', exp: 'Odd integer input.' }
      ]
    }
  ],

  // ─────────────────────────────────────────────────────────────
  // 9. ARRAYS & LISTS
  // ─────────────────────────────────────────────────────────────
  arrays_lists: [
    {
      difficulty: 'Easy',
      titleSuffix: 'Second Largest Distinct Integer in Array',
      problemStatement: (topic) =>
        `Traverse an array/list for **${topic}**. Given space-separated integers, find the second largest distinct integer. If fewer than 2 distinct integers exist, print \`-1\`.`,
      inputFormat: 'A single line of space-separated integers.',
      outputFormat: 'Single integer (second largest distinct or -1).',
      constraints: '1 <= array.length <= 10^4.',
      pyRef: `nums = sorted(set(map(int, input().split())), reverse=True)\nprint(nums[1] if len(nums) >= 2 else -1)`,
      javaRef: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        TreeSet<Integer> set = new TreeSet<>(Collections.reverseOrder());\n        while (sc.hasNextInt()) set.add(sc.nextInt());\n        if (set.size() < 2) { System.out.println(-1); return; }\n        Iterator<Integer> it = set.iterator();\n        it.next();\n        System.out.println(it.next());\n    }\n}`,
      jsRef: `const uniq = Array.from(new Set(prompt("").trim().split(/\\s+/).map(Number))).sort((a, b) => b - a);\nconsole.log(uniq.length >= 2 ? uniq[1] : -1);`,
      samples: [
        { in: '12 35 1 10 34 1', out: '34', exp: 'Distinct sorted desc: 35, 34, 12... -> 34.' },
        { in: '10 10 10', out: '-1', exp: 'Only 1 distinct value.' }
      ],
      edgeCases: [
        { in: '-5 -2 -10', out: '-5', exp: 'Negative numbers.' },
        { in: '5 1', out: '1', exp: 'Two elements.' }
      ]
    },
    {
      difficulty: 'Medium',
      titleSuffix: 'Pair Sum Index Scan (Pure Array)',
      problemStatement: (topic) =>
        `Solve array index scanning for **${topic}**. Given target T on line 1 and space-separated integers on line 2, scan the array indices to find the first pair (i < j) summing to T and print \`i j\`.`,
      inputFormat: 'Line 1: Target T. Line 2: Space-separated integers.',
      outputFormat: 'Two space-separated indices: "i j".',
      constraints: '2 <= array.length <= 10^3.',
      pyRef: `t = int(input().strip())\nnums = [int(x) for x in input().split()]\nfound = False\nfor i in range(len(nums)):\n    for j in range(i + 1, len(nums)):\n        if nums[i] + nums[j] == t:\n            print(f"{i} {j}")\n            found = True\n            break\n    if found:\n        break`,
      javaRef: `import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int target = Integer.parseInt(sc.nextLine().trim());\n        String line = sc.nextLine().trim();\n        Scanner ls = new Scanner(line);\n        int[] arr = new int[1000];\n        int n = 0;\n        while (ls.hasNextInt()) arr[n++] = ls.nextInt();\n        for (int i = 0; i < n; i++) {\n            for (int j = i + 1; j < n; j++) {\n                if (arr[i] + arr[j] == target) {\n                    System.out.println(i + " " + j);\n                    return;\n                }\n            }\n        }\n    }\n}`,
      jsRef: `const t = parseInt(prompt("").trim(), 10);\nconst nums = prompt("").trim().split(/\\s+/).map(Number);\nlet done = false;\nfor (let i = 0; i < nums.length && !done; i++) {\n  for (let j = i + 1; j < nums.length; j++) {\n    if (nums[i] + nums[j] === t) { console.log(i + " " + j); done = true; break; }\n  }\n}`,
      samples: [
        { in: '9\n2 7 11 15', out: '0 1', exp: '2 + 7 = 9.' },
        { in: '6\n3 2 4', out: '1 2', exp: '2 + 4 = 6.' }
      ],
      edgeCases: [
        { in: '6\n3 3', out: '0 1', exp: 'Duplicate values.' },
        { in: '0\n-5 5', out: '0 1', exp: 'Opposite signs.' }
      ]
    }
  ],

  // ─────────────────────────────────────────────────────────────
  // 10. TUPLES & SETS
  // ─────────────────────────────────────────────────────────────
  tuples_sets: [
    {
      difficulty: 'Medium',
      titleSuffix: 'Tuple Unpacking & Set Uniqueness',
      problemStatement: (topic) =>
        `Process immutable records and uniqueness for **${topic}**. Given \`item:qty\` pairs separated by spaces, find the item with maximum quantity and total sum: \`Top: <item> (<max>) | Total: <sum>\`.`,
      inputFormat: 'Space-separated item:qty pairs.',
      outputFormat: 'Formatted summary string.',
      constraints: '1 <= items <= 50.',
      pyRef: `pairs = input().split()\nrecs = [(p.split(':')[0], int(p.split(':')[1])) for p in pairs]\ntop = max(recs, key=lambda x: x[1])\ntotal = sum(r[1] for r in recs)\nprint(f"Top: {top[0]} ({top[1]}) | Total: {total}")`,
      javaRef: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String topName = ""; int maxQ = -1, total = 0;\n        while (sc.hasNext()) {\n            String[] p = sc.next().split(":");\n            int q = Integer.parseInt(p[1]);\n            total += q;\n            if (q > maxQ) { maxQ = q; topName = p[0]; }\n        }\n        System.out.println("Top: " + topName + " (" + maxQ + ") | Total: " + total);\n    }\n}`,
      jsRef: `const pairs = prompt("").trim().split(/\\s+/);\nlet top = '', maxQ = -1, total = 0;\nfor (const p of pairs) {\n  const [n, qStr] = p.split(':');\n  const q = Number(qStr); total += q;\n  if (q > maxQ) { maxQ = q; top = n; }\n}\nconsole.log(\`Top: \${top} (\${maxQ}) | Total: \${total}\`);`,
      samples: [
        { in: 'apples:15 bananas:40 oranges:25', out: 'Top: bananas (40) | Total: 80', exp: 'Max is bananas (40), sum is 80.' },
        { in: 'pens:10 books:5', out: 'Top: pens (10) | Total: 15', exp: 'Max is pens (10), sum is 15.' }
      ],
      edgeCases: [
        { in: 'single:100', out: 'Top: single (100) | Total: 100', exp: 'Single record.' },
        { in: 'a:1 b:2 c:3 d:4', out: 'Top: d (4) | Total: 10', exp: 'Ascending quantities.' }
      ]
    }
  ],

  // ─────────────────────────────────────────────────────────────
  // 11. DICTIONARIES & MAPS
  // ─────────────────────────────────────────────────────────────
  dictionaries_maps: [
    {
      difficulty: 'Medium',
      titleSuffix: 'Word Frequency Map & Top Token',
      problemStatement: (topic) =>
        `Build a key-value frequency map for **${topic}**. Read space-separated words (case-insensitive) and print: \`Unique: <count> | Most Frequent: <word> (<freq>)\`.`,
      inputFormat: 'A single line of space-separated words.',
      outputFormat: 'Formatted frequency statistics.',
      constraints: '1 <= words <= 10^4.',
      pyRef: `from collections import Counter\nwords = [w.lower() for w in input().split()]\nc = Counter(words)\ntop_w, top_cnt = c.most_common(1)[0]\nprint(f"Unique: {len(c)} | Most Frequent: {top_w} ({top_cnt})")`,
      javaRef: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        Map<String, Integer> map = new LinkedHashMap<>();\n        while (sc.hasNext()) {\n            String w = sc.next().toLowerCase();\n            map.put(w, map.getOrDefault(w, 0) + 1);\n        }\n        String topW = ""; int maxC = 0;\n        for (Map.Entry<String, Integer> e : map.entrySet()) {\n            if (e.getValue() > maxC) { maxC = e.getValue(); topW = e.getKey(); }\n        }\n        System.out.println("Unique: " + map.size() + " | Most Frequent: " + topW + " (" + maxC + ")");\n    }\n}`,
      jsRef: `const words = prompt("").trim().toLowerCase().split(/\\s+/);\nconst map = {};\nfor (const w of words) map[w] = (map[w] || 0) + 1;\nlet topW = '', maxC = 0;\nfor (const [w, c] of Object.entries(map)) if (c > maxC) { maxC = c; topW = w; }\nconsole.log(\`Unique: \${Object.keys(map).length} | Most Frequent: \${topW} (\${maxC})\`);`,
      samples: [
        { in: 'python code python clean code python', out: 'Unique: 3 | Most Frequent: python (3)', exp: 'python appears 3 times.' },
        { in: 'data data structures', out: 'Unique: 2 | Most Frequent: data (2)', exp: 'data is top word.' }
      ],
      edgeCases: [
        { in: 'single', out: 'Unique: 1 | Most Frequent: single (1)', exp: 'Single word.' },
        { in: 'A a A a', out: 'Unique: 1 | Most Frequent: a (4)', exp: 'Case-insensitive count.' }
      ]
    }
  ],

  // ─────────────────────────────────────────────────────────────
  // 12. OOP & CLASSES
  // ─────────────────────────────────────────────────────────────
  oop_classes: [
    {
      difficulty: 'Medium',
      titleSuffix: 'Encapsulated Employee Payroll Class',
      problemStatement: (topic) =>
        `Design an encapsulated class for **${topic}**. Given \`EmployeeID BaseSalary BonusPercent\`, instantiate an Employee object that computes \`base + (base * bonus // 100)\` and prints: \`Employee: <ID> | Net Payout: <payout>\`.`,
      inputFormat: 'Space-separated EmployeeID, BaseSalary (int), BonusPercent (int).',
      outputFormat: 'Formatted payroll line.',
      constraints: 'BaseSalary >= 1000, 0 <= BonusPercent <= 100.',
      pyRef: `class Employee:\n    def __init__(self, eid, base, bonus):\n        self.eid = eid\n        self.base = base\n        self.bonus = bonus\n    def net_payout(self):\n        return self.base + (self.base * self.bonus // 100)\n\np = input().split()\nemp = Employee(p[0], int(p[1]), int(p[2]))\nprint(f"Employee: {emp.eid} | Net Payout: {emp.net_payout()}")`,
      javaRef: `import java.util.Scanner;\n\nclass Employee {\n    private String id;\n    private long base;\n    private int bonus;\n    Employee(String id, long base, int bonus) { this.id = id; this.base = base; this.bonus = bonus; }\n    long netPayout() { return base + (base * bonus / 100); }\n    String getId() { return id; }\n}\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        Employee emp = new Employee(sc.next(), sc.nextLong(), sc.nextInt());\n        System.out.println("Employee: " + emp.getId() + " | Net Payout: " + emp.netPayout());\n    }\n}`,
      jsRef: `class Employee {\n  constructor(id, base, bonus) { this.id = id; this.base = base; this.bonus = bonus; }\n  netPayout() { return this.base + Math.floor(this.base * this.bonus / 100); }\n}\nconst [id, b, bon] = prompt("").trim().split(/\\s+/);\nconst emp = new Employee(id, Number(b), Number(bon));\nconsole.log(\`Employee: \${emp.id} | Net Payout: \${emp.netPayout()}\`);`,
      samples: [
        { in: 'EMP-101 50000 10', out: 'Employee: EMP-101 | Net Payout: 55000', exp: '50000 + 10% = 55000.' },
        { in: 'EMP-205 80000 0', out: 'Employee: EMP-205 | Net Payout: 80000', exp: 'Zero bonus.' }
      ],
      edgeCases: [
        { in: 'EMP-300 100000 25', out: 'Employee: EMP-300 | Net Payout: 125000', exp: '25% bonus.' },
        { in: 'EMP-001 10000 100', out: 'Employee: EMP-001 | Net Payout: 20000', exp: '100% bonus.' }
      ]
    }
  ],

  // ─────────────────────────────────────────────────────────────
  // 13. EXCEPTION HANDLING
  // ─────────────────────────────────────────────────────────────
  exceptions: [
    {
      difficulty: 'Medium',
      titleSuffix: 'Safe Division & ZeroDivision Exception Guard',
      problemStatement: (topic) =>
        `Implement exception handling for **${topic}**. Read Numerator and Denominator (ints). Divide safely using try/catch (or try/except). If Denominator is zero, catch the exception and print \`ERROR: DIVISION_BY_ZERO\`.`,
      inputFormat: 'Two space-separated integers: Numerator and Denominator.',
      outputFormat: 'Integer quotient or "ERROR: DIVISION_BY_ZERO".',
      constraints: '-10^6 <= Numerator, Denominator <= 10^6.',
      pyRef: `a, b = map(int, input().split())\ntry:\n    print(a // b)\nexcept ZeroDivisionError:\n    print("ERROR: DIVISION_BY_ZERO")`,
      javaRef: `import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int a = sc.nextInt();\n        int b = sc.nextInt();\n        try {\n            System.out.println(a / b);\n        } catch (ArithmeticException e) {\n            System.out.println("ERROR: DIVISION_BY_ZERO");\n        }\n    }\n}`,
      jsRef: `const [a, b] = prompt("").trim().split(/\\s+/).map(Number);\ntry {\n  if (b === 0) throw new Error("DIVISION_BY_ZERO");\n  console.log(Math.trunc(a / b));\n} catch (e) {\n  console.log("ERROR: DIVISION_BY_ZERO");\n}`,
      samples: [
        { in: '20 4', out: '5', exp: '20 / 4 = 5.' },
        { in: '15 0', out: 'ERROR: DIVISION_BY_ZERO', exp: 'Zero division trapped.' }
      ],
      edgeCases: [
        { in: '0 5', out: '0', exp: 'Zero numerator.' },
        { in: '-30 6', out: '-5', exp: 'Negative numerator.' }
      ]
    }
  ],

  // ─────────────────────────────────────────────────────────────
  // 14. SELENIUM & WEB AUTOMATION
  // ─────────────────────────────────────────────────────────────
  selenium_locators: [
    {
      difficulty: 'Medium',
      titleSuffix: 'Selenium Locator Verification & Text Extraction',
      problemStatement: (topic) =>
        `Simulate Selenium WebDriver locator evaluation for **${topic}**. Given \`locatorType locatorValue expectedText\`, print \`LOCATOR_VERIFIED: <locatorValue>\` if expectedText != "NONE", otherwise \`LOCATOR_FAILED: <locatorValue>\`.`,
      inputFormat: 'Space-separated: locatorType locatorValue expectedText.',
      outputFormat: '"LOCATOR_VERIFIED: <val>" or "LOCATOR_FAILED: <val>".',
      constraints: 'locatorType in {id, xpath, css}.',
      pyRef: `ltype, lval, txt = input().split()\nprint(f"LOCATOR_VERIFIED: {lval}" if txt != "NONE" else f"LOCATOR_FAILED: {lval}")`,
      javaRef: `import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String ltype = sc.next();\n        String lval = sc.next();\n        String txt = sc.next();\n        if (!txt.equals("NONE")) System.out.println("LOCATOR_VERIFIED: " + lval);\n        else System.out.println("LOCATOR_FAILED: " + lval);\n    }\n}`,
      jsRef: `const [ltype, lval, txt] = prompt("").trim().split(/\\s+/);\nconsole.log(txt !== "NONE" ? \`LOCATOR_VERIFIED: \${lval}\` : \`LOCATOR_FAILED: \${lval}\`);`,
      samples: [
        { in: 'id loginBtn Submit', out: 'LOCATOR_VERIFIED: loginBtn', exp: 'Element text found.' },
        { in: 'xpath //div[@id="err"] NONE', out: 'LOCATOR_FAILED: //div[@id="err"]', exp: 'Element text missing.' }
      ],
      edgeCases: [
        { in: 'css .header Title', out: 'LOCATOR_VERIFIED: .header', exp: 'CSS selector verified.' },
        { in: 'id modal NONE', out: 'LOCATOR_FAILED: modal', exp: 'Missing modal.' }
      ]
    }
  ],

  // ─────────────────────────────────────────────────────────────
  // 15. WEB / HTML / FORMS / NODE / REACT
  // ─────────────────────────────────────────────────────────────
  html_forms: [
    {
      difficulty: 'Medium',
      titleSuffix: 'Form Field Validation & Sanitization',
      problemStatement: (topic) =>
        `Implement form validation logic for **${topic}**. Given \`username email age\`: verify username length >= 3, email contains "@" and ".", age >= 18. Output \`VALID\` or the first failing code: \`INVALID_USERNAME\`, \`INVALID_EMAIL\`, \`UNDERAGE\`.`,
      inputFormat: 'Single line: username email age.',
      outputFormat: '"VALID" or error code.',
      constraints: 'Age is an integer.',
      pyRef: `u, e, a = input().split()\na = int(a)\nif len(u) < 3: print("INVALID_USERNAME")\nelif '@' not in e or '.' not in e: print("INVALID_EMAIL")\nelif a < 18: print("UNDERAGE")\nelse: print("VALID")`,
      javaRef: `import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String u = sc.next(), e = sc.next(); int a = sc.nextInt();\n        if (u.length() < 3) System.out.println("INVALID_USERNAME");\n        else if (!e.contains("@") || !e.contains(".")) System.out.println("INVALID_EMAIL");\n        else if (a < 18) System.out.println("UNDERAGE");\n        else System.out.println("VALID");\n    }\n}`,
      jsRef: `const [u, e, aStr] = prompt("").trim().split(/\\s+/);\nconst a = Number(aStr);\nif (u.length < 3) console.log("INVALID_USERNAME");\nelse if (!e.includes("@") || !e.includes(".")) console.log("INVALID_EMAIL");\nelse if (a < 18) console.log("UNDERAGE");\nelse console.log("VALID");`,
      samples: [
        { in: 'alice alice@example.com 22', out: 'VALID', exp: 'All checks pass.' },
        { in: 'al test@mail.com 25', out: 'INVALID_USERNAME', exp: 'Username < 3 chars.' }
      ],
      edgeCases: [
        { in: 'john john_at_mail 20', out: 'INVALID_EMAIL', exp: 'Invalid email.' },
        { in: 'mark mark@web.org 16', out: 'UNDERAGE', exp: 'Age < 18.' }
      ]
    }
  ],

  // ─────────────────────────────────────────────────────────────
  // 16. SQL & DATA SCIENCE SPECS (Universal course coverage)
  // ─────────────────────────────────────────────────────────────
  sql_databases: [
    {
      difficulty: 'Easy',
      questionType: 'coding',
      titleSuffix: 'Filtered Student Record Query',
      problemStatement: (topic) =>
        `Apply relational query filtering for **${topic}**. Write a SQL SELECT statement on the \`students\` table (\`id, name, course, mark, city, batch\`) to select \`name\` and \`mark\` of all students with \`mark >= 85\`.`,
      inputFormat: 'Sandboxed table `students` with columns (id, name, course, mark, city, batch).',
      outputFormat: 'Rows matching mark >= 85 ordered by mark DESC.',
      constraints: 'Use standard ANSI SELECT ... FROM ... WHERE syntax.',
      sqlRef: `SELECT name, mark FROM students WHERE mark >= 85 ORDER BY mark DESC;`,
      pyRef: `print("Alice Walker 92")`,
      javaRef: `public class Main { public static void main(String[] args) { System.out.println("Alice Walker 92"); } }`,
      jsRef: `console.log("Alice Walker 92");`,
      samples: [
        { in: 'students(mark >= 85)', out: 'mark >= 85', exp: 'Filters rows meeting threshold 85.' },
        { in: 'students(ORDER BY mark DESC)', out: 'mark DESC', exp: 'Sorts highest mark first.' }
      ],
      edgeCases: [
        { in: 'boundary 85', out: 'mark >= 85', exp: 'Includes boundary mark = 85.' },
        { in: 'table students', out: 'SELECT name, mark FROM students', exp: 'Projects exact columns.' }
      ]
    }
  ],

  data_science: [
    {
      difficulty: 'Medium',
      questionType: 'coding',
      titleSuffix: 'Statistical Mean & Variance Aggregation',
      problemStatement: (topic) =>
        `Compute descriptive dataset statistics for **${topic}**. Given space-separated numeric observations on one line, calculate the arithmetic mean formatted to 2 decimal places.`,
      inputFormat: 'Single line of space-separated numbers.',
      outputFormat: 'Single floating-point mean formatted to 2 decimal places.',
      constraints: '1 <= count <= 10^4.',
      pyRef: `vals = [float(x) for x in input().split()]\nprint(f"{sum(vals) / len(vals):.2f}")`,
      javaRef: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        double sum = 0; int cnt = 0;\n        while (sc.hasNextDouble()) { sum += sc.nextDouble(); cnt++; }\n        System.out.printf(java.util.Locale.US, "%.2f%n", sum / cnt);\n    }\n}`,
      jsRef: `const vals = prompt("").trim().split(/\\s+/).map(Number);\nconsole.log((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2));`,
      samples: [
        { in: '10 20 30 40', out: '25.00', exp: '(10+20+30+40)/4 = 25.00.' },
        { in: '5 10 15', out: '10.00', exp: 'Mean of 5, 10, 15 is 10.00.' }
      ],
      edgeCases: [
        { in: '42', out: '42.00', exp: 'Single observation.' },
        { in: '1.5 2.5 3.5', out: '2.50', exp: 'Floating point values.' }
      ]
    }
  ]
};

// Map secondary/specialized categories to closest compatible spec bucket while keeping module focus
const CATEGORY_ALIASES = {
  inheritance_poly: 'oop_classes',
  collections_generics: 'arrays_lists',
  file_io: 'strings',
  multithreading: 'methods_functions',
  jdbc_sql: 'dictionaries_maps',
  html_structure: 'syntax_output',
  css_layout: 'syntax_output',
  js_dom: 'html_forms',
  js_async: 'methods_functions',
  node_express: 'html_forms',
  mongodb_mongoose: 'dictionaries_maps',
  react_hooks: 'arrays_lists',
  selenium_basics: 'selenium_locators',
  selenium_waits: 'selenium_locators',
  selenium_pom_testng: 'selenium_locators',
  selenium_bdd: 'selenium_locators',
  capstone_project: 'arrays_lists',
  c_cpp_memory: 'arrays_lists'
};

module.exports = {
  CATEGORY_SPECS,
  CATEGORY_ALIASES
};
