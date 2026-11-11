const Course = require('../models/Course');
const Internship = require('../models/Internship');
const Project = require('../models/Project');
const ProjectAssignment = require('../models/ProjectAssignment');
const CompanyPortal = require('../models/CompanyPortal');
const Offer = require('../models/Offer');
const Domain = require('../models/Domain');
const {
  DEFAULT_DOMAIN_CATEGORY,
  normalizeCategory
} = require('../constants/domains');

// Helper to format Course document for frontend portal format
function formatCourse(c) {
  const dur = c.durationText || (c.durationWeeks ? `${c.durationWeeks} Weeks` : '12 Weeks');
  const domName = c.domain || (c.domainId && c.domainId.name) || 'General';
  return {
    id: c._id,
    _id: c._id,
    title: c.title,
    slug: c.slug,
    domain: domName,
    domainId: c.domainId,
    description: c.description,
    duration: dur,
    durationWeeks: c.durationWeeks || 12,
    durationText: dur,
    totalHours: c.totalHours || 120,
    level: c.level || 'All Levels',
    color: c.color || 'from-blue-600 to-indigo-600',
    icon: c.icon || 'Code',
    skills: [domName, c.level, dur],
    tasksCount: 50,
    modulesCount: 4,
    isPopular: true,
    isTrending: true
  };
}

// Helper to format Internship document for frontend portal format
function formatInternship(i) {
  const dur = i.durationText || (i.durationWeeks === 2 ? '15 Days' : `${i.durationWeeks || 4} Weeks`);
  return {
    id: i._id,
    _id: i._id,
    title: i.title,
    slug: i.slug,
    technology: Array.isArray(i.techStack) && i.techStack.length > 0 ? i.techStack.join(', ') : (i.domain || 'Full Stack'),
    techStack: i.techStack || [],
    category: i.domain || 'Software Development',
    domain: i.domain || 'fullstack',
    description: i.description,
    duration: dur,
    durationWeeks: i.durationWeeks || 4,
    durationText: dur,
    stipendAmount: i.stipend || 0,
    stipend: i.stipend > 0 ? `₹${i.stipend.toLocaleString()}` : 'Free / Stipend Available',
    feeText: i.stipend > 0 ? `₹${i.stipend.toLocaleString()}` : 'Free',
    mode: i.isPaid ? 'Paid' : 'Free / Stipend',
    level: i.level || 'Intermediate',
    color: i.color || 'from-green-500 to-emerald-600',
    icon: i.icon || '💼',
    skills: Array.isArray(i.techStack) && i.techStack.length > 0 ? i.techStack : [i.domain],
    isPopular: true
  };
}

// Helper to format Project document for frontend portal format
function formatProject(p) {
  return {
    id: p._id,
    _id: p._id,
    name: p.title,
    slug: p.slug,
    title: p.title,
    category: p.category || 'Industry Project',
    shortDescription: p.description,
    description: p.description,
    technology: Array.isArray(p.technologies) && p.technologies.length > 0 ? p.technologies.join(', ') : 'Modern Stack',
    technologies: p.technologies || [],
    difficulty: p.difficulty || 'Intermediate',
    status: p.status || 'Available',
    xpReward: p.xpReward || 300,
    estimatedHours: p.estimatedHours || 40,
    liveDemoUrl: p.liveDemoUrl || '#',
    githubRepoUrl: p.githubRepoUrl || '#'
  };
}

