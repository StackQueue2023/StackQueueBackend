const { extractTextFromPdf } = require('./syllabusGeneratorService');
const InternshipModule = require('../models/InternshipModule');
const InternshipQuestion = require('../models/InternshipQuestion');
const InternshipBatch = require('../models/InternshipBatch');

/**
 * Standard Tech Domain Knowledge Base for Day-wise content & practical task generation
 */
const DOMAIN_DAY_TEMPLATES = {
  java: [
    { day: 1, title: 'Java Platform, JDK Setup & Core Syntax', topics: ['JVM vs JRE vs JDK', 'Primitive Data Types', 'Variable Scopes', 'Arithmetic & Bitwise Operators'], code: 'public class Solution { public static void main(String[] args) { System.out.println("Hello Java"); } }' },
    { day: 2, title: 'Control Flow, Loops & Logic Building', topics: ['if-else statements', 'switch-case expressions', 'for, while, do-while loops', 'Pattern Generation & Math logic'], code: 'public class Solution { public static int sumOfDigits(int n) { int s = 0; while (n > 0) { s += n % 10; n /= 10; } return s; } }' },
    { day: 3, title: 'Object-Oriented Programming (Classes & Objects)', topics: ['Class Architecture', 'Instance Variables vs Static', 'Constructors & Overloading', 'this reference'], code: 'class Student { private String name; public Student(String n) { this.name = n; } public String getName() { return this.name; } }' },
    { day: 4, title: 'Inheritance, Polymorphism & Abstraction', topics: ['Single, Multilevel & Hierarchical Inheritance', 'Method Overriding vs Overloading', 'Abstract Classes', 'super keyword'], code: 'abstract class Shape { abstract double area(); }\nclass Circle extends Shape { double r; Circle(double r){ this.r=r; } double area(){ return Math.PI*r*r; } }' },
    { day: 5, title: 'Interfaces, Multiple Inheritance & Default Methods', topics: ['Interface Declaration', 'implements contract', 'Default & Static Methods in Interfaces', 'Functional Interfaces'], code: 'interface PayGateway { boolean process(double amt); }' },
    { day: 6, title: 'Arrays, String Manipulation & Regular Expressions', topics: ['1D & 2D Array Algorithms', 'String Immutability', 'StringBuilder & StringBuffer', 'Regex matching'], code: 'public class Solution { public static boolean isPalindrome(String s) { String r = new StringBuilder(s).reverse().toString(); return s.equals(r); } }' },
    { day: 7, title: 'Exception Handling & Robust Application Design', topics: ['try-catch-finally block', 'Checked vs Unchecked Exceptions', 'Custom Exceptions', 'throw & throws'], code: 'class InvalidAgeException extends Exception { public InvalidAgeException(String m) { super(m); } }' },
    { day: 8, title: 'Java Collections Framework – Lists & Sets', topics: ['ArrayList vs LinkedList', 'HashSet & TreeSet', 'Iterator & ListIterator', 'Sorting with Comparable & Comparator'], code: 'List<String> list = new ArrayList<>(); list.add("Alpha"); Collections.sort(list);' },
    { day: 9, title: 'Java Collections Framework – Maps & Generics', topics: ['HashMap internals', 'LinkedHashMap & TreeMap', 'Generic Classes & Methods', 'Wildcards in Generics'], code: 'Map<String, Integer> map = new HashMap<>(); map.put("Java", 100);' },
    { day: 10, title: 'Java 8 Streams API & Lambda Expressions', topics: ['Lambda Syntax', 'Predicate, Function, Consumer', 'Stream filter, map, reduce', 'Collectors & grouping'], code: 'List<Integer> squares = list.stream().map(x -> x * x).collect(Collectors.toList());' },
    { day: 11, title: 'Multithreading & Concurrency Essentials', topics: ['Thread class vs Runnable interface', 'Thread Lifecycle', 'Synchronization & Locks', 'ExecutorService & ThreadPool'], code: 'class Worker implements Runnable { public void run() { System.out.println("Processing"); } }' },
    { day: 12, title: 'Database Connectivity – JDBC & PreparedStatements', topics: ['JDBC Drivers & Architecture', 'DriverManager Connection', 'PreparedStatement CRUD', 'Transaction Management (commit/rollback)'], code: 'PreparedStatement ps = conn.prepareStatement("INSERT INTO users(name) VALUES(?)");' },
    { day: 13, title: 'Spring Framework Basics & Dependency Injection', topics: ['Inversion of Control (IoC)', '@Component, @Service, @Repository', '@Autowired DI', 'Spring ApplicationContext'], code: '@Service\npublic class UserService { @Autowired private UserRepository repo; }' },
    { day: 14, title: 'Building RESTful APIs with Spring Boot', topics: ['@RestController, @GetMapping, @PostMapping', 'Request & Response Bodies (@RequestBody, ResponseEntity)', 'PathVariables & RequestParams', 'HTTP Status Codes'], code: '@RestController\n@RequestMapping("/api/tasks")\npublic class TaskController { @GetMapping public List<Task> getAll() { return service.list(); } }' },
    { day: 15, title: 'Internship Capstone Architecture & Deployment', topics: ['Full Application Integration', 'Layered Architecture (Controller -> Service -> Repo)', 'Unit Testing with JUnit', 'Packaging Jar & Production Deployment'], code: 'mvn clean package\njava -jar app.jar' }
  ],
  python: [
    { day: 1, title: 'Python Foundations, REPL & Data Types', topics: ['Python Interpreter', 'int, float, str, bool', 'Dynamic Typing', 'Type Casting & F-strings'], code: 'name = "Python"\nprint(f"Hello, {name}!")' },
    { day: 2, title: 'Conditionals, Iterations & Comprehensions', topics: ['if, elif, else', 'while & for loops', 'range(), enumerate(), zip()', 'List & Dict Comprehensions'], code: 'evens = [x for x in range(20) if x % 2 == 0]' },
    { day: 3, title: 'Functions, Scopes & Modular Programming', topics: ['def function declaration', '*args & **kwargs', 'Lambda functions', 'Module import & __name__ == "__main__"'], code: 'def solve(*args, **kwargs):\n    return sum(args)' },
    { day: 4, title: 'Built-in Data Structures (Lists, Tuples, Sets, Dicts)', topics: ['List operations & slicing', 'Tuple immutability', 'Set uniqueness & Venn ops', 'Dict keys, values, hashing'], code: 'stats = {"students": 40, "batch": "Python-B1"}' },
    { day: 5, title: 'Object-Oriented Python (Classes & Magic Methods)', topics: ['class & self', '__init__, __str__, __repr__', 'Class attributes vs Instance attributes', 'Inheritance & super()'], code: 'class Model:\n    def __init__(self, name):\n        self.name = name' },
    { day: 6, title: 'File Handling, CSV & JSON Serialization', topics: ['open() with context manager', 'Reading & writing text files', 'json.loads() & json.dumps()', 'csv.reader & writer'], code: 'with open("data.json", "w") as f:\n    json.dump({"status": "ok"}, f)' },
    { day: 7, title: 'Exception Handling & Custom Error Types', topics: ['try-except-else-finally', 'Handling specific exceptions', 'raise statement', 'Inheriting from Exception'], code: 'class BusinessError(Exception):\n    pass' },
    { day: 8, title: 'Functional Python, Iterators & Generators', topics: ['yield keyword', 'Generator expressions', 'map(), filter(), reduce()', 'itertools & functools'], code: 'def count_up(n):\n    i = 0\n    while i < n:\n        yield i\n        i += 1' },
    { day: 9, title: 'NumPy Essentials for Data Computing', topics: ['ndarray creation & shapes', 'Array slicing & broadcasting', 'Mathematical aggregations', 'Linear algebra & indexing'], code: 'import numpy as np\narr = np.array([1, 2, 3, 4])\nprint(arr.mean())' },
    { day: 10, title: 'Pandas DataFrames & Data Transformation', topics: ['Series & DataFrame creation', 'Filtering, loc & iloc', 'Handling missing values (fillna, dropna)', 'groupby & aggregate'], code: 'import pandas as pd\ndf = pd.DataFrame({"A": [1, 2], "B": [3, 4]})' },
    { day: 11, title: 'Database Integration with SQLite & SQLAlchemy', topics: ['sqlite3 module', 'DDL & DML queries', 'Parameterized execution', 'ORM models & sessions'], code: 'import sqlite3\nconn = sqlite3.connect("app.db")' },
    { day: 12, title: 'Web Scraping & HTTP Requests with Requests/BS4', topics: ['requests.get() & post()', 'HTTP headers & status codes', 'BeautifulSoup HTML parsing', 'CSS selector extraction'], code: 'import requests\nresp = requests.get("https://api.github.com")' },
    { day: 13, title: 'FastAPI / Flask Microservice Engineering', topics: ['FastAPI setup', 'Route decorators (@app.get)', 'Pydantic models for validation', 'Swagger automatic docs'], code: 'from fastapi import FastAPI\napp = FastAPI()\n@app.get("/")\ndef root():\n    return {"status": "live"}' },
    { day: 14, title: 'API Integration, JWT Authentication & Testing', topics: ['JWT token creation', 'Protected route dependencies', 'pytest test cases', 'Mocking & fixtures'], code: 'def test_math():\n    assert 2 + 2 == 4' },
    { day: 15, title: 'Capstone Project Integration & Deployment', topics: ['Project Architecture', 'virtualenv & requirements.txt', 'Dockerizing Python application', 'Production deployment'], code: 'uvicorn main:app --host 0.0.0.0 --port 8000' }
  ]
};

