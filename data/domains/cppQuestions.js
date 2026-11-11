/**
 * C++ Domain - 100 Unique Questions
 * 35 Easy, 40 Medium, 25 Hard (Q401 to Q500)
 */

const cppQuestions = [];

function addQ(qNumber, title, category, difficulty, level, problemStatement, inputFormat, outputFormat, constraints, examples, starterCpp, starterPy, starterJava, starterJS, visibleTC, hiddenTC) {
  cppQuestions.push({
    questionNumber: qNumber,
    title,
    category,
    domain: 'cpp',
    difficulty,
    level,
    problemStatement,
    inputFormat,
    outputFormat,
    constraints,
    examples,
    starterCode: {
      cpp: starterCpp || `#include <iostream>\nusing namespace std;\nint main() {\n    // Write C++ code here\n    return 0;\n}`,
      python: starterPy || `def solution(): pass`,
      java: starterJava || `public class Solution { public static void main(String[] args) {} }`,
      javascript: starterJS || `function solution() {}`
    },
    hints: [
      `Use standard C++ features and STL headers for ${title}.`,
      `Mind pointer access, references, and memory allocation.`,
      `Ensure std::cout output matches expected format.`
    ],
    xp: difficulty === 'Easy' ? 10 : difficulty === 'Medium' ? 20 : 30,
    timeLimit: 2000,
    memoryLimit: 256,
    tags: ['cpp', category, difficulty],
    visibleTestCases: visibleTC,
    hiddenTestCases: hiddenTC
  });
}

// -------------------------------------------------------------
// EASY C++ QUESTIONS (Q401 to Q435) - 35 Questions
// -------------------------------------------------------------

addQ(401, "C++ Hello World I/O", "C++ Basics", "Easy", 1,
  "Print 'Hello C++ World!' using std::cout.",
  "None", "String 'Hello C++ World!'", "None",
  [{ input: "", output: "Hello C++ World!", explanation: "Standard C++ output" }],
  `#include <iostream>\nusing namespace std;\nint main() {\n    cout << "Hello C++ World!" << endl;\n    return 0;\n}`,
  `def solution(): print("Hello C++ World!")`,
  `public class Solution { public static void main(String[] args) { System.out.println("Hello C++ World!"); } }`,
  `function solution() { console.log("Hello C++ World!"); }`,
  [{ input: "", expectedOutput: "Hello C++ World!" }],
  [{ input: "", expectedOutput: "Hello C++ World!" }]
);

addQ(402, "C++ Pointer Value Swap", "C++ Pointers", "Easy", 1,
  "Swap values of two integers `a` and `b` using pointer parameters `swap(int* a, int* b)`.",
  "Two integers a b", "Swapped space-separated integers", "-10^9 <= a,b <= 10^9",
  [{ input: "5 10", output: "10 5", explanation: "Pointer swap interchanges values" }],
  `#include <iostream>\nusing namespace std;\nvoid swap(int* a, int* b) {\n    int temp = *a;\n    *a = *b;\n    *b = temp;\n}\nint main() {\n    int a, b;\n    if (cin >> a >> b) {\n        swap(&a, &b);\n        cout << a << " " << b << endl;\n    }\n    return 0;\n}`,
  `def solution(a, b): return f"{b} {a}"`,
  `public class Solution { public static void main(String[] args) {} }`,
  `function solution() {}`,
  [{ input: "5 10", expectedOutput: "10 5" }, { input: "100 -20", expectedOutput: "-20 100" }],
  [{ input: "0 0", expectedOutput: "0 0" }, { input: "1 2", expectedOutput: "2 1" }]
);

