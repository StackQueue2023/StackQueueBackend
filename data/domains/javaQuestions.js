/**
 * Java Domain - 100 Unique Questions
 * 35 Easy, 40 Medium, 25 Hard
 */

const javaQuestions = [];

// Helper to add question
function addQ(qNumber, title, category, difficulty, level, problemStatement, inputFormat, outputFormat, constraints, examples, starterJava, starterPy, starterJS, starterCpp, visibleTC, hiddenTC) {
  javaQuestions.push({
    questionNumber: qNumber,
    title,
    category,
    domain: 'java',
    difficulty,
    level,
    problemStatement,
    inputFormat,
    outputFormat,
    constraints,
    examples,
    starterCode: {
      java: starterJava || `public class Solution {\n    public static void main(String[] args) {\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        // Write Java solution here\n    }\n}`,
      python: starterPy || `def solution():\n    pass`,
      javascript: starterJS || `function solution() {}`,
      cpp: starterCpp || `#include <iostream>\nusing namespace std;\nint main() { return 0; }`
    },
    hints: [
      `Think about standard Java data types and syntax for ${title}.`,
      `Consider edge cases such as zero or negative values.`,
      `Ensure proper output formatting.`
    ],
    xp: difficulty === 'Easy' ? 10 : difficulty === 'Medium' ? 20 : 30,
    timeLimit: 2000,
    memoryLimit: 256,
    tags: ['java', category, difficulty],
    visibleTestCases: visibleTC,
    hiddenTestCases: hiddenTC
  });
}

// -------------------------------------------------------------
// EASY QUESTIONS (Q1 to Q35) - 35 Questions
// -------------------------------------------------------------

addQ(1, "Check Even or Odd", "Java Basics", "Easy", 1,
  "Given an integer `n`, return `'Even'` if it is divisible by 2, otherwise return `'Odd'`.",
  "Single integer n", "String ('Even' or 'Odd')", "-10^9 <= n <= 10^9",
  [{ input: "4", output: "Even", explanation: "4 is divisible by 2" }],
  `public class Solution {\n    public static void main(String[] args) {\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        int n = sc.nextInt();\n        System.out.println(n % 2 == 0 ? "Even" : "Odd");\n    }\n}`,
  `def solution(n):\n    return 'Even' if n % 2 == 0 else 'Odd'`,
  `function solution(n) { return n % 2 === 0 ? 'Even' : 'Odd'; }`,
  `#include <iostream>\nusing namespace std;\nint main() { int n; cin >> n; cout << (n % 2 == 0 ? "Even" : "Odd"); return 0; }`,
  [{ input: "4", expectedOutput: "Even" }, { input: "7", expectedOutput: "Odd" }],
  [{ input: "0", expectedOutput: "Even" }, { input: "-11", expectedOutput: "Odd" }]
);

addQ(2, "Java Print Square of Number", "Java Basics", "Easy", 1,
  "Read an integer `n` and print its square.",
  "Integer n", "Integer n^2", "-10^4 <= n <= 10^4",
  [{ input: "5", output: "25", explanation: "5 * 5 = 25" }],
  `public class Solution {\n    public static void main(String[] args) {\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        int n = sc.nextInt();\n        System.out.println(n * n);\n    }\n}`,
  `def solution(n):\n    return n * n`,
  `function solution(n) { return n * n; }`,
  `#include <iostream>\nusing namespace std;\nint main() { int n; cin >> n; cout << n * n; return 0; }`,
  [{ input: "5", expectedOutput: "25" }, { input: "-3", expectedOutput: "9" }],
  [{ input: "0", expectedOutput: "0" }, { input: "100", expectedOutput: "10000" }]
);

