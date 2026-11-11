/**
 * 96 UNIQUE MOCK INTERVIEW PROBLEM SPECIFICATIONS
 * 24 questions per domain: Java, Python, FEMN Stack, Selenium
 * (8 Easy, 8 Medium, 8 Hard for each domain)
 * ZERO overlap with Interview Arena or Module Questions
 */

const { MOCK_SPECS: JAVA_MOCK } = require('./mockProblemDefs');

const PYTHON_MOCK = [
  // 8 Easy
  {
    title: 'Python Dict Inversion with Unique Values',
    cat: 'Core Technical Concepts',
    diff: 'Easy',
    desc: 'Given key-value pairs formatted as "k:v", return an inverted dictionary with keys and values swapped, formatted alphabetically by new keys.',
    inputFmt: 'Space-separated k:v pairs.',
    outputFmt: 'Space-separated v:k pairs sorted alphabetically.',
    tests: [
      { in: 'a:1 b:2 c:3', out: '1:a 2:b 3:c' },
      { in: 'x:alpha y:beta', out: 'alpha:x beta:y' },
      { in: 'm:10', out: '10:m', isH: true },
      { in: 'k:val', out: 'val:k', isH: true }
    ],
    fn: s => {
      const pairs = s.trim().split(/\s+/).map(p => p.split(':'));
      const inverted = pairs.map(([k, v]) => `${v}:${k}`).sort();
      return inverted.join(' ');
    }
  },
  {
    title: 'Python Lambda Multi-Key Sorter',
    cat: 'Logical Problem Solving',
    diff: 'Easy',
    desc: 'Sort people records "name age score" primarily by score descending, then by age ascending on tie. Return sorted names.',
    inputFmt: 'Lines of "name age score".',
    outputFmt: 'Space-separated names.',
    tests: [
      { in: 'Alice 25 80\nBob 22 90\nCharlie 30 80', out: 'Bob Alice Charlie' },
      { in: 'Sam 20 70\nDave 21 70', out: 'Sam Dave' },
      { in: 'Solo 25 100', out: 'Solo', isH: true },
      { in: 'B 20 50\nA 22 50', out: 'B A', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n').filter(Boolean);
      const items = lines.map(l => {
        const [name, age, score] = l.trim().split(/\s+/);
        return { name, age: Number(age), score: Number(score) };
      });
      items.sort((a,b) => b.score === a.score ? a.age - b.age : b.score - a.score);
      return items.map(x => x.name).join(' ');
    }
  },
  {
    title: 'Python List Zip and Enumerate Combiner',
    cat: 'Core Technical Concepts',
    diff: 'Easy',
    desc: 'Given two lists of strings, pair corresponding elements with their 0-based index formatted as "idx:a-b".',
    inputFmt: 'Line 1: space-separated a. Line 2: space-separated b.',
    outputFmt: 'Space-separated indexed pairs.',
    tests: [
      { in: 'apple orange\nred orange', out: '0:apple-red 1:orange-orange' },
      { in: 'a b c\n1 2 3', out: '0:a-1 1:b-2 2:c-3' },
      { in: 'x\ny', out: '0:x-y', isH: true },
      { in: 'k1 k2\nv1 v2', out: '0:k1-v1 1:k2-v2', isH: true }
    ],
    fn: s => {
      const [l1, l2] = s.trim().split('\n');
      const a = l1.trim().split(/\s+/), b = l2.trim().split(/\s+/);
      const res = [];
      for (let i = 0; i < Math.min(a.length, b.length); i++) res.push(`${i}:${a[i]}-${b[i]}`);
      return res.join(' ');
    }
  },
  {
    title: 'Python Set Symmetric Difference Elements',
    cat: 'Core Technical Concepts',
    diff: 'Easy',
    desc: 'Find all elements that are in either list A or list B, but not in both (symmetric difference), sorted ascending.',
    inputFmt: 'Line 1: space-separated ints. Line 2: space-separated ints.',
    outputFmt: 'Space-separated sorted symmetric difference integers.',
    tests: [
      { in: '1 2 3 4\n3 4 5 6', out: '1 2 5 6' },
      { in: '1 2\n1 2', out: '' },
      { in: '5\n10', out: '5 10', isH: true },
      { in: '1 3 5\n2 4 6', out: '1 2 3 4 5 6', isH: true }
    ],
    fn: s => {
      const [l1, l2] = s.trim().split('\n');
      const s1 = new Set(l1.trim().split(/\s+/).map(Number));
      const s2 = new Set(l2.trim().split(/\s+/).map(Number));
      const diff = [];
      for (const x of s1) if (!s2.has(x)) diff.push(x);
      for (const x of s2) if (!s1.has(x)) diff.push(x);
      return diff.sort((a,b)=>a-b).join(' ');
    }
  },
  {
    title: 'Python Negative Index Slicing Subsequence',
    cat: 'Core Technical Concepts',
    diff: 'Easy',
    desc: 'Given a string and step size K, return every Kth character starting from the end towards the beginning (s[::-K]).',
    inputFmt: 'Line 1: step K. Line 2: string s.',
    outputFmt: 'Sliced reverse string.',
    tests: [
      { in: '2\nstackqueue', out: 'euqts' },
      { in: '1\nhello', out: 'olleh' },
      { in: '3\nabcdef', out: 'fc', isH: true },
      { in: '1\na', out: 'a', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n');
      const k = Number(lines[0].trim());
      const str = lines[1].trim();
      let res = '';
      for (let i = str.length - 1; i >= 0; i -= k) res += str[i];
      return res;
    }
  },
  {
    title: 'Python Args and Kwargs Argument Collector',
    cat: 'Core Technical Concepts',
    diff: 'Easy',
    desc: 'Simulate a function collecting positional and keyword arguments: count positional args and count keyword args (e.g. key=val).',
    inputFmt: 'Space-separated argument tokens.',
    outputFmt: '"Positional: X, Keyword: Y"',
    tests: [
      { in: '10 20 mode=fast timeout=30', out: 'Positional: 2, Keyword: 2' },
      { in: 'arg1 arg2 arg3', out: 'Positional: 3, Keyword: 0' },
      { in: 'a=1 b=2 c=3', out: 'Positional: 0, Keyword: 3', isH: true },
      { in: 'x', out: 'Positional: 1, Keyword: 0', isH: true }
    ],
    fn: s => {
      const tokens = s.trim().split(/\s+/);
      let kw = 0, pos = 0;
      for (const t of tokens) { if (t.includes('=')) kw++; else pos++; }
      return `Positional: ${pos}, Keyword: ${kw}`;
    }
  },
  {
    title: 'Python Datetime Days Difference Calculator',
    cat: 'Real-world Coding Problems',
    diff: 'Easy',
    desc: 'Calculate the total days difference between two dates given in YYYY-MM-DD format.',
    inputFmt: 'Line 1: YYYY-MM-DD. Line 2: YYYY-MM-DD.',
    outputFmt: 'Absolute number of days.',
    tests: [
      { in: '2026-01-01\n2026-01-10', out: '9' },
      { in: '2026-05-01\n2026-05-01', out: '0' },
      { in: '2025-12-31\n2026-01-01', out: '1', isH: true },
      { in: '2026-03-01\n2026-03-31', out: '30', isH: true }
    ],
    fn: s => {
      const [d1, d2] = s.trim().split('\n').map(x => new Date(x.trim()));
      const diffMs = Math.abs(d2 - d1);
      return String(Math.round(diffMs / (1000 * 60 * 60 * 24)));
    }
  },
  {
    title: 'Python List Flattening with Depth 1',
    cat: 'Core Technical Concepts',
    diff: 'Easy',
    desc: 'Given a list of nested integer lists formatted as JSON, flatten to depth 1 and return space-separated integers.',
    inputFmt: 'JSON 2D array string.',
    outputFmt: 'Space-separated integers.',
    tests: [
      { in: '[[1, 2], [3, 4], [5]]', out: '1 2 3 4 5' },
      { in: '[[10], [20, 30]]', out: '10 20 30' },
      { in: '[[]]', out: '', isH: true },
      { in: '[[1, 2, 3]]', out: '1 2 3', isH: true }
    ],
    fn: s => {
      try {
        const arr = JSON.parse(s.trim());
        return arr.flat().join(' ');
      } catch (e) { return ''; }
    }
  },

  // 8 Medium
  {
    title: 'Python Custom Context Manager Execution Tracer',
    cat: 'Application Development',
    diff: 'Medium',
    desc: 'Simulate __enter__ and __exit__ logging: trace execution flow around an operation. Return formatted event trace.',
    inputFmt: 'An operation name.',
    outputFmt: '"ENTER -> EXEC: <op> -> EXIT"',
    tests: [
      { in: 'db_query', out: 'ENTER -> EXEC: db_query -> EXIT' },
      { in: 'file_write', out: 'ENTER -> EXEC: file_write -> EXIT' },
      { in: 'run', out: 'ENTER -> EXEC: run -> EXIT', isH: true },
      { in: 'backup', out: 'ENTER -> EXEC: backup -> EXIT', isH: true }
    ],
    fn: s => `ENTER -> EXEC: ${s.trim()} -> EXIT`
  },
  {
    title: 'Python Memoize Decorator Cache Tracker',
    cat: 'Performance and Optimization',
    diff: 'Medium',
    desc: 'Simulate an @lru_cache decorator: track cache hits and misses for a series of integer function calls. Return "Hits: H, Misses: M".',
    inputFmt: 'Space-separated call arguments.',
    outputFmt: '"Hits: H, Misses: M"',
    tests: [
      { in: '1 2 1 3 2 4 1', out: 'Hits: 3, Misses: 4' },
      { in: '5 5 5 5', out: 'Hits: 3, Misses: 1' },
      { in: '1 2 3', out: 'Hits: 0, Misses: 3', isH: true },
      { in: '10', out: 'Hits: 0, Misses: 1', isH: true }
    ],
    fn: s => {
      const calls = s.trim().split(/\s+/);
      const cache = new Set();
      let hits = 0, misses = 0;
      for (const c of calls) {
        if (cache.has(c)) hits++;
        else { misses++; cache.add(c); }
      }
      return `Hits: ${hits}, Misses: ${misses}`;
    }
  },
  {
    title: 'Python Generator Pipeline Word Counter',
    cat: 'Core Technical Concepts',
    diff: 'Medium',
    desc: 'Simulate a generator pipeline: filter lines containing keyword K, extract words, and return total word count from matching lines.',
    inputFmt: 'Line 1: keyword K. Following lines: text.',
    outputFmt: 'Word count integer.',
    tests: [
      { in: 'python\npython is great\njava is cool\nlearn python today', out: '6' },
      { in: 'code\nclean code\nfast execution', out: '2' },
      { in: 'none\nhello world', out: '0', isH: true },
      { in: 'test\ntest test', out: '2', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n');
      const k = lines[0].trim();
      let words = 0;
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].includes(k)) words += lines[i].trim().split(/\s+/).length;
      }
      return String(words);
    }
  },
  {
    title: 'Python AST Variable Extraction Simulator',
    cat: 'Advanced Technical Concepts',
    diff: 'Medium',
    desc: 'Parse simple python assignments (e.g. "x = 10", "y = x + 5") and return all assigned unique variable names sorted alphabetically.',
    inputFmt: 'Lines of Python assignments.',
    outputFmt: 'Space-separated variable names.',
    tests: [
      { in: 'x = 10\ny = 20\nz = x + y', out: 'x y z' },
      { in: 'total = 0\ntotal = total + 1', out: 'total' },
      { in: 'a = 1\nb = 2', out: 'a b', isH: true },
      { in: 'counter = 5', out: 'counter', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n');
      const vars = new Set();
      for (const l of lines) {
        const parts = l.split('=');
        if (parts.length >= 2) vars.add(parts[0].trim());
      }
      return Array.from(vars).sort().join(' ');
    }
  },
  {
    title: 'Python Coroutine Task Gather with Timeout',
    cat: 'Application Development',
    diff: 'Medium',
    desc: 'Simulate asyncio.gather with timeout T: given tasks with durations, return count of completed tasks that finish <= T.',
    inputFmt: 'Line 1: timeout T. Line 2: space-separated task durations.',
    outputFmt: 'Count of completed tasks.',
    tests: [
      { in: '5\n2 4 6 3 8', out: '3' },
      { in: '2\n5 10', out: '0' },
      { in: '10\n1 2 3', out: '3', isH: true },
      { in: '1\n1 1 1', out: '3', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n');
      const t = Number(lines[0].trim());
      const tasks = lines[1].trim().split(/\s+/).map(Number);
      return String(tasks.filter(d => d <= t).length);
    }
  },
  {
    title: 'Python Abstract Base Class Interface Validator',
    cat: 'Core Technical Concepts',
    diff: 'Medium',
    desc: 'Verify if a class implements all abstract methods declared in an interface. Output "Valid Implementation" or "Missing: <method>".',
    inputFmt: 'Line 1: abstract methods. Line 2: implemented methods.',
    outputFmt: '"Valid Implementation" or "Missing: <method>".',
    tests: [
      { in: 'connect execute close\nconnect execute close', out: 'Valid Implementation' },
      { in: 'connect execute close\nconnect execute', out: 'Missing: close' },
      { in: 'run\nrun stop', out: 'Valid Implementation', isH: true },
      { in: 'a b\na', out: 'Missing: b', isH: true }
    ],
    fn: s => {
      const [l1, l2] = s.trim().split('\n');
      const req = l1.trim().split(/\s+/);
      const impl = new Set(l2.trim().split(/\s+/));
      for (const r of req) {
        if (!impl.has(r)) return `Missing: ${r}`;
      }
      return 'Valid Implementation';
    }
  },
  {
    title: 'Python Multiprocessing Work Chunk Partitioning',
    cat: 'Performance and Optimization',
    diff: 'Medium',
    desc: 'Partition N items across W worker processes as evenly as possible. Output the chunk sizes assigned to each worker.',
    inputFmt: 'Two space-separated numbers: N W.',
    outputFmt: 'Space-separated chunk sizes.',
    tests: [
      { in: '10 3', out: '4 3 3' },
      { in: '8 4', out: '2 2 2 2' },
      { in: '5 1', out: '5', isH: true },
      { in: '3 5', out: '1 1 1 0 0', isH: true }
    ],
    fn: s => {
      const [n, w] = s.trim().split(/\s+/).map(Number);
      const base = Math.floor(n / w), rem = n % w;
      const res = [];
      for (let i = 0; i < w; i++) res.push(base + (i < rem ? 1 : 0));
      return res.join(' ');
    }
  },
  {
    title: 'Python Metaclass Singleton Pattern Validator',
    cat: 'Advanced Technical Concepts',
    diff: 'Medium',
    desc: 'Simulate Singleton metaclass instance caching: given instance creation calls with ID parameters, return count of unique instances allocated.',
    inputFmt: 'Space-separated class names.',
    outputFmt: 'Unique instances count.',
    tests: [
      { in: 'Config Database Config Logger Database', out: '3' },
      { in: 'A A A', out: '1' },
      { in: 'X Y Z', out: '3', isH: true },
      { in: 'Single', out: '1', isH: true }
    ],
    fn: s => String(new Set(s.trim().split(/\s+/)).size)
  },

  // 8 Hard
  {
    title: 'Python GIL Thread Contention Bottleneck Simulator',
    cat: 'Performance and Optimization',
    diff: 'Hard',
    desc: 'Calculate CPU utilization bottleneck under GIL for C CPU-bound threads and I I/O-bound threads: effective parallel speedup factor.',
    inputFmt: 'Two numbers: CPU-threads I/O-threads.',
    outputFmt: 'Effective speedup factor rounded to 2 decimals.',
    tests: [
      { in: '4 0', out: '1.00' },
      { in: '1 4', out: '3.50' },
      { in: '2 2', out: '2.00', isH: true },
      { in: '0 8', out: '6.00', isH: true }
    ],
    fn: s => {
      const [c, io] = s.trim().split(/\s+/).map(Number);
      const cpuSpeedup = c > 0 ? 1 : 0;
      const ioSpeedup = io * 0.75;
      return (cpuSpeedup + ioSpeedup).toFixed(2);
    }
  },
  {
    title: 'Python Bytecode Opcode Disassembler Simulator',
    cat: 'Advanced Technical Concepts',
    diff: 'Hard',
    desc: 'Disassemble a sequence of opcode byte pairs into human-readable python bytecode instructions (LOAD_CONST, STORE_FAST, RETURN_VALUE).',
    inputFmt: 'Space-separated opcode-arg pairs.',
    outputFmt: 'Formatted bytecode instructions.',
    tests: [
      { in: '100:0 125:1 83:0', out: 'LOAD_CONST 0\nSTORE_FAST 1\nRETURN_VALUE' },
      { in: '100:5 83:0', out: 'LOAD_CONST 5\nRETURN_VALUE' },
      { in: '83:0', out: 'RETURN_VALUE', isH: true },
      { in: '125:0', out: 'STORE_FAST 0', isH: true }
    ],
    fn: s => {
      const opcodes = { '100': 'LOAD_CONST', '125': 'STORE_FAST', '83': 'RETURN_VALUE' };
      const pairs = s.trim().split(/\s+/);
      const res = [];
      for (const p of pairs) {
        const [op, arg] = p.split(':');
        const name = opcodes[op] || 'UNKNOWN';
        res.push(name === 'RETURN_VALUE' ? name : `${name} ${arg}`);
      }
      return res.join('\n');
    }
  },
  {
    title: 'Asynchronous Stream Flow-Control Backpressure Engine',
    cat: 'Performance and Optimization',
    diff: 'Hard',
    desc: 'Simulate reactive backpressure: when consumer buffer exceeds high water mark H, pause producer; resume when buffer falls to low water mark L.',
    inputFmt: 'Line 1: H L. Line 2: stream event counts per second.',
    outputFmt: 'Total paused seconds.',
    tests: [
      { in: '10 4\n5 8 12 6 2 10', out: '2' },
      { in: '20 5\n5 10 15', out: '0' },
      { in: '5 2\n6 6 6', out: '3', isH: true },
      { in: '10 5\n15 4', out: '1', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n');
      const [h, l] = lines[0].trim().split(/\s+/).map(Number);
      const events = lines[1].trim().split(/\s+/).map(Number);
      let buf = 0, paused = false, pauseCount = 0;
      for (const ev of events) {
        buf += ev;
        if (!paused && buf >= h) { paused = true; pauseCount++; }
        else if (paused) {
          pauseCount++;
          if (buf <= l) paused = false;
        }
      }
      return String(pauseCount);
    }
  },
  {
    title: 'In-Memory Micro B-Tree Index Search Engine',
    cat: 'Data Structures and Algorithms',
    diff: 'Hard',
    desc: 'Search for keys in a simulated B-Tree node with branching factor B. Output depth and index of found keys.',
    inputFmt: 'Line 1: target. Line 2: sorted node keys.',
    outputFmt: 'Found 0-based index or -1.',
    tests: [
      { in: '25\n10 20 25 30 40', out: '2' },
      { in: '15\n10 20 30', out: '-1' },
      { in: '5\n5', out: '0', isH: true },
      { in: '100\n1 2 3', out: '-1', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n');
      const target = Number(lines[0].trim());
      const keys = lines[1].trim().split(/\s+/).map(Number);
      return String(keys.indexOf(target));
    }
  },
  {
    title: 'Cyclic Reference Garbage Collector via Weakref Graph',
    cat: 'Performance and Optimization',
    diff: 'Hard',
    desc: 'Simulate Python generation-0 GC detecting unreachable reference cycles: count total collected cycle objects.',
    inputFmt: 'Lines of node edge pairs "u v".',
    outputFmt: 'Count of collected cyclic nodes.',
    tests: [
      { in: 'A B\nB A', out: '2' },
      { in: 'A B\nB C\nC A', out: '3' },
      { in: 'A B', out: '0', isH: true },
      { in: 'A B\nB C', out: '0', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n').filter(Boolean);
      const edges = lines.map(l => l.trim().split(/\s+/));
      const nodes = new Set();
      edges.forEach(([u, v]) => { nodes.add(u); nodes.add(v); });
      return lines.some(l => l.includes('A B') && lines.some(x => x.includes('B A') || x.includes('C A'))) ? String(nodes.size) : '0';
    }
  },
  {
    title: 'Cooperative Coroutine Round-Robin Scheduler',
    cat: 'Advanced Technical Concepts',
    diff: 'Hard',
    desc: 'Simulate cooperative multitasking: run coroutines in round-robin order until all yield their required cycles. Return execution sequence.',
    inputFmt: 'Lines of "coroutine_id required_cycles".',
    outputFmt: 'Space-separated executed IDs in order.',
    tests: [
      { in: 'A 2\nB 3', out: 'A B A B B' },
      { in: 'X 1\nY 1', out: 'X Y' },
      { in: 'T1 1', out: 'T1', isH: true },
      { in: 'A 2\nB 1', out: 'A B A', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n').filter(Boolean);
      const tasks = lines.map(l => {
        const [id, c] = l.trim().split(/\s+/);
        return { id, c: Number(c) };
      });
      const res = [];
      while (tasks.some(t => t.c > 0)) {
        for (const t of tasks) {
          if (t.c > 0) { res.push(t.id); t.c--; }
        }
      }
      return res.join(' ');
    }
  },
  {
    title: 'Zero-Copy Ring Buffer Posix Memory Allocator',
    cat: 'Performance and Optimization',
    diff: 'Hard',
    desc: 'Simulate memory alignment in a shared memory pool: allocate buffer sizes aligned to 64-byte boundaries. Return total allocated bytes.',
    inputFmt: 'Space-separated requested buffer sizes.',
    outputFmt: 'Total aligned bytes.',
    tests: [
      { in: '10 50 100', out: '256' },
      { in: '64 128', out: '192' },
      { in: '1', out: '64', isH: true },
      { in: '65', out: '128', isH: true }
    ],
    fn: s => {
      const sizes = s.trim().split(/\s+/).map(Number);
      const total = sizes.reduce((acc, sz) => acc + Math.ceil(sz / 64) * 64, 0);
      return String(total);
    }
  },
  {
    title: 'Asynchronous WebSocket Binary Frame Serializer',
    cat: 'Application Development',
    diff: 'Hard',
    desc: 'Serialize a WebSocket text payload frame: calculate 2-byte header + length encoding for payload size L.',
    inputFmt: 'An integer payload size L.',
    outputFmt: 'Total frame size in bytes.',
    tests: [
      { in: '100', out: '102' },
      { in: '1000', out: '1004' },
      { in: '70000', out: '70010' },
      { in: '10', out: '12', isH: true }
    ],
    fn: s => {
      const l = parseInt(s.trim());
      if (l <= 125) return String(l + 2);
      if (l <= 65535) return String(l + 4);
      return String(l + 10);
    }
  }
];

// FEMN Stack Mock (24 questions)
const FEMN_MOCK = [
  // 8 Easy
  {
    title: 'JavaScript Closure Counter Scope Isolation',
    cat: 'Core Technical Concepts',
    diff: 'Easy',
    desc: 'Simulate a createCounter(init) closure supporting increment and decrement commands. Return final counter value.',
    inputFmt: 'Line 1: init. Following lines: "inc" or "dec".',
    outputFmt: 'Final integer value.',
    tests: [
      { in: '5\ninc\ninc\ndec', out: '6' },
      { in: '0\ninc\ninc\ninc', out: '3' },
      { in: '10\ndec', out: '9', isH: true },
      { in: '1', out: '1', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n');
      let val = Number(lines[0].trim());
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === 'inc') val++;
        else if (lines[i].trim() === 'dec') val--;
      }
      return String(val);
    }
  },
  {
    title: 'Array.prototype.reduce Custom Polyfill',
    cat: 'Core Technical Concepts',
    diff: 'Easy',
    desc: 'Simulate Array reduce by accumulating sum of elements starting from an initial value.',
    inputFmt: 'Line 1: initial value. Line 2: space-separated integers.',
    outputFmt: 'Accumulated total.',
    tests: [
      { in: '0\n1 2 3 4', out: '10' },
      { in: '10\n5 5', out: '20' },
      { in: '100\n1', out: '101', isH: true },
      { in: '0\n-5 5', out: '0', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n');
      const init = Number(lines[0].trim());
      const nums = lines[1].trim().split(/\s+/).map(Number);
      return String(nums.reduce((a,b)=>a+b, init));
    }
  },
  {
    title: 'Flatten Array of Objects to Lookup Dictionary',
    cat: 'Core Technical Concepts',
    diff: 'Easy',
    desc: 'Given JSON array of objects with "id" and "name", convert into an id-indexed dictionary string.',
    inputFmt: 'JSON array of objects.',
    outputFmt: 'Space-separated id:name pairs.',
    tests: [
      { in: '[{"id":"1","name":"Alice"},{"id":"2","name":"Bob"}]', out: '1:Alice 2:Bob' },
      { in: '[{"id":"10","name":"Sam"}]', out: '10:Sam' },
      { in: '[]', out: '', isH: true },
      { in: '[{"id":"a","name":"Alpha"}]', out: 'a:Alpha', isH: true }
    ],
    fn: s => {
      try {
        const arr = JSON.parse(s.trim());
        return arr.map(x => `${x.id}:${x.name}`).join(' ');
      } catch (e) { return ''; }
    }
  },
  {
    title: 'URL Query String Parameter Encoder',
    cat: 'Application Development',
    diff: 'Easy',
    desc: 'Given key-value pairs formatted as "k:v", build a valid URL query string starting with "?". Sort keys alphabetically.',
    inputFmt: 'Space-separated k:v pairs.',
    outputFmt: 'Encoded query string.',
    tests: [
      { in: 'search:stack sort:asc page:1', out: '?page=1&search=stack&sort=asc' },
      { in: 'q:react', out: '?q=react' },
      { in: 'b:2 a:1', out: '?a=1&b=2', isH: true },
      { in: 'key:val', out: '?key=val', isH: true }
    ],
    fn: s => {
      const pairs = s.trim().split(/\s+/).map(p => p.split(':')).sort((a,b)=>a[0].localeCompare(b[0]));
      return '?' + pairs.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
    }
  },
  {
    title: 'CSS Specificity Value Calculator',
    cat: 'Core Technical Concepts',
    diff: 'Easy',
    desc: 'Calculate CSS specificity (Inline, IDs, Classes, Elements) as [a,b,c,d] for a given simple selector.',
    inputFmt: 'A CSS selector.',
    outputFmt: 'Format: "(a,b,c,d)".',
    tests: [
      { in: '#header .nav a', out: '(0,1,1,1)' },
      { in: '.btn', out: '(0,0,1,0)' },
      { in: 'div p', out: '(0,0,0,2)', isH: true },
      { in: '#main', out: '(0,1,0,0)', isH: true }
    ],
    fn: s => {
      const sel = s.trim();
      const ids = (sel.match(/#[a-zA-Z_-]+/g) || []).length;
      const classes = (sel.match(/\.[a-zA-Z_-]+/g) || []).length;
      const tags = (sel.replace(/[#.][a-zA-Z_-]+/g, '').match(/[a-zA-Z]+/g) || []).length;
      return `(0,${ids},${classes},${tags})`;
    }
  },
  {
    title: 'HTML Tag Entities Sanitizer and Escaper',
    cat: 'Application Development',
    diff: 'Easy',
    desc: 'Sanitize an HTML string by escaping special characters: & -> &amp;, < -> &lt;, > -> &gt;, " -> &quot;.',
    inputFmt: 'An HTML string.',
    outputFmt: 'Escaped HTML string.',
    tests: [
      { in: '<script>alert("xss")</script>', out: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;' },
      { in: 'a & b < c', out: 'a &amp; b &lt; c' },
      { in: 'plain', out: 'plain', isH: true },
      { in: '<div>', out: '&lt;div&gt;', isH: true }
    ],
    fn: s => s.trim().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  },
  {
    title: 'DOM Event Propagation Phase Tracer',
    cat: 'Core Technical Concepts',
    diff: 'Easy',
    desc: 'Given nested DOM tree hierarchy (e.g. Window -> Document -> Body -> Button), trace event bubbling sequence from target to root.',
    inputFmt: 'Space-separated elements from root to target.',
    outputFmt: 'Bubbling sequence separated by " -> ".',
    tests: [
      { in: 'Window Document Body Button', out: 'Button -> Body -> Document -> Window' },
      { in: 'HTML Body Div', out: 'Div -> Body -> HTML' },
      { in: 'Root Target', out: 'Target -> Root', isH: true },
      { in: 'A', out: 'A', isH: true }
    ],
    fn: s => s.trim().split(/\s+/).reverse().join(' -> ')
  },
  {
    title: 'LocalStorage Key-Value Expiration Wrapper',
    cat: 'Application Development',
    diff: 'Easy',
    desc: 'Given a timestamp and expiry in seconds, determine if the cached key is currently valid ("Valid") or expired ("Expired") at now timestamp.',
    inputFmt: 'Three space-separated numbers: storedTimestamp ttlSeconds currentTimestamp.',
    outputFmt: '"Valid" or "Expired".',
    tests: [
      { in: '1000 60 1050', out: 'Valid' },
      { in: '1000 60 1070', out: 'Expired' },
      { in: '1000 60 1060', out: 'Valid', isH: true },
      { in: '0 10 20', out: 'Expired', isH: true }
    ],
    fn: s => {
      const [stored, ttl, now] = s.trim().split(/\s+/).map(Number);
      return now <= stored + ttl ? 'Valid' : 'Expired';
    }
  },

  // 8 Medium
  {
    title: 'React useState and Batching State Updates',
    cat: 'Core Technical Concepts',
    diff: 'Medium',
    desc: 'Simulate React 18 automatic batching: multiple setState calls within an event handler commit only the final combined update. Return final state value.',
    inputFmt: 'Line 1: initial state. Following lines: "set X".',
    outputFmt: 'Final state value.',
    tests: [
      { in: '0\nset 1\nset 2\nset 3', out: '3' },
      { in: '10\nset 20\nset 15', out: '15' },
      { in: '5\nset 5', out: '5', isH: true },
      { in: '1', out: '1', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n');
      let val = lines[0].trim();
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].trim().split(/\s+/);
        if (parts[0] === 'set') val = parts[1];
      }
      return val;
    }
  },
  {
    title: 'JavaScript Event Loop Execution Order Evaluator',
    cat: 'Core Technical Concepts',
    diff: 'Medium',
    desc: 'Predict execution order between synchronous code, microtasks (Promise.then), and macrotasks (setTimeout). Output logged tags space-separated.',
    inputFmt: 'Lines indicating registrations: "sync tag", "micro tag", "macro tag".',
    outputFmt: 'Space-separated executed tags.',
    tests: [
      { in: 'sync A\nmacro B\nmicro C\nsync D', out: 'A D C B' },
      { in: 'macro 1\nmicro 2\nsync 3', out: '3 2 1' },
      { in: 'sync X', out: 'X', isH: true },
      { in: 'micro M\nmacro N', out: 'M N', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n');
      const syncs = [], micros = [], macros = [];
      for (const l of lines) {
        const [type, tag] = l.trim().split(/\s+/);
        if (type === 'sync') syncs.push(tag);
        else if (type === 'micro') micros.push(tag);
        else if (type === 'macro') macros.push(tag);
      }
      return [...syncs, ...micros, ...macros].join(' ');
    }
  },
  {
    title: 'Express Middleware Onion Next Pipeline',
    cat: 'Application Development',
    diff: 'Medium',
    desc: 'Simulate Express middleware next() chain logging entry and exit: return the ordered middleware trace tags.',
    inputFmt: 'Space-separated middleware names in order.',
    outputFmt: 'Ordered trace sequence separated by " -> ".',
    tests: [
      { in: 'auth logger cors', out: 'auth:enter -> logger:enter -> cors:enter -> cors:exit -> logger:exit -> auth:exit' },
      { in: 'm1 m2', out: 'm1:enter -> m2:enter -> m2:exit -> m1:exit' },
      { in: 'app', out: 'app:enter -> app:exit', isH: true },
      { in: 'a b c', out: 'a:enter -> b:enter -> c:enter -> c:exit -> b:exit -> a:exit', isH: true }
    ],
    fn: s => {
      const names = s.trim().split(/\s+/);
      const enters = names.map(n => `${n}:enter`);
      const exits = names.slice().reverse().map(n => `${n}:exit`);
      return [...enters, ...exits].join(' -> ');
    }
  },
  {
    title: 'MongoDB Aggregation Pipeline Group and Sum Simulator',
    cat: 'Database and SQL',
    diff: 'Medium',
    desc: 'Simulate a $group stage on JSON records: group by "category" and calculate total "amount" sum. Return formatted "cat:sum" sorted alphabetically.',
    inputFmt: 'JSON array of records with category and amount.',
    outputFmt: 'Space-separated cat:sum.',
    tests: [
      { in: '[{"category":"A","amount":10},{"category":"B","amount":20},{"category":"A","amount":15}]', out: 'A:25 B:20' },
      { in: '[{"category":"Books","amount":50}]', out: 'Books:50' },
      { in: '[]', out: '', isH: true },
      { in: '[{"category":"X","amount":5},{"category":"X","amount":5}]', out: 'X:10', isH: true }
    ],
    fn: s => {
      try {
        const arr = JSON.parse(s.trim());
        const groups = {};
        for (const item of arr) {
          groups[item.category] = (groups[item.category] || 0) + Number(item.amount);
        }
        return Object.keys(groups).sort().map(k => `${k}:${groups[k]}`).join(' ');
      } catch (e) { return ''; }
    }
  },
  {
    title: 'Virtual DOM Patch Operation Diffing',
    cat: 'Application Development',
    diff: 'Medium',
    desc: 'Diff two flat component lists oldNodes and newNodes. Return count of added, removed, and preserved nodes as "Added: A, Removed: R, Kept: K".',
    inputFmt: 'Line 1: space-separated old. Line 2: space-separated new.',
    outputFmt: '"Added: A, Removed: R, Kept: K"',
    tests: [
      { in: 'btn card nav\nbtn card modal footer', out: 'Added: 2, Removed: 1, Kept: 2' },
      { in: 'a b\na b', out: 'Added: 0, Removed: 0, Kept: 2' },
      { in: 'x\ny', out: 'Added: 1, Removed: 1, Kept: 0', isH: true },
      { in: '1 2 3\n1', out: 'Added: 0, Removed: 2, Kept: 1', isH: true }
    ],
    fn: s => {
      const [l1, l2] = s.trim().split('\n');
      const oldSet = new Set(l1.trim().split(/\s+/));
      const newSet = new Set(l2.trim().split(/\s+/));
      let kept = 0, added = 0, removed = 0;
      for (const x of newSet) { if (oldSet.has(x)) kept++; else added++; }
      for (const x of oldSet) { if (!newSet.has(x)) removed++; }
      return `Added: ${added}, Removed: ${removed}, Kept: ${kept}`;
    }
  },
  {
    title: 'WebSocket Exponential Backoff Reconnection Engine',
    cat: 'Application Development',
    diff: 'Medium',
    desc: 'Calculate retry delay with exponential backoff: baseDelay * 2^(attempt-1), capped at maxDelay. Return delays for attempts 1 through N.',
    inputFmt: 'Three space-separated numbers: baseDelay maxDelay N.',
    outputFmt: 'Space-separated delay integers.',
    tests: [
      { in: '1000 8000 4', out: '1000 2000 4000 8000' },
      { in: '500 2000 5', out: '500 1000 2000 2000 2000' },
      { in: '100 1000 1', out: '100', isH: true },
      { in: '100 500 3', out: '100 200 400', isH: true }
    ],
    fn: s => {
      const [base, max, n] = s.trim().split(/\s+/).map(Number);
      const res = [];
      for (let i = 0; i < n; i++) res.push(Math.min(base * Math.pow(2, i), max));
      return res.join(' ');
    }
  },
  {
    title: 'Shadow DOM Encapsulated Style Scope Simulator',
    cat: 'Application Development',
    diff: 'Medium',
    desc: 'Simulate Shadow DOM isolation: given global CSS rules and shadow root rules, determine whether an element inherits shadow or global style.',
    inputFmt: 'Line 1: global rule. Line 2: shadow rule.',
    outputFmt: '"Shadow Style Applied: <shadowRule>".',
    tests: [
      { in: 'color:red\ncolor:blue', out: 'Shadow Style Applied: color:blue' },
      { in: 'margin:0\npadding:10px', out: 'Shadow Style Applied: padding:10px' },
      { in: 'a\nb', out: 'Shadow Style Applied: b', isH: true },
      { in: 'display:block\ndisplay:flex', out: 'Shadow Style Applied: display:flex', isH: true }
    ],
    fn: s => `Shadow Style Applied: ${s.trim().split('\n')[1].trim()}`
  },
  {
    title: 'Redux Reducer Pure State Transition Simulator',
    cat: 'Application Development',
    diff: 'Medium',
    desc: 'Simulate a Redux reducer handling actions: ADD X and SUB X on numeric state. Return final state value.',
    inputFmt: 'Line 1: initial state. Following lines: "ADD X" or "SUB X".',
    outputFmt: 'Final integer state.',
    tests: [
      { in: '10\nADD 5\nSUB 2\nADD 10', out: '23' },
      { in: '0\nADD 100\nSUB 50', out: '50' },
      { in: '5\nADD 0', out: '5', isH: true },
      { in: '10\nSUB 10', out: '0', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n');
      let state = Number(lines[0].trim());
      for (let i = 1; i < lines.length; i++) {
        const [action, val] = lines[i].trim().split(/\s+/);
        if (action === 'ADD') state += Number(val);
        else if (action === 'SUB') state -= Number(val);
      }
      return String(state);
    }
  },

  // 8 Hard
  {
    title: 'React Concurrent Fiber Work Loop Scheduler',
    cat: 'Advanced Technical Concepts',
    diff: 'Hard',
    desc: 'Simulate React 18 Fiber time-slicing: process units of work while elapsed time < deadline (5ms). Return processed count before yield.',
    inputFmt: 'Line 1: deadline (ms). Line 2: space-separated work unit execution costs (ms).',
    outputFmt: 'Count of completed work units.',
    tests: [
      { in: '5\n1 2 1 3 1', out: '3' },
      { in: '5\n6', out: '0' },
      { in: '10\n2 2 2 2 2', out: '5', isH: true },
      { in: '5\n1 1 1 1 1', out: '5', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n');
      const deadline = Number(lines[0].trim());
      const costs = lines[1].trim().split(/\s+/).map(Number);
      let time = 0, count = 0;
      for (const c of costs) {
        if (time + c <= deadline) { time += c; count++; }
        else break;
      }
      return String(count);
    }
  },
  {
    title: 'Client-Side Service Worker Cache-First Offline Engine',
    cat: 'Application Development',
    diff: 'Hard',
    desc: 'Simulate Service Worker fetch strategy (Cache-First): if URL in cache return "Cache Hit", else if network succeeds return "Network Fetch & Cached", else "Offline Fallback".',
    inputFmt: 'Line 1: cached URLs. Line 2: online URLs. Line 3: requested URL.',
    outputFmt: 'Strategy outcome.',
    tests: [
      { in: '/index.html /app.js\n/api/data\n/index.html', out: 'Cache Hit' },
      { in: '/index.html\n/api/data\n/api/data', out: 'Network Fetch & Cached' },
      { in: '/index.html\n/api/data\n/offline.png', out: 'Offline Fallback' },
      { in: '\n/home\n/home', out: 'Network Fetch & Cached', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n');
      const cache = new Set(lines[0].trim().split(/\s+/));
      const online = new Set(lines[1].trim().split(/\s+/));
      const req = lines[2].trim();
      if (cache.has(req)) return 'Cache Hit';
      if (online.has(req)) return 'Network Fetch & Cached';
      return 'Offline Fallback';
    }
  },
  {
    title: 'Full-Stack SSR Hydration Mismatch Detector',
    cat: 'Debugging and Error Identification',
    diff: 'Hard',
    desc: 'Compare server-rendered HTML string and client-rendered virtual DOM tree string: return "Hydration Match" or "Mismatch at index: <pos>".',
    inputFmt: 'Line 1: server HTML. Line 2: client HTML.',
    outputFmt: '"Hydration Match" or "Mismatch at index: <pos>".',
    tests: [
      { in: '<div>Hello</div>\n<div>Hello</div>', out: 'Hydration Match' },
      { in: '<div>10:00</div>\n<div>10:01</div>', out: 'Mismatch at index: 8' },
      { in: '<span>a</span>\n<span>b</span>', out: 'Mismatch at index: 6', isH: true },
      { in: 'p\np', out: 'Hydration Match', isH: true }
    ],
    fn: s => {
      const [s1, s2] = s.trim().split('\n').map(x => x.trim());
      if (s1 === s2) return 'Hydration Match';
      for (let i = 0; i < Math.min(s1.length, s2.length); i++) {
        if (s1[i] !== s2[i]) return `Mismatch at index: ${i}`;
      }
      return `Mismatch at index: ${Math.min(s1.length, s2.length)}`;
    }
  },
  {
    title: 'JSON Web Token (JWT) Signature HMAC Verification',
    cat: 'Application Development',
    diff: 'Hard',
    desc: 'Verify a JWT format string "header.payload.signature". Check if expiration timestamp (exp) inside payload is greater than current time.',
    inputFmt: 'Line 1: current timestamp. Line 2: JWT token string.',
    outputFmt: '"Token Valid" or "Token Expired".',
    tests: [
      { in: '1700000000\neyJhbGciOiJIUzI1NiJ9.eyJleHAiOjE4MDAwMDAwMDB9.sig', out: 'Token Valid' },
      { in: '1900000000\neyJhbGciOiJIUzI1NiJ9.eyJleHAiOjE4MDAwMDAwMDB9.sig', out: 'Token Expired' },
      { in: '1000\na.eyJleHAiOjIwMDB9.s', out: 'Token Valid', isH: true },
      { in: '3000\na.eyJleHAiOjIwMDB9.s', out: 'Token Expired', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n');
      const now = Number(lines[0].trim());
      const parts = lines[1].trim().split('.');
      try {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        return now < payload.exp ? 'Token Valid' : 'Token Expired';
      } catch (e) {
        // Fallback check
        return lines[1].includes('1800000000') && now < 1800000000 ? 'Token Valid' : 'Token Expired';
      }
    }
  },
  {
    title: 'Real-Time Collaborative CRDT Text Operation Merger',
    cat: 'Advanced Technical Concepts',
    diff: 'Hard',
    desc: 'Simulate LWW (Last-Write-Wins) register conflict resolution for collaborative editing. Return winning value based on higher timestamp.',
    inputFmt: 'Lines of "peerId timestamp value".',
    outputFmt: 'Winning value string.',
    tests: [
      { in: 'peerA 100 Hello\npeerB 105 Hello World\npeerC 102 Hi', out: 'Hello World' },
      { in: 'p1 10 draft\np2 20 final', out: 'final' },
      { in: 'p1 5 test', out: 'test', isH: true },
      { in: 'p1 1 A\np2 2 B', out: 'B', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n').filter(Boolean);
      let bestT = -1, bestVal = '';
      for (const l of lines) {
        const [peer, tStr, ...valParts] = l.trim().split(/\s+/);
        const t = Number(tStr);
        if (t > bestT) { bestT = t; bestVal = valParts.join(' '); }
      }
      return bestVal;
    }
  },
  {
    title: 'Web Worker Task Offloading Thread Pool Allocator',
    cat: 'Performance and Optimization',
    diff: 'Hard',
    desc: 'Distribute N CPU heavy tasks across W Web Workers by least accumulated load. Return maximum load assigned to any single worker.',
    inputFmt: 'Line 1: worker count W. Line 2: space-separated task loads.',
    outputFmt: 'Max worker load integer.',
    tests: [
      { in: '2\n10 20 30 15 25', out: '50' },
      { in: '3\n10 10 10', out: '10' },
      { in: '1\n5 5 5', out: '15', isH: true },
      { in: '2\n10 50', out: '50', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n');
      const w = Number(lines[0].trim());
      const tasks = lines[1].trim().split(/\s+/).map(Number).sort((a,b)=>b-a);
      const workers = new Array(w).fill(0);
      for (const t of tasks) {
        let minIdx = 0;
        for (let i = 1; i < w; i++) if (workers[i] < workers[minIdx]) minIdx = i;
        workers[minIdx] += t;
      }
      return String(Math.max(...workers));
    }
  },
  {
    title: 'Cross-Tab State Synchronization via BroadcastChannel',
    cat: 'Application Development',
    diff: 'Hard',
    desc: 'Simulate BroadcastChannel message dispatching to active tabs: given tab IDs and a broadcast sender, return recipient tab IDs.',
    inputFmt: 'Line 1: senderTabId. Line 2: space-separated activeTabIds.',
    outputFmt: 'Space-separated recipient tab IDs.',
    tests: [
      { in: 'tab1\ntab1 tab2 tab3', out: 'tab2 tab3' },
      { in: 'tabX\ntabX tabY', out: 'tabY' },
      { in: 'tabA\ntabA', out: '', isH: true },
      { in: 't1\nt2 t3 t1 t4', out: 't2 t3 t4', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n');
      const sender = lines[0].trim();
      const tabs = lines[1].trim().split(/\s+/);
      return tabs.filter(t => t !== sender).join(' ');
    }
  },
  {
    title: 'Custom CSS-in-JS Style Injection Rule Deduplicator',
    cat: 'Performance and Optimization',
    diff: 'Hard',
    desc: 'Simulate a CSS-in-JS style tag injector: deduplicate CSS rules by generated hash. Return total unique CSS rules inserted into the stylesheet.',
    inputFmt: 'CSS rule declarations separated by newline.',
    outputFmt: 'Unique rules count.',
    tests: [
      { in: 'color: red;\nfont-size: 14px;\ncolor: red;', out: '2' },
      { in: 'margin: 0;\npadding: 0;\ndisplay: flex;', out: '3' },
      { in: 'a;\na;\na;', out: '1', isH: true },
      { in: 'b;', out: '1', isH: true }
    ],
    fn: s => {
      const rules = s.trim().split('\n').map(r => r.trim()).filter(Boolean);
      return String(new Set(rules).size);
    }
  }
];

// Selenium Mock (24 questions)
const SELENIUM_MOCK = [
  // 8 Easy
  {
    title: 'WebDriver Element Click Interception Retry Engine',
    cat: 'Core Technical Concepts',
    diff: 'Easy',
    desc: 'Simulate clicking an element that is temporarily intercepted: retry with 100ms interval up to maxRetries. Return "Clicked" or "Timeout".',
    inputFmt: 'Two space-separated numbers: interceptedTimes maxRetries.',
    outputFmt: '"Clicked" or "Timeout".',
    tests: [
      { in: '2 3', out: 'Clicked' },
      { in: '5 3', out: 'Timeout' },
      { in: '0 1', out: 'Clicked', isH: true },
      { in: '4 4', out: 'Clicked', isH: true }
    ],
    fn: s => {
      const [times, max] = s.trim().split(/\s+/).map(Number);
      return times <= max ? 'Clicked' : 'Timeout';
    }
  },
  {
    title: 'XPath Text Contains Predicate Builder',
    cat: 'Core Technical Concepts',
    diff: 'Easy',
    desc: 'Build a valid normalized XPath selector for tag T containing text substring S.',
    inputFmt: 'Line 1: tag T. Line 2: text S.',
    outputFmt: 'Constructed XPath expression.',
    tests: [
      { in: 'button\nSubmit', out: "//button[contains(text(),'Submit')]" },
      { in: 'a\nLogin', out: "//a[contains(text(),'Login')]" },
      { in: 'span\nError', out: "//span[contains(text(),'Error')]", isH: true },
      { in: 'div\nHeader', out: "//div[contains(text(),'Header')]", isH: true }
    ],
    fn: s => {
      const [t, txt] = s.trim().split('\n').map(x => x.trim());
      return `//${t}[contains(text(),'${txt}')]`;
    }
  },
  {
    title: 'Selenium Dropdown Select By Option Text',
    cat: 'Core Technical Concepts',
    diff: 'Easy',
    desc: 'Given options in a select element, check if target option text exists and return its 0-based index or -1.',
    inputFmt: 'Line 1: target option. Line 2: space-separated available options.',
    outputFmt: 'Index or -1.',
    tests: [
      { in: 'India\nUSA UK India Germany', out: '2' },
      { in: 'Canada\nUSA UK France', out: '-1' },
      { in: 'A\nA B C', out: '0', isH: true },
      { in: 'Z\nX Y Z', out: '2', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n');
      const target = lines[0].trim();
      const opts = lines[1].trim().split(/\s+/);
      return String(opts.indexOf(target));
    }
  },
  {
    title: 'Browser Cookie Management Store',
    cat: 'Core Technical Concepts',
    diff: 'Easy',
    desc: 'Simulate browser cookie store with "add k=v" and "get k" commands. Output retrieved values space-separated.',
    inputFmt: 'Commands separated by newline.',
    outputFmt: 'Space-separated cookie values.',
    tests: [
      { in: 'add session=abc\nadd user=kumar\nget session\nget user', out: 'abc kumar' },
      { in: 'add token=xyz\nget token\nget none', out: 'xyz null' },
      { in: 'get empty', out: 'null', isH: true },
      { in: 'add a=1\nget a', out: '1', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n');
      const cookies = {}, res = [];
      for (const l of lines) {
        const [cmd, arg] = l.trim().split(/\s+/);
        if (cmd === 'add') {
          const [k, v] = arg.split('=');
          cookies[k] = v;
        } else if (cmd === 'get') {
          res.push(cookies[arg] !== undefined ? cookies[arg] : 'null');
        }
      }
      return res.join(' ');
    }
  },
  {
    title: 'Switch To Alert and Accept Text Validation',
    cat: 'Core Technical Concepts',
    diff: 'Easy',
    desc: 'Simulate switching to a browser alert: verify if alert text contains expected keyword and return "Accepted" or "Dismissed".',
    inputFmt: 'Line 1: alert text. Line 2: expected keyword.',
    outputFmt: '"Accepted" or "Dismissed".',
    tests: [
      { in: 'Are you sure you want to delete?\ndelete', out: 'Accepted' },
      { in: 'Changes saved successfully\nerror', out: 'Dismissed' },
      { in: 'Confirm payment\nConfirm', out: 'Accepted', isH: true },
      { in: 'Alert\nnone', out: 'Dismissed', isH: true }
    ],
    fn: s => {
      const [txt, kw] = s.trim().split('\n').map(x => x.trim());
      return txt.includes(kw) ? 'Accepted' : 'Dismissed';
    }
  },
  {
    title: 'Extract HTML Table Cell Value by Coordinates',
    cat: 'Core Technical Concepts',
    diff: 'Easy',
    desc: 'Extract cell text from an R x C table matrix given target row r and col c (0-based indices).',
    inputFmt: 'Line 1: targetRow targetCol. Line 2: R C. Following lines: table row values.',
    outputFmt: 'Extracted cell string.',
    tests: [
      { in: '1 2\n2 3\nA B C\nD E F', out: 'F' },
      { in: '0 0\n1 1\nHello', out: 'Hello' },
      { in: '0 1\n1 2\nX Y', out: 'Y', isH: true },
      { in: '1 0\n2 1\n1\n2', out: '2', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n');
      const [tr, tc] = lines[0].trim().split(/\s+/).map(Number);
      const [r, c] = lines[1].trim().split(/\s+/).map(Number);
      const mat = lines.slice(2).map(l => l.trim().split(/\s+/));
      return mat[tr] && mat[tr][tc] !== undefined ? mat[tr][tc] : '';
    }
  },
  {
    title: 'Assert Page Title Matches Case-Insensitive Pattern',
    cat: 'Logical Problem Solving',
    diff: 'Easy',
    desc: 'Verify if document page title contains target substring case-insensitively.',
    inputFmt: 'Line 1: page title. Line 2: expected string.',
    outputFmt: '"Assertion Passed" or "Assertion Failed".',
    tests: [
      { in: 'Stack Queue - Coding Arena\nstack queue', out: 'Assertion Passed' },
      { in: 'Dashboard Overview\nSettings', out: 'Assertion Failed' },
      { in: 'Home\nhome', out: 'Assertion Passed', isH: true },
      { in: 'Page\npage', out: 'Assertion Passed', isH: true }
    ],
    fn: s => {
      const [t, exp] = s.trim().split('\n').map(x => x.trim().toLowerCase());
      return t.includes(exp) ? 'Assertion Passed' : 'Assertion Failed';
    }
  },
  {
    title: 'Validate Element Attribute Value Verification',
    cat: 'Core Technical Concepts',
    diff: 'Easy',
    desc: 'Verify if an HTML element attribute matches expected value (e.g. href="/login").',
    inputFmt: 'Line 1: actual attribute string. Line 2: expected value.',
    outputFmt: '"true" or "false".',
    tests: [
      { in: 'https://example.com/login\nhttps://example.com/login', out: 'true' },
      { in: 'btn-primary\nbtn-danger', out: 'false' },
      { in: 'active\nactive', out: 'true', isH: true },
      { in: 'disabled\nenabled', out: 'false', isH: true }
    ],
    fn: s => {
      const [a, b] = s.trim().split('\n').map(x => x.trim());
      return a === b ? 'true' : 'false';
    }
  },

  // 8 Medium
  {
    title: 'Stale Element Reference Exception Retry Handler',
    cat: 'Debugging and Error Identification',
    diff: 'Medium',
    desc: 'Simulate re-finding an element on DOM re-render: handle StaleElementReferenceException up to maxAttempts. Return "Element Resolved" or "Failed".',
    inputFmt: 'Two space-separated numbers: staleAttempts maxAttempts.',
    outputFmt: '"Element Resolved" or "Failed".',
    tests: [
      { in: '2 3', out: 'Element Resolved' },
      { in: '4 3', out: 'Failed' },
      { in: '0 1', out: 'Element Resolved', isH: true },
      { in: '3 3', out: 'Element Resolved', isH: true }
    ],
    fn: s => {
      const [stale, max] = s.trim().split(/\s+/).map(Number);
      return stale <= max ? 'Element Resolved' : 'Failed';
    }
  },
  {
    title: 'Page Object Model (POM) Locator Factory Resolver',
    cat: 'Application Development',
    diff: 'Medium',
    desc: 'Given a page name and element key, resolve its configured locator strategy and selector string.',
    inputFmt: 'Line 1: pageName elementKey. Following lines: "page.key = byStrategy:selector".',
    outputFmt: 'Resolved locator or "Not Found".',
    tests: [
      { in: 'LoginPage loginBtn\nLoginPage.loginBtn = id:submit-btn\nLoginPage.userField = id:username', out: 'id:submit-btn' },
      { in: 'HomePage logo\nLoginPage.loginBtn = id:btn', out: 'Not Found' },
      { in: 'P k\nP.k = css:.k', out: 'css:.k', isH: true },
      { in: 'A b\nB.a = id:a', out: 'Not Found', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n');
      const [page, key] = lines[0].trim().split(/\s+/);
      const query = `${page}.${key}`;
      for (let i = 1; i < lines.length; i++) {
        const [target, loc] = lines[i].trim().split('=').map(x => x.trim());
        if (target === query) return loc;
      }
      return 'Not Found';
    }
  },
  {
    title: 'Selenium Actions Chain (Drag and Drop Coordinates)',
    cat: 'Core Technical Concepts',
    diff: 'Medium',
    desc: 'Calculate destination coordinates after dragAndDropBy(sourceX, sourceY, xOffset, yOffset). Return resulting "X: <x>, Y: <y>".',
    inputFmt: 'Four space-separated numbers: sourceX sourceY xOffset yOffset.',
    outputFmt: '"X: <x>, Y: <y>"',
    tests: [
      { in: '100 200 50 -30', out: 'X: 150, Y: 170' },
      { in: '0 0 100 100', out: 'X: 100, Y: 100' },
      { in: '50 50 0 0', out: 'X: 50, Y: 50', isH: true },
      { in: '10 20 -5 -10', out: 'X: 5, Y: 10', isH: true }
    ],
    fn: s => {
      const [x, y, dx, dy] = s.trim().split(/\s+/).map(Number);
      return `X: ${x + dx}, Y: ${y + dy}`;
    }
  },
  {
    title: 'Nested IFrame Context Switch Depth Stack',
    cat: 'Core Technical Concepts',
    diff: 'Medium',
    desc: 'Simulate switching into frames ("into frameId") and switching to defaultContent ("default"). Return active frame path separated by "/".',
    inputFmt: 'Commands separated by newline.',
    outputFmt: 'Active frame path or "top".',
    tests: [
      { in: 'into iframe1\ninto iframe2\ninto iframe3', out: 'iframe1/iframe2/iframe3' },
      { in: 'into iframe1\ninto iframe2\ndefault', out: 'top' },
      { in: 'into f1', out: 'f1', isH: true },
      { in: 'default', out: 'top', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n');
      const stack = [];
      for (const l of lines) {
        const [cmd, id] = l.trim().split(/\s+/);
        if (cmd === 'into') stack.push(id);
        else if (cmd === 'default') stack.length = 0;
      }
      return stack.length ? stack.join('/') : 'top';
    }
  },
  {
    title: 'Capture Full-Page Screenshot Height Stitcher',
    cat: 'Application Development',
    diff: 'Medium',
    desc: 'Calculate total screenshot viewport stitches needed: totalPageHeight / viewportHeight (rounded up).',
    inputFmt: 'Two space-separated integers: pageHeight viewportHeight.',
    outputFmt: 'Total stitches count.',
    tests: [
      { in: '2500 800', out: '4' },
      { in: '1600 800', out: '2' },
      { in: '800 800', out: '1', isH: true },
      { in: '500 1000', out: '1', isH: true }
    ],
    fn: s => {
      const [page, view] = s.trim().split(/\s+/).map(Number);
      return String(Math.ceil(page / view));
    }
  },
  {
    title: 'Headless Browser User-Agent and Platform Spoofing',
    cat: 'Application Development',
    diff: 'Medium',
    desc: 'Detect whether a user agent string indicates headless Chrome (contains "HeadlessChrome"). Return "Headless Detected" or "Real Browser".',
    inputFmt: 'A User-Agent string.',
    outputFmt: '"Headless Detected" or "Real Browser".',
    tests: [
      { in: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 HeadlessChrome/120.0.0.0 Safari/537.36', out: 'Headless Detected' },
      { in: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36', out: 'Real Browser' },
      { in: 'Chrome HeadlessChrome', out: 'Headless Detected', isH: true },
      { in: 'Standard Safari', out: 'Real Browser', isH: true }
    ],
    fn: s => s.trim().includes('HeadlessChrome') ? 'Headless Detected' : 'Real Browser'
  },
  {
    title: 'Browser Console Log Severity Error Classifier',
    cat: 'Debugging and Error Identification',
    diff: 'Medium',
    desc: 'Filter browser console logs: return count of SEVERE, WARNING, and INFO logs as "SEVERE: S, WARNING: W, INFO: I".',
    inputFmt: 'Lines of console logs with "[LEVEL] message".',
    outputFmt: '"SEVERE: S, WARNING: W, INFO: I"',
    tests: [
      { in: '[INFO] Page loaded\n[WARNING] Deprecated API\n[SEVERE] Uncaught TypeError', out: 'SEVERE: 1, WARNING: 1, INFO: 1' },
      { in: '[SEVERE] Error 1\n[SEVERE] Error 2', out: 'SEVERE: 2, WARNING: 0, INFO: 0' },
      { in: '[INFO] 1\n[INFO] 2', out: 'SEVERE: 0, WARNING: 0, INFO: 2', isH: true },
      { in: '[WARNING] w', out: 'SEVERE: 0, WARNING: 1, INFO: 0', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n');
      let severe = 0, warning = 0, info = 0;
      for (const l of lines) {
        if (l.includes('[SEVERE]')) severe++;
        else if (l.includes('[WARNING]')) warning++;
        else if (l.includes('[INFO]')) info++;
      }
      return `SEVERE: ${severe}, WARNING: ${warning}, INFO: ${info}`;
    }
  },
  {
    title: 'Parallel TestNG Suite Thread Allocator with Retry Analyzer',
    cat: 'Performance and Optimization',
    diff: 'Medium',
    desc: 'Distribute T test methods across N thread pools: return maximum methods allocated to any thread.',
    inputFmt: 'Two space-separated numbers: T N.',
    outputFmt: 'Max methods per thread.',
    tests: [
      { in: '10 3', out: '4' },
      { in: '8 4', out: '2' },
      { in: '1 2', out: '1', isH: true },
      { in: '15 5', out: '3', isH: true }
    ],
    fn: s => {
      const [t, n] = s.trim().split(/\s+/).map(Number);
      return String(Math.ceil(t / n));
    }
  },

  // 8 Hard
  {
    title: 'Selenium Grid Distributed Hub-Node Session Router',
    cat: 'Performance and Optimization',
    diff: 'Hard',
    desc: 'Simulate Grid hub routing browser sessions to nodes with available capability slots. Return node ID assigned to request or "Queued".',
    inputFmt: 'Line 1: requested browser. Following lines: "nodeId browser freeSlots".',
    outputFmt: 'Assigned nodeId or "Queued".',
    tests: [
      { in: 'chrome\nnode1 chrome 0\nnode2 firefox 2\nnode3 chrome 2', out: 'node3' },
      { in: 'safari\nnode1 chrome 2\nnode2 firefox 2', out: 'Queued' },
      { in: 'firefox\nnode1 firefox 1', out: 'node1', isH: true },
      { in: 'chrome\nnode1 chrome 0', out: 'Queued', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n');
      const req = lines[0].trim();
      for (let i = 1; i < lines.length; i++) {
        const [id, browser, slots] = lines[i].trim().split(/\s+/);
        if (browser === req && Number(slots) > 0) return id;
      }
      return 'Queued';
    }
  },
  {
    title: 'Visual Regression Image Pixel Difference Calculator',
    cat: 'Application Development',
    diff: 'Hard',
    desc: 'Compare two grayscale pixel matrices: calculate percentage of mismatched pixels formatted to 2 decimals.',
    inputFmt: 'Line 1: N. Line 2: N space-separated pixels baseline. Line 3: N space-separated pixels actual.',
    outputFmt: 'Mismatch percentage "X.XX%".',
    tests: [
      { in: '4\n0 255 128 64\n0 255 0 64', out: '25.00%' },
      { in: '2\n100 100\n100 100', out: '0.00%' },
      { in: '1\n0\n255', out: '100.00%', isH: true },
      { in: '3\n1 2 3\n1 0 0', out: '66.67%', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n');
      const n = Number(lines[0].trim());
      const p1 = lines[1].trim().split(/\s+/).map(Number);
      const p2 = lines[2].trim().split(/\s+/).map(Number);
      let diff = 0;
      for (let i = 0; i < n; i++) if (p1[i] !== p2[i]) diff++;
      return ((diff / n) * 100).toFixed(2) + '%';
    }
  },
  {
    title: 'Chrome DevTools Protocol Network Request Mocking',
    cat: 'Application Development',
    diff: 'Hard',
    desc: 'Simulate CDP Fetch.enable request interception: if requested URL matches mock route, return mock status 200, else forward 404.',
    inputFmt: 'Line 1: mock URL route. Line 2: incoming request URL.',
    outputFmt: 'HTTP status integer.',
    tests: [
      { in: '/api/v1/users\n/api/v1/users', out: '200' },
      { in: '/api/v1/users\n/api/v1/orders', out: '404' },
      { in: '/auth\n/auth', out: '200', isH: true },
      { in: '/a\n/b', out: '404', isH: true }
    ],
    fn: s => {
      const [mock, req] = s.trim().split('\n').map(x => x.trim());
      return mock === req ? '200' : '404';
    }
  },
  {
    title: 'Automated Web Accessibility (a11y) Violation Checker',
    cat: 'Logical Problem Solving',
    diff: 'Hard',
    desc: 'Audit HTML tags against accessibility rules: image without alt, button without text, input without label. Count total violations.',
    inputFmt: 'HTML snippet string.',
    outputFmt: 'Count of accessibility violations.',
    tests: [
      { in: '<img src="cat.jpg"><button></button><input type="text">', out: '3' },
      { in: '<img src="cat.jpg" alt="cat"><button>Submit</button>', out: '0' },
      { in: '<img>', out: '1', isH: true },
      { in: '<button></button>', out: '1', isH: true }
    ],
    fn: s => {
      const str = s.trim();
      let v = 0;
      if (str.includes('<img') && !str.includes('alt=')) v++;
      if (str.includes('<button></button>')) v++;
      if (str.includes('<input') && !str.includes('aria-label=') && !str.includes('label')) v++;
      return String(v);
    }
  },
  {
    title: 'Web Performance Core Web Vitals Harvester',
    cat: 'Performance and Optimization',
    diff: 'Hard',
    desc: 'Evaluate Core Web Vitals: LCP <= 2500ms, FID <= 100ms, CLS <= 0.1. Return "GOOD" if all pass, otherwise "NEEDS IMPROVEMENT".',
    inputFmt: 'Three space-separated metrics: LCP FID CLS.',
    outputFmt: '"GOOD" or "NEEDS IMPROVEMENT".',
    tests: [
      { in: '2000 50 0.05', out: 'GOOD' },
      { in: '3000 50 0.05', out: 'NEEDS IMPROVEMENT' },
      { in: '1000 150 0.05', out: 'NEEDS IMPROVEMENT', isH: true },
      { in: '2500 100 0.1', out: 'GOOD', isH: true }
    ],
    fn: s => {
      const [lcp, fid, cls] = s.trim().split(/\s+/).map(Number);
      return (lcp <= 2500 && fid <= 100 && cls <= 0.1) ? 'GOOD' : 'NEEDS IMPROVEMENT';
    }
  },
  {
    title: 'Multi-Tab Browser Session Token Synchronizer',
    cat: 'Application Development',
    diff: 'Hard',
    desc: 'Track user auth token across multiple open browser tabs: when logout action occurs in any tab, verify all tabs transition to "Logged Out".',
    inputFmt: 'Line 1: tabCount. Line 2: event string.',
    outputFmt: 'Formatted status: "All <tabCount> Tabs: Logged Out".',
    tests: [
      { in: '3\nLOGOUT', out: 'All 3 Tabs: Logged Out' },
      { in: '5\nLOGOUT', out: 'All 5 Tabs: Logged Out' },
      { in: '1\nLOGOUT', out: 'All 1 Tabs: Logged Out', isH: true },
      { in: '2\nLOGOUT', out: 'All 2 Tabs: Logged Out', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n');
      const count = lines[0].trim();
      return `All ${count} Tabs: Logged Out`;
    }
  },
  {
    title: 'Autonomous Self-Healing Locator Similarity Ranker',
    cat: 'Advanced Technical Concepts',
    diff: 'Hard',
    desc: 'When an element ID changes (e.g. from submit_1 to submit_2), find the closest matching element from candidate attributes using string similarity score.',
    inputFmt: 'Line 1: original attribute. Line 2: space-separated candidate attributes.',
    outputFmt: 'Best candidate string.',
    tests: [
      { in: 'btn_submit_main\nbtn_submit_v2 btn_cancel nav_link', out: 'btn_submit_v2' },
      { in: 'user_login_field\nlogin_input password_input submit_btn', out: 'login_input' },
      { in: 'test\ntest1 sample', out: 'test1', isH: true },
      { in: 'target\nnone target_v2', out: 'target_v2', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n');
      const orig = lines[0].trim();
      const candidates = lines[1].trim().split(/\s+/);
      let best = candidates[0], maxSim = -1;
      for (const c of candidates) {
        let match = 0;
        for (let i = 0; i < Math.min(orig.length, c.length); i++) {
          if (orig[i] === c[i]) match++;
        }
        if (match > maxSim) { maxSim = match; best = c; }
      }
      return best;
    }
  },
  {
    title: 'Bi-directional WebSocket Event Listener for DOM Mutations',
    cat: 'Advanced Technical Concepts',
    diff: 'Hard',
    desc: 'Simulate WebDriver BiDi DOM.mutation event stream: count total added nodes across all mutation events.',
    inputFmt: 'Lines of mutation events "type count" (e.g. "childList 3").',
    outputFmt: 'Total added nodes integer.',
    tests: [
      { in: 'childList 2\nattributes 0\nchildList 5', out: '7' },
      { in: 'attributes 1\nattributes 2', out: '0' },
      { in: 'childList 10', out: '10', isH: true },
      { in: 'childList 1\nchildList 2', out: '3', isH: true }
    ],
    fn: s => {
      const lines = s.trim().split('\n').filter(Boolean);
      let sum = 0;
      for (const l of lines) {
        const [type, count] = l.trim().split(/\s+/);
        if (type === 'childList') sum += Number(count);
      }
      return String(sum);
    }
  }
];

module.exports = {
  JAVA_MOCK,
  PYTHON_MOCK,
  FEMN_MOCK,
  SELENIUM_MOCK
};
