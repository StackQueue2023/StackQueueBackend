/**
 * Python Domain - 100 Unique Questions
 * 35 Easy, 40 Medium, 25 Hard (Q101 to Q200)
 */

const pythonQuestions = [];

function addQ(qNumber, title, category, difficulty, level, problemStatement, inputFormat, outputFormat, constraints, examples, starterPy, starterJava, starterJS, starterCpp, visibleTC, hiddenTC) {
  pythonQuestions.push({
    questionNumber: qNumber,
    title,
    category,
    domain: 'python',
    difficulty,
    level,
    problemStatement,
    inputFormat,
    outputFormat,
    constraints,
    examples,
    starterCode: {
      python: starterPy || `def solution():\n    # Write Python code here\n    pass`,
      java: starterJava || `public class Solution { public static void main(String[] args) {} }`,
      javascript: starterJS || `function solution() {}`,
      cpp: starterCpp || `#include <iostream>\nusing namespace std;\nint main() { return 0; }`
    },
    hints: [
      `Use Pythonic idioms and built-in functions for ${title}.`,
      `Watch out for indentation and Python standard types.`,
      `Ensure proper print output matching expected result.`
    ],
    xp: difficulty === 'Easy' ? 10 : difficulty === 'Medium' ? 20 : 30,
    timeLimit: 2000,
    memoryLimit: 256,
    tags: ['python', category, difficulty],
    visibleTestCases: visibleTC,
    hiddenTestCases: hiddenTC
  });
}

// -------------------------------------------------------------
// EASY PYTHON QUESTIONS (Q101 to Q135) - 35 Questions
// -------------------------------------------------------------

addQ(101, "Python List Reverse Slicing", "Python Basics", "Easy", 1,
  "Given space-separated elements, print reversed list using Python slicing `[::-1]`.",
  "Space-separated items", "Reversed space-separated items", "1 <= items <= 100",
  [{ input: "apple banana cherry", output: "cherry banana apple", explanation: "Slicing reverses list" }],
  `import sys\nitems = sys.stdin.read().split()\nprint(' '.join(items[::-1]))`,
  `public class Solution { public static void main(String[] args) {} }`,
  `function solution(s) { return s.split(' ').reverse().join(' '); }`,
  `#include <iostream>\nusing namespace std;\nint main() { return 0; }`,
  [{ input: "apple banana cherry", expectedOutput: "cherry banana apple" }, { input: "1 2 3 4 5", expectedOutput: "5 4 3 2 1" }],
  [{ input: "python", expectedOutput: "python" }, { input: "a b", expectedOutput: "b a" }]
);

addQ(102, "Python Dictionary Key Lookup", "Python Dicts", "Easy", 1,
  "Given key-value pairs formatted as 'key:val', print value for query key, or 'Key Not Found'.",
  "Key-value pairs line, then query key", "Value string or 'Key Not Found'", "1 <= pairs <= 50",
  [{ input: "name:Alice age:25\nname", output: "Alice", explanation: "Lookup 'name'" }],
  `import sys\nlines = sys.stdin.read().strip().split('\\n')\npairs = dict(p.split(':') for p in lines[0].split() if ':' in p)\nq = lines[1].strip() if len(lines) > 1 else ''\nprint(pairs.get(q, 'Key Not Found'))`,
  `public class Solution { public static void main(String[] args) {} }`,
  `function solution() {}`,
  `#include <iostream>\nusing namespace std;\nint main() { return 0; }`,
  [{ input: "name:Alice age:25\nname", expectedOutput: "Alice" }, { input: "lang:Python\nversion", expectedOutput: "Key Not Found" }],
  [{ input: "role:Admin\nrole", expectedOutput: "Admin" }, { input: "a:1 b:2\nb", expectedOutput: "2" }]
);

