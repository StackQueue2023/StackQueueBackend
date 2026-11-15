const TrainingTaskAssignment = require('../models/TrainingTaskAssignment');
const TrainingDailyPerformance = require('../models/TrainingDailyPerformance');
const TrainingWeeklySummary = require('../models/TrainingWeeklySummary');
const StudentAttendance = require('../models/StudentAttendance');
const StudentProfile = require('../models/StudentProfile');
const Batch = require('../models/Batch');
const College = require('../models/College');
const User = require('../models/User');

function toDateStr(d = new Date()) {
  if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  const dateObj = new Date(d);
  // Format in Asia/Kolkata to align with local Indian training schedules
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(dateObj);
  const y = parts.find((p) => p.type === 'year')?.value;
  const m = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;
  return `${y}-${m}-${day}`;
}

function getDayRangeUtc(dateStr) {
  // Cover full IST day in UTC (IST is UTC+5:30)
  const start = new Date(`${dateStr}T00:00:00+05:30`);
  const end = new Date(`${dateStr}T23:59:59.999+05:30`);
  return { start, end };
}

function getMondaySundayRange(refDateStr) {
  const baseStr = toDateStr(refDateStr || new Date());
  const d = new Date(`${baseStr}T12:00:00Z`);
  const day = d.getUTCDay(); // 0=Sun, 1=Mon, ...
  const diffToMon = day === 0 ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setUTCDate(d.getUTCDate() + diffToMon);
  const sun = new Date(mon);
  sun.setUTCDate(mon.getUTCDate() + 6);
  return {
    weekStart: mon.toISOString().slice(0, 10),
    weekEnd: sun.toISOString().slice(0, 10),
  };
}

function roundPct(num, den) {
  if (!den || den <= 0) return 0;
  return Math.round((num / den) * 10000) / 100;
}

function normalizeAttendanceStatus(status) {
  if (!status) return 'unmarked';
  const s = String(status).toLowerCase();
  if (s === 'present') return 'present';
  if (s === 'absent') return 'absent';
  return 'unmarked';
}

async function resolveStudentBatch(studentId, explicitBatchId = null) {
  if (explicitBatchId) {
    const b = await Batch.findById(explicitBatchId).lean();
    if (b) return b;
  }
  const batch = await Batch.findOne({ studentIds: studentId })
    .sort({ createdAt: -1 })
    .lean();
  return batch || null;
}

/**
 * Recomputes and upserts TrainingDailyPerformance for a student on a given YYYY-MM-DD date.
 */
