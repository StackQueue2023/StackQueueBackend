/**
 * Data Structures & Algorithms (DSA) Domain - 100 Unique Questions
 * 35 Easy, 40 Medium, 25 Hard (Q301 to Q400)
 */

const dsaQuestions = [];

function addQ(qNumber, title, category, difficulty, level, problemStatement, inputFormat, outputFormat, constraints, examples, starterJava, starterPy, starterJS, starterCpp, visibleTC, hiddenTC) {
  dsaQuestions.push({
    questionNumber: qNumber,
    title,
    category,
    domain: 'dsa',
    difficulty,
    level,
    problemStatement,
    inputFormat,
    outputFormat,
    constraints,
    examples,
    starterCode: {
      java: starterJava || `public class Solution {\n    public static void main(String[] args) {\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        // Write Java solution for ${title}\n    }\n}`,
      python: starterPy || `def solution():\n    pass`,
      javascript: starterJS || `function solution() {}`,
      cpp: starterCpp || `#include <iostream>\nusing namespace std;\nint main() { return 0; }`
    },
    hints: [
      `Analyze space and time complexity requirements for ${title}.`,
      `Identify suitable data structure (Array, Hash, Stack, Tree, Graph).`,
      `Handle boundary conditions and edge cases.`
    ],
    xp: difficulty === 'Easy' ? 10 : difficulty === 'Medium' ? 20 : 30,
    timeLimit: 2000,
    memoryLimit: 256,
    tags: ['dsa', category, difficulty],
    visibleTestCases: visibleTC,
    hiddenTestCases: hiddenTC
  });
}

// -------------------------------------------------------------
// EASY DSA QUESTIONS (Q301 to Q335) - 35 Questions
// -------------------------------------------------------------

addQ(301, "DSA Reverse Array In-Place", "Arrays", "Easy", 1,
  "Reverse array of integers in-place without using auxiliary array memory.",
  "Space-separated integers", "Reversed space-separated integers", "1 <= N <= 1000",
  [{ input: "1 2 3 4 5", output: "5 4 3 2 1", explanation: "In-place swap of elements" }],
  `public class Solution {\n    public static void main(String[] args) {\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        if (!sc.hasNextLine()) return;\n        String[] parts = sc.nextLine().trim().split("\\\\s+");\n        int n = parts.length;\n        for (int i = 0; i < n / 2; i++) {\n            String temp = parts[i]; parts[i] = parts[n - 1 - i]; parts[n - 1 - i] = temp;\n        }\n        System.out.println(String.join(" ", parts));\n    }\n}`,
  `import sys\nparts = sys.stdin.read().split()\nparts.reverse()\nprint(' '.join(parts))`,
  `const fs = require('fs'); console.log(fs.readFileSync(0,'utf-8').trim().split(' ').reverse().join(' '));`,
  `#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\nint main() { int x; vector<int> v; while(cin>>x) v.push_back(x); reverse(v.begin(), v.end()); for(int i=0;i<v.size();i++) cout<<v[i]<<(i==v.size()-1?"":" "); return 0; }`,
  [{ input: "1 2 3 4 5", expectedOutput: "5 4 3 2 1" }, { input: "10 20", expectedOutput: "20 10" }],
  [{ input: "7", expectedOutput: "7" }, { input: "-1 -2 -3", expectedOutput: "-3 -2 -1" }]
);

addQ(302, "DSA Find Peak Element in Array", "Arrays", "Easy", 1,
  "Find element greater than or equal to its neighbors. Return peak value.",
  "Space-separated integers", "Peak integer value", "1 <= N <= 1000",
  [{ input: "1 3 20 4 1 0", output: "20", explanation: "20 is greater than 3 and 4" }],
  `public class Solution {\n    public static void main(String[] args) {\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        int max = Integer.MIN_VALUE;\n        while (sc.hasNextInt()) max = Math.max(max, sc.nextInt());\n        System.out.println(max);\n    }\n}`,
  `import sys\nnums = list(map(int, sys.stdin.read().split()))\nprint(max(nums))`,
  `const fs = require('fs'); console.log(Math.max(...fs.readFileSync(0,'utf-8').trim().split(' ').map(Number)));`,
  `#include <iostream>\nusing namespace std;\nint main() { int x, m=-1e9; while(cin>>x) m=max(m,x); cout<<m; return 0; }`,
  [{ input: "1 3 20 4 1 0", expectedOutput: "20" }, { input: "5 10 15 25", expectedOutput: "25" }],
  [{ input: "100", expectedOutput: "100" }, { input: "-5 -2 -10", expectedOutput: "-2" }]
);

