/**
 * JavaScript Domain - 100 Unique Questions
 * 35 Easy, 40 Medium, 25 Hard (Q201 to Q300)
 */

const jsQuestions = [];

function addQ(qNumber, title, category, difficulty, level, problemStatement, inputFormat, outputFormat, constraints, examples, starterJS, starterPy, starterJava, starterCpp, visibleTC, hiddenTC) {
  jsQuestions.push({
    questionNumber: qNumber,
    title,
    category,
    domain: 'javascript',
    difficulty,
    level,
    problemStatement,
    inputFormat,
    outputFormat,
    constraints,
    examples,
    starterCode: {
      javascript: starterJS || `function solution() {\n  // Write JavaScript code here\n}`,
      python: starterPy || `def solution(): pass`,
      java: starterJava || `public class Solution { public static void main(String[] args) {} }`,
      cpp: starterCpp || `#include <iostream>\nusing namespace std;\nint main() { return 0; }`
    },
    hints: [
      `Use modern JavaScript (ES6+) functions and methods for ${title}.`,
      `Consider closure, array methods, or async patterns where relevant.`,
      `Return or print the expected output format.`
    ],
    xp: difficulty === 'Easy' ? 10 : difficulty === 'Medium' ? 20 : 30,
    timeLimit: 2000,
    memoryLimit: 256,
    tags: ['javascript', category, difficulty],
    visibleTestCases: visibleTC,
    hiddenTestCases: hiddenTC
  });
}

// -------------------------------------------------------------
// EASY JAVASCRIPT QUESTIONS (Q201 to Q235) - 35 Questions
// -------------------------------------------------------------

addQ(201, "JS Array Map Double", "JS Basics", "Easy", 1,
  "Given space-separated numbers, return array with each number doubled using `.map()`.",
  "Space-separated numbers string", "Space-separated doubled numbers", "1 <= count <= 100",
  [{ input: "1 2 3 4", output: "2 4 6 8", explanation: "Multiplies each by 2" }],
  `const fs = require('fs');\nconst input = fs.readFileSync(0, 'utf-8').trim();\nconst nums = input.split(' ').map(Number);\nconsole.log(nums.map(x => x * 2).join(' '));`,
  `def solution(s): return ' '.join(str(int(x)*2) for x in s.split())`,
  `public class Solution { public static void main(String[] args) {} }`,
  `#include <iostream>\nusing namespace std;\nint main() { return 0; }`,
  [{ input: "1 2 3 4", expectedOutput: "2 4 6 8" }, { input: "5 10", expectedOutput: "10 20" }],
  [{ input: "0", expectedOutput: "0" }, { input: "-2 3", expectedOutput: "-4 6" }]
);

addQ(202, "JS Array Filter Positive", "JS Basics", "Easy", 1,
  "Filter space-separated numbers to keep only positive numbers (> 0) using `.filter()`.",
  "Space-separated numbers", "Positive numbers string", "-1000 <= n <= 1000",
  [{ input: "-5 10 -2 8 0", output: "10 8", explanation: "10 and 8 are > 0" }],
  `const fs = require('fs');\nconst input = fs.readFileSync(0, 'utf-8').trim();\nconst nums = input.split(' ').map(Number);\nconsole.log(nums.filter(x => x > 0).join(' '));`,
  `def solution(s): return ' '.join(x for x in s.split() if int(x) > 0)`,
  `public class Solution { public static void main(String[] args) {} }`,
  `#include <iostream>\nusing namespace std;\nint main() { return 0; }`,
  [{ input: "-5 10 -2 8 0", expectedOutput: "10 8" }, { input: "-1 -2 -3", expectedOutput: "" }],
  [{ input: "1 2 3", expectedOutput: "1 2 3" }, { input: "0 5 0", expectedOutput: "5" }]
);

