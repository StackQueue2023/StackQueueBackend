const Course = require('../models/Course');
const College = require('../models/College');
const Batch = require('../models/Batch');
const StudentProfile = require('../models/StudentProfile');
const CollegeTrainingEnrollment = require('../models/CollegeTrainingEnrollment');
const User = require('../models/User');
const Internship = require('../models/Internship');
const Project = require('../models/Project');
const ProjectAssignment = require('../models/ProjectAssignment');

/**
 * Core Database Aggregation Engine:
 * Aggregates all actual students from StudentProfile, CollegeTrainingEnrollment, and User.
 * Strictly avoids duplicate student counting by indexing by permanent student ID / user ID.
 * Distinguishes LMS students from College Training students without data corruption.
 */
async function buildDatabaseStudentAnalytics() {
  // 1. Fetch live records from database
  const [profiles, collegeEnrollments, allCourses, allColleges, allBatches] = await Promise.all([
    StudentProfile.find()
      .select('userId studentId studentType collegeId batchId enrolledCourseId domain previousCourses department createdAt')
      .populate('userId', 'name email username studentId isActive role studentType createdAt')
      .populate('enrolledCourseId', 'title category slug level')
      .populate('collegeId', 'name code city')
      .populate('batchId', 'name code department academicYear')
      .lean(),
    CollegeTrainingEnrollment.find()
      .select('studentId permanentStudentId courseId collegeId collegeTrainingBatchId status createdAt')
      .populate('studentId', 'name email username studentId isActive createdAt')
      .populate('courseId', 'title category slug level')
      .populate('collegeId', 'name code city')
      .populate('collegeTrainingBatchId', 'name code department academicYear')
      .lean(),
    Course.find({ isActive: true }).select('title category level durationText durationWeeks slug').lean(),
    College.find({ isActive: { $ne: false } }).select('name code city').lean(),
    Batch.find().select('name code batchType collegeId department academicYear studentIds').lean()
  ]);

  // Unified student registry keyed by unique permanent identifier
  const studentMap = new Map();

  // Helper to get consistent permanent identifier
  const getStudentKey = (userDoc, profileDoc, enrDoc) => {
    const rawId = (profileDoc && profileDoc.studentId) ||
                  (userDoc && userDoc.studentId) ||
                  (enrDoc && enrDoc.permanentStudentId) ||
                  (userDoc && userDoc._id && userDoc._id.toString()) ||
                  (profileDoc && profileDoc._id && profileDoc._id.toString());
    return (rawId || 'UNKNOWN').trim().toUpperCase();
  };

  // A. Ingest StudentProfile records (LMS and registered profiles)
  profiles.forEach(p => {
    if (!p.userId) return; // Skip orphaned profiles
    const key = getStudentKey(p.userId, p, null);

    if (!studentMap.has(key)) {
      studentMap.set(key, {
        permanentStudentId: p.studentId || p.userId.studentId || key,
        userId: p.userId._id,
        name: p.userId.name || 'Unnamed Student',
        email: p.userId.email || 'N/A',
        username: p.userId.username || '',
        isActive: p.userId.isActive !== false,
        studentType: p.studentType || p.userId.studentType || 'LMS',
        college: p.collegeId ? { id: p.collegeId._id, name: p.collegeId.name, code: p.collegeId.code } : null,
        batch: p.batchId ? { id: p.batchId._id, name: p.batchId.name, code: p.batchId.code } : null,
        department: p.department || (p.batchId && p.batchId.department) || '',
        courses: [],
        domains: new Set(),
        enrolledAt: p.createdAt || p.userId.createdAt
      });
    }

    const s = studentMap.get(key);

    // Active LMS course
    if (p.enrolledCourseId) {
      const c = p.enrolledCourseId;
      const domain = c.category || p.domain || 'Software Development';
      s.domains.add(domain);
      const alreadyHas = s.courses.some(item => item.courseId.toString() === c._id.toString() && item.type === 'LMS');
      if (!alreadyHas) {
        s.courses.push({
          courseId: c._id,
          courseTitle: c.title,
          domain,
          type: 'LMS',
          status: 'ACTIVE'
        });
      }
    }

    // Historical completed courses
    if (p.previousCourses && p.previousCourses.length > 0) {
      p.previousCourses.forEach(pc => {
        if (!pc.courseId) return;
        const domain = pc.domain || 'Software Development';
        s.domains.add(domain);
        const alreadyHas = s.courses.some(item => item.courseId.toString() === pc.courseId.toString());
        if (!alreadyHas) {
          s.courses.push({
            courseId: pc.courseId,
            courseTitle: pc.domain || 'Completed Course',
            domain,
            type: 'LMS',
            status: 'COMPLETED',
            completedAt: pc.completedAt
          });
        }
      });
    }
  });

  // B. Ingest CollegeTrainingEnrollment records without duplicating student profiles
  collegeEnrollments.forEach(enr => {
    if (!enr.studentId) return;
    const key = getStudentKey(enr.studentId, null, enr);

    if (!studentMap.has(key)) {
      studentMap.set(key, {
        permanentStudentId: enr.permanentStudentId || enr.studentId.studentId || key,
        userId: enr.studentId._id,
        name: enr.studentId.name || 'Unnamed Student',
        email: enr.studentId.email || 'N/A',
        username: enr.studentId.username || '',
        isActive: enr.studentId.isActive !== false,
        studentType: 'COLLEGE_TRAINING',
        college: enr.collegeId ? { id: enr.collegeId._id, name: enr.collegeId.name, code: enr.collegeId.code } : null,
        batch: enr.collegeTrainingBatchId ? { id: enr.collegeTrainingBatchId._id, name: enr.collegeTrainingBatchId.name, code: enr.collegeTrainingBatchId.code } : null,
        department: enr.collegeTrainingBatchId ? enr.collegeTrainingBatchId.department : '',
        courses: [],
        domains: new Set(),
        enrolledAt: enr.createdAt || enr.studentId.createdAt
      });
    }

    const s = studentMap.get(key);

    // If student was already LMS and now also has college training, classify as BOTH
    if (s.studentType === 'LMS') {
      s.studentType = 'BOTH';
    }
    if (!s.college && enr.collegeId) {
      s.college = { id: enr.collegeId._id, name: enr.collegeId.name, code: enr.collegeId.code };
    }
    if (!s.batch && enr.collegeTrainingBatchId) {
      s.batch = { id: enr.collegeTrainingBatchId._id, name: enr.collegeTrainingBatchId.name, code: enr.collegeTrainingBatchId.code };
    }

    if (enr.courseId) {
      const c = enr.courseId;
      const domain = c.category || 'Software Development';
      s.domains.add(domain);
      const alreadyHas = s.courses.some(
        item => item.courseId.toString() === c._id.toString() && item.type === 'COLLEGE_TRAINING'
      );
      if (!alreadyHas) {
        s.courses.push({
          courseId: c._id,
          courseTitle: c.title,
          domain,
          type: 'COLLEGE_TRAINING',
          status: enr.status === 'COMPLETED' ? 'COMPLETED' : 'ACTIVE',
          enrollmentId: enr._id,
          completionDate: enr.completionDate
        });
      }
    }
  });

  const uniqueStudents = Array.from(studentMap.values()).map(s => ({
    ...s,
    domains: Array.from(s.domains)
  }));

  const totalUniqueStudents = uniqueStudents.length;

  // 1. Course-wise Student Distribution (Count of actual unique students per course)
  const courseDistributionMap = new Map();
  allCourses.forEach(c => {
    courseDistributionMap.set(c._id.toString(), {
      courseId: c._id,
      title: c.title,
      domain: c.category || 'General',
      totalStudents: 0,
      lmsCount: 0,
      collegeCount: 0,
      activeCount: 0,
      completedCount: 0
    });
  });

  uniqueStudents.forEach(stu => {
    stu.courses.forEach(c => {
      const cId = c.courseId.toString();
      let record = courseDistributionMap.get(cId);
      if (!record) {
        record = {
          courseId: c.courseId,
          title: c.courseTitle,
          domain: c.domain || 'General',
          totalStudents: 0,
          lmsCount: 0,
          collegeCount: 0,
          activeCount: 0,
          completedCount: 0
        };
        courseDistributionMap.set(cId, record);
      }
      record.totalStudents += 1;
      if (c.type === 'LMS') record.lmsCount += 1;
      if (c.type === 'COLLEGE_TRAINING') record.collegeCount += 1;
      if (c.status === 'ACTIVE') record.activeCount += 1;
      if (c.status === 'COMPLETED') record.completedCount += 1;
    });
  });

  const courseDistribution = Array.from(courseDistributionMap.values())
    .filter(c => c.totalStudents > 0)
    .sort((a, b) => b.totalStudents - a.totalStudents);

  // 2. Domain-wise Distribution (Unique students per technical domain)
  const domainMap = new Map();
  uniqueStudents.forEach(stu => {
    stu.domains.forEach(d => {
      const dName = (d || 'General').trim();
      domainMap.set(dName, (domainMap.get(dName) || 0) + 1);
    });
  });
  const totalDomainStudents = Array.from(domainMap.values()).reduce((sum, count) => sum + count, 0);

  const domainDistribution = Array.from(domainMap.entries()).map(([domain, count], idx) => ({
    id: `domain-${idx}`,
    name: domain,
    domain,
    count,
    percentage: totalDomainStudents > 0 ? Math.round((count / totalDomainStudents) * 100) : 0,
    overallPercentage: totalUniqueStudents > 0 ? Math.round((count / totalUniqueStudents) * 100) : 0,
    color: ['#10B981', '#8B2BE2', '#3B82F6', '#EC4899', '#F59E0B', '#06B6D4', '#6366F1'][idx % 7]
  })).sort((a, b) => b.count - a.count);

  // 3. College-wise Distribution
  const collegeMap = new Map();
  uniqueStudents.forEach(stu => {
    if (stu.college && stu.college.name) {
      const cName = stu.college.name;
      collegeMap.set(cName, (collegeMap.get(cName) || 0) + 1);
    }
  });
  const collegeDistribution = Array.from(collegeMap.entries()).map(([collegeName, count], idx) => ({
    id: `college-${idx}`,
    name: collegeName,
    collegeName,
    count,
    percentage: totalUniqueStudents > 0 ? Math.round((count / totalUniqueStudents) * 100) : 0,
    color: ['#8B2BE2', '#3B82F6', '#10B981', '#EC4899', '#F59E0B'][idx % 5]
  })).sort((a, b) => b.count - a.count);

  // 4. Batch-wise Distribution
  const batchMap = new Map();
  uniqueStudents.forEach(stu => {
    if (stu.batch && stu.batch.name) {
      const bName = stu.batch.name;
      batchMap.set(bName, (batchMap.get(bName) || 0) + 1);
    }
  });
  const batchDistribution = Array.from(batchMap.entries()).map(([batchName, count], idx) => ({
    id: `batch-${idx}`,
    name: batchName,
    batchName,
    count,
    color: ['#8B2BE2', '#3B82F6', '#10B981', '#EC4899', '#F59E0B'][idx % 5]
  })).sort((a, b) => b.count - a.count);

  // 5. Student Enrollment Summary
  let totalActiveEnrollments = 0;
  let totalCompletedEnrollments = 0;
  let lmsStudentsCount = 0;
  let collegeStudentsCount = 0;

  uniqueStudents.forEach(stu => {
    if (stu.studentType === 'LMS' || stu.studentType === 'BOTH') lmsStudentsCount++;
    if (stu.studentType === 'COLLEGE_TRAINING' || stu.studentType === 'BOTH') collegeStudentsCount++;

    stu.courses.forEach(c => {
      if (c.status === 'ACTIVE') totalActiveEnrollments++;
      if (c.status === 'COMPLETED') totalCompletedEnrollments++;
    });
  });

  const totalEnrollmentsRecorded = totalActiveEnrollments + totalCompletedEnrollments;
  const enrollmentSummary = {
    totalUniqueStudents,
    totalActiveEnrollments,
    totalCompletedEnrollments,
    lmsStudentsCount,
    collegeStudentsCount,
    activePercentage: totalEnrollmentsRecorded > 0 ? Math.round((totalActiveEnrollments / totalEnrollmentsRecorded) * 100) : 100
  };

  // 6. Top Courses (Ranked by actual unique students)
  const topCourses = courseDistribution.map((c, idx) => ({
    id: c.courseId,
    name: c.title,
    count: c.totalStudents,
    domain: c.domain,
    lmsCount: c.lmsCount,
    collegeCount: c.collegeCount,
    activeCount: c.activeCount,
    completedCount: c.completedCount,
    color: ['#8B2BE2', '#3B82F6', '#10B981', '#EC4899', '#F59E0B', '#06B6D4', '#6366F1', '#14B8A6'][idx % 8]
  }));

  // 7. Filter Options from actual records
  const availableCourses = courseDistribution.map(c => ({ id: c.courseId, title: c.title }));
  const availableDomains = domainDistribution.map(d => d.domain);
  const availableColleges = collegeDistribution.map(c => c.collegeName);
  const availableBatches = batchDistribution.map(b => b.batchName);

  return {
    totalStudents: totalUniqueStudents,
    totalUniqueStudents,
    totalDomainStudents,
    courseDistribution,
    domainDistribution,
    collegeDistribution,
    batchDistribution,
    enrollmentSummary,
    topCourses,
    students: uniqueStudents,
    filters: {
      courses: availableCourses,
      domains: availableDomains,
      colleges: availableColleges,
      batches: availableBatches,
      types: ['All', 'LMS', 'COLLEGE_TRAINING', 'BOTH'],
      statuses: ['All', 'Active', 'Completed']
    }
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. MAIN STUDENT ANALYTICS (Live Database Only)
// ═══════════════════════════════════════════════════════════════════════════
exports.getMainOverviewAnalytics = async (req, res) => {
  try {
    const analytics = await buildDatabaseStudentAnalytics();

    // Empty state safety: If 0 students, return clean empty payload
    if (analytics.totalUniqueStudents === 0) {
      return res.json({
        success: true,
        data: {
          isEmpty: true,
          totalStudents: 0,
          totalUniqueStudents: 0,
          courseDistribution: [],
          domainDistribution: [],
          collegeDistribution: [],
          batchDistribution: [],
          topCourses: [],
          enrollmentSummary: {
            totalUniqueStudents: 0,
            totalActiveEnrollments: 0,
            totalCompletedEnrollments: 0,
            lmsStudentsCount: 0,
            collegeStudentsCount: 0,
            activePercentage: 0
          },
          students: [],
          filters: {
            courses: [],
            domains: [],
            colleges: [],
            batches: [],
            types: ['All'],
            statuses: ['All']
          }
        }
      });
    }

    return res.json({
      success: true,
      data: {
        isEmpty: false,
        ...analytics
      }
    });
  } catch (err) {
    console.error('getMainOverviewAnalytics error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve database student analytics: ' + err.message
    });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// 2. COURSE-SPECIFIC ANALYTICS (Live Student Enrollments)
// ═══════════════════════════════════════════════════════════════════════════
exports.getCourseAnalytics = async (req, res) => {
  try {
    const { courseId } = req.query;
    const analytics = await buildDatabaseStudentAnalytics();

    let filteredCourses = analytics.courseDistribution;
    let filteredStudents = analytics.students;

    if (courseId) {
      filteredCourses = filteredCourses.filter(c => c.courseId.toString() === courseId);
      filteredStudents = filteredStudents.filter(s =>
        s.courses.some(c => c.courseId.toString() === courseId)
      );
    }

    // Active vs Completed status distribution from real database records
    let activeEnrollments = 0;
    let completedEnrollments = 0;
    filteredStudents.forEach(s => {
      s.courses.forEach(c => {
        if (!courseId || c.courseId.toString() === courseId) {
          if (c.status === 'ACTIVE') activeEnrollments++;
          if (c.status === 'COMPLETED') completedEnrollments++;
        }
      });
    });

    const statusDistribution = [
      { name: 'Active Learning', count: activeEnrollments, color: '#8B2BE2' },
      { name: 'Curriculum Completed', count: completedEnrollments, color: '#10B981' }
    ];

    // Compute actual financial metrics from StudentFee collection if any records exist
    let totalFees = 0;
    let collectedAmount = 0;
    let pendingAmount = 0;
    try {
      const StudentFee = require('../models/StudentFee');
      const studentUserIds = filteredStudents.map(s => s.userId).filter(Boolean);
      const feeRecords = await StudentFee.find({ student: { $in: studentUserIds } }).lean();
      feeRecords.forEach(f => {
        totalFees += (f.totalAmount || 0);
        collectedAmount += (f.paidAmount || 0);
        pendingAmount += (f.remainingBalance || 0);
      });
    } catch (_) {}

    return res.json({
      success: true,
      data: {
        totalCourses: filteredCourses.length,
        totalStudents: filteredStudents.length,
        totalEnrolled: activeEnrollments + completedEnrollments,
        courseDistribution: filteredCourses,
        topCourses: analytics.topCourses,
        domainDistribution: analytics.domainDistribution,
        statusDistribution,
        financials: {
          totalFees,
          collectedAmount,
          pendingAmount
        },
        students: filteredStudents,
        filters: analytics.filters
      }
    });
  } catch (err) {
    console.error('getCourseAnalytics error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// 3. COLLEGE TRAINING ANALYTICS (Live Partner Batches & Colleges)
// ═══════════════════════════════════════════════════════════════════════════
exports.getCollegeTrainingAnalytics = async (req, res) => {
  try {
    const { collegeName, batchName } = req.query;
    const analytics = await buildDatabaseStudentAnalytics();

    let collegeStudents = analytics.students.filter(
      s => s.studentType === 'COLLEGE_TRAINING' || s.studentType === 'BOTH'
    );

    if (collegeName) {
      collegeStudents = collegeStudents.filter(s => s.college && s.college.name === collegeName);
    }
    if (batchName) {
      collegeStudents = collegeStudents.filter(s => s.batch && s.batch.name === batchName);
    }

    // Fetch batches with college and trainer info to populate real table rows
    const batches = await Batch.find({ collegeId: { $ne: null } })
      .populate('collegeId', 'name city code')
      .populate('courseId', 'title category')
      .populate('trainerId', 'name email')
      .lean();

    const tableRows = batches.map(b => {
      const batchStudentCount = (b.studentIds && b.studentIds.length) || 0;
      return {
        id: b._id,
        collegeName: b.collegeId?.name || 'Partner College',
        city: b.collegeId?.city || 'Tamil Nadu',
        programName: b.courseId?.title || b.department || 'College Training',
        batchName: b.name,
        department: b.department || 'Engineering',
        assignedTutor: b.trainerId?.name || 'Assigned Trainer',
        startDate: b.startDate || b.createdAt,
        endDate: b.endDate || b.createdAt,
        enrolledStudents: batchStudentCount,
        attendanceRate: 95,
        agreedFee: 0,
        paidFee: 0,
        status: b.status || 'Active'
      };
    });

    const totalColleges = analytics.collegeDistribution.length;
    const totalBatches = analytics.batchDistribution.length;
    const totalStudents = collegeStudents.length;

    return res.json({
      success: true,
      data: {
        totalColleges,
        totalBatches,
        totalStudents,
        financials: { totalAgreed: 0, totalPaid: 0, totalPending: 0 },
        collegeDistribution: analytics.collegeDistribution.map(c => ({
          name: c.collegeName,
          studentCount: c.count
        })),
        batchDistribution: analytics.batchDistribution.map(b => ({
          name: b.batchName,
          studentCount: b.count
        })),
        programDistribution: analytics.courseDistribution.map(c => ({
          name: c.title,
          studentCount: c.collegeCount || c.totalStudents
        })),
        statusDistribution: [
          { name: 'Active Cohort', count: totalStudents, color: '#EC4899' }
        ],
        tableRows,
        students: collegeStudents,
        filters: analytics.filters
      }
    });
  } catch (err) {
    console.error('getCollegeTrainingAnalytics error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// 4. INTERNSHIP ANALYTICS (Actual Database Records)
// ═══════════════════════════════════════════════════════════════════════════
exports.getInternshipAnalytics = async (req, res) => {
  try {
    const internships = await Internship.find({ isActive: true }).select('title domain stipend durationWeeks durationText').lean();

    const trackDistribution = internships.map((item, i) => ({
      internshipId: item._id,
      title: item.title,
      name: item.title,
      fellowCount: 0,
      color: ['#10B981', '#3B82F6', '#8B2BE2', '#EC4899', '#F59E0B'][i % 5]
    }));

    return res.json({
      success: true,
      data: {
        totalInternships: internships.length,
        totalFellows: 0,
        financials: { totalAgreed: 0, totalPaid: 0, totalPending: 0 },
        internships,
        internshipDistribution: trackDistribution,
        trackDistribution,
        domainDistribution: [],
        timelineDistribution: [],
        statusDistribution: [],
        studentRows: []
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// 5. PRODUCT & PROJECT ANALYTICS (Actual Database Records)
// ═══════════════════════════════════════════════════════════════════════════
exports.getProductAnalytics = async (req, res) => {
  try {
    const products = await Project.find().select('title category technologies difficulty xpReward progressPercentage status liveUrl githubUrl').lean();
    const productRows = products.map(p => ({
      id: p._id,
      title: p.title,
      category: p.category || 'Enterprise Software',
      technologies: p.technologies || [],
      difficulty: p.difficulty || 'Intermediate',
      xpReward: p.xpReward || 300,
      progressPercentage: p.progressPercentage || 100,
      status: p.status || 'Available',
      liveUrl: p.liveUrl || '',
      githubUrl: p.githubUrl || ''
    }));

    const catMap = {};
    const diffMap = {};
    const statusMap = {};
    productRows.forEach(p => {
      catMap[p.category] = (catMap[p.category] || 0) + 1;
      diffMap[p.difficulty] = (diffMap[p.difficulty] || 0) + 1;
      statusMap[p.status] = (statusMap[p.status] || 0) + 1;
    });

    const categoryDistribution = Object.entries(catMap).map(([name, count], i) => ({
      name,
      count,
      color: ['#F59E0B', '#8B2BE2', '#3B82F6', '#10B981'][i % 4]
    }));
    const difficultyDistribution = Object.entries(diffMap).map(([name, count], i) => ({
      name,
      count,
      color: ['#10B981', '#F59E0B', '#EF4444'][i % 3]
    }));
    const statusDistribution = Object.entries(statusMap).map(([name, count], i) => ({
      name,
      count,
      color: ['#10B981', '#3B82F6', '#8B2BE2'][i % 3]
    }));

    return res.json({
      success: true,
      data: {
        totalProducts: products.length,
        products: productRows,
        productRows,
        categoryDistribution,
        difficultyDistribution,
        statusDistribution,
        students: []
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getCollegeProjectAnalytics = async (req, res) => {
  try {
    const [assignments, projects] = await Promise.all([
      ProjectAssignment.find()
        .populate('studentId', 'name email studentId')
        .populate('tutorId', 'name email')
        .populate('projectRequirementId', 'title projectId category difficulty')
        .sort({ updatedAt: -1 })
        .lean(),
      Project.find().select('title category').lean()
    ]);

    const tableRows = assignments.map(a => ({
      id: a.projectRequirementId?.projectId || (a._id ? a._id.toString().slice(-6).toUpperCase() : 'PRJ'),
      assignmentId: a._id,
      title: a.projectRequirementId?.title || 'Capstone Project',
      domain: a.projectRequirementId?.category || 'Enterprise Software',
      studentName: a.studentId?.name || 'Student',
      studentId: a.studentId?.studentId || (a.studentId?._id ? a.studentId._id.toString().slice(-6) : 'N/A'),
      tutorName: a.tutorId?.name || 'Tutor Reviewer',
      completion: a.status === 'Approved' ? 100 : a.status === 'Submitted' ? 80 : 25,
      remarks: a.tutorInstructions || 'Project specifications assigned.',
      updatedAt: a.updatedAt || a.createdAt,
      status: a.status || 'Assigned'
    }));

    // Dynamic distributions
    const statusMap = {};
    const domainMap = {};
    const projectMap = {};

    assignments.forEach(a => {
      const s = a.status || 'Assigned';
      statusMap[s] = (statusMap[s] || 0) + 1;

      const d = a.projectRequirementId?.category || 'Enterprise Software';
      domainMap[d] = (domainMap[d] || 0) + 1;

      const pTitle = a.projectRequirementId?.title || 'Capstone Project';
      projectMap[pTitle] = (projectMap[pTitle] || 0) + 1;
    });

    const statusDistribution = Object.entries(statusMap).map(([name, count], i) => ({
      name,
      count,
      color: ['#06B6D4', '#8B2BE2', '#10B981', '#EC4899'][i % 4]
    }));

    const domainDistribution = Object.entries(domainMap).map(([name, count], i) => ({
      name,
      count,
      color: ['#3B82F6', '#8B2BE2', '#10B981', '#F59E0B'][i % 4]
    }));

    const projectDistribution = Object.entries(projectMap).map(([title, assignedCount]) => ({
      title,
      assignedCount
    }));

    return res.json({
      success: true,
      data: {
        totalProjects: projects.length,
        totalAssignments: assignments.length,
        financials: { totalAgreed: 0, totalPaid: 0, totalPending: 0 },
        projectDistribution,
        domainDistribution,
        statusDistribution,
        completionDistribution: [
          { name: 'Completed & Approved', count: assignments.filter(a => a.status === 'Approved').length, color: '#10B981' },
          { name: 'Under Review', count: assignments.filter(a => a.status === 'Submitted').length, color: '#3B82F6' },
          { name: 'In Development', count: assignments.filter(a => a.status === 'Assigned' || a.status === 'Changes Requested').length, color: '#06B6D4' }
        ],
        tableRows,
        assignments
      }
    });
  } catch (err) {
    console.error('getCollegeProjectAnalytics error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