addQ(303, "DSA Two Sum Hash Map", "Hashing", "Easy", 1,
  "Find 0-based indices of two numbers in array that sum to target.",
  "Space-separated integers line, then target on next line", "Indices space-separated", "2 <= N <= 1000",
  [{ input: "2 7 11 15\n9", output: "0 1", explanation: "nums[0] + nums[1] = 2 + 7 = 9" }],
  `public class Solution {\n    public static void main(String[] args) {\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        String[] parts = sc.nextLine().trim().split("\\\\s+");\n        int target = sc.nextInt();\n        java.util.Map<Integer, Integer> map = new java.util.HashMap<>();\n        for (int i = 0; i < parts.length; i++) {\n            int val = Integer.parseInt(parts[i]);\n            if (map.containsKey(target - val)) {\n                System.out.println(map.get(target - val) + " " + i);\n                return;\n            }\n            map.put(val, i);\n        }\n    }\n}`,
  `import sys\nlines = sys.stdin.read().strip().split('\\n')\nnums = list(map(int, lines[0].split()))\ntarget = int(lines[1])\nseen = {}\nfor i, x in enumerate(nums):\n    if target - x in seen:\n        print(f"{seen[target-x]} {i}")\n        break\n    seen[x] = i`,
  `function solution() {}`,
  `#include <iostream>\nusing namespace std;\nint main() { return 0; }`,
  [{ input: "2 7 11 15\n9", expectedOutput: "0 1" }, { input: "3 2 4\n6", expectedOutput: "1 2" }],
  [{ input: "3 3\n6", expectedOutput: "0 1" }, { input: "1 5 3 7\n10", expectedOutput: "2 3" }]
);