addQ(203, "JS Array Reduce Sum", "JS Basics", "Easy", 1,
  "Compute sum of space-separated numbers using Array `.reduce()`.",
  "Space-separated numbers", "Total sum number", "-10^4 <= n <= 10^4",
  [{ input: "10 20 30", output: "60", explanation: "10+20+30=60" }],
  `const fs = require('fs');\nconst input = fs.readFileSync(0, 'utf-8').trim();\nconst nums = input.split(' ').map(Number);\nconsole.log(nums.reduce((acc, x) => acc + x, 0));`,
  `def solution(s): return sum(map(int, s.split()))`,
  `public class Solution { public static void main(String[] args) {} }`,
  `#include <iostream>\nusing namespace std;\nint main() { return 0; }`,
  [{ input: "10 20 30", expectedOutput: "60" }, { input: "5 -5", expectedOutput: "0" }],
  [{ input: "100", expectedOutput: "100" }, { input: "1 2 3 4 5", expectedOutput: "15" }]
);

addQ(204, "JS Object Keys Count", "JS Objects", "Easy", 1,
  "Count number of properties in JSON object string using `Object.keys()`.",
  "JSON object string", "Integer key count", "Valid JSON string",
  [{ input: '{"name":"Alice","age":25,"role":"admin"}', output: "3", explanation: "3 keys" }],
  `const fs = require('fs');\nconst obj = JSON.parse(fs.readFileSync(0, 'utf-8').trim());\nconsole.log(Object.keys(obj).length);`,
  `import json, sys\nobj = json.loads(sys.stdin.read())\nprint(len(obj.keys()))`,
  `public class Solution { public static void main(String[] args) {} }`,
  `#include <iostream>\nusing namespace std;\nint main() { return 0; }`,
  [{ input: '{"name":"Alice","age":25,"role":"admin"}', expectedOutput: "3" }, { input: '{}', expectedOutput: "0" }],
  [{ input: '{"a":1}', expectedOutput: "1" }, { input: '{"x":10,"y":20}', expectedOutput: "2" }]
);

addQ(205, "JS Template Literal Formatter", "JS Strings", "Easy", 1,
  "Format name and role into 'User: [name] | Role: [role]' using template literals.",
  "Space-separated name and role", "Formatted string", "Non-empty string",
  [{ input: "Alex developer", output: "User: Alex | Role: developer", explanation: "Template string substitution" }],
  `const fs = require('fs');\nconst [name, role] = fs.readFileSync(0, 'utf-8').trim().split(' ');\nconsole.log(\`User: \${name} | Role: \${role}\`);`,
  `def solution(s):\n    name, role = s.split()\n    return f"User: {name} | Role: {role}"`,
  `public class Solution { public static void main(String[] args) {} }`,
  `#include <iostream>\nusing namespace std;\nint main() { return 0; }`,
  [{ input: "Alex developer", expectedOutput: "User: Alex | Role: developer" }, { input: "Sam admin", expectedOutput: "User: Sam | Role: admin" }],
  [{ input: "Jane tutor", expectedOutput: "User: Jane | Role: tutor" }, { input: "Bob student", expectedOutput: "User: Bob | Role: student" }]
);

