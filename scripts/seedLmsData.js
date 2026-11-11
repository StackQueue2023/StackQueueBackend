require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');

const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const TrainerProfile = require('../models/TrainerProfile');
const Course = require('../models/Course');
const Module = require('../models/Module');
const Concept = require('../models/Concept');
const ConceptTask = require('../models/ConceptTask');
const ConceptTaskSubmission = require('../models/ConceptTaskSubmission');
const Session = require('../models/Session');
const Attendance = require('../models/Attendance');
const Notification = require('../models/Notification');

async function seedLMS() {
  try {
    await connectDB();
    console.log('[Seed LMS] Connected to DB.');

    // 1. Ensure Admin User
    let admin = await User.findOne({ email: 'admin@codequest.com' });
    if (!admin) {
      admin = await User.create({
        name: 'Super Admin',
        email: 'admin@codequest.com',
        username: 'admin',
        password: 'Admin@123',
        role: 'admin'
      });
      console.log('[Seed LMS] Created Admin: admin@codequest.com');
    }

    // 2. Ensure Tutor Arun
    let tutor = await User.findOne({ email: 'arun@codequest.com' });
    if (!tutor) {
      tutor = await User.create({
        name: 'Arun',
        email: 'arun@codequest.com',
        username: 'arun_tutor',
        password: 'Tutor@123',
        role: 'tutor'
      });
      console.log('[Seed LMS] Created Tutor Arun: arun@codequest.com');
    } else {
      tutor.role = 'tutor';
      await tutor.save();
    }

    let tutorProfile = await TrainerProfile.findOne({ userId: tutor._id });
    if (!tutorProfile) {
      tutorProfile = await TrainerProfile.create({
        userId: tutor._id,
        bio: 'Senior Java & Enterprise Cloud Architect with 10+ years of teaching experience.'
      });
    }

    // 3. Create / Ensure Course "Java Full Stack"
    let course = await Course.findOne({ title: 'Java Full Stack' });
    if (!course) {
      course = await Course.create({
        title: 'Java Full Stack',
        slug: 'java-full-stack',
        description: 'Comprehensive industry-aligned curriculum covering Core Java, OOP, Collections, JDBC, Servlets, Spring Boot, and React.',
        category: 'Software Development',
        level: 'All Levels',
        durationWeeks: 16,
        totalHours: 160
      });
      console.log('[Seed LMS] Created Course: Java Full Stack');
    }

    // 4. Ensure Student STU1001 Kumar
    let student = await User.findOne({
      $or: [{ email: 'kumar@codequest.com' }, { studentId: 'STU1001' }]
    });

    if (!student) {
      student = await User.create({
        name: 'Kumar',
        email: 'kumar@codequest.com',
        username: 'stu1001',
        studentId: 'STU1001',
        password: 'Student@123',
        role: 'student'
      });
      console.log('[Seed LMS] Created Student STU1001 Kumar');
    } else {
      student.studentId = 'STU1001';
      student.role = 'student';
      await student.save();
    }

    let studentProfile = await StudentProfile.findOne({ userId: student._id });
    if (!studentProfile) {
      studentProfile = await StudentProfile.create({
        userId: student._id,
        studentId: 'STU1001',
        enrolledCourseId: course._id,
        assignedTutorId: tutor._id,
        totalXp: 450
      });
      console.log('[Seed LMS] Created StudentProfile for Kumar');
    } else {
      studentProfile.studentId = 'STU1001';
      studentProfile.enrolledCourseId = course._id;
      studentProfile.assignedTutorId = tutor._id;
      await studentProfile.save();
    }

    // 5. Build Modules Hierarchy
    // Clean old modules & concepts for this course
    await Module.deleteMany({ courseId: course._id });
    await Concept.deleteMany({ courseId: course._id });
    await ConceptTask.deleteMany({ courseId: course._id });

    const moduleDefs = [
      {
        title: 'Java Basics',
        order: 1,
        concepts: ['Variables', 'Data Types', 'Operators', 'Loops']
      },
      {
        title: 'OOP',
        order: 2,
        concepts: ['Class', 'Object', 'Inheritance', 'Polymorphism']
      },
      {
        title: 'Collections',
        order: 3,
        concepts: ['ArrayList', 'LinkedList', 'HashSet', 'HashMap']
      },
      {
        title: 'JDBC',
        order: 4,
        concepts: ['Connection', 'Statement', 'PreparedStatement']
      },
      {
        title: 'Servlet',
        order: 5,
        concepts: ['Servlet Lifecycle', 'Request & Response', 'Session Management']
      },
      {
        title: 'JSP',
        order: 6,
        concepts: ['JSP Directives', 'JSP Scriptlets', 'JSTL']
      },
      {
        title: 'Spring',
        order: 7,
        concepts: ['Dependency Injection', 'Inversion of Control', 'Spring Beans']
      },
      {
        title: 'Spring Boot',
        order: 8,
        concepts: ['REST Controller', 'Spring Data JPA', 'Microservices']
      },
      {
        title: 'React',
        order: 9,
        concepts: ['Components & Props', 'State & Hooks', 'Axios Integration']
      }
    ];

    let hashMapConcept = null;
    let collectionsModule = null;

    for (const mDef of moduleDefs) {
      const mod = await Module.create({
        courseId: course._id,
        title: mDef.title,
        order: mDef.order,
        description: `Comprehensive module covering ${mDef.title}.`
      });

      if (mDef.title === 'Collections') {
        collectionsModule = mod;
      }

      let cptOrder = 1;
      for (const cTitle of mDef.concepts) {
        // Status determination:
        // Java Basics & OOP: COMPLETED by tutor
        // Collections: ArrayList, LinkedList, HashSet, HashMap: COMPLETED by tutor Arun
        // JDBC: IN_PROGRESS
        // Others: NOT_STARTED
        let tStatus = 'NOT_STARTED';
        if (['Java Basics', 'OOP'].includes(mDef.title)) {
          tStatus = 'COMPLETED';
        } else if (mDef.title === 'Collections') {
          tStatus = 'COMPLETED';
        } else if (mDef.title === 'JDBC' && cTitle === 'Connection') {
          tStatus = 'IN_PROGRESS';
        }

        const cpt = await Concept.create({
          moduleId: mod._id,
          courseId: course._id,
          title: cTitle,
          order: cptOrder++,
          assignedTutorId: tutor._id,
          tutorStatus: tStatus,
          tutorCompletedAt: tStatus === 'COMPLETED' ? new Date() : null
        });

        if (mDef.title === 'Collections' && cTitle === 'HashMap') {
          hashMapConcept = cpt;
        }

        // For completed concepts prior to HashMap, create 5 dummy tasks and mark them completed
        if (tStatus === 'COMPLETED' && cTitle !== 'HashMap') {
          for (let i = 1; i <= 5; i++) {
            const tsk = await ConceptTask.create({
              taskId: `TASK-${cTitle.toUpperCase().replace(/\s+/g, '')}-0${i}`,
              conceptId: cpt._id,
              moduleId: mod._id,
              courseId: course._id,
              question: `Implement foundational exercise for ${cTitle} (Task 0${i})`,
              description: `Practice key interview and syntax patterns for ${cTitle}.`,
              expectedOutput: `Success output ${i}`,
              difficulty: i <= 2 ? 'Easy' : i <= 4 ? 'Medium' : 'Hard',
              marks: 10,
              order: i
            });

            // Mark completed by Kumar
            await ConceptTaskSubmission.create({
              studentId: student._id,
              conceptId: cpt._id,
              taskId: tsk._id,
              status: 'COMPLETED',
              codeAnswer: `// Solution for ${cTitle} Task ${i}\nSystem.out.println("Success output ${i}");`,
              output: `Success output ${i}`,
              marksAwarded: 10
            });
          }
        }
      }
    }

    // 6. Create 10 Tasks for Concept "HashMap"
    const hashMapTasks = [
      {
        taskId: 'TASK-JAVA-HM-01',
        question: 'Initialize a HashMap and Insert 5 Student Roll Numbers and Names',
        description: 'Create a HashMap<Integer, String>, insert 5 student records, and print the size of the map.',
        expectedOutput: 'Size: 5',
        difficulty: 'Easy',
        marks: 10,
        order: 1
      },
      {
        taskId: 'TASK-JAVA-HM-02',
        question: 'Retrieve Values using Key and handle getOrDefault()',
        description: 'Demonstrate fetching an existing key and using getOrDefault for a non-existing key.',
        expectedOutput: 'Found: Kumar, Default: Not Found',
        difficulty: 'Easy',
        marks: 10,
        order: 2
      },
      {
        taskId: 'TASK-JAVA-HM-03',
        question: 'Check Key and Value Existence with containsKey and containsValue',
        description: 'Verify if key 101 and value "Arun" exist in the employee map.',
        expectedOutput: 'HasKey: true, HasVal: true',
        difficulty: 'Easy',
        marks: 10,
        order: 3
      },
      {
        taskId: 'TASK-JAVA-HM-04',
        question: 'Iterate over HashMap using entrySet and Map.Entry',
        description: 'Traverse all key-value entries in the map and print them in formatted string "K => V".',
        expectedOutput: 'Entries printed successfully',
        difficulty: 'Medium',
        marks: 10,
        order: 4
      },
      {
        taskId: 'TASK-JAVA-HM-05',
        question: 'Frequency Counter of Words in a Sentence',
        description: 'Count the frequency of each word in "apple banana apple orange apple banana" using HashMap.',
        expectedOutput: '{apple=3, banana=2, orange=1}',
        difficulty: 'Medium',
        marks: 10,
        order: 5
      },
      {
        taskId: 'TASK-JAVA-HM-06',
        question: 'Remove Keys and use remove(key, value) Conditional Removal',
        description: 'Remove entry with key 103 only if its current value matches "Inactive".',
        expectedOutput: 'Removed: true',
        difficulty: 'Medium',
        marks: 10,
        order: 6
      },
      {
        taskId: 'TASK-JAVA-HM-07',
        question: 'Find First Non-Repeating Character in a String using LinkedHashMap',
        description: 'Given string "swiss", return the first character that occurs only once.',
        expectedOutput: 'First non-repeating: w',
        difficulty: 'Medium',
        marks: 10,
        order: 7
      },
      {
        taskId: 'TASK-JAVA-HM-08',
        question: 'Sort a HashMap by its Values using Stream API',
        description: 'Sort student name to score mapping in descending order of marks.',
        expectedOutput: 'Sorted map entries verified',
        difficulty: 'Hard',
        marks: 10,
        order: 8
      },
      {
        taskId: 'TASK-JAVA-HM-09',
        question: 'Two Sum Problem using HashMap in O(n) Time',
        description: 'Find indices of two numbers that add up to a target sum using a complement hash map.',
        expectedOutput: 'Indices: [0, 1]',
        difficulty: 'Hard',
        marks: 10,
        order: 9
      },
      {
        taskId: 'TASK-JAVA-HM-10',
        question: 'Custom Key Object with overridden hashCode() and equals()',
        description: 'Create an Employee class used as key in HashMap and verify collision handling.',
        expectedOutput: 'Map lookup with custom key: Success',
        difficulty: 'Hard',
        marks: 10,
        order: 10
      }
    ];

    console.log('[Seed LMS] Creating 10 tasks for HashMap concept...');
    const createdHashMapTasks = [];
    for (const t of hashMapTasks) {
      const taskDoc = await ConceptTask.create({
        ...t,
        conceptId: hashMapConcept._id,
        moduleId: collectionsModule._id,
        courseId: course._id
      });
      createdHashMapTasks.push(taskDoc);
    }

    // 7. Complete 7 of the 10 tasks for Kumar (so Task Progress = 7/10 = 70%!)
    await ConceptTaskSubmission.deleteMany({ studentId: student._id, conceptId: hashMapConcept._id });
    for (let i = 0; i < 7; i++) {
      const t = createdHashMapTasks[i];
      await ConceptTaskSubmission.create({
        studentId: student._id,
        conceptId: hashMapConcept._id,
        taskId: t._id,
        status: 'COMPLETED',
        codeAnswer: `// Java Solution for ${t.taskId}\npublic class Solution {\n  public static void main(String[] args) {\n    System.out.println("${t.expectedOutput}");\n  }\n}`,
        output: t.expectedOutput,
        marksAwarded: 10,
        completedAt: new Date(Date.now() - (7 - i) * 3600000)
      });
    }
    console.log('[Seed LMS] Submitted 7 / 10 tasks for Kumar on HashMap (70% progress)!');

    // 8. Schedule Today's Class (ONLINE with real Admin meeting link)
    // and Upcoming Class (OFFLINE with classroom)
    // 8. Clean up old sessions
    await Session.deleteMany({ courseId: course._id });

    // 10. Create Notifications
    await Notification.deleteMany({ userId: student._id });
    await Notification.create([
      {
        userId: student._id,
        title: '🔔 Today\'s Class Live: Collections → HashMap',
        message: 'Your 10:00 AM online class has started. Click [ JOIN CLASS ] to participate.',
        type: 'training_reminder'
      },
      {
        userId: student._id,
        title: '🔓 New Concept Tasks Available: HashMap',
        message: 'Tutor Arun marked HashMap as COMPLETED. 10 interactive tasks are now unlocked!',
        type: 'challenge_unlocked'
      },
      {
        userId: student._id,
        title: '✓ Task Completed: HashMap Task 07',
        message: 'You have solved 7 of 10 tasks for HashMap (70% progress). Keep going!',
        type: 'challenge_completed'
      },
      {
        userId: student._id,
        title: '⚠ Class Attendance: Action Needed',
        message: 'You were marked absent on a recent class. Please submit your absence reason.',
        type: 'attendance_warning'
      }
    ]);

    console.log('====================================================');
    console.log('✅ LMS SEED COMPLETE!');
    console.log('Admin credentials:    admin@codequest.com / Admin@123');
    console.log('Tutor credentials:    arun@codequest.com / Tutor@123 (Name: Arun)');
    console.log('Student credentials:  STU1001 (or kumar@codequest.com) / Student@123');
    console.log('Course:               Java Full Stack');
    console.log('HashMap Concept:      10 Tasks, 7 Completed (70%)');
    console.log('Online Class:         https://meet.google.com/java-collections-hashmap');
    console.log('Offline Class:        Lab 204, Tech Wing, Main Campus');
    console.log('Attendance:           41 Present, 4 Absent, 2 Leave = 47 Total');
    console.log('====================================================');

    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seedLMS();
