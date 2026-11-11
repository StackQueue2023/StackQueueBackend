/**
 * seedAllDomainsSyllabus.js
 * Ensures Java, Python, C++, and React all have initial modules & sample tasks
 * with proper domain tags, course IDs, and sequential order.
 */
require('dotenv').config();
const connectDB = require('../config/db');
const Course = require('../models/Course');
const Module = require('../models/Module');
const DomainTask = require('../models/DomainTask');

const DOMAIN_DATA = [
  {
    key: 'java',
    title: 'Java Full Stack',
    slug: 'java-full-stack',
    icon: '☕',
    color: 'from-orange-500 to-red-500',
    modules: [
      {
        order: 1,
        title: 'Java Basics & Syntax',
        description: 'Introduction to JVM, JDK, variables, data types, operators, and conditionals.',
        tasks: [
          { order: 1, title: 'Introduction to Java & JVM Architecture', type: 'reading', diff: 'Easy', pts: 10, time: '15 mins' },
          { order: 2, title: 'Variables, Literals and Constants', type: 'coding', diff: 'Easy', pts: 10, time: '20 mins' },
          { order: 3, title: 'Primitive Data Types and Type Casting', type: 'coding', diff: 'Easy', pts: 10, time: '20 mins' },
          { order: 4, title: 'Arithmetic and Logical Operators', type: 'coding', diff: 'Easy', pts: 10, time: '20 mins' },
          { order: 5, title: 'Control Statements — If-Else & Switch', type: 'coding', diff: 'Easy', pts: 10, time: '25 mins' },
          { order: 6, title: 'Looping Constructs — For, While, Do-While', type: 'coding', diff: 'Easy', pts: 10, time: '25 mins' },
          { order: 7, title: 'Methods and Variable Scope', type: 'coding', diff: 'Easy', pts: 15, time: '30 mins' },
          { order: 8, title: 'Single & Multi-Dimensional Arrays', type: 'coding', diff: 'Medium', pts: 15, time: '30 mins' },
          { order: 9, title: 'String Class and Immutability', type: 'coding', diff: 'Medium', pts: 15, time: '25 mins' },
          { order: 10, title: 'Java Basics Milestone Quiz & Coding Test', type: 'challenge', diff: 'Medium', pts: 25, time: '40 mins' }
        ]
      },
      {
        order: 2,
        title: 'Object-Oriented Programming (OOP)',
        description: 'Classes, Objects, Constructors, Inheritance, Polymorphism, Abstraction, and Encapsulation.',
        tasks: [
          { order: 1, title: 'Class and Object Definition', type: 'coding', diff: 'Easy', pts: 10, time: '20 mins' },
          { order: 2, title: 'Constructors & Constructor Overloading', type: 'coding', diff: 'Easy', pts: 10, time: '25 mins' },
          { order: 3, title: 'The this and super Keywords', type: 'coding', diff: 'Medium', pts: 10, time: '20 mins' },
          { order: 4, title: 'Inheritance — Single, Multilevel & Hierarchical', type: 'coding', diff: 'Medium', pts: 15, time: '30 mins' },
          { order: 5, title: 'Method Overriding & Runtime Polymorphism', type: 'coding', diff: 'Medium', pts: 15, time: '30 mins' },
          { order: 6, title: 'Abstract Classes and Methods', type: 'coding', diff: 'Medium', pts: 15, time: '30 mins' },
          { order: 7, title: 'Java Interfaces and Default Methods', type: 'coding', diff: 'Medium', pts: 15, time: '30 mins' },
          { order: 8, title: 'Encapsulation with Getters, Setters and Access Modifiers', type: 'coding', diff: 'Easy', pts: 10, time: '20 mins' },
          { order: 9, title: 'Composition vs Inheritance Design Patterns', type: 'practical', diff: 'Hard', pts: 20, time: '45 mins' },
          { order: 10, title: 'OOP Bank Management Mini Project', type: 'project', diff: 'Hard', pts: 30, time: '60 mins' }
        ]
      }
    ]
  },
  {
    key: 'python',
    title: 'Python Full Stack',
    slug: 'python-full-stack',
    icon: '🐍',
    color: 'from-blue-500 to-cyan-500',
    modules: [
      {
        order: 1,
        title: 'Python Essentials & Data Structures',
        description: 'Python syntax, built-in collections, functions, modules, and comprehensions.',
        tasks: [
          { order: 1, title: 'Python Setup, Interactive Shell & Script Execution', type: 'reading', diff: 'Easy', pts: 10, time: '15 mins' },
          { order: 2, title: 'Variables, Dynamic Typing & Type Conversions', type: 'coding', diff: 'Easy', pts: 10, time: '20 mins' },
          { order: 3, title: 'Lists, Slicing & Built-in List Methods', type: 'coding', diff: 'Easy', pts: 10, time: '25 mins' },
          { order: 4, title: 'Tuples and Set Operations', type: 'coding', diff: 'Easy', pts: 10, time: '20 mins' },
          { order: 5, title: 'Dictionaries & Key-Value Manipulations', type: 'coding', diff: 'Medium', pts: 15, time: '25 mins' },
          { order: 6, title: 'List, Set and Dictionary Comprehensions', type: 'coding', diff: 'Medium', pts: 15, time: '30 mins' },
          { order: 7, title: 'Functions, *args, **kwargs and Lambda Expressions', type: 'coding', diff: 'Medium', pts: 15, time: '30 mins' },
          { order: 8, title: 'Python File Handling (with context managers)', type: 'coding', diff: 'Medium', pts: 15, time: '25 mins' },
          { order: 9, title: 'Exception Handling with try-except-finally-raise', type: 'debugging', diff: 'Medium', pts: 15, time: '25 mins' },
          { order: 10, title: 'Python Data Processing Capstone Challenge', type: 'challenge', diff: 'Hard', pts: 25, time: '45 mins' }
        ]
      }
    ]
  },
  {
    key: 'cpp',
    title: 'C++ Systems & DSA Mastery',
    slug: 'cpp-mastery',
    icon: '⚡',
    color: 'from-purple-500 to-indigo-500',
    modules: [
      {
        order: 1,
        title: 'C++ Fundamentals & Memory Management',
        description: 'Pointers, references, dynamic memory, structs, and STL vectors.',
        tasks: [
          { order: 1, title: 'C++ Setup, Compilers (g++) and Basic I/O (cin/cout)', type: 'reading', diff: 'Easy', pts: 10, time: '15 mins' },
          { order: 2, title: 'Pointers and Addresses (& and * operators)', type: 'coding', diff: 'Medium', pts: 15, time: '30 mins' },
          { order: 3, title: 'References and Pass-by-Reference in Functions', type: 'coding', diff: 'Easy', pts: 10, time: '20 mins' },
          { order: 4, title: 'Dynamic Memory Allocation (new and delete)', type: 'coding', diff: 'Medium', pts: 15, time: '30 mins' },
          { order: 5, title: 'C++ Classes, Constructors and Destructors', type: 'coding', diff: 'Medium', pts: 15, time: '30 mins' },
          { order: 6, title: 'Operator Overloading in C++', type: 'coding', diff: 'Medium', pts: 15, time: '30 mins' },
          { order: 7, title: 'Standard Template Library (STL) Vector & Iterators', type: 'coding', diff: 'Medium', pts: 15, time: '30 mins' },
          { order: 8, title: 'STL Map, Set and Unordered Associative Containers', type: 'coding', diff: 'Hard', pts: 20, time: '35 mins' },
          { order: 9, title: 'Smart Pointers — unique_ptr and shared_ptr', type: 'coding', diff: 'Hard', pts: 20, time: '40 mins' },
          { order: 10, title: 'C++ High Performance Memory Arena Challenge', type: 'challenge', diff: 'Hard', pts: 30, time: '60 mins' }
        ]
      }
    ]
  },
  {
    key: 'react',
    title: 'React Modern Web Engineering',
    slug: 'react-frontend-mastery',
    icon: '⚛️',
    color: 'from-cyan-500 to-teal-500',
    modules: [
      {
        order: 1,
        title: 'React Components & Hooks Architecture',
        description: 'JSX, functional components, props, useState, useEffect, and custom hooks.',
        tasks: [
          { order: 1, title: 'Modern React Architecture & Vite Setup', type: 'reading', diff: 'Easy', pts: 10, time: '15 mins' },
          { order: 2, title: 'JSX Syntax, Fragments and Embedding Expressions', type: 'coding', diff: 'Easy', pts: 10, time: '20 mins' },
          { order: 3, title: 'Functional Components and Props Destructuring', type: 'coding', diff: 'Easy', pts: 10, time: '20 mins' },
          { order: 4, title: 'State Management with useState Hook', type: 'coding', diff: 'Easy', pts: 10, time: '25 mins' },
          { order: 5, title: 'Side Effects and Lifecycle with useEffect', type: 'coding', diff: 'Medium', pts: 15, time: '30 mins' },
          { order: 6, title: 'Conditional Rendering and List Rendering with Keys', type: 'coding', diff: 'Easy', pts: 10, time: '20 mins' },
          { order: 7, title: 'Controlled Forms and Form Validation in React', type: 'coding', diff: 'Medium', pts: 15, time: '30 mins' },
          { order: 8, title: 'Performance Optimization with useMemo & useCallback', type: 'debugging', diff: 'Hard', pts: 20, time: '35 mins' },
          { order: 9, title: 'Building a Reusable Custom Hook (useFetch/useDebounce)', type: 'practical', diff: 'Hard', pts: 20, time: '40 mins' },
          { order: 10, title: 'Interactive Product Catalog Mini App', type: 'project', diff: 'Hard', pts: 30, time: '60 mins' }
        ]
      }
    ]
  }
];