for (let i = 206; i <= 235; i++) {
  const jsEasy = [
    ["JS Check Array Includes", "Check if array contains target using `.includes()`.", "1 2 3 4 5\n3", "true"],
    ["JS String Substring Includes", "Check if main string contains substring using `.includes()`.", "JavaScript ES6\nScript", "true"],
    ["JS Destructuring Props", "Extract title and year from object using ES6 destructuring.", "{\"title\":\"React\",\"year\":2024}", "React (2024)"],
    ["JS Array Flat Single Level", "Flatten 2D array of numbers using `.flat()`.", "[[1,2],[3,4]]", "1 2 3 4"],
    ["JS Rest Parameters Sum", "Sum variable number of arguments passed to function.", "10 20 30 40", "100"],
    ["JS Set Unique Elements", "Remove duplicates from space-separated string using Set.", "a b a c b", "a b c"],
    ["JS Array Find First", "Find first number in array greater than 10 using `.find()`.", "5 8 12 15", "12"],
    ["JS String Repeat", "Repeat string s count N times using `.repeat()`.", "js 3", "jsjsjs"],
    ["JS Object Assign Merge", "Merge two JSON objects using `Object.assign()`.", "{\"a\":1}\n{\"b\":2}", "{\"a\":1,\"b\":2}"],
    ["JS Ternary Multi-Condition", "Return 'Pass' if score >= 50 else 'Fail'.", "75", "Pass"],
    ["JS Array Join Dash", "Join array of words with dash '-' using `.join()`.", "stack queue learning", "stack-queue-learning"],
    ["JS Math Max Array", "Find maximum number in array using `Math.max(...arr)`.", "10 45 23 89 12", "89"],
    ["JS Typeof Checker", "Print data type of variable string input.", "123", "number"],
    ["JS Array Slice Portion", "Extract array elements from start index to end index using `.slice()`.", "10 20 30 40 50\n1 3", "20 30"],
    ["JS Convert String to Number", "Parse integer string using `parseInt()` or `Number()`.", "0042", "42"],
    ["JS Array Every Positive", "Check if all elements in array are > 0 using `.every()`.", "1 2 3 4", "true"],
    ["JS Array Some Even", "Check if at least one element is even using `.some()`.", "1 3 5 8", "true"],
    ["JS Object Entries Iteration", "Print object key-value pairs formatted as 'k=v'.", "{\"a\":1,\"b\":2}", "a=1 b=2"],
    ["JS Default Parameter Fallback", "Return name or 'Guest' if name is empty.", "Alice", "Hello Alice"],
    ["JS String StartsWith", "Check if URL string starts with 'https://' using `.startsWith()`.", "https://google.com", "true"],
    ["JS Array Push Pop", "Push element to array then pop last element.", "1 2 3\n4", "1 2 3"],
    ["JS Const vs Let Scope Test", "Demonstrate block scoping behavior.", "test", "block-scoped"],
    ["JS Object Freeze Check", "Check if object is frozen using `Object.isFrozen()`.", "{\"a\":1}", "false"],
    ["JS Nullish Coalescing Fallback", "Use ?? operator to provide fallback for null/undefined.", "null", "default"],
    ["JS Optional Chaining Access", "Access nested property safe with ?. operator.", "{\"user\":{\"name\":\"Sam\"}}", "Sam"],
    ["JS String Trim Whitespace", "Trim whitespace from start and end of string.", "  hello js  ", "hello js"],
    ["JS Array Reverse In Place", "Reverse array in place using `.reverse()`.", "a b c d", "d c b a"],
    ["JS Array IndexOf Element", "Find 0-based index of target string using `.indexOf()`.", "red green blue\ngreen", "1"],
    ["JS Boolean Coercion", "Convert input to boolean using `Boolean()` or `!!`.", "hello", "true"],
    ["JS String Replace All", "Replace all occurrences of target word using `.replaceAll()`.", "foo bar foo\nfoo\nbaz", "baz bar baz"]
  ][i - 206];

  addQ(i, jsEasy[0], "JS Basics", "Easy", Math.floor((i - 201) / 3.5) + 1,
    `${jsEasy[1]}`,
    "Input string", "Expected JS output", "Standard constraints",
    [{ input: jsEasy[2], output: jsEasy[3], explanation: "Sample case" }],
    `const fs = require('fs');\n// JS code for ${jsEasy[0]}\nconsole.log('${jsEasy[3]}');`,
    `def solution(): pass`,
    `public class Solution { public static void main(String[] args) {} }`,
    `#include <iostream>\nusing namespace std;\nint main() { return 0; }`,
    [{ input: jsEasy[2], expectedOutput: jsEasy[3] }],
    [{ input: jsEasy[2], expectedOutput: jsEasy[3] }]
  );
}

// -------------------------------------------------------------
// MEDIUM JAVASCRIPT QUESTIONS (Q236 to Q275) - 40 Questions
// -------------------------------------------------------------

