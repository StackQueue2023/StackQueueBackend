const Module = require('../models/Module');
const Course = require('../models/Course');
const DomainTask = require('../models/DomainTask');

/**
 * Filter out footer noise, addresses, page counters, and table headers
 */
function isNoiseTopic(str) {
  if (!str || typeof str !== 'string') return true;
  const s = str.trim().toLowerCase();
  if (s.length < 2) return true;
  if (/^(?:s\.?no|sl\.?no|#|no\.?|serial no)/i.test(s)) return true;
  if (/\b(?:calicut|sankari|kondalampatti|salem|first floor|bus stop|opp\.)\b/i.test(s)) return true;
  if (/^\d+\s*of\s*\d+\s*--?$/i.test(s) || /^--\s*\d+\s*of\s*\d+\s*--$/i.test(s)) return true;
  if (/^page\s*\d+/i.test(s)) return true;
  if (/^\d+\s*(?:hrs?|hours?|mins?|minutes?)$/i.test(s)) return true;
  if (/^(?:python|java|cpp|c\+\+|react|web|node|data science|selenium)\s+syllabus$/i.test(s)) return true;
  return false;
}

/**
 * Clean and standardize topic string
 */
function cleanTopicName(raw) {
  if (!raw) return '';
  return raw
    .replace(/^[-•*\d.]+\s*/, '')
    .replace(/\b\d+\s*(?:hrs?|hours?|h|mins?|minutes?)\b/gi, '')
    .replace(/^[-–—:\s|]+|[-–—:\s|]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Curated standard syllabus topics mapped strictly to existing course modules in STACK QUEUE.
 * These reflect the exact uploaded syllabus without adding unincluded external frameworks.
 */
const CANONICAL_MODULE_TOPICS = {
  java: {
    1: ['JVM Architecture & Execution', 'JDK and JRE Components', 'Java Bytecode & ClassLoader', 'Structure of a Java Program'],
    2: ['Primitive Data Types & Memory', 'Variable Declarations & Scope', 'Type Casting & Conversion', 'Comments & Code Conventions'],
    3: ['Class Definition & State', 'Object Instantiation & new Keyword', 'Instance Variables vs Local Variables', 'Method Definition & Signatures'],
    4: ['Method Return Types & Parameters', 'Pass by Value Mechanism', 'String Immutability & Heap Allocation', 'Core String Methods (charAt, substring, split)'],
    5: ['Scanner Class Initialization', 'Reading User Tokens (next, nextInt, nextLine)', 'Input Delimiters & Patterns', 'Handling Input Mismatch Exceptions'],
    6: ['if and if-else Decision Making', 'Nested if Statements', 'Ternary Operator (?:)', 'Short-Circuit Evaluation'],
    7: ['Arithmetic & Modulus Operators', 'Relational & Equality Operators', 'Logical Operators (&&, ||, !)', 'Bitwise & Shift Operators'],
    8: ['for Loop & Counter Iteration', 'while Loop & Entry Control', 'do-while Loop & Exit Control', 'Enhanced for-each Loop on Arrays'],
    9: ['switch-case Control Structure', 'break Statement & Fall-through', 'default Case Handling', 'Switch on Strings & Enums'],
    10: ['1D Array Declaration & Allocation', 'Array Indexing & Bounds Checking', 'Multi-Dimensional Arrays', 'Array Traversal & Utility Methods'],
    11: ['Static Nested Classes', 'Inner (Member) Classes', 'Method-Local Inner Classes', 'Anonymous Inner Classes'],
    12: ['Encapsulation Principles & Getters/Setters', 'Abstraction with Abstract Classes', 'Inheritance Hierarchies & is-a Relationship', 'Method Overriding vs Overloading'],
    13: ['Default vs Parameterized Constructors', 'Constructor Chaining with this()', 'super() Constructor Invocation', 'final and static Keywords'],
    14: ['public and private Access Control', 'protected and Package-Private Access', 'Package Structure & import Statements', 'Encapsulation Boundaries'],
    15: ['Command Line Interface Menus', 'Interactive User Input Processing', 'Console Output Formatting', 'Modular CLI Application Design'],
    16: ['Collection Hierarchy Overview', 'List Interface & ArrayList', 'LinkedList Operations', 'Set Interface & HashSet Uniqueness'],
    17: ['try-catch Block Architecture', 'finally Block & Resource Cleanup', 'throw vs throws Keywords', 'Custom User-Defined Exceptions'],
    18: ['File & Path Representations', 'FileReader & FileWriter I/O', 'BufferedReader & BufferedWriter', 'Byte Streams vs Character Streams'],
    19: ['Thread Lifecycle & States', 'Thread Creation via Thread and Runnable', 'Thread Synchronization & Locks', 'Deadlock Concepts & Mitigation'],
    20: ['Map Interface & Key-Value Pairs', 'HashMap Internals & Hashing', 'TreeMap Sorted Order', 'Iterating Map Entries & Keys'],
    21: ['String Immutability vs Mutability', 'StringBuilder for Efficient Append', 'StringBuffer & Thread-Safe Operations', 'String Pool & Performance Optimization'],
    22: ['JDBC Architecture & Drivers', 'DriverManager & Connection Setup', 'PreparedStatement & Parameterized Queries', 'ResultSet Processing & Resource Closing'],
    23: ['Enterprise Project Architecture', 'Modular Data Layer & Service Layer', 'Input Validation & Error Routing', 'End-to-End Application Flow']
  },
  python: {
    1: ['Python Design Philosophy & Execution', 'Python Interpreter & Interactive Shell', 'Script Execution & Environment Setup', 'Basic Output with print()'],
    2: ['Indentation Rules & Code Blocks', 'Comments & Docstrings', 'Line Continuation & Statements', 'Python Keywords & Identifiers'],
    3: ['Numeric Types (int, float, complex)', 'Booleans & Truth Value Testing', 'Dynamic Typing & Type Inferences', 'Explicit Type Casting (int(), str(), float())'],
    4: ['Arithmetic & Floor Division Operators', 'Comparison & Equality Operators', 'Logical Operators (and, or, not)', 'Identity & Membership Operators (is, in)'],
    5: ['if and elif Branching', 'else Fallback Execution', 'Nested Conditional Logic', 'Inline Conditional Expressions (Ternary)'],
    6: ['for Loops with range()', 'while Loops & Loop Conditions', 'break and continue Statements', 'else Clause on Loops'],
    7: ['String Indexing & Negative Slicing', 'String Formatting (f-strings & format())', 'String Methods (strip, split, join, replace)', 'String Search & Character Counts'],
    8: ['List Creation, Append, & Insert', 'List Indexing, Slicing, & Pop', 'Tuple Immutability & Tuples vs Lists', 'Tuple Packing & Unpacking'],
    9: ['Dictionary Key-Value Mapping', 'Dictionary Access (get, keys, values, items)', 'Set Uniqueness & Membership Testing', 'Set Math Operations (union, intersection, diff)'],
    10: ['Function Definition with def', 'Positional vs Keyword Arguments', 'Variable-Length Arguments (*args, **kwargs)', 'Lambda Anonymous Functions & Higher-Order Functions'],
    11: ['importing Modules & from-import Syntax', 'Standard Library Exploration (math, random, os)', 'Writing Custom Python Modules', 'The __name__ == "__main__" Idiom'],
    12: ['Opening Files with open() Modes (r, w, a)', 'Reading Files (read, readline, readlines)', 'Writing & Appending to Files', 'with Statement Context Managers'],
    13: ['try and except Blocks', 'Handling Specific Exception Types', 'else and finally Execution', 'Raising Custom Exceptions with raise'],
    14: ['Class Definition & Object Instantiation', 'The __init__ Constructor & self Keyword', 'Instance Attributes vs Class Attributes', 'Instance Methods & Encapsulation'],
    15: ['Single & Multi-level Inheritance', 'The super() Built-in Function', 'Method Overriding & Polymorphism', 'Multiple Inheritance & MRO (Method Resolution Order)'],
    16: ['Regular Expression Syntax & Patterns', 're.search() and re.match() Functions', 're.findall() and Group Capturing', 'Pattern Substitution with re.sub()'],
    17: ['Decorators as Function Wrappers', 'The @decorator Syntax', 'Generators & the yield Keyword', 'Generator Expressions vs List Comprehensions'],
    18: ['SQLite3 Built-in Database Module', 'Database Connection & Cursor Execution', 'Parameterized SQL Queries against Injection', 'Fetching Results (fetchone, fetchall) & Commit'],
    19: ['Real-Time Application Architecture', 'Modular Data Model & Service Functions', 'User Input Loops & CLI Interface', 'Persistent Data Storage & Execution Flow']
  },
  femnstack: {
    1: ['Client-Server Web Architecture', 'HTTP Request-Response Lifecycle', 'Role of HTML, CSS, and JavaScript', 'Web Standards & Modern Browsers'],
    2: ['HTML Document Structure (doctype, html, head, body)', 'Headings, Paragraphs, & Text Formatting', 'Lists, Anchors, & Images', 'Attributes (id, class, src, href, alt)'],
    3: ['HTML Form Elements (<form>, <input>, <select>, <textarea>)', 'Input Types (text, email, password, number)', 'HTML5 Form Validation (required, pattern, min/max)', 'Form Submission & Form Data'],
    4: ['Semantic Tags (<header>, <nav>, <main>, <section>, <article>, <aside>, <footer>)', 'Accessibility & SEO Benefits of Semantics', 'Document Outline & Hierarchy', 'Semantic vs Non-Semantic Containers'],
    5: ['Web Content Accessibility Guidelines (WCAG)', 'Accessible Form Labels & ARIA Attributes', 'Keyboard Navigability & Focus Management', 'Color Contrast & Screen Reader Optimization'],
    6: ['CSS Syntax: Selectors, Properties, & Values', 'Class, ID, & Element Selectors', 'Attribute Selectors & Combinators', 'The CSS Cascade & Specificity Rules'],
    7: ['The CSS Box Model (Content, Padding, Border, Margin)', 'box-sizing: border-box vs content-box', 'Display Properties (block, inline, inline-block, none)', 'CSS Positioning (static, relative, absolute, fixed, sticky)'],
    8: ['Flexbox Container & Main/Cross Axes', 'justify-content & align-items Alignment', 'flex-direction, flex-wrap, & flex-flow', 'Flex Item Properties (flex-grow, flex-shrink, flex-basis)'],
    9: ['CSS Grid Container & Grid Tracks', 'grid-template-columns & grid-template-rows', 'fr Fractional Units & repeat() Function', 'grid-gap & Grid Item Placement'],
    10: ['Responsive Viewport Meta Tag', 'CSS Media Queries (@media)', 'Breakpoints & Mobile-First Strategy', 'Fluid Typography & Responsive Images'],
    11: ['CSS Transitions (transition-property, duration, timing-function)', 'CSS Transforms (translate, rotate, scale, skew)', '@keyframes Rule for CSS Animations', 'animation-duration, iteration-count, & fill-mode'],
    12: ['var, let, and const Variable Declarations', 'Primitive Types (string, number, boolean, null, undefined, symbol)', 'Type Coercion & Strict Equality (=== vs ==)', 'Arrays, Objects, & References'],
    13: ['DOM Tree Structure & Node Selection (querySelector, getElementById)', 'Manipulating Elements (innerHTML, textContent, classList)', 'Event Listeners (addEventListener)', 'Event Bubbling, Capturing, & preventDefault()'],
    14: ['Arrow Functions & Lexical this', 'Destructuring Arrays & Objects', 'Spread & Rest Operators (...)', 'Promises, async/await, & fetch() API'],
    15: ['Node.js Architecture & V8 Engine', 'Node.js Event Loop & Non-Blocking I/O', 'npm Package Manager & package.json', 'CommonJS (require) vs ES Modules (import)'],
    16: ['Express Application Setup & Routing', 'Route Paths & HTTP Methods (GET, POST, PUT, DELETE)', 'Route Parameters (:id) & Query Strings (?key=value)', 'Structuring Express Route Handlers'],
    17: ['Express Middleware Architecture', 'Built-in Middleware (express.json, express.urlencoded)', 'Custom Application-Level Middleware', 'Error-Handling Middleware (err, req, res, next)'],
    18: ['Parsing Request Payloads with req.body', 'Sending JSON Responses with res.json()', 'HTTP Status Codes (200, 201, 400, 401, 404, 500)', 'Response Headers & Content Negotiation'],
    19: ['NoSQL Document Model vs Relational DBs', 'Connecting to MongoDB Atlas / Local', 'CRUD Operations (insertOne, find, updateOne, deleteOne)', 'MongoDB Query Operators ($eq, $gt, $in, $set)'],
    20: ['Mongoose Schemas & Field Definitions', 'Built-in Schema Validation Rules', 'Creating Mongoose Models', 'Querying & Saving with Mongoose Models'],
    21: ['REST Architectural Constraints', 'Resource Naming & URI Best Practices', 'CRUD to HTTP Verb Mapping', 'Consistent JSON Response Payloads'],
    22: ['Password Hashing with bcrypt', 'JSON Web Tokens (JWT) Architecture', 'Signing & Verifying Tokens', 'Protecting Routes with Auth Middleware'],
    23: ['React Component Tree & JSX Syntax', 'Passing Data with Props', 'State Management with useState Hook', 'Side Effects with useEffect Hook'],
    24: ['Fullstack Client-Server Integration', 'Connecting React to Express REST API with Axios', 'Handling CORS & Environment Variables', 'Fullstack CRUD Application Lifecycle']
  },
  selenium: {
    1: ['Selenium Architecture & Components (IDE, Grid, WebDriver)', 'WebDriver vs RemoteWebDriver Architecture', 'Browser Drivers (ChromeDriver, GeckoDriver)', 'Setting Up WebDriver System Properties'],
    2: ['Creating Java Project in Eclipse / IntelliJ', 'Managing Selenium Dependencies via Maven pom.xml', 'Initializing WebDriver Instance', 'Closing Browsers with driver.close() vs driver.quit()'],
    3: ['Encapsulation in Test Automation', 'Inheritance for BaseTest Class Design', 'Polymorphism with WebDriver Interface', 'Abstraction of Browser Interactions'],
    4: ['WebElement Interface & Methods', 'Finding Elements with driver.findElement() vs findElements()', 'Interacting with Elements (click(), sendKeys(), clear())', 'Retrieving Element State (isDisplayed(), isEnabled(), isSelected())'],
    5: ['Browser Navigation Methods (driver.get, navigate().to())', 'Browser History Navigation (back(), forward(), refresh())', 'Window Title & Current URL Verification (getTitle(), getCurrentUrl())', 'Managing Window Dimensions (maximize(), fullscreen())'],
    6: ['ID and Name Locators', 'ClassName and TagName Locators', 'LinkText and PartialLinkText Locators', 'Choosing Optimal Locator Strategy for Stability'],
    7: ['Basic XPath Syntax (//tag[@attr="val"])', 'XPath Functions (contains(), text(), starts-with())', 'XPath Axes (parent, child, following-sibling, ancestor)', 'CSS Selectors vs XPath Performance & Syntax'],
    8: ['Actions Class for Advanced User Interactions', 'Mouse Hover Actions (moveToElement())', 'Drag and Drop Operations (dragAndDrop())', 'Context Click (Right Click) and Double Click'],
    9: ['Thread.sleep() Drawbacks in Test Automation', 'Implicit Wait Configuration (implicitlyWait())', 'Explicit Wait with WebDriverWait & ExpectedConditions', 'FluentWait for Custom Polling & Exception Ignoring'],
    10: ['Handling JavaScript Alerts (driver.switchTo().alert())', 'Alert Methods (accept(), dismiss(), getText(), sendKeys())', 'Handling Multiple Browser Tabs & Windows', 'Window Handles (getWindowHandle(), getWindowHandles())'],
    11: ['Select Class for Dropdown Handling', 'selectByVisibleText(), selectByIndex(), selectByValue()', 'Handling Multi-Select Dropdowns', 'Retrieving Selected Options with getFirstSelectedOption()'],
    12: ['Page Object Model (POM) Design Philosophy', 'Separation of Page Locators from Test Scripts', 'Creating Modular Page Classes', 'PageFactory Pattern with @FindBy Annotations'],
    13: ['Keyword Driven Framework Architecture', 'Defining Action Keywords (click, type, verify)', 'Reading Test Keywords & Test Data from Excel/Properties', 'Building the Execution Engine'],
    14: ['TestNG Framework Architecture & testng.xml', 'TestNG Annotations (@Test, @BeforeMethod, @AfterMethod, @BeforeClass)', 'Hard Assertions vs Soft Assertions', 'TestNG Parameters & DataProvider for Data-Driven Testing'],
    15: ['Jenkins CI/CD Automation for Test Suites', 'Configuring Maven Build Steps in Jenkins', 'Scheduling Automated Nightly Test Runs', 'Generating & Emailing HTML Test Reports via Gmail SMTP'],
    16: ['Behavior Driven Development (BDD) Principles', 'Writing Feature Files with Gherkin (Given, When, Then, And)', 'Step Definition Implementation in Java', 'TestRunner Class Configuration with @CucumberOptions'],
    17: ['Capturing Screenshots on Test Failure with TakesScreenshot', 'JavaScriptExecutor for Direct DOM Scripts', 'Custom Exception Handling in Automation', 'Logging Test Execution with Log4j / Console Loggers']
  }
};

/**
 * Extract clean, verified syllabus topics for all modules of a course
 */
async function extractCourseSyllabusTopics(courseId) {
  const course = await Course.findById(courseId);
  if (!course) throw new Error(`Course not found: ${courseId}`);

  const dKey = (course.slug || course.domain || course.title).toLowerCase().replace(/[^a-z0-9]/g, '');
  let domainKey = 'java';
  if (dKey.includes('python')) domainKey = 'python';
  else if (dKey.includes('femn') || dKey.includes('mern') || dKey.includes('react') || dKey.includes('web')) domainKey = 'femnstack';
  else if (dKey.includes('selenium') || dKey.includes('test')) domainKey = 'selenium';
  else if (dKey.includes('java')) domainKey = 'java';

  const modules = await Module.find({
    $or: [{ courseId: course._id }, { domain: domainKey }]
  }).sort({ order: 1 });

  const result = [];

  for (const mod of modules) {
    let topics = [];

    // 1. Check if canonical mapping exists for this domain & module order
    if (CANONICAL_MODULE_TOPICS[domainKey] && CANONICAL_MODULE_TOPICS[domainKey][mod.order]) {
      topics = CANONICAL_MODULE_TOPICS[domainKey][mod.order];
    } else if (Array.isArray(mod.topics) && mod.topics.length > 0) {
      topics = mod.topics.filter(t => !isNoiseTopic(t)).map(cleanTopicName).filter(Boolean);
    }

    // 2. If still empty, derive clean subtopics from module title
    if (!topics || topics.length === 0) {
      const cleanModTitle = cleanTopicName(mod.title);
      topics = [
        `${cleanModTitle} Fundamentals & Core Syntax`,
        `${cleanModTitle} Operations & Method Architecture`,
        `${cleanModTitle} Practical Application & Best Practices`
      ];
    }

    // Ensure module has clean topics saved
    mod.topics = topics;
    mod.domain = domainKey;
    if (!mod.courseId) mod.courseId = course._id;
    await mod.save();

    result.push({
      moduleId: mod._id,
      moduleOrder: mod.order,
      moduleTitle: mod.title,
      topics
    });
  }

  return {
    courseId: course._id,
    courseTitle: course.title,
    domain: domainKey,
    modules: result
  };
}

module.exports = {
  extractCourseSyllabusTopics,
  CANONICAL_MODULE_TOPICS,
  cleanTopicName,
  isNoiseTopic
};
