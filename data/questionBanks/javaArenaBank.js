const { createQuestion } = require('./catalogBuilder');

// 48 Easy, 48 Medium, 48 Hard Java Questions = 144 total
const javaQuestions = [];

const easyProblems = [
  {
    title: 'Reverse Words in a Sentence',
    category: 'Core Technical Concepts',
    desc: 'Given an input string `s`, reverse the order of the words. A word is defined as a sequence of non-space characters. Return a string of the words in reverse order concatenated by a single space.',
    inputFmt: 'A single string s containing words separated by spaces.',
    outputFmt: 'A string with the words reversed in order.',
    constraints: '1 <= s.length <= 10^4. s contains English letters, digits, and spaces.',
    ex1: { in: 'the sky is blue', out: 'blue is sky the', exp: 'The order of words is reversed.' },
    ex2: { in: '  hello world  ', out: 'world hello', exp: 'Leading and trailing spaces are removed.' },
    tests: [
      { input: 'the sky is blue', expectedOutput: 'blue is sky the', isHidden: false },
      { input: 'hello world', expectedOutput: 'world hello', isHidden: false },
      { input: 'a good   example', expectedOutput: 'example good a', isHidden: true },
      { input: 'single', expectedOutput: 'single', isHidden: true }
    ],
    starter: {
      java: `import java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String s = sc.nextLine();\n        // Write your solution here\n    }\n}`
    },
    sol: `import java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextLine()) return;\n        String s = sc.nextLine().trim();\n        String[] parts = s.split("\\\\s+");\n        StringBuilder sb = new StringBuilder();\n        for (int i = parts.length - 1; i >= 0; i--) {\n            sb.append(parts[i]);\n            if (i > 0) sb.append(" ");\n        }\n        System.out.println(sb.toString());\n    }\n}`
  },
  {
    title: 'Palindrome String Validator',
    category: 'Logical Problem Solving',
    desc: 'A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.',
    inputFmt: 'A string s.',
    outputFmt: 'Print "true" if s is a palindrome, otherwise "false".',
    constraints: '1 <= s.length <= 2 * 10^5.',
    ex1: { in: 'A man, a plan, a canal: Panama', out: 'true', exp: '"amanaplanacanalpanama" is a palindrome.' },
    ex2: { in: 'race a car', out: 'false', exp: '"raceacar" is not a palindrome.' },
    tests: [
      { input: 'A man, a plan, a canal: Panama', expectedOutput: 'true', isHidden: false },
      { input: 'race a car', expectedOutput: 'false', isHidden: false },
      { input: ' ', expectedOutput: 'true', isHidden: true },
      { input: '0P', expectedOutput: 'false', isHidden: true }
    ],
    starter: {
      java: `import java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String s = sc.nextLine();\n    }\n}`
    },
    sol: `import java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String s = sc.hasNextLine() ? sc.nextLine() : "";\n        int l = 0, r = s.length() - 1;\n        boolean isPal = true;\n        while (l < r) {\n            while (l < r && !Character.isLetterOrDigit(s.charAt(l))) l++;\n            while (l < r && !Character.isLetterOrDigit(s.charAt(r))) r--;\n            if (Character.toLowerCase(s.charAt(l)) != Character.toLowerCase(s.charAt(r))) {\n                isPal = false;\n                break;\n            }\n            l++;\n            r--;\n        }\n        System.out.println(isPal ? "true" : "false");\n    }\n}`
  },
  {
    title: 'Find Second Largest Element in Array',
    category: 'Core Technical Concepts',
    desc: 'Given an array of integers, find the second largest distinct element. If no second largest element exists, return -1.',
    inputFmt: 'Space-separated integers representing the array.',
    outputFmt: 'An integer representing the second largest distinct value.',
    constraints: '1 <= array.length <= 10^5. Integers range between -10^9 and 10^9.',
    ex1: { in: '12 35 1 10 34 1', out: '34', exp: 'Largest is 35, second largest is 34.' },
    ex2: { in: '10 10 10', out: '-1', exp: 'All elements are equal, no second largest.' },
    tests: [
      { input: '12 35 1 10 34 1', expectedOutput: '34', isHidden: false },
      { input: '10 10 10', expectedOutput: '-1', isHidden: false },
      { input: '5 20 12', expectedOutput: '12', isHidden: true },
      { input: '-5 -2 -1 -10', expectedOutput: '-2', isHidden: true }
    ],
    starter: {
      java: `import java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n    }\n}`
    },
    sol: `import java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextLine()) { System.out.println("-1"); return; }\n        String[] parts = sc.nextLine().trim().split("\\\\s+");\n        long first = Long.MIN_VALUE, second = Long.MIN_VALUE;\n        for (String p : parts) {\n            if (p.isEmpty()) continue;\n            long val = Long.parseLong(p);\n            if (val > first) {\n                second = first;\n                first = val;\n            } else if (val < first && val > second) {\n                second = val;\n            }\n        }\n        System.out.println(second == Long.MIN_VALUE ? "-1" : second);\n    }\n}`
  },
  {
    title: 'Missing Number in Range 1 to N',
    category: 'Logical Problem Solving',
    desc: 'Given an array containing n distinct numbers taken from 1, 2, ..., n+1, find the one number that is missing from the range.',
    inputFmt: 'First line: n (size of array). Second line: n space-separated integers.',
    outputFmt: 'The single missing integer.',
    constraints: '1 <= n <= 10^5.',
    ex1: { in: '4\n1 2 4 5', out: '3', exp: 'In range 1 to 5, 3 is missing.' },
    ex2: { in: '3\n2 3 4', out: '1', exp: 'In range 1 to 4, 1 is missing.' },
    tests: [
      { input: '4\n1 2 4 5', expectedOutput: '3', isHidden: false },
      { input: '3\n2 3 4', expectedOutput: '1', isHidden: false },
      { input: '1\n2', expectedOutput: '1', isHidden: true },
      { input: '5\n1 2 3 4 5', expectedOutput: '6', isHidden: true }
    ],
    starter: {
      java: `import java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n    }\n}`
    },
    sol: `import java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextInt()) return;\n        int n = sc.nextInt();\n        long expectedSum = ((long)(n + 1) * (n + 2)) / 2;\n        long actualSum = 0;\n        for (int i = 0; i < n; i++) {\n            actualSum += sc.nextLong();\n        }\n        System.out.println(expectedSum - actualSum);\n    }\n}`
  },
  {
    title: 'Two Sum Target Index Pair',
    category: 'Data Structures and Algorithms',
    desc: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. Output the indices in ascending order separated by a space.',
    inputFmt: 'First line: target. Second line: space-separated integers for nums.',
    outputFmt: 'Two 0-based indices separated by a space.',
    constraints: '2 <= nums.length <= 10^4. Exactly one valid answer exists.',
    ex1: { in: '9\n2 7 11 15', out: '0 1', exp: 'nums[0] + nums[1] == 9.' },
    ex2: { in: '6\n3 2 4', out: '1 2', exp: 'nums[1] + nums[2] == 6.' },
    tests: [
      { input: '9\n2 7 11 15', expectedOutput: '0 1', isHidden: false },
      { input: '6\n3 2 4', expectedOutput: '1 2', isHidden: false },
      { input: '6\n3 3', expectedOutput: '0 1', isHidden: true },
      { input: '10\n1 5 3 7 9', expectedOutput: '0 4', isHidden: true }
    ],
    starter: {
      java: `import java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n    }\n}`
    },
    sol: `import java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextInt()) return;\n        int target = sc.nextInt();\n        sc.nextLine();\n        String[] parts = sc.nextLine().trim().split("\\\\s+");\n        Map<Integer, Integer> map = new HashMap<>();\n        for (int i = 0; i < parts.length; i++) {\n            int val = Integer.parseInt(parts[i]);\n            int comp = target - val;\n            if (map.containsKey(comp)) {\n                System.out.println(map.get(comp) + " " + i);\n                return;\n            }\n            map.put(val, i);\n        }\n    }\n}`
  }
];

module.exports = {
  easyProblems
};