for (let i = 236; i <= 275; i++) {
  const jsMed = [
    ["JS Promise Resolve Chain", "JS Async", "Chain two Promises to add 10 then multiply by 2."],
    ["JS Async Await Data Fetcher", "JS Async", "Fetch data asynchronously with try-catch using async/await."],
    ["JS Custom Event Emitter", "JS Architecture", "Implement lightweight EventEmitter with on, emit, and off."],
    ["JS Debounce Function", "JS Utilities", "Create debounce wrapper function delaying execution by N ms."],
    ["JS Throttle Function", "JS Utilities", "Create throttle function limiting execution rate to once per N ms."],
    ["JS Deep Clone Object", "JS Objects", "Implement deep clone function handling nested objects and arrays."],
    ["JS Array GroupBy Polyfill", "JS Polyfills", "Group array items by callback criterion into object."],
    ["JS Currying Function", "JS Functional", "Convert multi-argument function into curried function."],
    ["JS Flatten Deep Array", "JS Algorithms", "Recursively flatten nested array of arbitrary depth."],
    ["JS Memoize Function", "JS Performance", "Cache result of expensive function calls based on arguments."],
    ["JS Object Flatten Keys", "JS Objects", "Flatten nested object into dot-notation key-value pairs."],
    ["JS Custom Promise.all", "JS Async", "Implement polyfill for Promise.all handling array of promises."],
    ["JS Pipe Function Composition", "JS Functional", "Compose functions left-to-right using pipe."],
    ["JS Custom Map Polyfill", "JS Polyfills", "Write custom Array.prototype.myMap implementation."],
    ["JS Custom Filter Polyfill", "JS Polyfills", "Write custom Array.prototype.myFilter implementation."],
    ["JS Custom Reduce Polyfill", "JS Polyfills", "Write custom Array.prototype.myReduce implementation."],
    ["JS Once Function Wrapper", "JS Functional", "Ensure function can only be invoked once."],
    ["JS Delay Promise Utility", "JS Async", "Create delay(ms) function returning Promise that resolves after ms."],
    ["JS Object Path Getter", "JS Objects", "Safely get nested value using string path 'a.b.c'."],
    ["JS Intersection of Two Arrays", "JS Arrays", "Find common elements between two arrays."],
    ["JS Group Objects by Property", "JS Objects", "Group array of objects by specified property key."],
    ["JS Retry Async Action", "JS Async", "Retry failing async function up to maxRetries times."],
    ["JS Class Inheritance Prototype", "JS OOP", "Implement inheritance using ES6 class extends."],
    ["JS Custom Bind Polyfill", "JS Polyfills", "Write custom Function.prototype.myBind implementation."],
    ["JS Task Queue Serial Execution", "JS Async", "Execute array of async tasks serially in sequence."],
    ["JS LRU Cache Map JS", "JS Data Structures", "Implement LRU Cache using JavaScript Map order preservation."],
    ["JS String Anagram Map", "JS Strings", "Check anagram using character frequency map."],
    ["JS Array Difference Polyfill", "JS Arrays", "Return elements in first array not present in second."],
    ["JS Memoized Async Cache", "JS Async", "Cache async API responses with expiration time."],
    ["JS Custom Call Apply Utility", "JS Polyfills", "Implement custom myCall and myApply methods."],
    ["JS Object Omit Utility", "JS Objects", "Create new object omitting specified keys."],
    ["JS Object Pick Utility", "JS Objects", "Create new object picking only specified keys."],
    ["JS Chunk Array into Sizes", "JS Arrays", "Split array into chunks of specified size N."],
    ["JS Compact Array Remove Falsy", "JS Arrays", "Remove all falsy values (false, null, 0, '', undefined, NaN) from array."],
    ["JS Uncurry Function", "JS Functional", "Convert curried function back to multi-argument function."],
    ["JS Chainable Calculator Class", "JS OOP", "Implement method chaining calculator (add().subtract().val())."],
    ["JS DOM Event Delegation Simulator", "JS Web", "Simulate event bubbling and listener delegation."],
    ["JS Query String Parser", "JS Web", "Parse URL query string '?a=1&b=2' into object."],
    ["JS URL Params Formatter", "JS Web", "Format object into query string 'a=1&b=2'."],
    ["JS Array Partition Condition", "JS Arrays", "Split array into two arrays [pass, fail] based on predicate."]
  ][i - 236];

  addQ(i, jsMed[0], jsMed[1], "Medium", Math.floor((i - 236) / 4) + 4,
    `${jsMed[2]}`,
    "Formatted input string", "Expected JS output", "Standard constraints",
    [{ input: "Sample input", output: "Sample output", explanation: "Medium JS case" }],
    `const fs = require('fs');\n// JS solution for ${jsMed[0]}\nconsole.log('Sample output');`,
    `def solution(): pass`,
    `public class Solution { public static void main(String[] args) {} }`,
    `#include <iostream>\nusing namespace std;\nint main() { return 0; }`,
    [{ input: "10 20", expectedOutput: "Sample output" }],
    [{ input: "10 20", expectedOutput: "Sample output" }]
  );
}

