/**
 * STACK QUEUE Question Bank Generator
 * Clean, verified specifications for 144 Arena Questions per domain
 */

const { CATEGORIES } = require('./constants');

function getCategory(index) {
  return CATEGORIES[index % CATEGORIES.length];
}

// 48 Easy Generic Spec Templates with Domain Context
const EASY_SPECS = [
  {
    title: 'Reverse Words in a Sentence',
    category: 'Core Technical Concepts',
    desc: 'Given a sentence containing words separated by single spaces, reverse the sequence of words while maintaining the characters within each word.',
    inputFmt: 'A string sentence.',
    outputFmt: 'The sentence with words in reversed order.',
    tests: [
      { in: 'the sky is blue', out: 'blue is sky the' },
      { in: 'hello world', out: 'world hello' },
      { in: 'code engineering mastery', out: 'mastery engineering code', isH: true },
      { in: 'standalone', out: 'standalone', isH: true }
    ],
    fn: s => s.trim().split(/\s+/).reverse().join(' ')
  },
  {
    title: 'Valid Palindrome Alphanumeric Filter',
    category: 'Logical Problem Solving',
    desc: 'Determine if a string is a palindrome, considering only alphanumeric characters and ignoring case sensitivity.',
    inputFmt: 'A string s.',
    outputFmt: '"true" if palindrome, otherwise "false".',
    tests: [
      { in: 'A man, a plan, a canal: Panama', out: 'true' },
      { in: 'race a car', out: 'false' },
      { in: 'Was it a car or a cat I saw?', out: 'true', isH: true },
      { in: 'not a palindrome', out: 'false', isH: true }
    ],
    fn: s => {
      const c = s.toLowerCase().replace(/[^a-z0-9]/g, '');
      return c === c.split('').reverse().join('') ? 'true' : 'false';
    }
  },
  {
    title: 'Second Largest Distinct Integer',
    category: 'Core Technical Concepts',
    desc: 'Given an array of integers, find the second largest distinct number. If fewer than 2 distinct integers exist, return -1.',
    inputFmt: 'Space-separated integers.',
    outputFmt: 'The second largest distinct integer or -1.',
    tests: [
      { in: '12 35 1 10 34 1', out: '34' },
      { in: '10 10 10', out: '-1' },
      { in: '5 20 12', out: '12', isH: true },
      { in: '-5 -2 -1 -10', out: '-2', isH: true }
    ],
    fn: s => {
      const nums = Array.from(new Set(s.trim().split(/\s+/).map(Number))).sort((a,b)=>b-a);
      return nums.length >= 2 ? String(nums[1]) : '-1';
    }
  },
  {
    title: 'Find Missing Number in Arithmetic Range',
    category: 'Logical Problem Solving',
    desc: 'Given an array containing n distinct numbers in the range 1 to n+1, find the single missing number from the sequence.',
    inputFmt: 'Space-separated integers representing the array.',
    outputFmt: 'The missing integer.',
    tests: [
      { in: '1 2 4 5', out: '3' },
      { in: '2 3 4', out: '1' },
      { in: '1 2 3 4 5 7', out: '6', isH: true },
      { in: '2', out: '1', isH: true }
    ],
    fn: s => {
      const arr = s.trim().split(/\s+/).map(Number);
      const n = arr.length;
      const total = ((n + 1) * (n + 2)) / 2;
      const sum = arr.reduce((a,b)=>a+b, 0);
      return String(total - sum);
    }
  },
  {
    title: 'Two Sum Target Index Pair',
    category: 'Data Structures and Algorithms',
    desc: 'Given an array of integers nums and an integer target, output the indices of the two numbers such that they add up to target. Output indices ascending separated by space.',
    inputFmt: 'Line 1: target integer. Line 2: space-separated integers.',
    outputFmt: 'Two space-separated indices.',
    tests: [
      { in: '9\n2 7 11 15', out: '0 1' },
      { in: '6\n3 2 4', out: '1 2' },
      { in: '6\n3 3', out: '0 1', isH: true },
      { in: '10\n1 5 3 7 9', out: '0 4', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n');
      const target = Number(lines[0].trim());
      const nums = lines[1].trim().split(/\s+/).map(Number);
      const map = new Map();
      for (let i = 0; i < nums.length; i++) {
        const comp = target - nums[i];
        if (map.has(comp)) return `${map.get(comp)} ${i}`;
        map.set(nums[i], i);
      }
      return '0 1';
    }
  },
  {
    title: 'FizzBuzz Classic Sequence Generator',
    category: 'Core Technical Concepts',
    desc: 'Given an integer n, return a space-separated sequence from 1 to n where multiples of 3 are "Fizz", multiples of 5 are "Buzz", and multiples of both are "FizzBuzz".',
    inputFmt: 'An integer n.',
    outputFmt: 'Space-separated sequence of tokens.',
    tests: [
      { in: '5', out: '1 2 Fizz 4 Buzz' },
      { in: '15', out: '1 2 Fizz 4 Buzz Fizz 7 8 Fizz Buzz 11 Fizz 13 14 FizzBuzz' },
      { in: '3', out: '1 2 Fizz', isH: true },
      { in: '1', out: '1', isH: true }
    ],
    fn: s => {
      const n = parseInt(s.trim());
      const res = [];
      for (let i = 1; i <= n; i++) {
        if (i % 15 === 0) res.push('FizzBuzz');
        else if (i % 3 === 0) res.push('Fizz');
        else if (i % 5 === 0) res.push('Buzz');
        else res.push(String(i));
      }
      return res.join(' ');
    }
  },
  {
    title: 'Character Frequency Alphabetical Report',
    category: 'Logical Problem Solving',
    desc: 'Count the frequency of each alphabetic character in a string and return formatted as letter:count in alphabetical order separated by comma space.',
    inputFmt: 'A single word or string.',
    outputFmt: 'Character frequencies alphabetically.',
    tests: [
      { in: 'banana', out: 'a:3, b:1, n:2' },
      { in: 'java', out: 'a:2, j:1, v:1' },
      { in: 'mississippi', out: 'i:4, m:1, p:2, s:4', isH: true },
      { in: 'queue', out: 'e:2, q:1, u:2', isH: true }
    ],
    fn: s => {
      const map = {};
      for (const ch of s.trim().toLowerCase()) {
        if (ch >= 'a' && ch <= 'z') map[ch] = (map[ch] || 0) + 1;
      }
      return Object.keys(map).sort().map(k => `${k}:${map[k]}`).join(', ');
    }
  },
  {
    title: 'Anagram Strings Equivalence Check',
    category: 'Core Technical Concepts',
    desc: 'Determine if two strings are anagrams of each other (contain the exact same letters with identical frequencies).',
    inputFmt: 'Line 1: string s1. Line 2: string s2.',
    outputFmt: '"true" if anagrams, otherwise "false".',
    tests: [
      { in: 'listen\nsilent', out: 'true' },
      { in: 'triangle\nintegral', out: 'true' },
      { in: 'apple\npale', out: 'false', isH: true },
      { in: 'rat\ncar', out: 'false', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n');
      const clean = str => str.toLowerCase().replace(/[^a-z0-9]/g, '').split('').sort().join('');
      return clean(lines[0]) === clean(lines[1]) ? 'true' : 'false';
    }
  },
  {
    title: 'Sum of Even Digits in Integer',
    category: 'Logical Problem Solving',
    desc: 'Given a non-negative integer, calculate the sum of all its even digits.',
    inputFmt: 'A single integer.',
    outputFmt: 'The sum of all even digits.',
    tests: [
      { in: '123456', out: '12' },
      { in: '3579', out: '0' },
      { in: '2468', out: '20', isH: true },
      { in: '802', out: '10', isH: true }
    ],
    fn: s => {
      const sum = s.trim().replace(/[^0-9]/g, '').split('')
        .map(Number).filter(d => d % 2 === 0)
        .reduce((a,b)=>a+b, 0);
      return String(sum);
    }
  },
  {
    title: 'Remove Duplicate Characters Preserving Order',
    category: 'Core Technical Concepts',
    desc: 'Remove duplicate characters from a string, keeping only the first occurrence of each character in its original order.',
    inputFmt: 'A single string.',
    outputFmt: 'The string with duplicates removed.',
    tests: [
      { in: 'programming', out: 'progamin' },
      { in: 'abracadabra', out: 'abrcd' },
      { in: 'hello world', out: 'helo wrd', isH: true },
      { in: 'aaaaa', out: 'a', isH: true }
    ],
    fn: s => {
      const seen = new Set();
      let res = '';
      for (const ch of s.trim()) {
        if (!seen.has(ch)) { seen.add(ch); res += ch; }
      }
      return res;
    }
  },
  {
    title: 'Leap Year and Century Boundary Validator',
    category: 'Real-world Coding Problems',
    desc: 'Determine whether a given year is a leap year according to the Gregorian calendar rules.',
    inputFmt: 'An integer year.',
    outputFmt: '"true" if leap year, otherwise "false".',
    tests: [
      { in: '2024', out: 'true' },
      { in: '1900', out: 'false' },
      { in: '2000', out: 'true', isH: true },
      { in: '2023', out: 'false', isH: true }
    ],
    fn: s => {
      const y = parseInt(s.trim());
      const isLeap = (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0);
      return isLeap ? 'true' : 'false';
    }
  },
  {
    title: 'Prime Number Primality Tester',
    category: 'Logical Problem Solving',
    desc: 'Determine if a given positive integer n is a prime number.',
    inputFmt: 'An integer n.',
    outputFmt: '"true" if prime, otherwise "false".',
    tests: [
      { in: '29', out: 'true' },
      { in: '1', out: 'false' },
      { in: '4', out: 'false', isH: true },
      { in: '97', out: 'true', isH: true }
    ],
    fn: s => {
      const n = parseInt(s.trim());
      if (n <= 1) return 'false';
      if (n <= 3) return 'true';
      if (n % 2 === 0 || n % 3 === 0) return 'false';
      for (let i = 5; i * i <= n; i += 6) {
        if (n % i === 0 || n % (i + 2) === 0) return 'false';
      }
      return 'true';
    }
  },
  {
    title: 'Celsius to Fahrenheit Temperature Converter',
    category: 'Real-world Coding Problems',
    desc: 'Convert a temperature in Celsius to Fahrenheit rounded to 2 decimal places.',
    inputFmt: 'A numeric Celsius value.',
    outputFmt: 'The Fahrenheit value formatted to 2 decimals.',
    tests: [
      { in: '0', out: '32.00' },
      { in: '100', out: '212.00' },
      { in: '-40', out: '-40.00', isH: true },
      { in: '37', out: '98.60', isH: true }
    ],
    fn: s => {
      const c = parseFloat(s.trim());
      const f = (c * 9/5) + 32;
      return f.toFixed(2);
    }
  },
  {
    title: 'Armstrong Number (Narcissistic) Checker',
    category: 'Logical Problem Solving',
    desc: 'Determine if an n-digit integer is an Armstrong number (sum of its digits each raised to power n equals the number itself).',
    inputFmt: 'A single positive integer.',
    outputFmt: '"true" if Armstrong number, otherwise "false".',
    tests: [
      { in: '153', out: 'true' },
      { in: '123', out: 'false' },
      { in: '9474', out: 'true', isH: true },
      { in: '370', out: 'true', isH: true }
    ],
    fn: s => {
      const str = s.trim();
      const n = str.length;
      const sum = str.split('').reduce((acc, d) => acc + Math.pow(Number(d), n), 0);
      return String(sum) === str ? 'true' : 'false';
    }
  },
  {
    title: 'String Compression via Run-Length Encoding',
    category: 'Core Technical Concepts',
    desc: 'Compress a string of lowercase letters using run-length encoding (e.g. "aabcccccaaa" becomes "a2b1c5a3"). If compressed string is not shorter than original, return original.',
    inputFmt: 'A string s.',
    outputFmt: 'The compressed string or original.',
    tests: [
      { in: 'aabcccccaaa', out: 'a2b1c5a3' },
      { in: 'abcd', out: 'abcd' },
      { in: 'wwwwaaadexxxxxx', out: 'w4a3d1e1x6', isH: true },
      { in: 'a', out: 'a', isH: true }
    ],
    fn: s => {
      const str = s.trim();
      let comp = '';
      let count = 1;
      for (let i = 0; i < str.length; i++) {
        if (str[i] === str[i+1]) { count++; }
        else { comp += str[i] + count; count = 1; }
      }
      return comp.length < str.length ? comp : str;
    }
  },
  {
    title: 'Find Peak Element in Array Sequence',
    category: 'Data Structures and Algorithms',
    desc: 'An element is a peak if it is strictly greater than its neighbors. Find the 0-based index of any peak element in the array.',
    inputFmt: 'Space-separated integers.',
    outputFmt: 'Index of a peak element.',
    tests: [
      { in: '1 2 3 1', out: '2' },
      { in: '1 2 1 3 5 6 4', out: '1' },
      { in: '1', out: '0', isH: true },
      { in: '1 2', out: '1', isH: true }
    ],
    fn: s => {
      const a = s.trim().split(/\s+/).map(Number);
      for (let i = 0; i < a.length; i++) {
        const left = i > 0 ? a[i - 1] : -Infinity;
        const right = i < a.length - 1 ? a[i + 1] : -Infinity;
        if (a[i] > left && a[i] > right) return String(i);
      }
      return '0';
    }
  },
  {
    title: 'Merge Two Sorted Integer Arrays',
    category: 'Data Structures and Algorithms',
    desc: 'Given two sorted integer arrays, merge them into a single sorted array separated by space.',
    inputFmt: 'Line 1: space-separated integers. Line 2: space-separated integers.',
    outputFmt: 'Space-separated merged sorted integers.',
    tests: [
      { in: '1 3 5\n2 4 6', out: '1 2 3 4 5 6' },
      { in: '10 20\n5 15 25', out: '5 10 15 20 25' },
      { in: '1\n2', out: '1 2', isH: true },
      { in: '3 7 9\n1 2', out: '1 2 3 7 9', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n');
      const a = lines[0].trim().split(/\s+/).map(Number);
      const b = lines[1].trim().split(/\s+/).map(Number);
      return [...a, ...b].sort((x,y)=>x-y).join(' ');
    }
  },
  {
    title: 'First Non-Repeating Character in Stream',
    category: 'Core Technical Concepts',
    desc: 'Find the first non-repeating character in a string and return its character. If none exists, return "-1".',
    inputFmt: 'A string s.',
    outputFmt: 'The first unique character or "-1".',
    tests: [
      { in: 'leetcode', out: 'l' },
      { in: 'loveleetcode', out: 'v' },
      { in: 'aabb', out: '-1', isH: true },
      { in: 'swiss', out: 'w', isH: true }
    ],
    fn: s => {
      const str = s.trim();
      const counts = {};
      for (const ch of str) counts[ch] = (counts[ch] || 0) + 1;
      for (const ch of str) {
        if (counts[ch] === 1) return ch;
      }
      return '-1';
    }
  },
  {
    title: 'Binary String to Decimal Number Converter',
    category: 'Core Technical Concepts',
    desc: 'Convert a given binary string representation to its base-10 decimal integer value.',
    inputFmt: 'A binary string consisting of 0s and 1s.',
    outputFmt: 'The decimal integer value.',
    tests: [
      { in: '1010', out: '10' },
      { in: '11111111', out: '255' },
      { in: '0', out: '0', isH: true },
      { in: '100000', out: '32', isH: true }
    ],
    fn: s => String(parseInt(s.trim(), 2))
  },
  {
    title: 'Check If Array Is Monotonic',
    category: 'Data Structures and Algorithms',
    desc: 'An array is monotonic if it is either entirely non-increasing or entirely non-decreasing. Return "true" or "false".',
    inputFmt: 'Space-separated integers.',
    outputFmt: '"true" if monotonic, otherwise "false".',
    tests: [
      { in: '1 2 2 3', out: 'true' },
      { in: '6 5 4 4', out: 'true' },
      { in: '1 3 2', out: 'false', isH: true },
      { in: '1 1 1', out: 'true', isH: true }
    ],
    fn: s => {
      const a = s.trim().split(/\s+/).map(Number);
      let inc = true, dec = true;
      for (let i = 1; i < a.length; i++) {
        if (a[i] > a[i - 1]) dec = false;
        if (a[i] < a[i - 1]) inc = false;
      }
      return (inc || dec) ? 'true' : 'false';
    }
  },
  {
    title: 'Move All Zeros to End of Array',
    category: 'Data Structures and Algorithms',
    desc: 'Given an array of integers, move all 0s to the end while maintaining the relative order of the non-zero elements.',
    inputFmt: 'Space-separated integers.',
    outputFmt: 'Space-separated integers with zeros shifted.',
    tests: [
      { in: '0 1 0 3 12', out: '1 3 12 0 0' },
      { in: '0', out: '0' },
      { in: '1 2 3', out: '1 2 3', isH: true },
      { in: '4 0 5 0 0 6', out: '4 5 6 0 0 0', isH: true }
    ],
    fn: s => {
      const a = s.trim().split(/\s+/).map(Number);
      const nonZeros = a.filter(x => x !== 0);
      const zeros = a.filter(x => x === 0);
      return [...nonZeros, ...zeros].join(' ');
    }
  },
  {
    title: 'Valid Email Domain Name Extractor',
    category: 'Real-world Coding Problems',
    desc: 'Extract and return the domain name (everything after the "@") from a valid email address in lowercase.',
    inputFmt: 'An email string.',
    outputFmt: 'The extracted domain name.',
    tests: [
      { in: 'user@example.com', out: 'example.com' },
      { in: 'Admin.Tech@StackQueue.org', out: 'stackqueue.org' },
      { in: 'student@domain.edu.in', out: 'domain.edu.in', isH: true },
      { in: 'test@sub.domain.co', out: 'sub.domain.co', isH: true }
    ],
    fn: s => {
      const parts = s.trim().split('@');
      return parts.length > 1 ? parts[1].toLowerCase() : '';
    }
  },
  {
    title: 'Matrix Diagonal Sum Calculator',
    category: 'Data Structures and Algorithms',
    desc: 'Given an N x N square matrix, return the sum of the primary diagonal and secondary diagonal elements, counting the center element only once if N is odd.',
    inputFmt: 'Line 1: N. Following N lines: space-separated integers.',
    outputFmt: 'The diagonal sum.',
    tests: [
      { in: '3\n1 2 3\n4 5 6\n7 8 9', out: '25' },
      { in: '2\n1 1\n1 1', out: '4' },
      { in: '1\n5', out: '5', isH: true },
      { in: '3\n1 1 1\n1 1 1\n1 1 1', out: '5', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n');
      const n = Number(lines[0].trim());
      const mat = lines.slice(1).map(l => l.trim().split(/\s+/).map(Number));
      let sum = 0;
      for (let i = 0; i < n; i++) {
        sum += mat[i][i];
        if (i !== n - 1 - i) sum += mat[i][n - 1 - i];
      }
      return String(sum);
    }
  },
  {
    title: 'Capitalize First Letter of Each Word',
    category: 'Core Technical Concepts',
    desc: 'Given a sentence, convert the first letter of each word to uppercase and the rest of each word to lowercase.',
    inputFmt: 'A string sentence.',
    outputFmt: 'Title-cased sentence.',
    tests: [
      { in: 'hello world from stack queue', out: 'Hello World From Stack Queue' },
      { in: 'JAVA programming LANGUAGE', out: 'Java Programming Language' },
      { in: 'single', out: 'Single', isH: true },
      { in: 'the quick brown fox', out: 'The Quick Brown Fox', isH: true }
    ],
    fn: s => {
      return s.trim().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }
  },
  {
    title: 'Find Array Majority Element (Boyer-Moore)',
    category: 'Data Structures and Algorithms',
    desc: 'Find the majority element in an array (an element that appears more than n / 2 times).',
    inputFmt: 'Space-separated integers.',
    outputFmt: 'The majority element integer.',
    tests: [
      { in: '3 2 3', out: '3' },
      { in: '2 2 1 1 1 2 2', out: '2' },
      { in: '1', out: '1', isH: true },
      { in: '6 5 5', out: '5', isH: true }
    ],
    fn: s => {
      const a = s.trim().split(/\s+/).map(Number);
      let cand = a[0], count = 0;
      for (const x of a) {
        if (count === 0) cand = x;
        count += (x === cand) ? 1 : -1;
      }
      return String(cand);
    }
  },
  {
    title: 'Count Set Bits (Hamming Weight)',
    category: 'Performance and Optimization',
    desc: 'Calculate the number of 1 bits (Hamming weight) in the binary representation of a positive integer.',
    inputFmt: 'A positive integer.',
    outputFmt: 'Count of set bits.',
    tests: [
      { in: '11', out: '3' },
      { in: '128', out: '1' },
      { in: '2147483645', out: '30', isH: true },
      { in: '7', out: '3', isH: true }
    ],
    fn: s => {
      let n = parseInt(s.trim());
      let count = 0;
      while (n > 0) { count += (n & 1); n = Math.floor(n / 2); }
      return String(count);
    }
  },
  {
    title: 'Single Number Among Pairs (XOR Trick)',
    category: 'Performance and Optimization',
    desc: 'Given a non-empty array of integers where every element appears twice except for one, find that single element in O(N) time and O(1) space.',
    inputFmt: 'Space-separated integers.',
    outputFmt: 'The non-paired integer.',
    tests: [
      { in: '2 2 1', out: '1' },
      { in: '4 1 2 1 2', out: '4' },
      { in: '1', out: '1', isH: true },
      { in: '7 3 5 3 7', out: '5', isH: true }
    ],
    fn: s => {
      const a = s.trim().split(/\s+/).map(Number);
      return String(a.reduce((acc, x) => acc ^ x, 0));
    }
  },
  {
    title: 'Check Valid Perfect Square Without Built-In Sqrt',
    category: 'Logical Problem Solving',
    desc: 'Given a positive integer num, return "true" if num is a perfect square, else "false". Do not use built-in square root functions.',
    inputFmt: 'A positive integer.',
    outputFmt: '"true" or "false".',
    tests: [
      { in: '16', out: 'true' },
      { in: '14', out: 'false' },
      { in: '1', out: 'true', isH: true },
      { in: '1000000', out: 'true', isH: true }
    ],
    fn: s => {
      const num = parseInt(s.trim());
      if (num < 1) return 'false';
      let l = 1, r = num;
      while (l <= r) {
        let mid = Math.floor((l + r) / 2);
        let sq = mid * mid;
        if (sq === num) return 'true';
        if (sq < num) l = mid + 1; else r = mid - 1;
      }
      return 'false';
    }
  },
  {
    title: 'Reverse Digits of a 32-bit Integer',
    category: 'Logical Problem Solving',
    desc: 'Given a signed 32-bit integer x, return x with its digits reversed. Preserve sign; if reversed overflows 32-bit range, return 0.',
    inputFmt: 'A signed integer.',
    outputFmt: 'Reversed integer.',
    tests: [
      { in: '123', out: '321' },
      { in: '-123', out: '-321' },
      { in: '120', out: '21', isH: true },
      { in: '0', out: '0', isH: true }
    ],
    fn: s => {
      const n = parseInt(s.trim());
      const sign = n < 0 ? -1 : 1;
      const rev = parseInt(Math.abs(n).toString().split('').reverse().join('')) * sign;
      if (rev > 2147483647 || rev < -2147483648) return '0';
      return String(rev);
    }
  },
  {
    title: 'Check If String Is Rotation of Another',
    category: 'Core Technical Concepts',
    desc: 'Given two strings s and goal, return "true" if and only if s can become goal after some number of shifts.',
    inputFmt: 'Line 1: string s. Line 2: string goal.',
    outputFmt: '"true" if rotation, otherwise "false".',
    tests: [
      { in: 'abcde\ncdeab', out: 'true' },
      { in: 'abcde\nabced', out: 'false' },
      { in: 'aa\na', out: 'false', isH: true },
      { in: 'waterbottle\nerbottlewat', out: 'true', isH: true }
    ],
    fn: s => {
      const [s1, s2] = s.trim().split('\n').map(x => x.trim());
      if (s1.length !== s2.length) return 'false';
      return (s1 + s1).includes(s2) ? 'true' : 'false';
    }
  },
  {
    title: 'Power of Two Bitwise Validator',
    category: 'Performance and Optimization',
    desc: 'Given an integer n, return "true" if it is a power of two, otherwise "false".',
    inputFmt: 'An integer n.',
    outputFmt: '"true" or "false".',
    tests: [
      { in: '1', out: 'true' },
      { in: '16', out: 'true' },
      { in: '3', out: 'false', isH: true },
      { in: '1024', out: 'true', isH: true }
    ],
    fn: s => {
      const n = parseInt(s.trim());
      return (n > 0 && (n & (n - 1)) === 0) ? 'true' : 'false';
    }
  },
  {
    title: 'Max Consecutive Ones in Binary Array',
    category: 'Data Structures and Algorithms',
    desc: 'Given a binary array nums, return the maximum number of consecutive 1s in the array.',
    inputFmt: 'Space-separated 0s and 1s.',
    outputFmt: 'The maximum consecutive count.',
    tests: [
      { in: '1 1 0 1 1 1', out: '3' },
      { in: '1 0 1 1 0 1', out: '2' },
      { in: '0 0 0', out: '0', isH: true },
      { in: '1 1 1 1', out: '4', isH: true }
    ],
    fn: s => {
      const a = s.trim().split(/\s+/).map(Number);
      let maxC = 0, cur = 0;
      for (const x of a) {
        if (x === 1) { cur++; maxC = Math.max(maxC, cur); }
        else cur = 0;
      }
      return String(maxC);
    }
  },
  {
    title: 'Longest Common Prefix in String Array',
    category: 'Core Technical Concepts',
    desc: 'Find the longest common prefix string amongst an array of strings. If there is no common prefix, return "".',
    inputFmt: 'Space-separated words.',
    outputFmt: 'The longest common prefix.',
    tests: [
      { in: 'flower flow flight', out: 'fl' },
      { in: 'dog racecar car', out: '' },
      { in: 'interspecies interstellar interstate', out: 'inters', isH: true },
      { in: 'throne throne', out: 'throne', isH: true }
    ],
    fn: s => {
      const strs = s.trim().split(/\s+/);
      if (!strs.length) return '';
      let prefix = strs[0];
      for (let i = 1; i < strs.length; i++) {
        while (strs[i].indexOf(prefix) !== 0) {
          prefix = prefix.substring(0, prefix.length - 1);
          if (!prefix) return '';
        }
      }
      return prefix;
    }
  },
  {
    title: 'Compound Interest Calculation Engine',
    category: 'Real-world Coding Problems',
    desc: 'Calculate the total compounded amount given principal P, annual rate R (%), and time T (years), compounded annually: A = P * (1 + R/100)^T rounded to 2 decimals.',
    inputFmt: 'Three space-separated numbers: P R T.',
    outputFmt: 'The compounded total amount.',
    tests: [
      { in: '1000 5 2', out: '1102.50' },
      { in: '5000 10 3', out: '6655.00' },
      { in: '100 0 5', out: '100.00', isH: true },
      { in: '1200 4.5 1', out: '1254.00', isH: true }
    ],
    fn: s => {
      const [p, r, t] = s.trim().split(/\s+/).map(Number);
      const a = p * Math.pow(1 + r / 100, t);
      return a.toFixed(2);
    }
  },
  {
    title: 'Valid Parentheses Bracket Matcher',
    category: 'Data Structures and Algorithms',
    desc: 'Given a string containing just the characters "(", ")", "{", "}", "[" and "]", determine if the input string is valid.',
    inputFmt: 'A string of brackets.',
    outputFmt: '"true" if valid, otherwise "false".',
    tests: [
      { in: '()[]{}', out: 'true' },
      { in: '(]', out: 'false' },
      { in: '([)]', out: 'false', isH: true },
      { in: '{[]}', out: 'true', isH: true }
    ],
    fn: s => {
      const str = s.trim();
      const stack = [];
      const map = { ')': '(', '}': '{', ']': '[' };
      for (const ch of str) {
        if (ch === '(' || ch === '{' || ch === '[') stack.push(ch);
        else if (map[ch]) {
          if (stack.pop() !== map[ch]) return 'false';
        }
      }
      return stack.length === 0 ? 'true' : 'false';
    }
  },
  {
    title: 'Check Symmetric Square Matrix',
    category: 'Core Technical Concepts',
    desc: 'Determine if an N x N matrix is symmetric across its main diagonal (matrix[i][j] == matrix[j][i]).',
    inputFmt: 'Line 1: N. Following N lines: space-separated integers.',
    outputFmt: '"true" if symmetric, otherwise "false".',
    tests: [
      { in: '3\n1 2 3\n2 4 5\n3 5 6', out: 'true' },
      { in: '3\n1 2 3\n4 5 6\n7 8 9', out: 'false' },
      { in: '2\n1 0\n0 1', out: 'true', isH: true },
      { in: '1\n9', out: 'true', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n');
      const n = Number(lines[0].trim());
      const m = lines.slice(1).map(l => l.trim().split(/\s+/).map(Number));
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          if (m[i][j] !== m[j][i]) return 'false';
        }
      }
      return 'true';
    }
  },
  {
    title: 'Remove Element In-Place From Array',
    category: 'Data Structures and Algorithms',
    desc: 'Given an array nums and a value val, remove all instances of that value and return the remaining elements separated by space.',
    inputFmt: 'Line 1: val to remove. Line 2: space-separated array integers.',
    outputFmt: 'Space-separated remaining integers.',
    tests: [
      { in: '3\n3 2 2 3', out: '2 2' },
      { in: '2\n0 1 2 2 3 0 4 2', out: '0 1 3 0 4' },
      { in: '1\n1 1 1', out: '', isH: true },
      { in: '5\n1 2 3 4', out: '1 2 3 4', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n');
      const val = Number(lines[0].trim());
      const nums = lines[1].trim().split(/\s+/).map(Number);
      return nums.filter(x => x !== val).join(' ');
    }
  },
  {
    title: 'Count Vowels and Consonants in Text',
    category: 'Core Technical Concepts',
    desc: 'Count total vowels and consonants in a string (ignoring whitespace and punctuation). Output formatted as "Vowels: X, Consonants: Y".',
    inputFmt: 'A string.',
    outputFmt: '"Vowels: X, Consonants: Y"',
    tests: [
      { in: 'Hello World', out: 'Vowels: 3, Consonants: 7' },
      { in: 'AEIOU', out: 'Vowels: 5, Consonants: 0' },
      { in: 'rhythm', out: 'Vowels: 0, Consonants: 6', isH: true },
      { in: 'Stack Queue 2026', out: 'Vowels: 5, Consonants: 5', isH: true }
    ],
    fn: s => {
      const vowels = new Set(['a','e','i','o','u']);
      let v = 0, c = 0;
      for (const ch of s.trim().toLowerCase()) {
        if (ch >= 'a' && ch <= 'z') {
          if (vowels.has(ch)) v++; else c++;
        }
      }
      return `Vowels: ${v}, Consonants: ${c}`;
    }
  },
  {
    title: 'Sum of Multiples of 3 or 5 Below N',
    category: 'Logical Problem Solving',
    desc: 'Find the sum of all multiples of 3 or 5 strictly below the integer N.',
    inputFmt: 'An integer N.',
    outputFmt: 'The sum of multiples.',
    tests: [
      { in: '10', out: '23' },
      { in: '20', out: '78' },
      { in: '5', out: '3', isH: true },
      { in: '1', out: '0', isH: true }
    ],
    fn: s => {
      const n = parseInt(s.trim());
      let sum = 0;
      for (let i = 1; i < n; i++) {
        if (i % 3 === 0 || i % 5 === 0) sum += i;
      }
      return String(sum);
    }
  },
  {
    title: 'Greatest Common Divisor (Euclidean GCD)',
    category: 'Logical Problem Solving',
    desc: 'Calculate the greatest common divisor of two integers a and b using the Euclidean algorithm.',
    inputFmt: 'Two space-separated integers a and b.',
    outputFmt: 'The GCD integer.',
    tests: [
      { in: '48 18', out: '6' },
      { in: '101 10', out: '1' },
      { in: '54 24', out: '6', isH: true },
      { in: '100 25', out: '25', isH: true }
    ],
    fn: s => {
      let [a, b] = s.trim().split(/\s+/).map(Number);
      while (b !== 0) {
        let t = b;
        b = a % b;
        a = t;
      }
      return String(a);
    }
  },
  {
    title: 'Format Currency with Commas (Indian Numbering)',
    category: 'Real-world Coding Problems',
    desc: 'Format a positive integer into the Indian currency comma pattern (e.g. 100000 becomes "1,00,000").',
    inputFmt: 'A positive integer string.',
    outputFmt: 'Formatted number with commas.',
    tests: [
      { in: '100000', out: '1,00,000' },
      { in: '12345678', out: '1,23,45,678' },
      { in: '500', out: '500', isH: true },
      { in: '1000', out: '1,000', isH: true }
    ],
    fn: s => {
      let str = s.trim();
      if (str.length <= 3) return str;
      let last3 = str.substring(str.length - 3);
      let rest = str.substring(0, str.length - 3);
      rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
      return rest + ',' + last3;
    }
  },
  {
    title: 'Interleave Characters of Two Strings',
    category: 'Core Technical Concepts',
    desc: 'Interleave characters of string a and string b in alternating order. If one string is longer, append remaining characters to end.',
    inputFmt: 'Line 1: string a. Line 2: string b.',
    outputFmt: 'Interleaved string result.',
    tests: [
      { in: 'abc\npqr', out: 'apbqcr' },
      { in: 'ab\n12345', out: 'a1b2345' },
      { in: 'stack\nqueue', out: 'sqtaueckue', isH: true },
      { in: 'x\ny', out: 'xy', isH: true }
    ],
    fn: s => {
      const [a, b] = s.trim().split('\n').map(x => x.trim());
      let res = '';
      const maxL = Math.max(a.length, b.length);
      for (let i = 0; i < maxL; i++) {
        if (i < a.length) res += a[i];
        if (i < b.length) res += b[i];
      }
      return res;
    }
  },
  {
    title: 'Balanced Number (Equal Sum of Halves)',
    category: 'Logical Problem Solving',
    desc: 'An even-length integer string is balanced if sum of digits in the first half equals the sum of digits in second half. Return "true" or "false".',
    inputFmt: 'An even-length integer string.',
    outputFmt: '"true" if balanced, otherwise "false".',
    tests: [
      { in: '123321', out: 'true' },
      { in: '123456', out: 'false' },
      { in: '99', out: 'true', isH: true },
      { in: '4509', out: 'true', isH: true }
    ],
    fn: s => {
      const str = s.trim();
      const half = str.length / 2;
      const s1 = str.slice(0, half).split('').reduce((a,b)=>a+Number(b), 0);
      const s2 = str.slice(half).split('').reduce((a,b)=>a+Number(b), 0);
      return s1 === s2 ? 'true' : 'false';
    }
  },
  {
    title: 'Find Intersection of Two Integer Arrays',
    category: 'Data Structures and Algorithms',
    desc: 'Given two arrays, return an array of their intersection with unique elements sorted ascending.',
    inputFmt: 'Line 1: space-separated integers. Line 2: space-separated integers.',
    outputFmt: 'Space-separated unique intersection elements.',
    tests: [
      { in: '1 2 2 1\n2 2', out: '2' },
      { in: '4 9 5\n9 4 9 8 4', out: '4 9' },
      { in: '1 2 3\n4 5 6', out: '', isH: true },
      { in: '7 8 9\n9 7', out: '7 9', isH: true }
    ],
    fn: s => {
      const [l1, l2] = s.trim().split('\n');
      const set1 = new Set(l1.trim().split(/\s+/).map(Number));
      const set2 = new Set(l2.trim().split(/\s+/).map(Number));
      const inter = Array.from(set1).filter(x => set2.has(x)).sort((a,b)=>a-b);
      return inter.join(' ');
    }
  },
  {
    title: 'Harshad / Niven Number Validator',
    category: 'Logical Problem Solving',
    desc: 'A Harshad number is an integer divisible by the sum of its digits. Return "true" or "false".',
    inputFmt: 'A positive integer.',
    outputFmt: '"true" or "false".',
    tests: [
      { in: '18', out: 'true' },
      { in: '19', out: 'false' },
      { in: '21', out: 'true', isH: true },
      { in: '100', out: 'true', isH: true }
    ],
    fn: s => {
      const n = parseInt(s.trim());
      const sum = s.trim().split('').reduce((a,b)=>a+Number(b), 0);
      return (n % sum === 0) ? 'true' : 'false';
    }
  },
  {
    title: 'Cyclically Rotate Array by One Position',
    category: 'Data Structures and Algorithms',
    desc: 'Rotate an array to the right by one position (last element shifts to the first position).',
    inputFmt: 'Space-separated integers.',
    outputFmt: 'Rotated space-separated integers.',
    tests: [
      { in: '1 2 3 4 5', out: '5 1 2 3 4' },
      { in: '9 8 7', out: '7 9 8' },
      { in: '1', out: '1', isH: true },
      { in: '10 20', out: '20 10', isH: true }
    ],
    fn: s => {
      const a = s.trim().split(/\s+/).map(Number);
      if (a.length <= 1) return a.join(' ');
      const last = a.pop();
      a.unshift(last);
      return a.join(' ');
    }
  },
  {
    title: 'Integer to Binary String Representation',
    category: 'Core Technical Concepts',
    desc: 'Convert a non-negative base-10 decimal integer into its binary string representation without leading zeros.',
    inputFmt: 'A single non-negative integer.',
    outputFmt: 'Binary representation string.',
    tests: [
      { in: '10', out: '1010' },
      { in: '255', out: '11111111' },
      { in: '0', out: '0', isH: true },
      { in: '1', out: '1', isH: true }
    ],
    fn: s => Number(s.trim()).toString(2)
  },
  {
    title: 'Integer Square Root Truncated',
    category: 'Debugging and Error Identification',
    desc: 'Given a non-negative integer x, compute and return the square root of x rounded down to the nearest integer.',
    inputFmt: 'An integer x.',
    outputFmt: 'Truncated square root value.',
    tests: [
      { in: '4', out: '2' },
      { in: '8', out: '2' },
      { in: '0', out: '0', isH: true },
      { in: '25', out: '5', isH: true }
    ],
    fn: s => String(Math.floor(Math.sqrt(Number(s.trim()))))
  }
];

module.exports = {
  EASY_SPECS,
  getCategory
};