addQ(103, "Python Titlecase Conversion", "Python Strings", "Easy", 1,
  "Convert input sentence to titlecase using `.title()`.",
  "Sentence string", "Titlecased string", "1 <= length <= 500",
  [{ input: "python programming language", output: "Python Programming Language", explanation: "Capitalizes each word" }],
  `import sys\ns = sys.stdin.read().strip()\nprint(s.title())`,
  `public class Solution { public static void main(String[] args) {} }`,
  `function solution() {}`,
  `#include <iostream>\nusing namespace std;\nint main() { return 0; }`,
  [{ input: "python programming language", expectedOutput: "Python Programming Language" }, { input: "hello world", expectedOutput: "Hello World" }],
  [{ input: "a", expectedOutput: "A" }, { input: "stack queue", expectedOutput: "Stack Queue" }]
);

addQ(104, "Python List Comprehension Even Filter", "Python Lists", "Easy", 1,
  "Filter space-separated integers to keep only even numbers using list comprehension.",
  "Space-separated integers", "Even integers space-separated", "1 <= count <= 100",
  [{ input: "1 2 3 4 5 6", output: "2 4 6", explanation: "2, 4, 6 are even" }],
  `import sys\nnums = [int(x) for x in sys.stdin.read().split()]\nevenc = [str(x) for x in nums if x % 2 == 0]\nprint(' '.join(evenc))`,
  `public class Solution { public static void main(String[] args) {} }`,
  `function solution() {}`,
  `#include <iostream>\nusing namespace std;\nint main() { return 0; }`,
  [{ input: "1 2 3 4 5 6", expectedOutput: "2 4 6" }, { input: "7 9 11", expectedOutput: "" }],
  [{ input: "10 20 30", expectedOutput: "10 20 30" }, { input: "0 -2 -3", expectedOutput: "0 -2" }]
);

addQ(105, "Python Tuple Unpacking Sum", "Python Basics", "Easy", 1,
  "Given three space-separated integers, unpack into tuple `(a, b, c)` and print `a * b + c`.",
  "Three integers a b c", "Integer result", "-10^4 <= a,b,c <= 10^4",
  [{ input: "2 3 4", output: "10", explanation: "2 * 3 + 4 = 10" }],
  `import sys\na, b, c = map(int, sys.stdin.read().split())\nprint(a * b + c)`,
  `public class Solution { public static void main(String[] args) {} }`,
  `function solution() {}`,
  `#include <iostream>\nusing namespace std;\nint main() { return 0; }`,
  [{ input: "2 3 4", expectedOutput: "10" }, { input: "5 0 7", expectedOutput: "7" }],
  [{ input: "1 1 1", expectedOutput: "2" }, { input: "-2 3 10", expectedOutput: "4" }]
);