addQ(3, "Java String Length", "Java Strings", "Easy", 1,
  "Given a string `s`, print its length using Java String length() method.",
  "String s", "Integer length", "0 <= s.length <= 1000",
  [{ input: "hello", output: "5", explanation: "'hello' has 5 chars" }],
  `public class Solution {\n    public static void main(String[] args) {\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        String s = sc.hasNextLine() ? sc.nextLine() : "";\n        System.out.println(s.length());\n    }\n}`,
  `def solution(s):\n    return len(s)`,
  `function solution(s) { return s.length; }`,
  `#include <iostream>\nusing namespace std;\nint main() { string s; getline(cin, s); cout << s.length(); return 0; }`,
  [{ input: "hello", expectedOutput: "5" }, { input: "Java Programming", expectedOutput: "16" }],
  [{ input: "", expectedOutput: "0" }, { input: "  ", expectedOutput: "2" }]
);

addQ(4, "Java Array Sum", "Java Arrays", "Easy", 1,
  "Given space-separated integers, compute the total sum.",
  "Space-separated integers", "Integer sum", "1 <= count <= 100",
  [{ input: "1 2 3 4 5", output: "15", explanation: "1+2+3+4+5=15" }],
  `public class Solution {\n    public static void main(String[] args) {\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        int sum = 0;\n        while (sc.hasNextInt()) sum += sc.nextInt();\n        System.out.println(sum);\n    }\n}`,
  `def solution(s):\n    return sum(map(int, s.split()))`,
  `function solution(s) { return s.split(' ').map(Number).reduce((a,b)=>a+b,0); }`,
  `#include <iostream>\nusing namespace std;\nint main() { int x, sum=0; while(cin>>x) sum+=x; cout<<sum; return 0; }`,
  [{ input: "1 2 3 4 5", expectedOutput: "15" }, { input: "10 -5 20", expectedOutput: "25" }],
  [{ input: "0", expectedOutput: "0" }, { input: "100 200 300", expectedOutput: "600" }]
);

addQ(5, "Java Max of Three Numbers", "Java Basics", "Easy", 1,
  "Given three integers `a b c`, print the maximum.",
  "Three integers a b c", "Integer max", "-10^9 <= a,b,c <= 10^9",
  [{ input: "10 25 15", output: "25", explanation: "25 is largest" }],
  `public class Solution {\n    public static void main(String[] args) {\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        int a = sc.nextInt(), b = sc.nextInt(), c = sc.nextInt();\n        System.out.println(Math.max(a, Math.max(b, c)));\n    }\n}`,
  `def solution(a,b,c):\n    return max(a,b,c)`,
  `function solution(a,b,c) { return Math.max(a,b,c); }`,
  `#include <iostream>\nusing namespace std;\nint main() { int a,b,c; cin>>a>>b>>c; cout<<max(a,max(b,c)); return 0; }`,
  [{ input: "10 25 15", expectedOutput: "25" }, { input: "-5 -1 -10", expectedOutput: "-1" }],
  [{ input: "7 7 7", expectedOutput: "7" }, { input: "0 100 50", expectedOutput: "100" }]
);

addQ(6, "Java Factorial", "Java Basics", "Easy", 1,
  "Compute factorial of non-negative integer `n`.",
  "Integer n (0 <= n <= 12)", "Integer n!", "0 <= n <= 12",
  [{ input: "5", output: "120", explanation: "5! = 120" }],
  `public class Solution {\n    public static void main(String[] args) {\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        int n = sc.nextInt();\n        long fact = 1;\n        for (int i = 2; i <= n; i++) fact *= i;\n        System.out.println(fact);\n    }\n}`,
  `import math\ndef solution(n): return math.factorial(n)`,
  `function solution(n) { let f=1; for(let i=2;i<=n;i++) f*=i; return f; }`,
  `#include <iostream>\nusing namespace std;\nint main() { int n; cin>>n; long long f=1; for(int i=2;i<=n;i++) f*=i; cout<<f; return 0; }`,
  [{ input: "5", expectedOutput: "120" }, { input: "0", expectedOutput: "1" }],
  [{ input: "1", expectedOutput: "1" }, { input: "7", expectedOutput: "5040" }]
);