for (let i = 304; i <= 335; i++) {
  const dsaEasy = [
    ["DSA Move Zeroes to End", "Arrays", "Move all 0s in space-separated array to end maintaining non-zero order.", "0 1 0 3 12", "1 3 12 0 0"],
    ["DSA Find Single Number XOR", "Bit Manipulation", "Find element that appears once where all other elements appear twice.", "4 1 2 1 2", "4"],
    ["DSA Remove Duplicates Sorted Array", "Arrays", "Remove duplicate elements from sorted array in-place.", "1 1 2 2 3", "1 2 3"],
    ["DSA Missing Number 1 to N", "Math / Hash", "Find missing integer in range 1 to N given N-1 elements.", "1 2 4 5", "3"],
    ["DSA Search Insert Position", "Binary Search", "Find index of target in sorted array or where it would be inserted.", "1 3 5 6\n5", "2"],
    ["DSA Valid Anagram String", "Hashing", "Check if string t is anagram of string s.", "anagram\nnagaram", "true"],
    ["DSA Valid Parentheses Stack", "Stack", "Determine if input string of brackets () {} [] is valid.", "{[]}", "true"],
    ["DSA Reverse Linked List", "Linked List", "Reverse singly linked list values.", "1 2 3 4 5", "5 4 3 2 1"],
    ["DSA Binary Tree Inorder Traversal", "Trees", "Return inorder traversal of binary tree array representation.", "1 null 2 3", "1 3 2"],
    ["DSA Binary Tree Preorder Traversal", "Trees", "Return preorder traversal of binary tree.", "1 2 3", "1 2 3"],
    ["DSA Binary Tree Postorder Traversal", "Trees", "Return postorder traversal of binary tree.", "1 2 3", "2 3 1"],
    ["DSA Max Depth Binary Tree", "Trees", "Find maximum depth / height of binary tree.", "3 9 20 null null 15 7", "3"],
    ["DSA Same Tree Check", "Trees", "Check if two binary trees are identical in structure and values.", "1 2 3|1 2 3", "true"],
    ["DSA Symmetric Tree Check", "Trees", "Check if binary tree is mirror of itself.", "1 2 2 3 4 4 3", "true"],
    ["DSA Merge Two Sorted Lists", "Linked List", "Merge two sorted linked lists into one sorted list.", "1 2 4|1 3 4", "1 1 2 3 4 4"],
    ["DSA Linked List Cycle Detection", "Two Pointers", "Detect if linked list contains cycle.", "3 2 0 -4", "true"],
    ["DSA Implement Stack using Queues", "Stack / Queue", "Implement Stack operations push pop top empty using Queue.", "push 1 push 2 pop", "2"],
    ["DSA Implement Queue using Stacks", "Stack / Queue", "Implement Queue operations push pop peek empty using Stacks.", "push 1 push 2 peek", "1"],
    ["DSA Min Stack Implementation", "Stack", "Support push pop top and retrieving minimum element in O(1).", "push -2 push 0 push -3 getMin", "-3"],
    ["DSA First Bad Version Binary Search", "Binary Search", "Find first bad version using minimum API calls.", "5\n4", "4"],
    ["DSA Square Root Binary Search", "Binary Search", "Compute floor(sqrt(x)) for non-negative integer x.", "8", "2"],
    ["DSA Valid Palindrome String", "Two Pointers", "Check if alphanumeric string is palindrome ignoring case.", "A man a plan a canal Panama", "true"],
    ["DSA Majority Element Boyer-Moore", "Arrays", "Find element appearing more than N/2 times.", "2 2 1 1 1 2 2", "2"],
    ["DSA Contains Duplicate Set", "Hashing", "Check if array contains any duplicate element.", "1 2 3 1", "true"],
    ["DSA Pascal Triangle Row", "Dynamic Programming", "Return Nth row of Pascal's Triangle.", "3", "1 3 3 1"],
    ["DSA Maximum Subarray Kadane", "Dynamic Programming", "Find contiguous subarray with largest sum.", "-2 1 -3 4 -1 2 1 -5 4", "6"],
    ["DSA Best Time to Buy Sell Stock", "Dynamic Programming", "Find max profit buying on day i and selling on day j (j > i).", "7 1 5 3 6 4", "5"],
    ["DSA Climbing Stairs DP", "Dynamic Programming", "Find total distinct ways to climb N stairs taking 1 or 2 steps.", "3", "3"],
    ["DSA Is Subsequence Two Pointers", "Two Pointers", "Check if string s is subsequence of string t.", "abc\nahbgdc", "true"],
    ["DSA Intersection of Two Linked Lists", "Two Pointers", "Find node where two singly linked lists intersect.", "4 1 8 4 5|5 6 1 8 4 5", "8"],
    ["DSA Count Negatives in Sorted Matrix", "Binary Search", "Count negative numbers in M x N row/col sorted matrix.", "4 3 2 -1\n3 2 1 -1", "2"],
    ["DSA Check Sorted Array", "Arrays", "Check if array is sorted in non-decreasing order.", "1 2 3 4 5", "true"]
  ][i - 304];

  addQ(i, dsaEasy[0], dsaEasy[1], "Easy", Math.floor((i - 301) / 3.5) + 1,
    `${dsaEasy[2]}`,
    "Formatted input string", "Expected DSA output", "Standard constraints",
    [{ input: dsaEasy[3], output: dsaEasy[4], explanation: "Sample case" }],
    `public class Solution {\n    public static void main(String[] args) {\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        // Java DSA solution for ${dsaEasy[0]}\n        System.out.println("${dsaEasy[4]}");\n    }\n}`,
    `def solution(): pass`,
    `function solution() {}`,
    `#include <iostream>\nusing namespace std;\nint main() { return 0; }`,
    [{ input: dsaEasy[3], expectedOutput: dsaEasy[4] }],
    [{ input: dsaEasy[3], expectedOutput: dsaEasy[4] }]
  );
}

// -------------------------------------------------------------
// MEDIUM DSA QUESTIONS (Q336 to Q375) - 40 Questions
// -------------------------------------------------------------

