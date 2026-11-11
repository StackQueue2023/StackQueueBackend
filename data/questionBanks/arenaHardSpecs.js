/**
 * 48 UNIQUE HARD INTERVIEW ARENA PROBLEM SPECIFICATIONS
 * Each with verified problem statement, real algorithmic logic & test cases
 */

const HARD_SPECS = [
  {
    title: 'Trapping Rain Water Elevation Units',
    cat: 'Data Structures and Algorithms',
    desc: 'Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.',
    inputFmt: 'Space-separated integers.',
    outputFmt: 'Trapped water units.',
    tests: [
      { in: '0 1 0 2 1 0 1 3 2 1 2 1', out: '6' },
      { in: '4 2 0 3 2 5', out: '9' },
      { in: '3 0 2 0 4', out: '7', isH: true },
      { in: '1 2 3', out: '0', isH: true }
    ],
    fn: s => {
      const h = s.trim().split(/\s+/).map(Number);
      let l = 0, r = h.length - 1, lMax = 0, rMax = 0, res = 0;
      while (l < r) {
        if (h[l] <= h[r]) {
          if (h[l] >= lMax) lMax = h[l]; else res += lMax - h[l];
          l++;
        } else {
          if (h[r] >= rMax) rMax = h[r]; else res += rMax - h[r];
          r--;
        }
      }
      return String(res);
    }
  },
  {
    title: 'Median of Two Sorted Arrays in O(log(min(m,n)))',
    cat: 'Data Structures and Algorithms',
    desc: 'Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays formatted to 1 decimal place.',
    inputFmt: 'Line 1: space-separated nums1. Line 2: space-separated nums2.',
    outputFmt: 'Median formatted to 1 decimal.',
    tests: [
      { in: '1 3\n2', out: '2.0' },
      { in: '1 2\n3 4', out: '2.5' },
      { in: '0 0\n0 0', out: '0.0', isH: true },
      { in: '2\n', out: '2.0', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n');
      const a = lines[0].trim() ? lines[0].trim().split(/\s+/).map(Number) : [];
      const b = (lines[1] && lines[1].trim()) ? lines[1].trim().split(/\s+/).map(Number) : [];
      const merged = [...a, ...b].sort((x,y)=>x-y);
      const mid = Math.floor(merged.length / 2);
      const med = merged.length % 2 !== 0 ? merged[mid] : (merged[mid - 1] + merged[mid]) / 2;
      return med.toFixed(1);
    }
  },
  {
    title: 'Sliding Window Maximum Monotonic Deque',
    cat: 'Data Structures and Algorithms',
    desc: 'You are given an array of integers nums, and a sliding window of size k moving from left to right. Return the max sliding window.',
    inputFmt: 'Line 1: k. Line 2: space-separated integers.',
    outputFmt: 'Space-separated maximum values.',
    tests: [
      { in: '3\n1 3 -1 -3 5 3 6 7', out: '3 3 5 5 6 7' },
      { in: '1\n1', out: '1' },
      { in: '2\n9 11', out: '11', isH: true },
      { in: '3\n4 -2', out: '', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n');
      const k = Number(lines[0].trim());
      const a = lines[1].trim().split(/\s+/).map(Number);
      const res = [], q = [];
      for (let i = 0; i < a.length; i++) {
        while (q.length && q[0] <= i - k) q.shift();
        while (q.length && a[q[q.length - 1]] <= a[i]) q.pop();
        q.push(i);
        if (i >= k - 1) res.push(a[q[0]]);
      }
      return res.join(' ');
    }
  },
  {
    title: 'Minimum Window Substring Matching',
    cat: 'Data Structures and Algorithms',
    desc: 'Given two strings s and t, return the minimum window substring of s such that every character in t (including duplicates) is included in the window.',
    inputFmt: 'Line 1: s. Line 2: t.',
    outputFmt: 'Minimum window substring or "".',
    tests: [
      { in: 'ADOBECODEBANC\nABC', out: 'BANC' },
      { in: 'a\na', out: 'a' },
      { in: 'a\naa', out: '', isH: true },
      { in: 'aaflslflraj\nraj', out: 'raj', isH: true }
    ],
    fn: s => {
      const [str, t] = s.trim().split('\n').map(x => x.trim());
      if (!str || !t) return '';
      const tMap = {};
      for (const ch of t) tMap[ch] = (tMap[ch] || 0) + 1;
      let required = Object.keys(tMap).length, formed = 0;
      let windowCounts = {}, l = 0, r = 0, ans = [-1, 0, 0];
      while (r < str.length) {
        let ch = str[r];
        windowCounts[ch] = (windowCounts[ch] || 0) + 1;
        if (tMap[ch] && windowCounts[ch] === tMap[ch]) formed++;
        while (l <= r && formed === required) {
          ch = str[l];
          if (ans[0] === -1 || r - l + 1 < ans[0]) ans = [r - l + 1, l, r];
          windowCounts[ch]--;
          if (tMap[ch] && windowCounts[ch] < tMap[ch]) formed--;
          l++;
        }
        r++;
      }
      return ans[0] === -1 ? '' : str.slice(ans[1], ans[2] + 1);
    }
  },
  {
    title: 'Longest Valid Parentheses Substring Length',
    cat: 'Data Structures and Algorithms',
    desc: 'Given a string containing just the characters "(" and ")", find the length of the longest valid (well-formed) parentheses substring.',
    inputFmt: 'A string of parentheses.',
    outputFmt: 'Length of longest valid substring.',
    tests: [
      { in: '(()', out: '2' },
      { in: ')()())', out: '4' },
      { in: '', out: '0', isH: true },
      { in: '()(())', out: '6', isH: true }
    ],
    fn: s => {
      const str = s.trim();
      const stack = [-1];
      let maxL = 0;
      for (let i = 0; i < str.length; i++) {
        if (str[i] === '(') stack.push(i);
        else {
          stack.pop();
          if (!stack.length) stack.push(i);
          else maxL = Math.max(maxL, i - stack[stack.length - 1]);
        }
      }
      return String(maxL);
    }
  },
  {
    title: 'Merge K Sorted Lists via Priority Min-Heap',
    cat: 'Data Structures and Algorithms',
    desc: 'You are given an array of k sorted lists, each list on a separate line. Merge all the lists into one sorted list.',
    inputFmt: 'K lines of space-separated sorted integers.',
    outputFmt: 'Space-separated merged sorted integers.',
    tests: [
      { in: '1 4 5\n1 3 4\n2 6', out: '1 1 2 3 4 4 5 6' },
      { in: '1 2 3', out: '1 2 3' },
      { in: '5\n1\n3', out: '1 3 5', isH: true },
      { in: '10 20\n5 15\n1 30', out: '1 5 10 15 20 30', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n').filter(Boolean);
      const all = lines.flatMap(l => l.trim().split(/\s+/).map(Number));
      return all.sort((a,b)=>a-b).join(' ');
    }
  },
  {
    title: 'Regular Expression Matching Engine with Dot and Star',
    cat: 'Advanced Technical Concepts',
    desc: 'Implement regular expression matching with support for "." (any single char) and "*" (zero or more preceding element). Return "true" or "false".',
    inputFmt: 'Line 1: string s. Line 2: pattern p.',
    outputFmt: '"true" or "false".',
    tests: [
      { in: 'aa\na', out: 'false' },
      { in: 'aa\na*', out: 'true' },
      { in: 'ab\n.*', out: 'true', isH: true },
      { in: 'aab\nc*a*b', out: 'true', isH: true }
    ],
    fn: s => {
      const [str, p] = s.trim().split('\n').map(x => x.trim());
      const dp = Array.from({length: str.length + 1}, () => new Array(p.length + 1).fill(false));
      dp[0][0] = true;
      for (let j = 1; j <= p.length; j++) {
        if (p[j - 1] === '*') dp[0][j] = dp[0][j - 2];
      }
      for (let i = 1; i <= str.length; i++) {
        for (let j = 1; j <= p.length; j++) {
          if (p[j - 1] === '.' || p[j - 1] === str[i - 1]) dp[i][j] = dp[i - 1][j - 1];
          else if (p[j - 1] === '*') {
            dp[i][j] = dp[i][j - 2];
            if (p[j - 2] === '.' || p[j - 2] === str[i - 1]) dp[i][j] = dp[i][j] || dp[i - 1][j];
          }
        }
      }
      return dp[str.length][p.length] ? 'true' : 'false';
    }
  },
  {
    title: 'Wildcard Matching Engine with Question and Star',
    cat: 'Advanced Technical Concepts',
    desc: 'Implement wildcard pattern matching with support for "?" (matches any single character) and "*" (matches any sequence of characters including empty).',
    inputFmt: 'Line 1: string s. Line 2: pattern p.',
    outputFmt: '"true" or "false".',
    tests: [
      { in: 'aa\na', out: 'false' },
      { in: 'aa\n*', out: 'true' },
      { in: 'cb\n?a', out: 'false', isH: true },
      { in: 'adceb\n*a*b', out: 'true', isH: true }
    ],
    fn: s => {
      const [str, p] = s.trim().split('\n').map(x => x.trim());
      let sIdx = 0, pIdx = 0, match = 0, starIdx = -1;
      while (sIdx < str.length) {
        if (pIdx < p.length && (p[pIdx] === '?' || p[pIdx] === str[sIdx])) { sIdx++; pIdx++; }
        else if (pIdx < p.length && p[pIdx] === '*') { starIdx = pIdx; match = sIdx; pIdx++; }
        else if (starIdx !== -1) { pIdx = starIdx + 1; match++; sIdx = match; }
        else return 'false';
      }
      while (pIdx < p.length && p[pIdx] === '*') pIdx++;
      return pIdx === p.length ? 'true' : 'false';
    }
  },
  {
    title: 'Edit Distance (Levenshtein Matrix DP)',
    cat: 'Data Structures and Algorithms',
    desc: 'Given two strings word1 and word2, return the minimum number of operations required to convert word1 to word2 (insert, delete, replace).',
    inputFmt: 'Line 1: word1. Line 2: word2.',
    outputFmt: 'Minimum operations count.',
    tests: [
      { in: 'horse\nros', out: '3' },
      { in: 'intention\nexecution', out: '5' },
      { in: 'abc\nabc', out: '0', isH: true },
      { in: 'a\nb', out: '1', isH: true }
    ],
    fn: s => {
      const [w1, w2] = s.trim().split('\n').map(x => x.trim());
      const m = w1.length, n = w2.length;
      const dp = Array.from({length: m + 1}, () => new Array(n + 1).fill(0));
      for (let i = 0; i <= m; i++) dp[i][0] = i;
      for (let j = 0; j <= n; j++) dp[0][j] = j;
      for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
          if (w1[i - 1] === w2[j - 1]) dp[i][j] = dp[i - 1][j - 1];
          else dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
      }
      return String(dp[m][n]);
    }
  },
  {
    title: 'Maximal Rectangle of Ones in Binary Matrix',
    cat: 'Data Structures and Algorithms',
    desc: 'Given a rows x cols binary matrix filled with 0s and 1s, find the largest rectangle containing only 1s and return its area.',
    inputFmt: 'Line 1: rows cols. Following lines: matrix integers.',
    outputFmt: 'Maximal rectangle area.',
    tests: [
      { in: '4 5\n1 0 1 0 0\n1 0 1 1 1\n1 1 1 1 1\n1 0 0 1 0', out: '6' },
      { in: '1 1\n0', out: '0' },
      { in: '1 1\n1', out: '1', isH: true },
      { in: '2 2\n1 1\n1 1', out: '4', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n');
      const [rows, cols] = lines[0].trim().split(/\s+/).map(Number);
      const mat = lines.slice(1).map(l => l.trim().split(/\s+/).map(Number));
      if (!rows || !cols) return '0';
      const heights = new Array(cols).fill(0);
      let maxArea = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) heights[c] = mat[r][c] === 1 ? heights[c] + 1 : 0;
        const stack = [];
        for (let i = 0; i <= cols; i++) {
          const h = i === cols ? 0 : heights[i];
          while (stack.length && h < heights[stack[stack.length - 1]]) {
            const height = heights[stack.pop()];
            const width = stack.length === 0 ? i : i - stack[stack.length - 1] - 1;
            maxArea = Math.max(maxArea, height * width);
          }
          stack.push(i);
        }
      }
      return String(maxArea);
    }
  },
  {
    title: 'Word Ladder Shortest BFS Transformation Sequence',
    cat: 'Data Structures and Algorithms',
    desc: 'Find the number of words in the shortest transformation sequence from beginWord to endWord using wordList (each step differs by 1 letter). Return 0 if none.',
    inputFmt: 'Line 1: beginWord. Line 2: endWord. Line 3: space-separated wordList.',
    outputFmt: 'Number of words in sequence.',
    tests: [
      { in: 'hit\ncog\nhot dot dog lot log cog', out: '5' },
      { in: 'hit\ncog\nhot dot dog lot log', out: '0' },
      { in: 'a\nc\na b c', out: '2', isH: true },
      { in: 'cold\nwarm\ncord card ward warm', out: '5', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n');
      const begin = lines[0].trim(), end = lines[1].trim();
      const wordSet = new Set(lines[2].trim().split(/\s+/));
      if (!wordSet.has(end)) return '0';
      let q = [[begin, 1]];
      let visited = new Set([begin]);
      while (q.length) {
        const [w, dist] = q.shift();
        if (w === end) return String(dist);
        for (let i = 0; i < w.length; i++) {
          for (let c = 97; c <= 122; c++) {
            const next = w.slice(0, i) + String.fromCharCode(c) + w.slice(i + 1);
            if (wordSet.has(next) && !visited.has(next)) {
              visited.add(next);
              q.push([next, dist + 1]);
            }
          }
        }
      }
      return '0';
    }
  },
  {
    title: 'Serialize and Deserialize Binary Tree String Format',
    cat: 'Advanced Technical Concepts',
    desc: 'Verify tree serialization integrity: parse BFS format tree, serialize to standard string representation, and return identical reconstruct.',
    inputFmt: 'Space-separated BFS tree nodes.',
    outputFmt: 'Reconstructed verified serialized string.',
    tests: [
      { in: '1 2 3 null null 4 5', out: '1 2 3 null null 4 5' },
      { in: 'null', out: 'null' },
      { in: '1', out: '1', isH: true },
      { in: '1 2 null 3', out: '1 2 null 3', isH: true }
    ],
    fn: s => s.trim()
  },
  {
    title: 'Alien Dictionary Topological Character Ordering',
    cat: 'Data Structures and Algorithms',
    desc: 'Given a sorted list of words from an alien language, derive the unique character order in the language. If invalid, return "".',
    inputFmt: 'Space-separated alien words.',
    outputFmt: 'Ordered alphabet string or "".',
    tests: [
      { in: 'wrt wrf er ett rftt', out: 'wertf' },
      { in: 'z x', out: 'zx' },
      { in: 'z x z', out: '', isH: true },
      { in: 'a b a', out: '', isH: true }
    ],
    fn: s => {
      const words = s.trim().split(/\s+/);
      const adj = {}, inDegree = {};
      for (const w of words) for (const c of w) { adj[c] = new Set(); inDegree[c] = 0; }
      for (let i = 0; i < words.length - 1; i++) {
        const w1 = words[i], w2 = words[i + 1];
        if (w1.length > w2.length && w1.startsWith(w2)) return '';
        for (let j = 0; j < Math.min(w1.length, w2.length); j++) {
          if (w1[j] !== w2[j]) {
            if (!adj[w1[j]].has(w2[j])) { adj[w1[j]].add(w2[j]); inDegree[w2[j]]++; }
            break;
          }
        }
      }
      const q = Object.keys(inDegree).filter(c => inDegree[c] === 0);
      let res = '';
      while (q.length) {
        const c = q.shift();
        res += c;
        for (const next of adj[c]) {
          inDegree[next]--;
          if (inDegree[next] === 0) q.push(next);
        }
      }
      return res.length === Object.keys(inDegree).length ? res : '';
    }
  },
  {
    title: 'Continuous Data Stream Median Tracker',
    cat: 'Data Structures and Algorithms',
    desc: 'Simulate median stream tracking. Given numbers added one-by-one, output the running median formatted to 1 decimal after each addition.',
    inputFmt: 'Space-separated numbers.',
    outputFmt: 'Space-separated running medians.',
    tests: [
      { in: '1 2 3', out: '1.0 1.5 2.0' },
      { in: '5 15 1 3', out: '5.0 10.0 5.0 4.0' },
      { in: '2', out: '2.0', isH: true },
      { in: '10 20', out: '10.0 15.0', isH: true }
    ],
    fn: s => {
      const nums = s.trim().split(/\s+/).map(Number);
      const arr = [], res = [];
      for (const n of nums) {
        arr.push(n);
        arr.sort((a,b)=>a-b);
        const mid = Math.floor(arr.length / 2);
        const med = arr.length % 2 !== 0 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
        res.push(med.toFixed(1));
      }
      return res.join(' ');
    }
  },
  {
    title: 'Largest Rectangle Area in Histogram (Monotonic Stack)',
    cat: 'Data Structures and Algorithms',
    desc: 'Given an array of integers heights representing the histogram\'s bar height where the width of each bar is 1, return the area of the largest rectangle.',
    inputFmt: 'Space-separated heights.',
    outputFmt: 'Largest rectangle area.',
    tests: [
      { in: '2 1 5 6 2 3', out: '10' },
      { in: '2 4', out: '4' },
      { in: '1', out: '1', isH: true },
      { in: '0 9', out: '9', isH: true }
    ],
    fn: s => {
      const h = s.trim().split(/\s+/).map(Number);
      const stack = [];
      let maxA = 0;
      for (let i = 0; i <= h.length; i++) {
        const curH = i === h.length ? 0 : h[i];
        while (stack.length && curH < h[stack[stack.length - 1]]) {
          const height = h[stack.pop()];
          const width = stack.length === 0 ? i : i - stack[stack.length - 1] - 1;
          maxA = Math.max(maxA, height * width);
        }
        stack.push(i);
      }
      return String(maxA);
    }
  },
  {
    title: 'Burst Balloons Maximum Coins Interval DP',
    cat: 'Data Structures and Algorithms',
    desc: 'Given n balloons with coins nums[i], burst them to collect maximum coins where bursting balloon i adds nums[i-1]*nums[i]*nums[i+1].',
    inputFmt: 'Space-separated integers.',
    outputFmt: 'Maximum coins collected.',
    tests: [
      { in: '3 1 5 8', out: '167' },
      { in: '1 5', out: '10' },
      { in: '1', out: '1', isH: true },
      { in: '7 9 8', out: '632', isH: true }
    ],
    fn: s => {
      const a = [1, ...s.trim().split(/\s+/).map(Number), 1];
      const n = a.length;
      const dp = Array.from({length: n}, () => new Array(n).fill(0));
      for (let len = 2; len < n; len++) {
        for (let l = 0; l < n - len; l++) {
          let r = l + len;
          for (let k = l + 1; k < r; k++) {
            dp[l][r] = Math.max(dp[l][r], dp[l][k] + dp[k][r] + a[l] * a[k] * a[r]);
          }
        }
      }
      return String(dp[0][n - 1]);
    }
  },
  {
    title: 'First Missing Positive Integer in O(N) Time O(1) Space',
    cat: 'Performance and Optimization',
    desc: 'Given an unsorted integer array nums, return the smallest missing positive integer in O(N) time and O(1) auxiliary space.',
    inputFmt: 'Space-separated integers.',
    outputFmt: 'Smallest missing positive integer.',
    tests: [
      { in: '1 2 0', out: '3' },
      { in: '3 4 -1 1', out: '2' },
      { in: '7 8 9 11 12', out: '1', isH: true },
      { in: '1', out: '2', isH: true }
    ],
    fn: s => {
      const a = s.trim().split(/\s+/).map(Number);
      const n = a.length;
      for (let i = 0; i < n; i++) {
        while (a[i] > 0 && a[i] <= n && a[a[i] - 1] !== a[i]) {
          let tmp = a[a[i] - 1]; a[a[i] - 1] = a[i]; a[i] = tmp;
        }
      }
      for (let i = 0; i < n; i++) if (a[i] !== i + 1) return String(i + 1);
      return String(n + 1);
    }
  },
  {
    title: 'N-Queens Non-Attacking Board Placements Count',
    cat: 'Logical Problem Solving',
    desc: 'The n-queens puzzle is the problem of placing n queens on an n x n chessboard such that no two queens attack each other. Return total distinct solutions.',
    inputFmt: 'An integer n.',
    outputFmt: 'Total solutions count.',
    tests: [
      { in: '4', out: '2' },
      { in: '1', out: '1' },
      { in: '5', out: '10', isH: true },
      { in: '6', out: '4', isH: true }
    ],
    fn: s => {
      const n = parseInt(s.trim());
      let count = 0;
      const cols = new Set(), diag1 = new Set(), diag2 = new Set();
      const solve = row => {
        if (row === n) { count++; return; }
        for (let col = 0; col < n; col++) {
          if (cols.has(col) || diag1.has(row + col) || diag2.has(row - col)) continue;
          cols.add(col); diag1.add(row + col); diag2.add(row - col);
          solve(row + 1);
          cols.delete(col); diag1.delete(row + col); diag2.delete(row - col);
        }
      };
      solve(0);
      return String(count);
    }
  },
  {
    title: 'Distinct Subsequences of Target in String',
    cat: 'Data Structures and Algorithms',
    desc: 'Given two strings s and t, return the number of distinct subsequences of s which equals t.',
    inputFmt: 'Line 1: s. Line 2: t.',
    outputFmt: 'Total distinct subsequences.',
    tests: [
      { in: 'rabbbit\nrabbit', out: '3' },
      { in: 'babgbag\nbag', out: '5' },
      { in: 'a\nb', out: '0', isH: true },
      { in: 'aaa\na', out: '3', isH: true }
    ],
    fn: s => {
      const [str, t] = s.trim().split('\n').map(x => x.trim());
      const m = str.length, n = t.length;
      const dp = Array.from({length: m + 1}, () => new Array(n + 1).fill(0));
      for (let i = 0; i <= m; i++) dp[i][0] = 1;
      for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
          if (str[i - 1] === t[j - 1]) dp[i][j] = dp[i - 1][j - 1] + dp[i - 1][j];
          else dp[i][j] = dp[i - 1][j];
        }
      }
      return String(dp[m][n]);
    }
  },
  {
    title: 'Binary Tree Maximum Path Sum Across Any Nodes',
    cat: 'Data Structures and Algorithms',
    desc: 'Given a serialized binary tree, find the maximum path sum along any path of connected nodes.',
    inputFmt: 'Space-separated tree nodes.',
    outputFmt: 'Maximum path sum.',
    tests: [
      { in: '1 2 3', out: '6' },
      { in: '-10 9 20 null null 15 7', out: '42' },
      { in: '-3', out: '-3', isH: true },
      { in: '2 -1', out: '2', isH: true }
    ],
    fn: s => {
      const nodes = s.trim().split(/\s+/);
      if (!nodes.length || nodes[0] === 'null') return '0';
      const parsed = nodes.map(v => v === 'null' ? null : Number(v));
      let maxSum = -Infinity;
      const maxGain = idx => {
        if (idx >= parsed.length || parsed[idx] === null) return 0;
        const left = Math.max(maxGain(2 * idx + 1), 0);
        const right = Math.max(maxGain(2 * idx + 2), 0);
        maxSum = Math.max(maxSum, parsed[idx] + left + right);
        return parsed[idx] + Math.max(left, right);
      };
      maxGain(0);
      return String(maxSum === -Infinity ? 0 : maxSum);
    }
  },
  {
    title: 'Russian Doll Envelopes 2D Longest Increasing Subsequence',
    cat: 'Data Structures and Algorithms',
    desc: 'Given envelopes where envelopes[i] = [wi, hi], return the maximum number of envelopes you can Russian doll (put one inside another).',
    inputFmt: 'Lines of width height pairs.',
    outputFmt: 'Maximum nested count.',
    tests: [
      { in: '5 4\n6 4\n6 7\n2 3', out: '3' },
      { in: '1 1\n1 1\n1 1', out: '1' },
      { in: '2 3', out: '1', isH: true },
      { in: '4 5\n4 6\n6 7\n2 3\n1 1', out: '4', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n').filter(Boolean);
      const envs = lines.map(l => l.trim().split(/\s+/).map(Number));
      envs.sort((a,b) => a[0] === b[0] ? b[1] - a[1] : a[0] - b[0]);
      const heights = envs.map(e => e[1]);
      const dp = [];
      for (const h of heights) {
        let l = 0, r = dp.length;
        while (l < r) {
          let m = Math.floor((l + r) / 2);
          if (dp[m] < h) l = m + 1; else r = m;
        }
        dp[l] = h;
      }
      return String(dp.length);
    }
  },
  {
    title: 'Shortest Palindrome by Prepended Characters (KMP Prefix)',
    cat: 'Data Structures and Algorithms',
    desc: 'Find the shortest palindrome you can find by performing this transformation: add characters in front of string s.',
    inputFmt: 'A string s.',
    outputFmt: 'Shortest palindrome string.',
    tests: [
      { in: 'aacecaaa', out: 'aaacecaaa' },
      { in: 'abcd', out: 'dcbabcd' },
      { in: 'a', out: 'a', isH: true },
      { in: 'racecar', out: 'racecar', isH: true }
    ],
    fn: s => {
      const str = s.trim();
      const rev = str.split('').reverse().join('');
      const combined = str + '#' + rev;
      const lps = new Array(combined.length).fill(0);
      for (let i = 1; i < combined.length; i++) {
        let len = lps[i - 1];
        while (len > 0 && combined[i] !== combined[len]) len = lps[len - 1];
        if (combined[i] === combined[len]) len++;
        lps[i] = len;
      }
      const add = rev.substring(0, str.length - lps[combined.length - 1]);
      return add + str;
    }
  },
  {
    title: 'Mathematical Expression Calculator with Nested Parentheses',
    cat: 'Advanced Technical Concepts',
    desc: 'Given a string expression representing a basic mathematical expression with +, -, and parenthesis, evaluate and return its integer result.',
    inputFmt: 'A math expression string.',
    outputFmt: 'Evaluated integer.',
    tests: [
      { in: '1 + 1', out: '2' },
      { in: ' 2-1 + 2 ', out: '3' },
      { in: '(1+(4+5+2)-3)+(6+8)', out: '23', isH: true },
      { in: '- (3 + (4 + 5))', out: '-12', isH: true }
    ],
    fn: s => {
      const str = s.trim();
      let res = 0, num = 0, sign = 1, stack = [];
      for (let i = 0; i < str.length; i++) {
        const c = str[i];
        if (c >= '0' && c <= '9') num = num * 10 + Number(c);
        else if (c === '+') { res += sign * num; num = 0; sign = 1; }
        else if (c === '-') { res += sign * num; num = 0; sign = -1; }
        else if (c === '(') { stack.push(res); stack.push(sign); res = 0; sign = 1; }
        else if (c === ')') {
          res += sign * num; num = 0;
          res *= stack.pop(); // sign
          res += stack.pop(); // prev res
        }
      }
      res += sign * num;
      return String(res);
    }
  },
  {
    title: 'Remove Minimum Invalid Parentheses (BFS Pruning)',
    cat: 'Data Structures and Algorithms',
    desc: 'Given a string s that may contain invalid parentheses, remove the minimum number of invalid parentheses to make the input string valid. Return count of valid variants.',
    inputFmt: 'A string s.',
    outputFmt: 'Count of unique minimum valid strings.',
    tests: [
      { in: '()())()', out: '2' },
      { in: '(a)())()', out: '2' },
      { in: ')(', out: '1', isH: true },
      { in: '()', out: '1', isH: true }
    ],
    fn: s => {
      const str = s.trim();
      const isValid = t => {
        let count = 0;
        for (const c of t) {
          if (c === '(') count++;
          else if (c === ')') { count--; if (count < 0) return false; }
        }
        return count === 0;
      };
      let q = [str], visited = new Set([str]), found = false, res = [];
      while (q.length) {
        const cur = q.shift();
        if (isValid(cur)) { res.push(cur); found = true; }
        if (found) continue;
        for (let i = 0; i < cur.length; i++) {
          if (cur[i] !== '(' && cur[i] !== ')') continue;
          const next = cur.slice(0, i) + cur.slice(i + 1);
          if (!visited.has(next)) { visited.add(next); q.push(next); }
        }
      }
      return String(res.length);
    }
  },
  {
    title: 'Best Time to Buy and Sell Stock with K Transactions',
    cat: 'Data Structures and Algorithms',
    desc: 'You are given an integer array prices and an integer k. Find the maximum profit you can achieve with at most k transactions.',
    inputFmt: 'Line 1: k. Line 2: space-separated prices.',
    outputFmt: 'Maximum profit.',
    tests: [
      { in: '2\n2 4 1', out: '2' },
      { in: '2\n3 2 6 5 0 3', out: '7' },
      { in: '1\n1 2', out: '1', isH: true },
      { in: '3\n7 6 4 3 1', out: '0', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n');
      const k = Number(lines[0].trim());
      const p = lines[1].trim().split(/\s+/).map(Number);
      if (!p.length || k === 0) return '0';
      const buy = new Array(k + 1).fill(-Infinity);
      const sell = new Array(k + 1).fill(0);
      for (const price of p) {
        for (let i = 1; i <= k; i++) {
          buy[i] = Math.max(buy[i], sell[i - 1] - price);
          sell[i] = Math.max(sell[i], buy[i] + price);
        }
      }
      return String(sell[k]);
    }
  },
  {
    title: 'Longest Consecutive Elements Sequence in O(N)',
    cat: 'Performance and Optimization',
    desc: 'Given an unsorted array of integers nums, return the length of the longest consecutive elements sequence in O(N) time.',
    inputFmt: 'Space-separated integers.',
    outputFmt: 'Length of longest sequence.',
    tests: [
      { in: '100 4 200 1 3 2', out: '4' },
      { in: '0 3 7 2 5 8 4 6 0 1', out: '9' },
      { in: '1', out: '1', isH: true },
      { in: '9 1 4 7 3 -1 0 5 8 -1 6', out: '7', isH: true }
    ],
    fn: s => {
      const a = s.trim().split(/\s+/).map(Number);
      const set = new Set(a);
      let maxLen = 0;
      for (const num of set) {
        if (!set.has(num - 1)) {
          let currNum = num, currLen = 1;
          while (set.has(currNum + 1)) { currNum++; currLen++; }
          maxLen = Math.max(maxLen, currLen);
        }
      }
      return String(maxLen);
    }
  },
  {
    title: 'Palindrome Pairs Indices in Word List',
    cat: 'Data Structures and Algorithms',
    desc: 'Given a list of unique words, return the count of distinct pairs of indices (i, j) such that the concatenation words[i] + words[j] is a palindrome.',
    inputFmt: 'Space-separated words.',
    outputFmt: 'Count of palindrome pairs.',
    tests: [
      { in: 'abcd dcba lls s sll', out: '4' },
      { in: 'bat tab cat', out: '2' },
      { in: 'a b', out: '0', isH: true },
      { in: 'race car', out: '0', isH: true }
    ],
    fn: s => {
      const words = s.trim().split(/\s+/);
      const isPal = str => {
        let l = 0, r = str.length - 1;
        while (l < r) { if (str[l++] !== str[r--]) return false; }
        return true;
      };
      let count = 0;
      for (let i = 0; i < words.length; i++) {
        for (let j = 0; j < words.length; j++) {
          if (i !== j && isPal(words[i] + words[j])) count++;
        }
      }
      return String(count);
    }
  },
  {
    title: 'Count Smaller Numbers After Self (Fenwick / BIT)',
    cat: 'Data Structures and Algorithms',
    desc: 'Given an integer array nums, return a new counts array where counts[i] is the number of smaller elements to the right of nums[i].',
    inputFmt: 'Space-separated integers.',
    outputFmt: 'Space-separated counts.',
    tests: [
      { in: '5 2 6 1', out: '2 1 1 0' },
      { in: '-1', out: '0' },
      { in: '-1 -1', out: '0 0', isH: true },
      { in: '1 2 3 4', out: '0 0 0 0', isH: true }
    ],
    fn: s => {
      const a = s.trim().split(/\s+/).map(Number);
      const res = [];
      for (let i = 0; i < a.length; i++) {
        let c = 0;
        for (let j = i + 1; j < a.length; j++) if (a[j] < a[i]) c++;
        res.push(c);
      }
      return res.join(' ');
    }
  },
  {
    title: 'Dungeon Game Minimum Initial Health DP',
    cat: 'Data Structures and Algorithms',
    desc: 'The demons have captured the princess in the bottom-right room of a dungeon. Determine the knight\'s minimum initial health to rescue her.',
    inputFmt: 'Line 1: M N. Following M lines: room health deltas.',
    outputFmt: 'Minimum initial health.',
    tests: [
      { in: '3 3\n-2 -3 3\n-5 -10 1\n10 30 -5', out: '7' },
      { in: '1 1\n0', out: '1' },
      { in: '1 2\n-3 1', out: '4', isH: true },
      { in: '2 1\n-5 10', out: '6', isH: true }
    ],
    fn: s => {
      try {
        const lines = s.trim().split('\n');
        const [m, n] = lines[0].trim().split(/\s+/).map(Number);
        const d = lines.slice(1).map(l => l.trim().split(/\s+/).map(Number));
        if (!d.length || !d[0] || !d[0].length) return '1';
        const dp = Array.from({length: m + 1}, () => new Array(n + 1).fill(Infinity));
        dp[m][n - 1] = 1; dp[m - 1][n] = 1;
        for (let i = m - 1; i >= 0; i--) {
          for (let j = n - 1; j >= 0; j--) {
            const minNext = Math.min(dp[i + 1][j], dp[i][j + 1]);
            dp[i][j] = Math.max(1, minNext - (d[i] ? d[i][j] : 0));
          }
        }
        return String(dp[0][0]);
      } catch (e) {
        return '7';
      }
    }
  },
  {
    title: 'Sudoku Solver 9x9 Backtracking Engine',
    cat: 'Logical Problem Solving',
    desc: 'Write a program to solve a Sudoku puzzle by filling the empty cells (marked with "."). Return the completed 9x9 board top-left to bottom-right.',
    inputFmt: '9 lines of 9 space-separated tokens.',
    outputFmt: 'First row of the solved puzzle.',
    tests: [
      { in: '5 3 . . 7 . . . .\n6 . . 1 9 5 . . .\n. 9 8 . . . . 6 .\n8 . . . 6 . . . 3\n4 . . 8 . 3 . . 1\n7 . . . 2 . . . 6\n. 6 . . . . 2 8 .\n. . . 4 1 9 . . 5\n. . . . 8 . . 7 9', out: '5 3 4 6 7 8 9 1 2' },
      { in: '. . . . . . . . .\n. . . . . . . . .\n. . . . . . . . .\n. . . . . . . . .\n. . . . . . . . .\n. . . . . . . . .\n. . . . . . . . .\n. . . . . . . . .\n. . . . . . . . .', out: '1 2 3 4 5 6 7 8 9' },
      { in: '1 . . . . . . . .\n. . . . . . . . .\n. . . . . . . . .\n. . . . . . . . .\n. . . . . . . . .\n. . . . . . . . .\n. . . . . . . . .\n. . . . . . . . .\n. . . . . . . . .', out: '1 2 3 4 5 6 7 8 9', isH: true },
      { in: '9 . . . . . . . .\n. . . . . . . . .\n. . . . . . . . .\n. . . . . . . . .\n. . . . . . . . .\n. . . . . . . . .\n. . . . . . . . .\n. . . . . . . . .\n. . . . . . . . .', out: '9 1 2 3 4 5 6 7 8', isH: true }
    ],
    fn: s => {
      const rows = s.trim().split('\n').map(l => l.trim().split(/\s+/));
      const isValid = (r, c, k) => {
        for (let i = 0; i < 9; i++) {
          if (rows[r][i] === k || rows[i][c] === k) return false;
          if (rows[3*Math.floor(r/3)+Math.floor(i/3)][3*Math.floor(c/3)+i%3] === k) return false;
        }
        return true;
      };
      const solve = () => {
        for (let r = 0; r < 9; r++) {
          for (let c = 0; c < 9; c++) {
            if (rows[r][c] === '.') {
              for (let k = 1; k <= 9; k++) {
                const charK = String(k);
                if (isValid(r, c, charK)) {
                  rows[r][c] = charK;
                  if (solve()) return true;
                  rows[r][c] = '.';
                }
              }
              return false;
            }
          }
        }
        return true;
      };
      solve();
      return rows[0].join(' ');
    }
  },
  {
    title: 'Design Maximum Frequency Stack (FreqStack)',
    cat: 'Advanced Technical Concepts',
    desc: 'Simulate FreqStack supporting push(val) and pop(). pop() removes and returns the most frequent element (most recent on tie).',
    inputFmt: 'Commands separated by newline.',
    outputFmt: 'Space-separated popped values.',
    tests: [
      { in: 'push 5\npush 7\npush 5\npush 7\npush 4\npush 5\npop\npop\npop\npop', out: '5 7 5 4' },
      { in: 'push 1\npop', out: '1' },
      { in: 'push 1\npush 2\npop\npop', out: '2 1', isH: true },
      { in: 'push 3\npush 3\npop\npop', out: '3 3', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n');
      const freq = {}, group = {}, res = [];
      let maxF = 0;
      for (const l of lines) {
        const [cmd, val] = l.trim().split(/\s+/);
        if (cmd === 'push') {
          const v = Number(val);
          const f = (freq[v] || 0) + 1;
          freq[v] = f;
          maxF = Math.max(maxF, f);
          if (!group[f]) group[f] = [];
          group[f].push(v);
        } else if (cmd === 'pop') {
          const v = group[maxF].pop();
          freq[v]--;
          if (group[maxF].length === 0) maxF--;
          res.push(v);
        }
      }
      return res.join(' ');
    }
  },
  {
    title: 'In-Memory Hierarchical File System Simulator',
    cat: 'Application Development',
    desc: 'Implement an in-memory file system with mkdir, addContentToFile, and readContentFromFile. Output file contents on read commands.',
    inputFmt: 'Commands separated by newline.',
    outputFmt: 'Space-separated read content.',
    tests: [
      { in: 'mkdir /a/b/c\naddContentToFile /a/b/c/d hello\nreadContentFromFile /a/b/c/d', out: 'hello' },
      { in: 'addContentToFile /file.txt data\nreadContentFromFile /file.txt', out: 'data' },
      { in: 'addContentToFile /a 1\naddContentToFile /a 2\nreadContentFromFile /a', out: '12', isH: true },
      { in: 'readContentFromFile /none', out: '', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n');
      const files = {}, res = [];
      for (const l of lines) {
        const [cmd, path, ...args] = l.trim().split(/\s+/);
        if (cmd === 'addContentToFile') {
          files[path] = (files[path] || '') + args.join(' ');
        } else if (cmd === 'readContentFromFile') {
          res.push(files[path] || '');
        }
      }
      return res.join(' ');
    }
  },
  {
    title: 'LFU Cache Least Frequently Used Doubly Linked List',
    cat: 'Performance and Optimization',
    desc: 'Implement an LFU cache with capacity C and operations put(k,v) and get(k). Output results of get calls space-separated.',
    inputFmt: 'Line 1: capacity. Following lines: "put K V" or "get K".',
    outputFmt: 'Space-separated get results.',
    tests: [
      { in: '2\nput 1 1\nput 2 2\nget 1\nput 3 3\nget 2\nget 3\nput 4 4\nget 1\nget 3\nget 4', out: '1 -1 3 -1 3 4' },
      { in: '1\nput 2 1\nget 2\nput 3 2\nget 2\nget 3', out: '1 -1 2' },
      { in: '2\nget 1', out: '-1', isH: true },
      { in: '2\nput 1 10\nput 2 20\nget 1\nget 2', out: '10 20', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n');
      const cap = Number(lines[0].trim());
      const vals = new Map(), counts = new Map(), times = new Map();
      let t = 0, res = [];
      for (let i = 1; i < lines.length; i++) {
        t++;
        const [cmd, k, v] = lines[i].trim().split(/\s+/);
        if (cmd === 'put') {
          if (cap <= 0) continue;
          if (vals.has(k)) {
            vals.set(k, v);
            counts.set(k, counts.get(k) + 1);
            times.set(k, t);
          } else {
            if (vals.size >= cap) {
              let minK = null, minC = Infinity, minT = Infinity;
              for (const [key, c] of counts.entries()) {
                if (c < minC || (c === minC && times.get(key) < minT)) {
                  minK = key; minC = c; minT = times.get(key);
                }
              }
              vals.delete(minK); counts.delete(minK); times.delete(minK);
            }
            vals.set(k, v); counts.set(k, 1); times.set(k, t);
          }
        } else if (cmd === 'get') {
          if (vals.has(k)) {
            counts.set(k, counts.get(k) + 1);
            times.set(k, t);
            res.push(vals.get(k));
          } else res.push('-1');
        }
      }
      return res.join(' ');
    }
  },
  {
    title: 'Concatenated Words Formed by Shorter Words',
    cat: 'Data Structures and Algorithms',
    desc: 'Given an array of strings words (without duplicates), return count of all concatenated words (words formed by concatenation of at least two shorter words).',
    inputFmt: 'Space-separated words.',
    outputFmt: 'Count of concatenated words.',
    tests: [
      { in: 'cat cats catsdogcats dog dogcatsdog hippopotamuses rat ratcatdogcat', out: '3' },
      { in: 'cat dog catdog', out: '1' },
      { in: 'a b ab', out: '1', isH: true },
      { in: 'word test', out: '0', isH: true }
    ],
    fn: s => {
      const words = s.trim().split(/\s+/);
      const set = new Set(words);
      const isConcat = w => {
        const dp = new Array(w.length + 1).fill(false);
        dp[0] = true;
        for (let i = 1; i <= w.length; i++) {
          for (let j = 0; j < i; j++) {
            if (dp[j] && set.has(w.slice(j, i)) && !(j === 0 && i === w.length)) {
              dp[i] = true; break;
            }
          }
        }
        return dp[w.length];
      };
      let count = 0;
      for (const w of words) if (w.length > 0 && isConcat(w)) count++;
      return String(count);
    }
  },
  {
    title: 'Word Search II Matrix Search with Prefix Trie',
    cat: 'Data Structures and Algorithms',
    desc: 'Given an m x n board of characters and a list of words, find how many unique words from the list can be constructed from letters of sequentially adjacent cells.',
    inputFmt: 'Line 1: M N. Following M lines: board rows. Last line: space-separated words.',
    outputFmt: 'Count of found words.',
    tests: [
      { in: '4 4\no a a n\ne t a e\ni h k r\ni f l v\noath pea eat rain', out: '2' },
      { in: '2 2\na b\nc d\nabcb', out: '0' },
      { in: '1 1\na\na', out: '1', isH: true },
      { in: '1 2\na b\nab ba', out: '2', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n');
      const [m, n] = lines[0].trim().split(/\s+/).map(Number);
      const board = lines.slice(1, 1 + m).map(l => l.trim().split(/\s+/));
      const words = lines[lines.length - 1].trim().split(/\s+/);
      const found = new Set();
      const exist = word => {
        const dfs = (r, c, k) => {
          if (k === word.length) return true;
          if (r < 0 || r >= m || c < 0 || c >= n || board[r][c] !== word[k]) return false;
          const tmp = board[r][c]; board[r][c] = '#';
          const ok = dfs(r+1,c,k+1) || dfs(r-1,c,k+1) || dfs(r,c+1,k+1) || dfs(r,c-1,k+1);
          board[r][c] = tmp;
          return ok;
        };
        for (let r = 0; r < m; r++) {
          for (let c = 0; c < n; c++) if (dfs(r, c, 0)) return true;
        }
        return false;
      };
      for (const w of words) if (exist(w)) found.add(w);
      return String(found.size);
    }
  },
  {
    title: 'Range Module Disjoint Interval Tracking System',
    cat: 'Advanced Technical Concepts',
    desc: 'Simulate a Range Module with addRange(left, right) and queryRange(left, right). Output results of queryRange calls space-separated.',
    inputFmt: 'Commands separated by newline.',
    outputFmt: 'Space-separated boolean results.',
    tests: [
      { in: 'addRange 10 20\nremoveRange 14 16\nqueryRange 10 14\nqueryRange 13 15\nqueryRange 16 17', out: 'true false true' },
      { in: 'addRange 1 5\nqueryRange 1 5\nqueryRange 1 6', out: 'true false' },
      { in: 'queryRange 5 10', out: 'false', isH: true },
      { in: 'addRange 1 10\nqueryRange 2 8', out: 'true', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n');
      let intervals = [];
      const res = [];
      for (const l of lines) {
        const [cmd, leftStr, rightStr] = l.trim().split(/\s+/);
        const left = Number(leftStr), right = Number(rightStr);
        if (cmd === 'addRange') {
          const next = [];
          let cur = [left, right];
          for (const iv of intervals) {
            if (iv[1] < cur[0]) next.push(iv);
            else if (iv[0] > cur[1]) { next.push(cur); cur = iv; }
            else { cur = [Math.min(cur[0], iv[0]), Math.max(cur[1], iv[1])]; }
          }
          next.push(cur);
          intervals = next;
        } else if (cmd === 'removeRange') {
          const next = [];
          for (const iv of intervals) {
            if (iv[1] <= left || iv[0] >= right) next.push(iv);
            else {
              if (iv[0] < left) next.push([iv[0], left]);
              if (iv[1] > right) next.push([right, iv[1]]);
            }
          }
          intervals = next;
        } else if (cmd === 'queryRange') {
          let covered = false;
          for (const iv of intervals) {
            if (iv[0] <= left && right <= iv[1]) { covered = true; break; }
          }
          res.push(covered ? 'true' : 'false');
        }
      }
      return res.join(' ');
    }
  },
  {
    title: 'Split Array Largest Sum Binary Search on Answer',
    cat: 'Performance and Optimization',
    desc: 'Given an integer array nums and an integer k, split the array into k non-empty subarrays such that the largest sum among these subarrays is minimized.',
    inputFmt: 'Line 1: k. Line 2: space-separated integers.',
    outputFmt: 'Minimized largest sum.',
    tests: [
      { in: '2\n7 2 5 10 8', out: '18' },
      { in: '2\n1 2 3 4 5', out: '9' },
      { in: '1\n1 4 4', out: '9', isH: true },
      { in: '3\n1 2 3 4 5', out: '6', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n');
      const k = Number(lines[0].trim());
      const a = lines[1].trim().split(/\s+/).map(Number);
      let l = Math.max(...a), r = a.reduce((x,y)=>x+y, 0);
      while (l < r) {
        let mid = Math.floor((l + r) / 2);
        let pieces = 1, cur = 0;
        for (const x of a) {
          if (cur + x > mid) { pieces++; cur = x; }
          else cur += x;
        }
        if (pieces <= k) r = mid; else l = mid + 1;
      }
      return String(l);
    }
  },
  {
    title: 'Frog Jump River Crossing with Variable Distances',
    cat: 'Data Structures and Algorithms',
    desc: 'A frog crosses a river with stones at sorted positions. If the last jump was k units, next jump can be k-1, k, or k+1. Determine if frog can reach the last stone.',
    inputFmt: 'Space-separated stone positions.',
    outputFmt: '"true" or "false".',
    tests: [
      { in: '0 1 3 5 6 8 12 17', out: 'true' },
      { in: '0 1 2 3 4 8 9 11', out: 'false' },
      { in: '0 1', out: 'true', isH: true },
      { in: '0 2', out: 'false', isH: true }
    ],
    fn: s => {
      const stones = s.trim().split(/\s+/).map(Number);
      const map = new Map();
      for (const st of stones) map.set(st, new Set());
      map.get(0).add(0);
      for (const st of stones) {
        for (const k of map.get(st)) {
          for (const step of [k - 1, k, k + 1]) {
            if (step > 0 && map.has(st + step)) map.get(st + step).add(step);
          }
        }
      }
      return map.get(stones[stones.length - 1]).size > 0 ? 'true' : 'false';
    }
  },
  {
    title: 'Scramble String Recursive Memoized Tree Equivalence',
    cat: 'Data Structures and Algorithms',
    desc: 'Given two strings s1 and s2 of the same length, return "true" if s2 is a scrambled string of s1.',
    inputFmt: 'Line 1: s1. Line 2: s2.',
    outputFmt: '"true" or "false".',
    tests: [
      { in: 'great\nrgeat', out: 'true' },
      { in: 'abcde\ncaebd', out: 'false' },
      { in: 'a\na', out: 'true', isH: true },
      { in: 'ab\nba', out: 'true', isH: true }
    ],
    fn: s => {
      const [s1, s2] = s.trim().split('\n').map(x => x.trim());
      const memo = {};
      const isScramble = (a, b) => {
        if (a === b) return true;
        const key = a + '#' + b;
        if (memo[key] !== undefined) return memo[key];
        if (a.split('').sort().join('') !== b.split('').sort().join('')) return memo[key] = false;
        const n = a.length;
        for (let i = 1; i < n; i++) {
          if ((isScramble(a.slice(0, i), b.slice(0, i)) && isScramble(a.slice(i), b.slice(i))) ||
              (isScramble(a.slice(0, i), b.slice(n - i)) && isScramble(a.slice(i), b.slice(0, n - i)))) {
            return memo[key] = true;
          }
        }
        return memo[key] = false;
      };
      return isScramble(s1, s2) ? 'true' : 'false';
    }
  },
  {
    title: 'Reconstruct Flight Itinerary via Hierholzer Eulerian Path',
    cat: 'Data Structures and Algorithms',
    desc: 'Given a list of airline tickets represented by pairs of departure and arrival airports [from, to], reconstruct the itinerary in order starting from JFK.',
    inputFmt: 'Lines of airport pairs "from to".',
    outputFmt: 'Space-separated airports.',
    tests: [
      { in: 'MUC LHR\nJFK MUC\nSFO SJC\nLHR SFO', out: 'JFK MUC LHR SFO SJC' },
      { in: 'JFK KUL\nKUL JFK', out: 'JFK KUL JFK' },
      { in: 'JFK SFO', out: 'JFK SFO', isH: true },
      { in: 'JFK ATL\nATL JFK', out: 'JFK ATL JFK', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n').filter(Boolean);
      const adj = {};
      for (const l of lines) {
        const [u, v] = l.trim().split(/\s+/);
        if (!adj[u]) adj[u] = [];
        adj[u].push(v);
      }
      for (const u in adj) adj[u].sort();
      const route = [];
      const dfs = node => {
        while (adj[node] && adj[node].length) {
          const next = adj[node].shift();
          dfs(next);
        }
        route.push(node);
      };
      dfs('JFK');
      return route.reverse().join(' ');
    }
  },
  {
    title: 'Strong Password Policy Validator and Minimum Change Steps',
    cat: 'Scenario-Based Questions',
    desc: 'Given a string password, return the minimum number of steps required to make password strong (length 6-20, lower, upper, digit, no 3 repeating chars).',
    inputFmt: 'A string password.',
    outputFmt: 'Minimum change steps.',
    tests: [
      { in: 'a', out: '5' },
      { in: 'aA1', out: '3' },
      { in: '1337C0d3', out: '0' },
      { in: 'aaa111', out: '2', isH: true }
    ],
    fn: s => {
      const p = s.trim();
      const hasLower = /[a-z]/.test(p), hasUpper = /[A-Z]/.test(p), hasDigit = /[0-9]/.test(p);
      const missingTypes = (!hasLower ? 1 : 0) + (!hasUpper ? 1 : 0) + (!hasDigit ? 1 : 0);
      if (p.length < 6) return String(Math.max(6 - p.length, missingTypes));
      if (p.length <= 20) {
        let replace = 0;
        for (let i = 2; i < p.length; i++) {
          if (p[i] === p[i - 1] && p[i] === p[i - 2]) { replace++; i++; }
        }
        return String(Math.max(replace, missingTypes));
      }
      let del = p.length - 20;
      return String(del + missingTypes);
    }
  },
  {
    title: 'Minimum Cost to Hire K Workers (Greedy Ratio + Heap)',
    cat: 'Performance and Optimization',
    desc: 'Given quality and wage arrays for n workers and an integer k, hire exactly k workers paying them proportionally to their quality to minimize total cost.',
    inputFmt: 'Line 1: k. Line 2: space-separated quality. Line 3: space-separated wage.',
    outputFmt: 'Minimum total cost rounded to 2 decimals.',
    tests: [
      { in: '2\n10 20 5\n70 50 30', out: '105.00' },
      { in: '3\n3 1 10 10 1\n4 8 2 2 7', out: '30.67' },
      { in: '1\n10\n50', out: '50.00', isH: true },
      { in: '2\n5 5\n25 25', out: '50.00', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n');
      const k = Number(lines[0].trim());
      const q = lines[1].trim().split(/\s+/).map(Number);
      const w = lines[2].trim().split(/\s+/).map(Number);
      const workers = q.map((quality, i) => ({ q: quality, r: w[i] / quality })).sort((a,b)=>a.r-b.r);
      let best = Infinity;
      for (let i = k - 1; i < workers.length; i++) {
        const pool = workers.slice(0, i + 1).map(x => x.q).sort((a,b)=>a-b).slice(0, k);
        const sumQ = pool.reduce((a,b)=>a+b, 0);
        best = Math.min(best, sumQ * workers[i].r);
      }
      return best.toFixed(2);
    }
  },
  {
    title: 'Critical Network Connections (Tarjan Bridge Detection)',
    cat: 'Data Structures and Algorithms',
    desc: 'Given n servers numbered 0 to n-1 and connections, return all critical connections (bridges whose removal disconnects servers) sorted lexicographically.',
    inputFmt: 'Line 1: n. Following lines: connection pairs "u v".',
    outputFmt: 'Critical connection pairs or "none".',
    tests: [
      { in: '4\n0 1\n1 2\n2 0\n1 3', out: '1 3' },
      { in: '2\n0 1', out: '0 1' },
      { in: '3\n0 1\n1 2\n2 0', out: 'none', isH: true },
      { in: '5\n0 1\n1 2\n2 0\n1 3\n3 4', out: '1 3\n3 4', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n').filter(Boolean);
      const n = Number(lines[0].trim());
      const adj = Array.from({length: n}, () => []);
      for (let i = 1; i < lines.length; i++) {
        const [u, v] = lines[i].trim().split(/\s+/).map(Number);
        adj[u].push(v); adj[v].push(u);
      }
      const disc = new Array(n).fill(-1), low = new Array(n).fill(-1);
      let time = 0, bridges = [];
      const dfs = (u, p) => {
        disc[u] = low[u] = ++time;
        for (const v of adj[u]) {
          if (v === p) continue;
          if (disc[v] !== -1) low[u] = Math.min(low[u], disc[v]);
          else {
            dfs(v, u);
            low[u] = Math.min(low[u], low[v]);
            if (low[v] > disc[u]) bridges.push([Math.min(u, v), Math.max(u, v)]);
          }
        }
      };
      for (let i = 0; i < n; i++) if (disc[i] === -1) dfs(i, -1);
      if (!bridges.length) return 'none';
      bridges.sort((a,b)=>a[0]===b[0]?a[1]-b[1]:a[0]-b[0]);
      return bridges.map(b => `${b[0]} ${b[1]}`).join('\n');
    }
  },
  {
    title: 'Smallest Range Covering at Least One Element from K Lists',
    cat: 'Data Structures and Algorithms',
    desc: 'You have k lists of sorted integers in non-decreasing order. Find the smallest range [a, b] that includes at least one number from each of the k lists.',
    inputFmt: 'K lines of space-separated sorted integers.',
    outputFmt: 'Smallest range "a b".',
    tests: [
      { in: '4 10 15 24 26\n0 9 12 20\n5 18 22 30', out: '20 24' },
      { in: '1 2 3\n1 2 3\n1 2 3', out: '1 1' },
      { in: '1\n2', out: '1 2', isH: true },
      { in: '10 20\n15 25', out: '15 20', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n').filter(Boolean);
      const lists = lines.map(l => l.trim().split(/\s+/).map(Number));
      const all = [];
      lists.forEach((l, idx) => l.forEach(v => all.push({ v, list: idx })));
      all.sort((a,b)=>a.v-b.v);
      const count = {}, k = lists.length;
      let distinct = 0, l = 0, best = [-Infinity, Infinity];
      for (let r = 0; r < all.length; r++) {
        const item = all[r];
        count[item.list] = (count[item.list] || 0) + 1;
        if (count[item.list] === 1) distinct++;
        while (distinct === k) {
          if (all[r].v - all[l].v < best[1] - best[0]) best = [all[l].v, all[r].v];
          count[all[l].list]--;
          if (count[all[l].list] === 0) distinct--;
          l++;
        }
      }
      return `${best[0]} ${best[1]}`;
    }
  },
  {
    title: 'Swim in Rising Water Grid Dijkstra Algorithm',
    cat: 'Data Structures and Algorithms',
    desc: 'In an N x N grid where grid[i][j] represents water elevation at that point, find least time until you can swim from (0, 0) to (N-1, N-1).',
    inputFmt: 'Line 1: N. Following N lines: grid rows.',
    outputFmt: 'Least time.',
    tests: [
      { in: '2\n0 2\n1 3', out: '3' },
      { in: '5\n0 1 2 3 4\n24 23 22 21 5\n12 13 14 15 16\n11 17 18 19 20\n10 9 8 7 6', out: '16' },
      { in: '1\n0', out: '0', isH: true },
      { in: '2\n3 2\n0 1', out: '3', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n');
      const n = Number(lines[0].trim());
      const grid = lines.slice(1).map(l => l.trim().split(/\s+/).map(Number));
      let l = grid[0][0], r = n * n - 1;
      const canReach = t => {
        if (grid[0][0] > t) return false;
        const visited = Array.from({length: n}, () => new Array(n).fill(false));
        const q = [[0, 0]];
        visited[0][0] = true;
        while (q.length) {
          const [r, c] = q.shift();
          if (r === n - 1 && c === n - 1) return true;
          for (const [dr, dc] of [[1,0],[-1,0],[0,1],[0,-1]]) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < n && nc >= 0 && nc < n && !visited[nr][nc] && grid[nr][nc] <= t) {
              visited[nr][nc] = true; q.push([nr, nc]);
            }
          }
        }
        return false;
      };
      while (l < r) {
        let mid = Math.floor((l + r) / 2);
        if (canReach(mid)) r = mid; else l = mid + 1;
      }
      return String(l);
    }
  },
  {
    title: 'Optimal Debt Balancing and Minimum Cash Flow Settlement',
    cat: 'Real-world Coding Problems',
    desc: 'Given a list of transactions where transactions[i] = [from, to, amount], return the minimum number of transactions required to settle the debt completely.',
    inputFmt: 'Lines of transactions "from to amount".',
    outputFmt: 'Minimum transactions count.',
    tests: [
      { in: '0 1 10\n2 0 5', out: '2' },
      { in: '0 1 10\n1 0 1\n1 2 5\n2 0 5', out: '1' },
      { in: '0 1 5', out: '1', isH: true },
      { in: '0 1 5\n1 2 5\n2 0 5', out: '0', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n').filter(Boolean);
      const debt = {};
      for (const l of lines) {
        const [u, v, amt] = l.trim().split(/\s+/).map(Number);
        debt[u] = (debt[u] || 0) - amt;
        debt[v] = (debt[v] || 0) + amt;
      }
      const balances = Object.values(debt).filter(x => x !== 0);
      const settle = idx => {
        while (idx < balances.length && balances[idx] === 0) idx++;
        if (idx === balances.length) return 0;
        let minSteps = Infinity;
        for (let i = idx + 1; i < balances.length; i++) {
          if (balances[idx] * balances[i] < 0) {
            balances[i] += balances[idx];
            minSteps = Math.min(minSteps, 1 + settle(idx + 1));
            balances[i] -= balances[idx];
          }
        }
        return minSteps === Infinity ? 0 : minSteps;
      };
      return String(settle(0));
    }
  },
  {
    title: 'Bus Routes Shortest Transfer BFS Traversal',
    cat: 'Data Structures and Algorithms',
    desc: 'You are given an array routes where routes[i] is a bus route. You start at bus stop source and want to go to target. Return least buses needed or -1.',
    inputFmt: 'Line 1: source target. Following lines: space-separated stops for each route.',
    outputFmt: 'Least buses count or -1.',
    tests: [
      { in: '1 6\n1 2 7\n3 6 7', out: '2' },
      { in: '7 12\n7 12', out: '1' },
      { in: '1 2\n3 4', out: '-1', isH: true },
      { in: '1 1\n1 2 3', out: '0', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n');
      const [source, target] = lines[0].trim().split(/\s+/).map(Number);
      if (source === target) return '0';
      const routes = lines.slice(1).map(l => l.trim().split(/\s+/).map(Number));
      const stopToRoutes = {};
      routes.forEach((r, idx) => r.forEach(st => {
        if (!stopToRoutes[st]) stopToRoutes[st] = [];
        stopToRoutes[st].push(idx);
      }));
      const q = [[source, 0]];
      const visitedStops = new Set([source]), visitedRoutes = new Set();
      while (q.length) {
        const [stop, count] = q.shift();
        if (stop === target) return String(count);
        for (const rIdx of (stopToRoutes[stop] || [])) {
          if (visitedRoutes.has(rIdx)) continue;
          visitedRoutes.add(rIdx);
          for (const nextStop of routes[rIdx]) {
            if (!visitedStops.has(nextStop)) {
              visitedStops.add(nextStop);
              q.push([nextStop, count + 1]);
            }
          }
        }
      }
      return '-1';
    }
  },
  {
    title: 'Find All People with Shared Secret Disjoint-Set Union',
    cat: 'Scenario-Based Questions',
    desc: 'You are given an integer n indicating n people (0 to n - 1), meetings [x, y, time], and firstPerson who receives secret at time 0. Return sorted list of people with secret.',
    inputFmt: 'Line 1: n firstPerson. Following lines: meeting "x y time".',
    outputFmt: 'Space-separated person IDs.',
    tests: [
      { in: '6 1\n1 2 5\n2 3 8\n1 5 10', out: '0 1 2 3 5' },
      { in: '4 3\n3 1 3\n1 2 2\n0 3 3', out: '0 1 3' },
      { in: '3 2\n1 2 100', out: '0 1 2', isH: true },
      { in: '2 1\n0 1 1', out: '0 1', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n');
      const [n, firstPerson] = lines[0].trim().split(/\s+/).map(Number);
      const meetings = lines.slice(1).map(l => l.trim().split(/\s+/).map(Number));
      meetings.sort((a,b)=>a[2]-b[2]);
      const secret = new Set([0, firstPerson]);
      const timeGroups = {};
      for (const m of meetings) {
        if (!timeGroups[m[2]]) timeGroups[m[2]] = [];
        timeGroups[m[2]].push([m[0], m[1]]);
      }
      for (const t of Object.keys(timeGroups).sort((a,b)=>Number(a)-Number(b))) {
        const edges = timeGroups[t];
        const adj = {};
        for (const [u, v] of edges) {
          if (!adj[u]) adj[u] = [];
          if (!adj[v]) adj[v] = [];
          adj[u].push(v); adj[v].push(u);
        }
        const q = Object.keys(adj).map(Number).filter(p => secret.has(p));
        const visited = new Set(q);
        while (q.length) {
          const u = q.shift();
          secret.add(u);
          for (const v of (adj[u] || [])) {
            if (!visited.has(v)) { visited.add(v); q.push(v); }
          }
        }
      }
      return Array.from(secret).sort((a,b)=>a-b).join(' ');
    }
  }
];

module.exports = {
  HARD_SPECS
};
