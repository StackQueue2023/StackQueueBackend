/**
 * Game Hub 100-Challenge Generator for all 11 Topics
 * Produces 100 structured challenges per game (1,100 total challenges)
 * Organized into 10 progressive stages (10 challenges each)
 */

const GAME_TRACKS = [
  {
    slug: 'css-arena',
    category: 'Frontend',
    type: 'css_rendering',
    stages: [
      { name: 'Flexbox Basics', prefix: 'Flex Direction & Alignment' },
      { name: 'Flexbox Layouts', prefix: 'Flex Wrap & Space Distribution' },
      { name: 'CSS Grid Columns', prefix: 'Grid Columns & Fractions' },
      { name: 'CSS Grid Areas', prefix: 'Grid Template Areas & Placement' },
      { name: 'Box Model & Spacing', prefix: 'Box-Sizing, Margin & Padding' },
      { name: 'Positioning & Overflow', prefix: 'Relative, Absolute & Sticky' },
      { name: 'Borders & Shadows', prefix: 'Border-Radius, Gradients & Shadows' },
      { name: 'Transitions & Transforms', prefix: '2D Scale, Rotate & Transitions' },
      { name: 'Keyframe Animations', prefix: 'Keyframes, Durations & Timing' },
      { name: 'Responsive Layouts', prefix: 'Media Queries, Clamp & Aspect Ratio' }
    ]
  },
  {
    slug: 'java-quest',
    category: 'Backend',
    type: 'output_prediction',
    stages: [
      { name: 'Syntax & Variables', prefix: 'Primitives, Types & Operators' },
      { name: 'Control Flow', prefix: 'If-Else, Switch & Loops' },
      { name: 'Methods & Scope', prefix: 'Method Signatures & Overloading' },
      { name: 'Classes & Objects', prefix: 'Encapsulation, This & Constructors' },
      { name: 'Inheritance & Super', prefix: 'Extends, Super & Overriding' },
      { name: 'Polymorphism & Interfaces', prefix: 'Interfaces & Abstract Classes' },
      { name: 'Exception Handling', prefix: 'Try-Catch, Throws & Custom Errors' },
      { name: 'Strings & Immortality', prefix: 'String Pool, Builder & Regex' },
      { name: 'Collections Framework', prefix: 'ArrayList, HashMap & Sets' },
      { name: 'Generics & Streams', prefix: 'Generics, Lambdas & Streams API' }
    ]
  },
  {
    slug: 'python-island',
    category: 'Backend',
    type: 'code_completion',
    stages: [
      { name: 'Types & Variables', prefix: 'Types, Dynamic Typing & Print' },
      { name: 'Operators & Flow', prefix: 'Conditionals, While & Range Loops' },
      { name: 'String Slicing', prefix: 'Indexing, Slicing & String Methods' },
      { name: 'Lists & Methods', prefix: 'List Operations & Nested Lists' },
      { name: 'Tuples & Sets', prefix: 'Immutable Tuples & Set Operations' },
      { name: 'Dictionaries', prefix: 'Key-Value Lookups & Dict Methods' },
      { name: 'Functions & Args', prefix: 'Def, Return, *args & **kwargs' },
      { name: 'Comprehensions & Lambdas', prefix: 'List/Dict Comprehensions & Lambdas' },
      { name: 'File I/O & Exceptions', prefix: 'With Open, Try-Except & File Handling' },
      { name: 'OOP & Classes', prefix: 'Class, Self, Init & Dunder Methods' }
    ]
  },
  {
    slug: 'dsa-battle',
    category: 'Data Structures',
    type: 'code_completion',
    stages: [
      { name: 'Arrays & Math', prefix: 'Linear Traversal & Running Sums' },
      { name: 'Two Pointers', prefix: 'Pair Sums & In-Place Swaps' },
      { name: 'Sliding Window', prefix: 'Subarray Max & Window Slicing' },
      { name: 'Stack Operations', prefix: 'LIFO Push/Pop & Balance Check' },
      { name: 'Queue & Deque', prefix: 'FIFO Enqueue/Dequeue & Circular Queue' },
      { name: 'Linked List Nodes', prefix: 'Pointers, Traversal & List Nodes' },
      { name: 'Recursion Logic', prefix: 'Base Cases & Call Stack Recursion' },
      { name: 'Sorting Essentials', prefix: 'Bubble, Selection & Insertion Sort' },
      { name: 'Binary Search', prefix: 'Divide and Conquer Search Spaces' },
      { name: 'Tree Traversals', prefix: 'Binary Tree Inorder, Pre & Post' }
    ]
  },
  {
    slug: 'javascript-reactor',
    category: 'Frontend',
    type: 'output_prediction',
    stages: [
      { name: 'Variables & Scope', prefix: 'Var, Let, Const & Hoisting' },
      { name: 'Destructuring & Spread', prefix: 'Object & Array Destructuring' },
      { name: 'Functions & Closures', prefix: 'Lexical Scope & Private Closures' },
      { name: 'Higher-Order Arrays', prefix: 'Map, Filter, Reduce & Some' },
      { name: 'DOM Manipulation', prefix: 'QuerySelector, ClassList & Nodes' },
      { name: 'Event Listeners', prefix: 'Event Target, Bubbling & Delegation' },
      { name: 'Storage & JSON', prefix: 'LocalStorage, SessionStorage & JSON' },
      { name: 'Promises & Async', prefix: 'Promise States, Chaining & Catch' },
      { name: 'Async / Await', prefix: 'Async Functions, Await & Try-Catch' },
      { name: 'Prototypes & Classes', prefix: 'ES6 Classes, Prototype Chain & This' }
    ]
  },
  {
    slug: 'html-builder',
    category: 'Frontend',
    type: 'output_prediction',
    stages: [
      { name: 'Document Structure', prefix: 'Doctype, HTML, Head & Meta' },
      { name: 'Semantic Page Layout', prefix: 'Header, Nav, Main, Aside & Footer' },
      { name: 'Text & Headings', prefix: 'H1-H6, Paragraphs & Blockquotes' },
      { name: 'Hyperlinks', prefix: 'Anchor Tags, Href, Target & Anchors' },
      { name: 'Media & Images', prefix: 'Img, Alt, Figure & Picture Tags' },
      { name: 'Lists & Items', prefix: 'Ordered, Unordered & Description Lists' },
      { name: 'Data Tables', prefix: 'Table, Tr, Th, Td & Colspan' },
      { name: 'Forms & Inputs', prefix: 'Form, Input Types, Labels & Buttons' },
      { name: 'Validation & State', prefix: 'Required, Pattern, Disabled & Range' },
      { name: 'Multimedia & ARIA', prefix: 'Audio, Video, Track & ARIA Labels' }
    ]
  },
  {
    slug: 'sql-detective',
    category: 'Database',
    type: 'sql_query',
    stages: [
      { name: 'Basic Retrieval', prefix: 'SELECT, Columns & Table Selection' },
      { name: 'WHERE Filtering', prefix: 'Equality, Comparison & NOT Operators' },
      { name: 'Logical Operators', prefix: 'AND, OR, BETWEEN & IN Lists' },
      { name: 'Sorting & Pagination', prefix: 'ORDER BY, ASC, DESC & LIMIT' },
      { name: 'Aggregate Functions', prefix: 'COUNT, SUM, AVG, MIN & MAX' },
      { name: 'GROUP BY & HAVING', prefix: 'Grouping Records & Group Filtering' },
      { name: 'INNER JOIN', prefix: 'Joining Two Tables with Primary Keys' },
      { name: 'LEFT & RIGHT JOIN', prefix: 'Outer Joins & Finding Missing Records' },
      { name: 'Subqueries & UNION', prefix: 'Nested Queries & Set Combinations' },
      { name: 'Data Manipulation', prefix: 'INSERT, UPDATE, DELETE & Constraints' }
    ]
  },
  {
    slug: 'react-lab',
    category: 'Frontend',
    type: 'output_prediction',
    stages: [
      { name: 'JSX Fundamentals', prefix: 'JSX Syntax, Expressions & ClassName' },
      { name: 'Component Structure', prefix: 'Functional Components & Fragments' },
      { name: 'Props & Children', prefix: 'Passing Props, Default Props & Children' },
      { name: 'Conditional Rendering', prefix: 'Ternary & Short-Circuit Rendering' },
      { name: 'Lists & Keys', prefix: 'Array Mapping & Unique Key Props' },
      { name: 'useState Basics', prefix: 'State Hooks, Setters & Re-renders' },
      { name: 'Form Inputs & State', prefix: 'Controlled Inputs, Change Handlers' },
      { name: 'useEffect Lifecycle', prefix: 'Mounting, Dependencies & Cleanups' },
      { name: 'Lifting State Up', prefix: 'Parent-Child Communication & State' },
      { name: 'Context & Custom Hooks', prefix: 'UseContext, Providers & Custom Hooks' }
    ]
  },
  {
    slug: 'git-battle',
    category: 'DevOps & Cloud',
    type: 'output_prediction',
    stages: [
      { name: 'Init & Configuration', prefix: 'Git Init, Config & Ignore Rules' },
      { name: 'Staging Area', prefix: 'Git Add, Status & Unstaging Files' },
      { name: 'Commits & Logs', prefix: 'Git Commit, Commit Messages & Logs' },
      { name: 'Diff & Inspection', prefix: 'Git Diff, Staged Diff & Show' },
      { name: 'Branching Basics', prefix: 'Creating, Listing & Deleting Branches' },
      { name: 'Checkout & Switch', prefix: 'Switching Branches & Detached HEAD' },
      { name: 'Fast-Forward Merges', prefix: 'Linear Branch Merging & Master Update' },
      { name: 'Merge Conflicts', prefix: 'Conflict Markers & Manual Resolution' },
      { name: 'Stashing Work', prefix: 'Git Stash, Pop, List & Clear' },
      { name: 'Remotes & Push', prefix: 'Git Remote, Push, Pull & Fetch' }
    ]
  },
  {
    slug: 'cloud-mission',
    category: 'DevOps & Cloud',
    type: 'output_prediction',
    stages: [
      { name: 'Cloud Fundamentals', prefix: 'IaaS, PaaS, Regions & Availability Zones' },
      { name: 'Virtual Compute', prefix: 'EC2 Instances, AMIs & Security Groups' },
      { name: 'Object Storage', prefix: 'S3 Buckets, Objects & Storage Classes' },
      { name: 'IAM & Security', prefix: 'Users, Groups, Roles & Policies' },
      { name: 'Cloud Networking', prefix: 'VPC, Subnets, Gateways & Routing' },
      { name: 'Serverless Compute', prefix: 'Lambda Functions, Triggers & Limits' },
      { name: 'Managed Databases', prefix: 'RDS Relational, DynamoDB NoSQL' },
      { name: 'Containers & Docker', prefix: 'Dockerfiles, Images & Registries' },
      { name: 'Load Balancing', prefix: 'Application Load Balancers & Scaling' },
      { name: 'Cloud Architecture', prefix: 'High Availability & Fault Tolerance' }
    ]
  },
  {
    slug: 'fullstack-challenge',
    category: 'Full Stack',
    type: 'output_prediction',
    stages: [
      { name: 'HTTP & Status Codes', prefix: 'Request/Response, 200, 404 & 500' },
      { name: 'RESTful Principles', prefix: 'Resource URLs & CRUD Conventions' },
      { name: 'Server Routing', prefix: 'Express App, Router & Endpoints' },
      { name: 'Request Parsing', prefix: 'Body, Query Params & URL Params' },
      { name: 'Middleware Stack', prefix: 'App.use, Next Function & CORS' },
      { name: 'Full CRUD Flow', prefix: 'Create, Read, Update & Delete Flow' },
      { name: 'DB Modeling & CRUD', prefix: 'Schema Definitions & Async Queries' },
      { name: 'Authentication & JWT', prefix: 'Bcrypt Hashing & JWT Verification' },
      { name: 'Validation & Errors', prefix: 'Input Sanitization & Error Handling' },
      { name: 'Production System', prefix: 'Environment Config & Production Build' }
    ]
  }
];

