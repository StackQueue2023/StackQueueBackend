const mongoose = require('mongoose');
const InterviewQuestion = require('../models/InterviewQuestion');
const InterviewTestCase = require('../models/InterviewTestCase');

const DAILY_QUESTIONS = [
  // ── JAVA DOMAIN (isDailyOnly: true, unique titles & problem statements) ──
  {
    questionNumber: 1001,
    title: "Java Daily Special: HashMap Frequency Counter",
    category: "Java & Data Structures",
    domain: "java",
    level: 0,
    difficulty: "Easy",
    isDailyOnly: true,
    problemStatement: "Given an array of integers `nums`, return the frequency count of each element as a formatted string using Java Map logic.",
    inputFormat: "Space-separated integers for nums",
    outputFormat: "String representation of frequency count",
    constraints: "1 <= nums.length <= 10^4",
    examples: [
      { input: "1 2 2 3 3 3", output: "1:1, 2:2, 3:3", explanation: "1 appears 1 time, 2 appears 2 times, 3 appears 3 times." }
    ],
    starterCode: {
      java: "public class Main {\n    public static String countFrequency(int[] nums) {\n        // Write your Java code here\n        return \"\";\n    }\n}",
      javascript: "function countFrequency(nums) {\n    // Write your code here\n}",
      python: "def count_frequency(nums):\n    # Write your code here\n    pass"
    },
    testCases: [
      { input: "1 2 2 3 3 3", expectedOutput: "1:1, 2:2, 3:3", isHidden: false },
      { input: "4 4 4 4", expectedOutput: "4:4", isHidden: true }
    ]
  },
  {
    questionNumber: 1002,
    title: "Java Daily Special: Subarray Sum Equals Target",
    category: "Java & Algorithms",
    domain: "java",
    level: 0,
    difficulty: "Medium",
    isDailyOnly: true,
    problemStatement: "Given an array of integers `nums` and an integer `target`, return the total number of continuous subarrays whose sum equals `target`.",
    inputFormat: "Target integer on first line, space-separated nums on second line",
    outputFormat: "Integer total count",
    constraints: "1 <= nums.length <= 2 * 10^4",
    examples: [
      { input: "2\n1 1 1", output: "2", explanation: "[1,1] at indices (0,1) and (1,2) sum to 2." }
    ],
    starterCode: {
      java: "public class Main {\n    public static int subarraySum(int[] nums, int target) {\n        // Write your Java code here\n        return 0;\n    }\n}",
      javascript: "function subarraySum(nums, target) {\n    // Write your code here\n}",
      python: "def subarray_sum(nums, target):\n    # Write your code here\n    pass"
    },
    testCases: [
      { input: "2\n1 1 1", expectedOutput: "2", isHidden: false },
      { input: "3\n1 2 3", expectedOutput: "2", isHidden: true }
    ]
  },
  {
    questionNumber: 1003,
    title: "Java Daily Special: Matrix Primary Diagonal Sum",
    category: "Java & Arrays",
    domain: "java",
    level: 0,
    difficulty: "Easy",
    isDailyOnly: true,
    problemStatement: "Given a square 2D matrix, calculate the sum of its primary diagonal elements in Java.",
    inputFormat: "Matrix row values",
    outputFormat: "Integer sum",
    constraints: "1 <= n <= 100",
    examples: [
      { input: "1 2 3\n4 5 6\n7 8 9", output: "15", explanation: "1 + 5 + 9 = 15." }
    ],
    starterCode: {
      java: "public class Main {\n    public static int matrixDiagonalSum(int[][] mat) {\n        // Write your Java code here\n        return 0;\n    }\n}",
      javascript: "function matrixDiagonalSum(mat) {\n    // Write your code here\n}",
      python: "def matrix_diagonal_sum(mat):\n    # Write your code here\n    pass"
    },
    testCases: [
      { input: "1 2 3\n4 5 6\n7 8 9", expectedOutput: "15", isHidden: false },
      { input: "10 20\n30 40", expectedOutput: "50", isHidden: true }
    ]
  },
  {
    questionNumber: 1004,
    title: "Java Daily Special: Bitwise Single Non-Duplicate Number",
    category: "Java & Bitwise",
    domain: "java",
    level: 0,
    difficulty: "Easy",
    isDailyOnly: true,
    problemStatement: "Given an array of integers where every element appears twice except for one, find that single element using bitwise XOR in Java.",
    inputFormat: "Space-separated integers for nums",
    outputFormat: "Single non-duplicate integer",
    constraints: "1 <= nums.length <= 3 * 10^4",
    examples: [
      { input: "4 1 2 1 2", output: "4", explanation: "4 is the only number occurring once." }
    ],
    starterCode: {
      java: "public class Main {\n    public static int singleNumber(int[] nums) {\n        // Write your Java code here\n        return 0;\n    }\n}",
      javascript: "function singleNumber(nums) {\n    // Write your code here\n}",
      python: "def single_number(nums):\n    pass"
    },
    testCases: [
      { input: "4 1 2 1 2", expectedOutput: "4", isHidden: false },
      { input: "2 2 1", expectedOutput: "1", isHidden: true }
    ]
  },

  // ── PYTHON DOMAIN ──
  {
    questionNumber: 1011,
    title: "Python Daily Special: Dictionary Frequency Grouping",
    category: "Python & Data Structures",
    domain: "python",
    level: 0,
    difficulty: "Easy",
    isDailyOnly: true,
    problemStatement: "Given a list of words, group words by their character lengths using a Python dictionary and return the formatted output.",
    inputFormat: "Space-separated words",
    outputFormat: "Length grouping string",
    constraints: "1 <= words.length <= 10^4",
    examples: [
      { input: "cat dog apple banana", output: "3:[cat, dog], 5:[apple], 6:[banana]", explanation: "Grouped by word length." }
    ],
    starterCode: {
      python: "def group_by_length(words):\n    # Write your Python code here\n    pass",
      javascript: "function groupByLength(words) {\n    // Write your code here\n}",
      java: "public class Main {\n    public static String groupByLength(String[] words) {\n        // Write your code here\n        return \"\";\n    }\n}"
    },
    testCases: [
      { input: "cat dog apple banana", expectedOutput: "3:[cat, dog], 5:[apple], 6:[banana]", isHidden: false },
      { input: "hi hello hey", expectedOutput: "2:[hi], 3:[hey], 5:[hello]", isHidden: true }
    ]
  },
  {
    questionNumber: 1012,
    title: "Python Daily Special: List Compression Encoder",
    category: "Python & Strings",
    domain: "python",
    level: 0,
    difficulty: "Medium",
    isDailyOnly: true,
    problemStatement: "Compress consecutive repeating characters in a Python string into character-count format.",
    inputFormat: "String s",
    outputFormat: "Compressed string",
    constraints: "1 <= s.length <= 10^5",
    examples: [
      { input: "aaabbc", output: "a3b2c1", explanation: "'aaa' -> 'a3', 'bb' -> 'b2', 'c' -> 'c1'." }
    ],
    starterCode: {
      python: "def compress_string(s):\n    # Write your Python code here\n    pass",
      javascript: "function compressString(s) {\n    // Write your code here\n}",
      java: "public class Main {\n    public static String compressString(String s) {\n        // Write your code here\n        return \"\";\n    }\n}"
    },
    testCases: [
      { input: "aaabbc", expectedOutput: "a3b2c1", isHidden: false },
      { input: "abcd", expectedOutput: "a1b1c1d1", isHidden: true }
    ]
  },

  // ── C++ DOMAIN ──
  {
    questionNumber: 1021,
    title: "C++ Daily Special: Vector Two Pointer Swap",
    category: "C++ & Pointers",
    domain: "cpp",
    level: 0,
    difficulty: "Easy",
    isDailyOnly: true,
    problemStatement: "Given an integer array `nums`, move all even numbers to the beginning and odd numbers to the end using C++ two-pointer technique.",
    inputFormat: "Space-separated integers for nums",
    outputFormat: "Space-separated formatted numbers",
    constraints: "1 <= nums.length <= 10^5",
    examples: [
      { input: "3 1 2 4", output: "2 4 3 1", explanation: "Even numbers [2, 4] moved before odd numbers [3, 1]." }
    ],
    starterCode: {
      cpp: "#include <vector>\nusing namespace std;\n\nvector<int> sortArrayByParity(vector<int>& nums) {\n    // Write your C++ code here\n}",
      java: "public class Main {\n    public static int[] sortArrayByParity(int[] nums) {\n        return new int[0];\n    }\n}",
      python: "def sort_array_by_parity(nums):\n    pass"
    },
    testCases: [
      { input: "3 1 2 4", expectedOutput: "2 4 3 1", isHidden: false },
      { input: "0", expectedOutput: "0", isHidden: true }
    ]
  },
  {
    questionNumber: 1022,
    title: "C++ Daily Special: Balanced Bracket Stack Detector",
    category: "C++ & STL Stack",
    domain: "cpp",
    level: 0,
    difficulty: "Medium",
    isDailyOnly: true,
    problemStatement: "Check if a string of brackets `s` is balanced using a C++ STL stack.",
    inputFormat: "String s",
    outputFormat: "Boolean (true or false)",
    constraints: "1 <= s.length <= 10^4",
    examples: [
      { input: "{[()]}", output: "true", explanation: "All brackets correctly matched." }
    ],
    starterCode: {
      cpp: "#include <string>\nusing namespace std;\n\nbool isValid(string s) {\n    // Write your C++ code here\n}",
      java: "public class Main {\n    public static boolean isValid(String s) {\n        return false;\n    }\n}",
      python: "def is_valid(s):\n    pass"
    },
    testCases: [
      { input: "{[()]}", expectedOutput: "true", isHidden: false },
      { input: "{[(])}", expectedOutput: "false", isHidden: true }
    ]
  },

  // ── REACT / JAVASCRIPT DOMAIN ──
  {
    questionNumber: 1031,
    title: "React/JS Daily Special: Array Object Flatten & Sum",
    category: "JavaScript & Frontend",
    domain: "react",
    level: 0,
    difficulty: "Easy",
    isDailyOnly: true,
    problemStatement: "Given an array of objects representing item prices, calculate the total sum using JavaScript `reduce`.",
    inputFormat: "JSON array or space-separated numbers",
    outputFormat: "Total number sum",
    constraints: "1 <= items.length <= 1000",
    examples: [
      { input: "10 20 30", output: "60", explanation: "10 + 20 + 30 = 60." }
    ],
    starterCode: {
      javascript: "function calculateTotal(prices) {\n    // Write your JS code here\n}",
      python: "def calculate_total(prices):\n    pass",
      java: "public class Main {\n    public static int calculateTotal(int[] prices) {\n        return 0;\n    }\n}"
    },
    testCases: [
      { input: "10 20 30", expectedOutput: "60", isHidden: false },
      { input: "5 15 25 35", expectedOutput: "80", isHidden: true }
    ]
  },
  {
    questionNumber: 1032,
    title: "React/JS Daily Special: Debounced Event Key Counter",
    category: "JavaScript & Frontend",
    domain: "react",
    level: 0,
    difficulty: "Medium",
    isDailyOnly: true,
    problemStatement: "Given a sequence of input keystrokes, simulate a debounced search query handler that counts non-empty unique queries.",
    inputFormat: "Space-separated keystroke strings",
    outputFormat: "Integer count",
    constraints: "1 <= input.length <= 10^4",
    examples: [
      { input: "a ab abc abc", output: "3", explanation: "Unique queries: 'a', 'ab', 'abc'." }
    ],
    starterCode: {
      javascript: "function countUniqueQueries(keys) {\n    // Write your JS code here\n}",
      python: "def count_unique_queries(keys):\n    pass",
      java: "public class Main {\n    public static int countUniqueQueries(String[] keys) {\n        return 0;\n    }\n}"
    },
    testCases: [
      { input: "a ab abc abc", expectedOutput: "3", isHidden: false },
      { input: "test test test", expectedOutput: "1", isHidden: true }
    ]
  }
];

async function seedDailySpecialQuestions() {
  try {
    console.log('[DailySpecialSeeder] Seeding domain-specific non-roadmap Daily Special Questions...');

    for (const item of DAILY_QUESTIONS) {
      const { testCases, ...questionData } = item;

      const question = await InterviewQuestion.findOneAndUpdate(
        { questionNumber: item.questionNumber },
        { ...questionData, isDailyOnly: true, isActive: true },
        { upsert: true, new: true }
      );

      await InterviewTestCase.deleteMany({ questionId: question._id });
      if (testCases && testCases.length > 0) {
        const testCaseDocs = testCases.map(tc => ({
          questionId: question._id,
          questionNumber: question.questionNumber,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          isHidden: tc.isHidden || false
        }));
        await InterviewTestCase.insertMany(testCaseDocs);
      }
    }

    console.log(`[DailySpecialSeeder] Successfully seeded ${DAILY_QUESTIONS.length} domain-specific Daily Special Questions.`);
  } catch (err) {
    console.error('[DailySpecialSeeder] Seeding error:', err);
  }
}

module.exports = { seedDailySpecialQuestions };
