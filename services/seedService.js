const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const TrainerProfile = require('../models/TrainerProfile');
const College = require('../models/College');
const Batch = require('../models/Batch');
const Course = require('../models/Course');
const Subject = require('../models/Subject');
const Game = require('../models/Game');
const GameLevel = require('../models/GameLevel');
const Challenge = require('../models/Challenge');
const Badge = require('../models/Badge');
const StudentBadge = require('../models/StudentBadge');
const Project = require('../models/Project');
const ProjectTask = require('../models/ProjectTask');
const DailyChallenge = require('../models/DailyChallenge');
const Attendance = require('../models/Attendance');
const Session = require('../models/Session');
const StudentTask = require('../models/StudentTask');
const TutorGuidance = require('../models/TutorGuidance');
const { seedInterviewQuestions } = require('./seedInterviewQuestions');
const { seedGameHubChallenges } = require('./seedGameHubChallenges');

async function seedDatabase() {
  console.log('[Seed] Checking database collections...');

  const userCount = await User.countDocuments();
  if (userCount > 0) {
    console.log(`[Seed] Database already has ${userCount} users. Ensuring games and badges exist...`);
  }

  // Clear existing if fresh seed requested
  await Promise.all([
    User.deleteMany({}),
    StudentProfile.deleteMany({}),
    TrainerProfile.deleteMany({}),
    College.deleteMany({}),
    Batch.deleteMany({}),
    Course.deleteMany({}),
    Subject.deleteMany({}),
    Game.deleteMany({}),
    GameLevel.deleteMany({}),
    Challenge.deleteMany({}),
    Badge.deleteMany({}),
    StudentBadge.deleteMany({}),
    Project.deleteMany({}),
    ProjectTask.deleteMany({}),
    DailyChallenge.deleteMany({}),
    Attendance.deleteMany({}),
    Session.deleteMany({}),
    StudentTask.deleteMany({}),
    TutorGuidance.deleteMany({})
  ]);

  console.log('[Seed] Cleaned database collections. Seeding fresh data...');

  // 1. Create Colleges
  const apexCollege = await College.create({
    name: 'Apex Institute of Technology',
    code: 'APEX-IT',
    city: 'San Francisco',
    departments: ['Computer Science', 'Information Technology', 'AI & Data Science'],
    contactEmail: 'admissions@apex-tech.edu'
  });

  const sviCollege = await College.create({
    name: 'Silicon Valley Institute of Engineering',
    code: 'SVI-ENG',
    city: 'San Jose',
    departments: ['Software Engineering', 'Cloud Systems'],
    contactEmail: 'contact@svi-eng.edu'
  });

  // 2. Create Users
  const adminUser = await User.create({
    name: 'Eleanor Vance (Admin)',
    username: 'admin01',
    email: 'admin01@codequest.com',
    password: 'Admin@123',
    role: 'admin',
    avatar: 'avatar-admin'
  });

  const trainerUser = await User.create({
    name: 'Prof. Marcus Miller (Tutor)',
    username: 'tutor01',
    email: 'tutor01@codequest.com',
    password: 'Tutor@123',
    role: 'tutor',
    avatar: 'avatar-trainer'
  });

  const student1 = await User.create({
    name: 'Alex Rivera',
    username: 'student01',
    email: 'student01@codequest.com',
    password: 'Student@123',
    role: 'student',
    avatar: 'avatar-cyber-1'
  });

  const student2 = await User.create({
    name: 'Sarah Tanaka',
    username: 'student02',
    email: 'sarah.t@codequest.it',
    password: 'Student@123',
    role: 'student',
    avatar: 'avatar-cyber-2'
  });

  const student3 = await User.create({
    name: 'Liam O\'Connor',
    username: 'student03',
    email: 'liam.o@codequest.it',
    password: 'Student@123',
    role: 'student',
    avatar: 'avatar-cyber-3'
  });

  // 3. Create Courses
  const fullStackJavaCourse = await Course.create({
    title: 'Full Stack Java Enterprise Developer',
    slug: 'full-stack-java',
    description: 'Comprehensive industry training covering Core Java, OOP, Spring Boot, REST APIs, Microservices, and React.',
    category: 'Backend & Enterprise',
    durationWeeks: 16,
    totalHours: 180,
    color: 'from-amber-600 to-red-600',
    icon: 'Coffee'
  });

  const mernCourse = await Course.create({
    title: 'MERN Stack Web Specialist',
    slug: 'mern-stack',
    description: 'Master MongoDB, Express, React, and Node.js with modern production workflows and cloud deployments.',
    category: 'Full Stack',
    durationWeeks: 14,
    totalHours: 150,
    color: 'from-blue-600 to-cyan-600',
    icon: 'Code'
  });

  const pythonAiCourse = await Course.create({
    title: 'Python AI & Data Engineering',
    slug: 'python-ai',
    description: 'Python fundamentals, OOP, NumPy, Pandas, Data Pipelines, and Machine Learning integration.',
    category: 'Data & AI',
    durationWeeks: 12,
    totalHours: 140,
    color: 'from-emerald-600 to-teal-600',
    icon: 'Brain'
  });

  const dsaCourse = await Course.create({
    title: 'Data Structures & Algorithms Mastery',
    slug: 'dsa-mastery',
    description: 'Conquer arrays, linked lists, binary trees, dynamic programming, and interview-grade problem solving.',
    category: 'Computer Science',
    durationWeeks: 10,
    totalHours: 100,
    color: 'from-purple-600 to-pink-600',
    icon: 'Cpu'
  });

  // 4. Create Batches
  const batchAlpha = await Batch.create({
    name: 'Batch 2026-Alpha (Java Full Stack)',
    code: 'B-2026-ALPHA',
    collegeId: apexCollege._id,
    courseId: fullStackJavaCourse._id,
    trainerId: trainerUser._id,
    startDate: new Date('2026-08-01'),
    endDate: new Date('2026-11-30'),
    status: 'active',
    totalStudents: 28,
    averageScore: 84
  });

  const batchBeta = await Batch.create({
    name: 'Batch 2026-Beta (Python & DSA)',
    code: 'B-2026-BETA',
    collegeId: sviCollege._id,
    courseId: pythonAiCourse._id,
    trainerId: trainerUser._id,
    startDate: new Date('2026-08-15'),
    endDate: new Date('2026-12-15'),
    status: 'active',
    totalStudents: 32,
    averageScore: 88
  });

  // 5. Create Profiles
  await TrainerProfile.create({
    userId: trainerUser._id,
    specializations: ['Java', 'Spring Boot', 'Data Structures', 'System Design'],
    assignedColleges: [apexCollege._id, sviCollege._id],
    assignedBatches: [batchAlpha._id, batchBeta._id],
    assignedStudents: [student1._id, student2._id],
    title: 'Principal Technical Trainer'
  });

  const alexProfile = await StudentProfile.create({
    userId: student1._id,
    collegeId: apexCollege._id,
    batchId: batchAlpha._id,
    enrolledCourseId: fullStackJavaCourse._id,
    assignedTutorId: trainerUser._id,
    totalXp: 850,
    currentLevel: { level: 4, title: 'Developer', icon: '💻' },
    stats: {
      challengesSolved: 24,
      totalAttempts: 29,
      accuracyRate: 88,
      timeSpentMinutes: 340,
      dailyChallengesCompleted: 4,
      projectsSubmitted: 1
    },
    strongTopics: ['CSS Flexbox', 'Java OOP', 'SQL Queries'],
    weakTopics: ['Binary Search Trees', 'Recursion'],
    learningJourney: {
      currentSubjectTitle: 'Core Java Fundamentals',
      currentTopic: 'Java OOP - Inheritance & Polymorphism',
      nextSuggestedTopic: 'Exception Handling & Custom Exceptions',
      completedTopics: [
        { topicTitle: 'Java Syntax & Data Types', completedAt: new Date(Date.now() - 7 * 86400000) },
        { topicTitle: 'Control Structures & Loops', completedAt: new Date(Date.now() - 5 * 86400000) },
        { topicTitle: 'Methods & Scope', completedAt: new Date(Date.now() - 3 * 86400000) },
        { topicTitle: 'Classes & Objects', completedAt: new Date(Date.now() - 1 * 86400000) }
      ]
    }
  });

  await StudentProfile.create({
    userId: student2._id,
    collegeId: apexCollege._id,
    batchId: batchAlpha._id,
    enrolledCourseId: fullStackJavaCourse._id,
    totalXp: 1240,
    currentLevel: { level: 5, title: 'Problem Solver', icon: '🧩' },
    stats: {
      challengesSolved: 35,
      totalAttempts: 38,
      accuracyRate: 92,
      timeSpentMinutes: 480,
      dailyChallengesCompleted: 7,
      projectsSubmitted: 2
    },
    strongTopics: ['React State', 'Flexbox', 'Dynamic Programming'],
    weakTopics: ['Cloud Architecture']
  });

  await StudentProfile.create({
    userId: student3._id,
    collegeId: sviCollege._id,
    batchId: batchBeta._id,
    enrolledCourseId: pythonAiCourse._id,
    totalXp: 620,
    currentLevel: { level: 3, title: 'Learner', icon: '📚' },
    stats: {
      challengesSolved: 18,
      totalAttempts: 23,
      accuracyRate: 78,
      timeSpentMinutes: 260,
      dailyChallengesCompleted: 2,
      projectsSubmitted: 1
    },
    strongTopics: ['Python Dictionaries', 'Git Commands'],
    weakTopics: ['Graph Traversals']
  });

  // 6. Create Badges
  const badgesList = [
    { name: 'First Challenge', slug: 'first-challenge', description: 'Solved your very first coding game challenge!', icon: 'Award', color: 'from-yellow-400 to-amber-600', criteria: { type: 'challenges_count', targetValue: 1 }, xpBonus: 25 },
    { name: '7 Day Streak', slug: '7-day-streak', description: 'Logged in and solved challenges 7 consecutive days!', icon: 'Flame', color: 'from-orange-500 to-red-600', criteria: { type: 'streak_days', targetValue: 7 }, xpBonus: 100 },
    { name: '100 Problems Solved', slug: '100-problems', description: 'A true coding titan - conquered 100 challenges!', icon: 'Trophy', color: 'from-amber-400 to-yellow-600', criteria: { type: 'challenges_count', targetValue: 100 }, xpBonus: 250 },
    { name: 'CSS Master', slug: 'css-master', description: 'Mastered Flexbox, Grid, Box Model, and responsive layouts.', icon: 'Palette', color: 'from-blue-400 to-indigo-600', criteria: { type: 'challenges_count', targetValue: 5, targetGameSlug: 'css-arena' }, xpBonus: 75 },
    { name: 'Java Beginner', slug: 'java-beginner', description: 'Wrote and debugged foundational Java programs.', icon: 'Coffee', color: 'from-amber-500 to-red-600', criteria: { type: 'challenges_count', targetValue: 3, targetGameSlug: 'java-quest' }, xpBonus: 50 },
    { name: 'Java Master', slug: 'java-master', description: 'Conquered advanced Java OOP, interfaces, and collections.', icon: 'Zap', color: 'from-red-500 to-orange-600', criteria: { type: 'challenges_count', targetValue: 15, targetGameSlug: 'java-quest' }, xpBonus: 150 },
    { name: 'Python Explorer', slug: 'python-explorer', description: 'Mastered Python syntax, comprehensions, and data structures.', icon: 'Terminal', color: 'from-emerald-400 to-teal-600', criteria: { type: 'challenges_count', targetValue: 5, targetGameSlug: 'python-island' }, xpBonus: 60 },
    { name: 'DSA Solver', slug: 'dsa-solver', description: 'Demonstrated algorithmic thinking and data structure mastery.', icon: 'Brain', color: 'from-purple-500 to-pink-600', criteria: { type: 'challenges_count', targetValue: 5, targetGameSlug: 'dsa-battle' }, xpBonus: 90 },
    { name: 'SQL Detective', slug: 'sql-detective', description: 'Cracked relational database queries and complex filtering.', icon: 'Database', color: 'from-cyan-400 to-blue-600', criteria: { type: 'challenges_count', targetValue: 5, targetGameSlug: 'sql-detective' }, xpBonus: 70 },
    { name: 'React Developer', slug: 'react-dev', description: 'Constructed responsive components, state hooks, and routers.', icon: 'Atom', color: 'from-cyan-400 to-sky-600', criteria: { type: 'challenges_count', targetValue: 5, targetGameSlug: 'react-lab' }, xpBonus: 80 },
    { name: 'Git Battle Veteran', slug: 'git-veteran', description: 'Navigated branch merges, commits, and collaborative git trees.', icon: 'GitBranch', color: 'from-orange-500 to-amber-600', criteria: { type: 'challenges_count', targetValue: 4, targetGameSlug: 'git-battle' }, xpBonus: 50 },
    { name: 'Cloud Explorer', slug: 'cloud-explorer', description: 'Architected scalable cloud pipelines with S3, EC2, and CloudFront.', icon: 'Cloud', color: 'from-sky-400 to-indigo-600', criteria: { type: 'challenges_count', targetValue: 4, targetGameSlug: 'cloud-mission' }, xpBonus: 85 },
    { name: 'Real Project Builder', slug: 'project-builder', description: 'Delivered an industry-grade real-world project to production.', icon: 'Layers', color: 'from-emerald-500 to-green-600', criteria: { type: 'project_count', targetValue: 1 }, xpBonus: 150 }
  ];

  const createdBadges = await Badge.insertMany(badgesList);

  // Link initial badge to Alex & Sarah
  await StudentBadge.create({ studentId: student1._id, badgeId: createdBadges[0]._id });
  await StudentBadge.create({ studentId: student1._id, badgeId: createdBadges[3]._id });
  await StudentBadge.create({ studentId: student2._id, badgeId: createdBadges[0]._id });
  await StudentBadge.create({ studentId: student2._id, badgeId: createdBadges[1]._id });

  // 7. Create 11 Games
  const gamesData = [
    {
      title: 'CSS Arena',
      slug: 'css-arena',
      tagline: 'Visual CSS Layout & Styling Battlefield',
      description: 'Master Flexbox, Grid, Box Model, transforms, and animations by positioning elements into visual target zones.',
      category: 'Frontend',
      icon: 'Palette',
      difficulty: 'All Levels',
      badgeRewardName: 'CSS Master',
      themeColor: { primary: '#3b82f6', accent: '#60a5fa', gradient: 'from-blue-600 to-indigo-600' },
      order: 1
    },
    {
      title: 'Java Quest',
      slug: 'java-quest',
      tagline: 'Enterprise OOP & Logic Battleground',
      description: 'Solve output predictions, debug broken runtime logic, assemble code blocks, and write clean Java methods.',
      category: 'Backend',
      icon: 'Coffee',
      difficulty: 'All Levels',
      badgeRewardName: 'Java Master',
      themeColor: { primary: '#f97316', accent: '#fb923c', gradient: 'from-amber-600 to-orange-600' },
      order: 2
    },
    {
      title: 'Python Island',
      slug: 'python-island',
      tagline: 'Algorithmic Scripting & Data Mastery',
      description: 'Journey through lists, tuples, comprehensions, lambdas, and OOP challenges in an interactive sandbox.',
      category: 'Backend',
      icon: 'Terminal',
      difficulty: 'All Levels',
      badgeRewardName: 'Python Explorer',
      themeColor: { primary: '#10b981', accent: '#34d399', gradient: 'from-emerald-600 to-teal-600' },
      order: 3
    },
    {
      title: 'DSA Battle',
      slug: 'dsa-battle',
      tagline: 'Interactive Algorithm & Complexity Arena',
      description: 'Visualize sorting algorithms step-by-step, predict LIFO stack traversals, and conquer Big-O complexity challenges.',
      category: 'Data Structures',
      icon: 'Brain',
      difficulty: 'Intermediate',
      badgeRewardName: 'DSA Solver',
      themeColor: { primary: '#8b5cf6', accent: '#a78bfa', gradient: 'from-purple-600 to-pink-600' },
      order: 4
    },
    {
      title: 'JavaScript Reactor',
      slug: 'javascript-reactor',
      tagline: 'Async, DOM & ES6 Nuclear Reactions',
      description: 'Harness closures, event loops, Promises, async/await, and DOM manipulation to power up your reactors.',
      category: 'Frontend',
      icon: 'Zap',
      difficulty: 'All Levels',
      badgeRewardName: 'Reactor Specialist',
      themeColor: { primary: '#eab308', accent: '#fde047', gradient: 'from-yellow-500 to-amber-600' },
      order: 5
    },
    {
      title: 'HTML Builder',
      slug: 'html-builder',
      tagline: 'Architect Semantic Web Layouts',
      description: 'Build correct, accessible, and structured DOM trees matching visual wireframe blueprints.',
      category: 'Frontend',
      icon: 'Layout',
      difficulty: 'Beginner',
      badgeRewardName: 'Layout Architect',
      themeColor: { primary: '#ec4899', accent: '#f472b6', gradient: 'from-pink-500 to-rose-600' },
      order: 6
    },
    {
      title: 'SQL Detective',
      slug: 'sql-detective',
      tagline: 'Investigate Database Records & Queries',
      description: 'Solve real institute data mysteries by writing SELECT queries, WHERE filters, GROUP BY aggregations, and JOINs.',
      category: 'Database',
      icon: 'Database',
      difficulty: 'All Levels',
      badgeRewardName: 'SQL Detective',
      themeColor: { primary: '#06b6d4', accent: '#22d3ee', gradient: 'from-cyan-600 to-blue-600' },
      order: 7
    },
    {
      title: 'React Lab',
      slug: 'react-lab',
      tagline: 'Component State & Hook Laboratories',
      description: 'Diagnose broken React components, configure custom hooks, fix re-render loops, and pass props seamlessly.',
      category: 'Frontend',
      icon: 'Atom',
      difficulty: 'Intermediate',
      badgeRewardName: 'React Developer',
      themeColor: { primary: '#0284c7', accent: '#38bdf8', gradient: 'from-sky-600 to-cyan-500' },
      order: 8
    },
    {
      title: 'Git Battle',
      slug: 'git-battle',
      tagline: 'Branching, Merges & Conflict Warfare',
      description: 'Navigate terminal git missions, resolve merge conflicts, handle staging trees, and manage collaborative branches.',
      category: 'DevOps & Cloud',
      icon: 'GitBranch',
      difficulty: 'Intermediate',
      badgeRewardName: 'Git Battle Veteran',
      themeColor: { primary: '#ea580c', accent: '#f97316', gradient: 'from-orange-600 to-amber-600' },
      order: 9
    },
    {
      title: 'Cloud Mission',
      slug: 'cloud-mission',
      tagline: 'Design Scalable Cloud Architectures',
      description: 'Assemble live cloud topologies connecting CDNs, S3 storage, microservices, and databases under strict latency rules.',
      category: 'DevOps & Cloud',
      icon: 'Cloud',
      difficulty: 'Advanced',
      badgeRewardName: 'Cloud Explorer',
      themeColor: { primary: '#6366f1', accent: '#818cf8', gradient: 'from-indigo-600 to-blue-600' },
      order: 10
    },
    {
      title: 'Full Stack Challenge',
      slug: 'fullstack-challenge',
      tagline: 'End-to-End Enterprise Missions',
      description: 'Bridge frontend user interfaces with secure backend REST APIs and database transactions across simulated servers.',
      category: 'Full Stack',
      icon: 'Layers',
      difficulty: 'Expert',
      badgeRewardName: 'Full Stack Builder',
      themeColor: { primary: '#059669', accent: '#10b981', gradient: 'from-emerald-600 to-cyan-700' },
      order: 11
    }
  ];

  const createdGames = await Game.insertMany(gamesData);
  const gameMap = {};
  createdGames.forEach(g => { gameMap[g.slug] = g; });

  // 8. Create Challenges & Levels for all 11 games
  const challengesToCreate = [
    // CSS Arena - Level 1
    {
      title: 'Center the Box with Flexbox',
      gameSlug: 'css-arena',
      levelNumber: 1,
      category: 'Flexbox',
      difficulty: 'Beginner',
      type: 'css_rendering',
      instructions: 'Move the inner blue box into the dead center of the dark preview container using CSS Flexbox properties.',
      targetDescription: 'Center the target element both horizontally and vertically inside .container',
      starterCode: `.container {\n  display: block;\n  /* Your CSS Flexbox code here */\n}`,
      solutionCode: `.container {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n}`,
      targetCondition: {
        '.container': {
          'display': 'flex',
          'justify-content': 'center',
          'align-items': 'center'
        }
      },
      initialHtml: `<div class="container"><div class="box">Target Box</div></div>`,
      hints: [
        { hintText: 'Set display to flex on the parent .container', xpPenalty: 5 },
        { hintText: 'Use justify-content: center for horizontal and align-items: center for vertical centering', xpPenalty: 5 }
      ],
      xpReward: 25,
      timeLimitSeconds: 120,
      order: 1
    },
    // CSS Arena - Level 2
    {
      title: 'Space Between Navigation Bar',
      gameSlug: 'css-arena',
      levelNumber: 2,
      category: 'Flexbox',
      difficulty: 'Beginner',
      type: 'css_rendering',
      instructions: 'Distribute the navigation links evenly across the navbar with maximum spacing between them.',
      targetDescription: 'Align items with space-between on the flex container',
      starterCode: `.navbar {\n  display: flex;\n  /* Add property to distribute items with space between */\n}`,
      solutionCode: `.navbar {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n}`,
      targetCondition: {
        '.navbar': {
          'display': 'flex',
          'justify-content': 'space-between'
        }
      },
      initialHtml: `<div class="navbar"><span>Logo</span><span>Courses</span><span>Profile</span></div>`,
      hints: [
        { hintText: 'Use justify-content with the space-between value', xpPenalty: 5 }
      ],
      xpReward: 30,
      timeLimitSeconds: 120,
      order: 2
    },
    // CSS Arena - Level 3
    {
      title: 'CSS 3-Column Grid Layout',
      gameSlug: 'css-arena',
      levelNumber: 3,
      category: 'Grid',
      difficulty: 'Intermediate',
      type: 'css_rendering',
      instructions: 'Create a 3-column CSS Grid where each column takes 1 fraction of the available space, with a 16px gap between items.',
      targetDescription: 'Use display: grid, grid-template-columns: repeat(3, 1fr), and gap: 16px',
      starterCode: `.grid-container {\n  display: block;\n  /* Configure 3-column CSS Grid */\n}`,
      solutionCode: `.grid-container {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  gap: 16px;\n}`,
      targetCondition: {
        '.grid-container': {
          'display': 'grid',
          'gap': '16px'
        }
      },
      initialHtml: `<div class="grid-container"><div>Card 1</div><div>Card 2</div><div>Card 3</div></div>`,
      hints: [
        { hintText: 'Set display: grid and configure grid-template-columns', xpPenalty: 5 },
        { hintText: 'Set gap: 16px for card separation', xpPenalty: 5 }
      ],
      xpReward: 35,
      timeLimitSeconds: 150,
      order: 3
    },

    // Java Quest - Level 1
    {
      title: 'String Immutability & Concat',
      gameSlug: 'java-quest',
      levelNumber: 1,
      category: 'Strings',
      difficulty: 'Beginner',
      type: 'output_prediction',
      instructions: 'Analyze the following Java code snippet carefully. What will be printed to the console?\n\n```java\nString s = "CodeQuest";\ns.concat(" Institute");\nSystem.out.println(s);\n```',
      targetDescription: 'Predict the exact console output of the code',
      expectedOutput: 'CodeQuest',
      mcqOptions: [
        { id: 'a', text: 'CodeQuest Institute', isCorrect: false },
        { id: 'b', text: 'CodeQuest', isCorrect: true },
        { id: 'c', text: 'null', isCorrect: false },
        { id: 'd', text: 'Compilation Error', isCorrect: false }
      ],
      hints: [
        { hintText: 'Remember that String objects in Java are immutable. Does s.concat() reassign s?', xpPenalty: 5 }
      ],
      xpReward: 20,
      timeLimitSeconds: 90,
      order: 1
    },
    // Java Quest - Level 2
    {
      title: 'Fix the NullPointerException',
      gameSlug: 'java-quest',
      levelNumber: 2,
      category: 'Exception Handling',
      difficulty: 'Beginner',
      type: 'debugging',
      instructions: 'The following Java method crashes when an uninitialized student name is passed. Fix the code so it returns "Guest" when name is null.',
      starterCode: `public class StudentGreeting {\n    public static String greet(String name) {\n        // Fix bug here:\n        return "Hello, " + name.toUpperCase();\n    }\n}`,
      solutionCode: `public class StudentGreeting {\n    public static String greet(String name) {\n        if (name == null) return "Hello, Guest";\n        return "Hello, " + name.toUpperCase();\n    }\n}`,
      testCases: [
        { input: 'Alex', expectedOutput: 'Hello, ALEX' },
        { input: null, expectedOutput: 'Hello, Guest' }
      ],
      hints: [
        { hintText: 'Check if name is null before invoking methods on it', xpPenalty: 5 }
      ],
      xpReward: 30,
      timeLimitSeconds: 120,
      order: 2
    },

    // Python Island - Level 1
    {
      title: 'Even Numbers List Comprehension',
      gameSlug: 'python-island',
      levelNumber: 1,
      category: 'Lists & Comprehensions',
      difficulty: 'Beginner',
      type: 'code_completion',
      instructions: 'Complete the Python function using a single list comprehension to return all even numbers from the given input list.',
      starterCode: `def get_even_numbers(numbers):\n    # Complete list comprehension:\n    return [n for n in numbers if ...]\n`,
      solutionCode: `def get_even_numbers(numbers):\n    return [n for n in numbers if n % 2 == 0]\n`,
      testCases: [
        { input: '[1, 2, 3, 4, 5, 6]', expectedOutput: '[2, 4, 6]' },
        { input: '[11, 13, 15]', expectedOutput: '[]' }
      ],
      hints: [
        { hintText: 'Use the modulo operator % 2 == 0', xpPenalty: 5 }
      ],
      xpReward: 25,
      timeLimitSeconds: 120,
      order: 1
    },

    // DSA Battle - Level 1
    {
      title: 'Browser History Navigation (Stack LIFO)',
      gameSlug: 'dsa-battle',
      levelNumber: 1,
      category: 'Stack',
      difficulty: 'Beginner',
      type: 'visual_dsa',
      instructions: 'A user browsed: Google -> YouTube -> Instagram -> GitHub. The browser stores these pages in a Stack. If the user clicks the BACK button twice, which page will be displayed?',
      targetDescription: 'Understand LIFO (Last In First Out) behavior of Call & History Stacks',
      expectedOutput: 'YouTube',
      mcqOptions: [
        { id: 'a', text: 'GitHub', isCorrect: false },
        { id: 'b', text: 'Instagram', isCorrect: false },
        { id: 'c', text: 'YouTube', isCorrect: true },
        { id: 'd', text: 'Google', isCorrect: false }
      ],
      hints: [
        { hintText: 'GitHub was popped on the 1st back click. Instagram was popped on the 2nd.', xpPenalty: 5 }
      ],
      xpReward: 25,
      timeLimitSeconds: 90,
      order: 1
    },
    // DSA Battle - Level 2
    {
      title: 'Time Complexity of Binary Search',
      gameSlug: 'dsa-battle',
      levelNumber: 2,
      category: 'Complexity Analysis',
      difficulty: 'Intermediate',
      type: 'mcq',
      instructions: 'What is the worst-case time complexity of Binary Search on a sorted array of size n, and why?',
      expectedOutput: 'O(log n)',
      mcqOptions: [
        { id: 'a', text: 'O(1) - Constant time lookups', isCorrect: false },
        { id: 'b', text: 'O(log n) - Search space divides by half each iteration', isCorrect: true },
        { id: 'c', text: 'O(n) - Linear traversal across all elements', isCorrect: false },
        { id: 'd', text: 'O(n log n) - Sorting plus traversal', isCorrect: false }
      ],
      hints: [
        { hintText: 'At each comparison, half of the array is discarded.', xpPenalty: 5 }
      ],
      xpReward: 30,
      timeLimitSeconds: 60,
      order: 2
    },

    // SQL Detective - Level 1
    {
      title: 'Find High Achieving Students',
      gameSlug: 'sql-detective',
      levelNumber: 1,
      category: 'SELECT & WHERE',
      difficulty: 'Beginner',
      type: 'sql_query',
      instructions: 'The dean needs a list of all students who scored above 80 marks. Write a query against the `students` table.',
      targetDescription: 'Select all student records where mark > 80',
      starterCode: `-- Find students who scored above 80\nSELECT * FROM students\nWHERE ...;`,
      solutionCode: `SELECT * FROM students WHERE mark > 80;`,
      targetCondition: {
        expectedRowCount: 5,
        requiredKeywords: ['select', 'where']
      },
      hints: [
        { hintText: 'Use WHERE mark > 80', xpPenalty: 5 }
      ],
      xpReward: 25,
      timeLimitSeconds: 120,
      order: 1
    },

    // JavaScript Reactor - Level 1
    {
      title: 'Fix Event Loop & Closure Timeout',
      gameSlug: 'javascript-reactor',
      levelNumber: 1,
      category: 'Closures & Scope',
      difficulty: 'Intermediate',
      type: 'debugging',
      instructions: 'The loop below uses `var`, causing it to log `3` three times instead of `0, 1, 2`. Fix it using modern ES6 block scoping.',
      starterCode: `function runLoop() {\n  var results = [];\n  for (var i = 0; i < 3; i++) {\n    results.push(i);\n  }\n  return results;\n}`,
      solutionCode: `function runLoop() {\n  const results = [];\n  for (let i = 0; i < 3; i++) {\n    results.push(i);\n  }\n  return results;\n}`,
      testCases: [
        { input: '', expectedOutput: '[0,1,2]' }
      ],
      hints: [
        { hintText: 'Change var i to let i to create a block-scoped variable binding per loop iteration', xpPenalty: 5 }
      ],
      xpReward: 30,
      timeLimitSeconds: 90,
      order: 1
    },

    // HTML Builder - Level 1
    {
      title: 'Semantic Web Article Architecture',
      gameSlug: 'html-builder',
      levelNumber: 1,
      category: 'Semantic HTML',
      difficulty: 'Beginner',
      type: 'code_completion',
      instructions: 'Construct a semantic HTML document structure with a header, main section containing an article with h1 and p, and a footer.',
      starterCode: `<!-- Build semantic layout -->\n<header>\n  <h1>CodeQuest</h1>\n</header>\n<main>\n  <!-- Add article tag with content -->\n</main>\n<footer>\n  <p>© 2026 CodeQuest</p>\n</footer>`,
      solutionCode: `<header><h1>CodeQuest</h1></header><main><article><h2>Learning Games</h2><p>Interactive mastery</p></article></main><footer><p>© 2026 CodeQuest</p></footer>`,
      targetCondition: {
        requiredTags: ['header', 'main', 'article', 'footer']
      },
      hints: [
        { hintText: 'Include <article> inside <main>', xpPenalty: 5 }
      ],
      xpReward: 20,
      timeLimitSeconds: 120,
      order: 1
    },

    // React Lab - Level 1
    {
      title: 'Counter State with useState Hook',
      gameSlug: 'react-lab',
      levelNumber: 1,
      category: 'Hooks & State',
      difficulty: 'Beginner',
      type: 'code_completion',
      instructions: 'Complete the React Counter component so clicking the button increments the count state by 1.',
      starterCode: `import React, { useState } from 'react';\n\nexport default function Counter() {\n  const [count, setCount] = useState(0);\n\n  const handleIncrement = () => {\n    // Increment count here\n  };\n\n  return (\n    <button onClick={handleIncrement}>\n      Count: {count}\n    </button>\n  );\n}`,
      solutionCode: `import React, { useState } from 'react';\n\nexport default function Counter() {\n  const [count, setCount] = useState(0);\n  const handleIncrement = () => setCount(prev => prev + 1);\n  return <button onClick={handleIncrement}>Count: {count}</button>;\n}`,
      hints: [
        { hintText: 'Call setCount(count + 1) or setCount(prev => prev + 1)', xpPenalty: 5 }
      ],
      xpReward: 25,
      timeLimitSeconds: 120,
      order: 1
    },

    // Git Battle - Level 1
    {
      title: 'Stage and Commit Modified Files',
      gameSlug: 'git-battle',
      levelNumber: 1,
      category: 'Basic Commands',
      difficulty: 'Beginner',
      type: 'git_scenario',
      instructions: 'You modified 3 files in your working directory. Stage all changed files and create a commit with message "feat: init platform".',
      targetDescription: 'Run the correct Git commands in sequence',
      gitScenario: {
        initialGraph: [{ id: 'c1', label: 'Initial commit', branch: 'main' }],
        targetGoal: 'All changes staged and committed to main',
        availableCommands: ['git add .', 'git commit -m "feat: init platform"', 'git push origin main', 'git checkout -b feature']
      },
      solutionCode: `git add .\ngit commit -m "feat: init platform"`,
      hints: [
        { hintText: 'First stage with git add ., then commit with git commit -m "..."', xpPenalty: 5 }
      ],
      xpReward: 25,
      timeLimitSeconds: 90,
      order: 1
    },

    // Cloud Mission - Level 1
    {
      title: 'Static Web CDN Topology',
      gameSlug: 'cloud-mission',
      levelNumber: 1,
      category: 'AWS & CDN',
      difficulty: 'Intermediate',
      type: 'cloud_arch',
      instructions: 'Connect the client traffic pipeline for a high-performance web asset distribution system: User -> CloudFront CDN -> S3 Bucket.',
      targetDescription: 'Link nodes: User -> CloudFront -> S3 Bucket',
      cloudArchitecture: {
        availableNodes: [
          { id: 'user', label: 'End User', nodeType: 'client', icon: 'User' },
          { id: 'cf', label: 'CloudFront CDN', nodeType: 'cdn', icon: 'Globe' },
          { id: 's3', label: 'S3 Static Assets', nodeType: 'storage', icon: 'HardDrive' },
          { id: 'rds', label: 'RDS Database', nodeType: 'database', icon: 'Database' }
        ],
        requiredConnections: [
          { from: 'user', to: 'cf' },
          { from: 'cf', to: 's3' }
        ]
      },
      solutionCode: `user -> cf -> s3`,
      hints: [
        { hintText: 'User requests should hit CloudFront edge locations before falling back to S3 origin', xpPenalty: 5 }
      ],
      xpReward: 35,
      timeLimitSeconds: 120,
      order: 1
    },

    // Full Stack Challenge - Level 1
    {
      title: 'REST API Student Registration Endpoint',
      gameSlug: 'fullstack-challenge',
      levelNumber: 1,
      category: 'REST & Express',
      difficulty: 'Advanced',
      type: 'fullstack_mission',
      instructions: 'Implement an Express.js POST route `/api/students` that accepts `{ name, email }`, validates input presence, and returns a 201 Created status with JSON payload.',
      starterCode: `app.post('/api/students', (req, res) => {\n  const { name, email } = req.body;\n  // Validate and respond with status 201\n});`,
      solutionCode: `app.post('/api/students', (req, res) => {\n  const { name, email } = req.body;\n  if (!name || !email) {\n    return res.status(400).json({ error: 'Missing required fields' });\n  }\n  return res.status(201).json({ success: true, student: { name, email } });\n});`,
      hints: [
        { hintText: 'Check if !name || !email, return 400. Otherwise return res.status(201).json(...)', xpPenalty: 5 }
      ],
      xpReward: 50,
      timeLimitSeconds: 180,
      order: 1
    }
  ];

  const createdChallenges = await Challenge.insertMany(challengesToCreate);
  console.log(`[Seed] Seeded ${createdChallenges.length} challenges across 11 games.`);

  // 9. Create Projects & Project Tasks
  const smsProject = await Project.create({
    title: 'Enterprise Student Management Portal',
    slug: 'enterprise-sms',
    category: 'Industry Project',
    description: 'A complete institute portal handling course enrollments, attendance records, role-based dashboards, and automated PDF report cards.',
    technologies: ['React', 'Node.js', 'Express', 'MongoDB', 'Tailwind CSS', 'JWT'],
    requirements: [
      'JWT Authentication with Student/Trainer/Admin roles',
      'Attendance tracking module with exportable CSV/PDF',
      'Real-time grade calculation and marks entry',
      'Interactive student performance analytics dashboard'
    ],
    difficulty: 'Industry Level',
    xpReward: 350,
    estimatedHours: 40,
    courseId: fullStackJavaCourse._id,
    assignedStudentId: student1._id,
    assignedBatchId: batchAlpha._id,
    teamMembers: [student1._id, student2._id],
    githubRepoUrl: 'https://github.com/codequest-institute/student-management-portal',
    liveDemoUrl: 'https://sms-codequest.demo.app',
    progressPercentage: 65,
    status: 'In Progress',
    grade: 'Pending',
    trainerFeedback: 'Great database schema and API structure. Ensure input sanitization is complete before deployment review.'
  });

  await ProjectTask.create([
    { projectId: smsProject._id, title: 'Design MongoDB User & Batch Schemas', status: 'Completed', assignedTo: student1._id, xpAwarded: true },
    { projectId: smsProject._id, title: 'Implement JWT Auth & Middleware', status: 'Completed', assignedTo: student1._id, xpAwarded: true },
    { projectId: smsProject._id, title: 'Build React Role-Based Dashboard', status: 'In Progress', assignedTo: student2._id, xpAwarded: false },
    { projectId: smsProject._id, title: 'Integrate PDF Export for Attendance', status: 'Todo', assignedTo: student1._id, xpAwarded: false }
  ]);

  const ecommerceProject = await Project.create({
    title: 'Aquarium & Pet Tech E-Commerce',
    slug: 'aquarium-ecommerce',
    category: 'Major Project',
    description: 'Specialized e-commerce storefront with live tank water chemistry guides, product filtering, shopping cart, and Stripe integration.',
    technologies: ['React', 'Redux Toolkit', 'Node.js', 'Stripe', 'MongoDB'],
    requirements: [
      'Product catalog with faceted filter (species, tank size, price)',
      'Shopping cart with local storage persistence',
      'Secure payment processing with Stripe webhook verification'
    ],
    difficulty: 'Advanced',
    xpReward: 300,
    estimatedHours: 35,
    courseId: mernCourse._id,
    assignedStudentId: student2._id,
    assignedBatchId: batchAlpha._id,
    progressPercentage: 80,
    status: 'Under Review',
    grade: 'A',
    trainerFeedback: 'Exceptional UI polish and smooth payment workflow. Approved for deployment.'
  });

  // 10. Create Daily Challenge for today
  const todayStr = new Date().toISOString().split('T')[0];
  const javaChallenge = createdChallenges.find(c => c.gameSlug === 'java-quest');
  const pythonChallenge = createdChallenges.find(c => c.gameSlug === 'python-island');
  const dsaChallenge = createdChallenges.find(c => c.gameSlug === 'dsa-battle');
  const cssChallenge = createdChallenges.find(c => c.gameSlug === 'css-arena');

  await DailyChallenge.create({
    date: todayStr,
    challenges: [
      { slot: 'java', challengeId: javaChallenge._id },
      { slot: 'python', challengeId: pythonChallenge._id },
      { slot: 'dsa', challengeId: dsaChallenge._id },
      { slot: 'css', challengeId: cssChallenge._id }
    ],
    bonusXp: 100
  });

  // 11. Create sample Attendance records
  await Attendance.create([
    { date: todayStr, type: 'student', userId: student1._id, batchId: batchAlpha._id, collegeId: apexCollege._id, status: 'Present', markedBy: trainerUser._id },
    { date: todayStr, type: 'student', userId: student2._id, batchId: batchAlpha._id, collegeId: apexCollege._id, status: 'Present', markedBy: trainerUser._id },
    { date: todayStr, type: 'student', userId: student3._id, batchId: batchBeta._id, collegeId: sviCollege._id, status: 'Late', remarks: 'Joined 15 mins late due to commute', markedBy: trainerUser._id }
  ]);

  // 12. Skip dummy sessions creation - sessions must be created only by Admin
  // 13. Create Student Homework Tasks
  const task1 = await StudentTask.create({
    taskId: 'TSK-1001',
    sessionId: null,
    studentId: student1._id,
    tutorId: trainerUser._id,
    title: 'Build a Polymorphic Vehicle Fleet Hierarchy',
    description: 'Create a base Vehicle class with start() and stop() methods, subclassed by Car, ElectricVehicle, and Truck with custom overrides and a battery level check.',
    instructions: 'Ensure encapsulation with private fields, write unit tests for each class, and push code to your repository.',
    attachment: 'https://assets.codequest.edu/assignments/vehicle-fleet-spec.pdf',
    dueDate: new Date(Date.now() + 3 * 86400000),
    status: 'ASSIGNED',
    maxScore: 100
  });

  const task2 = await StudentTask.create({
    taskId: 'TSK-1002',
    sessionId: null,
    studentId: student1._id,
    tutorId: trainerUser._id,
    title: 'Object Equality & HashCode Implementation',
    description: 'Override equals() and hashCode() contracts for an Employee model using Apache Commons or Java 17 Objects utility.',
    instructions: 'Include test cases for reflexive, symmetric, and transitive properties.',
    dueDate: new Date(Date.now() + 1 * 86400000),
    submissionType: 'github',
    submissionUrl: 'https://github.com/alexrivera/java-hashcode-exercise',
    submissionNotes: 'All unit test assertions passed successfully. Check test/EmployeeTest.java',
    status: 'SUBMITTED',
    submittedAt: new Date(Date.now() - 3600000),
    maxScore: 100
  });

  // 14. Create Tutor Guidance Notes
  await TutorGuidance.create([
    {
      studentId: student1._id,
      tutorId: trainerUser._id,
      sessionId: null,
      priority: 'HIGH',
      message: 'Great job on the Classes & Objects challenge Alex! For today\'s Polymorphism class, pay extra attention to interface default methods vs abstract classes. Review chapter 4 before class.',
      readStatus: false
    },
    {
      studentId: student1._id,
      tutorId: trainerUser._id,
      sessionId: null,
      priority: 'MEDIUM',
      message: 'Recommended practice: Refactor your earlier Bank Account simulation using Java 17 records to experience immutable data modeling.',
      readStatus: true
    }
  ]);

  // 15. Seed 100 Interview Questions and Test Cases
  await seedInterviewQuestions();

  // 16. Seed 100 Challenges per Game Hub Topic (1,100 Total Challenges)
  await seedGameHubChallenges();

  console.log('[Seed] Database successfully seeded with all initial data, sessions, tasks, tutor guidance, 100 interview challenges, and 1,100 Game Hub challenges!');
  return { success: true };
}

module.exports = { seedDatabase };
