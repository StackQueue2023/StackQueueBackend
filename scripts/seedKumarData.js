/**
 * seedKumarData.js
 * Seeds Java + Python courses, React + Angular internships,
 * and TEN Aquarium project — all linked to student Kumar (STU1001)
 *
 * Run:  node server/scripts/seedKumarData.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const User          = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const Course        = require('../models/Course');
const Module        = require('../models/Module');
const Internship    = require('../models/Internship');
const StudentInternship = require('../models/StudentInternship');
const Project       = require('../models/Project');

async function seed() {
  await connectDB();
  console.log('\n🚀 Starting Kumar data seed...\n');

  /* ────────────────────────────────
     1. Find Kumar
  ──────────────────────────────── */
  const kumar = await User.findOne({
    $or: [{ studentId: 'STU1001' }, { email: 'kumar@codequest.com' }]
  });

  if (!kumar) {
    console.error('❌  Kumar (STU1001) not found. Run seedLmsData.js first.');
    process.exit(1);
  }

  let profile = await StudentProfile.findOne({ userId: kumar._id });
  if (!profile) {
    console.error('❌  StudentProfile for Kumar not found. Run seedLmsData.js first.');
    process.exit(1);
  }

  console.log(`✅  Found Kumar: ${kumar.name} (${kumar._id})`);

  /* ────────────────────────────────
     2. COURSES — Java & Python
  ──────────────────────────────── */

  // ── Java Full Stack ──
  let javaCourse = await Course.findOne({ slug: 'java-full-stack' });
  if (!javaCourse) {
    javaCourse = await Course.create({
      title: 'Java Full Stack',
      slug: 'java-full-stack',
      description: 'Master Core Java, OOP, Collections, Spring Boot, REST APIs and React integration. Industry-ready curriculum for backend and full-stack roles.',
      category: 'Software Development',
      icon: '☕',
      color: 'from-orange-500 to-red-500',
      durationWeeks: 16,
      totalHours: 160,
      level: 'All Levels',
      isActive: true
    });
    console.log('✅  Created Course: Java Full Stack');
  } else {
    javaCourse.icon  = '☕';
    javaCourse.color = 'from-orange-500 to-red-500';
    await javaCourse.save();
    console.log('✅  Updated Course: Java Full Stack');
  }

  // ── Java Modules ──
  const javaModules = [
    { order: 1, title: 'Core Java Fundamentals',        description: 'Variables, data types, operators, control flow, and basic I/O.' },
    { order: 2, title: 'Object-Oriented Programming',   description: 'Classes, objects, inheritance, polymorphism, abstraction, encapsulation.' },
    { order: 3, title: 'Java Collections Framework',    description: 'List, Set, Map, Queue — ArrayList, HashMap, LinkedList and more.' },
    { order: 4, title: 'Exception Handling & Files',    description: 'Try-catch-finally, custom exceptions, file I/O with streams.' },
    { order: 5, title: 'JDBC & Database Integration',   description: 'Connect Java to MySQL, execute queries, prepared statements, transactions.' },
    { order: 6, title: 'Spring Boot & REST APIs',       description: 'Spring MVC, REST controllers, dependency injection, JPA/Hibernate.' },
  ];

  for (const m of javaModules) {
    const exists = await Module.findOne({ courseId: javaCourse._id, order: m.order });
    if (!exists) {
      await Module.create({ courseId: javaCourse._id, ...m, isPublished: true });
    }
  }
  console.log('✅  Java modules ready (6 modules)');

  // ── Python Full Stack ──
  let pythonCourse = await Course.findOne({ slug: 'python-full-stack' });
  if (!pythonCourse) {
    pythonCourse = await Course.create({
      title: 'Python Full Stack',
      slug: 'python-full-stack',
      description: 'Learn Python from basics to advanced: OOP, Django REST Framework, data structures, NumPy, Pandas, and deployment.',
      category: 'Software Development',
      icon: '🐍',
      color: 'from-blue-500 to-cyan-500',
      durationWeeks: 14,
      totalHours: 140,
      level: 'All Levels',
      isActive: true
    });
    console.log('✅  Created Course: Python Full Stack');
  } else {
    pythonCourse.icon  = '🐍';
    pythonCourse.color = 'from-blue-500 to-cyan-500';
    await pythonCourse.save();
    console.log('✅  Updated Course: Python Full Stack');
  }

  // ── Python Modules ──
  const pythonModules = [
    { order: 1, title: 'Python Basics',                  description: 'Syntax, variables, data types, loops, conditionals, functions.' },
    { order: 2, title: 'Data Structures in Python',      description: 'Lists, tuples, sets, dictionaries, comprehensions.' },
    { order: 3, title: 'OOP with Python',                description: 'Classes, inheritance, magic methods, decorators.' },
    { order: 4, title: 'File Handling & Libraries',      description: 'os, sys, json, csv, datetime modules and file I/O.' },
    { order: 5, title: 'Django Web Framework',           description: 'MVC pattern, models, views, templates, REST APIs with DRF.' },
    { order: 6, title: 'Data Science Foundations',       description: 'NumPy, Pandas, Matplotlib — data manipulation and visualization.' },
  ];

  for (const m of pythonModules) {
    const exists = await Module.findOne({ courseId: pythonCourse._id, order: m.order });
    if (!exists) {
      await Module.create({ courseId: pythonCourse._id, ...m, isPublished: true });
    }
  }
  console.log('✅  Python modules ready (6 modules)');

  /* ────────────────────────────────
     3. Assign Java as current course for Kumar
        Python as previous (completed) course
  ──────────────────────────────── */

  // Set Java as current enrolled course + domain
  profile.enrolledCourseId = javaCourse._id;
  profile.domain = 'java';

  // Add Python as a previous completed course (if not already)
  const alreadyHasPython = profile.previousCourses?.some(
    p => p.courseId?.toString() === pythonCourse._id.toString()
  );
  if (!alreadyHasPython) {
    profile.previousCourses = profile.previousCourses || [];
    profile.previousCourses.push({
      courseId: pythonCourse._id,
      domain: 'python',
      completedAt: new Date('2026-08-01'),
      finalPoints: 320,
      finalProgress: 85
    });
  }

  await profile.save();
  console.log('✅  Kumar: Current = Java Full Stack | Previous = Python Full Stack');

  /* ────────────────────────────────
     4. INTERNSHIPS — React & Angular
  ──────────────────────────────── */

  // ── React Internship ──
  let reactInternship = await Internship.findOne({ slug: 'react-frontend-internship' });
  if (!reactInternship) {
    reactInternship = await Internship.create({
      title: 'React Frontend Internship',
      slug: 'react-frontend-internship',
      description: 'Build real-world React applications using hooks, Redux, Tailwind CSS and REST API integration. Work on live company projects.',
      techStack: ['React', 'JavaScript', 'Tailwind CSS', 'Redux', 'REST APIs'],
      domain: 'frontend',
      durationWeeks: 8,
      stipend: 5000,
      isPaid: true,
      level: 'Intermediate',
      color: 'from-cyan-500 to-teal-500',
      icon: '⚛️',
      isActive: true
    });
    console.log('✅  Created Internship: React Frontend');
  } else {
    console.log('✅  Internship already exists: React Frontend');
  }

  // ── Angular Internship ──
  let angularInternship = await Internship.findOne({ slug: 'angular-internship' });
  if (!angularInternship) {
    angularInternship = await Internship.create({
      title: 'Angular Full-Stack Internship',
      slug: 'angular-internship',
      description: 'Develop enterprise-grade Angular applications with TypeScript, RxJS, NgRx, and Spring Boot backend integration.',
      techStack: ['Angular', 'TypeScript', 'RxJS', 'NgRx', 'Spring Boot'],
      domain: 'fullstack',
      durationWeeks: 10,
      stipend: 6000,
      isPaid: true,
      level: 'Advanced',
      color: 'from-red-500 to-rose-600',
      icon: '🔺',
      isActive: true
    });
    console.log('✅  Created Internship: Angular Full-Stack');
  } else {
    console.log('✅  Internship already exists: Angular Full-Stack');
  }

  // ── Enroll Kumar in both internships ──
  await StudentInternship.findOneAndUpdate(
    { studentId: kumar._id, internshipId: reactInternship._id },
    {
      studentId: kumar._id,
      internshipId: reactInternship._id,
      status: 'in_progress',
      progress: 45,
      enrolledAt: new Date('2026-09-01')
    },
    { upsert: true, new: true }
  );
  console.log('✅  Kumar enrolled in React Internship (45% progress)');

  await StudentInternship.findOneAndUpdate(
    { studentId: kumar._id, internshipId: angularInternship._id },
    {
      studentId: kumar._id,
      internshipId: angularInternship._id,
      status: 'enrolled',
      progress: 0,
      enrolledAt: new Date('2026-09-15')
    },
    { upsert: true, new: true }
  );
  console.log('✅  Kumar enrolled in Angular Internship');

  /* ────────────────────────────────
     5. PROJECT — TEN Aquarium
  ──────────────────────────────── */
  let tenProject = await Project.findOne({ slug: 'ten-aquarium' });
  if (!tenProject) {
    tenProject = await Project.create({
      title: 'TEN Aquarium',
      slug: 'ten-aquarium',
      category: 'Industry Project',
      description: 'Build a live aquarium management system for TEN company — real-time fish species tracking, tank monitoring, feeding schedules, and water quality analytics. Full-stack Java + React implementation.',
      technologies: ['Java', 'Spring Boot', 'React', 'MySQL', 'REST API', 'Chart.js'],
      requirements: [
        'Live fish species catalogue with search & filter',
        'Real-time tank sensor dashboard (temperature, pH, oxygen)',
        'Automated feeding schedule management',
        'Water quality trend charts & alerts',
        'Admin panel for aquarium staff',
        'Mobile-responsive UI with React'
      ],
      difficulty: 'Industry Level',
      xpReward: 500,
      estimatedHours: 80,
      courseId: javaCourse._id,
      assignedStudentId: kumar._id,
      status: 'In Progress',
      progressPercentage: 20,
      githubRepoUrl: '',
      grade: 'Pending'
    });
    console.log('✅  Created Project: TEN Aquarium (assigned to Kumar)');
  } else {
    tenProject.assignedStudentId = kumar._id;
    tenProject.courseId = javaCourse._id;
    await tenProject.save();
    console.log('✅  Updated Project: TEN Aquarium — assigned to Kumar');
  }

  /* ────────────────────────────────
     6. Summary
  ──────────────────────────────── */
  console.log('\n═══════════════════════════════════════════════');
  console.log('  ✅  SEED COMPLETE — Kumar Data Summary');
  console.log('═══════════════════════════════════════════════');
  console.log('  Student : Kumar  (STU1001)');
  console.log('  Email   : kumar@codequest.com  |  Password: Student@123');
  console.log('\n  COURSES:');
  console.log('    ☕  Java Full Stack       → CURRENT  (6 modules)');
  console.log('    🐍  Python Full Stack     → PREVIOUS (completed)');
  console.log('\n  INTERNSHIPS:');
  console.log('    ⚛️   React Frontend        → In Progress (45%)');
  console.log('    🔺  Angular Full-Stack    → Enrolled');
  console.log('\n  PROJECTS:');
  console.log('    🐠  TEN Aquarium          → In Progress (20%)');
  console.log('═══════════════════════════════════════════════\n');

  process.exit(0);
}

seed().catch(err => {
  console.error('❌  Seed error:', err);
  process.exit(1);
});