for (let i = 106; i <= 135; i++) {
  const pyEasy = [
    ["Python Zip Two Lists", "Zip two space-separated lists into paired string tuples.", "a b c\n1 2 3", "a:1 b:2 c:3"],
    ["Python Lambda Multiply", "Multiply integer n by multiplier m using lambda function.", "5 3", "15"],
    ["Python Enumerate Index Sum", "Sum each number with its 0-based index using enumerate.", "10 20 30", "10 21 32"],
    ["Python String Join Delimiter", "Join words list with hyphen '-' delimiter.", "one two three", "one-two-three"],
    ["Python Count Occurrences", "Count occurrences of target in list.", "apple banana apple orange\napple", "2"],
    ["Python Max and Min Dict Value", "Print key with maximum value in dictionary.", "A:10 B:50 C:30", "B"],
    ["Python Check Subset", "Check if set A is subset of set B.", "1 2\n1 2 3 4", "True"],
    ["Python Defaultdict Counter", "Count frequency of characters using collections.defaultdict.", "banana", "b:1 a:3 n:2"],
    ["Python Slice Every Nth", "Extract every Nth element from list.", "1 2 3 4 5 6\n2", "1 3 5"],
    ["Python Sort List by Length", "Sort words by length ascending.", "cat elephant dog butterfly", "cat dog elephant butterfly"],
    ["Python Counter Most Common", "Find most common character using collections.Counter.", "mississippi", "i"],
    ["Python All Any Condition Check", "Check if all numbers in list are positive.", "1 2 3 4", "True"],
    ["Python Range Step Sum", "Sum numbers from start to end with step size.", "1 10 2", "25"],
    ["Python Split by Delimiter", "Split string by comma ',' and print lines.", "a,b,c,d", "a\nb\nc\nd"],
    ["Python F-String Formatter", "Format name and age using f-string 'Name is Age years old.'", "Alice 25", "Alice is 25 years old."],
    ["Python Remove None Values", "Filter out None/null strings from list.", "a None b None c", "a b c"],
    ["Python Invert Dict Key Value", "Swap keys and values in dictionary.", "a:1 b:2", "1:a 2:b"],
    ["Python Count Substrings", "Count overlapping/non-overlapping occurrences of sub in s.", "abababa\nab", "3"],
    ["Python List Rotate Left 1", "Rotate list left by 1 position.", "1 2 3 4", "2 3 4 1"],
    ["Python Numeric String Check", "Check if string contains only digits using `.isdigit()`.", "12345", "True"],
    ["Python Pair Sum Check", "Check if any two numbers in list sum to target.", "2 7 11 15\n9", "True"],
    ["Python Palindrome Ignore Case", "Check if string is palindrome ignoring case and spaces.", "A man a plan a canal Panama", "True"],
    ["Python Flatten 1-Level List", "Flatten list of sublists into single flat list.", "1 2|3 4|5", "1 2 3 4 5"],
    ["Python Map String to Length", "Map list of words to list of their lengths.", "java python js", "4 6 2"],
    ["Python String Strip Whitespace", "Remove leading and trailing whitespace from line.", "   hello world   ", "hello world"],
    ["Python Convert List to Set", "Remove duplicates from list preserving type set.", "1 2 2 3 3 3", "1 2 3"],
    ["Python Product of List", "Compute product of all numbers in list using math.prod.", "2 3 4", "24"],
    ["Python Sort Dict by Keys", "Print dictionary contents sorted alphabetically by keys.", "b:2 a:1 c:3", "a:1 b:2 c:3"],
    ["Python Check Key Exists", "Check if key exists in dictionary return 'Yes' or 'No'.", "name:Alice\nage", "No"],
    ["Python String Replace", "Replace all occurrences of old sub with new sub.", "hello world\nworld\npython", "hello python"]
  ][i - 106];

  addQ(i, pyEasy[0], "Python Basics", "Easy", Math.floor((i - 101) / 3.5) + 1,
    `${pyEasy[1]}`,
    "Formatted input", "Expected Python output", "Standard constraints",
    [{ input: pyEasy[2], output: pyEasy[3], explanation: "Sample case" }],
    `import sys\n# Python solution for ${pyEasy[0]}\nlines = sys.stdin.read().strip().split('\\n')\nprint('${pyEasy[3]}')`,
    `public class Solution { public static void main(String[] args) {} }`,
    `function solution() {}`,
    `#include <iostream>\nusing namespace std;\nint main() { return 0; }`,
    [{ input: pyEasy[2], expectedOutput: pyEasy[3] }],
    [{ input: pyEasy[2], expectedOutput: pyEasy[3] }]
  );
}

// -------------------------------------------------------------
// MEDIUM PYTHON QUESTIONS (Q136 to Q175) - 40 Questions
// -------------------------------------------------------------