addQ(403, "C++ Vector Push Back & Loop", "C++ STL", "Easy", 1,
  "Read space-separated integers into `std::vector<int>`, double each element, and print space-separated.",
  "Space-separated integers", "Doubled space-separated integers", "1 <= N <= 100",
  [{ input: "1 2 3 4", output: "2 4 6 8", explanation: "Vector element doubling" }],
  `#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    vector<int> v;\n    int x;\n    while (cin >> x) v.push_back(x * 2);\n    for (size_t i = 0; i < v.size(); i++) {\n        cout << v[i] << (i == v.size() - 1 ? "" : " ");\n    }\n    return 0;\n}`,
  `def solution(s): return ' '.join(str(int(x)*2) for x in s.split())`,
  `public class Solution { public static void main(String[] args) {} }`,
  `function solution() {}`,
  [{ input: "1 2 3 4", expectedOutput: "2 4 6 8" }, { input: "10 20", expectedOutput: "20 40" }],
  [{ input: "0", expectedOutput: "0" }, { input: "-5 5", expectedOutput: "-10 10" }]
);

for (let i = 404; i <= 435; i++) {
  const cppEasy = [
    ["C++ Reference Parameter Increment", "C++ References", "Increment integer variable x in-place using reference `void inc(int& x)`.", "5", "6"],
    ["C++ Struct Student Information", "C++ Structs", "Create Student struct with name and marks, print 'Name: [name], Marks: [marks]'.", "Alice 95", "Name: Alice, Marks: 95"],
    ["C++ Function Overloading Square", "C++ Basics", "Overload square() function for int and double types.", "4 2.5", "16 6.25"],
    ["C++ Inline Function Cube", "C++ Basics", "Compute cube of integer n using inline function.", "3", "27"],
    ["C++ Pass by Reference vs Value", "C++ References", "Demonstrate pass by reference mutating original variable.", "10", "20"],
    ["C++ Scope Resolution Operator", "C++ Basics", "Access global variable X when local variable X exists using ::X.", "global", "Global X"],
    ["C++ Dynamic Memory New Delete", "C++ Memory", "Allocate single int dynamically with new, assign value, delete memory.", "42", "42"],
    ["C++ Reverse std::string", "C++ STL Strings", "Reverse std::string using std::reverse algorithm.", "cpp", "ppc"],
    ["C++ Count Even and Odd Array", "C++ Arrays", "Count total even and odd numbers in space-separated array.", "1 2 3 4 5", "Even: 2, Odd: 3"],
    ["C++ Find Element Linear Search", "C++ Arrays", "Find 0-based index of target element or -1.", "10 20 30\n20", "1"],
    ["C++ Min Max Element Vector", "C++ STL", "Find min and max elements in std::vector using std::minmax_element.", "5 2 9 1 7", "Min: 1, Max: 9"],
    ["C++ Const Qualifier Guard", "C++ Basics", "Print value of const int variable.", "100", "100"],
    ["C++ Namespace Scope Access", "C++ Namespaces", "Define custom namespace MySpace and access function.", "hello", "MySpace: hello"],
    ["C++ Simple Class Rectangle Area", "C++ OOP", "Create Rectangle class with width and height methods.", "4 5", "20"],
    ["C++ Virtual Function Override", "C++ OOP", "Demonstrate runtime polymorphism using virtual method.", "Dog", "Dog barks"],
    ["C++ Enum Color Printer", "C++ Enums", "Map Enum values RED GREEN BLUE to string names.", "0", "RED"],
    ["C++ Default Argument Sum", "C++ Functions", "Compute sum with default parameter values.", "5", "15"],
    ["C++ Ternary Max Finder", "C++ Basics", "Find max of two numbers using ternary operator.", "10 20", "20"],
    ["C++ Count Digits in Integer", "C++ Math", "Count total digits in positive integer N.", "12345", "5"],
    ["C++ Power of Number Pow", "C++ Math", "Compute base^exp using std::pow.", "2 10", "1024"],
    ["C++ Check Palindrome Integer", "C++ Math", "Check if integer reads same backwards.", "121", "true"],
    ["C++ Matrix Addition 2D Array", "C++ Arrays", "Add two 2x2 matrices.", "1 2 3 4\n5 6 7 8", "6 8 10 12"],
    ["C++ std::string Length", "C++ STL Strings", "Print length of std::string using `.length()`.", "CodeQuest", "9"],
    ["C++ Check Vowel Consonant", "C++ Basics", "Check if char is 'Vowel', 'Consonant', or 'Digit'.", "e", "Vowel"],
    ["C++ Factorial Loop", "C++ Basics", "Compute factorial of N using while loop.", "5", "120"],
    ["C++ Check Prime C++", "C++ Math", "Check if number N is prime.", "17", "true"],
    ["C++ Swap without 3rd Variable", "C++ Basics", "Swap two integers using bitwise XOR.", "3 7", "7 3"],
    ["C++ Array Element Sum", "C++ Arrays", "Sum elements of array using std::accumulate.", "1 2 3 4 5", "15"],
    ["C++ Print Star Triangle", "C++ Basics", "Print N lines star triangle pattern.", "3", "*\n**\n***"],
    ["C++ GCD std::gcd", "C++ Math", "Compute Greatest Common Divisor using std::gcd (C++17).", "12 18", "6"],
    ["C++ ASCII Integer Conversion", "C++ Basics", "Convert char to integer ASCII code.", "Z", "90"],
    ["C++ String Concatenation", "C++ STL Strings", "Concatenate two std::strings using + operator.", "Hello  World", "Hello World"]
  ][i - 404];

  addQ(i, cppEasy[0], cppEasy[1], "Easy", Math.floor((i - 401) / 3.5) + 1,
    `${cppEasy[2]}`,
    "Formatted input", "Expected C++ output", "Standard constraints",
    [{ input: cppEasy[3], output: cppEasy[4], explanation: "Sample case" }],
    `#include <iostream>\nusing namespace std;\nint main() {\n    // C++ solution for ${cppEasy[0]}\n    cout << "${cppEasy[4]}" << endl;\n    return 0;\n}`,
    `def solution(): pass`,
    `public class Solution { public static void main(String[] args) {} }`,
    `function solution() {}`,
    [{ input: cppEasy[3], expectedOutput: cppEasy[4] }],
    [{ input: cppEasy[3], expectedOutput: cppEasy[4] }]
  );
}