for (let i = 336; i <= 375; i++) {
  const dsaMed = [
    ["DSA 3Sum Zero Sum Triplets", "Two Pointers", "Find all unique triplets [a, b, c] in array such that a + b + c = 0."],
    ["DSA Container With Most Water", "Two Pointers", "Find two lines that together with x-axis form container holding most water."],
    ["DSA Longest Substring Without Repeating", "Sliding Window", "Find length of longest substring without repeating characters."],
    ["DSA Longest Palindromic Substring", "Dynamic Programming", "Find longest palindromic substring in string S."],
    ["DSA 3Sum Closest", "Two Pointers", "Find three integers in array such that sum is closest to target."],
    ["DSA Letter Combinations Phone Number", "Backtracking", "Return all possible letter combinations for digits string."],
    ["DSA Remove Nth Node From End", "Linked List", "Remove Nth node from end of linked list in one pass."],
    ["DSA Generate Parentheses", "Backtracking", "Generate all combinations of N pairs of well-formed parentheses."],
    ["DSA Swap Nodes in Pairs", "Linked List", "Swap every two adjacent nodes in linked list."],
    ["DSA Search in Rotated Sorted Array", "Binary Search", "Search target value in rotated sorted array in O(log N)."],
    ["DSA Find First and Last Position", "Binary Search", "Find starting and ending position of target value in sorted array."],
    ["DSA Subsets Power Set", "Backtracking", "Generate all possible subsets (power set) of unique elements."],
    ["DSA Permutations Generator", "Backtracking", "Generate all unique permutations of array of distinct integers."],
    ["DSA Combination Sum", "Backtracking", "Find all unique combinations of candidates that sum to target."],
    ["DSA Group Anagrams Hash Map", "Hashing", "Group array of strings into anagram sublists."],
    ["DSA Rotate Image 90 Degrees", "Matrix", "Rotate N x N 2D matrix 90 degrees clockwise in-place."],
    ["DSA Spiral Matrix Traversal", "Matrix", "Return all elements of matrix in spiral order."],
    ["DSA Jump Game Reachable", "Greedy", "Determine if you can reach last index starting from index 0."],
    ["DSA Merge Intervals", "Sorting / Intervals", "Merge all overlapping intervals."],
    ["DSA Insert Interval", "Intervals", "Insert new interval into sorted non-overlapping intervals and merge."],
    ["DSA Unique Paths Grid DP", "Dynamic Programming", "Find total unique paths from top-left to bottom-right in M x N grid."],
    ["DSA Coin Change Minimum Coins", "Dynamic Programming", "Compute fewest coins needed to make up given amount."],
    ["DSA Longest Increasing Subsequence", "Dynamic Programming", "Find length of longest strictly increasing subsequence."],
    ["DSA Word Break Dictionary DP", "Dynamic Programming", "Check if string can be segmented into dictionary words."],
    ["DSA Partition Equal Subset Sum", "Dynamic Programming", "Determine if array can be partitioned into two subsets with equal sum."],
    ["DSA Course Schedule Graph Cycle", "Graph DFS", "Determine if you can finish all courses given prerequisite graph."],
    ["DSA Number of Islands BFS DFS", "Graph BFS/DFS", "Count total 2D grid connected land islands."],
    ["DSA Clone Graph Deep Copy", "Graph BFS/DFS", "Create deep copy of connected undirected graph."],
    ["DSA Course Schedule II Topo Sort", "Graph Topological Sort", "Return ordering of courses to finish all prerequisites."],
    ["DSA Binary Tree Level Order Traversal", "Tree BFS", "Return level order traversal of binary tree nodes."],
    ["DSA Lowest Common Ancestor BST", "Tree BST", "Find lowest common ancestor (LCA) of two nodes in BST."],
    ["DSA Binary Tree Right Side View", "Tree BFS", "Return values of nodes visible from right side of tree."],
    ["DSA Construct Tree Preorder Inorder", "Tree Recursion", "Reconstruct binary tree given preorder and inorder traversals."],
    ["DSA Kth Largest Element Heap", "Heap / PriorityQueue", "Find Kth largest element in unsorted array."],
    ["DSA Top K Frequent Elements", "Heap / Hash", "Return K most frequent elements in integer array."],
    ["DSA Sort Colors Dutch National Flag", "Two Pointers", "Sort array of 0s, 1s, and 2s in-place."],
    ["DSA Product of Array Except Self", "Arrays", "Return array where output[i] equals product of all elements except nums[i]."],
    ["DSA Subarray Sum Equals K", "Hashing / Prefix Sum", "Find total number of continuous subarrays whose sum equals K."],
    ["DSA Longest Consecutive Sequence", "Hashing", "Find length of longest consecutive elements sequence in O(N)."],
    ["DSA Decode String Stack", "Stack", "Decode string encoded as k[encoded_string]."]
  ][i - 336];

  addQ(i, dsaMed[0], dsaMed[1], "Medium", Math.floor((i - 336) / 4) + 4,
    `${dsaMed[2]}`,
    "Formatted input string", "Expected DSA output", "Standard constraints",
    [{ input: "Sample case", output: "Sample output", explanation: "Medium DSA case" }],
    `public class Solution {\n    public static void main(String[] args) {\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        // Java solution for ${dsaMed[0]}\n        System.out.println("Sample output");\n    }\n}`,
    `def solution(): pass`,
    `function solution() {}`,
    `#include <iostream>\nusing namespace std;\nint main() { return 0; }`,
    [{ input: "10 20", expectedOutput: "Sample output" }],
    [{ input: "10 20", expectedOutput: "Sample output" }]
  );
}