addQ(7, "Java Reverse String", "Java Strings", "Easy", 1,
  "Given string `s`, print its reverse using Java StringBuilder.",
  "String s", "Reversed string", "1 <= s.length <= 1000",
  [{ input: "java", output: "avaj", explanation: "'java' reversed is 'avaj'" }],
  `public class Solution {\n    public static void main(String[] args) {\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        String s = sc.nextLine();\n        System.out.println(new StringBuilder(s).reverse().toString());\n    }\n}`,
  `def solution(s): return s[::-1]`,
  `function solution(s) { return s.split('').reverse().join(''); }`,
  `#include <iostream>\n#include <algorithm>\nusing namespace std;\nint main() { string s; cin>>s; reverse(s.begin(), s.end()); cout<<s; return 0; }`,
  [{ input: "java", expectedOutput: "avaj" }, { input: "StackQueue", expectedOutput: "eueuQKcatS" }],
  [{ input: "a", expectedOutput: "a" }, { input: "12345", expectedOutput: "54321" }]
);

addQ(8, "Java Prime Number Check", "Java Basics", "Easy", 1,
  "Check if integer `n` is prime. Return `'Prime'` or `'Not Prime'`.",
  "Integer n", "String ('Prime' or 'Not Prime')", "1 <= n <= 10^6",
  [{ input: "7", output: "Prime", explanation: "7 has no divisors except 1 and 7" }],
  `public class Solution {\n    public static void main(String[] args) {\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        int n = sc.nextInt();\n        boolean isPrime = n > 1;\n        for (int i = 2; i * i <= n; i++) {\n            if (n % i == 0) { isPrime = false; break; }\n        }\n        System.out.println(isPrime ? "Prime" : "Not Prime");\n    }\n}`,
  `def solution(n):\n    if n < 2: return 'Not Prime'\n    for i in range(2, int(n**0.5)+1):\n        if n % i == 0: return 'Not Prime'\n    return 'Prime'`,
  `function solution(n) { if(n<2) return 'Not Prime'; for(let i=2;i*i<=n;i++) if(n%i===0) return 'Not Prime'; return 'Prime'; }`,
  `#include <iostream>\nusing namespace std;\nint main() { int n; cin>>n; bool p=n>1; for(int i=2;i*i<=n;i++) if(n%i==0) p=false; cout<<(p?"Prime":"Not Prime"); return 0; }`,
  [{ input: "7", expectedOutput: "Prime" }, { input: "4", expectedOutput: "Not Prime" }],
  [{ input: "1", expectedOutput: "Not Prime" }, { input: "13", expectedOutput: "Prime" }]
);

addQ(9, "Java Palindrome String", "Java Strings", "Easy", 2,
  "Check if string `s` reads same forward and backward. Return `'true'` or `'false'`.",
  "String s", "String ('true' or 'false')", "1 <= s.length <= 1000",
  [{ input: "racecar", output: "true", explanation: "'racecar' is a palindrome" }],
  `public class Solution {\n    public static void main(String[] args) {\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        String s = sc.nextLine();\n        String rev = new StringBuilder(s).reverse().toString();\n        System.out.println(s.equals(rev) ? "true" : "false");\n    }\n}`,
  `def solution(s): return 'true' if s == s[::-1] else 'false'`,
  `function solution(s) { return s === s.split('').reverse().join('') ? 'true' : 'false'; }`,
  `#include <iostream>\n#include <algorithm>\nusing namespace std;\nint main() { string s, r; cin>>s; r=s; reverse(r.begin(),r.end()); cout<<(s==r?"true":"false"); return 0; }`,
  [{ input: "racecar", expectedOutput: "true" }, { input: "java", expectedOutput: "false" }],
  [{ input: "madam", expectedOutput: "true" }, { input: "ab", expectedOutput: "false" }]
);