async function syncStudentDailyPerformance(studentId, batchId = null, dateStr = null) {
  const targetDate = toDateStr(dateStr || new Date());
  const batch = await resolveStudentBatch(studentId, batchId);
  const effectiveBatchId = batch?._id || batchId || null;

  let collegeId = batch?.collegeId || null;
  if (!collegeId) {
    const profile = await StudentProfile.findOne({ userId: studentId }).select('collegeId').lean();
    collegeId = profile?.collegeId || null;
  }

  const attendanceFilter = { studentId, date: targetDate };
  if (effectiveBatchId) attendanceFilter.batchId = effectiveBatchId;
  let att = await StudentAttendance.findOne(attendanceFilter).lean();
  if (!att && effectiveBatchId) {
    att = await StudentAttendance.findOne({ studentId, date: targetDate }).lean();
  }
  const attendanceStatus = normalizeAttendanceStatus(att?.status);

  const { start, end } = getDayRangeUtc(targetDate);
  const taskFilter = {
    studentId,
    $or: [
      { assignedDate: { $gte: start, $lte: end } },
      { completedAt: { $gte: start, $lte: end } },
    ],
  };
  if (effectiveBatchId) {
    taskFilter.batchId = effectiveBatchId;
  }

  const tasks = await TrainingTaskAssignment.find(taskFilter).lean();
  // Only count tasks assigned on that date or completed on that date
  const assignedTasks = tasks.filter((t) => toDateStr(t.assignedDate) === targetDate);
  const completedTasks = tasks.filter(
    (t) =>
      t.status === 'completed' &&
      (toDateStr(t.assignedDate) === targetDate || (t.completedAt && toDateStr(t.completedAt) === targetDate))
  );

  // Use assignedTasks count as denominator; if tasks were completed from earlier days on this day without new assignments, avoid >100%
  const tasksAssigned = assignedTasks.length;
  const tasksCompletedOnDay = assignedTasks.filter((t) => t.status === 'completed').length;
  const tasksCompleted = tasksAssigned > 0 ? tasksCompletedOnDay : completedTasks.length;
  const tasksPending = Math.max(0, tasksAssigned - tasksCompletedOnDay);
  const taskCompletionPercent = tasksAssigned > 0 ? roundPct(tasksCompletedOnDay, tasksAssigned) : tasksCompleted > 0 ? 100 : 0;

  if (!effectiveBatchId) {
    return {
      studentId,
      batchId: null,
      collegeId,
      date: targetDate,
      attendanceStatus,
      tasksAssigned,
      tasksCompleted,
      tasksPending,
      taskCompletionPercent,
    };
  }

  const doc = await TrainingDailyPerformance.findOneAndUpdate(
    { studentId, batchId: effectiveBatchId, date: targetDate },
    {
      $set: {
        collegeId,
        attendanceStatus,
        assignedTasksCount: tasksAssigned,
        completedTasksCount: tasksCompleted,
        pendingTasksCount: tasksPending,
        dailyCompletionPercent: taskCompletionPercent,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  return doc;
}

/**
 * Temporary Student Individual Dashboard payload.
 * Unassigned tasks are NEVER counted as pending.
 */
async function getTemporaryStudentDashboard(studentId) {
  const [user, profile, batch, allTasks, allAttendance, dailyRecords] = await Promise.all([
    User.findById(studentId).select('name email studentCategory studentType').lean(),
    StudentProfile.findOne({ userId: studentId }).lean(),
    Batch.findOne({ studentIds: studentId }).sort({ createdAt: -1 }).lean(),
    TrainingTaskAssignment.find({ studentId }).sort({ assignedDate: -1, createdAt: -1 }).lean(),
    StudentAttendance.find({ studentId }).sort({ date: -1 }).lean(),
    TrainingDailyPerformance.find({ studentId }).sort({ date: -1 }).lean(),
  ]);

  if (!user) {
    const err = new Error('Student not found');
    err.status = 404;
    throw err;
  }

  const collegeId = batch?.collegeId || profile?.collegeId || null;
  const college = collegeId ? await College.findById(collegeId).lean() : null;

  const totalTasksAssigned = allTasks.length;
  const totalTasksCompleted = allTasks.filter((t) => t.status === 'completed').length;
  const totalTasksPending = Math.max(0, totalTasksAssigned - totalTasksCompleted);
  const taskCompletionPercent = roundPct(totalTasksCompleted, totalTasksAssigned);

  const daysPresent = allAttendance.filter((a) => normalizeAttendanceStatus(a.status) === 'present').length;
  const daysAbsent = allAttendance.filter((a) => normalizeAttendanceStatus(a.status) === 'absent').length;
  const totalTrainingDays = allAttendance.length;
  const attendanceDenominator = Math.max(totalTrainingDays, allAttendance.length);
  const attendancePercent = roundPct(daysPresent, attendanceDenominator);

  // Overall Training Completion % = weighted/combined or task completion when tasks exist
  const overallTrainingCompletionPercent =
    totalTasksAssigned > 0 && attendanceDenominator > 0
      ? Math.round(((taskCompletionPercent + attendancePercent) / 2) * 100) / 100
      : totalTasksAssigned > 0
      ? taskCompletionPercent
      : attendancePercent;

  // Build daily performance rows grouped by date from actual tasks & attendance
  const dateSet = new Set();
  allTasks.forEach((t) => dateSet.add(toDateStr(t.assignedDate)));
  allAttendance.forEach((a) => dateSet.add(a.date));
  dailyRecords.forEach((r) => dateSet.add(r.date));

  const dailyPerformance = Array.from(dateSet)
    .sort((a, b) => b.localeCompare(a))
    .map((dateStr) => {
      const dayTasks = allTasks.filter((t) => toDateStr(t.assignedDate) === dateStr);
      const assigned = dayTasks.length;
      const completed = dayTasks.filter((t) => t.status === 'completed').length;
      const pending = Math.max(0, assigned - completed);
      const att = allAttendance.find((a) => a.date === dateStr);
      return {
        date: dateStr,
        studentName: user.name,
        tasksAssigned: assigned,
        tasksCompleted: completed,
        tasksPending: pending,
        taskCompletionPercent: roundPct(completed, assigned),
        attendanceStatus: normalizeAttendanceStatus(att?.status),
      };
    });

  return {
    student: {
      id: String(user._id),
      name: user.name,
      email: user.email,
      studentCategory: user.studentCategory || 'TRAINING_TEMPORARY',
      collegeName: college?.name || profile?.collegeName || 'N/A',
      department: profile?.department || batch?.department || 'N/A',
      year: profile?.academicYear || profile?.year || batch?.academicYear || 'N/A',
      trainingName: profile?.trainingName || batch?.batchName || batch?.name || 'Training Program',
      trainingDomain: profile?.trainingDomain || batch?.domain || 'General Training',
      startDate: profile?.trainingStartDate || batch?.startDate || null,
      endDate: profile?.trainingEndDate || batch?.endDate || null,
      batchId: batch ? String(batch._id) : null,
      batchName: batch?.batchName || batch?.name || null,
    },
    metrics: {
      totalTasksAssigned,
      tasksCompleted: totalTasksCompleted,
      tasksPending: totalTasksPending,
      taskCompletionPercent,
      daysPresent,
      daysAbsent,
      totalTrainingDays: attendanceDenominator,
      attendancePercent,
      overallTrainingCompletionPercent,
    },
    tasks: allTasks.map((t) => ({
      id: String(t._id),
      title: t.title,
      description: t.description,
      domain: t.domain,
      assignedDate: t.assignedDate,
      dueDate: t.dueDate,
      status: t.status,
      completedAt: t.completedAt,
      points: t.points,
    })),
    dailyPerformance,
  };
}

/**
 * Overall Batch / College Performance Dashboard for Admin & Trainers.
 * Integrates directly with Batches & Colleges database records.
 */
async function getOverallTrainingBatchPerformance({ batchId = null, collegeId = null, date = null } = {}) {
  const targetDate = toDateStr(date || new Date());

  // 1. Fetch colleges & college training batches directly from database
  const [colleges, allBatches] = await Promise.all([
    College.find({ isActive: { $ne: false } }).select('name code city hodName hodEmail placementOfficerName placementOfficerEmail').lean(),
    Batch.find({ batchType: 'COLLEGE_TRAINING' })
      .select('name code collegeId department academicYear startDate endDate trainingDays hodName hodEmail placementOfficeEmail studentIds')
      .lean()
  ]);

  const collegeMap = new Map(colleges.map((c) => [String(c._id), c]));

  let batch = null;
  if (batchId) {
    batch = allBatches.find((b) => String(b._id) === String(batchId)) || (await Batch.findById(batchId).lean());
  }

  // 2. Resolve Target Student IDs directly from the selected batch or college
  let targetStudentIds = [];
  if (batch) {
    targetStudentIds = (batch.studentIds || []).map((id) => String(id));
  } else if (collegeId) {
    const collegeBatches = allBatches.filter((b) => b.collegeId && String(b.collegeId) === String(collegeId));
    const set = new Set();
    collegeBatches.forEach((b) => (b.studentIds || []).forEach((id) => set.add(String(id))));
    targetStudentIds = Array.from(set);
  } else {
    // All College Training Batches
    const set = new Set();
    allBatches.forEach((b) => (b.studentIds || []).forEach((id) => set.add(String(id))));
    const extraUsers = await User.find({
      role: 'student',
      $or: [{ studentType: 'COLLEGE_TRAINING' }, { studentType: 'TRAINING_TEMPORARY' }, { studentCategory: 'TRAINING_TEMPORARY' }]
    }).select('_id').lean();
    extraUsers.forEach((u) => set.add(String(u._id)));
    targetStudentIds = Array.from(set);
  }

  // 3. Fetch User details & profiles for target students
  const targetUsers = await User.find({ _id: { $in: targetStudentIds } })
    .select('_id name email username rollNo department studentType studentCategory')
    .lean();
  const userMap = new Map(targetUsers.map((u) => [String(u._id), u]));

  const profiles = await StudentProfile.find({ userId: { $in: targetStudentIds } }).lean();
  const profileMap = new Map(profiles.map((p) => [String(p.userId), p]));

  // 4. Fetch tasks and attendance for target students
  const [allTasks, allAttendance] = await Promise.all([
    TrainingTaskAssignment.find({
      studentId: { $in: targetStudentIds },
      ...(batchId ? { batchId } : {}),
    }).lean(),
    StudentAttendance.find({
      studentId: { $in: targetStudentIds },
      ...(batchId ? { batchId } : {}),
    }).lean(),
  ]);

  let presentToday = 0;
  let absentToday = 0;
  let totalTasksAssigned = 0;
  let totalTasksCompleted = 0;
  let totalPresentDays = 0;
  let totalAttendanceRecords = 0;

  const studentRows = targetStudentIds.map((id) => {
    const sid = String(id);
    const u = userMap.get(sid);
    const p = profileMap.get(sid);
    const sBatch = batch || allBatches.find((b) => (b.studentIds || []).some((bid) => String(bid) === sid));
    const sCollege = collegeMap.get(String(p?.collegeId || sBatch?.collegeId || ''));

    const sTasks = allTasks.filter((t) => String(t.studentId) === sid);
    const assigned = sTasks.length;
    const completed = sTasks.filter((t) => t.status === 'completed').length;
    const pending = Math.max(0, assigned - completed);
    const taskPct = roundPct(completed, assigned);

    const sAtt = allAttendance.filter((a) => String(a.studentId) === sid);
    const todayAtt = sAtt.find((a) => a.date === targetDate);
    const todayStatus = normalizeAttendanceStatus(todayAtt?.status);
    if (todayStatus === 'present') presentToday += 1;
    else if (todayStatus === 'absent') absentToday += 1;

    const presentDays = sAtt.filter((a) => normalizeAttendanceStatus(a.status) === 'present').length;
    const attDenom = sAtt.length;
    const attPct = roundPct(presentDays, attDenom);

    totalTasksAssigned += assigned;
    totalTasksCompleted += completed;
    totalPresentDays += presentDays;
    totalAttendanceRecords += attDenom;

    return {
      studentId: sid,
      name: u?.name || 'Unknown',
      email: u?.email || '',
      collegeName: sCollege?.name || 'N/A',
      department: p?.department || sBatch?.department || u?.department || 'N/A',
      year: p?.academicYear || p?.year || sBatch?.academicYear || 'N/A',
      trainingName: p?.trainingName || sBatch?.batchName || sBatch?.name || 'Training',
      trainingDomain: p?.trainingDomain || 'General',
      batchId: sBatch ? String(sBatch._id) : null,
      batchName: sBatch?.batchName || sBatch?.name || 'Unassigned',
      todayAttendance: todayStatus,
      daysPresent: presentDays,
      totalDays: attDenom,
      attendancePercent: attPct,
      tasksAssigned: assigned,
      tasksCompleted: completed,
      tasksPending: pending,
      taskCompletionPercent: taskPct,
      completedAllTasks: assigned > 0 && pending === 0,
    };
  });

  const totalTemporaryStudents = studentRows.length;
  const totalTasksPending = Math.max(0, totalTasksAssigned - totalTasksCompleted);
  const overallTaskCompletionPercent = roundPct(totalTasksCompleted, totalTasksAssigned);
  const overallAttendancePercent = roundPct(totalPresentDays, totalAttendanceRecords);

  const topPerformingStudents = [...studentRows]
    .filter((r) => r.tasksAssigned > 0 || r.totalDays > 0)
    .sort((a, b) => b.taskCompletionPercent - a.taskCompletionPercent || b.attendancePercent - a.attendancePercent)
    .slice(0, 10);

  const completedAllStudents = studentRows.filter((r) => r.completedAllTasks);
  const pendingTaskStudents = studentRows.filter((r) => r.tasksPending > 0);

  return {
    date: targetDate,
    batch: batch
      ? {
          id: String(batch._id),
          name: batch.batchName || batch.name,
          department: batch.department,
          academicYear: batch.academicYear,
          startDate: batch.startDate,
          endDate: batch.endDate,
          hodEmail: batch.hodEmail || collegeMap.get(String(batch.collegeId || ''))?.hodEmail || '',
          placementOfficeEmail:
            batch.placementOfficeEmail || collegeMap.get(String(batch.collegeId || ''))?.placementOfficerEmail || '',
        }
      : null,
    summary: {
      totalTemporaryStudents,
      presentToday,
      absentToday,
      unmarkedToday: Math.max(0, totalTemporaryStudents - presentToday - absentToday),
      overallAttendancePercent,
      totalTasksAssigned,
      totalTasksCompleted,
      totalTasksPending,
      overallTaskCompletionPercent,
      completedAllCount: completedAllStudents.length,
    },
    topPerformingStudents,
    completedAllStudents,
    pendingTaskStudents,
    students: studentRows,
    availableBatches: allBatches.map((b) => ({
      id: String(b._id),
      name: b.batchName || b.name,
      collegeId: b.collegeId ? String(b.collegeId) : null,
      department: b.department,
    })),
    availableColleges: colleges.map((c) => ({
      id: String(c._id),
      name: c.name,
      hodEmail: c.hodEmail || '',
      placementOfficerEmail: c.placementOfficerEmail || '',
    })),
  };
}

/**
 * Computes Monday-Sunday Weekly Summary from actual weekly assigned & completed counts
 * (NEVER sums daily percentages). Upserts TrainingWeeklySummary.
 */
async function computeAndSaveWeeklySummary(batchId, weekStartStr = null, weekEndStr = null) {
  const batch = await Batch.findById(batchId).lean();
  if (!batch) {
    const err = new Error('Batch not found');
    err.status = 404;
    throw err;
  }

  const range =
    weekStartStr && weekEndStr
      ? { weekStart: toDateStr(weekStartStr), weekEnd: toDateStr(weekEndStr) }
      : getMondaySundayRange(new Date());

  const tempUsers = await User.find({
    _id: { $in: batch.studentIds || [] },
    role: 'student'
  })
    .select('_id name email')
    .lean();

  const tempIds = tempUsers.map((u) => u._id);
  const { start } = getDayRangeUtc(range.weekStart);
  const { end } = getDayRangeUtc(range.weekEnd);

  const [weekTasks, weekAttendance] = await Promise.all([
    TrainingTaskAssignment.find({
      studentId: { $in: tempIds },
      batchId,
      $or: [
        { assignedDate: { $gte: range.weekStart, $lte: range.weekEnd } },
        { assignedDate: { $gte: start, $lte: end } }
      ]
    }).lean(),
    StudentAttendance.find({
      studentId: { $in: tempIds },
      date: { $gte: range.weekStart, $lte: range.weekEnd },
    }).lean(),
  ]);

  let totalTasksAssigned = 0;
  let totalTasksCompleted = 0;
  let totalPresentDays = 0;
  let totalAttRecords = 0;

  const studentRows = tempUsers.map((u) => {
    const sid = String(u._id);
    const sTasks = weekTasks.filter((t) => String(t.studentId) === sid);
    const assigned = sTasks.length;
    const completed = sTasks.filter((t) => t.status === 'completed').length;
    const pending = Math.max(0, assigned - completed);
    const taskPct = roundPct(completed, assigned);

    const sAtt = weekAttendance.filter((a) => String(a.studentId) === sid);
    const present = sAtt.filter((a) => normalizeAttendanceStatus(a.status) === 'present').length;
    const attPct = roundPct(present, sAtt.length);

    totalTasksAssigned += assigned;
    totalTasksCompleted += completed;
    totalPresentDays += present;
    totalAttRecords += sAtt.length;

    return {
      studentId: u._id,
      name: u.name,
      email: u.email,
      daysPresent: present,
      totalDays: sAtt.length,
      attendancePercent: attPct,
      tasksAssigned: assigned,
      tasksCompleted: completed,
      tasksPending: pending,
      completionPercent: taskPct,
    };
  });

  const totalTasksPending = Math.max(0, totalTasksAssigned - totalTasksCompleted);
  const overallTaskCompletionPercent = roundPct(totalTasksCompleted, totalTasksAssigned);
  const avgAttendancePercent = roundPct(totalPresentDays, totalAttRecords);

  const topPerformers = [...studentRows]
    .filter((r) => r.tasksAssigned > 0 || r.attendancePercent > 0)
    .sort((a, b) => b.completionPercent - a.completionPercent || b.attendancePercent - a.attendancePercent)
    .slice(0, 5)
    .map((r) => ({
      name: r.name,
      completionPercent: r.completionPercent,
      attendancePercent: r.attendancePercent,
    }));

  const completedAllStudents = studentRows
    .filter((r) => r.tasksAssigned > 0 && r.tasksPending === 0)
    .map((r) => r.name);

  const pendingStudents = studentRows
    .filter((r) => r.tasksPending > 0)
    .map((r) => r.name);

  const summaryDoc = await TrainingWeeklySummary.findOneAndUpdate(
    { batchId, weekStart: range.weekStart, weekEnd: range.weekEnd },
    {
      $set: {
        collegeId: batch.collegeId || null,
        totalStudents: tempUsers.length,
        weeklyAttendancePercent: avgAttendancePercent,
        totalTasksAssigned,
        totalTasksCompleted,
        totalTasksPending,
        weeklyCompletionPercent: overallTaskCompletionPercent,
        topPerformers,
        completedAllStudents,
        pendingStudents,
        studentBreakdown: studentRows,
        generatedAt: new Date(),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  return summaryDoc;
}

module.exports = {
  toDateStr,
  getMondaySundayRange,
  syncStudentDailyPerformance,
  getTemporaryStudentDashboard,
  getOverallTrainingBatchPerformance,
  computeAndSaveWeeklySummary,
};
