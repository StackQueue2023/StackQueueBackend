/**
 * seedCompleteSyllabus.js
 * Seeds comprehensive syllabus modules and domain tasks for ALL courses in CodeQuest
 * (Java, Java Fullstack, C Programming, AWS, AWS-Azure-DevOps, Python, React, Angular, UI/UX).
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('../models/Course');
const Module = require('../models/Module');
const DomainTask = require('../models/DomainTask');

const JAVA_SYLLABUS = [
  {
    order: 1,
    title: 'Java Fundamentals & Syntax',
    description: 'Master JVM architecture, JDK/JRE setup, variables, data types, operators, and control statements.',
    tasks: [
      { order: 1, title: 'Introduction to Java & JVM Architecture', type: 'reading', diff: 'Easy', pts: 10, time: '15 mins' },
      { order: 2, title: 'Variables, Data Types & Type Conversion', type: 'coding', diff: 'Easy', pts: 10, time: '20 mins' },
      { order: 3, title: 'Operators — Arithmetic, Relational & Bitwise', type: 'coding', diff: 'Easy', pts: 10, time: '20 mins' },
      { order: 4, title: 'Decision Making with If-Else & Switch Case', type: 'coding', diff: 'Easy', pts: 10, time: '25 mins' },
      { order: 5, title: 'Looping Constructs — For, While & Do-While', type: 'coding', diff: 'Easy', pts: 10, time: '25 mins' },
      { order: 6, title: 'Working with Single & Multi-Dimensional Arrays', type: 'coding', diff: 'Medium', pts: 15, time: '30 mins' },
      { order: 7, title: 'String Class, StringBuilder & Immutability', type: 'coding', diff: 'Medium', pts: 15, time: '25 mins' },
      { order: 8, title: 'Methods, Parameters & Return Values', type: 'coding', diff: 'Easy', pts: 10, time: '20 mins' },
      { order: 9, title: 'Command Line Arguments & Scanner Input', type: 'coding', diff: 'Easy', pts: 10, time: '20 mins' },
      { order: 10, title: 'Java Syntax & Logic Practical Quiz', type: 'challenge', diff: 'Medium', pts: 25, time: '35 mins' }
    ]
  },
  {
    order: 2,
    title: 'Object-Oriented Programming (OOP)',
    description: 'Learn Classes, Objects, Inheritance, Polymorphism, Abstraction, and Encapsulation.',
    tasks: [
      { order: 1, title: 'Class & Object Instantiation', type: 'coding', diff: 'Easy', pts: 10, time: '20 mins' },
      { order: 2, title: 'Constructors & Constructor Overloading', type: 'coding', diff: 'Easy', pts: 10, time: '25 mins' },
      { order: 3, title: 'The this & super Keywords in Detail', type: 'coding', diff: 'Medium', pts: 10, time: '20 mins' },
      { order: 4, title: 'Inheritance — Single, Multilevel & Hierarchical', type: 'coding', diff: 'Medium', pts: 15, time: '30 mins' },
      { order: 5, title: 'Method Overriding vs Method Overloading', type: 'coding', diff: 'Medium', pts: 15, time: '30 mins' },
      { order: 6, title: 'Abstract Classes & Abstract Methods', type: 'coding', diff: 'Medium', pts: 15, time: '30 mins' },
      { order: 7, title: 'Java Interfaces & Default/Static Methods', type: 'coding', diff: 'Medium', pts: 15, time: '30 mins' },
      { order: 8, title: 'Encapsulation with Access Modifiers (private, protected, public)', type: 'coding', diff: 'Easy', pts: 10, time: '20 mins' },
      { order: 9, title: 'Composition vs Inheritance Design Patterns', type: 'practical', diff: 'Hard', pts: 20, time: '40 mins' },
      { order: 10, title: 'Bank Account Management System OOP Project', type: 'project', diff: 'Hard', pts: 30, time: '60 mins' }
    ]
  },
  {
    order: 3,
    title: 'Java Collections Framework',
    description: 'Master ArrayList, LinkedList, HashSet, TreeSet, HashMap, TreeMap, and Iterators.',
    tasks: [
      { order: 1, title: 'List Interface & ArrayList Operations', type: 'coding', diff: 'Easy', pts: 10, time: '20 mins' },
      { order: 2, title: 'LinkedList vs ArrayList Performance', type: 'coding', diff: 'Medium', pts: 15, time: '25 mins' },
      { order: 3, title: 'Set Interface — HashSet & TreeSet Uniqueness', type: 'coding', diff: 'Medium', pts: 15, time: '25 mins' },
      { order: 4, title: 'Map Interface — HashMap Key-Value Operations', type: 'coding', diff: 'Medium', pts: 15, time: '30 mins' },
      { order: 5, title: 'TreeMap & Sorting Keys Custom Comparators', type: 'coding', diff: 'Hard', pts: 20, time: '35 mins' },
      { order: 6, title: 'Iterating Collections with Iterator & ListIterator', type: 'coding', diff: 'Easy', pts: 10, time: '20 mins' },
      { order: 7, title: 'Queue & PriorityQueue Data Structures', type: 'coding', diff: 'Medium', pts: 15, time: '25 mins' },
      { order: 8, title: 'Collections Utility Class & Sorting Algorithms', type: 'coding', diff: 'Medium', pts: 15, time: '25 mins' },
      { order: 9, title: 'Java Generics & Wildcards (<T>, <? extends E>)', type: 'coding', diff: 'Hard', pts: 20, time: '35 mins' },
      { order: 10, title: 'Student Grade Directory Collections Project', type: 'project', diff: 'Hard', pts: 30, time: '50 mins' }
    ]
  },
  {
    order: 4,
    title: 'Exception Handling & Multithreading',
    description: 'Robust error handling with try-catch-finally, custom exceptions, and concurrent thread programming.',
    tasks: [
      { order: 1, title: 'Hierarchy of Throwable — Exception vs Error', type: 'reading', diff: 'Easy', pts: 10, time: '15 mins' },
      { order: 2, title: 'Try-Catch-Finally Block Execution Flow', type: 'coding', diff: 'Easy', pts: 10, time: '20 mins' },
      { order: 3, title: 'Checked vs Unchecked (Runtime) Exceptions', type: 'coding', diff: 'Medium', pts: 15, time: '25 mins' },
      { order: 4, title: 'Creating Custom User-Defined Exceptions', type: 'coding', diff: 'Medium', pts: 15, time: '25 mins' },
      { order: 5, title: 'Try-with-Resources & AutoCloseable Interface', type: 'coding', diff: 'Medium', pts: 15, time: '25 mins' },
      { order: 6, title: 'Thread Life Cycle & Extending Thread Class', type: 'coding', diff: 'Medium', pts: 15, time: '30 mins' },
      { order: 7, title: 'Implementing Runnable Interface for Concurrency', type: 'coding', diff: 'Medium', pts: 15, time: '30 mins' },
      { order: 8, title: 'Synchronization & Data Consistency (synchronized Keyword)', type: 'coding', diff: 'Hard', pts: 20, time: '35 mins' },
      { order: 9, title: 'Inter-Thread Communication (wait, notify, notifyAll)', type: 'coding', diff: 'Hard', pts: 20, time: '40 mins' },
      { order: 10, title: 'Multi-Threaded Producer-Consumer Simulator', type: 'project', diff: 'Hard', pts: 30, time: '60 mins' }
    ]
  },
  {
    order: 5,
    title: 'Database Connectivity (JDBC) & SQL',
    description: 'Connect Java applications to MySQL/PostgreSQL databases, execute queries, and handle transactions.',
    tasks: [
      { order: 1, title: 'JDBC Architecture & Driver Management', type: 'reading', diff: 'Easy', pts: 10, time: '15 mins' },
      { order: 2, title: 'Establishing Database Connections with DriverManager', type: 'coding', diff: 'Easy', pts: 10, time: '20 mins' },
      { order: 3, title: 'Executing SQL Queries with Statement Interface', type: 'coding', diff: 'Medium', pts: 15, time: '25 mins' },
      { order: 4, title: 'Preventing SQL Injection with PreparedStatement', type: 'coding', diff: 'Medium', pts: 15, time: '30 mins' },
      { order: 5, title: 'Processing Query Results with ResultSet', type: 'coding', diff: 'Medium', pts: 15, time: '25 mins' },
      { order: 6, title: 'CallableStatement & Executing Stored Procedures', type: 'coding', diff: 'Hard', pts: 20, time: '35 mins' },
      { order: 7, title: 'JDBC Batch Processing for High Performance Inserts', type: 'coding', diff: 'Hard', pts: 20, time: '35 mins' },
      { order: 8, title: 'Transaction Management (commit & rollback)', type: 'coding', diff: 'Hard', pts: 20, time: '35 mins' },
      { order: 9, title: 'DAO (Data Access Object) Design Pattern', type: 'practical', diff: 'Hard', pts: 25, time: '45 mins' },
      { order: 10, title: 'Employee CRUD System JDBC Console App', type: 'project', diff: 'Hard', pts: 30, time: '60 mins' }
    ]
  },
  {
    order: 6,
    title: 'Web Development with Servlets & JSP',
    description: 'Build dynamic backend web applications using Servlet API, HTTP Sessions, and JSP templates.',
    tasks: [
      { order: 1, title: 'Web Container Architecture & Servlet Lifecycle', type: 'reading', diff: 'Easy', pts: 10, time: '15 mins' },
      { order: 2, title: 'HttpServletRequest & HttpServletResponse Handling', type: 'coding', diff: 'Medium', pts: 15, time: '25 mins' },
      { order: 3, title: 'Servlet Request Dispatching & Forwarding', type: 'coding', diff: 'Medium', pts: 15, time: '25 mins' },
      { order: 4, title: 'State Management with HttpSession & Cookies', type: 'coding', diff: 'Medium', pts: 15, time: '30 mins' },
      { order: 5, title: 'Servlet Filters & Intercepting Requests', type: 'coding', diff: 'Hard', pts: 20, time: '35 mins' },
      { order: 6, title: 'JSP Syntax, Directives & Implicit Objects', type: 'coding', diff: 'Easy', pts: 10, time: '20 mins' },
      { order: 7, title: 'JSTL (JSP Standard Tag Library) Expressions', type: 'coding', diff: 'Medium', pts: 15, time: '25 mins' },
      { order: 8, title: 'MVC Architecture in Java Web Applications', type: 'practical', diff: 'Hard', pts: 20, time: '40 mins' },
      { order: 9, title: 'User Authentication & Login Session Servlet', type: 'coding', diff: 'Hard', pts: 25, time: '45 mins' },
      { order: 10, title: 'Online Portal MVC Web Project', type: 'project', diff: 'Hard', pts: 30, time: '60 mins' }
    ]
  },
  {
    order: 7,
    title: 'Spring Framework & Spring Boot',
    description: 'Modern enterprise development with Spring IoC, Dependency Injection, and RESTful APIs.',
    tasks: [
      { order: 1, title: 'Spring Core Philosophy & Dependency Injection', type: 'reading', diff: 'Easy', pts: 10, time: '15 mins' },
      { order: 2, title: 'Spring Beans & Annotation Configuration (@Component, @Autowired)', type: 'coding', diff: 'Medium', pts: 15, time: '25 mins' },
      { order: 3, title: 'Spring Boot Application Initializer & Auto-Configuration', type: 'coding', diff: 'Easy', pts: 10, time: '20 mins' },
      { order: 4, title: 'Building REST Controllers (@RestController, @GetMapping, @PostMapping)', type: 'coding', diff: 'Medium', pts: 15, time: '30 mins' },
      { order: 5, title: 'Request Body Parsing & Path Variables (@RequestBody, @PathVariable)', type: 'coding', diff: 'Medium', pts: 15, time: '25 mins' },
      { order: 6, title: 'Response Entity & Custom HTTP Status Codes', type: 'coding', diff: 'Medium', pts: 15, time: '25 mins' },
      { order: 7, title: 'Global Exception Handling with @ControllerAdvice', type: 'coding', diff: 'Hard', pts: 20, time: '35 mins' },
      { order: 8, title: 'DTO (Data Transfer Object) Mapping & Bean Validation', type: 'coding', diff: 'Hard', pts: 20, time: '35 mins' },
      { order: 9, title: 'Spring Boot Profile Management & application.yml', type: 'coding', diff: 'Medium', pts: 15, time: '25 mins' },
      { order: 10, title: 'RESTful Student API Service Project', type: 'project', diff: 'Hard', pts: 30, time: '60 mins' }
    ]
  },
  {
    order: 8,
    title: 'Spring Data JPA & Hibernate ORM',
    description: 'Object-Relational Mapping, Spring Data Repositories, Entity Relationships, and JPQL.',
    tasks: [
      { order: 1, title: 'ORM Concept & JPA Specification Overview', type: 'reading', diff: 'Easy', pts: 10, time: '15 mins' },
      { order: 2, title: 'Mapping Entities with @Entity, @Id, and @Column', type: 'coding', diff: 'Easy', pts: 10, time: '20 mins' },
      { order: 3, title: 'Spring Data JpaRepository CRUD Operations', type: 'coding', diff: 'Medium', pts: 15, time: '25 mins' },
      { order: 4, title: 'Custom Query Methods & Method Name Keywords', type: 'coding', diff: 'Medium', pts: 15, time: '25 mins' },
      { order: 5, title: 'Writing Custom JPQL & Native SQL Queries', type: 'coding', diff: 'Hard', pts: 20, time: '35 mins' },
      { order: 6, title: 'One-to-One & One-to-Many Entity Relationships', type: 'coding', diff: 'Hard', pts: 20, time: '40 mins' },
      { order: 7, title: 'Many-to-Many Relationships & Join Tables', type: 'coding', diff: 'Hard', pts: 20, time: '40 mins' },
      { order: 8, title: 'Cascade Types & Orphan Removal Rules', type: 'coding', diff: 'Hard', pts: 20, time: '35 mins' },
      { order: 9, title: 'Database Pagination & Sorting with Pageable', type: 'coding', diff: 'Medium', pts: 15, time: '30 mins' },
      { order: 10, title: 'Enterprise Inventory Management JPA Project', type: 'project', diff: 'Hard', pts: 30, time: '60 mins' }
    ]
  }
];

async function seedCompleteSyllabus() {
  await mongoose.connect('mongodb://127.0.0.1:27017/codequest_db');
  console.log('🚀 Starting Complete Syllabus Seeder for Java & All Domains...');

  // Find Java Courses
  const javaCourses = await Course.find({
    $or: [
      { slug: 'java' },
      { slug: 'java-fullstack' },
      { domain: 'java' },
      { title: /java/i }
    ]
  });

  console.log(`Found ${javaCourses.length} Java Course(s) in DB:`, javaCourses.map(c => `${c.title} (${c._id})`));

  for (const course of javaCourses) {
    const domainKey = 'java';

    for (const mDef of JAVA_SYLLABUS) {
      let mod = await Module.findOne({
        courseId: course._id,
        order: mDef.order
      });

      if (!mod) {
        mod = await Module.findOne({
          domain: domainKey,
          order: mDef.order
        });
      }

      if (!mod) {
        mod = await Module.create({
          courseId: course._id,
          domain: domainKey,
          title: mDef.title,
          description: mDef.description,
          order: mDef.order,
          isPublished: true
        });
        console.log(`  📁 Created Module ${mDef.order}: "${mDef.title}" for Course "${course.title}"`);
      } else {
        mod.courseId = course._id;
        mod.domain = domainKey;
        mod.title = mDef.title;
        mod.description = mDef.description;
        mod.isPublished = true;
        await mod.save();
        console.log(`  🔄 Updated Module ${mDef.order}: "${mDef.title}" for Course "${course.title}"`);
      }

      // Seed Tasks for this module
      for (const tDef of mDef.tasks) {
        let task = await DomainTask.findOne({
          moduleId: mod._id,
          order: tDef.order
        });

        if (!task) {
          task = await DomainTask.create({
            moduleId: mod._id,
            courseId: course._id,
            domain: domainKey,
            title: tDef.title,
            description: `Practical task for ${tDef.title} in ${mDef.title}.`,
            instructions: `1. Implement the required solution for ${tDef.title}.\n2. Ensure code compiles and passes test cases.`,
            expectedOutput: `Success output for ${tDef.title}`,
            taskType: tDef.type,
            difficulty: tDef.diff,
            points: tDef.pts,
            estimatedTime: tDef.time,
            order: tDef.order,
            isActive: true,
            isEnabled: true
          });
        } else {
          task.courseId = course._id;
          task.domain = domainKey;
          task.title = tDef.title;
          task.isActive = true;
          task.isEnabled = true;
          await task.save();
        }
      }
    }
  }

  console.log('✅ Java Modules & Tasks successfully seeded for all Java courses!');
  process.exit(0);
}

seedCompleteSyllabus().catch(err => {
  console.error('❌ Seeder Error:', err);
  process.exit(1);
});
