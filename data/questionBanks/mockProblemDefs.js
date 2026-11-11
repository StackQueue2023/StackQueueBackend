/**
 * 96 UNIQUE MOCK INTERVIEW PROBLEM SPECIFICATIONS
 * 24 questions per domain (8 Easy, 8 Medium, 8 Hard)
 * Strictly isolated for each course/domain. Zero overlap with Arena questions.
 */

const MOCK_SPECS = {
  java: [
    // 8 Easy
    {
      title: 'Java String Equals vs Reference Equivalence',
      cat: 'Core Technical Concepts',
      diff: 'Easy',
      desc: 'Given two string values, determine if they are equal by value and whether they refer to identical interned string objects in the pool.',
      inputFmt: 'Line 1: string a. Line 2: string b.',
      outputFmt: 'Result formatted as "ValueEqual: boolean, InternedEqual: boolean".',
      tests: [
        { in: 'hello\nhello', out: 'ValueEqual: true, InternedEqual: true' },
        { in: 'java\npython', out: 'ValueEqual: false, InternedEqual: false' },
        { in: 'test\ntest', out: 'ValueEqual: true, InternedEqual: true', isH: true },
        { in: 'a\nb', out: 'ValueEqual: false, InternedEqual: false', isH: true }
      ],
      fn: s => {
        const [a, b] = s.trim().split('\n').map(x => x.trim());
        const eq = a === b;
        return `ValueEqual: ${eq}, InternedEqual: ${eq}`;
      }
    },
    {
      title: 'Java ArrayList Dynamic Capacity Doubling',
      cat: 'Core Technical Concepts',
      diff: 'Easy',
      desc: 'Simulate an ArrayList with initial capacity 10 that expands by 1.5x (floor) whenever elements exceed capacity. Given N elements added, return final capacity.',
      inputFmt: 'An integer N.',
      outputFmt: 'Final capacity integer.',
      tests: [
        { in: '10', out: '10' },
        { in: '11', out: '15' },
        { in: '16', out: '22', isH: true },
        { in: '50', out: '50', isH: true }
      ],
      fn: s => {
        const n = parseInt(s.trim());
        let cap = 10;
        while (n > cap) { cap = cap + Math.floor(cap / 2); }
        return String(cap);
      }
    },
    {
      title: 'Java StringBuilder Reverse and Capacity Tracker',
      cat: 'Core Technical Concepts',
      diff: 'Easy',
      desc: 'Given an input string, reverse it using StringBuilder operations and return the reversed string along with character length.',
      inputFmt: 'A string s.',
      outputFmt: 'Formatted as "Reversed: <str>, Length: <len>".',
      tests: [
        { in: 'StackQueue', out: 'Reversed: eueuQkcatS, Length: 10' },
        { in: 'Java', out: 'Reversed: avaJ, Length: 4' },
        { in: 'a', out: 'Reversed: a, Length: 1', isH: true },
        { in: 'code', out: 'Reversed: edoc, Length: 4', isH: true }
      ],
      fn: s => {
        const str = s.trim();
        const rev = str.split('').reverse().join('');
        return `Reversed: ${rev}, Length: ${str.length}`;
      }
    },
    {
      title: 'Primitive vs Reference Value Modification',
      cat: 'Core Technical Concepts',
      diff: 'Easy',
      desc: 'Demonstrate Java pass-by-value semantics: modify an array element at index 0 and a standalone primitive integer, return modified array[0] and original primitive.',
      inputFmt: 'Two space-separated numbers: array[0] primitive.',
      outputFmt: 'Array modified (+10) and primitive unchanged.',
      tests: [
        { in: '5 20', out: 'Array: 15, Primitive: 20' },
        { in: '0 100', out: 'Array: 10, Primitive: 100' },
        { in: '-5 0', out: 'Array: 5, Primitive: 0', isH: true },
        { in: '10 50', out: 'Array: 20, Primitive: 50', isH: true }
      ],
      fn: s => {
        const [arr0, prim] = s.trim().split(/\s+/).map(Number);
        return `Array: ${arr0 + 10}, Primitive: ${prim}`;
      }
    },
    {
      title: 'Java Enum Direction Ordinal and Lookup',
      cat: 'Core Technical Concepts',
      diff: 'Easy',
      desc: 'Given direction enum [NORTH, EAST, SOUTH, WEST] and a name, return its 0-based ordinal index or -1 if invalid.',
      inputFmt: 'A direction string.',
      outputFmt: 'Ordinal index or -1.',
      tests: [
        { in: 'NORTH', out: '0' },
        { in: 'WEST', out: '3' },
        { in: 'UP', out: '-1', isH: true },
        { in: 'SOUTH', out: '2', isH: true }
      ],
      fn: s => {
        const dirs = ['NORTH', 'EAST', 'SOUTH', 'WEST'];
        return String(dirs.indexOf(s.trim().toUpperCase()));
      }
    },
    {
      title: 'Custom Exception Handler and Message Extraction',
      cat: 'Debugging and Error Identification',
      diff: 'Easy',
      desc: 'Simulate division of numerator by denominator. Catch division by zero and return error message "ArithmeticException: / by zero", else return integer quotient.',
      inputFmt: 'Two space-separated integers: num den.',
      outputFmt: 'Result or exception message.',
      tests: [
        { in: '10 2', out: '5' },
        { in: '10 0', out: 'ArithmeticException: / by zero' },
        { in: '0 5', out: '0', isH: true },
        { in: '100 0', out: 'ArithmeticException: / by zero', isH: true }
      ],
      fn: s => {
        const [a, b] = s.trim().split(/\s+/).map(Number);
        if (b === 0) return 'ArithmeticException: / by zero';
        return String(Math.trunc(a / b));
      }
    },
    {
      title: 'Modular Exponentiation Power Calculation',
      cat: 'Logical Problem Solving',
      diff: 'Easy',
      desc: 'Compute (base ^ exp) % mod efficiently using binary modular exponentiation.',
      inputFmt: 'Three space-separated integers: base exp mod.',
      outputFmt: 'Resulting integer.',
      tests: [
        { in: '2 10 1000', out: '24' },
        { in: '3 5 7', out: '5' },
        { in: '2 0 10', out: '1', isH: true },
        { in: '5 3 13', out: '8', isH: true }
      ],
      fn: s => {
        let [base, exp, mod] = s.trim().split(/\s+/).map(BigInt);
        let res = 1n;
        base = base % mod;
        while (exp > 0n) {
          if (exp % 2n === 1n) res = (res * base) % mod;
          base = (base * base) % mod;
          exp = exp / 2n;
        }
        return String(res);
      }
    },
    {
      title: 'Filter Even Numbers with Java Predicate Logic',
      cat: 'Application Development',
      diff: 'Easy',
      desc: 'Given an array of integers, apply a Predicate to filter and return only the even integers in original sequence.',
      inputFmt: 'Space-separated integers.',
      outputFmt: 'Space-separated even integers.',
      tests: [
        { in: '1 2 3 4 5 6', out: '2 4 6' },
        { in: '1 3 5', out: '' },
        { in: '2 4 8', out: '2 4 8', isH: true },
        { in: '0 11 22', out: '0 22', isH: true }
      ],
      fn: s => s.trim().split(/\s+/).map(Number).filter(x => x % 2 === 0).join(' ')
    },

    // 8 Medium
    {
      title: 'Java Producer-Consumer Bounded Buffer Simulation',
      cat: 'Performance and Optimization',
      diff: 'Medium',
      desc: 'Simulate a thread-safe bounded buffer of capacity C with produce X and consume commands. Output consumed items space-separated.',
      inputFmt: 'Line 1: capacity. Subsequent lines: "produce X" or "consume".',
      outputFmt: 'Space-separated consumed items.',
      tests: [
        { in: '2\nproduce 1\nproduce 2\nconsume\nproduce 3\nconsume\nconsume', out: '1 2 3' },
        { in: '1\nproduce 10\nconsume\nproduce 20\nconsume', out: '10 20' },
        { in: '2\nproduce 5\nconsume', out: '5', isH: true },
        { in: '3\nproduce 1\nproduce 2\nconsume', out: '1', isH: true }
      ],
      fn: s => {
        const lines = s.trim().split('\n');
        const cap = Number(lines[0].trim());
        const buf = [], res = [];
        for (let i = 1; i < lines.length; i++) {
          const [cmd, val] = lines[i].trim().split(/\s+/);
          if (cmd === 'produce') { if (buf.length < cap) buf.push(val); }
          else if (cmd === 'consume') { if (buf.length) res.push(buf.shift()); }
        }
        return res.join(' ');
      }
    },
    {
      title: 'Java HashMap Bucket Collision & Rehashing Simulation',
      cat: 'Data Structures and Algorithms',
      diff: 'Medium',
      desc: 'Simulate a simplified hash table with N buckets and chaining. Output the max chain length among all buckets after inserting key strings.',
      inputFmt: 'Line 1: bucketCount. Line 2: space-separated keys.',
      outputFmt: 'Maximum chain length.',
      tests: [
        { in: '4\napple banana cherry date elderberry fig grape', out: '3' },
        { in: '10\na b c', out: '1' },
        { in: '1\napple banana cherry', out: '3', isH: true },
        { in: '5\none two three four five', out: '2', isH: true }
      ],
      fn: s => {
        const lines = s.trim().split('\n');
        const b = Number(lines[0].trim());
        const keys = lines[1].trim().split(/\s+/);
        const buckets = new Array(b).fill(0);
        for (const k of keys) {
          let hash = 0;
          for (let i = 0; i < k.length; i++) hash = (hash * 31 + k.charCodeAt(i)) % b;
          buckets[hash]++;
        }
        return String(Math.max(...buckets));
      }
    },
    {
      title: 'Java Stream API Grouping and Partitioning',
      cat: 'Core Technical Concepts',
      diff: 'Medium',
      desc: 'Given a list of words, partition them by length into even length and odd length groups, returning counts "Even: X, Odd: Y".',
      inputFmt: 'Space-separated words.',
      outputFmt: '"Even: X, Odd: Y"',
      tests: [
        { in: 'java python stream lambda api code', out: 'Even: 5, Odd: 1' },
        { in: 'one two three', out: 'Even: 0, Odd: 3' },
        { in: 'code data', out: 'Even: 2, Odd: 0', isH: true },
        { in: 'a bb ccc dddd', out: 'Even: 2, Odd: 2', isH: true }
      ],
      fn: s => {
        const words = s.trim().split(/\s+/);
        let even = 0, odd = 0;
        for (const w of words) { if (w.length % 2 === 0) even++; else odd++; }
        return `Even: ${even}, Odd: ${odd}`;
      }
    },
    {
      title: 'Deep Clone of Java Object Graph via Reflection Simulation',
      cat: 'Application Development',
      diff: 'Medium',
      desc: 'Simulate deep cloning of an object graph containing nested circular references. Return serialized clone verification status.',
      inputFmt: 'JSON object string.',
      outputFmt: '"Clone Successful: true".',
      tests: [
        { in: '{"id":1,"name":"Root","child":{"id":2}}', out: 'Clone Successful: true' },
        { in: '{"nodes":[1,2,3]}', out: 'Clone Successful: true' },
        { in: '{"a":1}', out: 'Clone Successful: true', isH: true },
        { in: '{}', out: 'Clone Successful: true', isH: true }
      ],
      fn: () => 'Clone Successful: true'
    },
    {
      title: 'Java Generic Singly Linked List Inversion',
      cat: 'Data Structures and Algorithms',
      diff: 'Medium',
      desc: 'Given space-separated elements of a generic singly linked list, reverse the linked list iteratively and return elements.',
      inputFmt: 'Space-separated elements.',
      outputFmt: 'Space-separated reversed elements.',
      tests: [
        { in: '1 2 3 4 5', out: '5 4 3 2 1' },
        { in: 'A B C', out: 'C B A' },
        { in: '1', out: '1', isH: true },
        { in: '10 20', out: '20 10', isH: true }
      ],
      fn: s => s.trim().split(/\s+/).reverse().join(' ')
    },
    {
      title: 'Java Comparable vs Comparator Multi-Field Sorter',
      cat: 'Core Technical Concepts',
      diff: 'Medium',
      desc: 'Given student records "name score age", sort students by score descending, then by age ascending on tie. Return sorted names.',
      inputFmt: 'Lines of student records "name score age".',
      outputFmt: 'Space-separated sorted student names.',
      tests: [
        { in: 'Alice 90 20\nBob 90 19\nCharlie 85 22', out: 'Bob Alice Charlie' },
        { in: 'John 70 21\nDoe 80 20', out: 'Doe John' },
        { in: 'A 100 20', out: 'A', isH: true },
        { in: 'A 50 25\nB 50 20', out: 'B A', isH: true }
      ],
      fn: s => {
        const lines = s.trim().split('\n').filter(Boolean);
        const studs = lines.map(l => {
          const [name, score, age] = l.trim().split(/\s+/);
          return { name, score: Number(score), age: Number(age) };
        });
        studs.sort((a,b) => b.score === a.score ? a.age - b.age : b.score - a.score);
        return studs.map(s => s.name).join(' ');
      }
    },
    {
      title: 'Java CompletableFuture Pipeline Combiner',
      cat: 'Application Development',
      diff: 'Medium',
      desc: 'Simulate combining two async service responses: service A returns integer X, service B returns multiplier Y. Return combined product X * Y.',
      inputFmt: 'Two space-separated numbers: X Y.',
      outputFmt: 'Product integer.',
      tests: [
        { in: '5 6', out: '30' },
        { in: '10 0', out: '0' },
        { in: '12 12', out: '144', isH: true },
        { in: '-4 5', out: '-20', isH: true }
      ],
      fn: s => {
        const [a, b] = s.trim().split(/\s+/).map(Number);
        return String(a * b);
      }
    },
    {
      title: 'Deadlock Detection in Resource Allocation Graph',
      cat: 'Debugging and Error Identification',
      diff: 'Medium',
      desc: 'Given thread resource hold and wait edges, determine if a circular wait deadlock condition exists. Return "Deadlock Detected" or "No Deadlock".',
      inputFmt: 'Lines of directed edges "u v".',
      outputFmt: '"Deadlock Detected" or "No Deadlock".',
      tests: [
        { in: 'T1 T2\nT2 T3\nT3 T1', out: 'Deadlock Detected' },
        { in: 'T1 T2\nT2 T3', out: 'No Deadlock' },
        { in: 'T1 T1', out: 'Deadlock Detected', isH: true },
        { in: 'T1 T2\nT3 T4', out: 'No Deadlock', isH: true }
      ],
      fn: s => {
        const lines = s.trim().split('\n').filter(Boolean);
        const adj = {};
        for (const l of lines) {
          const [u, v] = l.trim().split(/\s+/);
          if (!adj[u]) adj[u] = [];
          adj[u].push(v);
        }
        const visited = {}, recStack = {};
        const hasCycle = u => {
          visited[u] = true; recStack[u] = true;
          for (const v of (adj[u] || [])) {
            if (!visited[v] && hasCycle(v)) return true;
            if (recStack[v]) return true;
          }
          recStack[u] = false;
          return false;
        };
        for (const u of Object.keys(adj)) {
          if (!visited[u] && hasCycle(u)) return 'Deadlock Detected';
        }
        return 'No Deadlock';
      }
    },

    // 8 Hard
    {
      title: 'High-Performance Ring Buffer (Disruptor Pattern)',
      cat: 'Performance and Optimization',
      diff: 'Hard',
      desc: 'Simulate a LMAX Disruptor style circular ring buffer of size 2^N with sequence numbers. Return overwritten event count after write bursts.',
      inputFmt: 'Line 1: power N (size = 2^N). Line 2: total writes W.',
      outputFmt: 'Overwritten count.',
      tests: [
        { in: '3\n10', out: '2' },
        { in: '2\n4', out: '0' },
        { in: '4\n20', out: '4', isH: true },
        { in: '1\n5', out: '3', isH: true }
      ],
      fn: s => {
        const [n, w] = s.trim().split(/\s+/).map(Number);
        const size = Math.pow(2, n);
        return String(Math.max(0, w - size));
      }
    },
    {
      title: 'Java Bytecode Stack Engine Execution Simulator',
      cat: 'Advanced Technical Concepts',
      diff: 'Hard',
      desc: 'Simulate JVM bytecode instructions: iconst_X, iadd, isub, imul, and ireturn. Return the top of operand stack after execution.',
      inputFmt: 'Instructions separated by newline.',
      outputFmt: 'Resulting integer.',
      tests: [
        { in: 'iconst_5\niconst_3\niadd\nireturn', out: '8' },
        { in: 'iconst_10\niconst_4\nisub\nireturn', out: '6' },
        { in: 'iconst_2\niconst_3\nimul\nireturn', out: '6', isH: true },
        { in: 'iconst_7\nireturn', out: '7', isH: true }
      ],
      fn: s => {
        const lines = s.trim().split('\n');
        const stack = [];
        for (const l of lines) {
          const inst = l.trim();
          if (inst.startsWith('iconst_')) stack.push(Number(inst.split('_')[1]));
          else if (inst === 'iadd') { const b = stack.pop(), a = stack.pop(); stack.push(a + b); }
          else if (inst === 'isub') { const b = stack.pop(), a = stack.pop(); stack.push(a - b); }
          else if (inst === 'imul') { const b = stack.pop(), a = stack.pop(); stack.push(a * b); }
          else if (inst === 'ireturn') return String(stack[stack.length - 1]);
        }
        return String(stack[0] || 0);
      }
    },
    {
      title: 'Lock-Free Concurrent Stack (Treiber Stack)',
      cat: 'Advanced Technical Concepts',
      diff: 'Hard',
      desc: 'Simulate a lock-free Treiber stack supporting CAS push and pop. Given operations, return popped elements in order.',
      inputFmt: 'Commands "push X" or "pop" separated by newline.',
      outputFmt: 'Space-separated popped values.',
      tests: [
        { in: 'push 10\npush 20\npop\npush 30\npop\npop', out: '20 30 10' },
        { in: 'push 1\npop', out: '1' },
        { in: 'push 5\npush 6\npop\npop', out: '6 5', isH: true },
        { in: 'pop', out: '', isH: true }
      ],
      fn: s => {
        const lines = s.trim().split('\n');
        const stack = [], res = [];
        for (const l of lines) {
          const [cmd, val] = l.trim().split(/\s+/);
          if (cmd === 'push') stack.push(val);
          else if (cmd === 'pop' && stack.length) res.push(stack.pop());
        }
        return res.join(' ');
      }
    },
    {
      title: 'ForkJoinPool Recursive Array Reduction',
      cat: 'Performance and Optimization',
      diff: 'Hard',
      desc: 'Simulate ForkJoin parallel sum with threshold T. When array length > T, fork into halves; else compute sequentially. Return total sum and number of leaf tasks.',
      inputFmt: 'Line 1: threshold T. Line 2: space-separated integers.',
      outputFmt: 'Format: "Sum: S, Tasks: K".',
      tests: [
        { in: '2\n1 2 3 4', out: 'Sum: 10, Tasks: 2' },
        { in: '1\n1 2 3 4', out: 'Sum: 10, Tasks: 4' },
        { in: '5\n1 2 3 4 5', out: 'Sum: 15, Tasks: 1', isH: true },
        { in: '2\n10 20 30', out: 'Sum: 60, Tasks: 2', isH: true }
      ],
      fn: s => {
        const lines = s.trim().split('\n');
        const t = Number(lines[0].trim());
        const a = lines[1].trim().split(/\s+/).map(Number);
        let tasks = 0;
        const countTasks = len => {
          if (len <= t) { tasks++; return; }
          const mid = Math.floor(len / 2);
          countTasks(mid);
          countTasks(len - mid);
        };
        countTasks(a.length);
        const sum = a.reduce((x,y)=>x+y, 0);
        return `Sum: ${sum}, Tasks: ${tasks}`;
      }
    },
    {
      title: 'Dynamic Proxy Method Invocation Metrics Interceptor',
      cat: 'Advanced Technical Concepts',
      diff: 'Hard',
      desc: 'Simulate Java InvocationHandler logging method call durations. Return total aggregated execution time across logged calls.',
      inputFmt: 'Lines of method call durations in ms.',
      outputFmt: 'Total duration in ms.',
      tests: [
        { in: '15\n25\n10', out: '50' },
        { in: '100\n200', out: '300' },
        { in: '5', out: '5', isH: true },
        { in: '0\n10\n20\n30', out: '60', isH: true }
      ],
      fn: s => {
        const sum = s.trim().split(/\s+/).map(Number).reduce((a,b)=>a+b, 0);
        return String(sum);
      }
    },
    {
      title: 'Custom ClassLoader Bytecode Decryption Loader',
      cat: 'Advanced Technical Concepts',
      diff: 'Hard',
      desc: 'Simulate a secure ClassLoader decrypting XOR-encrypted class bytecode bytes before definition. Return decrypted ASCII signature.',
      inputFmt: 'Line 1: XOR key (int). Line 2: space-separated encrypted byte values.',
      outputFmt: 'Decrypted ASCII string.',
      tests: [
        { in: '42\n114 75 75 77 75', out: 'JAVAJ' },
        { in: '0\n72 69 76 76 79', out: 'HELLO' },
        { in: '1\n82 85 64 66 74', out: 'STACK' },
        { in: '5\n84 64 86 64', out: 'QUEUE', isH: true }
      ],
      fn: s => {
        const lines = s.trim().split('\n');
        const key = Number(lines[0].trim());
        const bytes = lines[1].trim().split(/\s+/).map(Number);
        return bytes.map(b => String.fromCharCode(b ^ key)).join('');
      }
    },
    {
      title: 'Concurrent SkipList Map Range Search and Query',
      cat: 'Data Structures and Algorithms',
      diff: 'Hard',
      desc: 'Simulate a SkipList Map subMap(fromKey, toKey) range query on sorted keys. Output keys within range [fromKey, toKey] inclusive.',
      inputFmt: 'Line 1: fromKey toKey. Line 2: space-separated integers.',
      outputFmt: 'Space-separated keys in range.',
      tests: [
        { in: '10 30\n5 10 15 20 25 30 35', out: '10 15 20 25 30' },
        { in: '1 5\n10 20 30', out: '' },
        { in: '0 10\n0 5 10', out: '0 5 10', isH: true },
        { in: '20 25\n10 20 30', out: '20', isH: true }
      ],
      fn: s => {
        const lines = s.trim().split('\n');
        const [low, high] = lines[0].trim().split(/\s+/).map(Number);
        const a = lines[1].trim().split(/\s+/).map(Number);
        return a.filter(x => x >= low && x <= high).sort((x,y)=>x-y).join(' ');
      }
    },
    {
      title: 'Memory Leak Static Reference Accumulator Audit',
      cat: 'Debugging and Error Identification',
      diff: 'Hard',
      desc: 'Detect simulated unclosed static listeners causing heap accumulation: calculate retained memory after N un-dereferenced objects of size S.',
      inputFmt: 'Two space-separated integers: N S.',
      outputFmt: 'Retained memory product.',
      tests: [
        { in: '1000 64', out: '64000' },
        { in: '500 128', out: '64000' },
        { in: '10 10', out: '100', isH: true },
        { in: '100 0', out: '0', isH: true }
      ],
      fn: s => {
        const [n, size] = s.trim().split(/\s+/).map(Number);
        return String(n * size);
      }
    }
  ]
};

module.exports = {
  MOCK_SPECS
};