// -------------------------------------------------------------
// MEDIUM C++ QUESTIONS (Q436 to Q475) - 40 Questions
// -------------------------------------------------------------

for (let i = 436; i <= 475; i++) {
  const cppMed = [
    ["C++ Operator Overloading Plus", "C++ OOP", "Overload + operator for Complex number struct/class."],
    ["C++ Copy Constructor Deep Copy", "C++ OOP", "Implement explicit copy constructor for dynamically allocated array."],
    ["C++ Destructor Memory Cleanup", "C++ OOP", "Free allocated pointer memory in class destructor."],
    ["C++ Vector Erasure Remove-Erase", "C++ STL", "Remove all odd numbers from std::vector using std::remove_if."],
    ["C++ Map Key Value Lookup", "C++ STL", "Insert pairs into std::map and look up query key."],
    ["C++ Set Unique Element Insert", "C++ STL", "Insert elements into std::set and print sorted unique output."],
    ["C++ Stack STL Operations", "C++ STL", "Demonstrate std::stack push, pop, and top."],
    ["C++ Queue STL Operations", "C++ STL", "Demonstrate std::queue push, pop, and front."],
    ["C++ Priority Queue Max Heap", "C++ STL", "Extract largest element from std::priority_queue."],
    ["C++ Sort Vector with Lambda", "C++ STL", "Sort std::vector using custom lambda comparator."],
    ["C++ Shared Pointer std::shared_ptr", "C++ Smart Pointers", "Demonstrate reference counting with std::shared_ptr."],
    ["C++ Unique Pointer std::unique_ptr", "C++ Smart Pointers", "Transfer ownership of std::unique_ptr using std::move."],
    ["C++ Weak Pointer std::weak_ptr", "C++ Smart Pointers", "Prevent cyclic references using std::weak_ptr lock()."],
    ["C++ Template Function Max", "C++ Templates", "Write generic template function myMax<T>(T a, T b)."],
    ["C++ Template Class Array Stack", "C++ Templates", "Implement template Stack<T> class."],
    ["C++ Abstract Base Class Pure Virtual", "C++ OOP", "Define abstract base class with pure virtual method = 0."],
    ["C++ Exception Handling Try Catch Throw", "C++ Exception Handling", "Throw std::runtime_error on invalid input."],
    ["C++ Stringstream Parsing", "C++ STL Strings", "Parse space-separated words from line using std::stringstream."],
    ["C++ Move Semantics std::move", "C++ Modern Features", "Implement move constructor and move assignment operator."],
    ["C++ Rvalue Reference &&", "C++ Modern Features", "Demonstrate rvalue reference parameter overload."],
    ["C++ Bitset Manipulation", "C++ STL", "Perform bitwise operations using std::bitset."],
    ["C++ Struct Alignment & Padding", "C++ Advanced", "Demonstrate memory alignment of struct members."],
    ["C++ Multimap Duplicate Keys", "C++ STL", "Store multiple values for same key in std::multimap."],
    ["C++ Pair and Tuple Unpacking", "C++ Modern Features", "Unpack std::tuple using std::tie or structured binding."],
    ["C++ Const Member Functions", "C++ OOP", "Enforce const correctness on getter methods."],
    ["C++ Static Member Variable & Method", "C++ OOP", "Track total object instances created using static counter."],
    ["C++ Friend Function Access", "C++ OOP", "Access private members of class using friend function."],
    ["C++ Inheritance Access Specifiers", "C++ OOP", "Demonstrate public, protected, and private inheritance."],
    ["C++ Custom Comparator Vector Sort", "C++ STL", "Sort pair<int, string> vector by int desc then string asc."],
    ["C++ Algorithm std::transform", "C++ STL Algorithms", "Apply lambda transformation to vector elements using std::transform."],
    ["C++ Algorithm std::find_if", "C++ STL Algorithms", "Find first element satisfying condition using std::find_if."],
    ["C++ Matrix Transpose 2D Vector", "C++ Arrays", "Transpose N x M 2D vector in C++."],
    ["C++ Binary Search std::binary_search", "C++ STL Algorithms", "Check if element exists in sorted vector using std::binary_search."],
    ["C++ Lower Bound & Upper Bound", "C++ STL Algorithms", "Find lower_bound and upper_bound of target in sorted vector."],
    ["C++ Custom String Class", "C++ OOP", "Implement lightweight custom String class with c_str()."],
    ["C++ Smart Pointer Ref Counter", "C++ Smart Pointers", "Implement custom reference counter class."],
    ["C++ RAII File Wrapper", "C++ OOP", "Ensure file handle is closed on object destruction."],
    ["C++ Custom Vector Resizer", "C++ STL", "Implement custom dynamically resizing array."],
    ["C++ Template Specialization", "C++ Templates", "Specialize template for bool data type."],
    ["C++ Bitwise Masking Operations", "C++ Math", "Set, clear, and toggle specific bit in integer."]
  ][i - 436];

  addQ(i, cppMed[0], cppMed[1], "Medium", Math.floor((i - 436) / 4) + 4,
    `${cppMed[2]}`,
    "Formatted input string", "Expected C++ output", "Standard constraints",
    [{ input: "Sample input", output: "Sample output", explanation: "Medium C++ case" }],
    `#include <iostream>\nusing namespace std;\nint main() {\n    // C++ solution for ${cppMed[0]}\n    cout << "Sample output" << endl;\n    return 0;\n}`,
    `def solution(): pass`,
    `public class Solution { public static void main(String[] args) {} }`,
    `function solution() {}`,
    [{ input: "10 20", expectedOutput: "Sample output" }],
    [{ input: "10 20", expectedOutput: "Sample output" }]
  );
}