function generate100ChallengesForGame(track) {
  const challenges = [];
  let level = 1;

  track.stages.forEach((stage, stageIdx) => {
    for (let q = 1; q <= 10; q++) {
      const globalQNum = level;
      const difficulty =
        level <= 30 ? 'Beginner' :
        level <= 70 ? 'Intermediate' :
        level <= 90 ? 'Advanced' : 'Expert';

      const xpReward =
        difficulty === 'Beginner' ? 25 :
        difficulty === 'Intermediate' ? 35 :
        difficulty === 'Advanced' ? 45 : 50;

      const timeLimit = difficulty === 'Beginner' ? 90 : difficulty === 'Intermediate' ? 120 : 150;

      let challengeItem = {
        title: `${stage.prefix}: Challenge ${q}`,
        gameSlug: track.slug,
        levelNumber: globalQNum,
        category: stage.name,
        difficulty,
        type: track.type,
        instructions: `Master Level ${globalQNum} in ${track.category} (${stage.name}). Complete the challenge according to the specifications below.`,
        targetDescription: `Demonstrate mastery of ${stage.name} - Part ${q}`,
        xpReward,
        timeLimitSeconds: timeLimit,
        order: globalQNum,
        isActive: true,
        hints: [
          { hintText: `Carefully examine the requirements for ${stage.name}.`, xpPenalty: 5 },
          { hintText: `Apply the core standard pattern for ${stage.prefix}.`, xpPenalty: 5 }
        ]
      };

      // Configure type-specific attributes
      if (track.type === 'css_rendering') {
        challengeItem.starterCode = `.container {\n  display: block;\n  /* Write CSS properties for ${stage.name} */\n}`;
        challengeItem.solutionCode = `.container {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n}`;
        challengeItem.targetCondition = {
          '.container': {
            'display': 'flex'
          }
        };
        challengeItem.initialHtml = `<div class="container"><div class="item">Item ${q}</div></div>`;
      } else if (track.type === 'sql_query') {
        challengeItem.starterCode = `-- Write SQL query for ${stage.name}\nSELECT * FROM students;`;
        challengeItem.solutionCode = `SELECT * FROM students WHERE id = ${q};`;
        challengeItem.targetCondition = { minRows: 1 };
      } else if (track.type === 'code_completion') {
        challengeItem.starterCode = `def solve_challenge(val):\n    # Return the processed output for Level ${globalQNum}\n    return val`;
        challengeItem.solutionCode = `def solve_challenge(val):\n    return val`;
        challengeItem.testCases = [
          { input: `${q * 10}`, expectedOutput: `${q * 10}`, isHidden: false },
          { input: `${q * 20}`, expectedOutput: `${q * 20}`, isHidden: true }
        ];
      } else {
        // Output prediction / MCQ
        const optA = `Standard Output ${q}`;
        const optB = `Computed Value ${q * 2}`;
        const optC = `Error / Exception`;
        const optD = `Null / Undefined`;

        challengeItem.expectedOutput = optA;
        challengeItem.mcqOptions = [
          { id: 'a', text: optA, isCorrect: true },
          { id: 'b', text: optB, isCorrect: false },
          { id: 'c', text: optC, isCorrect: false },
          { id: 'd', text: optD, isCorrect: false }
        ];
      }

      challenges.push(challengeItem);
      level++;
    }
  });

  return challenges;
}

function generateAllGameHubChallenges() {
  const allChallenges = [];
  GAME_TRACKS.forEach(track => {
    const trackChallenges = generate100ChallengesForGame(track);
    allChallenges.push(...trackChallenges);
  });
  return allChallenges;
}

module.exports = {
  GAME_TRACKS,
  generate100ChallengesForGame,
  generateAllGameHubChallenges
};
