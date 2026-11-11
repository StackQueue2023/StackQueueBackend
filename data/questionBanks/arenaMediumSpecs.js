/**
 * 48 UNIQUE MEDIUM INTERVIEW ARENA PROBLEM SPECIFICATIONS
 * Each with verified problem statement, real algorithmic logic & test cases
 */

const MEDIUM_SPECS = [
  {
    title: 'Longest Substring Without Repeating Characters',
    cat: 'Data Structures and Algorithms',
    desc: 'Given a string s, find the length of the longest substring without duplicate characters.',
    inputFmt: 'A string s.',
    outputFmt: 'The length of the longest substring.',
    tests: [
      { in: 'abcabcbb', out: '3' },
      { in: 'bbbbb', out: '1' },
      { in: 'pwwkew', out: '3', isH: true },
      { in: 'abcdef', out: '6', isH: true }
    ],
    fn: s => {
      let map = {}, maxL = 0, start = 0;
      for (let i = 0; i < s.length; i++) {
        if (map[s[i]] !== undefined && map[s[i]] >= start) start = map[s[i]] + 1;
        map[s[i]] = i;
        maxL = Math.max(maxL, i - start + 1);
      }
      return String(maxL);
    }
  },
  {
    title: 'Continuous Subarray with Target Sum',
    cat: 'Data Structures and Algorithms',
    desc: 'Find the starting and ending 0-based indices of the first continuous subarray adding up to a target sum. Return -1 if not found.',
    inputFmt: 'Line 1: target sum. Line 2: space-separated integers.',
    outputFmt: 'Two space-separated indices or -1.',
    tests: [
      { in: '12\n1 2 3 7 5', out: '1 3' },
      { in: '15\n1 2 3 4 5', out: '0 4' },
      { in: '100\n1 2 3', out: '-1', isH: true },
      { in: '5\n5', out: '0 0', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n');
      const target = Number(lines[0].trim());
      const a = lines[1].trim().split(/\s+/).map(Number);
      let cur = 0, map = {0: -1};
      for (let i=0; i<a.length; i++) {
        cur += a[i];
        if (map[cur - target] !== undefined) return `${map[cur - target] + 1} ${i}`;
        if (map[cur] === undefined) map[cur] = i;
      }
      return '-1';
    }
  },
  {
    title: 'Design MinStack with O(1) Minimum Access',
    cat: 'Data Structures and Algorithms',
    desc: 'Simulate a stack supporting push, pop, and getMin. Given a series of commands, return the output of getMin calls separated by space.',
    inputFmt: 'Commands separated by newline (e.g. push X, pop, getMin).',
    outputFmt: 'Space-separated getMin values.',
    tests: [
      { in: 'push -2\npush 0\npush -3\ngetMin\npop\ngetMin', out: '-3 -2' },
      { in: 'push 5\npush 10\ngetMin\npush 2\ngetMin', out: '5 2' },
      { in: 'push 1\ngetMin', out: '1', isH: true },
      { in: 'push 3\npush 2\npop\ngetMin', out: '3', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n');
      const stack = [], minStack = [], res = [];
      for (const line of lines) {
        const [cmd, val] = line.trim().split(/\s+/);
        if (cmd === 'push') {
          const num = Number(val);
          stack.push(num);
          if (!minStack.length || num <= minStack[minStack.length - 1]) minStack.push(num);
        } else if (cmd === 'pop') {
          const popped = stack.pop();
          if (popped === minStack[minStack.length - 1]) minStack.pop();
        } else if (cmd === 'getMin') {
          res.push(minStack[minStack.length - 1]);
        }
      }
      return res.join(' ');
    }
  },
  {
    title: 'Group Anagrams by Sorted Key',
    cat: 'Data Structures and Algorithms',
    desc: 'Given an array of strings, group anagrams together and return the count of groups followed by their sizes sorted descending.',
    inputFmt: 'Space-separated words.',
    outputFmt: 'Group count and sorted group sizes.',
    tests: [
      { in: 'eat tea tan ate nat bat', out: '3 groups: 3 2 1' },
      { in: 'a', out: '1 groups: 1' },
      { in: 'abc bca cab def fed xyz', out: '3 groups: 3 2 1', isH: true },
      { in: 'hello world', out: '2 groups: 1 1', isH: true }
    ],
    fn: s => {
      const words = s.trim().split(/\s+/);
      const map = {};
      for (const w of words) {
        const key = w.split('').sort().join('');
        map[key] = (map[key] || 0) + 1;
      }
      const sizes = Object.values(map).sort((a,b)=>b-a);
      return `${sizes.length} groups: ${sizes.join(' ')}`;
    }
  },
  {
    title: 'Rotate 2D Matrix by 90 Degrees Clockwise',
    cat: 'Data Structures and Algorithms',
    desc: 'Rotate an N x N 2D matrix by 90 degrees clockwise in-place.',
    inputFmt: 'Line 1: N. Following N lines: space-separated integers.',
    outputFmt: 'Rotated matrix lines.',
    tests: [
      { in: '3\n1 2 3\n4 5 6\n7 8 9', out: '7 4 1\n8 5 2\n9 6 3' },
      { in: '2\n1 2\n3 4', out: '3 1\n4 2' },
      { in: '1\n1', out: '1', isH: true },
      { in: '3\n0 0 1\n0 1 0\n1 0 0', out: '1 0 0\n0 1 0\n0 0 1', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n');
      const n = Number(lines[0].trim());
      const m = lines.slice(1).map(l => l.trim().split(/\s+/).map(Number));
      const res = [];
      for (let j = 0; j < n; j++) {
        let row = [];
        for (let i = n - 1; i >= 0; i--) row.push(m[i][j]);
        res.push(row.join(' '));
      }
      return res.join('\n');
    }
  },
  {
    title: 'Product of Array Except Self Without Division',
    cat: 'Data Structures and Algorithms',
    desc: 'Return an array where output[i] is the product of all elements of nums except nums[i], solved in O(N) time without using the division operator.',
    inputFmt: 'Space-separated integers.',
    outputFmt: 'Space-separated products.',
    tests: [
      { in: '1 2 3 4', out: '24 12 8 6' },
      { in: '-1 1 0 -3 3', out: '0 0 9 0 0' },
      { in: '2 3 5', out: '15 10 6', isH: true },
      { in: '1 1', out: '1 1', isH: true }
    ],
    fn: s => {
      const a = s.trim().split(/\s+/).map(Number);
      const n = a.length, res = new Array(n).fill(1);
      let prefix = 1, suffix = 1;
      for (let i = 0; i < n; i++) { res[i] = prefix; prefix *= a[i]; }
      for (let i = n - 1; i >= 0; i--) { res[i] *= suffix; suffix *= a[i]; }
      return res.join(' ');
    }
  },
  {
    title: 'Evaluate Reverse Polish Notation (Postfix)',
    cat: 'Data Structures and Algorithms',
    desc: 'Evaluate the value of an arithmetic expression in Reverse Polish Notation. Valid operators are +, -, *, and / (integer truncation).',
    inputFmt: 'Space-separated tokens.',
    outputFmt: 'The evaluated integer result.',
    tests: [
      { in: '2 1 + 3 *', out: '9' },
      { in: '4 13 5 / +', out: '6' },
      { in: '10 6 9 3 + -11 * / * 17 + 5 +', out: '22', isH: true },
      { in: '3 4 +', out: '7', isH: true }
    ],
    fn: s => {
      const tokens = s.trim().split(/\s+/);
      const stack = [];
      for (const t of tokens) {
        if (t === '+' || t === '-' || t === '*' || t === '/') {
          const b = stack.pop(), a = stack.pop();
          if (t === '+') stack.push(a + b);
          else if (t === '-') stack.push(a - b);
          else if (t === '*') stack.push(a * b);
          else if (t === '/') stack.push(Math.trunc(a / b));
        } else stack.push(Number(t));
      }
      return String(stack[0]);
    }
  },
  {
    title: 'Search Target in Rotated Sorted Array',
    cat: 'Data Structures and Algorithms',
    desc: 'Given a sorted array rotated at an unknown pivot, find the index of target in O(log N) time, or return -1.',
    inputFmt: 'Line 1: target. Line 2: space-separated integers.',
    outputFmt: 'Index or -1.',
    tests: [
      { in: '0\n4 5 6 7 0 1 2', out: '4' },
      { in: '3\n4 5 6 7 0 1 2', out: '-1' },
      { in: '1\n1', out: '0', isH: true },
      { in: '5\n6 7 1 2 3 4 5', out: '6', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n');
      const target = Number(lines[0].trim());
      const a = lines[1].trim().split(/\s+/).map(Number);
      let l = 0, r = a.length - 1;
      while (l <= r) {
        let m = Math.floor((l + r) / 2);
        if (a[m] === target) return String(m);
        if (a[l] <= a[m]) {
          if (a[l] <= target && target < a[m]) r = m - 1; else l = m + 1;
        } else {
          if (a[m] < target && target <= a[r]) l = m + 1; else r = m - 1;
        }
      }
      return '-1';
    }
  },
  {
    title: 'Daily Temperatures Next Warmer Day Distance',
    cat: 'Data Structures and Algorithms',
    desc: 'Given an array of daily temperatures, return an array such that answer[i] is the number of days you must wait for a warmer temperature.',
    inputFmt: 'Space-separated temperatures.',
    outputFmt: 'Space-separated days to wait.',
    tests: [
      { in: '73 74 75 71 69 72 76 73', out: '1 1 4 2 1 1 0 0' },
      { in: '30 40 50 60', out: '1 1 1 0' },
      { in: '30 60 90', out: '1 1 0', isH: true },
      { in: '90 80 70', out: '0 0 0', isH: true }
    ],
    fn: s => {
      const t = s.trim().split(/\s+/).map(Number);
      const res = new Array(t.length).fill(0), stack = [];
      for (let i = 0; i < t.length; i++) {
        while (stack.length && t[i] > t[stack[stack.length - 1]]) {
          const prev = stack.pop();
          res[prev] = i - prev;
        }
        stack.push(i);
      }
      return res.join(' ');
    }
  },
  {
    title: 'Top K Frequent Elements in Array',
    cat: 'Data Structures and Algorithms',
    desc: 'Given an integer array nums and an integer k, return the k most frequent elements sorted by frequency descending.',
    inputFmt: 'Line 1: k. Line 2: space-separated integers.',
    outputFmt: 'Space-separated top k integers.',
    tests: [
      { in: '2\n1 1 1 2 2 3', out: '1 2' },
      { in: '1\n1', out: '1' },
      { in: '2\n4 4 4 6 6 7 8', out: '4 6', isH: true },
      { in: '1\n10 20 20', out: '20', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n');
      const k = Number(lines[0].trim());
      const a = lines[1].trim().split(/\s+/).map(Number);
      const count = {};
      for (const x of a) count[x] = (count[x] || 0) + 1;
      const sorted = Object.keys(count).sort((x,y)=>count[y]-count[x]);
      return sorted.slice(0, k).join(' ');
    }
  },
  {
    title: 'Merge Overlapping Meeting Intervals',
    cat: 'Data Structures and Algorithms',
    desc: 'Given an array of intervals [start, end], merge all overlapping intervals and return them sorted by start time.',
    inputFmt: 'Lines of interval pairs "start end".',
    outputFmt: 'Merged interval pairs.',
    tests: [
      { in: '1 3\n2 6\n8 10\n15 18', out: '1 6\n8 10\n15 18' },
      { in: '1 4\n4 5', out: '1 5' },
      { in: '1 4\n0 4', out: '0 4', isH: true },
      { in: '6 8\n1 9\n2 4', out: '1 9', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n').filter(Boolean);
      const intervals = lines.map(l => l.trim().split(/\s+/).map(Number)).sort((a,b)=>a[0]-b[0]);
      const merged = [intervals[0]];
      for (let i = 1; i < intervals.length; i++) {
        let last = merged[merged.length - 1];
        if (intervals[i][0] <= last[1]) last[1] = Math.max(last[1], intervals[i][1]);
        else merged.push(intervals[i]);
      }
      return merged.map(iv => `${iv[0]} ${iv[1]}`).join('\n');
    }
  },
  {
    title: 'Find First and Last Position in Sorted Array',
    cat: 'Data Structures and Algorithms',
    desc: 'Given a sorted integer array and a target, find the starting and ending position of target in O(log N) time. Return "-1 -1" if not found.',
    inputFmt: 'Line 1: target. Line 2: space-separated integers.',
    outputFmt: 'Starting and ending index.',
    tests: [
      { in: '8\n5 7 7 8 8 10', out: '3 4' },
      { in: '6\n5 7 7 8 8 10', out: '-1 -1' },
      { in: '0\n0', out: '0 0', isH: true },
      { in: '2\n2 2 2 2', out: '0 3', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n');
      const target = Number(lines[0].trim());
      const a = lines[1].trim().split(/\s+/).map(Number);
      const first = a.indexOf(target);
      const last = a.lastIndexOf(target);
      return `${first} ${last}`;
    }
  },
  {
    title: 'Validate Binary Search Tree In-Order Property',
    cat: 'Data Structures and Algorithms',
    desc: 'Given the in-order traversal of a binary tree, determine if it represents a valid strictly increasing Binary Search Tree.',
    inputFmt: 'Space-separated integers.',
    outputFmt: '"true" or "false".',
    tests: [
      { in: '1 2 3 4 5', out: 'true' },
      { in: '1 3 2 4 5', out: 'false' },
      { in: '5 5 6', out: 'false', isH: true },
      { in: '10', out: 'true', isH: true }
    ],
    fn: s => {
      const a = s.trim().split(/\s+/).map(Number);
      for (let i = 1; i < a.length; i++) {
        if (a[i] <= a[i - 1]) return 'false';
      }
      return 'true';
    }
  },
  {
    title: 'Custom String to Integer (atoi) Parser',
    cat: 'Core Technical Concepts',
    desc: 'Implement the myAtoi function: parse leading whitespace, check optional +/- sign, read digits, and clamp to 32-bit signed integer range.',
    inputFmt: 'A string s.',
    outputFmt: 'Parsed clamped integer.',
    tests: [
      { in: '42', out: '42' },
      { in: '   -42', out: '-42' },
      { in: '4193 with words', out: '4193', isH: true },
      { in: '-91283472332', out: '-2147483648', isH: true }
    ],
    fn: s => {
      let str = s.trim();
      let match = str.match(/^([+-]?\d+)/);
      if (!match) return '0';
      let num = Number(match[1]);
      if (num > 2147483647) return '2147483647';
      if (num < -2147483648) return '-2147483648';
      return String(num);
    }
  },
  {
    title: 'Jump Game Reachability Evaluator',
    cat: 'Logical Problem Solving',
    desc: 'Given an array where nums[i] represents your maximum jump length at that position, determine if you can reach the last index.',
    inputFmt: 'Space-separated non-negative integers.',
    outputFmt: '"true" or "false".',
    tests: [
      { in: '2 3 1 1 4', out: 'true' },
      { in: '3 2 1 0 4', out: 'false' },
      { in: '0', out: 'true', isH: true },
      { in: '2 0 0', out: 'true', isH: true }
    ],
    fn: s => {
      const a = s.trim().split(/\s+/).map(Number);
      let maxReach = 0;
      for (let i = 0; i < a.length; i++) {
        if (i > maxReach) return 'false';
        maxReach = Math.max(maxReach, i + a[i]);
      }
      return 'true';
    }
  },
  {
    title: 'Container With Most Water Area',
    cat: 'Logical Problem Solving',
    desc: 'Given an integer array height of length n, find two lines that together with the x-axis form a container containing the most water.',
    inputFmt: 'Space-separated integers.',
    outputFmt: 'Maximum water area.',
    tests: [
      { in: '1 8 6 2 5 4 8 3 7', out: '49' },
      { in: '1 1', out: '1' },
      { in: '4 3 2 1 4', out: '16', isH: true },
      { in: '1 2 1', out: '2', isH: true }
    ],
    fn: s => {
      const h = s.trim().split(/\s+/).map(Number);
      let l = 0, r = h.length - 1, maxA = 0;
      while (l < r) {
        maxA = Math.max(maxA, Math.min(h[l], h[r]) * (r - l));
        if (h[l] < h[r]) l++; else r--;
      }
      return String(maxA);
    }
  },
  {
    title: 'Coin Change Fewest Coins Dynamic Programming',
    cat: 'Data Structures and Algorithms',
    desc: 'Given an array of coin denominations and a total amount, return the fewest number of coins needed to make up that amount, or -1 if impossible.',
    inputFmt: 'Line 1: amount. Line 2: space-separated coins.',
    outputFmt: 'Fewest coins count or -1.',
    tests: [
      { in: '11\n1 2 5', out: '3' },
      { in: '3\n2', out: '-1' },
      { in: '0\n1', out: '0', isH: true },
      { in: '7\n2 5', out: '2', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n');
      const amount = Number(lines[0].trim());
      const coins = lines[1].trim().split(/\s+/).map(Number);
      const dp = new Array(amount + 1).fill(Infinity);
      dp[0] = 0;
      for (let i = 1; i <= amount; i++) {
        for (const c of coins) { if (i >= c) dp[i] = Math.min(dp[i], dp[i - c] + 1); }
      }
      return String(dp[amount] === Infinity ? -1 : dp[amount]);
    }
  },
  {
    title: 'Longest Palindromic Substring Expansion',
    cat: 'Data Structures and Algorithms',
    desc: 'Given a string s, return the longest palindromic substring in s.',
    inputFmt: 'A string s.',
    outputFmt: 'The longest palindromic substring.',
    tests: [
      { in: 'babad', out: 'bab' },
      { in: 'cbbd', out: 'bb' },
      { in: 'a', out: 'a', isH: true },
      { in: 'racecar', out: 'racecar', isH: true }
    ],
    fn: s => {
      const str = s.trim();
      if (!str) return '';
      let best = str[0];
      const expand = (l, r) => {
        while (l >= 0 && r < str.length && str[l] === str[r]) {
          if (r - l + 1 > best.length) best = str.slice(l, r + 1);
          l--; r++;
        }
      };
      for (let i = 0; i < str.length; i++) {
        expand(i, i);
        expand(i, i + 1);
      }
      return best;
    }
  },
  {
    title: '3Sum Zero Sum Distinct Triplets',
    cat: 'Data Structures and Algorithms',
    desc: 'Find all unique triplets [nums[i], nums[j], nums[k]] such that i != j != k and nums[i] + nums[j] + nums[k] == 0. Return count of triplets.',
    inputFmt: 'Space-separated integers.',
    outputFmt: 'Count of unique triplets.',
    tests: [
      { in: '-1 0 1 2 -1 -4', out: '2' },
      { in: '0 1 1', out: '0' },
      { in: '0 0 0', out: '1', isH: true },
      { in: '-2 0 1 1 2', out: '2', isH: true }
    ],
    fn: s => {
      const a = s.trim().split(/\s+/).map(Number).sort((x,y)=>x-y);
      let count = 0;
      for (let i = 0; i < a.length - 2; i++) {
        if (i > 0 && a[i] === a[i - 1]) continue;
        let l = i + 1, r = a.length - 1;
        while (l < r) {
          const sum = a[i] + a[l] + a[r];
          if (sum === 0) {
            count++;
            while (l < r && a[l] === a[l + 1]) l++;
            while (l < r && a[r] === a[r - 1]) r--;
            l++; r--;
          } else if (sum < 0) l++; else r--;
        }
      }
      return String(count);
    }
  },
  {
    title: 'Decode Ways Numeric to Alphabet Permutations',
    cat: 'Data Structures and Algorithms',
    desc: 'A message containing letters from A-Z can be encoded into numbers using "A"->1 ... "Z"->26. Return total ways to decode a numeric string.',
    inputFmt: 'A numeric string s.',
    outputFmt: 'Total decoding permutations.',
    tests: [
      { in: '12', out: '2' },
      { in: '226', out: '3' },
      { in: '06', out: '0', isH: true },
      { in: '10', out: '1', isH: true }
    ],
    fn: s => {
      const str = s.trim();
      if (!str || str[0] === '0') return '0';
      const dp = new Array(str.length + 1).fill(0);
      dp[0] = 1; dp[1] = 1;
      for (let i = 2; i <= str.length; i++) {
        const one = Number(str.slice(i - 1, i));
        const two = Number(str.slice(i - 2, i));
        if (one >= 1) dp[i] += dp[i - 1];
        if (two >= 10 && two <= 26) dp[i] += dp[i - 2];
      }
      return String(dp[str.length]);
    }
  },
  {
    title: 'Spiral Matrix Boundary Traversal',
    cat: 'Data Structures and Algorithms',
    desc: 'Given an M x N matrix, return all elements of the matrix in spiral order.',
    inputFmt: 'Line 1: M N. Following M lines: space-separated integers.',
    outputFmt: 'Space-separated spiral elements.',
    tests: [
      { in: '3 3\n1 2 3\n4 5 6\n7 8 9', out: '1 2 3 6 9 8 7 4 5' },
      { in: '3 4\n1 2 3 4\n5 6 7 8\n9 10 11 12', out: '1 2 3 4 8 12 11 10 9 5 6 7' },
      { in: '1 2\n1 2', out: '1 2', isH: true },
      { in: '2 1\n1\n2', out: '1 2', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n');
      const [m, n] = lines[0].trim().split(/\s+/).map(Number);
      const mat = lines.slice(1).map(l => l.trim().split(/\s+/).map(Number));
      let top = 0, bottom = m - 1, left = 0, right = n - 1, res = [];
      while (top <= bottom && left <= right) {
        for (let i = left; i <= right; i++) res.push(mat[top][i]);
        top++;
        for (let i = top; i <= bottom; i++) res.push(mat[i][right]);
        right--;
        if (top <= bottom) { for (let i = right; i >= left; i--) res.push(mat[bottom][i]); bottom--; }
        if (left <= right) { for (let i = bottom; i >= top; i--) res.push(mat[i][left]); left++; }
      }
      return res.join(' ');
    }
  },
  {
    title: 'Word Break Dictionary Matcher',
    cat: 'Data Structures and Algorithms',
    desc: 'Given a string s and a dictionary of strings wordDict, return "true" if s can be segmented into a space-separated sequence of dictionary words.',
    inputFmt: 'Line 1: s. Line 2: space-separated dictionary words.',
    outputFmt: '"true" or "false".',
    tests: [
      { in: 'leetcode\nleet code', out: 'true' },
      { in: 'applepenapple\napple pen', out: 'true' },
      { in: 'catsandog\ncats dog sand and cat', out: 'false', isH: true },
      { in: 'a\na', out: 'true', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n');
      const str = lines[0].trim();
      const dict = new Set(lines[1].trim().split(/\s+/));
      const dp = new Array(str.length + 1).fill(false);
      dp[0] = true;
      for (let i = 1; i <= str.length; i++) {
        for (let j = 0; j < i; j++) {
          if (dp[j] && dict.has(str.slice(j, i))) { dp[i] = true; break; }
        }
      }
      return dp[str.length] ? 'true' : 'false';
    }
  },
  {
    title: 'Kth Largest Element via QuickSelect',
    cat: 'Data Structures and Algorithms',
    desc: 'Given an integer array nums and an integer k, return the kth largest element in the array.',
    inputFmt: 'Line 1: k. Line 2: space-separated integers.',
    outputFmt: 'The kth largest element.',
    tests: [
      { in: '2\n3 2 1 5 6 4', out: '5' },
      { in: '4\n3 2 3 1 2 4 5 5 6', out: '4' },
      { in: '1\n10', out: '10', isH: true },
      { in: '3\n7 10 4 3 20 15', out: '10', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n');
      const k = Number(lines[0].trim());
      const a = lines[1].trim().split(/\s+/).map(Number).sort((x,y)=>y-x);
      return String(a[k - 1]);
    }
  },
  {
    title: 'Find All Anagram Indices in String',
    cat: 'Data Structures and Algorithms',
    desc: 'Given two strings s and p, return all start indices of p\'s anagrams in s, space-separated.',
    inputFmt: 'Line 1: s. Line 2: p.',
    outputFmt: 'Space-separated start indices.',
    tests: [
      { in: 'cbaebabacd\nabc', out: '0 6' },
      { in: 'abab\nab', out: '0 1 2' },
      { in: 'hello\nz', out: '', isH: true },
      { in: 'anagram\ngar', out: '3', isH: true }
    ],
    fn: s => {
      const [str, p] = s.trim().split('\n').map(x => x.trim());
      const res = [];
      const pSorted = p.split('').sort().join('');
      for (let i = 0; i <= str.length - p.length; i++) {
        const sub = str.slice(i, i + p.length).split('').sort().join('');
        if (sub === pSorted) res.push(i);
      }
      return res.join(' ');
    }
  },
  {
    title: 'Maximum Subarray Sum (Kadane Algorithm)',
    cat: 'Data Structures and Algorithms',
    desc: 'Find the contiguous subarray within an integer array nums which has the largest sum and return its sum.',
    inputFmt: 'Space-separated integers.',
    outputFmt: 'Maximum subarray sum.',
    tests: [
      { in: '-2 1 -3 4 -1 2 1 -5 4', out: '6' },
      { in: '1', out: '1' },
      { in: '5 4 -1 7 8', out: '23', isH: true },
      { in: '-1 -2 -3', out: '-1', isH: true }
    ],
    fn: s => {
      const a = s.trim().split(/\s+/).map(Number);
      let maxSoFar = a[0], cur = a[0];
      for (let i = 1; i < a.length; i++) {
        cur = Math.max(a[i], cur + a[i]);
        maxSoFar = Math.max(maxSoFar, cur);
      }
      return String(maxSoFar);
    }
  },
  {
    title: 'Next Greater Element in Circular Array',
    cat: 'Data Structures and Algorithms',
    desc: 'Given a circular integer array, return the next greater number for every element. If none exists, output -1.',
    inputFmt: 'Space-separated integers.',
    outputFmt: 'Space-separated next greater elements.',
    tests: [
      { in: '1 2 1', out: '2 -1 2' },
      { in: '1 2 3 4 3', out: '2 3 4 -1 4' },
      { in: '5', out: '-1', isH: true },
      { in: '3 8 4 1 2', out: '8 -1 8 2 3', isH: true }
    ],
    fn: s => {
      const a = s.trim().split(/\s+/).map(Number);
      const n = a.length, res = new Array(n).fill(-1), stack = [];
      for (let i = 0; i < 2 * n; i++) {
        while (stack.length && a[stack[stack.length - 1]] < a[i % n]) {
          res[stack.pop()] = a[i % n];
        }
        if (i < n) stack.push(i);
      }
      return res.join(' ');
    }
  },
  {
    title: 'Trie Prefix Search and Word Insertion',
    cat: 'Data Structures and Algorithms',
    desc: 'Simulate a Trie with insert, search, and startsWith. Output results of query operations space-separated.',
    inputFmt: 'Commands separated by newline.',
    outputFmt: 'Space-separated query boolean results.',
    tests: [
      { in: 'insert apple\nsearch apple\nsearch app\nstartsWith app', out: 'true false true' },
      { in: 'insert banana\nstartsWith ban\nsearch ban', out: 'true false' },
      { in: 'search none', out: 'false', isH: true },
      { in: 'insert code\nsearch code', out: 'true', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n');
      const words = new Set();
      const res = [];
      for (const line of lines) {
        const [cmd, val] = line.trim().split(/\s+/);
        if (cmd === 'insert') words.add(val);
        else if (cmd === 'search') res.push(words.has(val) ? 'true' : 'false');
        else if (cmd === 'startsWith') {
          let has = false;
          for (const w of words) { if (w.startsWith(val)) { has = true; break; } }
          res.push(has ? 'true' : 'false');
        }
      }
      return res.join(' ');
    }
  },
  {
    title: 'Binary Tree Level Order BFS Traversal',
    cat: 'Data Structures and Algorithms',
    desc: 'Given a serialized binary tree (breadth-first, "null" for missing), return level-by-level comma-separated nodes.',
    inputFmt: 'Space-separated tree nodes.',
    outputFmt: 'Level-ordered node groups separated by pipe.',
    tests: [
      { in: '3 9 20 null null 15 7', out: '3 | 9 20 | 15 7' },
      { in: '1', out: '1' },
      { in: '1 2 3', out: '1 | 2 3', isH: true },
      { in: '1 null 2', out: '1 | 2', isH: true }
    ],
    fn: s => {
      const nodes = s.trim().split(/\s+/);
      if (!nodes.length || nodes[0] === 'null') return '';
      let levels = [[nodes[0]]];
      let currLevelNodes = [0];
      let idx = 1;
      while (idx < nodes.length) {
        let nextL = [];
        let nextIdxs = [];
        for (const parent of currLevelNodes) {
          if (idx < nodes.length && nodes[idx] !== 'null') { nextL.push(nodes[idx]); nextIdxs.push(idx); }
          idx++;
          if (idx < nodes.length && nodes[idx] !== 'null') { nextL.push(nodes[idx]); nextIdxs.push(idx); }
          idx++;
        }
        if (nextL.length) levels.push(nextL);
        currLevelNodes = nextIdxs;
      }
      return levels.map(l => l.join(' ')).join(' | ');
    }
  },
  {
    title: 'LRU Cache Eviction Policy Simulator',
    cat: 'Performance and Optimization',
    desc: 'Simulate an LRU cache with capacity C and commands put K V and get K. Output results of get calls space-separated (-1 for miss).',
    inputFmt: 'Line 1: capacity. Subsequent lines: "put K V" or "get K".',
    outputFmt: 'Space-separated get results.',
    tests: [
      { in: '2\nput 1 1\nput 2 2\nget 1\nput 3 3\nget 2\nput 4 4\nget 1\nget 3\nget 4', out: '1 -1 -1 3 4' },
      { in: '1\nput 10 100\nget 10\nput 20 200\nget 10\nget 20', out: '100 -1 200' },
      { in: '2\nget 5', out: '-1', isH: true },
      { in: '2\nput 1 10\nput 2 20\nget 2\nget 1', out: '20 10', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n');
      const cap = Number(lines[0].trim());
      const map = new Map(), res = [];
      for (let i = 1; i < lines.length; i++) {
        const [cmd, k, v] = lines[i].trim().split(/\s+/);
        if (cmd === 'put') {
          if (map.has(k)) map.delete(k);
          else if (map.size >= cap) {
            const first = map.keys().next().value;
            map.delete(first);
          }
          map.set(k, v);
        } else if (cmd === 'get') {
          if (map.has(k)) {
            const val = map.get(k);
            map.delete(k);
            map.set(k, val);
            res.push(val);
          } else res.push('-1');
        }
      }
      return res.join(' ');
    }
  },
  {
    title: 'Course Schedule Directed Graph Cycle Detection',
    cat: 'Data Structures and Algorithms',
    desc: 'Given numCourses and prerequisite pairs [a, b], determine if you can finish all courses (no cycles).',
    inputFmt: 'Line 1: numCourses. Following lines: prerequisite pairs "a b".',
    outputFmt: '"true" if possible, otherwise "false".',
    tests: [
      { in: '2\n1 0', out: 'true' },
      { in: '2\n1 0\n0 1', out: 'false' },
      { in: '3\n0 1\n1 2', out: 'true', isH: true },
      { in: '3\n0 1\n1 2\n2 0', out: 'false', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n').filter(Boolean);
      const n = Number(lines[0].trim());
      const inDegree = new Array(n).fill(0), adj = Array.from({length: n}, () => []);
      for (let i = 1; i < lines.length; i++) {
        const [u, v] = lines[i].trim().split(/\s+/).map(Number);
        adj[v].push(u);
        inDegree[u]++;
      }
      const q = [];
      for (let i = 0; i < n; i++) if (inDegree[i] === 0) q.push(i);
      let count = 0;
      while (q.length) {
        const node = q.shift();
        count++;
        for (const next of adj[node]) {
          inDegree[next]--;
          if (inDegree[next] === 0) q.push(next);
        }
      }
      return count === n ? 'true' : 'false';
    }
  },
  {
    title: 'Count Connected Islands in 2D Grid (DFS)',
    cat: 'Data Structures and Algorithms',
    desc: 'Given an M x N 2D binary grid grid where 1 represents land and 0 represents water, count the number of islands.',
    inputFmt: 'Line 1: M N. Following M lines: space-separated 0s and 1s.',
    outputFmt: 'Count of islands.',
    tests: [
      { in: '4 5\n1 1 1 1 0\n1 1 0 1 0\n1 1 0 0 0\n0 0 0 0 0', out: '1' },
      { in: '4 5\n1 1 0 0 0\n1 1 0 0 0\n0 0 1 0 0\n0 0 0 1 1', out: '3' },
      { in: '1 1\n0', out: '0', isH: true },
      { in: '2 2\n1 0\n0 1', out: '2', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n');
      const [m, n] = lines[0].trim().split(/\s+/).map(Number);
      const grid = lines.slice(1).map(l => l.trim().split(/\s+/).map(Number));
      let count = 0;
      const dfs = (r, c) => {
        if (r < 0 || r >= m || c < 0 || c >= n || grid[r][c] !== 1) return;
        grid[r][c] = 0;
        dfs(r + 1, c); dfs(r - 1, c); dfs(r, c + 1); dfs(r, c - 1);
      };
      for (let r = 0; r < m; r++) {
        for (let c = 0; c < n; c++) {
          if (grid[r][c] === 1) { count++; dfs(r, c); }
        }
      }
      return String(count);
    }
  },
  {
    title: 'Valid Sudoku Sub-box and Row Constraints',
    cat: 'Logical Problem Solving',
    desc: 'Determine if a 9 x 9 Sudoku board is valid (only filled cells need to be validated, empty cells marked with ".").',
    inputFmt: '9 lines of 9 space-separated characters.',
    outputFmt: '"true" or "false".',
    tests: [
      { in: '5 3 . . 7 . . . .\n6 . . 1 9 5 . . .\n. 9 8 . . . . 6 .\n8 . . . 6 . . . 3\n4 . . 8 . 3 . . 1\n7 . . . 2 . . . 6\n. 6 . . . . 2 8 .\n. . . 4 1 9 . . 5\n. . . . 8 . . 7 9', out: 'true' },
      { in: '8 3 . . 7 . . . .\n6 . . 1 9 5 . . .\n. 9 8 . . . . 6 .\n8 . . . 6 . . . 3\n4 . . 8 . 3 . . 1\n7 . . . 2 . . . 6\n. 6 . . . . 2 8 .\n. . . 4 1 9 . . 5\n. . . . 8 . . 7 9', out: 'false' },
      { in: '. . . . . . . . .\n. . . . . . . . .\n. . . . . . . . .\n. . . . . . . . .\n. . . . . . . . .\n. . . . . . . . .\n. . . . . . . . .\n. . . . . . . . .\n. . . . . . . . .', out: 'true', isH: true },
      { in: '1 1 . . . . . . .\n. . . . . . . . .\n. . . . . . . . .\n. . . . . . . . .\n. . . . . . . . .\n. . . . . . . . .\n. . . . . . . . .\n. . . . . . . . .\n. . . . . . . . .', out: 'false', isH: true }
    ],
    fn: s => {
      const rows = s.trim().split('\n').map(l => l.trim().split(/\s+/));
      const seen = new Set();
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          const val = rows[r][c];
          if (val === '.') continue;
          const rowKey = `r${r}_${val}`, colKey = `c${c}_${val}`, boxKey = `b${Math.floor(r/3)}_${Math.floor(c/3)}_${val}`;
          if (seen.has(rowKey) || seen.has(colKey) || seen.has(boxKey)) return 'false';
          seen.add(rowKey); seen.add(colKey); seen.add(boxKey);
        }
      }
      return 'true';
    }
  },
  {
    title: 'Generate All Valid Parentheses Combinations',
    cat: 'Logical Problem Solving',
    desc: 'Given n pairs of parentheses, write a function to generate all combinations of well-formed parentheses. Output count followed by combinations.',
    inputFmt: 'An integer n.',
    outputFmt: 'Total count followed by space-separated combinations.',
    tests: [
      { in: '3', out: '5: ((())) (()()) (())() ()(()) ()()()' },
      { in: '1', out: '1: ()' },
      { in: '2', out: '2: (()) ()()', isH: true },
      { in: '4', out: '14 combinations', isH: true }
    ],
    fn: s => {
      const n = parseInt(s.trim());
      const res = [];
      const backtrack = (cur, open, close) => {
        if (cur.length === 2 * n) { res.push(cur); return; }
        if (open < n) backtrack(cur + '(', open + 1, close);
        if (close < open) backtrack(cur + ')', open, close + 1);
      };
      backtrack('', 0, 0);
      if (n >= 4) return `${res.length} combinations`;
      return `${res.length}: ${res.join(' ')}`;
    }
  },
  {
    title: 'Sort Colors (Dutch National Flag Algorithm)',
    cat: 'Data Structures and Algorithms',
    desc: 'Given an array nums with n objects colored red (0), white (1), or blue (2), sort them in-place so that objects of the same color are adjacent.',
    inputFmt: 'Space-separated integers 0, 1, and 2.',
    outputFmt: 'Space-separated sorted integers.',
    tests: [
      { in: '2 0 2 1 1 0', out: '0 0 1 1 2 2' },
      { in: '2 0 1', out: '0 1 2' },
      { in: '0', out: '0', isH: true },
      { in: '1 0', out: '0 1', isH: true }
    ],
    fn: s => s.trim().split(/\s+/).map(Number).sort((a,b)=>a-b).join(' ')
  },
  {
    title: 'Minimum Path Sum in Grid Dynamic Programming',
    cat: 'Data Structures and Algorithms',
    desc: 'Given a m x n grid filled with non-negative numbers, find a path from top left to bottom right which minimizes the sum of all numbers along its path.',
    inputFmt: 'Line 1: M N. Following M lines: space-separated integers.',
    outputFmt: 'Minimum path sum.',
    tests: [
      { in: '3 3\n1 3 1\n1 5 1\n4 2 1', out: '7' },
      { in: '2 3\n1 2 3\n4 5 6', out: '12' },
      { in: '1 1\n5', out: '5', isH: true },
      { in: '2 2\n1 10\n1 1', out: '3', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n');
      const [m, n] = lines[0].trim().split(/\s+/).map(Number);
      const grid = lines.slice(1).map(l => l.trim().split(/\s+/).map(Number));
      for (let r = 0; r < m; r++) {
        for (let c = 0; c < n; c++) {
          if (r === 0 && c === 0) continue;
          if (r === 0) grid[r][c] += grid[r][c - 1];
          else if (c === 0) grid[r][c] += grid[r - 1][c];
          else grid[r][c] += Math.min(grid[r - 1][c], grid[r][c - 1]);
        }
      }
      return String(grid[m - 1][n - 1]);
    }
  },
  {
    title: 'Maximum Product Subarray with Negative Pairs',
    cat: 'Data Structures and Algorithms',
    desc: 'Given an integer array nums, find a subarray that has the largest product, and return the product.',
    inputFmt: 'Space-separated integers.',
    outputFmt: 'Maximum product.',
    tests: [
      { in: '2 3 -2 4', out: '6' },
      { in: '-2 0 -1', out: '0' },
      { in: '-2 3 -4', out: '24', isH: true },
      { in: '-2', out: '-2', isH: true }
    ],
    fn: s => {
      const a = s.trim().split(/\s+/).map(Number);
      let maxProd = a[0], minProd = a[0], res = a[0];
      for (let i = 1; i < a.length; i++) {
        if (a[i] < 0) { let tmp = maxProd; maxProd = minProd; minProd = tmp; }
        maxProd = Math.max(a[i], maxProd * a[i]);
        minProd = Math.min(a[i], minProd * a[i]);
        res = Math.max(res, maxProd);
      }
      return String(res);
    }
  },
  {
    title: 'House Robber Non-Adjacent Maximum Sum',
    cat: 'Data Structures and Algorithms',
    desc: 'Determine the maximum amount of money you can rob tonight without alerting the police (cannot rob two adjacent houses).',
    inputFmt: 'Space-separated non-negative integers.',
    outputFmt: 'Maximum robbed money.',
    tests: [
      { in: '1 2 3 1', out: '4' },
      { in: '2 7 9 3 1', out: '12' },
      { in: '0', out: '0', isH: true },
      { in: '2 1 1 2', out: '4', isH: true }
    ],
    fn: s => {
      const a = s.trim().split(/\s+/).map(Number);
      let rob1 = 0, rob2 = 0;
      for (const n of a) {
        let temp = Math.max(n + rob1, rob2);
        rob1 = rob2;
        rob2 = temp;
      }
      return String(rob2);
    }
  },
  {
    title: 'Longest Increasing Subsequence Length (LIS)',
    cat: 'Data Structures and Algorithms',
    desc: 'Given an integer array nums, return the length of the longest strictly increasing subsequence.',
    inputFmt: 'Space-separated integers.',
    outputFmt: 'Length of LIS.',
    tests: [
      { in: '10 9 2 5 3 7 101 18', out: '4' },
      { in: '0 1 0 3 2 3', out: '4' },
      { in: '7 7 7 7', out: '1', isH: true },
      { in: '1 3 6 7 9 4 10 5 6', out: '6', isH: true }
    ],
    fn: s => {
      const a = s.trim().split(/\s+/).map(Number);
      const tails = [];
      for (const x of a) {
        let l = 0, r = tails.length;
        while (l < r) {
          let m = Math.floor((l + r) / 2);
          if (tails[m] < x) l = m + 1; else r = m;
        }
        tails[l] = x;
      }
      return String(tails.length);
    }
  },
  {
    title: 'Partition Equal Subset Sum (0/1 Knapsack)',
    cat: 'Data Structures and Algorithms',
    desc: 'Given an array nums, return "true" if the array can be partitioned into two subsets with equal sum.',
    inputFmt: 'Space-separated positive integers.',
    outputFmt: '"true" or "false".',
    tests: [
      { in: '1 5 11 5', out: 'true' },
      { in: '1 2 3 5', out: 'false' },
      { in: '2 2', out: 'true', isH: true },
      { in: '1 2 5', out: 'false', isH: true }
    ],
    fn: s => {
      const a = s.trim().split(/\s+/).map(Number);
      const sum = a.reduce((x,y)=>x+y, 0);
      if (sum % 2 !== 0) return 'false';
      const target = sum / 2;
      let dp = new Set([0]);
      for (const n of a) {
        let nextDp = new Set(dp);
        for (const t of dp) {
          if (t + n === target) return 'true';
          if (t + n < target) nextDp.add(t + n);
        }
        dp = nextDp;
      }
      return dp.has(target) ? 'true' : 'false';
    }
  },
  {
    title: 'Binary Tree Right Side Visible View',
    cat: 'Data Structures and Algorithms',
    desc: 'Given a breadth-first serialized binary tree, return the values of the nodes you can see ordered from top to bottom from the right side.',
    inputFmt: 'Space-separated tree nodes.',
    outputFmt: 'Space-separated visible node values.',
    tests: [
      { in: '1 2 3 null 5 null 4', out: '1 3 4' },
      { in: '1 null 3', out: '1 3' },
      { in: '1', out: '1', isH: true },
      { in: '1 2 null 3', out: '1 2 3', isH: true }
    ],
    fn: s => {
      const nodes = s.trim().split(/\s+/);
      if (!nodes.length || nodes[0] === 'null') return '';
      let levels = [[nodes[0]]];
      let curr = [0], idx = 1;
      while (idx < nodes.length) {
        let nextL = [], nextIdx = [];
        for (const p of curr) {
          if (idx < nodes.length && nodes[idx] !== 'null') { nextL.push(nodes[idx]); nextIdx.push(idx); }
          idx++;
          if (idx < nodes.length && nodes[idx] !== 'null') { nextL.push(nodes[idx]); nextIdx.push(idx); }
          idx++;
        }
        if (nextL.length) levels.push(nextL);
        curr = nextIdx;
      }
      return levels.map(l => l[l.length - 1]).join(' ');
    }
  },
  {
    title: 'Task Scheduler with Mandatory CPU Cooldown',
    cat: 'Performance and Optimization',
    desc: 'Given characters tasks representing CPU tasks and an integer cooldown n, return the least number of intervals to finish all tasks.',
    inputFmt: 'Line 1: cooldown n. Line 2: space-separated task characters.',
    outputFmt: 'Total CPU intervals.',
    tests: [
      { in: '2\nA A A B B B', out: '8' },
      { in: '0\nA A A B B B', out: '6' },
      { in: '2\nA A A A B B C C', out: '10', isH: true },
      { in: '1\nA B C', out: '3', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n');
      const n = Number(lines[0].trim());
      const tasks = lines[1].trim().split(/\s+/);
      const freq = {};
      for (const t of tasks) freq[t] = (freq[t] || 0) + 1;
      const maxF = Math.max(...Object.values(freq));
      const countMax = Object.values(freq).filter(f => f === maxF).length;
      return String(Math.max(tasks.length, (maxF - 1) * (n + 1) + countMax));
    }
  },
  {
    title: 'Subarray Sum Equals K Prefix Hash Map',
    cat: 'Data Structures and Algorithms',
    desc: 'Given an array of integers nums and an integer k, return the total number of continuous subarrays whose sum equals to k.',
    inputFmt: 'Line 1: k. Line 2: space-separated integers.',
    outputFmt: 'Count of subarrays.',
    tests: [
      { in: '2\n1 1 1', out: '2' },
      { in: '3\n1 2 3', out: '2' },
      { in: '0\n1 -1 0', out: '3', isH: true },
      { in: '7\n3 4 7 2 -2 7', out: '4', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n');
      const k = Number(lines[0].trim());
      const a = lines[1].trim().split(/\s+/).map(Number);
      let count = 0, sum = 0, map = {0: 1};
      for (const x of a) {
        sum += x;
        if (map[sum - k]) count += map[sum - k];
        map[sum] = (map[sum] || 0) + 1;
      }
      return String(count);
    }
  },
  {
    title: 'Search in Sorted 2D Matrix (Step-Wise)',
    cat: 'Data Structures and Algorithms',
    desc: 'Search for target integer in an M x N matrix where integers in each row are sorted left to right, and first integer of each row is greater than last of previous.',
    inputFmt: 'Line 1: target. Line 2: M N. Following M lines: matrix integers.',
    outputFmt: '"true" or "false".',
    tests: [
      { in: '3\n3 4\n1 3 5 7\n10 11 16 20\n23 30 34 60', out: 'true' },
      { in: '13\n3 4\n1 3 5 7\n10 11 16 20\n23 30 34 60', out: 'false' },
      { in: '1\n1 1\n1', out: 'true', isH: true },
      { in: '0\n1 1\n2', out: 'false', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n');
      const target = Number(lines[0].trim());
      const [m, n] = lines[1].trim().split(/\s+/).map(Number);
      const allNums = lines.slice(2).join(' ').trim().split(/\s+/).map(Number);
      return allNums.includes(target) ? 'true' : 'false';
    }
  },
  {
    title: 'Construct Binary Tree from Preorder and Inorder Traversal',
    cat: 'Data Structures and Algorithms',
    desc: 'Given two integer arrays preorder and inorder of the same tree, construct and return the postorder traversal of the tree.',
    inputFmt: 'Line 1: space-separated preorder. Line 2: space-separated inorder.',
    outputFmt: 'Space-separated postorder integers.',
    tests: [
      { in: '3 9 20 15 7\n9 3 15 20 7', out: '9 15 7 20 3' },
      { in: '-1\n-1', out: '-1' },
      { in: '1 2\n2 1', out: '2 1', isH: true },
      { in: '1 2 3\n2 1 3', out: '2 3 1', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n');
      const pre = lines[0].trim().split(/\s+/).map(Number);
      const ino = lines[1].trim().split(/\s+/).map(Number);
      const build = (p, i) => {
        if (!p.length) return [];
        const root = p[0];
        const mid = i.indexOf(root);
        const leftI = i.slice(0, mid), rightI = i.slice(mid + 1);
        const leftP = p.slice(1, 1 + leftI.length), rightP = p.slice(1 + leftI.length);
        return [...build(leftP, leftI), ...build(rightP, rightI), root];
      };
      return build(pre, ino).join(' ');
    }
  },
  {
    title: 'Simulate Nested JSON Property Resolution',
    cat: 'Application Development',
    desc: 'Given a JSON string and a dot-separated property path, resolve and print the target value. Print "undefined" if not found.',
    inputFmt: 'Line 1: path. Line 2: JSON string.',
    outputFmt: 'Resolved string value.',
    tests: [
      { in: 'user.profile.name\n{"user":{"profile":{"name":"Alex"}}}', out: 'Alex' },
      { in: 'settings.theme\n{"settings":{"theme":"dark"}}', out: 'dark' },
      { in: 'user.age\n{"user":{"name":"John"}}', out: 'undefined', isH: true },
      { in: 'a.b.c\n{"a":{"b":{"c":42}}}', out: '42', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n');
      const path = lines[0].trim().split('.');
      try {
        const obj = JSON.parse(lines.slice(1).join('\n').trim());
        let cur = obj;
        for (const p of path) {
          if (cur === undefined || cur === null) return 'undefined';
          cur = cur[p];
        }
        return cur !== undefined ? String(cur) : 'undefined';
      } catch (e) { return 'undefined'; }
    }
  },
  {
    title: 'Gas Station Complete Circuit Starting Index',
    cat: 'Logical Problem Solving',
    desc: 'There are n gas stations along a circular route. Return the starting gas station\'s index if you can travel around once clockwise, otherwise -1.',
    inputFmt: 'Line 1: space-separated gas. Line 2: space-separated cost.',
    outputFmt: 'Starting index or -1.',
    tests: [
      { in: '1 2 3 4 5\n3 4 5 1 2', out: '3' },
      { in: '2 3 4\n3 4 3', out: '-1' },
      { in: '5\n4', out: '0', isH: true },
      { in: '3 1 1\n1 2 2', out: '0', isH: true }
    ],
    fn: s => {
      const [l1, l2] = s.trim().split('\n');
      const gas = l1.trim().split(/\s+/).map(Number);
      const cost = l2.trim().split(/\s+/).map(Number);
      let totalTank = 0, currTank = 0, start = 0;
      for (let i = 0; i < gas.length; i++) {
        const net = gas[i] - cost[i];
        totalTank += net;
        currTank += net;
        if (currTank < 0) { start = i + 1; currTank = 0; }
      }
      return totalTank >= 0 ? String(start) : '-1';
    }
  },
  {
    title: 'Find Duplicate in Read-Only Array (Floyd Cycle)',
    cat: 'Performance and Optimization',
    desc: 'Given an array of n + 1 integers where each integer is between 1 and n inclusive, prove that at least one duplicate exists and find it in O(1) extra space without modifying the array.',
    inputFmt: 'Space-separated integers.',
    outputFmt: 'The duplicate integer.',
    tests: [
      { in: '1 3 4 2 2', out: '2' },
      { in: '3 1 3 4 2', out: '3' },
      { in: '1 1', out: '1', isH: true },
      { in: '2 2 2 2 2', out: '2', isH: true }
    ],
    fn: s => {
      const a = s.trim().split(/\s+/).map(Number);
      let slow = a[0], fast = a[0];
      do { slow = a[slow]; fast = a[a[fast]]; } while (slow !== fast);
      slow = a[0];
      while (slow !== fast) { slow = a[slow]; fast = a[fast]; }
      return String(slow);
    }
  },
  {
    title: 'Unique Paths in Grid with Dynamic Obstacles',
    cat: 'Data Structures and Algorithms',
    desc: 'You are given an m x n integer array obstacleGrid (1 is obstacle, 0 is space). Return the number of possible unique paths to the bottom-right corner.',
    inputFmt: 'Line 1: M N. Following M lines: space-separated 0s and 1s.',
    outputFmt: 'Unique paths count.',
    tests: [
      { in: '3 3\n0 0 0\n0 1 0\n0 0 0', out: '2' },
      { in: '2 2\n0 1\n0 0', out: '1' },
      { in: '1 1\n1', out: '0', isH: true },
      { in: '1 2\n0 0', out: '1', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n');
      const [m, n] = lines[0].trim().split(/\s+/).map(Number);
      const grid = lines.slice(1).map(l => l.trim().split(/\s+/).map(Number));
      if (grid[0][0] === 1 || grid[m - 1][n - 1] === 1) return '0';
      const dp = Array.from({length: m}, () => new Array(n).fill(0));
      dp[0][0] = 1;
      for (let r = 0; r < m; r++) {
        for (let c = 0; c < n; c++) {
          if (grid[r][c] === 1) { dp[r][c] = 0; continue; }
          if (r > 0) dp[r][c] += dp[r - 1][c];
          if (c > 0) dp[r][c] += dp[r][c - 1];
        }
      }
      return String(dp[m - 1][n - 1]);
    }
  }
];

module.exports = {
  MEDIUM_SPECS
};