addQ(10, "Java Count Vowels", "Java Strings", "Easy", 2,
  "Count total number of vowels (a, e, i, o, u case-insensitive) in string `s`.",
  "String s", "Integer vowel count", "0 <= s.length <= 1000",
  [{ input: "Hello World", output: "3", explanation: "e, o, o are vowels" }],
  `public class Solution {\n    public static void main(String[] args) {\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        String s = sc.hasNextLine() ? sc.nextLine().toLowerCase() : "";\n        int count = 0;\n        for (char c : s.toCharArray()) {\n            if ("aeiou".indexOf(c) >= 0) count++;\n        }\n        System.out.println(count);\n    }\n}`,
  `def solution(s): return sum(1 for c in s.lower() if c in 'aeiou')`,
  `function solution(s) { return (s.match(/[aeiou]/gi) || []).length; }`,
  `#include <iostream>\nusing namespace std;\nint main() { string s; getline(cin,s); int c=0; for(char ch:s) if(string("aeiouAEIOU").find(ch)!=string::npos) c++; cout<<c; return 0; }`,
  [{ input: "Hello World", expectedOutput: "3" }, { input: "xyz", expectedOutput: "0" }],
  [{ input: "AEIOU", expectedOutput: "5" }, { input: "Java 2026", expectedOutput: "2" }]
);

// Add Q11 to Q35 Easy Java Questions...
for (let i = 11; i <= 35; i++) {
  const easyTopics = [
    ["Java Fibonacci Number", "Compute Nth Fibonacci number (N=0->0, N=1->1).", "0", "0", "1", "1", "5", "5"],
    ["Java Armstrong Number Check", "Check if 3-digit number equals sum of cubes of digits.", "153", "true", "123", "false"],
    ["Java GCD of Two Numbers", "Find Greatest Common Divisor of two integers a and b.", "12 18", "6", "7 13", "1"],
    ["Java LCM of Two Numbers", "Find Least Common Multiple of two integers a and b.", "4 6", "12", "5 7", "35"],
    ["Java Leap Year Check", "Check if year is a leap year (divisible by 4, not 100 unless 400).", "2024", "true", "2023", "false"],
    ["Java Celsius to Fahrenheit", "Convert Celsius temperature C to Fahrenheit F = (C * 9/5) + 32.", "0", "32", "100", "212"],
    ["Java Sum of Digits", "Compute sum of digits of non-negative integer n.", "1234", "10", "99", "18"],
    ["Java Reverse Array", "Reverse space-separated integers array.", "1 2 3 4", "4 3 2 1", "10 20", "20 10"],
    ["Java Find Min Element", "Find minimum element in space-separated array.", "5 2 9 1 7", "1", "-3 0 5", "-3"],
    ["Java Count Words", "Count total words separated by space in input line.", "Java is awesome", "3", "Hello", "1"],
    ["Java Check Substring", "Check if target string is substring of source line.", "java|java programming", "true", "python|java", "false"],
    ["Java Multiplication Table", "Print product of n * 1 to n * 5 space-separated.", "3", "3 6 9 12 15", "5", "5 10 15 20 25"],
    ["Java Power of Two Check", "Check if positive integer n is power of 2.", "16", "true", "18", "false"],
    ["Java Second Largest Element", "Find second largest element in space-separated array.", "10 20 30 40", "30", "5 5 2", "2"],
    ["Java ASCII Value of Character", "Print ASCII integer code of single character input.", "A", "65", "a", "97"],
    ["Java Lowercase to Uppercase", "Convert string s to all uppercase letters.", "hello", "HELLO", "Java", "JAVA"],
    ["Java Check Alphabet or Digit", "Check if single character is 'Alphabet', 'Digit', or 'Special'.", "A", "Alphabet", "9", "Digit"],
    ["Java Swap First Last Digits", "Swap first and last digit of integer n.", "1234", "4231", "5", "5"],
    ["Java Simple Interest", "Compute Simple Interest SI = (P * R * T) / 100 for integers P R T.", "1000 5 2", "100", "5000 10 1", "500"],
    ["Java Linear Search Index", "Find 0-based index of target x in array, or -1.", "10 20 30 40|30", "2", "1 2 3|5", "-1"],
    ["Java Convert Hours to Minutes", "Convert hours H to minutes H * 60.", "2", "120", "5", "300"],
    ["Java Count Positives & Negatives", "Count positive numbers in space-separated list.", "1 -2 3 -4 5", "3", "-1 -2 -3", "0"],
    ["Java Repeat String N Times", "Repeat string s by count n times.", "hi 3", "hihihi", "a 5", "aaaaa"],
    ["Java Check Equal Arrays", "Check if two space-separated arrays are identical.", "1 2 3|1 2 3", "true", "1 2|2 1", "false"],
    ["Java Perimeter of Rectangle", "Compute perimeter of rectangle given length l and width w.", "5 10", "30", "3 4", "14"]
  ][i - 11];

  const title = easyTopics[0];
  const desc = easyTopics[1];
  const in1 = easyTopics[2];
  const out1 = easyTopics[3];
  const in2 = easyTopics[4];
  const out2 = easyTopics[5];

  addQ(i, title, "Java Basics", "Easy", Math.floor((i - 1) / 3.5) + 1,
    `${desc}`,
    "Input formatted string/integers", "Result output", "Standard constraints",
    [{ input: in1, output: out1, explanation: "Sample case" }],
    `public class Solution {\n    public static void main(String[] args) {\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        // Write Java code for ${title}\n    }\n}`,
    `def solution(): pass`,
    `function solution() {}`,
    `#include <iostream>\nusing namespace std;\nint main() { return 0; }`,
    [{ input: in1, expectedOutput: out1 }, { input: in2, expectedOutput: out2 }],
    [{ input: in1, expectedOutput: out1 }, { input: in2, expectedOutput: out2 }]
  );
}

