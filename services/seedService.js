const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const TrainerProfile = require('../models/TrainerProfile');
const College = require('../models/College');
const Batch = require('../models/Batch');
const Course = require('../models/Course');
const Subject = require('../models/Subject');
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

async function seedDatabase() {
  console.log('[Seed] Checking database collections...');

  const userCount = await User.countDocuments();
  if (userCount > 0) {
    console.log(`[Seed] Database already has ${userCount} users. Ensuring badges exist...`);
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
    { name: 'First Challenge', slug: 'first-challenge', description: 'Solved your very first coding challenge!', icon: 'Award', color: 'from-yellow-400 to-amber-600', criteria: { type: 'challenges_count', targetValue: 1 }, xpBonus: 25 },
    { name: '7 Day Streak', slug: '7-day-streak', description: 'Logged in and solved challenges 7 consecutive days!', icon: 'Flame', color: 'from-orange-500 to-red-600', criteria: { type: 'streak_days', targetValue: 7 }, xpBonus: 100 },
    { name: '100 Problems Solved', slug: '100-problems', description: 'A true coding titan - conquered 100 challenges!', icon: 'Trophy', color: 'from-amber-400 to-yellow-600', criteria: { type: 'challenges_count', targetValue: 100 }, xpBonus: 250 },
    { name: 'CSS Master', slug: 'css-master', description: 'Mastered Flexbox, Grid, Box Model, and responsive layouts.', icon: 'Palette', color: 'from-blue-400 to-indigo-600', criteria: { type: 'challenges_count', targetValue: 5 }, xpBonus: 75 },
    { name: 'Java Beginner', slug: 'java-beginner', description: 'Wrote and debugged foundational Java programs.', icon: 'Coffee', color: 'from-amber-500 to-red-600', criteria: { type: 'challenges_count', targetValue: 3 }, xpBonus: 50 },
    { name: 'Java Master', slug: 'java-master', description: 'Conquered advanced Java OOP, interfaces, and collections.', icon: 'Zap', color: 'from-red-500 to-orange-600', criteria: { type: 'challenges_count', targetValue: 15 }, xpBonus: 150 },
    { name: 'Python Explorer', slug: 'python-explorer', description: 'Mastered Python syntax, comprehensions, and data structures.', icon: 'Terminal', color: 'from-emerald-400 to-teal-600', criteria: { type: 'challenges_count', targetValue: 5 }, xpBonus: 60 },
    { name: 'DSA Solver', slug: 'dsa-solver', description: 'Demonstrated algorithmic thinking and data structure mastery.', icon: 'Brain', color: 'from-purple-500 to-pink-600', criteria: { type: 'challenges_count', targetValue: 5 }, xpBonus: 90 },
    { name: 'SQL Detective', slug: 'sql-detective', description: 'Cracked relational database queries and complex filtering.', icon: 'Database', color: 'from-cyan-400 to-blue-600', criteria: { type: 'challenges_count', targetValue: 5 }, xpBonus: 70 },
    { name: 'React Developer', slug: 'react-dev', description: 'Constructed responsive components, state hooks, and routers.', icon: 'Atom', color: 'from-cyan-400 to-sky-600', criteria: { type: 'challenges_count', targetValue: 5 }, xpBonus: 80 },
    { name: 'Git Battle Veteran', slug: 'git-veteran', description: 'Navigated branch merges, commits, and collaborative git trees.', icon: 'GitBranch', color: 'from-orange-500 to-amber-600', criteria: { type: 'challenges_count', targetValue: 4 }, xpBonus: 50 },
    { name: 'Cloud Explorer', slug: 'cloud-explorer', description: 'Architected scalable cloud pipelines with S3, EC2, and CloudFront.', icon: 'Cloud', color: 'from-sky-400 to-indigo-600', criteria: { type: 'challenges_count', targetValue: 4 }, xpBonus: 85 },
    { name: 'Real Project Builder', slug: 'project-builder', description: 'Delivered an industry-grade real-world project to production.', icon: 'Layers', color: 'from-emerald-500 to-green-600', criteria: { type: 'project_count', targetValue: 1 }, xpBonus: 150 }
  ];

  const createdBadges = await Badge.insertMany(badgesList);

  // Link initial badge to Alex & Sarah
  await StudentBadge.create({ studentId: student1._id, badgeId: createdBadges[0]._id });
  await StudentBadge.create({ studentId: student1._id, badgeId: createdBadges[3]._id });
  await StudentBadge.create({ studentId: student2._id, badgeId: createdBadges[0]._id });
  await StudentBadge.create({ studentId: student2._id, badgeId: createdBadges[1]._id });

  // 7. Create Projects & Project Tasks
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

  // 8. Create sample Attendance records
  const todayStr = new Date().toISOString().split('T')[0];

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

  console.log('[Seed] Database successfully seeded with all initial data, sessions, tasks, tutor guidance and 100 interview challenges!');
  return { success: true };
}

module.exports = { seedDatabase };