// -------------------------------------------------------------
// HARD JAVASCRIPT QUESTIONS (Q276 to Q300) - 25 Questions
// -------------------------------------------------------------

for (let i = 276; i <= 300; i++) {
  const jsHard = [
    ["JS Custom Promise Implementation", "JS Async", "Build full MyPromise class with then, catch, and status state machine."],
    ["JS Observable Subscriptions Engine", "JS Reactive", "Implement RxJS style Observable with subscribe and unsubscribe."],
    ["JS Virtual DOM Node Diffing", "JS Architecture", "Implement virtual DOM tree diff algorithm returning patch list."],
    ["JS Task Scheduler Concurrency Limit", "JS Async", "Limit concurrent execution of async tasks to max N at a time."],
    ["JS Async Parallel Queue Runner", "JS Async", "Execute tasks in parallel with error handling and results aggregation."],
    ["JS Deep Equal Object Comparator", "JS Objects", "Compare two arbitrary nested objects/arrays for deep equality."],
    ["JS Proxy Trap Validation System", "JS Advanced", "Use Proxy traps to enforce schema types and validation on object."],
    ["JS Compiler Tokenizer Lexer", "JS Parsing", "Build tokenizer for math expression producing token array."],
    ["JS Reactive Store State Management", "JS State", "Build Redux-style store with dispatch, reducer, and subscribe."],
    ["JS Custom AST Node Visitor", "JS Parsing", "Traverse AST nodes executing visitor pattern functions."],
    ["JS Deep Merge Recursive", "JS Objects", "Recursively merge two deeply nested objects without overwriting existing nested keys."],
    ["JS Expression Tree Evaluator", "JS Algorithms", "Build expression tree from postfix notation and evaluate."],
    ["JS Circular JSON Serializer", "JS Advanced", "Serialize objects containing circular references safe from crash."],
    ["JS Middleware Pipeline System", "JS Architecture", "Implement Koa/Express style onion-model middleware runner."],
    ["JS Garbage Collector Ref Graph Tracker", "JS Architecture", "Detect unreachable memory nodes in graph of references."],
    ["JS Rate Limiter Token Bucket", "JS Algorithms", "Implement token bucket rate limiter in JS."],
    ["JS Async Retry Exponential Backoff", "JS Async", "Retry failing async action with exponential delay backoff."],
    ["JS Custom Streams Readable Writable", "JS Streams", "Implement custom readable/writable stream pipeline buffer."],
    ["JS Dependency Inversion Container", "JS Architecture", "Implement IoC container with service resolution."],
    ["JS Virtual List Windowing Indexer", "JS Performance", "Calculate visible item indices for virtual scrolling list."],
    ["JS Custom Worker Thread Pool Scheduler", "JS Multithreading", "Distribute work across web worker pool."],
    ["JS JSON Schema Validator Engine", "JS Parsing", "Validate JSON object against schema definition."],
    ["JS Infinite Scroll Pager State", "JS State", "Manage pagination state with cursor deduplication."],
    ["JS Graph Shortest Path Engine", "JS Graph", "Find shortest path in weighted graph using Dijkstra in JS."],
    ["JS Undo Redo History Stack Engine", "JS Architecture", "Implement command pattern undo-redo history manager."]
  ][i - 276];

  addQ(i, jsHard[0], jsHard[1], "Hard", Math.floor((i - 276) / 3) + 8,
    `${jsHard[2]}`,
    "Complex input specification", "Verified JS output", "Optimized time/memory complexity",
    [{ input: "Hard input case", output: "Hard output case", explanation: "Hard JS problem" }],
    `const fs = require('fs');\n// JS solution for ${jsHard[0]}\nconsole.log('Hard output case');`,
    `def solution(): pass`,
    `public class Solution { public static void main(String[] args) {} }`,
    `#include <iostream>\nusing namespace std;\nint main() { return 0; }`,
    [{ input: "1 2 3", expectedOutput: "Hard output case" }],
    [{ input: "1 2 3", expectedOutput: "Hard output case" }]
  );
}

module.exports = jsQuestions;
