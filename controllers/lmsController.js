const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const Course = require('../models/Course');
const Module = require('../models/Module');
const Concept = require('../models/Concept');
const ConceptTask = require('../models/ConceptTask');
const ConceptTaskSubmission = require('../models/ConceptTaskSubmission');
const Session = require('../models/Session');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');
const StudentLeave = require('../models/StudentLeave');
const StudentAttendance = require('../models/StudentAttendance');
const Notification = require('../models/Notification');
const Batch = require('../models/Batch');
const FeePlan = require('../models/FeePlan');
const MonthlyInstallment = require('../models/MonthlyInstallment');
const PaymentTransaction = require('../models/PaymentTransaction');
const PaymentReceipt = require('../models/PaymentReceipt');

/**
 * Helper to ensure student has an active FeePlan and Month 1 installment
 */
async function ensureStudentFeePlanAndInstallment({
  user,
  courseId,
  totalCourseFee,
  monthlyFee,
  downPayment,
  paymentMode,
  paymentDate,
  transactionId,
  tutorId,
  batchId
}) {
  if (!courseId) return null;
  const course = await Course.findById(courseId);
  if (!course) {
    throw new Error('Associated Course not found in database.');
  }

  const courseTitle = course.title || 'General Academic Program';
  const courseDomain = course.domain || '';

  // Single Source of Truth for Course Duration:
  // Fetch actual duration directly from course DB record without converting weeks to months!
  const courseDuration = course.durationText || (course.durationValue ? `${course.durationValue} ${course.durationUnit || 'Weeks'}` : (course.durationWeeks ? `${course.durationWeeks} Weeks` : '12 Weeks'));
  const courseDurationVal = course.durationValue || course.durationWeeks || 12;
  const courseDurationUnit = course.durationUnit || 'Weeks';
  const totalHours = course.totalHours || 120;

  // 1. Validation: Course fee
  const totalFee = (totalCourseFee !== undefined && totalCourseFee !== null && !isNaN(Number(totalCourseFee)))
    ? Number(totalCourseFee)
    : (course.totalCourseFee !== undefined && !isNaN(Number(course.totalCourseFee)) ? Number(course.totalCourseFee) : 24000);

  if (isNaN(totalFee) || totalFee < 0) {
    throw new Error(`Total Course Fee is not properly configured for course "${courseTitle}".`);
  }

  // 2. Validation: Down Payment Collected
  const downPaymentAmount = (downPayment !== undefined && downPayment !== null && !isNaN(Number(downPayment)))
    ? Math.max(0, Number(downPayment))
    : 0;

  if (downPaymentAmount < 0) {
    throw new Error('Down payment cannot be a negative amount.');
  }
  if (downPaymentAmount > totalFee) {
    throw new Error(`Down payment (₹${downPaymentAmount}) cannot exceed the total course fee (₹${totalFee}).`);
  }

  // 3. Remaining Principal
  const remainingPrincipal = Math.max(0, totalFee - downPaymentAmount);

  // 4. Monthly Installment Amount:
  // From request, or configured course monthly installment, never fabricated
  let agreedMonthly = (monthlyFee !== undefined && monthlyFee !== null && !isNaN(Number(monthlyFee)) && Number(monthlyFee) > 0)
    ? Number(monthlyFee)
    : (course.monthlyInstallment !== undefined && Number(course.monthlyInstallment) > 0 ? Number(course.monthlyInstallment) : 2000);

  if (!agreedMonthly || agreedMonthly <= 0) {
    throw new Error(`Monthly installment amount is missing or invalid for course "${courseTitle}".`);
  }

  // 5. Payment Schedule:
  // Calculate the payment schedule using the actual fee agreement and billing frequency.
  // Do NOT assume course duration equals the number of monthly installments!
  const numInstallments = remainingPrincipal > 0 ? Math.ceil(remainingPrincipal / agreedMonthly) : 0;

  const studentCode = user.studentId || 'STU1001';

  let feePlan = await FeePlan.findOne({
    studentId: user._id,
    courseId
  });

  const effectivePayDate = paymentDate ? new Date(paymentDate) : new Date();

  if (!feePlan) {
    const planCount = await FeePlan.countDocuments();
    const planId = `FP-${studentCode}-${Date.now().toString().slice(-4)}-${planCount + 1}`;

    feePlan = await FeePlan.create({
      planId,
      studentId: user._id,
      studentName: user.name,
      studentCode,
      studentEmail: user.email,
      category: 'Courses',
      programId: courseId,
      courseId,
      domain: courseDomain,
      programName: courseTitle,
      programCode: `CRS-${courseTitle.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase()}`,
      courseDuration,
      courseDurationValue: courseDurationVal,
      courseDurationUnit,
      totalHours,
      batchId: batchId || null,
      assignedTutorId: tutorId || null,
      totalAgreedFee: totalFee,
      downPaymentCollected: downPaymentAmount,
      downPaymentDate: downPaymentAmount > 0 ? effectivePayDate : null,
      downPaymentMethod: downPaymentAmount > 0 ? (paymentMode || 'Cash') : null,
      downPaymentTransactionId: downPaymentAmount > 0 ? (transactionId || '') : '',
      remainingBalance: remainingPrincipal,
      totalPaid: downPaymentAmount,
      monthlyInstallmentAmount: agreedMonthly,
      numberOfInstallments: numInstallments,
      billingFrequency: 'Monthly',
      billingStartDate: new Date(),
      monthlyDueDay: 3,
      gracePeriodDays: 5,
      dailyLateFeeRate: 0,
      status: remainingPrincipal === 0 && downPaymentAmount > 0 ? 'Completed' : 'Active',
      isDummy: false
    });
  } else {
    feePlan.courseDuration = courseDuration;
    feePlan.courseDurationValue = courseDurationVal;
    feePlan.courseDurationUnit = courseDurationUnit;
    feePlan.totalHours = totalHours;
    feePlan.totalAgreedFee = totalFee;
    feePlan.downPaymentCollected = downPaymentAmount;
    feePlan.downPaymentDate = downPaymentAmount > 0 ? effectivePayDate : feePlan.downPaymentDate;
    feePlan.downPaymentMethod = downPaymentAmount > 0 ? (paymentMode || 'Cash') : feePlan.downPaymentMethod;
    feePlan.downPaymentTransactionId = downPaymentAmount > 0 ? (transactionId || '') : feePlan.downPaymentTransactionId;
    feePlan.remainingBalance = remainingPrincipal;
    feePlan.totalPaid = downPaymentAmount;
    feePlan.monthlyInstallmentAmount = agreedMonthly;
    feePlan.numberOfInstallments = numInstallments;
    feePlan.dailyLateFeeRate = 0;
    feePlan.status = remainingPrincipal === 0 && downPaymentAmount > 0 ? 'Completed' : 'Active';
    feePlan.isDummy = false;
    await feePlan.save();
  }

  // 6. Record Initial Down Payment as verified PaymentTransaction & PaymentReceipt if downPayment > 0
  if (downPaymentAmount > 0) {
    const existingTxn = await PaymentTransaction.findOne({
      feePlanId: feePlan._id,
      notes: { $regex: /Initial Down Payment/i }
    });

    if (!existingTxn) {
      const txnCount = await PaymentTransaction.countDocuments();
      const refId = transactionId && transactionId.trim()
        ? transactionId.trim()
        : `DP-${Date.now().toString().slice(-6)}`;
      const txnId = `TXN-DP-${studentCode}-${Date.now().toString().slice(-4)}-${txnCount + 1}`;

      const transaction = await PaymentTransaction.create({
        transactionId: txnId,
        installmentId: null,
        feePlanId: feePlan._id,
        studentId: user._id,
        studentName: user.name,
        category: 'Courses',
        programName: courseTitle,
        courseId,
        domain: courseDomain,
        amount: downPaymentAmount,
        principalAllocated: downPaymentAmount,
        lateFeeAllocated: 0,
        paymentDate: effectivePayDate,
        paymentMethod: paymentMode || 'Cash',
        referenceId: refId,
        status: 'Verified',
        recordedByName: 'Administrator',
        verifiedByName: 'System Verified',
        verifiedAt: new Date(),
        notes: `Initial Down Payment collected during student enrollment`,
        isDummy: false
      });

      const receiptNumber = `RCP-${studentCode}-${Date.now().toString().slice(-5)}`;
      await PaymentReceipt.create({
        receiptNumber,
        transactionId: transaction._id,
        installmentId: null,
        feePlanId: feePlan._id,
        studentId: user._id,
        studentName: user.name,
        studentCode,
        studentEmail: user.email || '',
        category: 'Courses',
        programName: courseTitle,
        amountReceived: downPaymentAmount,
        principalAmount: downPaymentAmount,
        lateFeeAmount: 0,
        paymentMethod: paymentMode || 'Cash',
        paymentReference: refId,
        issuedAt: new Date(),
        notes: `Down payment receipt for ${courseTitle}`
      });

      transaction.receiptNumber = receiptNumber;
      await transaction.save();
    }
  }

  // 7. Generate Installment Schedule for remainingPrincipal
  // Delete existing Pending/Unpaid installments for this feePlan to avoid duplicate records
  await MonthlyInstallment.deleteMany({
    feePlanId: feePlan._id,
    status: { $in: ['Pending', 'Unpaid'] }
  });

  const generatedInstallments = [];
  if (remainingPrincipal > 0) {
    let remainingToSchedule = remainingPrincipal;
    let instNum = 1;
    const baseDate = new Date();
    const instCount = await MonthlyInstallment.countDocuments();

    while (remainingToSchedule > 0) {
      // If final installment, take exact remainder so total never exceeds remainingPrincipal
      const amountForInst = (remainingToSchedule < agreedMonthly || instNum === numInstallments)
        ? remainingToSchedule
        : agreedMonthly;

      const dueDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + instNum, feePlan.monthlyDueDay || 3);
      const installmentId = `INST-${studentCode}-${String(instNum).padStart(2, '0')}-${instCount + instNum}`;

      const inst = await MonthlyInstallment.create({
        installmentId,
        feePlanId: feePlan._id,
        studentId: user._id,
        studentName: user.name,
        studentCode,
        category: 'Courses',
        programName: courseTitle,
        courseId,
        domain: courseDomain,
        installmentNumber: instNum,
        dueDate,
        principalAmount: amountForInst,
        principalPaid: 0,
        lateFeeAccrued: 0,
        lateFeePaid: 0,
        lateFeeWaived: 0,
        status: 'Pending',
        isDummy: false
      });

      generatedInstallments.push(inst);
      remainingToSchedule -= amountForInst;
      instNum++;
    }
  }

  return { feePlan, installments: generatedInstallments };
}