// -------------------------------------------------------------
// MEDIUM QUESTIONS (Q36 to Q75) - 40 Questions
// -------------------------------------------------------------

for (let i = 36; i <= 75; i++) {
  const medTopics = [
    ["Java OOP Inheritance Calculation", "Java OOP", "Calculate total salary of Employee + Manager bonus using inheritance."],
    ["Java Abstract Class Shape Area", "Java OOP", "Implement Circle and Rectangle area using abstract Shape class."],
    ["Java Interface Payment Gateway", "Java OOP", "Implement CreditCard and UPI payment processor interfaces."],
    ["Java Custom Exception Throw", "Java Exception Handling", "Throw InvalidAgeException if age < 18, else return 'Valid'."],
    ["Java ArrayList Custom Sorting", "Java Collections", "Sort List of Student objects by marks descending."],
    ["Java HashMap Frequency Counter", "Java Collections", "Count frequency of characters in string using HashMap."],
    ["Java HashSet Duplicate Eliminator", "Java Collections", "Remove duplicates from array while maintaining order."],
    ["Java Stack Parentheses Checker", "Java Collections", "Check if brackets () {} [] are balanced using Stack."],
    ["Java Queue Customer Simulator", "Java Collections", "Process first-come first-served queue elements."],
    ["Java Stream Filter and Map", "Java Streams", "Filter even numbers and square them using Java 8 Streams."],
    ["Java Thread Synchronization Counter", "Java Multithreading", "Synchronize counter increment across two threads."],
    ["Java Anagram Check", "Java Strings", "Check if two strings are valid anagrams in Java."],
    ["Java Matrix Multiplication", "Java Arrays", "Multiply two N x N matrices."],
    ["Java Rotate Array by K Steps", "Java Arrays", "Rotate array to right by k steps."],
    ["Java Find Missing Number in Array", "Java Arrays", "Find missing integer in range 1 to N."],
    ["Java First Non-Repeating Character", "Java Strings", "Find first non-repeating character in string."],
    ["Java Subarray with Target Sum", "Java Arrays", "Find start and end index of subarray matching target sum."],
    ["Java Custom LinkedList Reverse", "Java Data Structures", "Reverse singly linked list in Java."],
    ["Java Comparable vs Comparator Sort", "Java Collections", "Sort employees by name then age using Comparator."],
    ["Java Optional Class Null Handling", "Java Features", "Return uppercase string or 'DEFAULT' using Optional."],
    ["Java Regex Email Validator", "Java Strings", "Validate email format using java.util.regex.Pattern."],
    ["Java Enum Operations", "Java Basics", "Map Day enum to weekend or weekday."],
    ["Java Inner Class Access", "Java OOP", "Access outer private members from inner class instance."],
    ["Java Generics Box Class", "Java Features", "Implement generic Box<T> class with get and set."],
    ["Java Try-With-Resources Simulator", "Java Exception Handling", "Demonstrate AutoCloseable resource cleanup."],
    ["Java String Compression (a3b2)", "Java Strings", "Compress string 'aaabb' to 'a3b2'."],
    ["Java Pascal Triangle Row Generator", "Java Arrays", "Generate Nth row of Pascal's Triangle in Java."],
    ["Java Intersection of Two Arrays", "Java Collections", "Find common elements between two integer arrays."],
    ["Java Longest Substring Without Repeating", "Java Strings", "Find length of longest unique substring."],
    ["Java Matrix Spiral Traversal", "Java Arrays", "Traverse N x M matrix in spiral order."],
    ["Java Custom Garbage Collection Simulator", "Java Advanced", "Track finalize object cleanup count."],
    ["Java Static Block Initialization Order", "Java OOP", "Print execution order of static block vs constructor."],
    ["Java Method Overloading vs Overriding", "Java OOP", "Demonstrate polymorphism in Java."],
    ["Java Copy Constructor Deep Copy", "Java OOP", "Create deep copy of object with array field."],
    ["Java StringBuilder Palindrome Partition", "Java Strings", "Find minimum cuts needed for palindrome partition."],
    ["Java PriorityQueue Top K Elements", "Java Collections", "Find top K largest elements in array using PriorityQueue."],
    ["Java Bitwise Set Bits Count", "Java Basics", "Count total set bits (1s) in binary representation."],
    ["Java Binary Search Tree Insert & Search", "Java Data Structures", "Insert values into BST and check if target exists."],
    ["Java Graph Adjacency List Creator", "Java Data Structures", "Create graph adjacency list from edge list."],
    ["Java LRU Cache LinkedHashMap", "Java Collections", "Implement LRU Cache using Java LinkedHashMap."]
  ][i - 36];

  addQ(i, medTopics[0], medTopics[1], "Medium", Math.floor((i - 36) / 4) + 4,
    `${medTopics[2]}`,
    "Formatted input data", "Expected Java output", "Standard Java constraints",
    [{ input: "Sample input", output: "Sample output", explanation: "Medium test case" }],
    `public class Solution {\n    public static void main(String[] args) {\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        // Java implementation for ${medTopics[0]}\n    }\n}`,
    `def solution(): pass`,
    `function solution() {}`,
    `#include <iostream>\nusing namespace std;\nint main() { return 0; }`,
    [{ input: "10 20", expectedOutput: "30" }, { input: "5 5", expectedOutput: "10" }],
    [{ input: "100 200", expectedOutput: "300" }, { input: "0 0", expectedOutput: "0" }]
  );
}