/**
 * Extracts and structures day-wise modules from raw PDF text or creates standard 15-day syllabus
 */
function extractDayWiseSyllabus(rawText, courseName = 'Java') {
  const normText = (rawText || '').replace(/\r\n/g, '\n');
  const lines = normText.split('\n').map(l => l.trim()).filter(Boolean);

  // Regex to detect "Day 1", "DAY - 01", "Day 1:", "Day 1 – ..."
  const dayRegex = /^(?:day|module)\s*[-:]?\s*(\d+)\s*[-:–]?\s*(.*)$/i;

  const detectedDays = [];
  let currentDay = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(dayRegex);

    if (match) {
      if (currentDay) {
        detectedDays.push(finalizeDay(currentDay));
      }
      currentDay = {
        dayNumber: parseInt(match[1], 10),
        rawTitle: match[2]?.trim() || `Day ${match[1]} Learning & Practical Training`,
        topics: [],
        lines: []
      };
    } else if (currentDay) {
      currentDay.lines.push(line);
      // Clean bullet points
      const cleanLine = line.replace(/^[•\-\*\d+\.]+\s*/, '').trim();
      if (cleanLine.length > 3 && cleanLine.length < 90) {
        currentDay.topics.push(cleanLine);
      }
    }
  }

  if (currentDay) {
    detectedDays.push(finalizeDay(currentDay));
  }

  // If the uploaded PDF had clear Day 1.. Day N structure, return it
  if (detectedDays.length >= 3) {
    // Sort by day number
    detectedDays.sort((a, b) => a.dayNumber - b.dayNumber);
    return detectedDays;
  }

  // If the PDF is a general summary without explicit "Day X" tokens, synthesize the structured 15 days based on course domain
  return buildStandard15DaySyllabus(courseName, lines);
}