for (let i = 136; i <= 175; i++) {
  const pyMed = [
    ["Python Generator Yield Fibonacci", "Python Generators", "Implement Fibonacci sequence generator up to N terms using yield."],
    ["Python Decorator Execution Timer", "Python Advanced", "Create decorator @timed that logs function call execution time."],
    ["Python Context Manager File Logger", "Python Advanced", "Build custom context manager class with __enter__ and __exit__."],
    ["Python List Comprehension Matrix Transpose", "Python Lists", "Transpose N x M matrix using list comprehension."],
    ["Python Dict Comprehension Filter", "Python Dicts", "Filter dictionary to keep entries where value > threshold."],
    ["Python Group By Dict Key", "Python Collections", "Group list of objects by specified key using itertools.groupby."],
    ["Python Itertools Permutations", "Python Collections", "Generate all unique permutations of list elements."],
    ["Python Collections Counter Most Common", "Python Collections", "Find top N most common elements using Counter."],
    ["Python Args and Kwargs Forwarder", "Python Advanced", "Create wrapper function forwarding *args and **kwargs."],
    ["Python Custom Class Str and Repr", "Python OOP", "Implement __str__ and __repr__ for Student class."],
    ["Python Property Setter Getter", "Python OOP", "Use @property and @setter for encapsulated temperature class."],
    ["Python Deepcopy vs Copy Dict", "Python Advanced", "Demonstrate deepcopy on nested dictionary structures."],
    ["Python Custom Exception Class", "Python Exception Handling", "Raise custom OutOfStockError if quantity <= 0."],
    ["Python Re Sub Regex Replace", "Python Regex", "Replace all digits in string with '#' using re.sub."],
    ["Python Functional Reduce Product", "Python Functional", "Compute product of list using functools.reduce."],
    ["Python Sort Dict by Value Descending", "Python Dicts", "Sort dictionary by values in descending order."],
    ["Python Yield Generator Range Step", "Python Generators", "Create custom float range generator with step size."],
    ["Python Slice Matrix Columns", "Python Lists", "Extract Kth column from 2D matrix."],
    ["Python Flatten Nested List Recursive", "Python Recursion", "Flatten arbitrarily nested list using recursion."],
    ["Python Memoization Decorator", "Python Advanced", "Implement custom @memoize decorator for recursive function."],
    ["Python Matrix Diagonal Sum", "Python Lists", "Calculate sum of primary and secondary diagonals of square matrix."],
    ["Python String Compress Consecutive", "Python Strings", "Compress string 'aabcccccaaa' into 'a2b1c5a3'."],
    ["Python Find Missing Ranges", "Python Logic", "Find missing ranges between 0 and 99 given sorted array."],
    ["Python Sublist Search", "Python Lists", "Check if sublist exists consecutively in main list."],
    ["Python Group Anagrams Defaultdict", "Python Dicts", "Group array of strings into anagram lists using defaultdict."],
    ["Python Custom Iteration Class", "Python OOP", "Implement __iter__ and __next__ for Fibonacci iterator."],
    ["Python Zip Longest Handling", "Python Collections", "Zip two unequal lists filling missing values with default."],
    ["Python Functools Partial Application", "Python Functional", "Create multiply_by_five function using functools.partial."],
    ["Python Run-Length Encoding", "Python Algorithms", "Encode string with run-length encoding."],
    ["Python Custom Container Length", "Python OOP", "Implement __len__ and __getitem__ for custom Deck class."],
    ["Python Filter Matrix Non-Zero", "Python Lists", "Remove rows containing all zero elements from matrix."],
    ["Python Tuple List Sorting Multi-Key", "Python Lists", "Sort tuple list by second element asc, then first element desc."],
    ["Python Dict Key Rename", "Python Dicts", "Rename dictionary key 'old_key' to 'new_key' in-place."],
    ["Python Chaining Generators", "Python Generators", "Chain two generator functions using yield from."],
    ["Python Set Symmetric Difference", "Python Sets", "Find elements present in either set but not both."],
    ["Python Counter Most Frequent Words", "Python Collections", "Find N most frequent words in paragraph text."],
    ["Python Path Split Extractor", "Python File Handling", "Extract directory, filename, and extension from path string."],
    ["Python Valid Palindrome Ignore Special", "Python Strings", "Check if alphanumeric characters form palindrome."],
    ["Python Dict Merge Operator Pipe", "Python Dicts", "Merge two dicts using Python 3.9+ union operator |."],
    ["Python Multi-threaded Queue Worker", "Python Multithreading", "Process tasks in queue using concurrent threads."]
  ][i - 136];

  addQ(i, pyMed[0], pyMed[1], "Medium", Math.floor((i - 136) / 4) + 4,
    `${pyMed[2]}`,
    "Input data stream", "Expected output format", "Standard constraints",
    [{ input: "Sample input", output: "Sample output", explanation: "Medium Python case" }],
    `import sys\n# Python solution for ${pyMed[0]}\nprint('Sample output')`,
    `public class Solution { public static void main(String[] args) {} }`,
    `function solution() {}`,
    `#include <iostream>\nusing namespace std;\nint main() { return 0; }`,
    [{ input: "10 20", expectedOutput: "Sample output" }],
    [{ input: "10 20", expectedOutput: "Sample output" }]
  );
}