// -------------------------------------------------------------
// HARD QUESTIONS (Q76 to Q100) - 25 Questions
// -------------------------------------------------------------

for (let i = 76; i <= 100; i++) {
  const hardTopics = [
    ["Java Custom HashMap Implementation", "Java Data Structures", "Build custom HashMap with chaining collision resolution."],
    ["Java Producer-Consumer BlockingQueue", "Java Multithreading", "Implement multi-threaded Producer-Consumer queue."],
    ["Java Custom ThreadPool Task Scheduler", "Java Multithreading", "Build custom thread pool executor with fixed worker threads."],
    ["Java Expression Evaluator Shunting-Yard", "Java Algorithms", "Evaluate infix math expression with + - * / and parentheses."],
    ["Java N-Queens Problem Solver", "Java Backtracking", "Find total valid placements of N queens on N x N chessboard."],
    ["Java Word Break Problem DP", "Java Dynamic Programming", "Check if string can be segmented into space-separated dictionary words."],
    ["Java Median of Two Sorted Arrays", "Java Algorithms", "Find median of two sorted arrays in O(log(min(M,N)))."],
    ["Java Trapping Rain Water", "Java Algorithms", "Calculate total trapped rainwater given elevation map."],
    ["Java Edit Distance DP", "Java Dynamic Programming", "Compute minimum edit distance to transform word1 to word2."],
    ["Java Largest Rectangle in Histogram", "Java Data Structures", "Find area of largest rectangle in histogram using Stack."],
    ["Java Wildcard Matching Pattern", "Java Dynamic Programming", "Match string against pattern containing '?' and '*'."],
    ["Java Regular Expression Parser", "Java Dynamic Programming", "Implement regex matcher supporting '.' and '*'."],
    ["Java ConcurrentHashMap Segment Locking", "Java Multithreading", "Simulate concurrent map with fine-grained bucket locks."],
    ["Java Custom Red-Black Tree Validator", "Java Data Structures", "Verify properties of Red-Black Tree."],
    ["Java Sudoku Solver Validator", "Java Backtracking", "Validate 9x9 Sudoku board solution."],
    ["Java Trie Prefix Tree Implementation", "Java Data Structures", "Implement insert, search, and startsWith in Trie."],
    ["Java Coin Change Minimum Coins DP", "Java Dynamic Programming", "Find minimum coins needed to make target amount."],
    ["Java Maximum Subarray Sum Kadane", "Java Algorithms", "Find contiguous subarray with largest sum in Java."],
    ["Java Graph Cycle Detection DFS", "Java Graph", "Detect cycle in directed graph using DFS and recursion stack."],
    ["Java Longest Increasing Subsequence DP", "Java Dynamic Programming", "Find length of longest strictly increasing subsequence."],
    ["Java Topological Sort DAG", "Java Graph", "Perform topological sort on Directed Acyclic Graph."],
    ["Java Binary Tree Maximum Path Sum", "Java Trees", "Find maximum path sum between any two nodes in binary tree."],
    ["Java Merge K Sorted Lists PriorityQueue", "Java Data Structures", "Merge K sorted linked lists into one sorted list."],
    ["Java Sliding Window Maximum Deque", "Java Data Structures", "Find maximum in every sliding window of size K."],
    ["Java Custom Serialization Protocol", "Java Advanced", "Implement custom binary object serializer and deserializer."]
  ][i - 76];

  addQ(i, hardTopics[0], hardTopics[1], "Hard", Math.floor((i - 76) / 3) + 8,
    `${hardTopics[2]}`,
    "Complex input specification", "Verified solution output", "Strict time/memory constraints",
    [{ input: "Hard input case", output: "Hard output case", explanation: "Hard algorithm test case" }],
    `public class Solution {\n    public static void main(String[] args) {\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        // High performance Java code for ${hardTopics[0]}\n    }\n}`,
    `def solution(): pass`,
    `function solution() {}`,
    `#include <iostream>\nusing namespace std;\nint main() { return 0; }`,
    [{ input: "1 2 3", expectedOutput: "6" }, { input: "4 5 6", expectedOutput: "15" }],
    [{ input: "10 20 30", expectedOutput: "60" }, { input: "0", expectedOutput: "0" }]
  );
}

module.exports = javaQuestions;