function finalizeDay(dayObj) {
  const dayNumber = dayObj.dayNumber;
  let dayTitle = dayObj.rawTitle;
  if (!dayTitle || dayTitle.length < 5) {
    dayTitle = `Day ${dayNumber} – Core Technical Training`;
  }

  // Deduplicate and filter topics
  const uniqueTopics = Array.from(new Set(dayObj.topics)).slice(0, 8);
  if (uniqueTopics.length === 0) {
    uniqueTopics.push('Core Concepts & Architectural Principles', 'Practical Problem Solving & Exercises');
  }

  const learningContent = `### Day ${dayNumber}: ${dayTitle}\n\n**Overview:**\nIn this intensive session, interns focus on real-world industrial practices, syntax mastery, and architectural problem-solving.\n\n**Key Competencies Covered:**\n${uniqueTopics.map((t, idx) => `${idx + 1}. **${t}**`).join('\n')}\n\n**Industry Practical Focus:**\n- Hands-on implementation of enterprise patterns.\n- Rigorous algorithmic verification and unit testing.`;

  return {
    dayNumber,
    dayTitle: dayTitle.startsWith('Day') ? dayTitle : `Day ${dayNumber} – ${dayTitle}`,
    topics: uniqueTopics,
    subtopics: uniqueTopics.slice(0, 4),
    learningContent,
    practicalExercises: [
      {
        title: `Practical Task ${dayNumber}.1: Implement ${uniqueTopics[0]}`,
        description: `Design, code, and execute a working implementation demonstrating ${uniqueTopics[0]}.`,
        codeSnippet: `// Day ${dayNumber} Exercise Implementation`,
        instructions: 'Write clean, modular code adhering to industry naming conventions.'
      }
    ],
    tasks: [
      {
        title: `Day ${dayNumber} Assignment: Verification of ${uniqueTopics[0]}`,
        description: `Complete the day challenge and verify output against standard test cases.`,
        taskType: 'practical',
        points: 10
      }
    ]
  };
}