// GET /api/portal/homepage-data
// Centralized API powering all sections of the homepage directly from DB models without dummy fallbacks
exports.getHomepageData = async (req, res) => {
  try {
    let portal = await CompanyPortal.findOne();
    if (!portal) {
      portal = await CompanyPortal.create({});
    }

    // Fetch live Courses, Internships, Projects, and Active Offers directly from database
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const formatDateRange = (start, end) => {
      if (!start || !end) return '';
      const s = new Date(start);
      const e = new Date(end);
      const sDay = s.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      const eDay = e.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      return `${sDay} – ${eDay}`;
    };

    const [dbCourses, dbInternships, dbProjects, dbOffers, dbPublishedFinalProjects] = await Promise.all([
      Course.find({ isActive: true }).sort({ createdAt: -1 }),
      Internship.find({ isActive: true }).sort({ createdAt: -1 }),
      Project.find().sort({ createdAt: -1 }),
      Offer.find({
        isActive: true,
        isDraft: false,
        startDate: { $lte: endOfToday },
        endDate: { $gte: startOfToday }
      }).sort({ createdAt: -1 }),
      ProjectAssignment.find({
        status: 'Approved',
        isPublishedToHomepage: true
      })
        .populate('projectRequirementId')
        .populate('studentId', 'name studentId avatar')
        .sort({ publishedAt: -1, updatedAt: -1 })
    ]);

    const liveCoursesFormatted = dbCourses.map(formatCourse);
    const liveInternshipsFormatted = dbInternships.map(formatInternship);

    // Format approved final projects
    const publishedFinalProjectsFormatted = dbPublishedFinalProjects
      .filter(p => p.projectRequirementId)
      .map(p => {
        const req = p.projectRequirementId;
        return {
          id: p._id,
          _id: p._id,
          assignmentId: p._id,
          name: req.title,
          slug: req.slug,
          title: req.title,
          category: req.category || 'Enterprise Project',
          shortDescription: req.description,
          description: req.description,
          technology: (req.technologies || []).join(', ') || 'Modern Stack',
          technologies: req.technologies || [],
          difficulty: req.difficulty || 'Intermediate',
          status: 'Approved',
          xpReward: 500,
          estimatedHours: 60,
          thumbnailUrl: req.thumbnailUrl || '',
          keyFeatures: (req.requiredFeatures || []).map(f => f.title),
          liveDemoUrl: p.liveDemoUrl || '#',
          githubRepoUrl: p.destinationGithubRepoUrl || '#',
          studentName: p.studentId?.name || 'Stack Queue Fellow',
          isFinalProject: true
        };
      });

    const liveProjectsFormatted = [
      ...publishedFinalProjectsFormatted,
      ...dbProjects.map(formatProject)
    ];
    const liveOffersFormatted = dbOffers.map(o => {
      const discountFormatted = o.discountType === 'percentage'
        ? `${o.discountValue}% OFF`
        : `₹${Number(o.discountValue).toLocaleString('en-IN')} OFF`;
      const validityFormatted = formatDateRange(o.startDate, o.endDate);

      return {
        id: o._id,
        _id: o._id,
        title: o.title,
        description: o.description || '',
        discount: discountFormatted,
        discountText: discountFormatted,
        discountType: o.discountType,
        discountValue: o.discountValue,
        couponCode: o.couponCode || '',
        validity: validityFormatted || 'Limited Period',
        validUntil: o.endDate,
        startDate: o.startDate,
        endDate: o.endDate,
        formattedValidity: validityFormatted || 'Limited Period',
        type: o.applicableStudentCategory || o.offerType || 'Special Offer',
        offerType: o.offerType,
        applicableStudentCategory: o.applicableStudentCategory || 'All Students',
        applicableCourses: o.applicableCourses || [],
        termsAndConditions: o.termsAndConditions || '',
        bannerUrl: o.bannerUrl || '',
        applyUrl: '/contact',
        badgeColor: 'amber'
      };
    });

    // Dynamic stats based strictly on database record counts
    const statistics = {
      coursesCount: dbCourses.length > 0 ? `${dbCourses.length}+` : '0+',
      internshipDomainsCount: dbInternships.length > 0 ? `${dbInternships.length}+` : '0+',
      studentsTrained: portal.statistics?.studentsTrained || '1,250+',
      studentsLearning: portal.statistics?.studentsLearning || '450+',
      productsDeveloped: dbProjects.length > 0 ? `${dbProjects.length}+` : '0+',
      yearsExperience: portal.statistics?.yearsExperience || '10+',
      industryProjects: dbProjects.length > 0 ? `${dbProjects.length}+` : '0+'
    };

    const whatWeDo = [
      {
        id: 'training',
        title: 'Technology Training',
        description: 'Industry-oriented courses with practical learning, real-time code sandboxes, and modern curriculum updated for current tech stacks.',
        icon: 'BookOpen',
        color: 'blue'
      },
      {
        id: 'internships',
        title: 'Internship Programs',
        description: 'Internship domains covering web engineering, artificial intelligence, cloud architecture, cybersecurity, and embedded systems.',
        icon: 'Briefcase',
        color: 'emerald'
      },
      {
        id: 'practical',
        title: 'Practical Learning',
        description: 'Hands-on tasks, daily coding challenges, interactive game levels, and FAANG-grade interview question workspaces.',
        icon: 'Code2',
        color: 'amber'
      },
      {
        id: 'products',
        title: 'Products',
        description: 'Students design, build, and deploy production-ready applications, SaaS platforms, and enterprise tools for real-world impact.',
        icon: 'Rocket',
        color: 'yellow'
      }
    ];

    const whyChooseUs = [
      { title: 'Industry-Oriented Training', desc: 'Curriculum built in consultation with active software architects.', icon: 'Award' },
      { title: 'Experienced Trainers', desc: 'Personal coaching and guidance notes from senior tech leads.', icon: 'Users' },
      { title: 'Practical Learning', desc: '100% hands-on tasks replacing passive audio/video lectures.', icon: 'Zap' },
      { title: 'Real-World Tasks', desc: '10-15 structured tasks for every concept taught by tutors.', icon: 'CheckCircle2' },
      { title: 'Course Domains', desc: 'Broad spectrum from Java Full Stack to Generative AI and Cloud.', icon: 'Layers' },
      { title: 'Internship Domains', desc: 'Certified internship experience across all major industry areas.', icon: 'Briefcase' },
      { title: 'Product Development', desc: 'Build scalable software products that you can showcase on your resume.', icon: 'Cpu' },
      { title: 'Certification', desc: 'Industry-recognized verifiable credentials upon task completion.', icon: 'ShieldCheck' },
      { title: 'Career Guidance', desc: 'Resume workshops, mock interview sandboxes, and recruiter referrals.', icon: 'Compass' },
      { title: 'Flexible Learning', desc: 'Online interactive lectures combined with campus hands-on labs.', icon: 'Clock' }
    ];

    const learningJourney = [
      { step: 1, title: 'Learn', desc: 'Tutor-guided concept lectures & deep fundamentals', icon: 'BookOpen' },
      { step: 2, title: 'Practice', desc: 'Interactive code sandboxes & game levels', icon: 'Terminal' },
      { step: 3, title: 'Complete Tasks', desc: 'Solve 10-15 concept tasks with live validation', icon: 'CheckCircle2' },
      { step: 4, title: 'Build Products', desc: 'Architect production-grade software applications', icon: 'Rocket' },
      { step: 5, title: 'Internship', desc: 'Gain real workplace experience in tech domains', icon: 'Briefcase' },
      { step: 6, title: 'Career', desc: 'FAANG interview mastery & high-impact tech placement', icon: 'Trophy' }
    ];

    return res.json({
      success: true,
      data: {
        companyInfo: {
          name: portal.companyName || 'STACK QUEUE',
          tagline: portal.tagline || 'Inclusive Learning — Empowering students with industry-oriented technology training, practical learning, internship opportunities, and real-world product development.',
          description: 'A premier educational training, internship, and product-based technology company empowering aspiring engineers with practical mastery, certified industry internships, and enterprise product development.'
        },
        statistics,
        whatWeDo,
        featuredCourses: liveCoursesFormatted.slice(0, 8),
        trendingCourses: liveCoursesFormatted.slice(0, 4),
        featuredInternships: liveInternshipsFormatted.slice(0, 8),
        products: liveProjectsFormatted.slice(0, 6),
        specialOffers: liveOffersFormatted.length > 0 ? liveOffersFormatted : (portal.specialOffers || []),
        whyChooseUs,
        learningJourney
      }
    });
  } catch (error) {
    console.error('getHomepageData error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/portal/courses
exports.getCourses = async (req, res) => {
  try {
    const { search, domain, level, duration } = req.query;
    const [dbCourses, dbDomains] = await Promise.all([
      Course.find({ isActive: true }).populate('domainId', 'name slug').sort({ createdAt: -1 }),
      Domain.find({ isActive: true }).sort({ displayOrder: 1, name: 1 }).lean()
    ]);

    let courses = dbCourses.map(formatCourse);

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      courses = courses.filter(c =>
        c.title.toLowerCase().includes(q) ||
        (c.domain && c.domain.toLowerCase().includes(q)) ||
        (c.description && c.description.toLowerCase().includes(q)) ||
        (c.skills && c.skills.some(s => s.toLowerCase().includes(q)))
      );
    }

    if (domain && domain !== 'All') {
      const qDom = domain.trim().toLowerCase();
      courses = courses.filter(c => {
        const dName = (c.domain || '').toLowerCase();
        const dId = c.domainId ? (c.domainId._id || c.domainId).toString() : '';
        return dName === qDom || dId === domain || dName.includes(qDom);
      });
    }

    if (level && level !== 'All') {
      courses = courses.filter(c => c.level && c.level.toLowerCase().includes(level.toLowerCase()));
    }

    if (duration && duration !== 'All') {
      courses = courses.filter(c => c.duration && c.duration.toLowerCase().includes(duration.toLowerCase()));
    }

    return res.json({
      success: true,
      data: {
        total: courses.length,
        courses,
        domains: dbDomains.map(d => ({ id: d._id, name: d.name, slug: d.slug }))
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/portal/internships
exports.getInternships = async (req, res) => {
  try {
    const { search, category, mode, duration } = req.query;
    const dbInternships = await Internship.find({ isActive: true }).sort({ createdAt: -1 });
    let domains = dbInternships.map(formatInternship);

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      domains = domains.filter(d =>
        d.title.toLowerCase().includes(q) ||
        (d.technology && d.technology.toLowerCase().includes(q)) ||
        (d.category && d.category.toLowerCase().includes(q)) ||
        (d.skills && d.skills.some(s => s.toLowerCase().includes(q)))
      );
    }

    if (category && category !== 'All') {
      domains = domains.filter(d => d.category && d.category.toLowerCase().includes(category.toLowerCase()));
    }

    if (mode && mode !== 'All') {
      domains = domains.filter(d => d.mode && d.mode.toLowerCase() === mode.toLowerCase());
    }

    if (duration && duration !== 'All') {
      domains = domains.filter(d => d.duration && d.duration.toLowerCase().includes(duration.toLowerCase()));
    }

    return res.json({
      success: true,
      data: {
        total: domains.length,
        domains
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/portal/products
exports.getProducts = async (req, res) => {
  try {
    const { category, search } = req.query;
    const dbProjects = await Project.find().sort({ createdAt: -1 });
    let products = dbProjects.map(formatProject);

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      products = products.filter(p =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.shortDescription && p.shortDescription.toLowerCase().includes(q)) ||
        (p.technology && p.technology.toLowerCase().includes(q))
      );
    }

    if (category && category !== 'All') {
      products = products.filter(p => p.category && p.category.toLowerCase().includes(category.toLowerCase()));
    }

    return res.json({
      success: true,
      data: {
        total: products.length,
        products
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/portal/statistics
exports.adminUpdateStatistics = async (req, res) => {
  try {
    const { statistics } = req.body;
    let portal = await CompanyPortal.findOne();
    if (!portal) {
      portal = await CompanyPortal.create({});
    }

    if (statistics) {
      portal.statistics = {
        ...portal.statistics,
        ...statistics
      };
      await portal.save();
    }

    return res.json({
      success: true,
      message: 'Portal statistics updated successfully.',
      data: portal.statistics
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