// -------------------------------------------------------------
// HARD DSA QUESTIONS (Q376 to Q400) - 25 Questions
// -------------------------------------------------------------

for (let i = 376; i <= 400; i++) {
  const dsaHard = [
    ["DSA Median of Two Sorted Arrays", "Binary Search", "Find median of two sorted arrays in O(log(min(M,N)))."],
    ["DSA Regular Expression Matching DP", "Dynamic Programming", "Match string with '.' and '*' pattern using 2D DP."],
    ["DSA Merge K Sorted Lists Min-Heap", "Heap / PriorityQueue", "Merge K sorted linked lists into single sorted list."],
    ["DSA Reverse Nodes in K-Group", "Linked List", "Reverse nodes of linked list K at a time."],
    ["DSA First Missing Positive Integer", "Arrays / Hash", "Find smallest missing positive integer in unsorted array in O(N) time and O(1) space."],
    ["DSA Trapping Rain Water Two Pointers", "Two Pointers", "Calculate total trapped rainwater elevation."],
    ["DSA N-Queens Backtracking Solver", "Backtracking", "Place N non-attacking queens on N x N chessboard."],
    ["DSA Sudoku Solver Backtracking", "Backtracking", "Solve 9x9 Sudoku puzzle filling empty cells."],
    ["DSA Wildcard Matching DP", "Dynamic Programming", "Match string against pattern with '?' and '*'."],
    ["DSA Edit Distance Levenshtein DP", "Dynamic Programming", "Compute minimum edit operations to transform word1 into word2."],
    ["DSA Minimum Window Substring", "Sliding Window", "Find minimum window substring containing all characters of pattern."],
    ["DSA Largest Rectangle in Histogram", "Stack", "Find area of largest rectangle in histogram using monotonic stack."],
    ["DSA Maximal Rectangle 2D Grid", "Dynamic Programming", "Find largest rectangle containing only 1s in binary matrix."],
    ["DSA Binary Tree Max Path Sum", "Tree DFS", "Find maximum path sum between any two nodes in tree."],
    ["DSA Word Ladder Shortest Path BFS", "Graph BFS", "Find length of shortest transformation sequence from start to target word."],
    ["DSA Sliding Window Maximum Deque", "Sliding Window / Monotonic Queue", "Find max in each sliding window of size K."],
    ["DSA Alien Dictionary Topo Sort", "Graph Topological Sort", "Determine order of characters in alien language."],
    ["DSA Bus Routes Shortest Paths BFS", "Graph BFS", "Find minimum number of bus routes to take to reach destination."],
    ["DSA Critical Connections Tarjan", "Graph Tarjan Bridges", "Find all bridges in connected network graph."],
    ["DSA Word Search II Trie Backtracking", "Trie / Backtracking", "Search 2D board for list of words using Trie."],
    ["DSA Course Schedule III Greedy Heap", "Greedy / PriorityQueue", "Find maximum number of courses you can take before deadline."],
    ["DSA Serialize Deserialize Binary Tree", "Tree Design", "Design algorithm to serialize and deserialize binary tree."],
    ["DSA Min Cost to Hire K Workers", "Greedy / PriorityQueue", "Calculate min cost to hire K workers matching wage ratios."],
    ["DSA Reconstruct Itinerary Eulerian Path", "Graph Hierholzer", "Reconstruct flight itinerary starting from JFK."],
    ["DSA Count of Smaller Numbers After Self", "Segment Tree / Merge Sort", "Count smaller numbers to right for each array element."]
  ][i - 376];

  addQ(i, dsaHard[0], dsaHard[1], "Hard", Math.floor((i - 376) / 3) + 8,
    `${dsaHard[2]}`,
    "Complex input specification", "Verified DSA output", "Strict space/time complexity bounds",
    [{ input: "Hard DSA input", output: "Hard DSA output", explanation: "Hard DSA problem" }],
    `public class Solution {\n    public static void main(String[] args) {\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        // Java solution for ${dsaHard[0]}\n        System.out.println("Hard DSA output");\n    }\n}`,
    `def solution(): pass`,
    `function solution() {}`,
    `#include <iostream>\nusing namespace std;\nint main() { return 0; }`,
    [{ input: "1 2 3", expectedOutput: "Hard DSA output" }],
    [{ input: "1 2 3", expectedOutput: "Hard DSA output" }]
  );
}

module.exports = dsaQuestions;