/**
 * Builds standard, sequential 15-day industry modules when PDF has general text
 */
function buildStandard15DaySyllabus(courseName, pdfLines = []) {
  const normCourse = (courseName || '').toLowerCase();
  const domainKey = normCourse.includes('python') ? 'python' : 'java';
  const templates = DOMAIN_DAY_TEMPLATES[domainKey] || DOMAIN_DAY_TEMPLATES.java;

  return templates.map(t => {
    return {
      dayNumber: t.day,
      dayTitle: `Day ${t.day} – ${t.title}`,
      topics: t.topics,
      subtopics: t.topics.slice(0, 3),
      learningContent: `### Day ${t.day}: ${t.title}\n\n**Curriculum Focus:**\n${t.topics.map((top, idx) => `${idx + 1}. **${top}**`).join('\n')}\n\n**Practical Implementation Guide:**\nDevelop structured code implementing the above topics. Ensure clean separation of concerns and robust error handling.`,
      practicalExercises: [
        {
          title: `Hands-on Exercise ${t.day}: ${t.topics[0]}`,
          description: `Create a functional application module illustrating ${t.topics[0]}.`,
          codeSnippet: t.code,
          instructions: 'Run, test, and verify expected execution outputs.'
        }
      ],
      tasks: [
        {
          title: `Day ${t.day} Assessment: ${t.topics[0]}`,
          description: `Solve the assigned technical problem and submit for automatic verification.`,
          taskType: 'practical',
          points: 10
        }
      ]
    };
  });
}

/**
 * Generates context-rich Day-wise questions linked to a specific day's topics
 */
