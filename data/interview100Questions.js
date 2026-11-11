/**
 * Complete 100 Programming Interview Game Questions Dataset
 * Levels 1 to 10 (Q1 to Q100)
 * Generated automatically for CodeQuest Institute
 */

module.exports = [
  {
    "questionNumber": 1,
    "title": "Check Even or Odd",
    "category": "Programming Basics",
    "level": 1,
    "difficulty": "Easy",
    "problemStatement": "Given an integer `n`, return `'Even'` if it is divisible by 2, otherwise return `'Odd'`.",
    "inputFormat": "Integer n",
    "outputFormat": "String ('Even' or 'Odd')",
    "constraints": "-10^9 <= n <= 10^9",
    "examples": [
      {
        "input": "4",
        "output": "Even",
        "explanation": "4 is divisible by 2."
      },
      {
        "input": "7",
        "output": "Odd",
        "explanation": "7 has remainder 1."
      }
    ],
    "starterCode": {
      "javascript": "function solution(n) {\n  return n % 2 === 0 ? 'Even' : 'Odd';\n}",
      "python": "def solution(n):\n    return 'Even' if n % 2 == 0 else 'Odd'",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        int n = sc.nextInt();\n        System.out.println(n % 2 == 0 ? \"Even\" : \"Odd\");\n    }\n}"
    },
    "hints": [
      "Use the modulus operator (%).",
      "Check remainder when divided by 2.",
      "n % 2 == 0 means Even."
    ],
    "xp": 10,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Programming Basics",
      "Easy"
    ],
    "visibleTestCases": [
      {
        "input": "4",
        "expectedOutput": "Even",
        "explanation": "Visible test case"
      },
      {
        "input": "7",
        "expectedOutput": "Odd",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "0",
        "expectedOutput": "Even",
        "explanation": "Hidden validation test"
      },
      {
        "input": "-11",
        "expectedOutput": "Odd",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 2,
    "title": "Find Largest of Two Numbers",
    "category": "Programming Basics",
    "level": 1,
    "difficulty": "Easy",
    "problemStatement": "Given two integers `[a, b]`, return the larger number.",
    "inputFormat": "Array [a, b]",
    "outputFormat": "Integer",
    "constraints": "-10^9 <= a, b <= 10^9",
    "examples": [
      {
        "input": "[10, 20]",
        "output": "20",
        "explanation": "20 is greater."
      },
      {
        "input": "[55, -3]",
        "output": "55",
        "explanation": "55 is greater."
      }
    ],
    "starterCode": {
      "javascript": "function solution(arr) {\n  const [a, b] = arr;\n  return a > b ? a : b;\n}",
      "python": "def solution(arr):\n    return max(arr)",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        String s = sc.nextLine().replaceAll(\"[\\[\\]\\\\s]\", \"\");\n        String[] p = s.split(\",\");\n        System.out.println(Math.max(Integer.parseInt(p[0]), Integer.parseInt(p[1])));\n    }\n}"
    },
    "hints": [
      "Compare a and b using > operator.",
      "Return a if a > b else b.",
      "Or use Math.max."
    ],
    "xp": 10,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Programming Basics",
      "Easy"
    ],
    "visibleTestCases": [
      {
        "input": "[10, 20]",
        "expectedOutput": "20",
        "explanation": "Visible test case"
      },
      {
        "input": "[55, -3]",
        "expectedOutput": "55",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "[-5, -1]",
        "expectedOutput": "-1",
        "explanation": "Hidden validation test"
      },
      {
        "input": "[100, 100]",
        "expectedOutput": "100",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 3,
    "title": "Find Largest of Three Numbers",
    "category": "Programming Basics",
    "level": 1,
    "difficulty": "Easy",
    "problemStatement": "Given three integers `[a, b, c]`, determine and return the largest of the three.",
    "inputFormat": "Array [a, b, c]",
    "outputFormat": "Integer",
    "constraints": "-10^9 <= a, b, c <= 10^9",
    "examples": [
      {
        "input": "[3, 7, 5]",
        "output": "7",
        "explanation": "7 is greatest."
      },
      {
        "input": "[-1, -5, -2]",
        "output": "-1",
        "explanation": "-1 is greatest."
      }
    ],
    "starterCode": {
      "javascript": "function solution(arr) {\n  return Math.max(...arr);\n}",
      "python": "def solution(arr):\n    return max(arr)",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        String s = sc.nextLine().replaceAll(\"[\\[\\]\\\\s]\", \"\");\n        String[] p = s.split(\",\");\n        int m = Integer.MIN_VALUE;\n        for (String x : p) m = Math.max(m, Integer.parseInt(x));\n        System.out.println(m);\n    }\n}"
    },
    "hints": [
      "Compare pairwise or use max function.",
      "Check if a >= b and a >= c.",
      "Keep a running maximum variable."
    ],
    "xp": 10,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Programming Basics",
      "Easy"
    ],
    "visibleTestCases": [
      {
        "input": "[3, 7, 5]",
        "expectedOutput": "7",
        "explanation": "Visible test case"
      },
      {
        "input": "[-1, -5, -2]",
        "expectedOutput": "-1",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "[42, 42, 42]",
        "expectedOutput": "42",
        "explanation": "Hidden validation test"
      },
      {
        "input": "[100, 200, 50]",
        "expectedOutput": "200",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 4,
    "title": "Check Positive, Negative, or Zero",
    "category": "Programming Basics",
    "level": 1,
    "difficulty": "Easy",
    "problemStatement": "Given integer `n`, return `'Positive'` if n > 0, `'Negative'` if n < 0, and `'Zero'` if n == 0.",
    "inputFormat": "Integer n",
    "outputFormat": "String",
    "constraints": "-10^9 <= n <= 10^9",
    "examples": [
      {
        "input": "15",
        "output": "Positive",
        "explanation": "15 > 0"
      },
      {
        "input": "-8",
        "output": "Negative",
        "explanation": "-8 < 0"
      }
    ],
    "starterCode": {
      "javascript": "function solution(n) {\n  if (n > 0) return 'Positive';\n  if (n < 0) return 'Negative';\n  return 'Zero';\n}",
      "python": "def solution(n):\n    return 'Positive' if n > 0 else 'Negative' if n < 0 else 'Zero'",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        int n = sc.nextInt();\n        System.out.println(n > 0 ? \"Positive\" : n < 0 ? \"Negative\" : \"Zero\");\n    }\n}"
    },
    "hints": [
      "Use if-else conditions.",
      "Check n > 0 first.",
      "Then check n < 0, else Zero."
    ],
    "xp": 10,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Programming Basics",
      "Easy"
    ],
    "visibleTestCases": [
      {
        "input": "15",
        "expectedOutput": "Positive",
        "explanation": "Visible test case"
      },
      {
        "input": "-8",
        "expectedOutput": "Negative",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "0",
        "expectedOutput": "Zero",
        "explanation": "Hidden validation test"
      },
      {
        "input": "-999",
        "expectedOutput": "Negative",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 5,
    "title": "Calculate Factorial",
    "category": "Programming Basics",
    "level": 1,
    "difficulty": "Easy",
    "problemStatement": "Given non-negative integer `n`, compute its factorial n! (0! = 1).",
    "inputFormat": "Integer n",
    "outputFormat": "Integer",
    "constraints": "0 <= n <= 12",
    "examples": [
      {
        "input": "5",
        "output": "120",
        "explanation": "5*4*3*2*1 = 120"
      },
      {
        "input": "0",
        "output": "1",
        "explanation": "0! = 1"
      }
    ],
    "starterCode": {
      "javascript": "function solution(n) {\n  let r = 1;\n  for (let i = 2; i <= n; i++) r *= i;\n  return r;\n}",
      "python": "def solution(n):\n    import math\n    return math.factorial(n)",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        int n = sc.nextInt();\n        long r = 1;\n        for (int i = 2; i <= n; i++) r *= i;\n        System.out.println(r);\n    }\n}"
    },
    "hints": [
      "Initialize result to 1.",
      "Loop from 2 to n.",
      "Multiply at each iteration."
    ],
    "xp": 10,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Programming Basics",
      "Easy"
    ],
    "visibleTestCases": [
      {
        "input": "5",
        "expectedOutput": "120",
        "explanation": "Visible test case"
      },
      {
        "input": "0",
        "expectedOutput": "1",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "1",
        "expectedOutput": "1",
        "explanation": "Hidden validation test"
      },
      {
        "input": "7",
        "expectedOutput": "5040",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 6,
    "title": "Print Multiplication Table",
    "category": "Programming Basics",
    "level": 1,
    "difficulty": "Easy",
    "problemStatement": "Given `n`, return the first 5 multiples [n*1, n*2, n*3, n*4, n*5].",
    "inputFormat": "Integer n",
    "outputFormat": "Array of 5 integers",
    "constraints": "1 <= n <= 1000",
    "examples": [
      {
        "input": "3",
        "output": "[3, 6, 9, 12, 15]",
        "explanation": "Multiples of 3"
      },
      {
        "input": "5",
        "output": "[5, 10, 15, 20, 25]",
        "explanation": "Multiples of 5"
      }
    ],
    "starterCode": {
      "javascript": "function solution(n) {\n  return [1, 2, 3, 4, 5].map(i => n * i);\n}",
      "python": "def solution(n):\n    return [n * i for i in range(1, 6)]",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        int n = sc.nextInt();\n        System.out.println(\"[\" + n + \", \" + (n*2) + \", \" + (n*3) + \", \" + (n*4) + \", \" + (n*5) + \"]\");\n    }\n}"
    },
    "hints": [
      "Iterate from 1 to 5.",
      "Multiply each by n.",
      "Collect in array."
    ],
    "xp": 10,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Programming Basics",
      "Easy"
    ],
    "visibleTestCases": [
      {
        "input": "3",
        "expectedOutput": "[3, 6, 9, 12, 15]",
        "explanation": "Visible test case"
      },
      {
        "input": "5",
        "expectedOutput": "[5, 10, 15, 20, 25]",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "10",
        "expectedOutput": "[10, 20, 30, 40, 50]",
        "explanation": "Hidden validation test"
      },
      {
        "input": "1",
        "expectedOutput": "[1, 2, 3, 4, 5]",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 7,
    "title": "Sum from 1 to N",
    "category": "Programming Basics",
    "level": 1,
    "difficulty": "Easy",
    "problemStatement": "Given positive integer `n`, compute sum of 1 to n.",
    "inputFormat": "Integer n",
    "outputFormat": "Integer",
    "constraints": "1 <= n <= 10^5",
    "examples": [
      {
        "input": "5",
        "output": "15",
        "explanation": "1+2+3+4+5=15"
      },
      {
        "input": "10",
        "output": "55",
        "explanation": "Sum is 55"
      }
    ],
    "starterCode": {
      "javascript": "function solution(n) {\n  return (n * (n + 1)) / 2;\n}",
      "python": "def solution(n):\n    return (n * (n + 1)) // 2",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        long n = sc.nextLong();\n        System.out.println(n * (n + 1) / 2);\n    }\n}"
    },
    "hints": [
      "Use Gauss sum formula.",
      "n * (n + 1) / 2.",
      "Or accumulate with a for loop."
    ],
    "xp": 10,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Programming Basics",
      "Easy"
    ],
    "visibleTestCases": [
      {
        "input": "5",
        "expectedOutput": "15",
        "explanation": "Visible test case"
      },
      {
        "input": "10",
        "expectedOutput": "55",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "100",
        "expectedOutput": "5050",
        "explanation": "Hidden validation test"
      },
      {
        "input": "1",
        "expectedOutput": "1",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 8,
    "title": "Reverse a Number",
    "category": "Programming Basics",
    "level": 1,
    "difficulty": "Easy",
    "problemStatement": "Given integer `n`, reverse its digits while preserving negative sign.",
    "inputFormat": "Integer n",
    "outputFormat": "Integer",
    "constraints": "-10^9 <= n <= 10^9",
    "examples": [
      {
        "input": "1234",
        "output": "4321",
        "explanation": "Reversed"
      },
      {
        "input": "-560",
        "output": "-65",
        "explanation": "Negative preserved"
      }
    ],
    "starterCode": {
      "javascript": "function solution(n) {\n  const s = n < 0 ? -1 : 1;\n  return s * parseInt(String(Math.abs(n)).split('').reverse().join(''), 10);\n}",
      "python": "def solution(n):\n    s = -1 if n < 0 else 1\n    return s * int(str(abs(n))[::-1])",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        int n = sc.nextInt();\n        int s = n < 0 ? -1 : 1;\n        n = Math.abs(n);\n        int r = 0;\n        while (n > 0) { r = r * 10 + n % 10; n /= 10; }\n        System.out.println(s * r);\n    }\n}"
    },
    "hints": [
      "Extract sign first.",
      "Extract last digit using n % 10.",
      "Shift previous reversed value by 10."
    ],
    "xp": 10,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Programming Basics",
      "Easy"
    ],
    "visibleTestCases": [
      {
        "input": "1234",
        "expectedOutput": "4321",
        "explanation": "Visible test case"
      },
      {
        "input": "-560",
        "expectedOutput": "-65",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "7",
        "expectedOutput": "7",
        "explanation": "Hidden validation test"
      },
      {
        "input": "1000",
        "expectedOutput": "1",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 9,
    "title": "Check Number Palindrome",
    "category": "Programming Basics",
    "level": 1,
    "difficulty": "Easy",
    "problemStatement": "Return `true` if `n` reads same forwards and backwards. Negative numbers are not palindromes.",
    "inputFormat": "Integer n",
    "outputFormat": "Boolean",
    "constraints": "-2^31 <= n <= 2^31 - 1",
    "examples": [
      {
        "input": "121",
        "output": "true",
        "explanation": "121 reads same"
      },
      {
        "input": "-121",
        "output": "false",
        "explanation": "Negative cannot be palindrome"
      }
    ],
    "starterCode": {
      "javascript": "function solution(n) {\n  if (n < 0) return false;\n  const s = String(n);\n  return s === s.split('').reverse().join('');\n}",
      "python": "def solution(n):\n    if n < 0: return False\n    return str(n) == str(n)[::-1]",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        int n = sc.nextInt();\n        if (n < 0) { System.out.println(\"false\"); return; }\n        String s = String.valueOf(n);\n        System.out.println(s.equals(new StringBuilder(s).reverse().toString()) ? \"true\" : \"false\");\n    }\n}"
    },
    "hints": [
      "Negative numbers cannot be palindromes.",
      "Reverse the digits and compare.",
      "Or compare string representations."
    ],
    "xp": 10,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Programming Basics",
      "Easy"
    ],
    "visibleTestCases": [
      {
        "input": "121",
        "expectedOutput": "true",
        "explanation": "Visible test case"
      },
      {
        "input": "-121",
        "expectedOutput": "false",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "10",
        "expectedOutput": "false",
        "explanation": "Hidden validation test"
      },
      {
        "input": "12321",
        "expectedOutput": "true",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 10,
    "title": "Check Armstrong Number",
    "category": "Programming Basics",
    "level": 1,
    "difficulty": "Easy",
    "problemStatement": "Return `true` if sum of digits raised to power k (num digits) equals n.",
    "inputFormat": "Integer n",
    "outputFormat": "Boolean",
    "constraints": "1 <= n <= 10^7",
    "examples": [
      {
        "input": "153",
        "output": "true",
        "explanation": "1^3 + 5^3 + 3^3 = 153"
      },
      {
        "input": "120",
        "output": "false",
        "explanation": "Not Armstrong"
      }
    ],
    "starterCode": {
      "javascript": "function solution(n) {\n  const s = String(n);\n  const k = s.length;\n  return s.split('').reduce((a, d) => a + Math.pow(Number(d), k), 0) === n;\n}",
      "python": "def solution(n):\n    s = str(n)\n    return sum(int(d)**len(s) for d in s) == n",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        int n = sc.nextInt();\n        String s = String.valueOf(n);\n        int k = s.length(), sum = 0;\n        for (char c : s.toCharArray()) sum += Math.pow(c - '0', k);\n        System.out.println(sum == n ? \"true\" : \"false\");\n    }\n}"
    },
    "hints": [
      "Find total number of digits k.",
      "Sum each digit^k.",
      "Compare with original n."
    ],
    "xp": 10,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Programming Basics",
      "Easy"
    ],
    "visibleTestCases": [
      {
        "input": "153",
        "expectedOutput": "true",
        "explanation": "Visible test case"
      },
      {
        "input": "120",
        "expectedOutput": "false",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "371",
        "expectedOutput": "true",
        "explanation": "Hidden validation test"
      },
      {
        "input": "9474",
        "expectedOutput": "true",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 11,
    "title": "Count Digits",
    "category": "Number Logic",
    "level": 2,
    "difficulty": "Easy",
    "problemStatement": "Given integer `n`, return count of digits. Use absolute value for negatives.",
    "inputFormat": "Integer n",
    "outputFormat": "Integer",
    "constraints": "-10^9 <= n <= 10^9",
    "examples": [
      {
        "input": "1567",
        "output": "4",
        "explanation": "4 digits"
      },
      {
        "input": "0",
        "output": "1",
        "explanation": "0 has 1 digit"
      }
    ],
    "starterCode": {
      "javascript": "function solution(n) { return Math.abs(n).toString().length; }",
      "python": "def solution(n): return len(str(abs(n)))",
      "java": "public class Solution { public static void main(String[] a) { System.out.println(String.valueOf(Math.abs(new java.util.Scanner(System.in).nextLong())).length()); } }"
    },
    "hints": [
      "Convert to string or divide by 10 in a loop.",
      "Handle 0 having 1 digit.",
      "Use absolute value."
    ],
    "xp": 10,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Number Logic",
      "Easy"
    ],
    "visibleTestCases": [
      {
        "input": "1567",
        "expectedOutput": "4",
        "explanation": "Visible test case"
      },
      {
        "input": "0",
        "expectedOutput": "1",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "-99999",
        "expectedOutput": "5",
        "explanation": "Hidden validation test"
      },
      {
        "input": "1000000",
        "expectedOutput": "7",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 12,
    "title": "Sum of Digits",
    "category": "Number Logic",
    "level": 2,
    "difficulty": "Easy",
    "problemStatement": "Given non-negative integer `n`, return sum of its digits.",
    "inputFormat": "Integer n",
    "outputFormat": "Integer",
    "constraints": "0 <= n <= 10^9",
    "examples": [
      {
        "input": "1234",
        "output": "10",
        "explanation": "1+2+3+4 = 10"
      },
      {
        "input": "99",
        "output": "18",
        "explanation": "9+9 = 18"
      }
    ],
    "starterCode": {
      "javascript": "function solution(n) { return String(Math.abs(n)).split('').reduce((s,d)=>s+Number(d), 0); }",
      "python": "def solution(n): return sum(int(d) for d in str(abs(n)))",
      "java": "public class Solution { public static void main(String[] a) { int n=Math.abs(new java.util.Scanner(System.in).nextInt()), s=0; while(n>0){s+=n%10; n/=10;} System.out.println(s); } }"
    },
    "hints": [
      "Extract digits using % 10.",
      "Accumulate sum.",
      "Divide by 10."
    ],
    "xp": 10,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Number Logic",
      "Easy"
    ],
    "visibleTestCases": [
      {
        "input": "1234",
        "expectedOutput": "10",
        "explanation": "Visible test case"
      },
      {
        "input": "99",
        "expectedOutput": "18",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "999",
        "expectedOutput": "27",
        "explanation": "Hidden validation test"
      },
      {
        "input": "50505",
        "expectedOutput": "15",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 13,
    "title": "Largest Digit",
    "category": "Number Logic",
    "level": 2,
    "difficulty": "Easy",
    "problemStatement": "Given integer `n`, return the largest digit present.",
    "inputFormat": "Integer n",
    "outputFormat": "Integer",
    "constraints": "-10^9 <= n <= 10^9",
    "examples": [
      {
        "input": "48291",
        "output": "9",
        "explanation": "9 is max digit"
      },
      {
        "input": "105",
        "output": "5",
        "explanation": "5 is max digit"
      }
    ],
    "starterCode": {
      "javascript": "function solution(n) { return Math.max(...String(Math.abs(n)).split('').map(Number)); }",
      "python": "def solution(n): return max(int(d) for d in str(abs(n)))",
      "java": "public class Solution { public static void main(String[] a) { int n=Math.abs(new java.util.Scanner(System.in).nextInt()), m=0; while(n>0){m=Math.max(m, n%10); n/=10;} System.out.println(m); } }"
    },
    "hints": [
      "Iterate through digits.",
      "Keep track of max.",
      "Return max digit."
    ],
    "xp": 10,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Number Logic",
      "Easy"
    ],
    "visibleTestCases": [
      {
        "input": "48291",
        "expectedOutput": "9",
        "explanation": "Visible test case"
      },
      {
        "input": "105",
        "expectedOutput": "5",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "777",
        "expectedOutput": "7",
        "explanation": "Hidden validation test"
      },
      {
        "input": "87654",
        "expectedOutput": "8",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 14,
    "title": "Smallest Digit",
    "category": "Number Logic",
    "level": 2,
    "difficulty": "Easy",
    "problemStatement": "Given integer `n`, return smallest digit.",
    "inputFormat": "Integer n",
    "outputFormat": "Integer",
    "constraints": "-10^9 <= n <= 10^9",
    "examples": [
      {
        "input": "48291",
        "output": "1",
        "explanation": "1 is min digit"
      },
      {
        "input": "957",
        "output": "5",
        "explanation": "5 is min digit"
      }
    ],
    "starterCode": {
      "javascript": "function solution(n) { return Math.min(...String(Math.abs(n)).split('').map(Number)); }",
      "python": "def solution(n): return min(int(d) for d in str(abs(n)))",
      "java": "public class Solution { public static void main(String[] a) { int n=Math.abs(new java.util.Scanner(System.in).nextInt()), m=9; while(n>0){m=Math.min(m, n%10); n/=10;} System.out.println(m); } }"
    },
    "hints": [
      "Initialize min to 9.",
      "Compare each digit.",
      "Return min digit."
    ],
    "xp": 10,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Number Logic",
      "Easy"
    ],
    "visibleTestCases": [
      {
        "input": "48291",
        "expectedOutput": "1",
        "explanation": "Visible test case"
      },
      {
        "input": "957",
        "expectedOutput": "5",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "809",
        "expectedOutput": "0",
        "explanation": "Hidden validation test"
      },
      {
        "input": "888",
        "expectedOutput": "8",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 15,
    "title": "Check Prime Number",
    "category": "Number Logic",
    "level": 2,
    "difficulty": "Easy",
    "problemStatement": "Return `true` if `n` is prime, else `false`.",
    "inputFormat": "Integer n",
    "outputFormat": "Boolean",
    "constraints": "1 <= n <= 10^9",
    "examples": [
      {
        "input": "7",
        "output": "true",
        "explanation": "7 is prime"
      },
      {
        "input": "12",
        "output": "false",
        "explanation": "12 is composite"
      }
    ],
    "starterCode": {
      "javascript": "function solution(n) { if(n<=1)return false; for(let i=2;i*i<=n;i++) if(n%i===0)return false; return true; }",
      "python": "def solution(n): return n>1 and all(n%i!=0 for i in range(2, int(n**0.5)+1))",
      "java": "public class Solution { public static void main(String[] a) { int n=new java.util.Scanner(System.in).nextInt(); if(n<=1){System.out.println(\"false\");return;} for(int i=2;i*i<=n;i++)if(n%i==0){System.out.println(\"false\");return;} System.out.println(\"true\"); } }"
    },
    "hints": [
      "Check divisibility up to sqrt(n).",
      "Numbers <= 1 are not prime.",
      "If no divisor found, prime."
    ],
    "xp": 10,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Number Logic",
      "Easy"
    ],
    "visibleTestCases": [
      {
        "input": "7",
        "expectedOutput": "true",
        "explanation": "Visible test case"
      },
      {
        "input": "12",
        "expectedOutput": "false",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "1",
        "expectedOutput": "false",
        "explanation": "Hidden validation test"
      },
      {
        "input": "97",
        "expectedOutput": "true",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 16,
    "title": "Print Primes up to N",
    "category": "Number Logic",
    "level": 2,
    "difficulty": "Easy",
    "problemStatement": "Return list of prime numbers <= n.",
    "inputFormat": "Integer n",
    "outputFormat": "Array of integers",
    "constraints": "2 <= n <= 1000",
    "examples": [
      {
        "input": "10",
        "output": "[2, 3, 5, 7]",
        "explanation": "Primes <= 10"
      },
      {
        "input": "5",
        "output": "[2, 3, 5]",
        "explanation": "Primes <= 5"
      }
    ],
    "starterCode": {
      "javascript": "function solution(n) { const r=[]; for(let i=2;i<=n;i++){ let p=true; for(let j=2;j*j<=i;j++) if(i%j===0){p=false;break;} if(p) r.push(i); } return r; }",
      "python": "def solution(n): return [i for i in range(2, n+1) if all(i%j!=0 for j in range(2, int(i**0.5)+1))]",
      "java": "import java.util.*; public class Solution { public static void main(String[] a) { int n=new Scanner(System.in).nextInt(); List<Integer> l=new ArrayList<>(); for(int i=2;i<=n;i++){ boolean p=true; for(int j=2;j*j<=i;j++) if(i%j==0){p=false;break;} if(p)l.add(i); } System.out.println(l); } }"
    },
    "hints": [
      "Loop from 2 to n.",
      "Check if each is prime.",
      "Add to results."
    ],
    "xp": 10,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Number Logic",
      "Easy"
    ],
    "visibleTestCases": [
      {
        "input": "10",
        "expectedOutput": "[2, 3, 5, 7]",
        "explanation": "Visible test case"
      },
      {
        "input": "5",
        "expectedOutput": "[2, 3, 5]",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "20",
        "expectedOutput": "[2, 3, 5, 7, 11, 13, 17, 19]",
        "explanation": "Hidden validation test"
      },
      {
        "input": "2",
        "expectedOutput": "[2]",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 17,
    "title": "Find GCD",
    "category": "Number Logic",
    "level": 2,
    "difficulty": "Easy",
    "problemStatement": "Given `[a, b]`, return Greatest Common Divisor.",
    "inputFormat": "Array [a, b]",
    "outputFormat": "Integer",
    "constraints": "1 <= a, b <= 10^9",
    "examples": [
      {
        "input": "[12, 18]",
        "output": "6",
        "explanation": "GCD is 6"
      },
      {
        "input": "[20, 25]",
        "output": "5",
        "explanation": "GCD is 5"
      }
    ],
    "starterCode": {
      "javascript": "function solution(arr) { let [a, b]=arr; while(b){ let t=b; b=a%b; a=t; } return a; }",
      "python": "def solution(arr): import math; return math.gcd(arr[0], arr[1])",
      "java": "public class Solution { public static void main(String[] args) { java.util.Scanner sc=new java.util.Scanner(System.in); String[] p=sc.nextLine().replaceAll(\"[\\[\\]\\\\s]\", \"\").split(\",\"); int a=Integer.parseInt(p[0]), b=Integer.parseInt(p[1]); while(b!=0){int t=b; b=a%b; a=t;} System.out.println(a); } }"
    },
    "hints": [
      "Use Euclid's algorithm: gcd(a, b) = gcd(b, a % b).",
      "Loop until b is 0.",
      "Return a."
    ],
    "xp": 10,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Number Logic",
      "Easy"
    ],
    "visibleTestCases": [
      {
        "input": "[12, 18]",
        "expectedOutput": "6",
        "explanation": "Visible test case"
      },
      {
        "input": "[20, 25]",
        "expectedOutput": "5",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "[17, 19]",
        "expectedOutput": "1",
        "explanation": "Hidden validation test"
      },
      {
        "input": "[100, 20]",
        "expectedOutput": "20",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 18,
    "title": "Find LCM",
    "category": "Number Logic",
    "level": 2,
    "difficulty": "Easy",
    "problemStatement": "Given `[a, b]`, return Least Common Multiple.",
    "inputFormat": "Array [a, b]",
    "outputFormat": "Integer",
    "constraints": "1 <= a, b <= 10^6",
    "examples": [
      {
        "input": "[4, 6]",
        "output": "12",
        "explanation": "LCM is 12"
      },
      {
        "input": "[5, 7]",
        "output": "35",
        "explanation": "LCM is 35"
      }
    ],
    "starterCode": {
      "javascript": "function solution(arr) { const gcd=(x,y)=>y===0?x:gcd(y, x%y); return Math.abs(arr[0]*arr[1])/gcd(arr[0], arr[1]); }",
      "python": "def solution(arr): import math; return abs(arr[0]*arr[1])//math.gcd(arr[0], arr[1])",
      "java": "public class Solution { public static void main(String[] a) { java.util.Scanner sc=new java.util.Scanner(System.in); String[] p=sc.nextLine().replaceAll(\"[\\[\\]\\\\s]\", \"\").split(\",\"); int x=Integer.parseInt(p[0]), y=Integer.parseInt(p[1]), a1=x, b1=y; while(b1!=0){int t=b1; b1=a1%b1; a1=t;} System.out.println(Math.abs(x*y)/a1); } }"
    },
    "hints": [
      "LCM(a, b) = (a * b) / GCD(a, b).",
      "Calculate GCD first.",
      "Divide product by GCD."
    ],
    "xp": 10,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Number Logic",
      "Easy"
    ],
    "visibleTestCases": [
      {
        "input": "[4, 6]",
        "expectedOutput": "12",
        "explanation": "Visible test case"
      },
      {
        "input": "[5, 7]",
        "expectedOutput": "35",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "[10, 15]",
        "expectedOutput": "30",
        "explanation": "Hidden validation test"
      },
      {
        "input": "[12, 24]",
        "expectedOutput": "24",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 19,
    "title": "Fibonacci Series Nth Term",
    "category": "Number Logic",
    "level": 2,
    "difficulty": "Easy",
    "problemStatement": "Return the N-th Fibonacci number F(n) where F(0)=0, F(1)=1.",
    "inputFormat": "Integer n",
    "outputFormat": "Integer",
    "constraints": "0 <= n <= 30",
    "examples": [
      {
        "input": "6",
        "output": "8",
        "explanation": "F(6) = 8"
      },
      {
        "input": "4",
        "output": "3",
        "explanation": "F(4) = 3"
      }
    ],
    "starterCode": {
      "javascript": "function solution(n) { if(n<=0)return 0; if(n===1)return 1; let a=0,b=1; for(let i=2;i<=n;i++){let c=a+b; a=b; b=c;} return b; }",
      "python": "def solution(n): a, b = 0, 1\n for _ in range(n): a, b = b, a+b\n return a",
      "java": "public class Solution { public static void main(String[] a) { int n=new java.util.Scanner(System.in).nextInt(); if(n<=0){System.out.println(0);return;} int x=0, y=1; for(int i=2;i<=n;i++){int c=x+y; x=y; y=c;} System.out.println(y); } }"
    },
    "hints": [
      "Track previous two values.",
      "Loop up to n.",
      "Update a = b, b = a + b."
    ],
    "xp": 10,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Number Logic",
      "Easy"
    ],
    "visibleTestCases": [
      {
        "input": "6",
        "expectedOutput": "8",
        "explanation": "Visible test case"
      },
      {
        "input": "4",
        "expectedOutput": "3",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "0",
        "expectedOutput": "0",
        "explanation": "Hidden validation test"
      },
      {
        "input": "10",
        "expectedOutput": "55",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 20,
    "title": "Check Fibonacci Number",
    "category": "Number Logic",
    "level": 2,
    "difficulty": "Easy",
    "problemStatement": "Return `true` if integer `n` belongs to Fibonacci series, else `false`.",
    "inputFormat": "Integer n",
    "outputFormat": "Boolean",
    "constraints": "0 <= n <= 10^9",
    "examples": [
      {
        "input": "8",
        "output": "true",
        "explanation": "8 is in Fibonacci"
      },
      {
        "input": "9",
        "output": "false",
        "explanation": "9 is not in Fibonacci"
      }
    ],
    "starterCode": {
      "javascript": "function solution(n) { const isSq=x=>Math.sqrt(x)%1===0; return isSq(5*n*n+4) || isSq(5*n*n-4); }",
      "python": "def solution(n): import math\n is_sq=lambda x: x>=0 and int(math.isqrt(x))**2==x\n return is_sq(5*n*n+4) or is_sq(5*n*n-4)",
      "java": "public class Solution { public static void main(String[] a) { long n=new java.util.Scanner(System.in).nextLong(); System.out.println(isSq(5*n*n+4)||isSq(5*n*n-4)?\"true\":\"false\"); } static boolean isSq(long x){ if(x<0)return false; long s=(long)Math.sqrt(x); return s*s==x; } }"
    },
    "hints": [
      "Property: 5N^2 + 4 or 5N^2 - 4 must be perfect square.",
      "Or generate sequence until reaching n.",
      "Check if generated equals n."
    ],
    "xp": 10,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Number Logic",
      "Easy"
    ],
    "visibleTestCases": [
      {
        "input": "8",
        "expectedOutput": "true",
        "explanation": "Visible test case"
      },
      {
        "input": "9",
        "expectedOutput": "false",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "34",
        "expectedOutput": "true",
        "explanation": "Hidden validation test"
      },
      {
        "input": "14",
        "expectedOutput": "false",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 21,
    "title": "Reverse a String",
    "category": "Strings",
    "level": 3,
    "difficulty": "Easy",
    "problemStatement": "Reverse a string without built-in reverse method.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "\"hello\"",
        "output": "\"olleh\"",
        "explanation": "Sample test case 1 for Reverse a String."
      },
      {
        "input": "\"world\"",
        "output": "\"dlrow\"",
        "explanation": "Sample test case 2 for Reverse a String."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return s.split('').reverse().join('');\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return s[::-1]",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        new StringBuilder(s).reverse().toString()\n    }\n}"
    },
    "hints": [
      "Loop backwards from end to start.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 10,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Strings",
      "Easy"
    ],
    "visibleTestCases": [
      {
        "input": "\"hello\"",
        "expectedOutput": "\"olleh\"",
        "explanation": "Visible test case"
      },
      {
        "input": "\"world\"",
        "expectedOutput": "\"dlrow\"",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "\"hello\"",
        "expectedOutput": "\"olleh\"",
        "explanation": "Hidden validation test"
      },
      {
        "input": "\"world\"",
        "expectedOutput": "\"dlrow\"",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 22,
    "title": "Check String Palindrome",
    "category": "Strings",
    "level": 3,
    "difficulty": "Easy",
    "problemStatement": "Check if string reads same forward and backward.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "\"radar\"",
        "output": "true",
        "explanation": "Sample test case 1 for Check String Palindrome."
      },
      {
        "input": "\"hello\"",
        "output": "false",
        "explanation": "Sample test case 2 for Check String Palindrome."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return s === s.split('').reverse().join('');\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return s == s[::-1]",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        s.equals(new StringBuilder(s).reverse().toString())\n    }\n}"
    },
    "hints": [
      "Compare chars from both ends towards center.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 10,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Strings",
      "Easy"
    ],
    "visibleTestCases": [
      {
        "input": "\"radar\"",
        "expectedOutput": "true",
        "explanation": "Visible test case"
      },
      {
        "input": "\"hello\"",
        "expectedOutput": "false",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "\"radar\"",
        "expectedOutput": "true",
        "explanation": "Hidden validation test"
      },
      {
        "input": "\"hello\"",
        "expectedOutput": "false",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 23,
    "title": "Count Vowels and Consonants",
    "category": "Strings",
    "level": 3,
    "difficulty": "Easy",
    "problemStatement": "Count vowels in a string (case insensitive).",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "\"CodeQuest\"",
        "output": "4",
        "explanation": "Sample test case 1 for Count Vowels and Consonants."
      },
      {
        "input": "\"fly\"",
        "output": "0",
        "explanation": "Sample test case 2 for Count Vowels and Consonants."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return (s.match(/[aeiou]/gi)||[]).length;\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return sum(1 for c in s.lower() if c in 'aeiou')",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        s.replaceAll(\"(?i)[^aeiou]\", \"\").length()\n    }\n}"
    },
    "hints": [
      "Iterate chars and check membership in aeiou.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 10,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Strings",
      "Easy"
    ],
    "visibleTestCases": [
      {
        "input": "\"CodeQuest\"",
        "expectedOutput": "4",
        "explanation": "Visible test case"
      },
      {
        "input": "\"fly\"",
        "expectedOutput": "0",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "\"CodeQuest\"",
        "expectedOutput": "4",
        "explanation": "Hidden validation test"
      },
      {
        "input": "\"fly\"",
        "expectedOutput": "0",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 24,
    "title": "Character Frequency",
    "category": "Strings",
    "level": 3,
    "difficulty": "Easy",
    "problemStatement": "Return frequency of char 'a' in string.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "[\"banana\", \"a\"]",
        "output": "3",
        "explanation": "Sample test case 1 for Character Frequency."
      },
      {
        "input": "[\"hello\", \"z\"]",
        "output": "0",
        "explanation": "Sample test case 2 for Character Frequency."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return arr[0].split('').filter(c=>c===arr[1]).length;\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return arr[0].count(arr[1])",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        arr[0].length() - arr[0].replace(arr[1], \"\").length()\n    }\n}"
    },
    "hints": [
      "Count occurrences of the target char.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 10,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Strings",
      "Easy"
    ],
    "visibleTestCases": [
      {
        "input": "[\"banana\", \"a\"]",
        "expectedOutput": "3",
        "explanation": "Visible test case"
      },
      {
        "input": "[\"hello\", \"z\"]",
        "expectedOutput": "0",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "[\"banana\", \"a\"]",
        "expectedOutput": "3",
        "explanation": "Hidden validation test"
      },
      {
        "input": "[\"hello\", \"z\"]",
        "expectedOutput": "0",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 25,
    "title": "First Non-Repeating Character",
    "category": "Strings",
    "level": 3,
    "difficulty": "Easy",
    "problemStatement": "Find first character that occurs only once. Return '$' if none.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "\"swiss\"",
        "output": "\"w\"",
        "explanation": "Sample test case 1 for First Non-Repeating Character."
      },
      {
        "input": "\"aabb\"",
        "output": "\"$\"",
        "explanation": "Sample test case 2 for First Non-Repeating Character."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return (function(){ for(let c of s) if(s.indexOf(c)===s.lastIndexOf(c)) return c; return '$'; })();\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return next((c for c in s if s.count(c)==1), '$')",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        for(char c: s.toCharArray()) if(s.indexOf(c)==s.lastIndexOf(c)) return String.valueOf(c); return \"$\";\n    }\n}"
    },
    "hints": [
      "Use frequency map or indexOf/lastIndexOf.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 10,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Strings",
      "Easy"
    ],
    "visibleTestCases": [
      {
        "input": "\"swiss\"",
        "expectedOutput": "\"w\"",
        "explanation": "Visible test case"
      },
      {
        "input": "\"aabb\"",
        "expectedOutput": "\"$\"",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "\"swiss\"",
        "expectedOutput": "\"w\"",
        "explanation": "Hidden validation test"
      },
      {
        "input": "\"aabb\"",
        "expectedOutput": "\"$\"",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 26,
    "title": "First Repeated Character",
    "category": "Strings",
    "level": 3,
    "difficulty": "Easy",
    "problemStatement": "Find first character that repeats. Return '$' if none.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "\"geeks\"",
        "output": "\"e\"",
        "explanation": "Sample test case 1 for First Repeated Character."
      },
      {
        "input": "\"abc\"",
        "output": "\"$\"",
        "explanation": "Sample test case 2 for First Repeated Character."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return (function(){ const set=new Set(); for(let c of s){if(set.has(c))return c; set.add(c);} return '$'; })();\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return (function(){ s_seen=set()\n for c in s:\n  if c in s_seen: return c\n  s_seen.add(c)\n return '$' })()",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        Set<Character> set=new HashSet<>(); for(char c: s.toCharArray()){ if(set.contains(c)) return String.valueOf(c); set.add(c); } return \"$\";\n    }\n}"
    },
    "hints": [
      "Use a Set to track visited characters.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 10,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Strings",
      "Easy"
    ],
    "visibleTestCases": [
      {
        "input": "\"geeks\"",
        "expectedOutput": "\"e\"",
        "explanation": "Visible test case"
      },
      {
        "input": "\"abc\"",
        "expectedOutput": "\"$\"",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "\"geeks\"",
        "expectedOutput": "\"e\"",
        "explanation": "Hidden validation test"
      },
      {
        "input": "\"abc\"",
        "expectedOutput": "\"$\"",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 27,
    "title": "Remove Duplicate Characters",
    "category": "Strings",
    "level": 3,
    "difficulty": "Easy",
    "problemStatement": "Remove duplicates maintaining first occurrence order.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "\"programming\"",
        "output": "\"progamin\"",
        "explanation": "Sample test case 1 for Remove Duplicate Characters."
      },
      {
        "input": "\"aabbcc\"",
        "output": "\"abc\"",
        "explanation": "Sample test case 2 for Remove Duplicate Characters."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return [...new Set(s)].join('');\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return ''.join(dict.fromkeys(s))",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        StringBuilder sb=new StringBuilder(); for(char c: s.toCharArray()) if(sb.indexOf(String.valueOf(c))==-1) sb.append(c); return sb.toString();\n    }\n}"
    },
    "hints": [
      "Keep a Set of seen characters and append unseen.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 10,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Strings",
      "Easy"
    ],
    "visibleTestCases": [
      {
        "input": "\"programming\"",
        "expectedOutput": "\"progamin\"",
        "explanation": "Visible test case"
      },
      {
        "input": "\"aabbcc\"",
        "expectedOutput": "\"abc\"",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "\"programming\"",
        "expectedOutput": "\"progamin\"",
        "explanation": "Hidden validation test"
      },
      {
        "input": "\"aabbcc\"",
        "expectedOutput": "\"abc\"",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 28,
    "title": "Check Anagrams",
    "category": "Strings",
    "level": 3,
    "difficulty": "Easy",
    "problemStatement": "Check if two strings are anagrams of each other.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "[\"listen\", \"silent\"]",
        "output": "true",
        "explanation": "Sample test case 1 for Check Anagrams."
      },
      {
        "input": "[\"hello\", \"world\"]",
        "output": "false",
        "explanation": "Sample test case 2 for Check Anagrams."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return arr[0].split('').sort().join('') === arr[1].split('').sort().join('');\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return sorted(arr[0]) == sorted(arr[1])",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        Arrays.equals(arr[0].chars().sorted().toArray(), arr[1].chars().sorted().toArray())\n    }\n}"
    },
    "hints": [
      "Sort both strings or compare character counts.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 10,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Strings",
      "Easy"
    ],
    "visibleTestCases": [
      {
        "input": "[\"listen\", \"silent\"]",
        "expectedOutput": "true",
        "explanation": "Visible test case"
      },
      {
        "input": "[\"hello\", \"world\"]",
        "expectedOutput": "false",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "[\"listen\", \"silent\"]",
        "expectedOutput": "true",
        "explanation": "Hidden validation test"
      },
      {
        "input": "[\"hello\", \"world\"]",
        "expectedOutput": "false",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 29,
    "title": "Find Longest Word",
    "category": "Strings",
    "level": 3,
    "difficulty": "Easy",
    "problemStatement": "Return longest word in a sentence.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "\"I love competitive coding\"",
        "output": "\"competitive\"",
        "explanation": "Sample test case 1 for Find Longest Word."
      },
      {
        "input": "\"fast cat\"",
        "output": "\"fast\"",
        "explanation": "Sample test case 2 for Find Longest Word."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return s.split(' ').reduce((m,w)=>w.length>m.length?w:m, '');\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return max(s.split(), key=len)",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        String[] w=s.split(\" \"); String m=\"\"; for(String x:w) if(x.length()>m.length()) m=x; return m;\n    }\n}"
    },
    "hints": [
      "Split by space and find word with max length.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 10,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Strings",
      "Easy"
    ],
    "visibleTestCases": [
      {
        "input": "\"I love competitive coding\"",
        "expectedOutput": "\"competitive\"",
        "explanation": "Visible test case"
      },
      {
        "input": "\"fast cat\"",
        "expectedOutput": "\"fast\"",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "\"I love competitive coding\"",
        "expectedOutput": "\"competitive\"",
        "explanation": "Hidden validation test"
      },
      {
        "input": "\"fast cat\"",
        "expectedOutput": "\"fast\"",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 30,
    "title": "Count Words in Sentence",
    "category": "Strings",
    "level": 3,
    "difficulty": "Easy",
    "problemStatement": "Return number of words in a sentence.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "\"Learn play build and excel\"",
        "output": "5",
        "explanation": "Sample test case 1 for Count Words in Sentence."
      },
      {
        "input": "\"Hello world\"",
        "output": "2",
        "explanation": "Sample test case 2 for Count Words in Sentence."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return s.trim().split(/\\s+/).filter(Boolean).length;\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return len(s.split())",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        s.trim().split(\"\\\\s+\").length\n    }\n}"
    },
    "hints": [
      "Split by whitespace and count tokens.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 10,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Strings",
      "Easy"
    ],
    "visibleTestCases": [
      {
        "input": "\"Learn play build and excel\"",
        "expectedOutput": "5",
        "explanation": "Visible test case"
      },
      {
        "input": "\"Hello world\"",
        "expectedOutput": "2",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "\"Learn play build and excel\"",
        "expectedOutput": "5",
        "explanation": "Hidden validation test"
      },
      {
        "input": "\"Hello world\"",
        "expectedOutput": "2",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 31,
    "title": "Find Largest Array Element",
    "category": "Arrays",
    "level": 4,
    "difficulty": "Easy",
    "problemStatement": "Find the maximum element in an array.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "[12, 35, 1, 10, 34, 1]",
        "output": "35",
        "explanation": "Sample test case 1 for Find Largest Array Element."
      },
      {
        "input": "[5, 8, 2]",
        "output": "8",
        "explanation": "Sample test case 2 for Find Largest Array Element."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return Math.max(...arr);\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return max(arr)",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        Arrays.stream(arr).max().getAsInt()\n    }\n}"
    },
    "hints": [
      "Iterate array tracking max element.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 10,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Arrays",
      "Easy"
    ],
    "visibleTestCases": [
      {
        "input": "[12, 35, 1, 10, 34, 1]",
        "expectedOutput": "35",
        "explanation": "Visible test case"
      },
      {
        "input": "[5, 8, 2]",
        "expectedOutput": "8",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "[12, 35, 1, 10, 34, 1]",
        "expectedOutput": "35",
        "explanation": "Hidden validation test"
      },
      {
        "input": "[5, 8, 2]",
        "expectedOutput": "8",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 32,
    "title": "Find Smallest Array Element",
    "category": "Arrays",
    "level": 4,
    "difficulty": "Easy",
    "problemStatement": "Find the minimum element in an array.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "[12, 35, 1, 10, 34, 1]",
        "output": "1",
        "explanation": "Sample test case 1 for Find Smallest Array Element."
      },
      {
        "input": "[5, 8, 2]",
        "output": "2",
        "explanation": "Sample test case 2 for Find Smallest Array Element."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return Math.min(...arr);\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return min(arr)",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        Arrays.stream(arr).min().getAsInt()\n    }\n}"
    },
    "hints": [
      "Iterate array tracking min element.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 10,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Arrays",
      "Easy"
    ],
    "visibleTestCases": [
      {
        "input": "[12, 35, 1, 10, 34, 1]",
        "expectedOutput": "1",
        "explanation": "Visible test case"
      },
      {
        "input": "[5, 8, 2]",
        "expectedOutput": "2",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "[12, 35, 1, 10, 34, 1]",
        "expectedOutput": "1",
        "explanation": "Hidden validation test"
      },
      {
        "input": "[5, 8, 2]",
        "expectedOutput": "2",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 33,
    "title": "Find Second Largest Element",
    "category": "Arrays",
    "level": 4,
    "difficulty": "Easy",
    "problemStatement": "Find 2nd largest distinct element. Return -1 if not exists.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "[12, 35, 1, 10, 34, 1]",
        "output": "34",
        "explanation": "Sample test case 1 for Find Second Largest Element."
      },
      {
        "input": "[10, 10]",
        "output": "-1",
        "explanation": "Sample test case 2 for Find Second Largest Element."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return ([...new Set(arr)].sort((a,b)=>b-a)[1]??-1);\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return sorted(set(arr), reverse=True)[1] if len(set(arr))>1 else -1",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        int[] u=Arrays.stream(arr).distinct().sorted().toArray(); return u.length>1?u[u.length-2]:-1;\n    }\n}"
    },
    "hints": [
      "Track largest and second largest in a single pass.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 10,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Arrays",
      "Easy"
    ],
    "visibleTestCases": [
      {
        "input": "[12, 35, 1, 10, 34, 1]",
        "expectedOutput": "34",
        "explanation": "Visible test case"
      },
      {
        "input": "[10, 10]",
        "expectedOutput": "-1",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "[12, 35, 1, 10, 34, 1]",
        "expectedOutput": "34",
        "explanation": "Hidden validation test"
      },
      {
        "input": "[10, 10]",
        "expectedOutput": "-1",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 34,
    "title": "Find Second Smallest Element",
    "category": "Arrays",
    "level": 4,
    "difficulty": "Easy",
    "problemStatement": "Find 2nd smallest distinct element. Return -1 if none.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "[12, 35, 1, 10, 34, 1]",
        "output": "10",
        "explanation": "Sample test case 1 for Find Second Smallest Element."
      },
      {
        "input": "[5, 5]",
        "output": "-1",
        "explanation": "Sample test case 2 for Find Second Smallest Element."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return ([...new Set(arr)].sort((a,b)=>a-b)[1]??-1);\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return sorted(set(arr))[1] if len(set(arr))>1 else -1",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        int[] u=Arrays.stream(arr).distinct().sorted().toArray(); return u.length>1?u[1]:-1;\n    }\n}"
    },
    "hints": [
      "Track smallest and second smallest.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 10,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Arrays",
      "Easy"
    ],
    "visibleTestCases": [
      {
        "input": "[12, 35, 1, 10, 34, 1]",
        "expectedOutput": "10",
        "explanation": "Visible test case"
      },
      {
        "input": "[5, 5]",
        "expectedOutput": "-1",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "[12, 35, 1, 10, 34, 1]",
        "expectedOutput": "10",
        "explanation": "Hidden validation test"
      },
      {
        "input": "[5, 5]",
        "expectedOutput": "-1",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 35,
    "title": "Array Sum",
    "category": "Arrays",
    "level": 4,
    "difficulty": "Easy",
    "problemStatement": "Return sum of all elements in array.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "[1, 2, 3, 4, 5]",
        "output": "15",
        "explanation": "Sample test case 1 for Array Sum."
      },
      {
        "input": "[10, -5, 5]",
        "output": "10",
        "explanation": "Sample test case 2 for Array Sum."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return arr.reduce((a,b)=>a+b, 0);\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return sum(arr)",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        Arrays.stream(arr).sum()\n    }\n}"
    },
    "hints": [
      "Accumulate elements into total sum.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 10,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Arrays",
      "Easy"
    ],
    "visibleTestCases": [
      {
        "input": "[1, 2, 3, 4, 5]",
        "expectedOutput": "15",
        "explanation": "Visible test case"
      },
      {
        "input": "[10, -5, 5]",
        "expectedOutput": "10",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "[1, 2, 3, 4, 5]",
        "expectedOutput": "15",
        "explanation": "Hidden validation test"
      },
      {
        "input": "[10, -5, 5]",
        "expectedOutput": "10",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 36,
    "title": "Reverse Array",
    "category": "Arrays",
    "level": 4,
    "difficulty": "Easy",
    "problemStatement": "Reverse the given array.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "[1, 2, 3, 4]",
        "output": "[4, 3, 2, 1]",
        "explanation": "Sample test case 1 for Reverse Array."
      },
      {
        "input": "[10, 20]",
        "output": "[20, 10]",
        "explanation": "Sample test case 2 for Reverse Array."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return arr.slice().reverse();\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return arr[::-1]",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        Collections.reverse(list); return list;\n    }\n}"
    },
    "hints": [
      "Use two pointers swapping ends.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 10,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Arrays",
      "Easy"
    ],
    "visibleTestCases": [
      {
        "input": "[1, 2, 3, 4]",
        "expectedOutput": "[4, 3, 2, 1]",
        "explanation": "Visible test case"
      },
      {
        "input": "[10, 20]",
        "expectedOutput": "[20, 10]",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "[1, 2, 3, 4]",
        "expectedOutput": "[4, 3, 2, 1]",
        "explanation": "Hidden validation test"
      },
      {
        "input": "[10, 20]",
        "expectedOutput": "[20, 10]",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 37,
    "title": "Remove Duplicates from Array",
    "category": "Arrays",
    "level": 4,
    "difficulty": "Easy",
    "problemStatement": "Remove duplicates keeping first occurrences.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "[1, 2, 2, 3, 4, 4]",
        "output": "[1, 2, 3, 4]",
        "explanation": "Sample test case 1 for Remove Duplicates from Array."
      },
      {
        "input": "[5, 5, 5]",
        "output": "[5]",
        "explanation": "Sample test case 2 for Remove Duplicates from Array."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return [...new Set(arr)];\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return list(dict.fromkeys(arr))",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        Arrays.stream(arr).distinct().toArray()\n    }\n}"
    },
    "hints": [
      "Use Set or filter unique indices.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 10,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Arrays",
      "Easy"
    ],
    "visibleTestCases": [
      {
        "input": "[1, 2, 2, 3, 4, 4]",
        "expectedOutput": "[1, 2, 3, 4]",
        "explanation": "Visible test case"
      },
      {
        "input": "[5, 5, 5]",
        "expectedOutput": "[5]",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "[1, 2, 2, 3, 4, 4]",
        "expectedOutput": "[1, 2, 3, 4]",
        "explanation": "Hidden validation test"
      },
      {
        "input": "[5, 5, 5]",
        "expectedOutput": "[5]",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 38,
    "title": "Find Missing Number",
    "category": "Arrays",
    "level": 4,
    "difficulty": "Easy",
    "problemStatement": "Given array containing n distinct numbers from 0 to n, find the one missing.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "[3, 0, 1]",
        "output": "2",
        "explanation": "Sample test case 1 for Find Missing Number."
      },
      {
        "input": "[0, 1]",
        "output": "2",
        "explanation": "Sample test case 2 for Find Missing Number."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return (arr.length*(arr.length+1)/2)-arr.reduce((a,b)=>a+b,0);\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return len(arr)*(len(arr)+1)//2 - sum(arr)",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        int n=arr.length; return n*(n+1)/2 - Arrays.stream(arr).sum();\n    }\n}"
    },
    "hints": [
      "Total expected sum from 0 to n minus actual sum.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 10,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Arrays",
      "Easy"
    ],
    "visibleTestCases": [
      {
        "input": "[3, 0, 1]",
        "expectedOutput": "2",
        "explanation": "Visible test case"
      },
      {
        "input": "[0, 1]",
        "expectedOutput": "2",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "[3, 0, 1]",
        "expectedOutput": "2",
        "explanation": "Hidden validation test"
      },
      {
        "input": "[0, 1]",
        "expectedOutput": "2",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 39,
    "title": "Find Duplicate Elements",
    "category": "Arrays",
    "level": 4,
    "difficulty": "Easy",
    "problemStatement": "Return array of elements appearing more than once in sorted order.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "[4, 3, 2, 7, 8, 2, 3, 1]",
        "output": "[2, 3]",
        "explanation": "Sample test case 1 for Find Duplicate Elements."
      },
      {
        "input": "[1, 2, 3]",
        "output": "[]",
        "explanation": "Sample test case 2 for Find Duplicate Elements."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return [...new Set(arr.filter((v,i,a)=>a.indexOf(v)!==i))].sort((a,b)=>a-b);\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return sorted(list(set(x for x in arr if arr.count(x)>1)))",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        Set<Integer> s=new HashSet<>(), d=new TreeSet<>(); for(int x:arr) if(!s.add(x)) d.add(x); return d;\n    }\n}"
    },
    "hints": [
      "Use a set to identify previously seen items.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 10,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Arrays",
      "Easy"
    ],
    "visibleTestCases": [
      {
        "input": "[4, 3, 2, 7, 8, 2, 3, 1]",
        "expectedOutput": "[2, 3]",
        "explanation": "Visible test case"
      },
      {
        "input": "[1, 2, 3]",
        "expectedOutput": "[]",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "[4, 3, 2, 7, 8, 2, 3, 1]",
        "expectedOutput": "[2, 3]",
        "explanation": "Hidden validation test"
      },
      {
        "input": "[1, 2, 3]",
        "expectedOutput": "[]",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 40,
    "title": "Move Zeroes to End",
    "category": "Arrays",
    "level": 4,
    "difficulty": "Easy",
    "problemStatement": "Move all 0s to the end of array maintaining relative order of non-zero elements.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "[0, 1, 0, 3, 12]",
        "output": "[1, 3, 12, 0, 0]",
        "explanation": "Sample test case 1 for Move Zeroes to End."
      },
      {
        "input": "[1, 2, 3]",
        "output": "[1, 2, 3]",
        "explanation": "Sample test case 2 for Move Zeroes to End."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return arr.filter(x=>x!==0).concat(arr.filter(x=>x===0));\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return [x for x in arr if x!=0] + [0]*arr.count(0)",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        int[] r=new int[arr.length]; int idx=0; for(int x:arr) if(x!=0) r[idx++]=x; return r;\n    }\n}"
    },
    "hints": [
      "Track non-zero index and shift forward.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 10,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Arrays",
      "Easy"
    ],
    "visibleTestCases": [
      {
        "input": "[0, 1, 0, 3, 12]",
        "expectedOutput": "[1, 3, 12, 0, 0]",
        "explanation": "Visible test case"
      },
      {
        "input": "[1, 2, 3]",
        "expectedOutput": "[1, 2, 3]",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "[0, 1, 0, 3, 12]",
        "expectedOutput": "[1, 3, 12, 0, 0]",
        "explanation": "Hidden validation test"
      },
      {
        "input": "[1, 2, 3]",
        "expectedOutput": "[1, 2, 3]",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 41,
    "title": "Linear Search",
    "category": "Searching and Sorting",
    "level": 5,
    "difficulty": "Easy",
    "problemStatement": "Given [arr, target], return index of target or -1.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "[[10, 20, 30, 40], 30]",
        "output": "2",
        "explanation": "Sample test case 1 for Linear Search."
      },
      {
        "input": "[[10, 20, 30], 99]",
        "output": "-1",
        "explanation": "Sample test case 2 for Linear Search."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return arr[0].indexOf(arr[1]);\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return arr[0].index(arr[1]) if arr[1] in arr[0] else -1",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        for(int i=0;i<arr.length;i++) if(arr[i]==target) return i; return -1;\n    }\n}"
    },
    "hints": [
      "Scan sequentially from start to end.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 15,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Searching and Sorting",
      "Easy"
    ],
    "visibleTestCases": [
      {
        "input": "[[10, 20, 30, 40], 30]",
        "expectedOutput": "2",
        "explanation": "Visible test case"
      },
      {
        "input": "[[10, 20, 30], 99]",
        "expectedOutput": "-1",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "[[10, 20, 30, 40], 30]",
        "expectedOutput": "2",
        "explanation": "Hidden validation test"
      },
      {
        "input": "[[10, 20, 30], 99]",
        "expectedOutput": "-1",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 42,
    "title": "Binary Search",
    "category": "Searching and Sorting",
    "level": 5,
    "difficulty": "Easy",
    "problemStatement": "Given sorted [arr, target], return target index or -1 in O(log n).",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "[[1, 3, 5, 7, 9], 7]",
        "output": "3",
        "explanation": "Sample test case 1 for Binary Search."
      },
      {
        "input": "[[1, 3, 5, 7, 9], 2]",
        "output": "-1",
        "explanation": "Sample test case 2 for Binary Search."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return (function(){ let [a,t]=arr; let l=0,r=a.length-1; while(l<=r){ let m=Math.floor((l+r)/2); if(a[m]===t)return m; if(a[m]<t)l=m+1; else r=m-1; } return -1; })();\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return import bisect\n a, t = arr\n i = bisect.bisect_left(a, t)\n return i if i<len(a) and a[i]==t else -1",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        int l=0, r=a.length-1; while(l<=r){ int m=(l+r)/2; if(a[m]==t) return m; else if(a[m]<t) l=m+1; else r=m-1; } return -1;\n    }\n}"
    },
    "hints": [
      "Divide search space in half each step.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 15,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Searching and Sorting",
      "Easy"
    ],
    "visibleTestCases": [
      {
        "input": "[[1, 3, 5, 7, 9], 7]",
        "expectedOutput": "3",
        "explanation": "Visible test case"
      },
      {
        "input": "[[1, 3, 5, 7, 9], 2]",
        "expectedOutput": "-1",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "[[1, 3, 5, 7, 9], 7]",
        "expectedOutput": "3",
        "explanation": "Hidden validation test"
      },
      {
        "input": "[[1, 3, 5, 7, 9], 2]",
        "expectedOutput": "-1",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 43,
    "title": "First Occurrence in Sorted Array",
    "category": "Searching and Sorting",
    "level": 5,
    "difficulty": "Medium",
    "problemStatement": "Find first index of target in sorted array with duplicates. Return -1 if not found.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "[[1, 2, 2, 2, 3], 2]",
        "output": "1",
        "explanation": "Sample test case 1 for First Occurrence in Sorted Array."
      },
      {
        "input": "[[1, 2, 3], 4]",
        "output": "-1",
        "explanation": "Sample test case 2 for First Occurrence in Sorted Array."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return arr[0].indexOf(arr[1]);\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return arr[0].index(arr[1]) if arr[1] in arr[0] else -1",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        int ans=-1, l=0, r=a.length-1; while(l<=r){ int m=(l+r)/2; if(a[m]==t){ ans=m; r=m-1; } else if(a[m]<t) l=m+1; else r=m-1; } return ans;\n    }\n}"
    },
    "hints": [
      "When match is found, continue searching left.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 25,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Searching and Sorting",
      "Medium"
    ],
    "visibleTestCases": [
      {
        "input": "[[1, 2, 2, 2, 3], 2]",
        "expectedOutput": "1",
        "explanation": "Visible test case"
      },
      {
        "input": "[[1, 2, 3], 4]",
        "expectedOutput": "-1",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "[[1, 2, 2, 2, 3], 2]",
        "expectedOutput": "1",
        "explanation": "Hidden validation test"
      },
      {
        "input": "[[1, 2, 3], 4]",
        "expectedOutput": "-1",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 44,
    "title": "Last Occurrence in Sorted Array",
    "category": "Searching and Sorting",
    "level": 5,
    "difficulty": "Medium",
    "problemStatement": "Find last index of target in sorted array with duplicates. Return -1 if not found.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "[[1, 2, 2, 2, 3], 2]",
        "output": "3",
        "explanation": "Sample test case 1 for Last Occurrence in Sorted Array."
      },
      {
        "input": "[[1, 2, 3], 4]",
        "output": "-1",
        "explanation": "Sample test case 2 for Last Occurrence in Sorted Array."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return arr[0].lastIndexOf(arr[1]);\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return len(arr[0]) - 1 - arr[0][::-1].index(arr[1]) if arr[1] in arr[0] else -1",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        int ans=-1, l=0, r=a.length-1; while(l<=r){ int m=(l+r)/2; if(a[m]==t){ ans=m; l=m+1; } else if(a[m]<t) l=m+1; else r=m-1; } return ans;\n    }\n}"
    },
    "hints": [
      "When match is found, continue searching right.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 25,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Searching and Sorting",
      "Medium"
    ],
    "visibleTestCases": [
      {
        "input": "[[1, 2, 2, 2, 3], 2]",
        "expectedOutput": "3",
        "explanation": "Visible test case"
      },
      {
        "input": "[[1, 2, 3], 4]",
        "expectedOutput": "-1",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "[[1, 2, 2, 2, 3], 2]",
        "expectedOutput": "3",
        "explanation": "Hidden validation test"
      },
      {
        "input": "[[1, 2, 3], 4]",
        "expectedOutput": "-1",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 45,
    "title": "Bubble Sort",
    "category": "Searching and Sorting",
    "level": 5,
    "difficulty": "Medium",
    "problemStatement": "Sort array in ascending order using Bubble Sort.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "[5, 1, 4, 2, 8]",
        "output": "[1, 2, 4, 5, 8]",
        "explanation": "Sample test case 1 for Bubble Sort."
      },
      {
        "input": "[3, 2, 1]",
        "output": "[1, 2, 3]",
        "explanation": "Sample test case 2 for Bubble Sort."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return arr.slice().sort((a,b)=>a-b);\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return sorted(arr)",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        Arrays.sort(arr); return arr;\n    }\n}"
    },
    "hints": [
      "Compare adjacent pairs and swap if out of order.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 25,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Searching and Sorting",
      "Medium"
    ],
    "visibleTestCases": [
      {
        "input": "[5, 1, 4, 2, 8]",
        "expectedOutput": "[1, 2, 4, 5, 8]",
        "explanation": "Visible test case"
      },
      {
        "input": "[3, 2, 1]",
        "expectedOutput": "[1, 2, 3]",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "[5, 1, 4, 2, 8]",
        "expectedOutput": "[1, 2, 4, 5, 8]",
        "explanation": "Hidden validation test"
      },
      {
        "input": "[3, 2, 1]",
        "expectedOutput": "[1, 2, 3]",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 46,
    "title": "Selection Sort",
    "category": "Searching and Sorting",
    "level": 5,
    "difficulty": "Medium",
    "problemStatement": "Sort array using Selection Sort.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "[64, 25, 12, 22, 11]",
        "output": "[11, 12, 22, 25, 64]",
        "explanation": "Sample test case 1 for Selection Sort."
      },
      {
        "input": "[5, 3, 1]",
        "output": "[1, 3, 5]",
        "explanation": "Sample test case 2 for Selection Sort."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return arr.slice().sort((a,b)=>a-b);\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return sorted(arr)",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        Arrays.sort(arr); return arr;\n    }\n}"
    },
    "hints": [
      "Find minimum element and swap to current position.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 25,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Searching and Sorting",
      "Medium"
    ],
    "visibleTestCases": [
      {
        "input": "[64, 25, 12, 22, 11]",
        "expectedOutput": "[11, 12, 22, 25, 64]",
        "explanation": "Visible test case"
      },
      {
        "input": "[5, 3, 1]",
        "expectedOutput": "[1, 3, 5]",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "[64, 25, 12, 22, 11]",
        "expectedOutput": "[11, 12, 22, 25, 64]",
        "explanation": "Hidden validation test"
      },
      {
        "input": "[5, 3, 1]",
        "expectedOutput": "[1, 3, 5]",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 47,
    "title": "Insertion Sort",
    "category": "Searching and Sorting",
    "level": 5,
    "difficulty": "Medium",
    "problemStatement": "Sort array using Insertion Sort.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "[12, 11, 13, 5, 6]",
        "output": "[5, 6, 11, 12, 13]",
        "explanation": "Sample test case 1 for Insertion Sort."
      },
      {
        "input": "[4, 2, 3]",
        "output": "[2, 3, 4]",
        "explanation": "Sample test case 2 for Insertion Sort."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return arr.slice().sort((a,b)=>a-b);\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return sorted(arr)",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        Arrays.sort(arr); return arr;\n    }\n}"
    },
    "hints": [
      "Insert element into its sorted prefix position.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 25,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Searching and Sorting",
      "Medium"
    ],
    "visibleTestCases": [
      {
        "input": "[12, 11, 13, 5, 6]",
        "expectedOutput": "[5, 6, 11, 12, 13]",
        "explanation": "Visible test case"
      },
      {
        "input": "[4, 2, 3]",
        "expectedOutput": "[2, 3, 4]",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "[12, 11, 13, 5, 6]",
        "expectedOutput": "[5, 6, 11, 12, 13]",
        "explanation": "Hidden validation test"
      },
      {
        "input": "[4, 2, 3]",
        "expectedOutput": "[2, 3, 4]",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 48,
    "title": "Merge Two Sorted Arrays",
    "category": "Searching and Sorting",
    "level": 5,
    "difficulty": "Medium",
    "problemStatement": "Given [arr1, arr2] both sorted, merge into single sorted array.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "[[1, 3, 5], [2, 4, 6]]",
        "output": "[1, 2, 3, 4, 5, 6]",
        "explanation": "Sample test case 1 for Merge Two Sorted Arrays."
      },
      {
        "input": "[[1, 2], [3, 4]]",
        "output": "[1, 2, 3, 4]",
        "explanation": "Sample test case 2 for Merge Two Sorted Arrays."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return arr[0].concat(arr[1]).sort((a,b)=>a-b);\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return sorted(arr[0] + arr[1])",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        List<Integer> l=new ArrayList<>(l1); l.addAll(l2); Collections.sort(l); return l;\n    }\n}"
    },
    "hints": [
      "Use two pointers comparing heads of each array.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 25,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Searching and Sorting",
      "Medium"
    ],
    "visibleTestCases": [
      {
        "input": "[[1, 3, 5], [2, 4, 6]]",
        "expectedOutput": "[1, 2, 3, 4, 5, 6]",
        "explanation": "Visible test case"
      },
      {
        "input": "[[1, 2], [3, 4]]",
        "expectedOutput": "[1, 2, 3, 4]",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "[[1, 3, 5], [2, 4, 6]]",
        "expectedOutput": "[1, 2, 3, 4, 5, 6]",
        "explanation": "Hidden validation test"
      },
      {
        "input": "[[1, 2], [3, 4]]",
        "expectedOutput": "[1, 2, 3, 4]",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 49,
    "title": "Kth Largest Element",
    "category": "Searching and Sorting",
    "level": 5,
    "difficulty": "Medium",
    "problemStatement": "Given [arr, k], return k-th largest element in array.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "[[3, 2, 1, 5, 6, 4], 2]",
        "output": "5",
        "explanation": "Sample test case 1 for Kth Largest Element."
      },
      {
        "input": "[[3, 2, 3, 1, 2, 4, 5, 5, 6], 4]",
        "output": "4",
        "explanation": "Sample test case 2 for Kth Largest Element."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return arr[0].sort((a,b)=>b-a)[arr[1]-1];\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return sorted(arr[0], reverse=True)[arr[1]-1]",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        Arrays.sort(a); return a[a.length - k];\n    }\n}"
    },
    "hints": [
      "Sort descending and pick index k-1, or use min-heap.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 25,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Searching and Sorting",
      "Medium"
    ],
    "visibleTestCases": [
      {
        "input": "[[3, 2, 1, 5, 6, 4], 2]",
        "expectedOutput": "5",
        "explanation": "Visible test case"
      },
      {
        "input": "[[3, 2, 3, 1, 2, 4, 5, 5, 6], 4]",
        "expectedOutput": "4",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "[[3, 2, 1, 5, 6, 4], 2]",
        "expectedOutput": "5",
        "explanation": "Hidden validation test"
      },
      {
        "input": "[[3, 2, 3, 1, 2, 4, 5, 5, 6], 4]",
        "expectedOutput": "4",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 50,
    "title": "Search in Rotated Sorted Array",
    "category": "Searching and Sorting",
    "level": 5,
    "difficulty": "Medium",
    "problemStatement": "Find index of target in sorted array rotated at pivot. Return -1 if not found.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "[[4, 5, 6, 7, 0, 1, 2], 0]",
        "output": "4",
        "explanation": "Sample test case 1 for Search in Rotated Sorted Array."
      },
      {
        "input": "[[4, 5, 6, 7, 0, 1, 2], 3]",
        "output": "-1",
        "explanation": "Sample test case 2 for Search in Rotated Sorted Array."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return arr[0].indexOf(arr[1]);\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return arr[0].index(arr[1]) if arr[1] in arr[0] else -1",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        int l=0, r=a.length-1; while(l<=r){ int m=(l+r)/2; if(a[m]==t) return m; if(a[l]<=a[m]){ if(a[l]<=t && t<a[m]) r=m-1; else l=m+1; } else { if(a[m]<t && t<=a[r]) l=m+1; else r=m-1; } } return -1;\n    }\n}"
    },
    "hints": [
      "One half is always strictly sorted; check target in that range.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 25,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Searching and Sorting",
      "Medium"
    ],
    "visibleTestCases": [
      {
        "input": "[[4, 5, 6, 7, 0, 1, 2], 0]",
        "expectedOutput": "4",
        "explanation": "Visible test case"
      },
      {
        "input": "[[4, 5, 6, 7, 0, 1, 2], 3]",
        "expectedOutput": "-1",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "[[4, 5, 6, 7, 0, 1, 2], 0]",
        "expectedOutput": "4",
        "explanation": "Hidden validation test"
      },
      {
        "input": "[[4, 5, 6, 7, 0, 1, 2], 3]",
        "expectedOutput": "-1",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 51,
    "title": "Two Sum",
    "category": "Hashing",
    "level": 6,
    "difficulty": "Medium",
    "problemStatement": "Given [nums, target], return indices of two numbers that add up to target.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "[[2, 7, 11, 15], 9]",
        "output": "[0, 1]",
        "explanation": "Sample test case 1 for Two Sum."
      },
      {
        "input": "[[3, 2, 4], 6]",
        "output": "[1, 2]",
        "explanation": "Sample test case 2 for Two Sum."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return (function(){ let [a,t]=arr; let m=new Map(); for(let i=0;i<a.length;i++){ if(m.has(t-a[i])) return [m.get(t-a[i]), i]; m.set(a[i], i); } return []; })();\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return d = {}\n for i, x in enumerate(arr[0]):\n  if arr[1]-x in d: return [d[arr[1]-x], i]\n  d[x] = i",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        Map<Integer,Integer> m=new HashMap<>(); for(int i=0;i<a.length;i++){ if(m.containsKey(t-a[i])) return new int[]{m.get(t-a[i]), i}; m.put(a[i], i); } return new int[]{};\n    }\n}"
    },
    "hints": [
      "Use hash map storing complement target - num.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 25,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Hashing",
      "Medium"
    ],
    "visibleTestCases": [
      {
        "input": "[[2, 7, 11, 15], 9]",
        "expectedOutput": "[0, 1]",
        "explanation": "Visible test case"
      },
      {
        "input": "[[3, 2, 4], 6]",
        "expectedOutput": "[1, 2]",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "[[2, 7, 11, 15], 9]",
        "expectedOutput": "[0, 1]",
        "explanation": "Hidden validation test"
      },
      {
        "input": "[[3, 2, 4], 6]",
        "expectedOutput": "[1, 2]",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 52,
    "title": "Frequency of Elements",
    "category": "Hashing",
    "level": 6,
    "difficulty": "Medium",
    "problemStatement": "Return JSON map of frequency of each integer in array.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "[1, 2, 2, 3, 3, 3]",
        "output": "{\"1\": 1, \"2\": 2, \"3\": 3}",
        "explanation": "Sample test case 1 for Frequency of Elements."
      },
      {
        "input": "[5, 5]",
        "output": "{\"5\": 2}",
        "explanation": "Sample test case 2 for Frequency of Elements."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return (function(){ const m={}; for(let x of arr) m[x]=(m[x]||0)+1; return m; })();\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return from collections import Counter; return dict(Counter(arr))",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        Map<Integer,Integer> m=new HashMap<>(); for(int x:arr) m.put(x, m.getOrDefault(x,0)+1); return m;\n    }\n}"
    },
    "hints": [
      "Count occurrences using hash table.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 25,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Hashing",
      "Medium"
    ],
    "visibleTestCases": [
      {
        "input": "[1, 2, 2, 3, 3, 3]",
        "expectedOutput": "{\"1\": 1, \"2\": 2, \"3\": 3}",
        "explanation": "Visible test case"
      },
      {
        "input": "[5, 5]",
        "expectedOutput": "{\"5\": 2}",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "[1, 2, 2, 3, 3, 3]",
        "expectedOutput": "{\"1\": 1, \"2\": 2, \"3\": 3}",
        "explanation": "Hidden validation test"
      },
      {
        "input": "[5, 5]",
        "expectedOutput": "{\"5\": 2}",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 53,
    "title": "Intersection of Two Arrays",
    "category": "Hashing",
    "level": 6,
    "difficulty": "Medium",
    "problemStatement": "Given [arr1, arr2], return sorted array of distinct common elements.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "[[1, 2, 2, 1], [2, 2]]",
        "output": "[2]",
        "explanation": "Sample test case 1 for Intersection of Two Arrays."
      },
      {
        "input": "[[4, 9, 5], [9, 4, 9, 8, 4]]",
        "output": "[4, 9]",
        "explanation": "Sample test case 2 for Intersection of Two Arrays."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return (function(){ const s=new Set(arr[0]); return [...new Set(arr[1].filter(x=>s.has(x)))].sort((a,b)=>a-b); })();\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return sorted(list(set(arr[0]) & set(arr[1])))",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        Set<Integer> s1=new HashSet<>(l1); s1.retainAll(l2); return new ArrayList<>(s1);\n    }\n}"
    },
    "hints": [
      "Put arr1 in a Set and check members of arr2.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 25,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Hashing",
      "Medium"
    ],
    "visibleTestCases": [
      {
        "input": "[[1, 2, 2, 1], [2, 2]]",
        "expectedOutput": "[2]",
        "explanation": "Visible test case"
      },
      {
        "input": "[[4, 9, 5], [9, 4, 9, 8, 4]]",
        "expectedOutput": "[4, 9]",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "[[1, 2, 2, 1], [2, 2]]",
        "expectedOutput": "[2]",
        "explanation": "Hidden validation test"
      },
      {
        "input": "[[4, 9, 5], [9, 4, 9, 8, 4]]",
        "expectedOutput": "[4, 9]",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 54,
    "title": "Union of Two Arrays",
    "category": "Hashing",
    "level": 6,
    "difficulty": "Medium",
    "problemStatement": "Given [arr1, arr2], return sorted array of distinct union elements.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "[[1, 2, 3], [2, 3, 4]]",
        "output": "[1, 2, 3, 4]",
        "explanation": "Sample test case 1 for Union of Two Arrays."
      },
      {
        "input": "[[1, 1], [2, 2]]",
        "output": "[1, 2]",
        "explanation": "Sample test case 2 for Union of Two Arrays."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return [...new Set(arr[0].concat(arr[1]))].sort((a,b)=>a-b);\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return sorted(list(set(arr[0]) | set(arr[1])))",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        Set<Integer> s=new TreeSet<>(l1); s.addAll(l2); return new ArrayList<>(s);\n    }\n}"
    },
    "hints": [
      "Merge and filter unique using Set.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 25,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Hashing",
      "Medium"
    ],
    "visibleTestCases": [
      {
        "input": "[[1, 2, 3], [2, 3, 4]]",
        "expectedOutput": "[1, 2, 3, 4]",
        "explanation": "Visible test case"
      },
      {
        "input": "[[1, 1], [2, 2]]",
        "expectedOutput": "[1, 2]",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "[[1, 2, 3], [2, 3, 4]]",
        "expectedOutput": "[1, 2, 3, 4]",
        "explanation": "Hidden validation test"
      },
      {
        "input": "[[1, 1], [2, 2]]",
        "expectedOutput": "[1, 2]",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 55,
    "title": "Single Non-Repeating Element",
    "category": "Hashing",
    "level": 6,
    "difficulty": "Medium",
    "problemStatement": "Every element appears twice except one. Find that single one.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "[4, 1, 2, 1, 2]",
        "output": "4",
        "explanation": "Sample test case 1 for Single Non-Repeating Element."
      },
      {
        "input": "[2, 2, 1]",
        "output": "1",
        "explanation": "Sample test case 2 for Single Non-Repeating Element."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return arr.reduce((acc, x) => acc ^ x, 0);\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return import functools, operator; return functools.reduce(operator.xor, arr)",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        int res=0; for(int x:arr) res ^= x; return res;\n    }\n}"
    },
    "hints": [
      "XOR of two identical numbers is 0; n ^ 0 is n.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 25,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Hashing",
      "Medium"
    ],
    "visibleTestCases": [
      {
        "input": "[4, 1, 2, 1, 2]",
        "expectedOutput": "4",
        "explanation": "Visible test case"
      },
      {
        "input": "[2, 2, 1]",
        "expectedOutput": "1",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "[4, 1, 2, 1, 2]",
        "expectedOutput": "4",
        "explanation": "Hidden validation test"
      },
      {
        "input": "[2, 2, 1]",
        "expectedOutput": "1",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 56,
    "title": "Detect Duplicates",
    "category": "Hashing",
    "level": 6,
    "difficulty": "Medium",
    "problemStatement": "Return `true` if any value appears at least twice in array, else `false`.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "[1, 2, 3, 1]",
        "output": "true",
        "explanation": "Sample test case 1 for Detect Duplicates."
      },
      {
        "input": "[1, 2, 3, 4]",
        "output": "false",
        "explanation": "Sample test case 2 for Detect Duplicates."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return new Set(arr).size !== arr.length;\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return len(set(arr)) != len(arr)",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        System.out.println(new HashSet<>(list).size() != list.size());\n    }\n}"
    },
    "hints": [
      "Compare set size with array length.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 25,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Hashing",
      "Medium"
    ],
    "visibleTestCases": [
      {
        "input": "[1, 2, 3, 1]",
        "expectedOutput": "true",
        "explanation": "Visible test case"
      },
      {
        "input": "[1, 2, 3, 4]",
        "expectedOutput": "false",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "[1, 2, 3, 1]",
        "expectedOutput": "true",
        "explanation": "Hidden validation test"
      },
      {
        "input": "[1, 2, 3, 4]",
        "expectedOutput": "false",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 57,
    "title": "Longest Consecutive Sequence",
    "category": "Hashing",
    "level": 6,
    "difficulty": "Medium",
    "problemStatement": "Find length of longest consecutive elements sequence in O(n).",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "[100, 4, 200, 1, 3, 2]",
        "output": "4",
        "explanation": "Sample test case 1 for Longest Consecutive Sequence."
      },
      {
        "input": "[0, 3, 7, 2, 5, 8, 4, 6, 0, 1]",
        "output": "9",
        "explanation": "Sample test case 2 for Longest Consecutive Sequence."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return (function(){ const s=new Set(arr); let m=0; for(let x of s){ if(!s.has(x-1)){ let y=x; while(s.has(y)) y++; m=Math.max(m, y-x); } } return m; })();\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return s=set(arr); m=0\n for x in s:\n  if x-1 not in s:\n   y=x\n   while y in s: y+=1\n   m=max(m, y-x)\n return m",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        Set<Integer> s=new HashSet<>(); for(int x:a) s.add(x); int m=0; for(int x:s){ if(!s.contains(x-1)){ int y=x; while(s.contains(y)) y++; m=Math.max(m, y-x); } } return m;\n    }\n}"
    },
    "hints": [
      "Check if x-1 is missing to start streak.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 25,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Hashing",
      "Medium"
    ],
    "visibleTestCases": [
      {
        "input": "[100, 4, 200, 1, 3, 2]",
        "expectedOutput": "4",
        "explanation": "Visible test case"
      },
      {
        "input": "[0, 3, 7, 2, 5, 8, 4, 6, 0, 1]",
        "expectedOutput": "9",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "[100, 4, 200, 1, 3, 2]",
        "expectedOutput": "4",
        "explanation": "Hidden validation test"
      },
      {
        "input": "[0, 3, 7, 2, 5, 8, 4, 6, 0, 1]",
        "expectedOutput": "9",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 58,
    "title": "Group Anagrams",
    "category": "Hashing",
    "level": 6,
    "difficulty": "Medium",
    "problemStatement": "Group strings that are anagrams together.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "[\"eat\", \"tea\", \"tan\", \"ate\", \"nat\", \"bat\"]",
        "output": "[[\"eat\", \"tea\", \"ate\"], [\"tan\", \"nat\"], [\"bat\"]]",
        "explanation": "Sample test case 1 for Group Anagrams."
      },
      {
        "input": "[\"a\"]",
        "output": "[[\"a\"]]",
        "explanation": "Sample test case 2 for Group Anagrams."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return (function(){ const m={}; for(let w of arr){ let k=w.split('').sort().join(''); m[k]=m[k]||[]; m[k].push(w); } return Object.values(m); })();\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return from collections import defaultdict; d=defaultdict(list)\n for w in arr: d[''.join(sorted(w))].append(w)\n return list(d.values())",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        Map<String,List<String>> m=new HashMap<>(); for(String w:arr){ char[] c=w.toCharArray(); Arrays.sort(c); String k=new String(c); m.computeIfAbsent(k, x->new ArrayList<>()).add(w); } return new ArrayList<>(m.values());\n    }\n}"
    },
    "hints": [
      "Sort letters as canonical hash map key.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 25,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Hashing",
      "Medium"
    ],
    "visibleTestCases": [
      {
        "input": "[\"eat\", \"tea\", \"tan\", \"ate\", \"nat\", \"bat\"]",
        "expectedOutput": "[[\"eat\", \"tea\", \"ate\"], [\"tan\", \"nat\"], [\"bat\"]]",
        "explanation": "Visible test case"
      },
      {
        "input": "[\"a\"]",
        "expectedOutput": "[[\"a\"]]",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "[\"eat\", \"tea\", \"tan\", \"ate\", \"nat\", \"bat\"]",
        "expectedOutput": "[[\"eat\", \"tea\", \"ate\"], [\"tan\", \"nat\"], [\"bat\"]]",
        "explanation": "Hidden validation test"
      },
      {
        "input": "[\"a\"]",
        "expectedOutput": "[[\"a\"]]",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 59,
    "title": "Highest Frequency Element",
    "category": "Hashing",
    "level": 6,
    "difficulty": "Medium",
    "problemStatement": "Return the element that appears most frequently. Tie goes to smaller value.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "[1, 3, 2, 1, 4, 1]",
        "output": "1",
        "explanation": "Sample test case 1 for Highest Frequency Element."
      },
      {
        "input": "[10, 20, 20]",
        "output": "20",
        "explanation": "Sample test case 2 for Highest Frequency Element."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return (function(){ const m={}; for(let x of arr) m[x]=(m[x]||0)+1; let b=arr[0]; for(let k in m) if(m[k]>m[b] || (m[k]===m[b] && Number(k)<b)) b=Number(k); return b; })();\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return from collections import Counter; c=Counter(arr); return min(c.keys(), key=lambda x: (-c[x], x))",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        Map<Integer,Integer> m=new HashMap<>(); for(int x:a) m.put(x, m.getOrDefault(x,0)+1); int best=a[0]; for(int k:m.keySet()) if(m.get(k)>m.get(best)||(m.get(k)==m.get(best)&&k<best)) best=k; return best;\n    }\n}"
    },
    "hints": [
      "Count with hash map and track best candidate.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 25,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Hashing",
      "Medium"
    ],
    "visibleTestCases": [
      {
        "input": "[1, 3, 2, 1, 4, 1]",
        "expectedOutput": "1",
        "explanation": "Visible test case"
      },
      {
        "input": "[10, 20, 20]",
        "expectedOutput": "20",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "[1, 3, 2, 1, 4, 1]",
        "expectedOutput": "1",
        "explanation": "Hidden validation test"
      },
      {
        "input": "[10, 20, 20]",
        "expectedOutput": "20",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 60,
    "title": "Pairs with Given Difference",
    "category": "Hashing",
    "level": 6,
    "difficulty": "Medium",
    "problemStatement": "Given [arr, k], count distinct pairs (a, b) such that a - b = k.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "[[1, 5, 3, 4, 2], 2]",
        "output": "3",
        "explanation": "Sample test case 1 for Pairs with Given Difference."
      },
      {
        "input": "[[8, 12, 16], 4]",
        "output": "2",
        "explanation": "Sample test case 2 for Pairs with Given Difference."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return (function(){ let [a,k]=arr; const s=new Set(a); let c=0; for(let x of s) if(s.has(x+k)) c++; return c; })();\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return a, k = arr; s=set(a); return sum(1 for x in s if x+k in s)",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        Set<Integer> s=new HashSet<>(l); int c=0; for(int x:s) if(s.contains(x+k)) c++; return c;\n    }\n}"
    },
    "hints": [
      "Use set to check if x + k exists in O(1).",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 25,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Hashing",
      "Medium"
    ],
    "visibleTestCases": [
      {
        "input": "[[1, 5, 3, 4, 2], 2]",
        "expectedOutput": "3",
        "explanation": "Visible test case"
      },
      {
        "input": "[[8, 12, 16], 4]",
        "expectedOutput": "2",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "[[1, 5, 3, 4, 2], 2]",
        "expectedOutput": "3",
        "explanation": "Hidden validation test"
      },
      {
        "input": "[[8, 12, 16], 4]",
        "expectedOutput": "2",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 61,
    "title": "Two Sum in Sorted Array",
    "category": "Two Pointer",
    "level": 7,
    "difficulty": "Medium",
    "problemStatement": "Given 1-indexed sorted [numbers, target], return indices of two numbers.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "[[2, 7, 11, 15], 9]",
        "output": "[1, 2]",
        "explanation": "Sample test case 1 for Two Sum in Sorted Array."
      },
      {
        "input": "[[2, 3, 4], 6]",
        "output": "[1, 3]",
        "explanation": "Sample test case 2 for Two Sum in Sorted Array."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return (function(){ let [a,t]=arr; let l=0, r=a.length-1; while(l<r){ let s=a[l]+a[r]; if(s===t) return [l+1, r+1]; if(s<t) l++; else r--; } return []; })();\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return a, t = arr; l, r = 0, len(a)-1\n while l<r:\n  s=a[l]+a[r]\n  if s==t: return [l+1, r+1]\n  elif s<t: l+=1\n  else: r-=1",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        int l=0, r=a.length-1; while(l<r){ int s=a[l]+a[r]; if(s==t) return new int[]{l+1,r+1}; if(s<t) l++; else r--; } return new int[]{};\n    }\n}"
    },
    "hints": [
      "Use left and right pointers moving toward each other.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 25,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Two Pointer",
      "Medium"
    ],
    "visibleTestCases": [
      {
        "input": "[[2, 7, 11, 15], 9]",
        "expectedOutput": "[1, 2]",
        "explanation": "Visible test case"
      },
      {
        "input": "[[2, 3, 4], 6]",
        "expectedOutput": "[1, 3]",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "[[2, 7, 11, 15], 9]",
        "expectedOutput": "[1, 2]",
        "explanation": "Hidden validation test"
      },
      {
        "input": "[[2, 3, 4], 6]",
        "expectedOutput": "[1, 3]",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 62,
    "title": "Remove Duplicates from Sorted Array",
    "category": "Two Pointer",
    "level": 7,
    "difficulty": "Medium",
    "problemStatement": "Remove duplicates in-place and return number of unique elements.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "[1, 1, 2]",
        "output": "2",
        "explanation": "Sample test case 1 for Remove Duplicates from Sorted Array."
      },
      {
        "input": "[0, 0, 1, 1, 1, 2, 3, 3, 4]",
        "output": "5",
        "explanation": "Sample test case 2 for Remove Duplicates from Sorted Array."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return new Set(arr).size;\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return len(set(arr))",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        System.out.println((int)Arrays.stream(a).distinct().count());\n    }\n}"
    },
    "hints": [
      "Use slow pointer tracking write index.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 25,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Two Pointer",
      "Medium"
    ],
    "visibleTestCases": [
      {
        "input": "[1, 1, 2]",
        "expectedOutput": "2",
        "explanation": "Visible test case"
      },
      {
        "input": "[0, 0, 1, 1, 1, 2, 3, 3, 4]",
        "expectedOutput": "5",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "[1, 1, 2]",
        "expectedOutput": "2",
        "explanation": "Hidden validation test"
      },
      {
        "input": "[0, 0, 1, 1, 1, 2, 3, 3, 4]",
        "expectedOutput": "5",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 63,
    "title": "Reverse Vowels of a String",
    "category": "Two Pointer",
    "level": 7,
    "difficulty": "Medium",
    "problemStatement": "Reverse only the vowels in a given string.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "\"hello\"",
        "output": "\"holle\"",
        "explanation": "Sample test case 1 for Reverse Vowels of a String."
      },
      {
        "input": "\"leetcode\"",
        "output": "\"leotcede\"",
        "explanation": "Sample test case 2 for Reverse Vowels of a String."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return (function(){ const v=new Set('aeiouAEIOU'); let a=s.split(''); let l=0, r=a.length-1; while(l<r){ while(l<r && !v.has(a[l])) l++; while(l<r && !v.has(a[r])) r--; let t=a[l]; a[l]=a[r]; a[r]=t; l++; r--; } return a.join(''); })();\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return v=set('aeiouAEIOU'); a=list(s); l, r = 0, len(a)-1\n while l<r:\n  while l<r and a[l] not in v: l+=1\n  while l<r and a[r] not in v: r-=1\n  a[l], a[r] = a[r], a[l]; l+=1; r-=1\n return ''.join(a)",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        char[] a=s.toCharArray(); int l=0, r=a.length-1; String v=\"aeiouAEIOU\"; while(l<r){ while(l<r && v.indexOf(a[l])==-1) l++; while(l<r && v.indexOf(a[r])==-1) r--; char t=a[l]; a[l]=a[r]; a[r]=t; l++; r--; } return new String(a);\n    }\n}"
    },
    "hints": [
      "Pointers at both ends skip consonants and swap vowels.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 25,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Two Pointer",
      "Medium"
    ],
    "visibleTestCases": [
      {
        "input": "\"hello\"",
        "expectedOutput": "\"holle\"",
        "explanation": "Visible test case"
      },
      {
        "input": "\"leetcode\"",
        "expectedOutput": "\"leotcede\"",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "\"hello\"",
        "expectedOutput": "\"holle\"",
        "explanation": "Hidden validation test"
      },
      {
        "input": "\"leetcode\"",
        "expectedOutput": "\"leotcede\"",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 64,
    "title": "Valid Palindrome Alphanumeric",
    "category": "Two Pointer",
    "level": 7,
    "difficulty": "Medium",
    "problemStatement": "Return `true` if string is palindrome considering only alphanumeric characters and ignoring case.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "\"A man, a plan, a canal: Panama\"",
        "output": "true",
        "explanation": "Sample test case 1 for Valid Palindrome Alphanumeric."
      },
      {
        "input": "\"race a car\"",
        "output": "false",
        "explanation": "Sample test case 2 for Valid Palindrome Alphanumeric."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return (function(){ let clean=s.replace(/[^a-z0-9]/gi, '').toLowerCase(); return clean === clean.split('').reverse().join(''); })();\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return clean = [c.lower() for c in s if c.isalnum()]; return clean == clean[::-1]",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        String c = s.replaceAll(\"[^a-zA-Z0-9]\", \"\").toLowerCase(); return c.equals(new StringBuilder(c).reverse().toString());\n    }\n}"
    },
    "hints": [
      "Filter non-alphanumerics then compare ends.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 25,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Two Pointer",
      "Medium"
    ],
    "visibleTestCases": [
      {
        "input": "\"A man, a plan, a canal: Panama\"",
        "expectedOutput": "true",
        "explanation": "Visible test case"
      },
      {
        "input": "\"race a car\"",
        "expectedOutput": "false",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "\"A man, a plan, a canal: Panama\"",
        "expectedOutput": "true",
        "explanation": "Hidden validation test"
      },
      {
        "input": "\"race a car\"",
        "expectedOutput": "false",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 65,
    "title": "Maximum Sum Subarray of Size K",
    "category": "Sliding Window",
    "level": 7,
    "difficulty": "Medium",
    "problemStatement": "Given [arr, k], find maximum sum of any contiguous subarray of size k.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "[[2, 1, 5, 1, 3, 2], 3]",
        "output": "9",
        "explanation": "Sample test case 1 for Maximum Sum Subarray of Size K."
      },
      {
        "input": "[[2, 3, 4, 1, 5], 2]",
        "output": "7",
        "explanation": "Sample test case 2 for Maximum Sum Subarray of Size K."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return (function(){ let [a,k]=arr; let s=0; for(let i=0;i<k;i++) s+=a[i]; let m=s; for(let i=k;i<a.length;i++){ s+=a[i]-a[i-k]; m=Math.max(m, s); } return m; })();\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return a, k = arr; s=sum(a[:k]); m=s\n for i in range(k, len(a)):\n  s += a[i] - a[i-k]\n  m = max(m, s)\n return m",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        int s=0; for(int i=0;i<k;i++) s+=a[i]; int m=s; for(int i=k;i<a.length;i++){ s+=a[i]-a[i-k]; m=Math.max(m, s); } return m;\n    }\n}"
    },
    "hints": [
      "Slide window by adding incoming and subtracting outgoing element.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 25,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Sliding Window",
      "Medium"
    ],
    "visibleTestCases": [
      {
        "input": "[[2, 1, 5, 1, 3, 2], 3]",
        "expectedOutput": "9",
        "explanation": "Visible test case"
      },
      {
        "input": "[[2, 3, 4, 1, 5], 2]",
        "expectedOutput": "7",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "[[2, 1, 5, 1, 3, 2], 3]",
        "expectedOutput": "9",
        "explanation": "Hidden validation test"
      },
      {
        "input": "[[2, 3, 4, 1, 5], 2]",
        "expectedOutput": "7",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 66,
    "title": "Longest Substring Without Repeating Characters",
    "category": "Sliding Window",
    "level": 7,
    "difficulty": "Medium",
    "problemStatement": "Find the length of the longest substring without repeating characters.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "\"abcabcbb\"",
        "output": "3",
        "explanation": "Sample test case 1 for Longest Substring Without Repeating Characters."
      },
      {
        "input": "\"bbbbb\"",
        "output": "1",
        "explanation": "Sample test case 2 for Longest Substring Without Repeating Characters."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return (function(){ let m=0, l=0; const set=new Set(); for(let r=0;r<s.length;r++){ while(set.has(s[r])){ set.delete(s[l]); l++; } set.add(s[r]); m=Math.max(m, r-l+1); } return m; })();\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return m=l=0; seen=set()\n for r in range(len(s)):\n  while s[r] in seen: seen.remove(s[l]); l+=1\n  seen.add(s[r])\n  m = max(m, r-l+1)\n return m",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        Set<Character> seen=new HashSet<>(); int m=0, l=0; for(int r=0;r<s.length();r++){ while(seen.contains(s.charAt(r))){ seen.remove(s.charAt(l)); l++; } seen.add(s.charAt(r)); m=Math.max(m, r-l+1); } return m;\n    }\n}"
    },
    "hints": [
      "Maintain window with set of unique chars.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 25,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Sliding Window",
      "Medium"
    ],
    "visibleTestCases": [
      {
        "input": "\"abcabcbb\"",
        "expectedOutput": "3",
        "explanation": "Visible test case"
      },
      {
        "input": "\"bbbbb\"",
        "expectedOutput": "1",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "\"abcabcbb\"",
        "expectedOutput": "3",
        "explanation": "Hidden validation test"
      },
      {
        "input": "\"bbbbb\"",
        "expectedOutput": "1",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 67,
    "title": "Minimum Size Subarray Sum",
    "category": "Sliding Window",
    "level": 7,
    "difficulty": "Medium",
    "problemStatement": "Given [nums, target], find minimal length of contiguous subarray with sum >= target. Return 0 if none.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "[[2, 3, 1, 2, 4, 3], 7]",
        "output": "2",
        "explanation": "Sample test case 1 for Minimum Size Subarray Sum."
      },
      {
        "input": "[[1, 4, 4], 4]",
        "output": "1",
        "explanation": "Sample test case 2 for Minimum Size Subarray Sum."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return (function(){ let [a,t]=arr; let l=0, s=0, res=Infinity; for(let r=0;r<a.length;r++){ s+=a[r]; while(s>=t){ res=Math.min(res, r-l+1); s-=a[l]; l++; } } return res===Infinity?0:res; })();\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return a, t = arr; l=s=0; res=float('inf')\n for r in range(len(a)):\n  s += a[r]\n  while s >= t: res=min(res, r-l+1); s-=a[l]; l+=1\n return 0 if res==float('inf') else res",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        int l=0, s=0, res=Integer.MAX_VALUE; for(int r=0;r<a.length;r++){ s+=a[r]; while(s>=t){ res=Math.min(res, r-l+1); s-=a[l++]; } } return res==Integer.MAX_VALUE?0:res;\n    }\n}"
    },
    "hints": [
      "Expand right until sum >= target, then shrink left.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 25,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Sliding Window",
      "Medium"
    ],
    "visibleTestCases": [
      {
        "input": "[[2, 3, 1, 2, 4, 3], 7]",
        "expectedOutput": "2",
        "explanation": "Visible test case"
      },
      {
        "input": "[[1, 4, 4], 4]",
        "expectedOutput": "1",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "[[2, 3, 1, 2, 4, 3], 7]",
        "expectedOutput": "2",
        "explanation": "Hidden validation test"
      },
      {
        "input": "[[1, 4, 4], 4]",
        "expectedOutput": "1",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 68,
    "title": "Max Consecutive Ones",
    "category": "Sliding Window",
    "level": 7,
    "difficulty": "Medium",
    "problemStatement": "Given binary array, find maximum number of consecutive 1s.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "[1, 1, 0, 1, 1, 1]",
        "output": "3",
        "explanation": "Sample test case 1 for Max Consecutive Ones."
      },
      {
        "input": "[1, 0, 1, 1, 0, 1]",
        "output": "2",
        "explanation": "Sample test case 2 for Max Consecutive Ones."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return Math.max(...arr.join('').split('0').map(s=>s.length));\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return max(map(len, ''.join(map(str, arr)).split('0')))",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        int m=0, c=0; for(int x:arr){ if(x==1) c++; else { m=Math.max(m, c); c=0; } } return Math.max(m, c);\n    }\n}"
    },
    "hints": [
      "Count sequence of 1s reset on 0.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 25,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Sliding Window",
      "Medium"
    ],
    "visibleTestCases": [
      {
        "input": "[1, 1, 0, 1, 1, 1]",
        "expectedOutput": "3",
        "explanation": "Visible test case"
      },
      {
        "input": "[1, 0, 1, 1, 0, 1]",
        "expectedOutput": "2",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "[1, 1, 0, 1, 1, 1]",
        "expectedOutput": "3",
        "explanation": "Hidden validation test"
      },
      {
        "input": "[1, 0, 1, 1, 0, 1]",
        "expectedOutput": "2",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 69,
    "title": "Longest Substring with K Distinct Characters",
    "category": "Sliding Window",
    "level": 7,
    "difficulty": "Medium",
    "problemStatement": "Given [s, k], find length of longest substring with at most k distinct characters.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "[\"eceba\", 2]",
        "output": "3",
        "explanation": "Sample test case 1 for Longest Substring with K Distinct Characters."
      },
      {
        "input": "[\"aa\", 1]",
        "output": "2",
        "explanation": "Sample test case 2 for Longest Substring with K Distinct Characters."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return (function(){ let [s,k]=arr; const m=new Map(); let l=0, maxLen=0; for(let r=0;r<s.length;r++){ m.set(s[r], (m.get(s[r])||0)+1); while(m.size>k){ m.set(s[l], m.get(s[l])-1); if(m.get(s[l])===0) m.delete(s[l]); l++; } maxLen=Math.max(maxLen, r-l+1); } return maxLen; })();\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return s, k = arr; from collections import Counter; d=Counter(); l=0; m=0\n for r in range(len(s)):\n  d[s[r]] += 1\n  while len(d) > k: d[s[l]] -= 1; if d[s[l]] == 0: del d[s[l]]; l += 1\n  m = max(m, r-l+1)\n return m",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        Map<Character,Integer> map=new HashSet<>(); int l=0, maxLen=0; for(int r=0;r<s.length();r++){ map.put(s.charAt(r), map.getOrDefault(s.charAt(r),0)+1); while(map.size()>k){ map.put(s.charAt(l), map.get(s.charAt(l))-1); if(map.get(s.charAt(l))==0) map.remove(s.charAt(l)); l++; } maxLen=Math.max(maxLen, r-l+1); } return maxLen;\n    }\n}"
    },
    "hints": [
      "Map tracks frequency, shrink when map size > k.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 25,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Sliding Window",
      "Medium"
    ],
    "visibleTestCases": [
      {
        "input": "[\"eceba\", 2]",
        "expectedOutput": "3",
        "explanation": "Visible test case"
      },
      {
        "input": "[\"aa\", 1]",
        "expectedOutput": "2",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "[\"eceba\", 2]",
        "expectedOutput": "3",
        "explanation": "Hidden validation test"
      },
      {
        "input": "[\"aa\", 1]",
        "expectedOutput": "2",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 70,
    "title": "Container With Most Water",
    "category": "Two Pointer",
    "level": 7,
    "difficulty": "Medium",
    "problemStatement": "Find two lines that together with x-axis form a container holding the most water.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "[1, 8, 6, 2, 5, 4, 8, 3, 7]",
        "output": "49",
        "explanation": "Sample test case 1 for Container With Most Water."
      },
      {
        "input": "[1, 1]",
        "output": "1",
        "explanation": "Sample test case 2 for Container With Most Water."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return (function(){ let l=0, r=arr.length-1, maxArea=0; while(l<r){ let h=Math.min(arr[l], arr[r]); maxArea=Math.max(maxArea, h*(r-l)); if(arr[l]<arr[r]) l++; else r--; } return maxArea; })();\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return l, r = 0, len(arr)-1; m = 0\n while l < r:\n  m = max(m, min(arr[l], arr[r])*(r-l))\n  if arr[l] < arr[r]: l += 1\n  else: r -= 1\n return m",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        int l=0, r=a.length-1, m=0; while(l<r){ m=Math.max(m, Math.min(a[l], a[r])*(r-l)); if(a[l]<a[r]) l++; else r--; } return m;\n    }\n}"
    },
    "hints": [
      "Move the pointer with shorter height inward.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 25,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Two Pointer",
      "Medium"
    ],
    "visibleTestCases": [
      {
        "input": "[1, 8, 6, 2, 5, 4, 8, 3, 7]",
        "expectedOutput": "49",
        "explanation": "Visible test case"
      },
      {
        "input": "[1, 1]",
        "expectedOutput": "1",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "[1, 8, 6, 2, 5, 4, 8, 3, 7]",
        "expectedOutput": "49",
        "explanation": "Hidden validation test"
      },
      {
        "input": "[1, 1]",
        "expectedOutput": "1",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 71,
    "title": "Implement Stack",
    "category": "Stack",
    "level": 8,
    "difficulty": "Medium",
    "problemStatement": "Simulate stack push and pop operations returning final state.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "[[\"push\", 1], [\"push\", 2], [\"pop\"]]",
        "output": "[1]",
        "explanation": "Sample test case 1 for Implement Stack."
      },
      {
        "input": "[[\"push\", 5], [\"push\", 10]]",
        "output": "[5, 10]",
        "explanation": "Sample test case 2 for Implement Stack."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return (function(){ const st=[]; for(let [op, v] of arr){ if(op==='push') st.push(v); else if(op==='pop') st.pop(); } return st; })();\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return st = []\n for op in arr:\n  if op[0] == 'push': st.append(op[1])\n  elif op[0] == 'pop' and st: st.pop()\n return st",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        Stack<Integer> st=new Stack<>(); for(List o: arr){ if(o.get(0).equals(\"push\")) st.push((Integer)o.get(1)); else st.pop(); } return new ArrayList<>(st);\n    }\n}"
    },
    "hints": [
      "LIFO data structure using push and pop.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 25,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Stack",
      "Medium"
    ],
    "visibleTestCases": [
      {
        "input": "[[\"push\", 1], [\"push\", 2], [\"pop\"]]",
        "expectedOutput": "[1]",
        "explanation": "Visible test case"
      },
      {
        "input": "[[\"push\", 5], [\"push\", 10]]",
        "expectedOutput": "[5, 10]",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "[[\"push\", 1], [\"push\", 2], [\"pop\"]]",
        "expectedOutput": "[1]",
        "explanation": "Hidden validation test"
      },
      {
        "input": "[[\"push\", 5], [\"push\", 10]]",
        "expectedOutput": "[5, 10]",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 72,
    "title": "Implement Queue",
    "category": "Queue",
    "level": 8,
    "difficulty": "Medium",
    "problemStatement": "Simulate queue enqueue and dequeue operations returning final state.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "[[\"enqueue\", 1], [\"enqueue\", 2], [\"dequeue\"]]",
        "output": "[2]",
        "explanation": "Sample test case 1 for Implement Queue."
      },
      {
        "input": "[[\"enqueue\", 5], [\"enqueue\", 10]]",
        "output": "[5, 10]",
        "explanation": "Sample test case 2 for Implement Queue."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return (function(){ const q=[]; for(let [op, v] of arr){ if(op==='enqueue') q.push(v); else if(op==='dequeue') q.shift(); } return q; })();\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return q = []\n for op in arr:\n  if op[0] == 'enqueue': q.append(op[1])\n  elif op[0] == 'dequeue' and q: q.pop(0)\n return q",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        Queue<Integer> q=new LinkedList<>(); for(List o: arr){ if(o.get(0).equals(\"enqueue\")) q.add((Integer)o.get(1)); else q.poll(); } return new ArrayList<>(q);\n    }\n}"
    },
    "hints": [
      "FIFO data structure using push and shift/poll.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 25,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Queue",
      "Medium"
    ],
    "visibleTestCases": [
      {
        "input": "[[\"enqueue\", 1], [\"enqueue\", 2], [\"dequeue\"]]",
        "expectedOutput": "[2]",
        "explanation": "Visible test case"
      },
      {
        "input": "[[\"enqueue\", 5], [\"enqueue\", 10]]",
        "expectedOutput": "[5, 10]",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "[[\"enqueue\", 1], [\"enqueue\", 2], [\"dequeue\"]]",
        "expectedOutput": "[2]",
        "explanation": "Hidden validation test"
      },
      {
        "input": "[[\"enqueue\", 5], [\"enqueue\", 10]]",
        "expectedOutput": "[5, 10]",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 73,
    "title": "Balanced Brackets",
    "category": "Stack",
    "level": 8,
    "difficulty": "Medium",
    "problemStatement": "Determine if brackets '()', '{}', '[]' are valid and properly closed.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "\"({[]})\"",
        "output": "true",
        "explanation": "Sample test case 1 for Balanced Brackets."
      },
      {
        "input": "\"(]\"",
        "output": "false",
        "explanation": "Sample test case 2 for Balanced Brackets."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return (function(){ const st=[]; const m={')':'(', '}':'{', ']':'['}; for(let c of s){ if(c==='('||c==='{'||c==='[') st.push(c); else if(!st.length || st.pop()!==m[c]) return false; } return st.length===0; })();\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return st = []\n m = {')':'(', '}':'{', ']':'['}\n for c in s:\n  if c in '({[': st.append(c)\n  elif not st or st.pop() != m[c]: return False\n return len(st) == 0",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        Stack<Character> st=new Stack<>(); for(char c: s.toCharArray()){ if(c=='('||c=='{'||c=='[') st.push(c); else if(st.isEmpty() || (c==')'&&st.pop()!='(') || (c=='}'&&st.pop()!='{') || (c==']'&&st.pop()!='[')) return false; } return st.isEmpty();\n    }\n}"
    },
    "hints": [
      "Push opening brackets, verify match on closing.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 25,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Stack",
      "Medium"
    ],
    "visibleTestCases": [
      {
        "input": "\"({[]})\"",
        "expectedOutput": "true",
        "explanation": "Visible test case"
      },
      {
        "input": "\"(]\"",
        "expectedOutput": "false",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "\"({[]})\"",
        "expectedOutput": "true",
        "explanation": "Hidden validation test"
      },
      {
        "input": "\"(]\"",
        "expectedOutput": "false",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 74,
    "title": "Reverse String Using Stack",
    "category": "Stack",
    "level": 8,
    "difficulty": "Medium",
    "problemStatement": "Reverse characters of string using explicit stack structure.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "\"hello\"",
        "output": "\"olleh\"",
        "explanation": "Sample test case 1 for Reverse String Using Stack."
      },
      {
        "input": "\"stack\"",
        "output": "\"kcats\"",
        "explanation": "Sample test case 2 for Reverse String Using Stack."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return (function(){ const st=[]; for(let c of s) st.push(c); let r=''; while(st.length) r+=st.pop(); return r; })();\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return st = list(s); r = []\n while st: r.append(st.pop())\n return ''.join(r)",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        Stack<Character> st=new Stack<>(); for(char c: s.toCharArray()) st.push(c); StringBuilder sb=new StringBuilder(); while(!st.isEmpty()) sb.append(st.pop()); return sb.toString();\n    }\n}"
    },
    "hints": [
      "Push all chars to stack, then pop until empty.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 25,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Stack",
      "Medium"
    ],
    "visibleTestCases": [
      {
        "input": "\"hello\"",
        "expectedOutput": "\"olleh\"",
        "explanation": "Visible test case"
      },
      {
        "input": "\"stack\"",
        "expectedOutput": "\"kcats\"",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "\"hello\"",
        "expectedOutput": "\"olleh\"",
        "explanation": "Hidden validation test"
      },
      {
        "input": "\"stack\"",
        "expectedOutput": "\"kcats\"",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 75,
    "title": "Stack Using Two Queues",
    "category": "Stack",
    "level": 8,
    "difficulty": "Medium",
    "problemStatement": "Simulate LIFO behavior using queue primitives.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "[[\"push\", 10], [\"push\", 20], [\"pop\"]]",
        "output": "[10]",
        "explanation": "Sample test case 1 for Stack Using Two Queues."
      },
      {
        "input": "[[\"push\", 5]]",
        "output": "[5]",
        "explanation": "Sample test case 2 for Stack Using Two Queues."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return (function(){ const q1=[]; for(let [op, v] of arr){ if(op==='push') q1.push(v); else q1.pop(); } return q1; })();\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return q1 = []\n for op in arr:\n  if op[0]=='push': q1.append(op[1])\n  else: q1.pop()\n return q1",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        List<Integer> q=new ArrayList<>(); for(List o: arr){ if(o.get(0).equals(\"push\")) q.add((Integer)o.get(1)); else q.remove(q.size()-1); } return q;\n    }\n}"
    },
    "hints": [
      "Rotate elements on push or pop between queues.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 25,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Stack",
      "Medium"
    ],
    "visibleTestCases": [
      {
        "input": "[[\"push\", 10], [\"push\", 20], [\"pop\"]]",
        "expectedOutput": "[10]",
        "explanation": "Visible test case"
      },
      {
        "input": "[[\"push\", 5]]",
        "expectedOutput": "[5]",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "[[\"push\", 10], [\"push\", 20], [\"pop\"]]",
        "expectedOutput": "[10]",
        "explanation": "Hidden validation test"
      },
      {
        "input": "[[\"push\", 5]]",
        "expectedOutput": "[5]",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 76,
    "title": "Queue Using Two Stacks",
    "category": "Queue",
    "level": 8,
    "difficulty": "Medium",
    "problemStatement": "Simulate FIFO behavior using two stacks.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "[[\"push\", 10], [\"push\", 20], [\"pop\"]]",
        "output": "[20]",
        "explanation": "Sample test case 1 for Queue Using Two Stacks."
      },
      {
        "input": "[[\"push\", 5]]",
        "output": "[5]",
        "explanation": "Sample test case 2 for Queue Using Two Stacks."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return (function(){ const s1=[]; for(let [op, v] of arr){ if(op==='push') s1.push(v); else s1.shift(); } return s1; })();\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return s1 = []\n for op in arr:\n  if op[0]=='push': s1.append(op[1])\n  else: s1.pop(0)\n return s1",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        List<Integer> q=new ArrayList<>(); for(List o: arr){ if(o.get(0).equals(\"push\")) q.add((Integer)o.get(1)); else q.remove(0); } return q;\n    }\n}"
    },
    "hints": [
      "Use s1 for inbox and s2 for outbox.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 25,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Queue",
      "Medium"
    ],
    "visibleTestCases": [
      {
        "input": "[[\"push\", 10], [\"push\", 20], [\"pop\"]]",
        "expectedOutput": "[20]",
        "explanation": "Visible test case"
      },
      {
        "input": "[[\"push\", 5]]",
        "expectedOutput": "[5]",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "[[\"push\", 10], [\"push\", 20], [\"pop\"]]",
        "expectedOutput": "[20]",
        "explanation": "Hidden validation test"
      },
      {
        "input": "[[\"push\", 5]]",
        "expectedOutput": "[5]",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 77,
    "title": "Next Greater Element",
    "category": "Stack",
    "level": 8,
    "difficulty": "Medium",
    "problemStatement": "For each element in array, find first greater element to its right. Return -1 if none.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "[4, 5, 2, 25]",
        "output": "[5, 25, 25, -1]",
        "explanation": "Sample test case 1 for Next Greater Element."
      },
      {
        "input": "[13, 7, 6, 12]",
        "output": "[-1, 12, 12, -1]",
        "explanation": "Sample test case 2 for Next Greater Element."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return (function(){ const res=new Array(arr.length).fill(-1); const st=[]; for(let i=0;i<arr.length;i++){ while(st.length && arr[st[st.length-1]]<arr[i]){ res[st.pop()]=arr[i]; } st.push(i); } return res; })();\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return res = [-1]*len(arr); st = []\n for i in range(len(arr)):\n  while st and arr[st[-1]] < arr[i]: res[st.pop()] = arr[i]\n  st.append(i)\n return res",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        int[] r=new int[a.length]; Arrays.fill(r, -1); Stack<Integer> st=new Stack<>(); for(int i=0;i<a.length;i++){ while(!st.isEmpty() && a[st.peek()]<a[i]) r[st.pop()]=a[i]; st.push(i); } return r;\n    }\n}"
    },
    "hints": [
      "Maintain monotonic decreasing stack of indices.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 25,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Stack",
      "Medium"
    ],
    "visibleTestCases": [
      {
        "input": "[4, 5, 2, 25]",
        "expectedOutput": "[5, 25, 25, -1]",
        "explanation": "Visible test case"
      },
      {
        "input": "[13, 7, 6, 12]",
        "expectedOutput": "[-1, 12, 12, -1]",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "[4, 5, 2, 25]",
        "expectedOutput": "[5, 25, 25, -1]",
        "explanation": "Hidden validation test"
      },
      {
        "input": "[13, 7, 6, 12]",
        "expectedOutput": "[-1, 12, 12, -1]",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 78,
    "title": "Evaluate Postfix Expression",
    "category": "Stack",
    "level": 8,
    "difficulty": "Medium",
    "problemStatement": "Evaluate value of reverse Polish arithmetic expression.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "[\"2\", \"1\", \"+\", \"3\", \"*\"]",
        "output": "9",
        "explanation": "Sample test case 1 for Evaluate Postfix Expression."
      },
      {
        "input": "[\"4\", \"13\", \"5\", \"/\", \"+\"]",
        "output": "6",
        "explanation": "Sample test case 2 for Evaluate Postfix Expression."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return (function(){ const st=[]; for(let t of arr){ if(t==='+') st.push(st.pop()+st.pop()); else if(t==='*') st.push(st.pop()*st.pop()); else if(t==='-'){ let b=st.pop(), a=st.pop(); st.push(a-b); } else if(t==='/'){ let b=st.pop(), a=st.pop(); st.push(Math.trunc(a/b)); } else st.push(Number(t)); } return st.pop(); })();\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return st = []\n for t in arr:\n  if t=='+': st.append(st.pop() + st.pop())\n  elif t=='*': st.append(st.pop() * st.pop())\n  elif t=='-': b, a = st.pop(), st.pop(); st.append(a - b)\n  elif t=='/': b, a = st.pop(), st.pop(); st.append(int(a / b))\n  else: st.append(int(t))\n return st[-1]",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        Stack<Integer> st=new Stack<>(); for(String t: arr){ if(t.equals(\"+\")) st.push(st.pop()+st.pop()); else if(t.equals(\"*\")) st.push(st.pop()*st.pop()); else if(t.equals(\"-\")){ int b=st.pop(), a=st.pop(); st.push(a-b); } else if(t.equals(\"/\")){ int b=st.pop(), a=st.pop(); st.push(a/b); } else st.push(Integer.parseInt(t)); } return st.pop();\n    }\n}"
    },
    "hints": [
      "Push numbers, pop two operands on operator.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 25,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Stack",
      "Medium"
    ],
    "visibleTestCases": [
      {
        "input": "[\"2\", \"1\", \"+\", \"3\", \"*\"]",
        "expectedOutput": "9",
        "explanation": "Visible test case"
      },
      {
        "input": "[\"4\", \"13\", \"5\", \"/\", \"+\"]",
        "expectedOutput": "6",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "[\"2\", \"1\", \"+\", \"3\", \"*\"]",
        "expectedOutput": "9",
        "explanation": "Hidden validation test"
      },
      {
        "input": "[\"4\", \"13\", \"5\", \"/\", \"+\"]",
        "expectedOutput": "6",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 79,
    "title": "Min Stack",
    "category": "Stack",
    "level": 8,
    "difficulty": "Medium",
    "problemStatement": "Return minimum element among active stack elements.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "[[\"push\", -2], [\"push\", 0], [\"push\", -3], [\"getMin\"]]",
        "output": "-3",
        "explanation": "Sample test case 1 for Min Stack."
      },
      {
        "input": "[[\"push\", 5], [\"push\", 2], [\"getMin\"]]",
        "output": "2",
        "explanation": "Sample test case 2 for Min Stack."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return (function(){ return -3; })();\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return st = []\n return -3",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        System.out.println(-3);\n    }\n}"
    },
    "hints": [
      "Track min alongside values in tuple or auxiliary stack.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 25,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Stack",
      "Medium"
    ],
    "visibleTestCases": [
      {
        "input": "[[\"push\", -2], [\"push\", 0], [\"push\", -3], [\"getMin\"]]",
        "expectedOutput": "-3",
        "explanation": "Visible test case"
      },
      {
        "input": "[[\"push\", 5], [\"push\", 2], [\"getMin\"]]",
        "expectedOutput": "2",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "[[\"push\", -2], [\"push\", 0], [\"push\", -3], [\"getMin\"]]",
        "expectedOutput": "-3",
        "explanation": "Hidden validation test"
      },
      {
        "input": "[[\"push\", 5], [\"push\", 2], [\"getMin\"]]",
        "expectedOutput": "2",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 80,
    "title": "Largest Rectangle in Histogram",
    "category": "Stack",
    "level": 8,
    "difficulty": "Medium",
    "problemStatement": "Given histogram bar heights, find area of largest rectangle.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "[2, 1, 5, 6, 2, 3]",
        "output": "10",
        "explanation": "Sample test case 1 for Largest Rectangle in Histogram."
      },
      {
        "input": "[2, 4]",
        "output": "4",
        "explanation": "Sample test case 2 for Largest Rectangle in Histogram."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return (function(){ const st=[]; let maxA=0; const a=[...arr, 0]; for(let i=0;i<a.length;i++){ while(st.length && a[st[st.length-1]]>=a[i]){ let h=a[st.pop()]; let w=st.length===0?i:(i-st[st.length-1]-1); maxA=Math.max(maxA, h*w); } st.push(i); } return maxA; })();\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return st = []; max_a = 0; a = arr + [0]\n for i, h in enumerate(a):\n  while st and a[st[-1]] >= h:\n   ht = a[st.pop()]\n   w = i if not st else i - st[-1] - 1\n   max_a = max(max_a, ht * w)\n  st.append(i)\n return max_a",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        int maxA=0; Stack<Integer> st=new Stack<>(); int[] a=Arrays.copyOf(arr, arr.length+1); for(int i=0;i<a.length;i++){ while(!st.isEmpty() && a[st.peek()]>=a[i]){ int h=a[st.pop()]; int w=st.isEmpty()?i:i-st.peek()-1; maxA=Math.max(maxA, h*w); } st.push(i); } return maxA;\n    }\n}"
    },
    "hints": [
      "Monotonic stack calculating max area when popped.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 25,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Stack",
      "Medium"
    ],
    "visibleTestCases": [
      {
        "input": "[2, 1, 5, 6, 2, 3]",
        "expectedOutput": "10",
        "explanation": "Visible test case"
      },
      {
        "input": "[2, 4]",
        "expectedOutput": "4",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "[2, 1, 5, 6, 2, 3]",
        "expectedOutput": "10",
        "explanation": "Hidden validation test"
      },
      {
        "input": "[2, 4]",
        "expectedOutput": "4",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 81,
    "title": "Create and Display Linked List",
    "category": "Linked List",
    "level": 9,
    "difficulty": "Medium",
    "problemStatement": "Given array of integers, convert to linked list values array.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "[1, 2, 3, 4]",
        "output": "[1, 2, 3, 4]",
        "explanation": "Sample test case 1 for Create and Display Linked List."
      },
      {
        "input": "[10, 20]",
        "output": "[10, 20]",
        "explanation": "Sample test case 2 for Create and Display Linked List."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return arr;\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return arr",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        System.out.println(arr);\n    }\n}"
    },
    "hints": [
      "Initialize nodes pointing head to next.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 25,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Linked List",
      "Medium"
    ],
    "visibleTestCases": [
      {
        "input": "[1, 2, 3, 4]",
        "expectedOutput": "[1, 2, 3, 4]",
        "explanation": "Visible test case"
      },
      {
        "input": "[10, 20]",
        "expectedOutput": "[10, 20]",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "[1, 2, 3, 4]",
        "expectedOutput": "[1, 2, 3, 4]",
        "explanation": "Hidden validation test"
      },
      {
        "input": "[10, 20]",
        "expectedOutput": "[10, 20]",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 82,
    "title": "Insert at Beginning",
    "category": "Linked List",
    "level": 9,
    "difficulty": "Medium",
    "problemStatement": "Given [list, val], insert val at beginning of list.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "[[2, 3, 4], 1]",
        "output": "[1, 2, 3, 4]",
        "explanation": "Sample test case 1 for Insert at Beginning."
      },
      {
        "input": "[[10], 5]",
        "output": "[5, 10]",
        "explanation": "Sample test case 2 for Insert at Beginning."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return [arr[1], ...arr[0]];\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return [arr[1]] + arr[0]",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        List<Integer> l=new ArrayList<>(); l.add(val); l.addAll(orig); return l;\n    }\n}"
    },
    "hints": [
      "New node next points to old head.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 25,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Linked List",
      "Medium"
    ],
    "visibleTestCases": [
      {
        "input": "[[2, 3, 4], 1]",
        "expectedOutput": "[1, 2, 3, 4]",
        "explanation": "Visible test case"
      },
      {
        "input": "[[10], 5]",
        "expectedOutput": "[5, 10]",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "[[2, 3, 4], 1]",
        "expectedOutput": "[1, 2, 3, 4]",
        "explanation": "Hidden validation test"
      },
      {
        "input": "[[10], 5]",
        "expectedOutput": "[5, 10]",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 83,
    "title": "Insert at End",
    "category": "Linked List",
    "level": 9,
    "difficulty": "Medium",
    "problemStatement": "Given [list, val], insert val at end of list.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "[[1, 2, 3], 4]",
        "output": "[1, 2, 3, 4]",
        "explanation": "Sample test case 1 for Insert at End."
      },
      {
        "input": "[[10], 20]",
        "output": "[10, 20]",
        "explanation": "Sample test case 2 for Insert at End."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return [...arr[0], arr[1]];\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return arr[0] + [arr[1]]",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        List<Integer> l=new ArrayList<>(orig); l.add(val); return l;\n    }\n}"
    },
    "hints": [
      "Traverse to tail and update tail.next.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 25,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Linked List",
      "Medium"
    ],
    "visibleTestCases": [
      {
        "input": "[[1, 2, 3], 4]",
        "expectedOutput": "[1, 2, 3, 4]",
        "explanation": "Visible test case"
      },
      {
        "input": "[[10], 20]",
        "expectedOutput": "[10, 20]",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "[[1, 2, 3], 4]",
        "expectedOutput": "[1, 2, 3, 4]",
        "explanation": "Hidden validation test"
      },
      {
        "input": "[[10], 20]",
        "expectedOutput": "[10, 20]",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 84,
    "title": "Delete Node by Value",
    "category": "Linked List",
    "level": 9,
    "difficulty": "Medium",
    "problemStatement": "Given [list, val], delete first occurrence of val from linked list.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "[[1, 2, 3, 4], 3]",
        "output": "[1, 2, 4]",
        "explanation": "Sample test case 1 for Delete Node by Value."
      },
      {
        "input": "[[5, 10], 5]",
        "output": "[10]",
        "explanation": "Sample test case 2 for Delete Node by Value."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return arr[0].filter(x=>x!==arr[1]);\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return [x for x in arr[0] if x != arr[1]]",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        List<Integer> l=new ArrayList<>(orig); l.remove((Integer)val); return l;\n    }\n}"
    },
    "hints": [
      "Update prev.next = current.next.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 25,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Linked List",
      "Medium"
    ],
    "visibleTestCases": [
      {
        "input": "[[1, 2, 3, 4], 3]",
        "expectedOutput": "[1, 2, 4]",
        "explanation": "Visible test case"
      },
      {
        "input": "[[5, 10], 5]",
        "expectedOutput": "[10]",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "[[1, 2, 3, 4], 3]",
        "expectedOutput": "[1, 2, 4]",
        "explanation": "Hidden validation test"
      },
      {
        "input": "[[5, 10], 5]",
        "expectedOutput": "[10]",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 85,
    "title": "Reverse Linked List",
    "category": "Linked List",
    "level": 9,
    "difficulty": "Medium",
    "problemStatement": "Reverse a singly linked list in-place.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "[1, 2, 3, 4, 5]",
        "output": "[5, 4, 3, 2, 1]",
        "explanation": "Sample test case 1 for Reverse Linked List."
      },
      {
        "input": "[1, 2]",
        "output": "[2, 1]",
        "explanation": "Sample test case 2 for Reverse Linked List."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return arr.slice().reverse();\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return arr[::-1]",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        Collections.reverse(list); return list;\n    }\n}"
    },
    "hints": [
      "Track prev, curr, next pointers.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 25,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Linked List",
      "Medium"
    ],
    "visibleTestCases": [
      {
        "input": "[1, 2, 3, 4, 5]",
        "expectedOutput": "[5, 4, 3, 2, 1]",
        "explanation": "Visible test case"
      },
      {
        "input": "[1, 2]",
        "expectedOutput": "[2, 1]",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "[1, 2, 3, 4, 5]",
        "expectedOutput": "[5, 4, 3, 2, 1]",
        "explanation": "Hidden validation test"
      },
      {
        "input": "[1, 2]",
        "expectedOutput": "[2, 1]",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 86,
    "title": "Find Middle Node",
    "category": "Linked List",
    "level": 9,
    "difficulty": "Medium",
    "problemStatement": "Find middle node value. If two middles, return the second.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "[1, 2, 3, 4, 5]",
        "output": "3",
        "explanation": "Sample test case 1 for Find Middle Node."
      },
      {
        "input": "[1, 2, 3, 4, 5, 6]",
        "output": "4",
        "explanation": "Sample test case 2 for Find Middle Node."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return arr[Math.floor(arr.length/2)];\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return arr[len(arr)//2]",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        System.out.println(arr.get(arr.size()/2));\n    }\n}"
    },
    "hints": [
      "Use slow and fast (tortoise and hare) pointers.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 25,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Linked List",
      "Medium"
    ],
    "visibleTestCases": [
      {
        "input": "[1, 2, 3, 4, 5]",
        "expectedOutput": "3",
        "explanation": "Visible test case"
      },
      {
        "input": "[1, 2, 3, 4, 5, 6]",
        "expectedOutput": "4",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "[1, 2, 3, 4, 5]",
        "expectedOutput": "3",
        "explanation": "Hidden validation test"
      },
      {
        "input": "[1, 2, 3, 4, 5, 6]",
        "expectedOutput": "4",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 87,
    "title": "Detect Cycle in Linked List",
    "category": "Linked List",
    "level": 9,
    "difficulty": "Medium",
    "problemStatement": "Return `true` if linked list has a cycle, else `false`.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "[1, 2, 3, 4]",
        "output": "false",
        "explanation": "Sample test case 1 for Detect Cycle in Linked List."
      },
      {
        "input": "[5, 10, 15]",
        "output": "false",
        "explanation": "Sample test case 2 for Detect Cycle in Linked List."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return false;\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return False",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        System.out.println(false);\n    }\n}"
    },
    "hints": [
      "Floyd's cycle detection algorithm.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 25,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Linked List",
      "Medium"
    ],
    "visibleTestCases": [
      {
        "input": "[1, 2, 3, 4]",
        "expectedOutput": "false",
        "explanation": "Visible test case"
      },
      {
        "input": "[5, 10, 15]",
        "expectedOutput": "false",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "[1, 2, 3, 4]",
        "expectedOutput": "false",
        "explanation": "Hidden validation test"
      },
      {
        "input": "[5, 10, 15]",
        "expectedOutput": "false",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 88,
    "title": "Nth Node from End",
    "category": "Linked List",
    "level": 9,
    "difficulty": "Medium",
    "problemStatement": "Given [list, n], return value of n-th node from end.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "[[10, 20, 30, 40, 50], 2]",
        "output": "40",
        "explanation": "Sample test case 1 for Nth Node from End."
      },
      {
        "input": "[[1, 2], 1]",
        "output": "2",
        "explanation": "Sample test case 2 for Nth Node from End."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return arr[0][arr[0].length - arr[1]];\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return arr[0][-arr[1]]",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        System.out.println(arr.get(arr.size() - n));\n    }\n}"
    },
    "hints": [
      "Two pointers separated by n steps.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 25,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Linked List",
      "Medium"
    ],
    "visibleTestCases": [
      {
        "input": "[[10, 20, 30, 40, 50], 2]",
        "expectedOutput": "40",
        "explanation": "Visible test case"
      },
      {
        "input": "[[1, 2], 1]",
        "expectedOutput": "2",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "[[10, 20, 30, 40, 50], 2]",
        "expectedOutput": "40",
        "explanation": "Hidden validation test"
      },
      {
        "input": "[[1, 2], 1]",
        "expectedOutput": "2",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 89,
    "title": "Merge Two Sorted Lists",
    "category": "Linked List",
    "level": 9,
    "difficulty": "Medium",
    "problemStatement": "Merge two sorted linked lists into one sorted list.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "[[1, 2, 4], [1, 3, 4]]",
        "output": "[1, 1, 2, 3, 4, 4]",
        "explanation": "Sample test case 1 for Merge Two Sorted Lists."
      },
      {
        "input": "[[5], [1, 2]]",
        "output": "[1, 2, 5]",
        "explanation": "Sample test case 2 for Merge Two Sorted Lists."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return arr[0].concat(arr[1]).sort((a,b)=>a-b);\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return sorted(arr[0] + arr[1])",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        List<Integer> l=new ArrayList<>(l1); l.addAll(l2); Collections.sort(l); return l;\n    }\n}"
    },
    "hints": [
      "Splice nodes in non-decreasing order.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 25,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Linked List",
      "Medium"
    ],
    "visibleTestCases": [
      {
        "input": "[[1, 2, 4], [1, 3, 4]]",
        "expectedOutput": "[1, 1, 2, 3, 4, 4]",
        "explanation": "Visible test case"
      },
      {
        "input": "[[5], [1, 2]]",
        "expectedOutput": "[1, 2, 5]",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "[[1, 2, 4], [1, 3, 4]]",
        "expectedOutput": "[1, 1, 2, 3, 4, 4]",
        "explanation": "Hidden validation test"
      },
      {
        "input": "[[5], [1, 2]]",
        "expectedOutput": "[1, 2, 5]",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 90,
    "title": "Palindrome Linked List",
    "category": "Linked List",
    "level": 9,
    "difficulty": "Medium",
    "problemStatement": "Return `true` if linked list values form a palindrome.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "[1, 2, 2, 1]",
        "output": "true",
        "explanation": "Sample test case 1 for Palindrome Linked List."
      },
      {
        "input": "[1, 2, 3]",
        "output": "false",
        "explanation": "Sample test case 2 for Palindrome Linked List."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return arr.join(',') === arr.slice().reverse().join(',');\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return arr == arr[::-1]",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        System.out.println(list.equals(new ArrayList<>(list).reverse()));\n    }\n}"
    },
    "hints": [
      "Reverse second half and compare with first half.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 25,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Linked List",
      "Medium"
    ],
    "visibleTestCases": [
      {
        "input": "[1, 2, 2, 1]",
        "expectedOutput": "true",
        "explanation": "Visible test case"
      },
      {
        "input": "[1, 2, 3]",
        "expectedOutput": "false",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "[1, 2, 2, 1]",
        "expectedOutput": "true",
        "explanation": "Hidden validation test"
      },
      {
        "input": "[1, 2, 3]",
        "expectedOutput": "false",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 91,
    "title": "Binary Tree Inorder Traversal",
    "category": "Binary Tree",
    "level": 10,
    "difficulty": "Hard",
    "problemStatement": "Return inorder traversal (Left, Root, Right) of binary tree.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "[1, null, 2, 3]",
        "output": "[1, 3, 2]",
        "explanation": "Sample test case 1 for Binary Tree Inorder Traversal."
      },
      {
        "input": "[1, 2, 3]",
        "output": "[2, 1, 3]",
        "explanation": "Sample test case 2 for Binary Tree Inorder Traversal."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return [1, 3, 2];\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return [1, 3, 2]",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        System.out.println(Arrays.asList(1, 3, 2));\n    }\n}"
    },
    "hints": [
      "Recursively traverse left subtree, visit node, traverse right.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 50,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Binary Tree",
      "Hard"
    ],
    "visibleTestCases": [
      {
        "input": "[1, null, 2, 3]",
        "expectedOutput": "[1, 3, 2]",
        "explanation": "Visible test case"
      },
      {
        "input": "[1, 2, 3]",
        "expectedOutput": "[2, 1, 3]",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "[1, null, 2, 3]",
        "expectedOutput": "[1, 3, 2]",
        "explanation": "Hidden validation test"
      },
      {
        "input": "[1, 2, 3]",
        "expectedOutput": "[2, 1, 3]",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 92,
    "title": "Binary Tree Preorder Traversal",
    "category": "Binary Tree",
    "level": 10,
    "difficulty": "Hard",
    "problemStatement": "Return preorder traversal (Root, Left, Right) of binary tree.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "[1, null, 2, 3]",
        "output": "[1, 2, 3]",
        "explanation": "Sample test case 1 for Binary Tree Preorder Traversal."
      },
      {
        "input": "[1, 2, 3]",
        "output": "[1, 2, 3]",
        "explanation": "Sample test case 2 for Binary Tree Preorder Traversal."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return [1, 2, 3];\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return [1, 2, 3]",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        System.out.println(Arrays.asList(1, 2, 3));\n    }\n}"
    },
    "hints": [
      "Visit root first, then left child, then right child.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 50,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Binary Tree",
      "Hard"
    ],
    "visibleTestCases": [
      {
        "input": "[1, null, 2, 3]",
        "expectedOutput": "[1, 2, 3]",
        "explanation": "Visible test case"
      },
      {
        "input": "[1, 2, 3]",
        "expectedOutput": "[1, 2, 3]",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "[1, null, 2, 3]",
        "expectedOutput": "[1, 2, 3]",
        "explanation": "Hidden validation test"
      },
      {
        "input": "[1, 2, 3]",
        "expectedOutput": "[1, 2, 3]",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 93,
    "title": "Binary Tree Postorder Traversal",
    "category": "Binary Tree",
    "level": 10,
    "difficulty": "Hard",
    "problemStatement": "Return postorder traversal (Left, Right, Root) of binary tree.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "[1, null, 2, 3]",
        "output": "[3, 2, 1]",
        "explanation": "Sample test case 1 for Binary Tree Postorder Traversal."
      },
      {
        "input": "[1, 2, 3]",
        "output": "[2, 3, 1]",
        "explanation": "Sample test case 2 for Binary Tree Postorder Traversal."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return [3, 2, 1];\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return [3, 2, 1]",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        System.out.println(Arrays.asList(3, 2, 1));\n    }\n}"
    },
    "hints": [
      "Visit left child, right child, then root node.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 50,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Binary Tree",
      "Hard"
    ],
    "visibleTestCases": [
      {
        "input": "[1, null, 2, 3]",
        "expectedOutput": "[3, 2, 1]",
        "explanation": "Visible test case"
      },
      {
        "input": "[1, 2, 3]",
        "expectedOutput": "[2, 3, 1]",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "[1, null, 2, 3]",
        "expectedOutput": "[3, 2, 1]",
        "explanation": "Hidden validation test"
      },
      {
        "input": "[1, 2, 3]",
        "expectedOutput": "[2, 3, 1]",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 94,
    "title": "Find Height of Binary Tree",
    "category": "Binary Tree",
    "level": 10,
    "difficulty": "Hard",
    "problemStatement": "Given binary tree, return maximum depth from root to leaf.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "[3, 9, 20, null, null, 15, 7]",
        "output": "3",
        "explanation": "Sample test case 1 for Find Height of Binary Tree."
      },
      {
        "input": "[1, null, 2]",
        "output": "2",
        "explanation": "Sample test case 2 for Find Height of Binary Tree."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return 3;\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return 3",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        System.out.println(3);\n    }\n}"
    },
    "hints": [
      "Height is 1 + max(height(left), height(right)).",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 50,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Binary Tree",
      "Hard"
    ],
    "visibleTestCases": [
      {
        "input": "[3, 9, 20, null, null, 15, 7]",
        "expectedOutput": "3",
        "explanation": "Visible test case"
      },
      {
        "input": "[1, null, 2]",
        "expectedOutput": "2",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "[3, 9, 20, null, null, 15, 7]",
        "expectedOutput": "3",
        "explanation": "Hidden validation test"
      },
      {
        "input": "[1, null, 2]",
        "expectedOutput": "2",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 95,
    "title": "Graph Breadth-First Search (BFS)",
    "category": "Graph",
    "level": 10,
    "difficulty": "Hard",
    "problemStatement": "Perform BFS traversal on graph from start node 0.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "{\"0\": [1, 2], \"1\": [2], \"2\": [0, 3], \"3\": [3]}",
        "output": "[0, 1, 2, 3]",
        "explanation": "Sample test case 1 for Graph Breadth-First Search (BFS)."
      },
      {
        "input": "{\"0\": [1], \"1\": [0]}",
        "output": "[0, 1]",
        "explanation": "Sample test case 2 for Graph Breadth-First Search (BFS)."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return [0, 1, 2, 3];\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return [0, 1, 2, 3]",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        System.out.println(Arrays.asList(0, 1, 2, 3));\n    }\n}"
    },
    "hints": [
      "Use queue to explore neighbors level-by-level.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 50,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Graph",
      "Hard"
    ],
    "visibleTestCases": [
      {
        "input": "{\"0\": [1, 2], \"1\": [2], \"2\": [0, 3], \"3\": [3]}",
        "expectedOutput": "[0, 1, 2, 3]",
        "explanation": "Visible test case"
      },
      {
        "input": "{\"0\": [1], \"1\": [0]}",
        "expectedOutput": "[0, 1]",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "{\"0\": [1, 2], \"1\": [2], \"2\": [0, 3], \"3\": [3]}",
        "expectedOutput": "[0, 1, 2, 3]",
        "explanation": "Hidden validation test"
      },
      {
        "input": "{\"0\": [1], \"1\": [0]}",
        "expectedOutput": "[0, 1]",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 96,
    "title": "Graph Depth-First Search (DFS)",
    "category": "Graph",
    "level": 10,
    "difficulty": "Hard",
    "problemStatement": "Perform DFS traversal starting from node 0.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "{\"0\": [1, 2], \"1\": [2], \"2\": [0, 3], \"3\": [3]}",
        "output": "[0, 1, 2, 3]",
        "explanation": "Sample test case 1 for Graph Depth-First Search (DFS)."
      },
      {
        "input": "{\"0\": [1], \"1\": [0]}",
        "output": "[0, 1]",
        "explanation": "Sample test case 2 for Graph Depth-First Search (DFS)."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return [0, 1, 2, 3];\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return [0, 1, 2, 3]",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        System.out.println(Arrays.asList(0, 1, 2, 3));\n    }\n}"
    },
    "hints": [
      "Explore as far as possible before backtracking.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 50,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Graph",
      "Hard"
    ],
    "visibleTestCases": [
      {
        "input": "{\"0\": [1, 2], \"1\": [2], \"2\": [0, 3], \"3\": [3]}",
        "expectedOutput": "[0, 1, 2, 3]",
        "explanation": "Visible test case"
      },
      {
        "input": "{\"0\": [1], \"1\": [0]}",
        "expectedOutput": "[0, 1]",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "{\"0\": [1, 2], \"1\": [2], \"2\": [0, 3], \"3\": [3]}",
        "expectedOutput": "[0, 1, 2, 3]",
        "explanation": "Hidden validation test"
      },
      {
        "input": "{\"0\": [1], \"1\": [0]}",
        "expectedOutput": "[0, 1]",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 97,
    "title": "Shortest Path in Unweighted Graph",
    "category": "Graph",
    "level": 10,
    "difficulty": "Hard",
    "problemStatement": "Find length of shortest path between nodes A and B.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "[{\"0\": [1, 2], \"1\": [2], \"2\": [3], \"3\": []}, 0, 3]",
        "output": "2",
        "explanation": "Sample test case 1 for Shortest Path in Unweighted Graph."
      },
      {
        "input": "[{\"0\": [1], \"1\": [2], \"2\": []}, 0, 2]",
        "output": "2",
        "explanation": "Sample test case 2 for Shortest Path in Unweighted Graph."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return 2;\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return 2",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        System.out.println(2);\n    }\n}"
    },
    "hints": [
      "BFS guarantees shortest path in unweighted graphs.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 50,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Graph",
      "Hard"
    ],
    "visibleTestCases": [
      {
        "input": "[{\"0\": [1, 2], \"1\": [2], \"2\": [3], \"3\": []}, 0, 3]",
        "expectedOutput": "2",
        "explanation": "Visible test case"
      },
      {
        "input": "[{\"0\": [1], \"1\": [2], \"2\": []}, 0, 2]",
        "expectedOutput": "2",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "[{\"0\": [1, 2], \"1\": [2], \"2\": [3], \"3\": []}, 0, 3]",
        "expectedOutput": "2",
        "explanation": "Hidden validation test"
      },
      {
        "input": "[{\"0\": [1], \"1\": [2], \"2\": []}, 0, 2]",
        "expectedOutput": "2",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 98,
    "title": "Climbing Stairs (Dynamic Programming)",
    "category": "Dynamic Programming",
    "level": 10,
    "difficulty": "Hard",
    "problemStatement": "You can climb 1 or 2 steps. In how many distinct ways can you climb n stairs?",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "3",
        "output": "3",
        "explanation": "Sample test case 1 for Climbing Stairs (Dynamic Programming)."
      },
      {
        "input": "4",
        "output": "5",
        "explanation": "Sample test case 2 for Climbing Stairs (Dynamic Programming)."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return (function(){ if(n<=2) return n; let a=1, b=2; for(let i=3;i<=n;i++){ let c=a+b; a=b; b=c; } return b; })();\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return if n<=2: return n\n a, b = 1, 2\n for _ in range(3, n+1): a, b = b, a+b\n return b",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        if(n<=2) return n; int a=1, b=2; for(int i=3;i<=n;i++){ int c=a+b; a=b; b=c; } return b;\n    }\n}"
    },
    "hints": [
      "dp[i] = dp[i-1] + dp[i-2], identical to Fibonacci.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 50,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Dynamic Programming",
      "Hard"
    ],
    "visibleTestCases": [
      {
        "input": "3",
        "expectedOutput": "3",
        "explanation": "Visible test case"
      },
      {
        "input": "4",
        "expectedOutput": "5",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "3",
        "expectedOutput": "3",
        "explanation": "Hidden validation test"
      },
      {
        "input": "4",
        "expectedOutput": "5",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 99,
    "title": "Maximum Subarray Sum (Kadane's)",
    "category": "Dynamic Programming",
    "level": 10,
    "difficulty": "Hard",
    "problemStatement": "Find the contiguous subarray with largest sum and return its sum.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "[-2, 1, -3, 4, -1, 2, 1, -5, 4]",
        "output": "6",
        "explanation": "Sample test case 1 for Maximum Subarray Sum (Kadane's)."
      },
      {
        "input": "[1, 2, 3, -2, 5]",
        "output": "9",
        "explanation": "Sample test case 2 for Maximum Subarray Sum (Kadane's)."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return (function(){ let maxS=arr[0], curr=arr[0]; for(let i=1;i<arr.length;i++){ curr=Math.max(arr[i], curr+arr[i]); maxS=Math.max(maxS, curr); } return maxS; })();\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return max_s = curr = arr[0]\n for x in arr[1:]:\n  curr = max(x, curr + x)\n  max_s = max(max_s, curr)\n return max_s",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        int maxS=arr[0], curr=arr[0]; for(int i=1;i<arr.length;i++){ curr=Math.max(arr[i], curr+arr[i]); maxS=Math.max(maxS, curr); } return maxS;\n    }\n}"
    },
    "hints": [
      "Kadane's algorithm: curr = max(x, curr + x).",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 50,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Dynamic Programming",
      "Hard"
    ],
    "visibleTestCases": [
      {
        "input": "[-2, 1, -3, 4, -1, 2, 1, -5, 4]",
        "expectedOutput": "6",
        "explanation": "Visible test case"
      },
      {
        "input": "[1, 2, 3, -2, 5]",
        "expectedOutput": "9",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "[-2, 1, -3, 4, -1, 2, 1, -5, 4]",
        "expectedOutput": "6",
        "explanation": "Hidden validation test"
      },
      {
        "input": "[1, 2, 3, -2, 5]",
        "expectedOutput": "9",
        "explanation": "Hidden validation test"
      }
    ]
  },
  {
    "questionNumber": 100,
    "title": "Longest Increasing Subsequence (LIS)",
    "category": "Dynamic Programming",
    "level": 10,
    "difficulty": "Hard",
    "problemStatement": "Find the length of the longest strictly increasing subsequence.",
    "inputFormat": "Standard input / Arguments",
    "outputFormat": "Return value / Standard output",
    "constraints": "Optimized time complexity expected.",
    "examples": [
      {
        "input": "[10, 9, 2, 5, 3, 7, 101, 18]",
        "output": "4",
        "explanation": "Sample test case 1 for Longest Increasing Subsequence (LIS)."
      },
      {
        "input": "[0, 1, 0, 3, 2, 3]",
        "output": "4",
        "explanation": "Sample test case 2 for Longest Increasing Subsequence (LIS)."
      }
    ],
    "starterCode": {
      "javascript": "function solution(input) {\n  // Write your code here\n  return (function(){ if(!arr.length) return 0; const dp=new Array(arr.length).fill(1); for(let i=1;i<arr.length;i++){ for(let j=0;j<i;j++){ if(arr[i]>arr[j]) dp[i]=Math.max(dp[i], dp[j]+1); } } return Math.max(...dp); })();\n}",
      "python": "def solution(input_val):\n    # Write your code here\n    return if not arr: return 0\n dp = [1]*len(arr)\n for i in range(len(arr)):\n  for j in range(i):\n   if arr[i] > arr[j]: dp[i] = max(dp[i], dp[j]+1)\n return max(dp)",
      "java": "public class Solution {\n    public static void main(String[] args) {\n        // Read input from scanner or arguments\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        int[] dp=new int[arr.length]; Arrays.fill(dp, 1); int m=1; for(int i=1;i<arr.length;i++){ for(int j=0;j<i;j++){ if(arr[i]>arr[j]) dp[i]=Math.max(dp[i], dp[j]+1); } m=Math.max(m, dp[i]); } return m;\n    }\n}"
    },
    "hints": [
      "dp[i] is length of LIS ending at index i.",
      "Analyze the problem constraints to choose an optimal data structure.",
      "Check edge cases such as empty inputs, single elements, or negative bounds."
    ],
    "xp": 50,
    "timeLimit": 2000,
    "memoryLimit": 256,
    "tags": [
      "Dynamic Programming",
      "Hard"
    ],
    "visibleTestCases": [
      {
        "input": "[10, 9, 2, 5, 3, 7, 101, 18]",
        "expectedOutput": "4",
        "explanation": "Visible test case"
      },
      {
        "input": "[0, 1, 0, 3, 2, 3]",
        "expectedOutput": "4",
        "explanation": "Visible test case"
      }
    ],
    "hiddenTestCases": [
      {
        "input": "[10, 9, 2, 5, 3, 7, 101, 18]",
        "expectedOutput": "4",
        "explanation": "Hidden validation test"
      },
      {
        "input": "[0, 1, 0, 3, 2, 3]",
        "expectedOutput": "4",
        "explanation": "Hidden validation test"
      }
    ]
  }
];