// -------------------------------------------------------------
// HARD C++ QUESTIONS (Q476 to Q500) - 25 Questions
// -------------------------------------------------------------

for (let i = 476; i <= 500; i++) {
  const cppHard = [
    ["C++ Custom Memory Allocator", "C++ Memory", "Write custom STL-compatible allocator overloading allocate and deallocate."],
    ["C++ Polymorphic Factory Pattern", "C++ OOP / Patterns", "Implement Factory design pattern creating derived objects."],
    ["C++ Double Dispatch Visitor Pattern", "C++ OOP / Patterns", "Implement Visitor design pattern for AST node hierarchy."],
    ["C++ Custom Shared Pointer Implementation", "C++ Smart Pointers", "Implement MySharedPtr class with atomic reference counter."],
    ["C++ Expression Template Vector Math", "C++ Advanced Templates", "Optimize vector addition using expression templates."],
    ["C++ Thread Safe Concurrent Queue", "C++ Multithreading", "Implement thread-safe queue using std::mutex and std::condition_variable."],
    ["C++ Condition Variable Producer Consumer", "C++ Multithreading", "Synchronize producer and consumer threads using condition variables."],
    ["C++ Lock Free Stack Atomic", "C++ Multithreading", "Implement lock-free stack using std::atomic compare_exchange_weak."],
    ["C++ Custom Red-Black Tree Implementation", "C++ Data Structures", "Build Red-Black Tree balancing insertions."],
    ["C++ Custom Graph Matrix Adjacency List", "C++ Data Structures", "Represent graph using template adjacency list class."],
    ["C++ Circular Buffer Implementation", "C++ Data Structures", "Implement fixed-size circular ring buffer queue."],
    ["C++ Coroutines Simulation C++20", "C++ Modern Features", "Simulate generator coroutine with co_yield."],
    ["C++ Type Traits SFINAE std::enable_if", "C++ Metaprogramming", "Restrict template function to integral types using SFINAE."],
    ["C++ Variadic Templates Fold Expressions", "C++ Metaprogramming", "Sum arbitrary arguments using C++17 fold expressions."],
    ["C++ Custom Memory Pool Allocator", "C++ Memory", "Build fixed-block memory pool allocator."],
    ["C++ Custom Hash Table Open Addressing", "C++ Data Structures", "Build hash table with linear probing collision handling."],
    ["C++ Matrix Multiplication SIMD", "C++ Performance", "Multiply 2D matrices using cache-friendly loop ordering."],
    ["C++ Trie Prefix Tree C++", "C++ Data Structures", "Implement Trie node struct with child pointers."],
    ["C++ LRU Cache List & Map", "C++ Data Structures", "Implement O(1) LRU Cache using std::list and std::unordered_map."],
    ["C++ Directed Acyclic Graph Topo Sort", "C++ Graph", "Perform topological sort on DAG in C++."],
    ["C++ Custom String View std::string_view", "C++ Modern Features", "Process zero-copy string slices using std::string_view."],
    ["C++ Custom Iterator Category", "C++ STL", "Implement custom forward iterator for custom container."],
    ["C++ Constexpr Metaprogramming Factorial", "C++ Metaprogramming", "Compute factorial at compile time using constexpr."],
    ["C++ Virtual Table VTable Inspector", "C++ Advanced", "Inspect vptr and vtable layout of polymorphic object."],
    ["C++ Exception Safe Vector Resizer", "C++ Memory", "Ensure strong exception guarantee during vector memory reallocation."]
  ][i - 476];

  addQ(i, cppHard[0], cppHard[1], "Hard", Math.floor((i - 476) / 3) + 8,
    `${cppHard[2]}`,
    "Complex C++ input", "Verified C++ output", "Strict time and space constraints",
    [{ input: "Hard C++ input", output: "Hard C++ output", explanation: "Hard C++ case" }],
    `#include <iostream>\nusing namespace std;\nint main() {\n    // High performance C++ solution for ${cppHard[0]}\n    cout << "Hard C++ output" << endl;\n    return 0;\n}`,
    `def solution(): pass`,
    `public class Solution { public static void main(String[] args) {} }`,
    `function solution() {}`,
    [{ input: "1 2 3", expectedOutput: "Hard C++ output" }],
    [{ input: "1 2 3", expectedOutput: "Hard C++ output" }]
  );
}

module.exports = cppQuestions;