async function seed() {
  await connectDB();
  console.log('\n🚀 Seeding All 4 Domains Syllabus (Java, Python, C++, React)...\n');

  for (const d of DOMAIN_DATA) {
    // 1. Course
    let course = await Course.findOne({
      $or: [{ slug: d.slug }, { title: d.title }]
    });

    if (!course) {
      course = await Course.create({
        title: d.title,
        slug: d.slug,
        description: `Official comprehensive curriculum for ${d.title}.`,
        category: 'Software Development',
        icon: d.icon,
        color: d.color,
        durationWeeks: 12,
        totalHours: 120,
        isActive: true
      });
      console.log(`✅ Created Course: ${d.title}`);
    }

    // 2. Modules & Tasks
    for (const mData of d.modules) {
      let mod = await Module.findOne({
        courseId: course._id,
        order: mData.order
      });

      if (!mod) {
        mod = await Module.create({
          courseId: course._id,
          domain: d.key,
          title: mData.title,
          description: mData.description,
          order: mData.order,
          isPublished: true
        });
        console.log(`  📁 Created Module: ${mData.title} [${d.key}]`);
      } else {
        mod.domain = d.key;
        await mod.save();
      }

      // Tasks
      for (const tData of mData.tasks) {
        const existingTask = await DomainTask.findOne({
          moduleId: mod._id,
          order: tData.order
        });

        if (!existingTask) {
          await DomainTask.create({
            moduleId: mod._id,
            courseId: course._id,
            domain: d.key,
            title: tData.title,
            description: `Hands-on practical task for ${tData.title} in ${mData.title}.`,
            instructions: `1. Follow the guidelines for ${tData.title}\n2. Verify the solution and write clean code.`,
            expectedOutput: 'Test passed successfully',
            taskType: tData.type,
            difficulty: tData.diff,
            points: tData.pts,
            estimatedTime: tData.time,
            order: tData.order,
            isActive: true,
            isEnabled: true
          });
        }
      }
      console.log(`    ↳ Tasks ready for module ${mData.order} (${mData.tasks.length} tasks)`);
    }
  }

  console.log('\n✅ All 4 domains syllabus seeded successfully!\n');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});