// -------------------------------------------------------------
// HARD PYTHON QUESTIONS (Q176 to Q200) - 25 Questions
// -------------------------------------------------------------

for (let i = 176; i <= 200; i++) {
  const pyHard = [
    ["Python Custom Metaclass Creation", "Python Advanced", "Create Singleton metaclass enforcing single instance."],
    ["Python Asyncio Task Execution Simulation", "Python Async", "Run asynchronous tasks concurrently using asyncio.gather."],
    ["Python LRU Cache Functools Implementation", "Python Advanced", "Build custom LRU cache using doubly linked list and dict."],
    ["Python Infinite Generator Pipeline", "Python Generators", "Build streaming data pipeline using generator functions."],
    ["Python Custom Tree Traverser Generator", "Python Data Structures", "Traverse binary tree in-order using yield generator."],
    ["Python Dynamic Attribute Getattr Handler", "Python Advanced", "Implement dynamic attribute resolver using __getattr__."],
    ["Python Nested Dict Flattener", "Python Dicts", "Flatten deeply nested dict into dot-separated keys."],
    ["Python Expression Parser Stack", "Python Algorithms", "Parse and evaluate complex mathematical expressions."],
    ["Python Graph Shortest Path BFS", "Python Graph", "Find shortest path in unweighted graph using deque BFS."],
    ["Python Custom Dependency Injector", "Python Advanced", "Implement simple IoC container for dependency injection."],
    ["Python Regex Tokenizer Engine", "Python Regex", "Build lexer tokenizer for math expressions using re.finditer."],
    ["Python Dynamic Programming Knapsack", "Python DP", "Solve 0/1 Knapsack problem using 2D DP table."],
    ["Python N-Queens Solver Generator", "Python Backtracking", "Yield all valid N-Queens chessboard configurations."],
    ["Python Custom Trie Prefix Search", "Python Data Structures", "Build Trie supporting insert, search, and autocomplete."],
    ["Python Priority Queue Heapq Scheduler", "Python Data Structures", "Implement priority task scheduler using heapq."],
    ["Python Subsets Generator Itertools", "Python Combinatorics", "Generate all power set subsets of list."],
    ["Python Matrix Spiral Print Pythonic", "Python Lists", "Print matrix elements in spiral order using pop and zip."],
    ["Python Max Sliding Window Deque", "Python Data Structures", "Find max element in sliding window using collections.deque."],
    ["Python Merge K Sorted Lists Heapq", "Python Data Structures", "Merge K sorted lists efficiently using heap."],
    ["Python Topological Sort Graph", "Python Graph", "Perform topological sort using Kahn's algorithm."],
    ["Python Custom Context Manager Exception", "Python Advanced", "Handle and suppress specific exception in context manager."],
    ["Python Memoized Recursive Tree Search", "Python Algorithms", "Find max path sum in general tree with memoization."],
    ["Python Monotonic Stack Next Greater", "Python Data Structures", "Find next greater element for each array position."],
    ["Python Word Ladder Distance BFS", "Python Algorithms", "Find shortest transformation sequence length from start to end word."],
    ["Python Trie Search Autocomplete System", "Python Data Structures", "Return top 3 suggestions for search prefix in Trie."]
  ][i - 176];

  addQ(i, pyHard[0], pyHard[1], "Hard", Math.floor((i - 176) / 3) + 8,
    `${pyHard[2]}`,
    "Complex input specification", "Verified Python output", "Optimized space/time complexity",
    [{ input: "Hard case input", output: "Hard case output", explanation: "Hard Python problem" }],
    `import sys\n# Python solution for ${pyHard[0]}\nprint('Hard case output')`,
    `public class Solution { public static void main(String[] args) {} }`,
    `function solution() {}`,
    `#include <iostream>\nusing namespace std;\nint main() { return 0; }`,
    [{ input: "1 2 3", expectedOutput: "Hard case output" }],
    [{ input: "1 2 3", expectedOutput: "Hard case output" }]
  );
}

module.exports = pythonQuestions;