function generateQuestionsForDay(dayNumber, dayTitle, topics, courseName = 'Java') {
  const primaryTopic = topics && topics.length > 0 ? topics[0] : 'Core Concepts';
  const secondaryTopic = topics && topics.length > 1 ? topics[1] : 'Algorithmic Problem Solving';

  const isPython = (courseName || '').toLowerCase().includes('python');

  return [
    {
      dayNumber,
      title: `Day ${dayNumber} Coding Challenge: ${primaryTopic}`,
      question: `Write an efficient program demonstrating **${primaryTopic}**. Your solution should read input values, apply proper algorithmic processing, and return the formatted output.`,
      type: 'coding',
      difficulty: dayNumber <= 5 ? 'Easy' : (dayNumber <= 11 ? 'Medium' : 'Hard'),
      codeTemplate: isPython
        ? `def solve(input_data):\n    # Write your Day ${dayNumber} solution for ${primaryTopic} here\n    pass`
        : `public class Day${dayNumber}Solution {\n    public static String solve(String input) {\n        // Day ${dayNumber} implementation for ${primaryTopic}\n        return "";\n    }\n}`,
      correctAnswer: isPython
        ? `def solve(input_data):\n    return str(input_data).strip().upper()`
        : `public class Day${dayNumber}Solution { public static String solve(String input) { return input.trim().toUpperCase(); } }`,
      explanation: `This problem evaluates your understanding of ${primaryTopic} covered in Day ${dayNumber}.`,
      testCases: [
        { input: 'test sample', expectedOutput: 'TEST SAMPLE', isHidden: false },
        { input: 'production input', expectedOutput: 'PRODUCTION INPUT', isHidden: true }
      ],
      order: 1
    },
    {
      dayNumber,
      title: `Day ${dayNumber} Concept Check: ${secondaryTopic}`,
      question: `Which of the following statements is mathematically and architecturally TRUE regarding **${secondaryTopic}**?`,
      type: 'mcq',
      difficulty: 'Easy',
      options: [
        `It ensures modular encapsulation and optimal time complexity.`,
        `It bypasses memory allocation and compiler type-checking completely.`,
        `It is deprecated in all modern production runtime environments.`,
        `It can only be executed in single-threaded environments.`
      ],
      correctAnswer: `It ensures modular encapsulation and optimal time complexity.`,
      explanation: `In standard software architecture, ${secondaryTopic} provides strict modular isolation, predictability, and efficiency.`,
      order: 2
    },
    {
      dayNumber,
      title: `Day ${dayNumber} Practical Scenario: ${primaryTopic} Implementation`,
      question: `In an enterprise system, a service requires handling high-throughput transactions involving **${primaryTopic}**. Explain how you would prevent memory leakage and ensure thread-safe execution.`,
      type: 'practical',
      difficulty: 'Medium',
      correctAnswer: `Use appropriate connection pooling, avoid unnecessary global states, leverage immutable data structures, and handle exceptions cleanly with proper resource cleanup.`,
      explanation: `Enterprise reliability requires defensive resource management and bounded memory usage.`,
      order: 3
    }
  ];
}

/**
 * Parses uploaded PDF buffer and persists 15 day-wise modules and questions for an Internship Batch
 */
async function processInternshipPdfAndGenerateDayWise(batchId, pdfBuffer, originalFilename) {
  const batch = await InternshipBatch.findById(batchId);
  if (!batch) {
    throw new Error('Internship Batch not found.');
  }

  let extractedText = '';
  try {
    extractedText = await extractTextFromPdf(pdfBuffer);
  } catch (err) {
    console.warn('[PDF Extraction Warning]: Using robust syllabus builder due to:', err.message);
  }

  const dayWiseSyllabus = extractDayWiseSyllabus(extractedText, batch.courseName);

  // Remove existing modules and questions for this batch if re-uploading
  await InternshipModule.deleteMany({ batchId });
  await InternshipQuestion.deleteMany({ batchId });

  const createdModules = [];
  let totalGeneratedQuestions = 0;

  for (const dayData of dayWiseSyllabus) {
    const questionsForThisDay = generateQuestionsForDay(
      dayData.dayNumber,
      dayData.dayTitle,
      dayData.topics,
      batch.courseName
    );

    const moduleDoc = await InternshipModule.create({
      batchId,
      courseName: batch.courseName,
      dayNumber: dayData.dayNumber,
      dayTitle: dayData.dayTitle,
      topics: dayData.topics,
      subtopics: dayData.subtopics,
      learningContent: dayData.learningContent,
      practicalExercises: dayData.practicalExercises,
      tasks: dayData.tasks,
      totalQuestions: questionsForThisDay.length,
      estimatedHours: 3,
      status: 'published'
    });

    createdModules.push(moduleDoc);

    // Save questions linked to this specific day & module
    for (const q of questionsForThisDay) {
      await InternshipQuestion.create({
        ...q,
        batchId,
        moduleId: moduleDoc._id
      });
      totalGeneratedQuestions++;
    }
  }

  // Update batch metadata
  batch.totalDays = dayWiseSyllabus.length;
  batch.syllabusFileName = originalFilename || 'Internship_Syllabus.pdf';
  await batch.save();

  return {
    success: true,
    totalDays: dayWiseSyllabus.length,
    totalModules: createdModules.length,
    totalQuestions: totalGeneratedQuestions,
    modules: createdModules
  };
}

module.exports = {
  extractDayWiseSyllabus,
  generateQuestionsForDay,
  processInternshipPdfAndGenerateDayWise
};