// ==========================================
// 1. ADMIN LMS CONTROLLERS
// ==========================================

// POST /api/lms/admin/students
// Admin creates student: Username, Student ID, Name, Email, Password, Course, Tutor, Learning Mode, Batch
exports.adminCreateStudent = async (req, res) => {
  try {
    const {
      name,
      username,
      email,
      password,
      studentId,
      courseId,
      tutorId,
      learningMode,
      batchId,
      phone,
      monthlyFee,
      totalCourseFee,
      courseDurationMonths,
      downPayment,
      paymentMode,
      paymentDate,
      transactionId,
      isExistingStudent
    } = req.body;

    const {
      cleanPrefix,
      getNextStudentIdForCourse,
      commitStudentSequenceForCourse,
      validateStudentIdAgainstCourse,
      resolveCourseFromStudentId
    } = require('../services/courseStudentIdService');

    const parsedMonthlyFee = (monthlyFee !== undefined && monthlyFee !== null && !isNaN(Number(monthlyFee)) && Number(monthlyFee) >= 0)
      ? Number(monthlyFee)
      : 2000;

    let normStudentId = studentId ? studentId.trim().toUpperCase() : '';
    const normEmail = email ? email.trim().toLowerCase() : '';
    const normUsername = username ? username.trim().toLowerCase() : '';

    // Validate course mapping and auto-generate ID if needed
    let targetCourse = courseId ? await Course.findById(courseId) : null;
    if (!targetCourse && normStudentId) {
      targetCourse = await resolveCourseFromStudentId(normStudentId);
    }

    if (targetCourse) {
      if (!normStudentId) {
        // Automatically generate sequential Student ID using course's configured format
        const autoGen = await getNextStudentIdForCourse(targetCourse._id);
        normStudentId = autoGen.nextStudentId;
      } else {
        // Validate student ID matches course ID format
        const idVal = validateStudentIdAgainstCourse(normStudentId, targetCourse);
        if (!idVal.valid) {
          return res.status(400).json({
            success: false,
            message: idVal.message
          });
        }
      }
    }

    // Search for any existing user matching email, username, or studentId
    const queryConds = [];
    if (normEmail) queryConds.push({ email: normEmail });
    if (normUsername) queryConds.push({ username: normUsername });
    if (normStudentId) queryConds.push({ studentId: normStudentId });

    const existingUser = queryConds.length > 0 ? await User.findOne({ $or: queryConds }) : null;

    // RULE 1: studentId MUST BE UNIQUE across DIFFERENT students
    if (normStudentId && existingUser && existingUser.studentId === normStudentId) {
      const isSameUser = (normEmail && existingUser.email === normEmail) || (normUsername && existingUser.username === normUsername);
      if (!isSameUser && !isExistingStudent) {
        return res.status(400).json({
          success: false,
          message: `Student ID "${normStudentId}" is already assigned to another student (${existingUser.name}). Student ID cannot be repeated!`
        });
      }
    }

    // RULE 2: If isExistingStudent mode is selected OR existing user is found for student enrollment
    if (isExistingStudent || (existingUser && existingUser.role === 'student')) {
      const targetUser = existingUser || await User.findOne({
        $or: [
          ...(normEmail ? [{ email: normEmail }] : []),
          ...(normUsername ? [{ username: normUsername }] : []),
          ...(normStudentId ? [{ studentId: normStudentId }] : [])
        ]
      });

      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message: 'Existing student account not found.'
        });
      }

      // Check / update StudentProfile
      let profile = await StudentProfile.findOne({ userId: targetUser._id });
      if (!profile) {
        profile = await StudentProfile.create({
          userId: targetUser._id,
          studentId: targetUser.studentId || normStudentId,
          enrolledCourseId: courseId || null,
          assignedTutorId: tutorId || null,
          learningMode: (learningMode === 'OFFLINE' ? 'OFFLINE' : 'ONLINE'),
          batchId: batchId || null,
          monthlyFee: parsedMonthlyFee,
          feePaymentStatus: 'Pending',
          totalXp: 100
        });
      } else {
        // If courseId provided, check if student already has this course
        if (courseId) {
          const isSameCourse = profile.enrolledCourseId && profile.enrolledCourseId.toString() === courseId.toString();
          const isInPrevious = profile.previousCourses && profile.previousCourses.some(p => p.courseId && p.courseId.toString() === courseId.toString());

          if (isSameCourse) {
            return res.status(400).json({
              success: false,
              message: `Student ${targetUser.name} (${targetUser.studentId}) is ALREADY enrolled in this course!`
            });
          }

          // Move current course to previousCourses history if different
          if (profile.enrolledCourseId) {
            profile.previousCourses.push({
              courseId: profile.enrolledCourseId,
              domain: profile.domain || '',
              completedAt: new Date()
            });
          }

          profile.enrolledCourseId = courseId;
        }

        if (monthlyFee !== undefined) profile.monthlyFee = parsedMonthlyFee;
        const existTotal = Number(totalCourseFee) >= 0 ? Number(totalCourseFee) : (profile.totalCourseFee || 24000);
        const existDP = Number(downPayment) >= 0 ? Number(downPayment) : 0;
        const existRem = Math.max(0, existTotal - existDP);
        profile.totalCourseFee = existTotal;
        profile.downPaymentCollected = existDP;
        profile.remainingPrincipal = existRem;
        profile.feePaymentStatus = existRem === 0 && existDP > 0 ? 'Paid' : (existDP > 0 ? 'Partially Paid' : 'Pending');
        if (existDP > 0) profile.lastPaymentDate = paymentDate ? new Date(paymentDate) : new Date();

        if (courseId) {
          const cDoc = await Course.findById(courseId);
          if (cDoc) {
            profile.courseDuration = cDoc.durationText || (cDoc.durationWeeks ? `${cDoc.durationWeeks} Weeks` : '12 Weeks');
            profile.courseDurationWeeks = cDoc.durationWeeks || 12;
            profile.totalHours = cDoc.totalHours || 120;
          }
        }

        if (tutorId) profile.assignedTutorId = tutorId;
        if (learningMode) profile.learningMode = learningMode;
        await profile.save();
      }

      if (courseId) {
        await ensureStudentFeePlanAndInstallment({
          user: targetUser,
          courseId,
          totalCourseFee,
          monthlyFee: parsedMonthlyFee,
          downPayment,
          paymentMode,
          paymentDate,
          transactionId,
          tutorId: profile.assignedTutorId,
          batchId: profile.batchId
        });
      }

      // Notify student of extra course
      await Notification.create({
        userId: targetUser._id,
        title: 'Extra Course Assigned',
        message: `An additional course/domain has been assigned to your student profile!`,
        type: 'challenge_unlocked'
      });

      const populatedProfile = await StudentProfile.findById(profile._id)
        .populate('userId', 'name email username studentId phone avatar isActive')
        .populate('enrolledCourseId')
        .populate('assignedTutorId', 'name email');

      return res.status(200).json({
        success: true,
        message: `Extra course successfully assigned to existing student ${targetUser.name} (${targetUser.studentId}).`,
        data: {
          user: targetUser,
          profile: populatedProfile
        }
      });
    }

    // RULE 3: New Student Creation
    if (!name || !username || !email || !password || !normStudentId) {
      return res.status(400).json({
        success: false,
        message: 'Username, Name, Email, Password, and Student ID are all required.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    if (existingUser) {
      let errorMsg = 'Account credential already in use.';
      if (existingUser.studentId === normStudentId) {
        errorMsg = `Student ID "${normStudentId}" is already assigned to another student. Student ID cannot be repeated!`;
      } else if (existingUser.username === normUsername) {
        errorMsg = `Username "${normUsername}" is already registered to student "${existingUser.name}".`;
      } else if (existingUser.email === normEmail) {
        errorMsg = `Email address "${normEmail}" is already registered to student "${existingUser.name}".`;
      }

      return res.status(400).json({
        success: false,
        isExistingUser: true,
        existingUser: {
          id: existingUser._id,
          name: existingUser.name,
          username: existingUser.username,
          email: existingUser.email,
          studentId: existingUser.studentId
        },
        message: `${errorMsg} Would you like to assign an extra course to this existing student?`
      });
    }

    // Validate Batch if batchId provided
    let selectedBatch = null;
    if (batchId) {
      selectedBatch = await Batch.findById(batchId);
      if (!selectedBatch) {
        return res.status(404).json({ success: false, message: 'Selected batch not found.' });
      }
      if (selectedBatch.batchType === 'COLLEGE_TRAINING' || selectedBatch.collegeId) {
        return res.status(400).json({
          success: false,
          message: 'College Training batches cannot be assigned in regular LMS workflow.'
        });
      }
    }

    // Create User
    const user = await User.create({
      name: name.trim(),
      email: normEmail,
      username: normUsername,
      studentId: normStudentId,
      password,
      role: 'student',
      studentType: 'LMS',
      phone: phone ? phone.trim() : ''
    });

    // Resolve Batch inheritance if batchId provided
    let finalCourseId = courseId || null;
    let finalTutorId = tutorId || null;
    let finalLearningMode = learningMode === 'OFFLINE' ? 'OFFLINE' : 'ONLINE';

    if (selectedBatch) {
      if (!finalCourseId && selectedBatch.courseId) finalCourseId = selectedBatch.courseId;
      if (!finalTutorId && selectedBatch.trainerId) finalTutorId = selectedBatch.trainerId;
      if (!learningMode && selectedBatch.mode) finalLearningMode = selectedBatch.mode;

      if (!selectedBatch.studentIds.includes(user._id)) {
        selectedBatch.studentIds.push(user._id);
        selectedBatch.totalStudents = selectedBatch.studentIds.length;
        await selectedBatch.save();
      }
    }

    // Create StudentProfile
    const profileTotal = Number(totalCourseFee) >= 0 ? Number(totalCourseFee) : 24000;
    const profileDP = Number(downPayment) >= 0 ? Number(downPayment) : 0;
    const profileRem = Math.max(0, profileTotal - profileDP);

    let assignedCourseDuration = '12 Weeks';
    let assignedCourseWeeks = 12;
    let assignedTotalHours = 120;

    if (finalCourseId) {
      const cDoc = await Course.findById(finalCourseId);
      if (cDoc) {
        assignedCourseDuration = cDoc.durationText || (cDoc.durationWeeks ? `${cDoc.durationWeeks} Weeks` : '12 Weeks');
        assignedCourseWeeks = cDoc.durationWeeks || 12;
        assignedTotalHours = cDoc.totalHours || 120;
      }
    }

    const profile = await StudentProfile.create({
      userId: user._id,
      studentId: normStudentId,
      studentType: 'LMS',
      enrolledCourseId: finalCourseId,
      courseDuration: assignedCourseDuration,
      courseDurationWeeks: assignedCourseWeeks,
      totalHours: assignedTotalHours,
      assignedTutorId: finalTutorId,
      learningMode: finalLearningMode,
      batchId: batchId || null,
      monthlyFee: parsedMonthlyFee,
      totalCourseFee: profileTotal,
      downPaymentCollected: profileDP,
      remainingPrincipal: profileRem,
      feePaymentStatus: profileRem === 0 && profileDP > 0 ? 'Paid' : (profileDP > 0 ? 'Partially Paid' : 'Pending'),
      lastPaymentDate: profileDP > 0 ? (paymentDate ? new Date(paymentDate) : new Date()) : null,
      totalXp: 100
    });

    // Commit student sequence counter for course
    if (finalCourseId && normStudentId) {
      const parts = normStudentId.split('-');
      const numSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(numSeq)) {
        await commitStudentSequenceForCourse(finalCourseId, numSeq);
      }
    }

    if (finalCourseId) {
      await ensureStudentFeePlanAndInstallment({
        user,
        courseId: finalCourseId,
        totalCourseFee,
        monthlyFee: parsedMonthlyFee,
        downPayment,
        paymentMode,
        paymentDate,
        transactionId,
        tutorId: finalTutorId,
        batchId: batchId || null
      });
    }

    // Add welcome notification
    await Notification.create({
      userId: user._id,
      title: 'Welcome to STACK QUEUE LMS',
      message: `Your student account (@${normUsername} / ${normStudentId}) has been created successfully. Welcome aboard!`,
      type: 'challenge_unlocked'
    });

    const populatedProfile = await StudentProfile.findById(profile._id)
      .populate('userId', 'name email username studentId phone avatar isActive')
      .populate('enrolledCourseId')
      .populate('assignedTutorId', 'name email')
      .populate('batchId', 'name code mode startDate endDate startTime endTime');

    return res.status(201).json({
      success: true,
      message: `Student ${name} (@${normUsername} - ${normStudentId}) created successfully.`,
      data: {
        user: {
          id: user._id,
          username: user.username,
          studentId: user.studentId,
          name: user.name,
          email: user.email,
          role: user.role
        },
        profile: populatedProfile
      }
    });
  } catch (error) {
    console.error('adminCreateStudent error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/lms/admin/students/lookup-by-id/:studentId
exports.lookupStudentById = async (req, res) => {
  try {
    const rawId = req.params.studentId ? req.params.studentId.trim() : '';
    if (!rawId) {
      return res.status(400).json({ success: false, message: 'Student ID is required.' });
    }

    const reg = new RegExp(`^${rawId.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}$`, 'i');

    const user = await User.findOne({
      role: 'student',
      studentType: { $in: ['LMS', 'BOTH'] },
      $or: [{ studentId: reg }, { username: reg }, { email: reg }]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `LMS Institute Student "${rawId}" not found in database.`
      });
    }

    const profile = await StudentProfile.findOne({ userId: user._id })
      .populate('userId', 'name email username studentId phone avatar isActive')
      .populate('enrolledCourseId', 'title slug level code category')
      .populate('previousCourses.courseId', 'title slug level code category')
      .populate('assignedTutorId', 'name email')
      .populate('batchId', 'name code mode');

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: `Student profile not found for "${user.name}".`
      });
    }

    const enrolledCourseIds = [];
    if (profile.enrolledCourseId?._id) {
      enrolledCourseIds.push(profile.enrolledCourseId._id.toString());
    }
    if (profile.previousCourses) {
      profile.previousCourses.forEach(p => {
        if (p.courseId?._id) enrolledCourseIds.push(p.courseId._id.toString());
        else if (p.courseId) enrolledCourseIds.push(p.courseId.toString());
      });
    }

    return res.json({
      success: true,
      data: {
        studentId: user.studentId || profile.studentId,
        username: user.username,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        academicYear: profile.academicYear || 'First Year',
        department: profile.department || 'CSE',
        enrolledCourse: profile.enrolledCourseId,
        enrolledCourseIds,
        profile
      }
    });
  } catch (error) {
    console.error('lookupStudentById error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/lms/admin/courses/:courseId/next-student-id
exports.getNextStudentId = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { getNextStudentIdForCourse } = require('../services/courseStudentIdService');
    const result = await getNextStudentIdForCourse(courseId);
    return res.json({
      success: true,
      data: result
    });
  } catch (err) {
    console.error('getNextStudentId error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/lms/admin/students/resolve-course-by-id/:studentId
exports.resolveCourseByStudentId = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { resolveCourseFromStudentId } = require('../services/courseStudentIdService');
    const course = await resolveCourseFromStudentId(studentId);

    const reg = new RegExp(`^${studentId.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}$`, 'i');
    const existingUser = await User.findOne({ studentId: reg, role: 'student' }).select('name username email studentId');
    let existingProfile = null;
    if (existingUser) {
      existingProfile = await StudentProfile.findOne({ userId: existingUser._id }).populate('enrolledCourseId');
    }

    return res.json({
      success: true,
      data: {
        matchedCourse: course ? {
          _id: course._id,
          title: course.title,
          slug: course.slug,
          domain: course.domain,
          coursePrefix: course.coursePrefix,
          studentIdPrefix: course.studentIdPrefix,
          totalCourseFee: course.totalCourseFee,
          monthlyInstallment: course.monthlyInstallment,
          durationValue: course.durationValue,
          durationUnit: course.durationUnit,
          durationText: course.durationText,
          totalHours: course.totalHours
        } : null,
        isValidPrefix: !!course,
        isExistingStudent: !!existingUser,
        existingUser: existingUser ? {
          _id: existingUser._id,
          name: existingUser.name,
          username: existingUser.username,
          email: existingUser.email,
          studentId: existingUser.studentId,
          enrolledCourse: existingProfile?.enrolledCourseId ? {
            _id: existingProfile.enrolledCourseId._id,
            title: existingProfile.enrolledCourseId.title,
            slug: existingProfile.enrolledCourseId.slug
          } : null
        } : null
      }
    });
  } catch (err) {
    console.error('resolveCourseByStudentId error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/lms/admin/students/filter-options
exports.getStudentDirectoryFilterOptions = async (req, res) => {
  try {
    const courses = await Course.find({ isActive: { $ne: false } })
      .sort({ title: 1 })
      .select('title category code')
      .lean();

    return res.json({
      success: true,
      data: {
        courses
      }
    });
  } catch (error) {
    console.error('getStudentDirectoryFilterOptions error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/lms/admin/students/directory-search
exports.getFilteredStudentsForDirectory = async (req, res) => {
  try {
    const { courseId, search } = req.query;

    const lmsUserIds = await User.find({
      role: 'student',
      studentType: { $in: ['LMS', 'BOTH'] }
    }).distinct('_id');

    const query = {
      $or: [
        { studentType: { $in: ['LMS', 'BOTH'] } },
        { userId: { $in: lmsUserIds } }
      ]
    };

    if (courseId) {
      const courseObj = await Course.findById(courseId).select('title slug category').lean();
      const courseConditions = [
        { enrolledCourseId: courseId },
        { 'previousCourses.courseId': courseId }
      ];
      if (courseObj) {
        if (courseObj.slug) {
          courseConditions.push({ domain: courseObj.slug.toLowerCase() });
        }
        if (courseObj.title) {
          courseConditions.push({ domain: courseObj.title.toLowerCase() });
        }
      }
      query.$and = [{ $or: courseConditions }];
    }

    const profiles = await StudentProfile.find(query)
      .populate('userId', 'name email username studentId phone avatar isActive role studentType')
      .populate('enrolledCourseId', 'title category code')
      .populate('assignedTutorId', 'name email')
      .populate('batchId', 'name code');

    const searchLower = search ? search.trim().toLowerCase() : '';

    const results = profiles
      .filter(p => {
        if (!p.userId || p.userId.role !== 'student') return false;
        const sType = p.userId.studentType || p.studentType;
        return sType === 'LMS' || sType === 'BOTH';
      })
      .filter(p => {
        if (!searchLower) return true;
        const u = p.userId;
        const nameMatch = u.name?.toLowerCase().includes(searchLower);
        const usernameMatch = u.username?.toLowerCase().includes(searchLower);
        const emailMatch = u.email?.toLowerCase().includes(searchLower);
        const stIdMatch = (p.studentId || u.studentId || '').toLowerCase().includes(searchLower);
        return nameMatch || usernameMatch || emailMatch || stIdMatch;
      })
      .map(p => ({
        _id: p._id,
        userId: p.userId._id,
        studentId: p.studentId || p.userId.studentId,
        name: p.userId.name,
        username: p.userId.username,
        email: p.userId.email,
        phone: p.userId.phone,
        department: p.department || '',
        enrolledCourse: p.enrolledCourseId,
        enrolledCourseId: p.enrolledCourseId?._id || p.enrolledCourseId
      }));

    return res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    console.error('getFilteredStudentsForDirectory error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/lms/admin/students
// Fetches enrolled students with optional courseId and learningMode filters, dynamic attendance percentages & session history
exports.adminGetStudents = async (req, res) => {
  try {
    const { courseId, learningMode } = req.query;

    // RULE: LMS Management operates EXCLUSIVELY on Institute LMS Students
    const lmsUserIds = await User.find({
      role: 'student',
      studentType: { $in: ['LMS', 'BOTH'] }
    }).distinct('_id');

    const filter = {
      $or: [
        { studentType: { $in: ['LMS', 'BOTH'] } },
        { userId: { $in: lmsUserIds } }
      ]
    };
    if (courseId) filter.enrolledCourseId = courseId;
    if (learningMode) filter.learningMode = learningMode;

    const [rawProfiles, sessions] = await Promise.all([
      StudentProfile.find(filter)
        .populate('userId', 'name email username studentId phone avatar isActive role studentType')
        .populate('enrolledCourseId', 'title slug level durationWeeks')
        .populate('assignedTutorId', 'name email')
        .populate('batchId', 'name code mode startDate endDate startTime endTime')
        .sort({ createdAt: -1 })
        .lean(),
      Session.find()
        .select('studentIds courseId sessionId title scheduledDate startTime endTime sessionType attendance')
        .sort({ scheduledDate: -1 })
        .lean()
    ]);

    // Strict in-memory verification to completely exclude College Training only students
    const profiles = rawProfiles.filter(p => {
      if (!p.userId) return false;
      const sType = p.userId.studentType || p.studentType;
      return sType === 'LMS' || sType === 'BOTH';
    });

    const formattedStudents = profiles.map((p) => {
      const studentObj = p;
      const uIdStr = p.userId?._id?.toString();
      const cIdStr = p.enrolledCourseId?._id?.toString();

      // Find sessions assigned to this student or their course
      const studentSessions = sessions.filter((s) => {
        const hasDirectId = s.studentIds && s.studentIds.some(id => id.toString() === uIdStr);
        const matchesCourse = cIdStr && s.courseId && s.courseId.toString() === cIdStr;
        return hasDirectId || matchesCourse;
      });

      let presentCount = 0;
      let absentCount = 0;
      let leaveCount = 0;
      let lateCount = 0;
      const attendanceHistory = [];

      studentSessions.forEach((sess) => {
        const attRec = sess.attendance ? sess.attendance.find(a => a.studentId.toString() === uIdStr) : null;
        const status = attRec ? attRec.status : 'PENDING';

        if (status === 'PRESENT') presentCount++;
        else if (status === 'ABSENT') absentCount++;
        else if (status === 'LEAVE') leaveCount++;
        else if (status === 'LATE') lateCount++;

        attendanceHistory.push({
          sessionId: sess._id,
          sessionCode: sess.sessionId,
          title: sess.title,
          scheduledDate: sess.scheduledDate,
          startTime: sess.startTime,
          endTime: sess.endTime,
          sessionType: sess.sessionType,
          status,
          absenceReason: attRec?.absenceReason || null,
          absenceDescription: attRec?.absenceDescription || null
        });
      });

      const totalMarked = presentCount + absentCount + leaveCount + lateCount;
      const attendancePercentage = totalMarked > 0
        ? Math.round(((presentCount + leaveCount + lateCount) / totalMarked) * 100)
        : 100;

      studentObj.attendancePercentage = attendancePercentage;
      studentObj.attendanceStats = {
        totalClasses: studentSessions.length,
        markedClasses: totalMarked,
        present: presentCount,
        absent: absentCount,
        leave: leaveCount,
        late: lateCount
      };
      studentObj.attendanceHistory = attendanceHistory;

      return studentObj;
    });

    return res.json({ success: true, data: formattedStudents });
  } catch (error) {
    console.error('adminGetStudents error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/lms/courses
exports.getCourses = async (req, res) => {
  try {
    const courses = await Course.find({ isActive: { $ne: false } }).sort({ title: 1 });
    return res.json({ success: true, data: courses });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/lms/admin/courses
exports.adminCreateCourse = async (req, res) => {
  try {
    const { title, slug, description, category, level, durationWeeks } = req.body;
    const course = await Course.create({
      title: title.trim(),
      slug: (slug || title.toLowerCase().replace(/\s+/g, '-')).trim(),
      description: description || 'Comprehensive syllabus program',
      category: category || 'Software Development',
      level: level || 'All Levels',
      durationWeeks: durationWeeks || 12
    });
    return res.status(201).json({ success: true, data: course });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/lms/admin/modules
exports.adminCreateModule = async (req, res) => {
  try {
    const { courseId, title, description, order } = req.body;
    const moduleItem = await Module.create({
      courseId,
      title: title.trim(),
      description: description || '',
      order: order || 1
    });
    return res.status(201).json({ success: true, data: moduleItem });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/lms/admin/concepts
exports.adminCreateConcept = async (req, res) => {
  try {
    const { moduleId, courseId, title, description, order, assignedTutorId, tutorStatus } = req.body;
    const concept = await Concept.create({
      moduleId,
      courseId,
      title: title.trim(),
      description: description || '',
      order: order || 1,
      assignedTutorId: assignedTutorId || null,
      tutorStatus: tutorStatus || 'NOT_STARTED'
    });
    return res.status(201).json({ success: true, data: concept });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/lms/admin/tasks
// Admin adds 10-15 tasks per concept
exports.adminCreateConceptTask = async (req, res) => {
  try {
    const {
      taskId,
      conceptId,
      moduleId,
      courseId,
      question,
      description,
      expectedOutput,
      starterCode,
      difficulty,
      marks,
      order
    } = req.body;

    const task = await ConceptTask.create({
      taskId: taskId.trim(),
      conceptId,
      moduleId,
      courseId,
      question: question.trim(),
      description: description.trim(),
      expectedOutput: expectedOutput.trim(),
      starterCode: starterCode || '',
      difficulty: difficulty || 'Easy',
      marks: marks || 10,
      order: order || 1
    });

    return res.status(201).json({ success: true, data: task });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/lms/admin/schedule-class
// Admin schedules ONLINE/OFFLINE Class across a Date Range (Starting Date to Ending Date)
exports.adminScheduleClass = async (req, res) => {
  try {
    const {
      batchId,
      courseId,
      moduleId,
      conceptId,
      tutorId,
      title,
      startDate,     // YYYY-MM-DD (Starting Date)
      endDate,       // YYYY-MM-DD (Ending Date)
      scheduledDate, // fallback for backwards compatibility
      selectedDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      startTime,     // e.g. "10:00 AM"
      endTime,       // e.g. "11:00 AM"
      meetingLink,   // exact meeting link required for ONLINE classes
      sessionType = 'ONLINE',
      classroom = '',
      studentIds: targetStudentIds
    } = req.body;

    const effectiveStartDate = startDate || scheduledDate;
    const effectiveEndDate = endDate || startDate || scheduledDate;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Class Title is required.' });
    }

    if (!courseId) {
      return res.status(400).json({ success: false, message: 'Course / Domain is required.' });
    }

    if (!tutorId) {
      return res.status(400).json({ success: false, message: 'Tutor is required.' });
    }

    if (!effectiveStartDate) {
      return res.status(400).json({ success: false, message: 'Starting Date is required.' });
    }

    if (!effectiveEndDate) {
      return res.status(400).json({ success: false, message: 'Ending Date is required.' });
    }

    if (effectiveStartDate > effectiveEndDate) {
      return res.status(400).json({
        success: false,
        message: 'Starting Date must be earlier than or equal to Ending Date.'
      });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (effectiveStartDate < todayStr) {
      return res.status(400).json({
        success: false,
        message: 'Cannot schedule classes in the past. Starting Date must be today or a future date.'
      });
    }

    if (!startTime || !endTime) {
      return res.status(400).json({ success: false, message: 'Start Time and End Time are required.' });
    }

    if (sessionType === 'ONLINE' && !meetingLink) {
      return res.status(400).json({ success: false, message: 'Meeting Link is required for Online classes.' });
    }

    if (!targetStudentIds || !Array.isArray(targetStudentIds) || targetStudentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one eligible ONLINE student must be selected for the class.'
      });
    }

    let selectedBatch = null;
    if (batchId) {
      selectedBatch = await Batch.findById(batchId);
      if (!selectedBatch) {
        return res.status(404).json({
          success: false,
          message: 'Selected batch not found.'
        });
      }
      if (selectedBatch.batchType === 'COLLEGE_TRAINING' || selectedBatch.collegeId) {
        return res.status(400).json({
          success: false,
          message: 'College Training batches cannot be scheduled in regular LMS class scheduler.'
        });
      }

      // Date Range Validation against Batch Start Date & End Date
      if (selectedBatch.startDate && selectedBatch.endDate) {
        const bStartStr = new Date(selectedBatch.startDate).toISOString().split('T')[0];
        const bEndStr = new Date(selectedBatch.endDate).toISOString().split('T')[0];

        if (effectiveStartDate < bStartStr || effectiveEndDate > bEndStr) {
          return res.status(400).json({
            success: false,
            message: `Scheduled class date range (${effectiveStartDate} to ${effectiveEndDate}) falls outside batch duration (${bStartStr} to ${bEndStr}).`
          });
        }
      }
    }

    // STRICT BACKEND VALIDATION: Every selected student MUST belong to selected batch/course AND have learningMode === 'ONLINE'
    const query = {
      userId: { $in: targetStudentIds },
      learningMode: 'ONLINE'
    };

    if (selectedBatch) {
      const batchStudentUserIds = (selectedBatch.studentIds || []).map(id => id.toString());
      query.$or = [
        { batchId: selectedBatch._id },
        { userId: { $in: batchStudentUserIds } }
      ];
    } else {
      query.enrolledCourseId = courseId;
    }

    const validProfiles = await StudentProfile.find(query).populate('userId', 'name email studentId username');

    if (validProfiles.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: None of the selected students are eligible ONLINE students in the selected batch/course.'
      });
    }

    const studentIds = validProfiles.map(p => p.userId._id);

    // Build list of specific session dates within [effectiveStartDate, effectiveEndDate]
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const datesToSchedule = [];

    const [sy, sm, sd] = effectiveStartDate.split('-').map(Number);
    const [ey, em, ed] = effectiveEndDate.split('-').map(Number);
    const curr = new Date(Date.UTC(sy, sm - 1, sd));
    const end = new Date(Date.UTC(ey, em - 1, ed));

    while (curr <= end) {
      const dateStr = curr.toISOString().split('T')[0];
      const dayName = dayNames[curr.getUTCDay()];

      // If single day, schedule it unconditionally. For multi-day, filter by selectedDays.
      if (effectiveStartDate === effectiveEndDate || !Array.isArray(selectedDays) || selectedDays.length === 0 || selectedDays.includes(dayName)) {
        datesToSchedule.push({ dateStr, dayName });
      }

      curr.setUTCDate(curr.getUTCDate() + 1);
    }

    if (datesToSchedule.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No dates matched the selected days in the date range. Please select at least one matching day.'
      });
    }

    // Build initial attendance records for all assigned students
    const initialAttendance = studentIds.map(sId => ({
      studentId: sId,
      status: 'PENDING'
    }));

    const createdSessions = [];
    let skippedDuplicates = 0;

    for (const item of datesToSchedule) {
      // Check for duplicate session: avoid recreating if same course/batch, tutor, date, startTime already exists
      const dupQuery = {
        courseId,
        tutorId,
        scheduledDate: item.dateStr,
        startTime,
        status: { $ne: 'CANCELLED' }
      };
      if (selectedBatch) {
        dupQuery.batchId = selectedBatch._id;
      }

      const existingSession = await Session.findOne(dupQuery);
      if (existingSession) {
        skippedDuplicates++;
        continue;
      }

      const scheduledStartDateTime = new Date(`${item.dateStr} ${startTime}`);
      const scheduledEndDateTime = new Date(`${item.dateStr} ${endTime}`);
      const sessionId = `CLS-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

      const session = await Session.create({
        sessionId,
        batchId: selectedBatch ? selectedBatch._id : null,
        courseId,
        moduleId: moduleId || null,
        conceptId: conceptId || null,
        tutorId,
        studentIds,
        title: title.trim(),
        topic: title.trim(),
        scheduledDate: item.dateStr,
        startDate: effectiveStartDate,
        endDate: effectiveEndDate,
        startTime,
        endTime,
        scheduledStartDateTime: isNaN(scheduledStartDateTime.getTime()) ? new Date() : scheduledStartDateTime,
        scheduledEndDateTime: isNaN(scheduledEndDateTime.getTime()) ? new Date(Date.now() + 3600000) : scheduledEndDateTime,
        sessionType: sessionType === 'OFFLINE' ? 'OFFLINE' : 'ONLINE',
        meetingLink: sessionType === 'OFFLINE' ? '' : (meetingLink ? meetingLink.trim() : ''),
        classroom: sessionType === 'OFFLINE' ? (classroom || 'Institute Classroom') : '',
        status: 'UPCOMING',
        attendance: initialAttendance
      });

      createdSessions.push(session);
    }

    if (createdSessions.length === 0 && skippedDuplicates > 0) {
      return res.status(400).json({
        success: false,
        message: `All ${skippedDuplicates} class session(s) in this date range already exist. No duplicate classes were created.`
      });
    }

    // Notify enrolled students via DB Notification & Email
    const course = await Course.findById(courseId).select('title');
    const tutor = await User.findById(tutorId).select('name email');
    const { sendLiveClassReminderEmail } = require('../services/emailService');

    const dateRangeLabel = effectiveStartDate === effectiveEndDate
      ? effectiveStartDate
      : `${effectiveStartDate} to ${effectiveEndDate} (${createdSessions.length} session${createdSessions.length > 1 ? 's' : ''})`;

    let emailSentCount = 0;
    for (const profile of validProfiles) {
      const u = profile.userId;
      if (!u) continue;

      // In-app notification
      await Notification.create({
        userId: u._id,
        title: 'New Online Class Scheduled',
        message: `Online class for "${title}" on ${dateRangeLabel} from ${startTime} to ${endTime} has been scheduled.`,
        type: 'training_reminder'
      });

      // Email notification (1 consolidated notification email per student covering the scheduled range)
      if (u.email && sessionType === 'ONLINE') {
        try {
          await sendLiveClassReminderEmail({
            toEmail: u.email,
            recipientName: u.name,
            batchName: selectedBatch?.name || '',
            courseTitle: course?.title || '',
            tutorName: tutor?.name || '',
            topic: title.trim(),
            scheduledDate: dateRangeLabel,
            startTime,
            endTime,
            meetingLink: meetingLink ? meetingLink.trim() : ''
          });
          emailSentCount++;
        } catch (mailErr) {
          console.error(`[adminScheduleClass] Failed to send email to ${u.email}:`, mailErr.message);
        }
      }
    }

    const duplicateNotice = skippedDuplicates > 0 ? ` (${skippedDuplicates} duplicate session(s) skipped)` : '';

    return res.status(201).json({
      success: true,
      message: `Scheduled ${createdSessions.length} class session(s) successfully for "${title}" across ${dateRangeLabel}.${duplicateNotice} Assigned to ${studentIds.length} ONLINE student(s). (${emailSentCount} email notification(s) dispatched)`,
      data: createdSessions[0] || null,
      createdSessions
    });
  } catch (error) {
    console.error('adminScheduleClass error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/lms/admin/attendance-report
exports.adminGetAttendanceReport = async (req, res) => {
  try {
    const sessions = await Session.find()
      .populate('courseId', 'title')
      .populate('conceptId', 'title')
      .populate('tutorId', 'name email')
      .populate('attendance.studentId', 'name email studentId')
      .sort({ scheduledDate: -1 });

    const [leaveRequests, studentLeaves] = await Promise.all([
      LeaveRequest.find()
        .populate('studentId', 'name email studentId')
        .populate('sessionId', 'title scheduledDate startTime sessionType')
        .sort({ createdAt: -1 }),
      StudentLeave.find()
        .populate('studentId', 'name email studentId username')
        .populate('tutorId', 'name email')
        .populate('batchId', 'name code')
        .populate('approvedBy', 'name email')
        .sort({ createdAt: -1 })
    ]);

    const mappedStudentLeaves = studentLeaves.map(sl => ({
      _id: sl._id,
      studentId: sl.studentId,
      sessionId: {
        scheduledDate: sl.leaveDate,
        startTime: sl.leaveType || 'Full Day',
        sessionType: 'DAILY_LEAVE'
      },
      reason: sl.reason,
      description: sl.approvalReason || `${sl.leaveType || 'Full Day'} student leave request`,
      status: (sl.status || 'PENDING').toUpperCase(),
      isStudentLeave: true,
      leaveType: sl.leaveType,
      tutorName: sl.tutorId?.name || 'Unassigned Tutor',
      batchName: sl.batchId?.name || 'Standard Batch',
      approvedBy: sl.approvedBy?.name,
      createdAt: sl.createdAt
    }));

    const allLeaveRequests = [...mappedStudentLeaves, ...leaveRequests];

    return res.json({
      success: true,
      data: {
        sessions,
        leaveRequests: allLeaveRequests
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/lms/admin/leave-requests/:id/review
exports.adminReviewLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body; // APPROVED or REJECTED

    // Check if it's a StudentLeave record
    const studentLeave = await StudentLeave.findById(id);
    if (studentLeave) {
      studentLeave.status = status === 'APPROVED' ? 'Approved' : 'Rejected';
      studentLeave.approvalReason = remarks || `Reviewed and ${status.toLowerCase()} by administration.`;
      studentLeave.approvedBy = req.user._id;
      studentLeave.approvedAt = new Date();
      await studentLeave.save();

      if (status === 'APPROVED') {
        await StudentAttendance.findOneAndUpdate(
          { date: studentLeave.leaveDate, studentId: studentLeave.studentId },
          {
            date: studentLeave.leaveDate,
            studentId: studentLeave.studentId,
            status: 'Leave',
            markedBy: req.user._id
          },
          { upsert: true, new: true }
        );
      }

      await Notification.create({
        userId: studentLeave.studentId,
        title: `Leave Request ${status === 'APPROVED' ? 'Approved' : 'Rejected'}`,
        message: `Your leave request for ${studentLeave.leaveDate} has been ${status.toLowerCase()}. Remarks: ${remarks || 'None'}`,
        type: 'attendance_warning'
      });

      return res.json({ success: true, message: `Leave request ${status}`, data: studentLeave });
    }

    const request = await LeaveRequest.findById(id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    request.status = status;
    request.reviewRemarks = remarks || '';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();

    // If approved, update attendance in Session to LEAVE
    if (status === 'APPROVED') {
      await Session.updateOne(
        { _id: request.sessionId, 'attendance.studentId': request.studentId },
        {
          $set: {
            'attendance.$.status': 'LEAVE',
            'attendance.$.absenceReason': request.reason,
            'attendance.$.absenceDescription': request.description,
            'attendance.$.absenceSubmittedAt': new Date()
          }
        }
      );
    }

    // Notify student
    await Notification.create({
      userId: request.studentId,
      title: `Leave Request ${status}`,
      message: `Your leave request for the class has been ${status.toLowerCase()}. Remarks: ${remarks || 'None'}`,
      type: 'attendance_warning'
    });

    return res.json({ success: true, message: `Leave request ${status}`, data: request });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/lms/admin/sessions/:id
exports.adminDeleteSession = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await Session.findByIdAndDelete(id);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }
    await LeaveRequest.deleteMany({ sessionId: id });
    return res.json({ success: true, message: 'Scheduled class deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};


// ==========================================
// 2. TUTOR LMS CONTROLLERS
// ==========================================

// GET /api/lms/tutor/assigned-content
exports.tutorGetAssignedContent = async (req, res) => {
  try {
    const tutorId = req.user._id;

    // Assigned concepts
    const concepts = await Concept.find({ assignedTutorId: tutorId })
      .populate('moduleId', 'title order')
      .populate('courseId', 'title')
      .sort({ order: 1 });

    // Assigned classes
    const classes = await Session.find({ tutorId })
      .populate('courseId', 'title')
      .populate('moduleId', 'title')
      .populate('conceptId', 'title')
      .populate('attendance.studentId', 'name studentId email')
      .sort({ scheduledDate: -1 });

    return res.json({
      success: true,
      data: {
        concepts,
        classes
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/lms/concepts/:conceptId/status
// Tutor marks concept NOT_STARTED -> IN_PROGRESS -> COMPLETED
// Strict Permission: Only assigned tutor or admin can mark!
exports.updateConceptStatus = async (req, res) => {
  try {
    const { conceptId } = req.params;
    const { status } = req.body; // NOT_STARTED, IN_PROGRESS, COMPLETED

    if (!['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be NOT_STARTED, IN_PROGRESS, or COMPLETED.'
      });
    }

    const concept = await Concept.findById(conceptId);
    if (!concept) {
      return res.status(404).json({ success: false, message: 'Concept not found.' });
    }

    // Strict authorization check: Only assigned tutor or Admin
    const isAssignedTutor = concept.assignedTutorId && concept.assignedTutorId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isAssignedTutor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied: You can only update concepts assigned to you.'
      });
    }

    concept.tutorStatus = status;
    if (status === 'COMPLETED') {
      concept.tutorCompletedAt = new Date();

      // Find enrolled students in this course to notify them that tasks are UNLOCKED!
      const students = await StudentProfile.find({ enrolledCourseId: concept.courseId });
      for (const st of students) {
        await Notification.create({
          userId: st.userId,
          title: 'Concept Completed! Tasks Unlocked 🔓',
          message: `Your tutor has completed "${concept.title}". Tasks are now unlocked!`,
          type: 'challenge_unlocked'
        });
      }
    } else {
      concept.tutorCompletedAt = null;
    }

    await concept.save();

    return res.json({
      success: true,
      message: status === 'COMPLETED'
        ? '✓ Concept Completed. Student tasks have been unlocked.'
        : `Concept status updated to ${status}.`,
      data: concept
    });
  } catch (error) {
    console.error('updateConceptStatus error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/lms/sessions/:sessionId/attendance
// Tutor records attendance for a class
exports.tutorRecordAttendance = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { studentId, status } = req.body; // PRESENT, ABSENT, LEAVE

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Class session not found.' });
    }

    // Verify tutor owns this class (or is admin)
    if (session.tutorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'You can only take attendance for your own classes.' });
    }

    const recIndex = session.attendance.findIndex(a => a.studentId.toString() === studentId.toString());
    if (recIndex >= 0) {
      session.attendance[recIndex].status = status;
      if (status === 'PRESENT') {
        session.attendance[recIndex].joinedAt = new Date();
      }
    } else {
      session.attendance.push({
        studentId,
        status,
        joinedAt: status === 'PRESENT' ? new Date() : null
      });
    }

    await session.save();

    // Also update standalone Attendance collection
    await Attendance.findOneAndUpdate(
      { date: session.scheduledDate, userId: studentId },
      {
        date: session.scheduledDate,
        userId: studentId,
        sessionId: session._id,
        courseId: session.courseId,
        conceptId: session.conceptId,
        status,
        markedBy: req.user._id
      },
      { upsert: true, new: true }
    );

    // If marked absent, send notification to prompt student for absence reason
    if (status === 'ABSENT') {
      await Notification.create({
        userId: studentId,
        title: 'Attendance Marked: Absent',
        message: `You were marked absent for "${session.title}" on ${session.scheduledDate}. Please submit your reason.`,
        type: 'attendance_warning'
      });
    }

    return res.json({ success: true, message: `Attendance marked as ${status}`, data: session.attendance });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};


// ==========================================
// 3. STUDENT LMS CONTROLLERS
// ==========================================

// GET /api/lms/student/dashboard
// Dynamic dashboard calculations: NEVER hardcoded!
exports.getStudentDashboard = async (req, res) => {
  try {
    const studentId = req.user._id;

    // 1. Get Student Profile & Enrolled Course / Assigned Tutor
    let profile = await StudentProfile.findOne({ userId: studentId })
      .populate('enrolledCourseId')
      .populate('assignedTutorId', 'name email avatar phone');

    // If no profile, create default
    if (!profile) {
      profile = await StudentProfile.create({
        userId: studentId,
        studentId: req.user.studentId || 'STU' + studentId.toString().slice(-4).toUpperCase(),
        totalXp: 100
      });
    }

    const course = profile.enrolledCourseId;
    const tutor = profile.assignedTutorId;
    const courseId = course?._id;

    // 2. Syllabus Hierarchy & Concepts
    let modules = [];
    let concepts = [];
    let allCourseTasks = [];

    if (courseId) {
      modules = await Module.find({ courseId, isPublished: true }).sort({ order: 1 });
      concepts = await Concept.find({ courseId, isPublished: true })
        .populate('assignedTutorId', 'name')
        .sort({ order: 1 });
      allCourseTasks = await ConceptTask.find({ courseId, status: 'ACTIVE' }).sort({ order: 1 });
    }

    // 3. Submissions by student
    const studentSubmissions = await ConceptTaskSubmission.find({
      studentId,
      status: 'COMPLETED'
    });
    const completedTaskIdSet = new Set(studentSubmissions.map(s => s.taskId.toString()));

    // 4. Calculate Task Progress
    const totalCourseTasksCount = allCourseTasks.length;
    const completedTasksCount = studentSubmissions.length;
    const taskProgressPercentage = totalCourseTasksCount > 0
      ? Math.round((completedTasksCount / totalCourseTasksCount) * 100)
      : 0;

    // 5. Calculate Concept & Syllabus Progress
    // A concept is completed by the student if all its tasks are completed (and it has at least 1 task)
    let completedConceptsCount = 0;
    const conceptTaskProgressMap = {};

    for (const cpt of concepts) {
      const cptTasks = allCourseTasks.filter(t => t.conceptId.toString() === cpt._id.toString());
      const cptDoneTasks = cptTasks.filter(t => completedTaskIdSet.has(t._id.toString()));
      const isConceptCompleted = cptTasks.length > 0 && cptDoneTasks.length === cptTasks.length;
      if (isConceptCompleted) {
        completedConceptsCount++;
      }
      conceptTaskProgressMap[cpt._id.toString()] = {
        total: cptTasks.length,
        completed: cptDoneTasks.length,
        isCompleted: isConceptCompleted
      };
    }

    const totalConceptsCount = concepts.length;
    const syllabusProgressPercentage = totalConceptsCount > 0
      ? Math.round((completedConceptsCount / totalConceptsCount) * 100)
      : 0;

    // 6. Calculate Attendance Rate
    // Look in Session attendance array & Attendance collection
    const userSessions = await Session.find({
      $or: [
        { studentIds: studentId },
        { courseId: courseId }
      ]
    }).sort({ scheduledDate: -1 });

    let presentCount = 0;
    let absentCount = 0;
    let leaveCount = 0;
    const attendanceHistory = [];

    userSessions.forEach(sess => {
      const rec = sess.attendance.find(a => a.studentId.toString() === studentId.toString());
      const status = rec ? rec.status : 'PENDING';

      if (status === 'PRESENT') presentCount++;
      else if (status === 'ABSENT') absentCount++;
      else if (status === 'LEAVE') leaveCount++;

      attendanceHistory.push({
        sessionId: sess._id,
        sessionCode: sess.sessionId,
        title: sess.title,
        topic: sess.topic,
        date: sess.scheduledDate,
        startTime: sess.startTime,
        endTime: sess.endTime,
        sessionType: sess.sessionType,
        status,
        absenceReason: rec?.absenceReason || null,
        absenceDescription: rec?.absenceDescription || '',
        absenceSubmittedAt: rec?.absenceSubmittedAt || null,
        canSubmitReason: status === 'ABSENT' && !rec?.absenceReason
      });
    });

    const totalMarkedClasses = presentCount + absentCount + leaveCount;
    const attendancePercentage = totalMarkedClasses > 0
      ? Math.round((presentCount / totalMarkedClasses) * 100)
      : 100;

    // 7. Calculate Overall Learning Progress
    // Weighted combination: 35% Syllabus + 45% Tasks + 20% Attendance
    const overallLearningPercentage = Math.round(
      syllabusProgressPercentage * 0.35 +
      taskProgressPercentage * 0.45 +
      attendancePercentage * 0.20
    );

    // 8. Find Today's Class or Next Upcoming Class
    const todayStr = new Date().toISOString().split('T')[0];
    let todaysClass = null;

    // Look for a class scheduled for today
    const todaySession = userSessions.find(s => s.scheduledDate === todayStr) || userSessions[0];

    if (todaySession) {
      const now = new Date();
      let isLive = false;

      // Check if session is live or upcoming
      if (todaySession.status === 'LIVE') {
        isLive = true;
      } else if (todaySession.scheduledStartDateTime && todaySession.scheduledEndDateTime) {
        isLive = now >= todaySession.scheduledStartDateTime && now <= todaySession.scheduledEndDateTime;
      }

      todaysClass = {
        sessionId: todaySession._id,
        sessionCode: todaySession.sessionId,
        title: todaySession.title,
        topic: todaySession.topic,
        date: todaySession.scheduledDate,
        startTime: todaySession.startTime,
        endTime: todaySession.endTime,
        sessionType: todaySession.sessionType, // ONLINE or OFFLINE
        meetingLink: todaySession.sessionType === 'ONLINE' ? todaySession.meetingLink : null,
        classroom: todaySession.sessionType === 'OFFLINE' ? todaySession.classroom : null,
        status: todaySession.status,
        isLive
      };
    }

    // 9. Current Learning Concept
    // Pick the current concept in progress or first unlocked concept
    let currentConcept = null;
    let currentModule = null;

    for (const cpt of concepts) {
      const stats = conceptTaskProgressMap[cpt._id.toString()];
      // If concept is unlocked (tutor COMPLETED) and student has not finished all tasks
      if (cpt.tutorStatus === 'COMPLETED' && (!stats || !stats.isCompleted)) {
        currentConcept = cpt;
        currentModule = modules.find(m => m._id.toString() === cpt.moduleId.toString());
        break;
      }
    }

    // If all completed or none in progress, pick first concept with IN_PROGRESS tutorStatus or first concept
    if (!currentConcept && concepts.length > 0) {
      currentConcept = concepts.find(c => c.tutorStatus === 'IN_PROGRESS') || concepts[0];
      currentModule = modules.find(m => m._id.toString() === currentConcept.moduleId.toString());
    }

    let currentLearningData = null;
    if (currentConcept) {
      const cptStats = conceptTaskProgressMap[currentConcept._id.toString()] || { total: 0, completed: 0 };
      const isLocked = currentConcept.tutorStatus !== 'COMPLETED';
      currentLearningData = {
        conceptId: currentConcept._id,
        conceptTitle: currentConcept.title,
        moduleTitle: currentModule?.title || 'Core Syllabus',
        courseTitle: course?.title || 'Enrolled Course',
        tutorName: tutor?.name || currentConcept.assignedTutorId?.name || 'Assigned Tutor',
        tutorStatus: currentConcept.tutorStatus, // NOT_STARTED, IN_PROGRESS, COMPLETED
        isLocked,
        tasksTotal: cptStats.total,
        tasksCompleted: cptStats.completed,
        taskPercentage: cptStats.total > 0 ? Math.round((cptStats.completed / cptStats.total) * 100) : 0,
        message: isLocked ? 'Tasks will unlock after the tutor completes this concept.' : null
      };
    }

    // 10. Syllabus Roadmap Visualization
    const roadmap = modules.map(mod => {
      const modConcepts = concepts.filter(c => c.moduleId.toString() === mod._id.toString());
      const conceptsWithState = modConcepts.map(cpt => {
        const stats = conceptTaskProgressMap[cpt._id.toString()] || { total: 0, completed: 0 };
        let state = 'LOCKED'; // 🔒 Locked
        if (cpt.tutorStatus === 'COMPLETED') {
          if (stats.total > 0 && stats.completed === stats.total) {
            state = 'COMPLETED'; // ✓ Completed
          } else if (stats.completed > 0) {
            state = 'IN_PROGRESS'; // ◐ In Progress
          } else {
            state = 'UNLOCKED'; // ○ Not Started
          }
        }
        return {
          id: cpt._id,
          title: cpt.title,
          tutorStatus: cpt.tutorStatus,
          state,
          tasksTotal: stats.total,
          tasksCompleted: stats.completed
        };
      });

      return {
        id: mod._id,
        title: mod.title,
        order: mod.order,
        concepts: conceptsWithState
      };
    });

    // 11. Recent Activity & Notifications
    const notifications = await Notification.find({ userId: studentId })
      .sort({ createdAt: -1 })
      .limit(6);

    const recentActivity = [];
    if (completedTasksCount > 0) {
      recentActivity.push({
        type: 'task',
        text: `Completed Task — ${currentConcept?.title || 'HashMap'} Task`,
        time: 'Recently'
      });
    }
    if (completedConceptsCount > 0) {
      recentActivity.push({
        type: 'concept',
        text: `Completed Concept — ${completedConceptsCount} concepts fully mastered`,
        time: 'This week'
      });
    }
    if (presentCount > 0) {
      recentActivity.push({
        type: 'attendance',
        text: `Attended Class — ${todaysClass?.title || 'Java Class'}`,
        time: todaysClass?.date || 'Recent'
      });
    }
    if (currentConcept && currentConcept.tutorStatus === 'COMPLETED') {
      recentActivity.push({
        type: 'unlock',
        text: `Concept Unlocked — ${currentConcept.title}`,
        time: 'Active'
      });
    }

    return res.json({
      success: true,
      data: {
        student: {
          id: req.user._id,
          name: req.user.name,
          studentId: req.user.studentId || profile.studentId || 'STU1001',
          email: req.user.email,
          avatar: req.user.avatar,
          domain: course?.title || 'Java Full Stack',
          tutorName: tutor?.name || 'Arun'
        },
        metrics: {
          overallLearningPercentage,
          syllabusProgressPercentage,
          taskProgressPercentage,
          attendancePercentage,
          totalConcepts: totalConceptsCount,
          completedConcepts: completedConceptsCount,
          totalTasks: totalCourseTasksCount,
          completedTasks: completedTasksCount,
          attendance: {
            present: presentCount,
            absent: absentCount,
            leave: leaveCount,
            total: totalMarkedClasses
          }
        },
        todaysClass,
        currentLearning: currentLearningData,
        roadmap,
        attendanceHistory,
        recentActivity,
        notifications
      }
    });
  } catch (error) {
    console.error('getStudentDashboard error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/lms/concepts/:conceptId/tasks
// Student views tasks for a concept
// STRICT BUSINESS RULE: Tasks are LOCKED if concept.tutorStatus !== 'COMPLETED'
exports.getConceptTasks = async (req, res) => {
  try {
    const { conceptId } = req.params;
    const studentId = req.user._id;

    const concept = await Concept.findById(conceptId)
      .populate('moduleId', 'title')
      .populate('courseId', 'title')
      .populate('assignedTutorId', 'name');

    if (!concept) {
      return res.status(404).json({ success: false, message: 'Concept not found' });
    }

    // STRICT BACKEND VALIDATION RULE:
    if (concept.tutorStatus !== 'COMPLETED') {
      return res.status(403).json({
        success: false,
        message: 'This concept has not been completed by the tutor yet.'
      });
    }

    // Retrieve all active tasks for this concept (10-15 tasks)
    const tasks = await ConceptTask.find({ conceptId, status: 'ACTIVE' }).sort({ order: 1 });

    // Retrieve student's submissions
    const submissions = await ConceptTaskSubmission.find({
      studentId,
      conceptId,
      status: 'COMPLETED'
    });
    const submissionMap = {};
    submissions.forEach(sub => {
      submissionMap[sub.taskId.toString()] = sub;
    });

    const tasksWithState = tasks.map(t => {
      const sub = submissionMap[t._id.toString()];
      return {
        id: t._id,
        taskId: t.taskId,
        question: t.question,
        description: t.description,
        expectedOutput: t.expectedOutput,
        starterCode: t.starterCode,
        difficulty: t.difficulty,
        marks: t.marks,
        order: t.order,
        isCompleted: !!sub,
        submission: sub ? {
          codeAnswer: sub.codeAnswer,
          output: sub.output,
          marksAwarded: sub.marksAwarded,
          completedAt: sub.completedAt
        } : null
      };
    });

    const completedCount = submissions.length;
    const totalCount = tasks.length;
    const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return res.json({
      success: true,
      data: {
        concept: {
          id: concept._id,
          title: concept.title,
          moduleTitle: concept.moduleId?.title,
          courseTitle: concept.courseId?.title,
          tutorStatus: concept.tutorStatus,
          tutorName: concept.assignedTutorId?.name
        },
        progress: {
          completed: completedCount,
          total: totalCount,
          percentage
        },
        tasks: tasksWithState
      }
    });
  } catch (error) {
    console.error('getConceptTasks error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/lms/tasks/:taskId/submit
// Student submits a task solution
// STRICT BACKEND VALIDATION RULE: Rejects if concept.tutorStatus !== 'COMPLETED'
exports.submitConceptTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { codeAnswer, output } = req.body;
    const studentId = req.user._id;

    const task = await ConceptTask.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const concept = await Concept.findById(task.conceptId);
    if (!concept || concept.tutorStatus !== 'COMPLETED') {
      return res.status(403).json({
        success: false,
        message: 'This concept has not been completed by the tutor yet.'
      });
    }

    // Save or update submission
    const submission = await ConceptTaskSubmission.findOneAndUpdate(
      { studentId, taskId: task._id },
      {
        studentId,
        conceptId: task.conceptId,
        taskId: task._id,
        codeAnswer: codeAnswer || '',
        output: output || task.expectedOutput,
        marksAwarded: task.marks || 10,
        status: 'COMPLETED',
        completedAt: new Date()
      },
      { upsert: true, new: true }
    );

    // Award XP to student profile
    await StudentProfile.findOneAndUpdate(
      { userId: studentId },
      { $inc: { totalXp: 15, 'stats.challengesSolved': 1 } }
    );

    // Count updated submissions for this concept
    const totalConceptTasks = await ConceptTask.countDocuments({ conceptId: task.conceptId, status: 'ACTIVE' });
    const completedConceptTasks = await ConceptTaskSubmission.countDocuments({
      studentId,
      conceptId: task.conceptId,
      status: 'COMPLETED'
    });
    const percentage = totalConceptTasks > 0 ? Math.round((completedConceptTasks / totalConceptTasks) * 100) : 100;

    return res.json({
      success: true,
      message: `✓ Task "${task.taskId}" completed successfully!`,
      data: {
        submission,
        conceptProgress: {
          completed: completedConceptTasks,
          total: totalConceptTasks,
          percentage
        }
      }
    });
  } catch (error) {
    console.error('submitConceptTask error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/lms/attendance/:sessionId/absence-reason
// Student submits absence reason
exports.submitAbsenceReason = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { reason, description } = req.body;
    const studentId = req.user._id;

    const allowedReasons = [
      'Medical Leave',
      'Personal Reason',
      'College Work',
      'Travel',
      'Emergency',
      'Technical Issue',
      'Other'
    ];

    if (!allowedReasons.includes(reason)) {
      return res.status(400).json({
        success: false,
        message: `Reason must be one of: ${allowedReasons.join(', ')}`
      });
    }

    if (reason === 'Other' && (!description || !description.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Reason Description is required when selecting "Other".'
      });
    }

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Class session not found.' });
    }

    // Update Session attendance array
    const recIndex = session.attendance.findIndex(a => a.studentId.toString() === studentId.toString());
    if (recIndex >= 0) {
      session.attendance[recIndex].absenceReason = reason;
      session.attendance[recIndex].absenceDescription = description ? description.trim() : '';
      session.attendance[recIndex].absenceSubmittedAt = new Date();
    } else {
      session.attendance.push({
        studentId,
        status: 'ABSENT',
        absenceReason: reason,
        absenceDescription: description ? description.trim() : '',
        absenceSubmittedAt: new Date()
      });
    }

    await session.save();

    // Also update Attendance record
    await Attendance.findOneAndUpdate(
      { sessionId: session._id, userId: studentId },
      {
        date: session.scheduledDate,
        userId: studentId,
        sessionId: session._id,
        status: 'Absent',
        absenceReason: reason,
        absenceDescription: description ? description.trim() : '',
        absenceSubmittedAt: new Date()
      },
      { upsert: true, new: true }
    );

    return res.json({
      success: true,
      message: 'Absence reason submitted successfully. Recorded for tutor and administration.',
      data: {
        sessionId,
        reason,
        description
      }
    });
  } catch (error) {
    console.error('submitAbsenceReason error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/lms/leave-requests
// Student submits pre-class leave request
exports.submitLeaveRequest = async (req, res) => {
  try {
    const { sessionId, reason, description } = req.body;
    const studentId = req.user._id;

    if (!sessionId || !reason) {
      return res.status(400).json({ success: false, message: 'Class and reason are required.' });
    }

    if (reason === 'Other' && (!description || !description.trim())) {
      return res.status(400).json({ success: false, message: 'Reason description is required for "Other".' });
    }

    const leaveRequest = await LeaveRequest.create({
      studentId,
      sessionId,
      reason,
      description: description ? description.trim() : '',
      status: 'PENDING'
    });

    return res.status(201).json({
      success: true,
      message: 'Leave request submitted successfully. Awaiting approval from Admin/Tutor.',
      data: leaveRequest
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/lms/admin/students/:id
// Admin deletes student profile, account, and associated LMS data
exports.adminDeleteStudent = async (req, res) => {
  try {
    const { id } = req.params; // Can be StudentProfile _id OR User _id

    let profile = await StudentProfile.findById(id);
    if (!profile) {
      profile = await StudentProfile.findOne({ userId: id });
    }

    let userId = profile ? profile.userId : id;
    const user = await User.findById(userId);

    if (!user) {
      if (profile) await StudentProfile.findByIdAndDelete(profile._id);
      return res.json({ success: true, message: 'Student record removed.' });
    }

    // Protection: College Training only students must never be deleted from LMS Management
    if (user.studentType === 'COLLEGE_TRAINING' || user.studentType === 'INSTITUTE_TRAINING') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a College Training student from LMS Management. Please manage college students under Batches & Colleges.'
      });
    }

    // If student is BOTH: only delete LMS profile and downgrade to COLLEGE_TRAINING (preserving college records)
    if (user.studentType === 'BOTH') {
      if (profile) await StudentProfile.findByIdAndDelete(profile._id);
      user.studentType = 'COLLEGE_TRAINING';
      await user.save();
      return res.json({
        success: true,
        message: `Student ${user.name} removed from LMS Institute courses. College Training records preserved.`
      });
    }

    // If student is LMS only: delete profile and user
    if (profile) {
      await StudentProfile.findByIdAndDelete(profile._id);
    }
    await User.findByIdAndDelete(user._id);

    // Cleanup associated student LMS records
    await Promise.all([
      Attendance.deleteMany({ userId: user._id }),
      Notification.deleteMany({ userId: user._id }),
      LeaveRequest.deleteMany({ studentId: user._id }),
      ConceptTaskSubmission.deleteMany({ studentId: user._id })
    ]).catch(err => console.warn('Student cleanup warning:', err.message));

    return res.json({
      success: true,
      message: `LMS Student ${user.name} (${user.studentId || 'ID'}) and associated records deleted successfully.`
    });
  } catch (error) {
    console.error('adminDeleteStudent error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Error deleting student account.' });
  }
};

// PUT /api/lms/admin/students/:id
// Admin updates existing student profile & account details
exports.adminUpdateStudent = async (req, res) => {
  try {
    const { id } = req.params; // Can be StudentProfile _id or User _id
    const {
      name,
      username,
      email,
      password,
      studentId,
      courseId,
      tutorId,
      learningMode,
      phone
    } = req.body;

    let profile = await StudentProfile.findById(id);
    if (!profile) {
      profile = await StudentProfile.findOne({ userId: id });
    }

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const user = await User.findById(profile.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Associated student user account not found.' });
    }

    // Ensure student is an LMS student
    if (user.studentType !== 'LMS' && user.studentType !== 'BOTH') {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit a College Training student in LMS Management.'
      });
    }

    const normStudentId = studentId ? studentId.trim().toUpperCase() : user.studentId;
    const normEmail = email ? email.trim().toLowerCase() : user.email;
    const normUsername = username ? username.trim().toLowerCase() : user.username;

    // Check duplicate studentId, email, or username against other users
    const duplicateUser = await User.findOne({
      _id: { $ne: user._id },
      $or: [
        ...(normEmail ? [{ email: normEmail }] : []),
        ...(normUsername ? [{ username: normUsername }] : []),
        ...(normStudentId ? [{ studentId: normStudentId }] : [])
      ]
    });

    if (duplicateUser) {
      if (duplicateUser.studentId === normStudentId) {
        return res.status(400).json({ success: false, message: `Student ID "${normStudentId}" is already assigned to another student (${duplicateUser.name}).` });
      }
      if (duplicateUser.email === normEmail) {
        return res.status(400).json({ success: false, message: `Email "${normEmail}" is already registered to another user (${duplicateUser.name}).` });
      }
      if (duplicateUser.username === normUsername) {
        return res.status(400).json({ success: false, message: `Username "${normUsername}" is already registered to another user (${duplicateUser.name}).` });
      }
    }

    // Update User fields
    if (name) user.name = name.trim();
    if (normEmail) user.email = normEmail;
    if (normUsername) user.username = normUsername;
    if (normStudentId) user.studentId = normStudentId;
    if (phone !== undefined) user.phone = phone ? phone.trim() : '';
    if (password && password.trim() && password !== 'NOT_REQUIRED') {
      user.password = password.trim();
    }
    await user.save();

    // Update StudentProfile fields
    if (normStudentId) profile.studentId = normStudentId;
    if (learningMode) profile.learningMode = (learningMode === 'OFFLINE' ? 'OFFLINE' : 'ONLINE');
    if (courseId !== undefined) profile.enrolledCourseId = courseId || null;
    if (tutorId !== undefined) profile.assignedTutorId = tutorId || null;
    if (req.body.monthlyFee !== undefined && !isNaN(Number(req.body.monthlyFee)) && Number(req.body.monthlyFee) >= 0) {
      const updatedFee = Number(req.body.monthlyFee);
      profile.monthlyFee = updatedFee;
      // Sync active fee plans
      await FeePlan.updateMany(
        { studentId: user._id, status: 'Active' },
        { monthlyInstallmentAmount: updatedFee, isDummy: false }
      );
      // Sync pending installments
      await MonthlyInstallment.updateMany(
        { studentId: user._id, status: { $in: ['Pending', 'Unpaid'] } },
        { principalAmount: updatedFee, isDummy: false }
      );
    }
    await profile.save();

    const populatedProfile = await StudentProfile.findById(profile._id)
      .populate('userId', 'name email username studentId phone avatar isActive')
      .populate('enrolledCourseId')
      .populate('assignedTutorId', 'name email');

    return res.json({
      success: true,
      message: `Student details for ${user.name} (${user.studentId}) updated successfully.`,
      data: populatedProfile
    });
  } catch (error) {
    console.error('adminUpdateStudent error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Error updating student details.' });
  }
};

exports.ensureStudentFeePlanAndInstallment = ensureStudentFeePlanAndInstallment;
