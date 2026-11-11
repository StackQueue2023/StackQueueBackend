const Course = require('../models/Course');
const CourseCategory = require('../models/CourseCategory');
const Domain = require('../models/Domain');
const Internship = require('../models/Internship');
const Project = require('../models/Project');
const Module = require('../models/Module');
const DomainTask = require('../models/DomainTask');
const {
  extractTextFromPdf,
  splitTextIntoModules,
  generateTasksForModule
} = require('../services/syllabusGeneratorService');
const {
  DOMAIN_CATEGORIES,
  DEFAULT_DOMAIN_CATEGORY,
  normalizeCategory
} = require('../constants/domains');
const {
  syncProjectToRequirement,
  removeProjectRequirement
} = require('../services/projectSyncService');

// Helper to make slug
function makeSlug(text) {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const DEFAULT_INITIAL_DOMAINS = [
  'Artificial Intelligence',
  'Cloud Architecture',
  'Cross-Platform Mobile',
  'Data Architecture',
  'Enterprise Software',
  'Interview Preparation',
  'Modern Web Engineering',
  'Security Engineering'
];

async function ensureInitialDomains() {
  const count = await Domain.countDocuments();
  if (count === 0) {
    const docs = DEFAULT_INITIAL_DOMAINS.map((name, index) => ({
      name,
      slug: makeSlug(name),
      description: `Technical domain covering ${name} specializations.`,
      displayOrder: index
    }));
    await Domain.insertMany(docs, { ordered: false }).catch(() => {});
  }
}

// ─────────────────────────────────────────────────────────
// 1. GET /api/admin/domain-management/all
// Returns all courses, internships, and projects in one call
// ─────────────────────────────────────────────────────────
exports.getAllDomainData = async (req, res) => {
  try {
    await ensureInitialDomains();

    const [courses, internships, projects, categories, domains] = await Promise.all([
      Course.find().populate('domainId').sort({ createdAt: -1 }).lean(),
      Internship.find().populate('domainId').sort({ createdAt: -1 }).lean(),
      Project.find().populate('domainId').populate('courseId', 'title slug').sort({ createdAt: -1 }).lean(),
      CourseCategory.find().sort({ domain: 1, name: 1 }).lean(),
      Domain.find().sort({ name: 1 }).lean()
    ]);

    // Fast in-memory counting (0 extra DB round trips, eliminates N+1 latency completely)
    const categoryCountMap = new Map();
    courses.forEach(c => {
      if (c.categoryId) {
        const idStr = (c.categoryId._id || c.categoryId).toString();
        categoryCountMap.set(idStr, (categoryCountMap.get(idStr) || 0) + 1);
      }
      if (c.category) {
        const key = `${(c.domain || '').toLowerCase()}_${c.category.toLowerCase().trim()}`;
        categoryCountMap.set(key, (categoryCountMap.get(key) || 0) + 1);
      }
    });

    const categoriesWithCount = categories.map(cat => {
      const idStr = cat._id.toString();
      const key = `${(cat.domain || '').toLowerCase()}_${(cat.name || '').toLowerCase().trim()}`;
      const count = categoryCountMap.get(idStr) || categoryCountMap.get(key) || 0;
      return {
        ...cat,
        courseCount: count
      };
    });

    // Domain metrics: count categories and courses under each domain
    const domainCatMap = new Map();
    const domainCourseMap = new Map();
    categories.forEach(cat => {
      if (cat.domain) {
        const k = cat.domain.toLowerCase().trim();
        domainCatMap.set(k, (domainCatMap.get(k) || 0) + 1);
      }
    });
    courses.forEach(c => {
      if (c.domain) {
        const k = c.domain.toLowerCase().trim();
        domainCourseMap.set(k, (domainCourseMap.get(k) || 0) + 1);
      }
    });

    const domainsWithCount = domains.map(dom => {
      const k = (dom.name || '').toLowerCase().trim();
      return {
        ...dom,
        categoryCount: domainCatMap.get(k) || 0,
        courseCount: domainCourseMap.get(k) || 0
      };
    });

    return res.json({
      success: true,
      data: {
        courses,
        internships,
        projects,
        categories: categoriesWithCount,
        domains: domainsWithCount,
        counts: {
          courses: courses.length,
          internships: internships.length,
          projects: projects.length,
          categories: categoriesWithCount.length,
          domains: domainsWithCount.length
        }
      }
    });
  } catch (err) {
    console.error('getAllDomainData error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────
// 2. COURSES CRUD
// ─────────────────────────────────────────────────────────
exports.getCourses = async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 }).lean();
    return res.json({ success: true, data: courses });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Helper: Auto-generate starter syllabus modules and tasks for student side
async function autoGenerateSyllabusModules(courseOrInternship, type = 'course') {
  try {
    const courseId = type === 'course' ? courseOrInternship._id : null;
    const domainSlug = (courseOrInternship.slug || courseOrInternship.domain || courseOrInternship.title).toLowerCase().replace(/[^a-z0-9]/g, '');

    // Check if modules already exist for THIS specific course (or domain for internship)
    const query = type === 'course' ? { courseId: courseOrInternship._id } : { domain: domainSlug };
    const existing = await Module.find(query);

    if (existing && existing.length > 0) return;

    const moduleTemplates = [
      {
        order: 1,
        title: `Module 1: ${courseOrInternship.title} Fundamentals & Core Syntax`,
        description: `Introduction to environment setup, basic syntax, and foundational concepts for ${courseOrInternship.title}.`,
        tasks: [
          { order: 1, title: 'Environment Setup and Hello World Output', diff: 'Easy', pts: 10, input: 'World', output: 'Hello World!' },
          { order: 2, title: 'Variable Definitions and Basic Data Types', diff: 'Easy', pts: 10, input: '10 20', output: '30' },
          { order: 3, title: 'Input Parsing and Formatting Operations', diff: 'Easy', pts: 10, input: 'Alice 25', output: 'Name: Alice, Age: 25' }
        ]
      },
      {
        order: 2,
        title: `Module 2: Control Structures & Logic Building`,
        description: `Conditional statements, decision trees, and loop constructs for ${courseOrInternship.title}.`,
        tasks: [
          { order: 1, title: 'Conditional Branching and Range Evaluation', diff: 'Easy', pts: 10, input: '15', output: 'Odd Positive' },
          { order: 2, title: 'Iterative Processing with For and While Loops', diff: 'Medium', pts: 15, input: '5', output: '15' },
          { order: 3, title: 'Nested Loop Patterns and Search Algorithms', diff: 'Medium', pts: 15, input: '4', output: '*\n**\n***\n****' }
        ]
      },
      {
        order: 3,
        title: `Module 3: Functions & Modular Code Design`,
        description: `Defining functions, parameter passing, return values, and modular structuring in ${courseOrInternship.title}.`,
        tasks: [
          { order: 1, title: 'Function Declarations and Reusable Utilities', diff: 'Easy', pts: 10, input: '4 5', output: '20' },
          { order: 2, title: 'Array/List Traversals and In-Place Mutations', diff: 'Medium', pts: 15, input: '1,2,3,4,5', output: '15' },
          { order: 3, title: 'Recursion and Memory Stack Trace Analysis', diff: 'Hard', pts: 20, input: '5', output: '120' }
        ]
      },
      {
        order: 4,
        title: `Module 4: Advanced Concepts & Mini Capstone`,
        description: `Object-oriented principles, error handling, and end-to-end practical project exercises for ${courseOrInternship.title}.`,
        tasks: [
          { order: 1, title: 'Class Instantiation and Attribute Encapsulation', diff: 'Medium', pts: 15, input: 'Bank 1000', output: 'Balance: 1000' },
          { order: 2, title: 'Exception Handling and Robust Error Management', diff: 'Hard', pts: 20, input: '10 0', output: 'Error: Division by zero' },
          { order: 3, title: 'End-to-End Hands-on Practical Coding Project', diff: 'Hard', pts: 25, input: 'Project Alpha', output: 'Project Configured Successfully' }
        ]
      }
    ];

    const allStarterTasks = [];
    for (const mData of moduleTemplates) {
      const mod = await Module.create({
        courseId,
        domain: domainSlug,
        title: mData.title,
        description: mData.description,
        order: mData.order,
        isPublished: true
      });

      for (const tData of mData.tasks) {
        allStarterTasks.push({
          moduleId: mod._id,
          courseId: courseId || mod._id,
          domain: domainSlug,
          title: tData.title,
          description: `Practical task exercise covering ${tData.title} in ${courseOrInternship.title}.`,
          sampleInput: tData.input,
          sampleOutput: tData.output,
          expectedOutput: tData.output,
          difficulty: tData.diff,
          points: tData.pts,
          order: tData.order,
          isEnabled: true,
          isActive: true,
          testCases: [
            { input: tData.input, expectedOutput: tData.output, isHidden: false, explanation: 'Sample verification test case.' },
            { input: tData.input + ' extra', expectedOutput: tData.output, isHidden: true, explanation: 'Hidden verification test case.' }
          ]
        });
      }
    }

    if (allStarterTasks.length > 0) {
      await DomainTask.insertMany(allStarterTasks, { ordered: false });
    }
  } catch (err) {
    console.error('autoGenerateSyllabusModules error:', err);
  }
}

// Helper: Process text, PDF file, or auto-generated syllabus modules upon creation
async function processSyllabusForCourseOrInternship(courseOrInternship, type = 'course', req) {
  try {
    const courseId = type === 'course' ? courseOrInternship._id : null;
    const domainSlug = (courseOrInternship.slug || courseOrInternship.domain || courseOrInternship.title).toLowerCase().replace(/[^a-z0-9]/g, '');
    const tasksPerModule = Math.min(15, Math.max(10, parseInt(req.body?.tasksPerModule, 10) || 12));

    let rawText = req.body?.syllabusText || '';

    // If PDF file uploaded via multer
    if (req.file) {
      const extracted = await extractTextFromPdf(req.file.buffer);
      if (extracted && extracted.trim()) {
        rawText = extracted;
      }
    }

    if (rawText && rawText.trim()) {
      const parsedModules = splitTextIntoModules(rawText, domainSlug);
      if (parsedModules && parsedModules.length > 0) {
        const allTasksToInsert = [];
        for (let i = 0; i < parsedModules.length; i++) {
          const pMod = parsedModules[i];
          const modOrder = i + 1;
          const mod = await Module.create({
            courseId,
            domain: domainSlug,
            title: pMod.title,
            description: pMod.description || `Syllabus module covering ${pMod.title}.`,
            order: modOrder,
            isPublished: true
          });

          const generatedTasks = generateTasksForModule(pMod, domainSlug, tasksPerModule);
          for (let j = 0; j < generatedTasks.length; j++) {
            const gTask = generatedTasks[j];
            allTasksToInsert.push({
              moduleId: mod._id,
              courseId: courseId || mod._id,
              domain: domainSlug,
              title: gTask.title,
              description: gTask.description || `Practice exercise for ${gTask.title}.`,
              instructions: gTask.instructions || '',
              problemStatement: gTask.problemStatement || '',
              inputFormat: gTask.inputFormat || '',
              outputFormat: gTask.outputFormat || '',
              constraints: gTask.constraints || '',
              sampleInput: gTask.sampleInput || '',
              sampleOutput: gTask.sampleOutput || '',
              sampleInput2: gTask.sampleInput2 || '',
              sampleOutput2: gTask.sampleOutput2 || '',
              expectedOutput: gTask.expectedOutput || '',
              starterCode: gTask.starterCode || '',
              referenceSolution: gTask.referenceSolution || '',
              explanation: gTask.explanation || '',
              difficulty: gTask.difficulty || 'Easy',
              points: gTask.points || 10,
              order: j + 1,
              isEnabled: true,
              isActive: true,
              testCases: gTask.testCases || []
            });
          }
        }

        if (allTasksToInsert.length > 0) {
          await DomainTask.insertMany(allTasksToInsert, { ordered: false });
        }
        return;
      }
    }

    // Fallback to auto-generate standard 4 modules if no custom text/file was supplied
    await autoGenerateSyllabusModules(courseOrInternship, type);
  } catch (err) {
    console.error('processSyllabusForCourseOrInternship error:', err);
    await autoGenerateSyllabusModules(courseOrInternship, type);
  }
}

exports.createCourse = async (req, res) => {
  try {
    const {
      title,
      slug,
      description,
      category,
      durationWeeks,
      durationText,
      totalHours,
      level,
      color,
      icon,
      isActive
    } = req.body;

    let trimmedTitle = (title && title.trim()) ? title.trim() : '';

    // If title was left blank but a PDF file was uploaded, extract title from PDF file name
    if (!trimmedTitle && req.file && req.file.originalname) {
      trimmedTitle = req.file.originalname.replace(/\.pdf$/i, '').replace(/[-_]+/g, ' ').trim();
    }

    if (!trimmedTitle) {
      return res.status(400).json({ success: false, message: 'Course title is required. Please enter a title at the top of the form.' });
    }

    const finalDescription = (description && description.trim()) 
      ? description.trim() 
      : `Comprehensive curriculum and hands-on modules covering ${trimmedTitle}.`;

    const generatedSlug = (slug && slug.trim()) ? makeSlug(slug) : makeSlug(trimmedTitle);

    // Check unique slug or exact title match
    const existing = await Course.findOne({
      $or: [
        { slug: generatedSlug },
        { title: { $regex: new RegExp(`^${trimmedTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }
      ]
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `A course with title "${trimmedTitle}" already exists.`
      });
    }

    let resolvedDomain = (req.body.domain && req.body.domain.trim()) || (category && category.trim()) || 'Programming Language';
    let resolvedDomainId = req.body.domainId || null;

    if (!resolvedDomainId && resolvedDomain) {
      const domObj = await Domain.findOne({
        name: { $regex: new RegExp(`^${resolvedDomain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
      });
      if (domObj) {
        resolvedDomainId = domObj._id;
        resolvedDomain = domObj.name;
      }
    } else if (resolvedDomainId) {
      const domObj = await Domain.findById(resolvedDomainId);
      if (domObj) {
        resolvedDomain = domObj.name;
      }
    }

    const durationUnit = req.body.durationUnit && ['Weeks', 'Months', 'Days'].includes(req.body.durationUnit)
      ? req.body.durationUnit
      : 'Weeks';

    const durationValue = Number(req.body.durationValue || req.body.durationWeeks);
    if (!durationValue || isNaN(durationValue) || durationValue <= 0) {
      return res.status(400).json({ success: false, message: 'Course duration is required and must be a positive number.' });
    }

    const totalHoursVal = Number(req.body.totalHours);
    if (!totalHoursVal || isNaN(totalHoursVal) || totalHoursVal <= 0) {
      return res.status(400).json({ success: false, message: 'Total Course Hours is required and must be a positive number.' });
    }

    if (req.body.totalCourseFee === undefined || req.body.totalCourseFee === null || isNaN(Number(req.body.totalCourseFee)) || Number(req.body.totalCourseFee) < 0) {
      return res.status(400).json({ success: false, message: 'Total Course Fee is mandatory and must be a valid non-negative amount.' });
    }
    const parsedTotalFee = Number(req.body.totalCourseFee);

    if (req.body.monthlyInstallment === undefined || req.body.monthlyInstallment === null || isNaN(Number(req.body.monthlyInstallment)) || Number(req.body.monthlyInstallment) <= 0) {
      return res.status(400).json({ success: false, message: 'Monthly Installment Amount is mandatory and must be greater than 0.' });
    }
    const parsedMonthlyInstallment = Number(req.body.monthlyInstallment);

    // Course ID & Student ID Prefix validation (Mandatory)
    const { cleanPrefix } = require('../services/courseStudentIdService');
    let coursePrefixVal = cleanPrefix(req.body.coursePrefix);
    let studentIdPrefixVal = cleanPrefix(req.body.studentIdPrefix);
    let startingSequenceVal = Number(req.body.startingSequence);

    if (!coursePrefixVal) {
      coursePrefixVal = cleanPrefix('SQ-' + trimmedTitle.replace(/[^a-zA-Z0-9]/g, ''));
    }
    if (!studentIdPrefixVal) {
      studentIdPrefixVal = coursePrefixVal;
    }
    if (!startingSequenceVal || isNaN(startingSequenceVal) || startingSequenceVal < 1) {
      startingSequenceVal = 1;
    }

    const dupPrefix = await Course.findOne({
      coursePrefix: { $regex: new RegExp(`^${coursePrefixVal.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') }
    });
    if (dupPrefix) {
      return res.status(400).json({
        success: false,
        message: `Course ID Prefix "${coursePrefixVal}" is already used by course "${dupPrefix.title}". Course prefix must be unique.`
      });
    }

    const durationWeeksVal = durationUnit === 'Weeks' ? durationValue : (durationUnit === 'Months' ? durationValue * 4 : Math.ceil(durationValue / 7));
    const durationTextVal = req.body.durationText || `${durationValue} ${durationUnit}`;

    const course = await Course.create({
      title: trimmedTitle,
      slug: generatedSlug,
      description: finalDescription,
      category: resolvedDomain,
      domain: resolvedDomain,
      domainId: resolvedDomainId,
      coursePrefix: coursePrefixVal,
      studentIdPrefix: studentIdPrefixVal,
      startingSequence: startingSequenceVal,
      currentSequence: 0,
      studentIdFormat: `${studentIdPrefixVal}-0001`,
      durationValue,
      durationUnit,
      durationWeeks: durationWeeksVal,
      durationText: durationTextVal,
      totalCourseFee: parsedTotalFee,
      monthlyInstallment: parsedMonthlyInstallment,
      totalHours: totalHoursVal,
      level: level || 'All Levels',
      color: color || 'from-blue-600 to-indigo-600',
      icon: icon || 'Code',
      isActive: isActive !== false
    });

    // Auto-generate or process custom syllabus modules for student side
    await processSyllabusForCourseOrInternship(course, 'course', req);

    // Automatically generate questions across all 4 modules (Interview Arena, Game Hub, Mock Interview, Testing & Practice) in background
    try {
      const { generateSyllabusQuestions } = require('../services/syllabusQuestionGeneratorService');
      setImmediate(async () => {
        try {
          await generateSyllabusQuestions(course._id, { questionsPerTopic: 2 });
        } catch (bgErr) {
          console.error('Background auto-generate syllabus questions error on createCourse:', bgErr);
        }
      });
    } catch (genErr) {
      console.error('Auto-generate syllabus questions error on createCourse:', genErr);
    }

    return res.status(201).json({
      success: true,
      message: 'Course added successfully with syllabus modules.',
      data: course
    });
  } catch (err) {
    console.error('createCourse error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────
// 3. INTERNSHIPS CRUD
// ─────────────────────────────────────────────────────────
exports.getInternships = async (req, res) => {
  try {
    const internships = await Internship.find().sort({ createdAt: -1 }).lean();
    return res.json({ success: true, data: internships });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.createInternship = async (req, res) => {
  try {
    const {
      title,
      slug,
      description,
      domain,
      techStack,
      durationWeeks,
      durationText,
      stipend,
      isPaid,
      level,
      color,
      icon,
      isActive
    } = req.body;

    let trimmedTitle = (title && title.trim()) ? title.trim() : '';

    if (!trimmedTitle && req.file && req.file.originalname) {
      trimmedTitle = req.file.originalname.replace(/\.pdf$/i, '').replace(/[-_]+/g, ' ').trim();
    }

    if (!trimmedTitle) {
      return res.status(400).json({ success: false, message: 'Internship title is required. Please enter a title at the top of the form.' });
    }

    const finalDescription = (description && description.trim()) 
      ? description.trim() 
      : `Hands-on industry internship program covering ${trimmedTitle}.`;

    const generatedSlug = (slug && slug.trim()) ? makeSlug(slug) : makeSlug(trimmedTitle);

    const existing = await Internship.findOne({
      $or: [
        { slug: generatedSlug },
        { title: { $regex: new RegExp(`^${trimmedTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }
      ]
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `An internship with title "${trimmedTitle}" already exists.`
      });
    }

    // Process techStack if string
    let techArray = [];
    if (Array.isArray(techStack)) {
      techArray = techStack;
    } else if (typeof techStack === 'string') {
      techArray = techStack.split(',').map(s => s.trim()).filter(Boolean);
    }

    const finalDurationText = durationText || (Number(durationWeeks) === 2 ? '15 Days' : `${Number(durationWeeks) || 4} Weeks`);
    const finalDurationWeeks = Number(durationWeeks) || (durationText === '15 Days' ? 2 : durationText === '1 Month' ? 4 : 8);

    let targetDomainName = domain || req.body?.category || 'Full Stack Development';
    let targetDomainId = req.body?.domainId || null;
    const domObj = targetDomainId ? await Domain.findById(targetDomainId) : await Domain.findOne({
      name: { $regex: new RegExp(`^${targetDomainName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    });
    if (domObj) {
      targetDomainId = domObj._id;
      targetDomainName = domObj.name;
    }

    const internship = await Internship.create({
      title: trimmedTitle,
      slug: generatedSlug,
      description: finalDescription,
      domain: targetDomainName,
      domainId: targetDomainId,
      category: targetDomainName,
      techStack: techArray,
      durationWeeks: finalDurationWeeks,
      durationText: finalDurationText,
      stipend: Number(stipend) || 0,
      isPaid: Boolean(isPaid || (Number(stipend) > 0)),
      level: level || 'Intermediate',
      color: color || 'from-emerald-500 to-teal-600',
      icon: icon || '💼',
      isActive: isActive !== false
    });

    // Auto-generate or process custom syllabus modules for student side
    await processSyllabusForCourseOrInternship(internship, 'internship', req);

    return res.status(201).json({
      success: true,
      message: 'Internship added successfully with syllabus modules.',
      data: internship
    });
  } catch (err) {
    console.error('createInternship error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────
// 4. PROJECTS CRUD
// ─────────────────────────────────────────────────────────
exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find()
      .populate('courseId', 'title slug')
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ success: true, data: projects });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.createProject = async (req, res) => {
  try {
    const {
      title,
      slug,
      description,
      category,
      technologies,
      requirements,
      difficulty,
      xpReward,
      estimatedHours,
      courseId,
      status
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Project title is required.' });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ success: false, message: 'Project description is required.' });
    }

    const generatedSlug = (slug && slug.trim()) ? makeSlug(slug) : makeSlug(title);

    const existing = await Project.findOne({ slug: generatedSlug });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `A project with slug "${generatedSlug}" already exists.`
      });
    }

    let techArray = [];
    if (Array.isArray(technologies)) {
      techArray = technologies;
    } else if (typeof technologies === 'string') {
      techArray = technologies.split(',').map(s => s.trim()).filter(Boolean);
    }

    let reqArray = [];
    if (Array.isArray(requirements)) {
      reqArray = requirements;
    } else if (typeof requirements === 'string') {
      reqArray = requirements.split('\n').map(s => s.trim()).filter(Boolean);
    }

    let targetDomain = (req.body.domain && req.body.domain.trim()) || (category && category.trim()) || 'Enterprise Software';
    let targetDomainId = req.body.domainId || null;
    const domObj = targetDomainId ? await Domain.findById(targetDomainId) : await Domain.findOne({
      name: { $regex: new RegExp(`^${targetDomain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    });
    if (domObj) {
      targetDomainId = domObj._id;
      targetDomain = domObj.name;
    }

    const project = await Project.create({
      title: title.trim(),
      slug: generatedSlug,
      domain: targetDomain,
      domainId: targetDomainId,
      category: targetDomain,
      description: description.trim(),
      technologies: techArray,
      requirements: reqArray,
      difficulty: difficulty || 'Intermediate',
      xpReward: Number(xpReward) || 250,
      estimatedHours: Number(estimatedHours) || 20,
      courseId: courseId || null,
      isActive: true,
      status: status || 'Available'
    });

    // Synchronize to ProjectRequirement so it is instantly available in Tutor Review & Student projects
    await syncProjectToRequirement(project);

    return res.status(201).json({
      success: true,
      message: 'Project added successfully.',
      data: project
    });
  } catch (err) {
    console.error('createProject error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────
// 5. COURSE DETAILS & DELETE
// ─────────────────────────────────────────────────────────
exports.getCourseDetail = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId).populate('domainId', 'name slug');
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }
    if (course.domainId && course.domainId.name) {
      course.domain = course.domainId.name;
    }

    const domainSlug = (course.slug || course.title).toLowerCase().replace(/[^a-z0-9]/g, '');

    // Fetch published modules for this course/domain
    const modules = await Module.find({
      $or: [{ courseId: course._id }, { domain: domainSlug }],
      isPublished: { $ne: false }
    }).sort({ order: 1 });

    const moduleIds = modules.map(m => m._id);

    // Fetch active tasks that belong to these published modules
    const tasks = await DomainTask.find({
      moduleId: { $in: moduleIds },
      isActive: { $ne: false }
    }).sort({ order: 1 });

    const tasksByModule = {};
    tasks.forEach(t => {
      const mId = t.moduleId ? t.moduleId.toString() : 'unassigned';
      if (!tasksByModule[mId]) tasksByModule[mId] = [];
      tasksByModule[mId].push(t);
    });

    const populatedModules = modules.map(m => {
      const mTasks = tasksByModule[m._id.toString()] || [];
      return {
        ...m.toObject(),
        tasksCount: mTasks.length,
        tasks: mTasks
      };
    });

    const totalTasksCount = populatedModules.reduce((acc, m) => acc + m.tasksCount, 0);

    return res.json({
      success: true,
      data: {
        course,
        domainSlug,
        modules: populatedModules,
        totalModules: populatedModules.length,
        totalTasks: totalTasksCount
      }
    });
  } catch (err) {
    console.error('getCourseDetail error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId).populate('domainId', 'name slug');
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }
    if (course.domainId && course.domainId.name) {
      course.domain = course.domainId.name;
    }

    const domainSlug = (course.slug || course.title).toLowerCase().replace(/[^a-z0-9]/g, '');

    await Module.deleteMany({
      $or: [{ courseId: course._id }, { domain: domainSlug }]
    });
    await DomainTask.deleteMany({
      $or: [{ courseId: course._id }, { domain: domainSlug }]
    });
    await Course.findByIdAndDelete(courseId);

    return res.json({
      success: true,
      message: `Course "${course.title}" and its associated syllabus modules and tasks were deleted successfully.`
    });
  } catch (err) {
    console.error('deleteCourse error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description, category, durationWeeks, durationText, totalHours, level, isActive } = req.body;

    const course = await Course.findById(courseId).populate('domainId', 'name slug');
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }
    if (course.domainId && course.domainId.name) {
      course.domain = course.domainId.name;
    }

    if (title !== undefined) course.title = title.trim();
    if (description !== undefined) course.description = description.trim();
    
    // Maintain Associated Domain directly as the primary classification
    const targetDomainName = (req.body.domain && req.body.domain.trim()) || (req.body.category && req.body.category.trim());
    if (targetDomainName) {
      course.domain = targetDomainName;
      course.category = targetDomainName;
      const domObj = await Domain.findOne({
        name: { $regex: new RegExp(`^${targetDomainName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
      });
      if (domObj) {
        course.domainId = domObj._id;
        course.domain = domObj.name;
        course.category = domObj.name;
      }
    }
    if (req.body.domainId) {
      const domObj = await Domain.findById(req.body.domainId);
      if (domObj) {
        course.domainId = domObj._id;
        course.domain = domObj.name;
        course.category = domObj.name;
      }
    }
    if (req.body.durationValue !== undefined || durationWeeks !== undefined) {
      const dVal = Number(req.body.durationValue || durationWeeks);
      if (isNaN(dVal) || dVal <= 0) {
        return res.status(400).json({ success: false, message: 'Course duration must be a positive number.' });
      }
      course.durationValue = dVal;
      course.durationWeeks = (course.durationUnit === 'Months') ? dVal * 4 : dVal;
    }
    if (req.body.durationUnit !== undefined) {
      if (!['Weeks', 'Months', 'Days'].includes(req.body.durationUnit)) {
        return res.status(400).json({ success: false, message: 'Duration Unit must be Weeks, Months, or Days.' });
      }
      course.durationUnit = req.body.durationUnit;
      if (course.durationValue) {
        course.durationWeeks = course.durationUnit === 'Months' ? course.durationValue * 4 : course.durationValue;
      }
    }
    if (course.durationValue && course.durationUnit) {
      course.durationText = `${course.durationValue} ${course.durationUnit}`;
    } else if (durationText !== undefined) {
      course.durationText = durationText;
    }
    if (totalHours !== undefined) {
      const hVal = Number(totalHours);
      if (isNaN(hVal) || hVal <= 0) {
        return res.status(400).json({ success: false, message: 'Total Course Hours must be a positive number.' });
      }
      course.totalHours = hVal;
    }
    if (req.body.totalCourseFee !== undefined) {
      const feeVal = Number(req.body.totalCourseFee);
      if (isNaN(feeVal) || feeVal < 0) {
        return res.status(400).json({ success: false, message: 'Total Course Fee must be a valid non-negative amount.' });
      }
      course.totalCourseFee = feeVal;
    }
    if (req.body.monthlyInstallment !== undefined) {
      const instVal = Number(req.body.monthlyInstallment);
      if (isNaN(instVal) || instVal <= 0) {
        return res.status(400).json({ success: false, message: 'Monthly Installment Amount must be greater than 0.' });
      }
      course.monthlyInstallment = instVal;
    }

    const { cleanPrefix } = require('../services/courseStudentIdService');
    if (req.body.coursePrefix !== undefined) {
      const p = cleanPrefix(req.body.coursePrefix);
      if (p) {
        const dupPrefix = await Course.findOne({
          _id: { $ne: course._id },
          coursePrefix: { $regex: new RegExp(`^${p.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') }
        });
        if (dupPrefix) {
          return res.status(400).json({
            success: false,
            message: `Course Prefix "${p}" is already in use by course "${dupPrefix.title}".`
          });
        }
        course.coursePrefix = p;
      }
    }
    if (req.body.studentIdPrefix !== undefined) {
      const sp = cleanPrefix(req.body.studentIdPrefix);
      if (sp) {
        course.studentIdPrefix = sp;
        course.studentIdFormat = `${sp}-0001`;
      }
    }
    if (req.body.startingSequence !== undefined) {
      const seq = Number(req.body.startingSequence);
      if (!isNaN(seq) && seq >= 1) {
        course.startingSequence = seq;
      }
    }

    if (level !== undefined) course.level = level;
    if (isActive !== undefined) course.isActive = Boolean(isActive);

    await course.save();

    return res.json({
      success: true,
      message: `Course "${course.title}" updated successfully.`,
      data: course
    });
  } catch (err) {
    console.error('updateCourse error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────
// 6. INTERNSHIP DETAILS, UPDATE & DELETE
// ─────────────────────────────────────────────────────────
exports.getInternshipDetail = async (req, res) => {
  try {
    const { internshipId } = req.params;
    const internship = await Internship.findById(internshipId);
    if (!internship) {
      return res.status(404).json({ success: false, message: 'Internship not found.' });
    }

    const domainSlug = (internship.slug || internship.domain || internship.title).toLowerCase().replace(/[^a-z0-9]/g, '');

    const modules = await Module.find({
      $or: [{ domain: domainSlug }, { domain: (internship.domain || '').toLowerCase() }],
      isPublished: { $ne: false }
    }).sort({ order: 1 });

    const moduleIds = modules.map(m => m._id);

    const tasks = await DomainTask.find({
      moduleId: { $in: moduleIds },
      isActive: { $ne: false }
    }).sort({ order: 1 });

    const tasksByModule = {};
    tasks.forEach(t => {
      const mId = t.moduleId ? t.moduleId.toString() : 'unassigned';
      if (!tasksByModule[mId]) tasksByModule[mId] = [];
      tasksByModule[mId].push(t);
    });

    const populatedModules = modules.map(m => {
      const mTasks = tasksByModule[m._id.toString()] || [];
      return {
        ...m.toObject(),
        tasksCount: mTasks.length,
        tasks: mTasks
      };
    });

    const totalTasksCount = populatedModules.reduce((acc, m) => acc + m.tasksCount, 0);

    return res.json({
      success: true,
      data: {
        internship,
        domainSlug,
        modules: populatedModules,
        totalModules: populatedModules.length,
        totalTasks: totalTasksCount
      }
    });
  } catch (err) {
    console.error('getInternshipDetail error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateInternship = async (req, res) => {
  try {
    const { internshipId } = req.params;
    const { title, description, domain, category, techStack, durationWeeks, durationText, stipend, isPaid, level, isActive } = req.body;

    const internship = await Internship.findById(internshipId);
    if (!internship) {
      return res.status(404).json({ success: false, message: 'Internship not found.' });
    }

    if (title !== undefined) internship.title = title.trim();
    if (description !== undefined) internship.description = description.trim();
    const targetDom = (domain && domain.trim()) || (category && category.trim());
    if (targetDom) {
      internship.domain = targetDom;
      internship.category = targetDom;
      const domObj = await Domain.findOne({
        name: { $regex: new RegExp(`^${targetDom.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
      });
      if (domObj) {
        internship.domainId = domObj._id;
        internship.domain = domObj.name;
        internship.category = domObj.name;
      }
    }
    if (durationText !== undefined) internship.durationText = durationText;
    if (durationWeeks !== undefined) internship.durationWeeks = Number(durationWeeks);
    if (stipend !== undefined) internship.stipend = Number(stipend);
    if (isPaid !== undefined) internship.isPaid = Boolean(isPaid);
    if (level !== undefined) internship.level = level;
    if (isActive !== undefined) internship.isActive = Boolean(isActive);

    if (techStack !== undefined) {
      if (Array.isArray(techStack)) {
        internship.techStack = techStack;
      } else if (typeof techStack === 'string') {
        internship.techStack = techStack.split(',').map(s => s.trim()).filter(Boolean);
      }
    }

    await internship.save();

    return res.json({
      success: true,
      message: `Internship "${internship.title}" updated successfully.`,
      data: internship
    });
  } catch (err) {
    console.error('updateInternship error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteInternship = async (req, res) => {
  try {
    const { internshipId } = req.params;
    const internship = await Internship.findById(internshipId);
    if (!internship) {
      return res.status(404).json({ success: false, message: 'Internship not found.' });
    }

    const domainSlug = (internship.slug || internship.domain || internship.title).toLowerCase().replace(/[^a-z0-9]/g, '');

    await Module.deleteMany({
      $or: [{ domain: domainSlug }, { domain: (internship.domain || '').toLowerCase() }]
    });
    await DomainTask.deleteMany({
      $or: [{ domain: domainSlug }, { domain: (internship.domain || '').toLowerCase() }]
    });
    await Internship.findByIdAndDelete(internshipId);

    return res.json({
      success: true,
      message: `Internship "${internship.title}" and its associated modules were deleted successfully.`
    });
  } catch (err) {
    console.error('deleteInternship error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────
// 7. PROJECT DETAILS, UPDATE & DELETE
// ─────────────────────────────────────────────────────────
exports.getProjectDetail = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId).populate('courseId', 'title slug');
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const domainSlug = (project.slug || project.title).toLowerCase().replace(/[^a-z0-9]/g, '');

    const queryConditions = [{ domain: domainSlug }];
    if (project.courseId) queryConditions.push({ courseId: project.courseId._id || project.courseId });

    const modules = await Module.find({
      $or: queryConditions,
      isPublished: { $ne: false }
    }).sort({ order: 1 });

    const moduleIds = modules.map(m => m._id);

    const tasks = await DomainTask.find({
      moduleId: { $in: moduleIds },
      isActive: { $ne: false }
    }).sort({ order: 1 });

    const tasksByModule = {};
    tasks.forEach(t => {
      const mId = t.moduleId ? t.moduleId.toString() : 'unassigned';
      if (!tasksByModule[mId]) tasksByModule[mId] = [];
      tasksByModule[mId].push(t);
    });

    const populatedModules = modules.map(m => {
      const mTasks = tasksByModule[m._id.toString()] || [];
      return {
        ...m.toObject(),
        tasksCount: mTasks.length,
        tasks: mTasks
      };
    });

    const totalTasksCount = populatedModules.reduce((acc, m) => acc + m.tasksCount, 0);

    return res.json({
      success: true,
      data: {
        project,
        domainSlug,
        modules: populatedModules,
        totalModules: populatedModules.length,
        totalTasks: totalTasksCount
      }
    });
  } catch (err) {
    console.error('getProjectDetail error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, category, technologies, requirements, difficulty, xpReward, estimatedHours, courseId, status } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    if (title !== undefined) project.title = title.trim();
    if (description !== undefined) project.description = description.trim();
    const targetDomain = (req.body.domain && req.body.domain.trim()) || (category && category.trim());
    if (targetDomain) {
      project.domain = targetDomain;
      project.category = targetDomain;
      const domObj = await Domain.findOne({
        name: { $regex: new RegExp(`^${targetDomain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
      });
      if (domObj) {
        project.domainId = domObj._id;
        project.domain = domObj.name;
        project.category = domObj.name;
      }
    }
    if (difficulty !== undefined) project.difficulty = difficulty;
    if (xpReward !== undefined) project.xpReward = Number(xpReward);
    if (estimatedHours !== undefined) project.estimatedHours = Number(estimatedHours);
    if (courseId !== undefined) project.courseId = courseId || null;
    if (status !== undefined) project.status = status;

    if (technologies !== undefined) {
      if (Array.isArray(technologies)) {
        project.technologies = technologies;
      } else if (typeof technologies === 'string') {
        project.technologies = technologies.split(',').map(s => s.trim()).filter(Boolean);
      }
    }

    if (requirements !== undefined) {
      if (Array.isArray(requirements)) {
        project.requirements = requirements;
      } else if (typeof requirements === 'string') {
        project.requirements = requirements.split('\n').map(s => s.trim()).filter(Boolean);
      }
    }

    await project.save();

    // Synchronize updates to ProjectRequirement
    await syncProjectToRequirement(project);

    return res.json({
      success: true,
      message: `Project "${project.title}" updated successfully.`,
      data: project
    });
  } catch (err) {
    console.error('updateProject error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const domainSlug = (project.slug || project.title).toLowerCase().replace(/[^a-z0-9]/g, '');

    await removeProjectRequirement(project);
    await Module.deleteMany({ domain: domainSlug });
    await DomainTask.deleteMany({ domain: domainSlug });
    await Project.findByIdAndDelete(projectId);

    return res.json({
      success: true,
      message: `Project "${project.title}" and its associated modules were deleted successfully.`
    });
  } catch (err) {
    console.error('deleteProject error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.autoGenerateSyllabusModules = autoGenerateSyllabusModules;

// ─────────────────────────────────────────────────────────
// 8. COURSE CATEGORY MANAGEMENT CRUD
// ─────────────────────────────────────────────────────────

exports.getCourseCategories = async (req, res) => {
  try {
    const [categories, courses] = await Promise.all([
      CourseCategory.find().sort({ domain: 1, name: 1 }).lean(),
      Course.find().select('categoryId category domain').lean()
    ]);

    const categoryCountMap = new Map();
    courses.forEach(c => {
      if (c.categoryId) {
        const idStr = (c.categoryId._id || c.categoryId).toString();
        categoryCountMap.set(idStr, (categoryCountMap.get(idStr) || 0) + 1);
      }
      if (c.category) {
        const key = `${(c.domain || '').toLowerCase()}_${c.category.toLowerCase().trim()}`;
        categoryCountMap.set(key, (categoryCountMap.get(key) || 0) + 1);
      }
    });

    const categoriesWithCount = categories.map(cat => {
      const idStr = cat._id.toString();
      const key = `${(cat.domain || '').toLowerCase()}_${(cat.name || '').toLowerCase().trim()}`;
      const count = categoryCountMap.get(idStr) || categoryCountMap.get(key) || 0;
      return {
        ...cat,
        courseCount: count
      };
    });

    return res.json({ success: true, data: categoriesWithCount });
  } catch (err) {
    console.error('getCourseCategories error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.createCourseCategory = async (req, res) => {
  try {
    const { name, description, domain, isActive } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Category Name is required.' });
    }
    if (!domain || !domain.trim()) {
      return res.status(400).json({ success: false, message: 'Associated Domain is required.' });
    }

    const trimmedName = name.trim();
    const trimmedDomain = domain.trim();

    // Prevent duplicate category names within the same domain (case-insensitive)
    const existing = await CourseCategory.findOne({
      domain: { $regex: new RegExp(`^${trimmedDomain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      name: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Category "${trimmedName}" already exists under domain "${trimmedDomain}".`
      });
    }

    const newCategory = await CourseCategory.create({
      name: trimmedName,
      description: description ? description.trim() : '',
      domain: trimmedDomain,
      isActive: isActive !== false
    });

    return res.status(201).json({
      success: true,
      message: `Course Category "${newCategory.name}" created successfully.`,
      data: { ...newCategory.toObject(), courseCount: 0 }
    });
  } catch (err) {
    console.error('createCourseCategory error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateCourseCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name, description, domain, isActive } = req.body;

    const category = await CourseCategory.findById(categoryId);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Course Category not found.' });
    }

    const trimmedName = name ? name.trim() : category.name;
    const trimmedDomain = domain ? domain.trim() : category.domain;

    // Check duplicate if name or domain changed
    if (trimmedName.toLowerCase() !== category.name.toLowerCase() || trimmedDomain.toLowerCase() !== category.domain.toLowerCase()) {
      const existing = await CourseCategory.findOne({
        _id: { $ne: category._id },
        domain: { $regex: new RegExp(`^${trimmedDomain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        name: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `Another category named "${trimmedName}" already exists under domain "${trimmedDomain}".`
        });
      }
    }

    const oldName = category.name;
    category.name = trimmedName;
    if (description !== undefined) category.description = description.trim();
    category.domain = trimmedDomain;
    if (isActive !== undefined) category.isActive = Boolean(isActive);

    await category.save();

    // If name changed, update courses linked to this category
    if (oldName !== trimmedName) {
      await Course.updateMany(
        { $or: [{ categoryId: category._id }, { category: oldName }] },
        { $set: { category: trimmedName, domain: trimmedDomain } }
      );
    }

    const courseCount = await Course.countDocuments({
      $or: [{ categoryId: category._id }, { category: category.name }]
    });

    return res.json({
      success: true,
      message: `Category "${category.name}" updated successfully.`,
      data: { ...category.toObject(), courseCount }
    });
  } catch (err) {
    console.error('updateCourseCategory error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.toggleCourseCategoryStatus = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const category = await CourseCategory.findById(categoryId);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Course Category not found.' });
    }

    category.isActive = !category.isActive;
    await category.save();

    const courseCount = await Course.countDocuments({
      $or: [{ categoryId: category._id }, { category: category.name }]
    });

    return res.json({
      success: true,
      message: `Category "${category.name}" is now ${category.isActive ? 'Active' : 'Inactive'}.`,
      data: { ...category.toObject(), courseCount }
    });
  } catch (err) {
    console.error('toggleCourseCategoryStatus error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteCourseCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const category = await CourseCategory.findById(categoryId);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Course Category not found.' });
    }

    // Check whether courses are already associated with that category
    const associatedCoursesCount = await Course.countDocuments({
      $or: [
        { categoryId: category._id },
        { category: category.name, domain: category.domain }
      ]
    });

    if (associatedCoursesCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category "${category.name}" because ${associatedCoursesCount} course(s) are currently associated with it. Please reassign or delete the courses first.`
      });
    }

    await CourseCategory.findByIdAndDelete(categoryId);

    return res.json({
      success: true,
      message: `Category "${category.name}" deleted successfully.`
    });
  } catch (err) {
    console.error('deleteCourseCategory error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────
// Technical Domain Management (Dynamic Add & Rename Domains)
// ─────────────────────────────────────────────────────────

// GET /api/admin/domain-management/domains
exports.getTechnicalDomains = async (req, res) => {
  try {
    await ensureInitialDomains();

    const [domains, categories, courses] = await Promise.all([
      Domain.find().sort({ name: 1 }).lean(),
      CourseCategory.find({}, 'domain').lean(),
      Course.find({}, 'domain').lean()
    ]);

    const domainCatMap = new Map();
    const domainCourseMap = new Map();
    categories.forEach(cat => {
      if (cat.domain) {
        const k = cat.domain.toLowerCase().trim();
        domainCatMap.set(k, (domainCatMap.get(k) || 0) + 1);
      }
    });
    courses.forEach(c => {
      if (c.domain) {
        const k = c.domain.toLowerCase().trim();
        domainCourseMap.set(k, (domainCourseMap.get(k) || 0) + 1);
      }
    });

    const domainsWithCounts = domains.map(dom => {
      const k = (dom.name || '').toLowerCase().trim();
      return {
        ...dom,
        categoryCount: domainCatMap.get(k) || 0,
        courseCount: domainCourseMap.get(k) || 0
      };
    });

    return res.json({
      success: true,
      data: domainsWithCounts
    });
  } catch (err) {
    console.error('getTechnicalDomains error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/admin/domain-management/domains
exports.createTechnicalDomain = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Domain name is required.'
      });
    }

    const cleanName = name.trim();

    // Check duplicate domain name (case-insensitive)
    const existing = await Domain.findOne({
      name: { $regex: new RegExp(`^${cleanName.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `A domain named "${cleanName}" already exists.`
      });
    }

    const newDomain = new Domain({
      name: cleanName,
      slug: makeSlug(cleanName),
      description: description ? description.trim() : ''
    });

    await newDomain.save();

    return res.status(201).json({
      success: true,
      message: `Domain "${newDomain.name}" created successfully.`,
      data: {
        ...newDomain.toObject(),
        categoryCount: 0,
        courseCount: 0
      }
    });
  } catch (err) {
    console.error('createTechnicalDomain error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/admin/domain-management/domains/:domainId
// Rename domain & maintain existing relationships everywhere across the platform
exports.updateTechnicalDomain = async (req, res) => {
  try {
    const { domainId } = req.params;
    const { name, description, isActive } = req.body;

    const domain = await Domain.findById(domainId);
    if (!domain) {
      return res.status(404).json({
        success: false,
        message: 'Domain not found.'
      });
    }

    const oldName = domain.name;
    const cleanName = name ? name.trim() : oldName;

    if (!cleanName) {
      return res.status(400).json({
        success: false,
        message: 'Domain name cannot be empty.'
      });
    }

    const nameChanged = oldName.toLowerCase() !== cleanName.toLowerCase();

    // Check duplicate name with other domains
    if (nameChanged) {
      const duplicate = await Domain.findOne({
        _id: { $ne: domain._id },
        name: { $regex: new RegExp(`^${cleanName.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') }
      });

      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: `Another domain with the name "${cleanName}" already exists.`
        });
      }
    }

    // Update Domain record
    domain.name = cleanName;
    domain.slug = makeSlug(cleanName);
    if (description !== undefined) domain.description = description ? description.trim() : '';
    if (isActive !== undefined) domain.isActive = Boolean(isActive);

    await domain.save();

    // Cascade update relationships when name changes
    if (nameChanged) {
      // 1. Maintain Categories associated with this domain
      await CourseCategory.updateMany(
        { domain: { $regex: new RegExp(`^${oldName.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') } },
        { $set: { domain: cleanName } }
      );

      // 2. Maintain Courses under this domain
      await Course.updateMany(
        { domain: { $regex: new RegExp(`^${oldName.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') } },
        { $set: { domain: cleanName } }
      );

      // 3. Maintain Internships under this domain
      await Internship.updateMany(
        { domain: { $regex: new RegExp(`^${oldName.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') } },
        { $set: { domain: cleanName } }
      );

      // 4. Maintain Projects under this domain
      await Project.updateMany(
        { domain: { $regex: new RegExp(`^${oldName.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') } },
        { $set: { domain: cleanName } }
      );

      // 5. Maintain Modules & DomainTasks
      await Module.updateMany(
        { domain: { $regex: new RegExp(`^${oldName.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') } },
        { $set: { domain: cleanName } }
      ).catch(() => {});

      await DomainTask.updateMany(
        { domain: { $regex: new RegExp(`^${oldName.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') } },
        { $set: { domain: cleanName } }
      ).catch(() => {});
    }

    // Fetch updated counts
    const [categoryCount, courseCount] = await Promise.all([
      CourseCategory.countDocuments({ domain: cleanName }),
      Course.countDocuments({ domain: cleanName })
    ]);

    return res.json({
      success: true,
      message: nameChanged
        ? `Domain renamed from "${oldName}" to "${cleanName}". All associated categories and courses updated.`
        : `Domain "${domain.name}" updated successfully.`,
      data: {
        ...domain.toObject(),
        categoryCount,
        courseCount
      }
    });
  } catch (err) {
    console.error('updateTechnicalDomain error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/admin/domain-management/domains/:domainId
exports.deleteTechnicalDomain = async (req, res) => {
  try {
    const { domainId } = req.params;
    const domain = await Domain.findById(domainId);
    if (!domain) {
      return res.status(404).json({
        success: false,
        message: 'Domain not found.'
      });
    }

    // Safeguard: Check if categories or courses are associated
    const [associatedCategories, associatedCourses] = await Promise.all([
      CourseCategory.countDocuments({ domain: domain.name }),
      Course.countDocuments({ domain: domain.name })
    ]);

    if (associatedCategories > 0 || associatedCourses > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete domain "${domain.name}" because ${associatedCategories} category(ies) and ${associatedCourses} course(s) are associated with it. Please reassign them first.`
      });
    }

    await Domain.findByIdAndDelete(domainId);

    return res.json({
      success: true,
      message: `Domain "${domain.name}" deleted successfully.`
    });
  } catch (err) {
    console.error('deleteTechnicalDomain error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};


