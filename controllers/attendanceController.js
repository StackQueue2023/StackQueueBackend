const StudentAttendance = require('../models/StudentAttendance');
const TutorAttendance = require('../models/TutorAttendance');
const StudentLeave = require('../models/StudentLeave');
const StudentProfile = require('../models/StudentProfile');
const User = require('../models/User');
const Batch = require('../models/Batch');

/**
 * 1. GET /api/attendance/tutor-students
 * Fetch tutor's assigned students along with their attendance & leave status for a target date.
 */
exports.getTutorStudentsAttendance = async (req, res) => {
  try {
    const tutorId = req.user._id;
    const targetDate = req.query.date || new Date().toISOString().split('T')[0];

    // Find assigned students for this tutor
    let studentProfiles = await StudentProfile.find({
      $or: [
        { assignedTutorId: tutorId },
        { assignedTutor: tutorId }
      ]
    })
      .populate('userId', 'name email role studentId department year batch')
      .populate('batchId', 'name code department');

    let studentUsers = studentProfiles.map(sp => sp.userId).filter(Boolean);

    // Also include students from batches assigned to this tutor
    const assignedBatches = await Batch.find({ trainerId: tutorId }).populate('studentIds', 'name email role studentId');
    const existingIds = new Set(studentUsers.map(s => s._id.toString()));
    assignedBatches.forEach(b => {
      (b.studentIds || []).forEach(st => {
        if (!existingIds.has(st._id.toString())) {
          existingIds.add(st._id.toString());
          studentUsers.push(st);
        }
      });
    });

    const studentIds = studentUsers.map(s => s._id);

    // Fetch attendance records for target date
    const attendanceRecords = await StudentAttendance.find({
      date: targetDate,
      studentId: { $in: studentIds }
    });

    const attendanceMap = new Map();
    attendanceRecords.forEach(rec => {
      attendanceMap.set(rec.studentId.toString(), rec.status);
    });

    // Fetch approved leaves for target date
    const leaveRecords = await StudentLeave.find({
      leaveDate: targetDate,
      studentId: { $in: studentIds },
      status: 'Approved'
    });

    const leaveSet = new Set(leaveRecords.map(l => l.studentId.toString()));

    // Build response array
    const studentList = studentUsers.map(st => {
      const stIdStr = st._id.toString();
      let status = attendanceMap.get(stIdStr);

      if (!status) {
        if (leaveSet.has(stIdStr)) {
          status = 'Leave';
        } else {
          status = 'Present'; // default initial view
        }
      }

      return {
        _id: st._id,
        name: st.name,
        email: st.email,
        studentId: st.studentId || 'STU-' + st._id.toString().slice(-4).toUpperCase(),
        department: st.department || 'Computer Science',
        year: st.year || '3rd Year',
        batch: st.batch || 'JFS-2026-A',
        attendanceDate: targetDate,
        status
      };
    });

    // Summary counts
    const totalStudents = studentList.length;
    const presentCount = studentList.filter(s => s.status === 'Present').length;
    const absentCount = studentList.filter(s => s.status === 'Absent').length;
    const leaveCount = studentList.filter(s => s.status === 'Leave').length;

    return res.json({
      success: true,
      data: {
        date: targetDate,
        summary: {
          totalStudents,
          presentCount,
          absentCount,
          leaveCount
        },
        students: studentList
      }
    });
  } catch (error) {
    console.error('getTutorStudentsAttendance error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 2. POST /api/attendance/student-mark
 * Mark or update date-wise student attendance records.
 */
exports.markStudentAttendance = async (req, res) => {
  try {
    const { date, records } = req.body;
    const tutorId = req.user._id;

    if (!date || !records || !Array.isArray(records)) {
      return res.status(400).json({ success: false, message: 'Date and records array are required.' });
    }

    const results = [];
    for (const item of records) {
      const updated = await StudentAttendance.findOneAndUpdate(
        { date, studentId: item.studentId },
        {
          date,
          studentId: item.studentId,
          tutorId,
          batchId: item.batchId || null,
          status: item.status || 'Present',
          markedBy: tutorId
        },
        { upsert: true, new: true }
      );
      results.push(updated);
    }

    return res.json({
      success: true,
      message: `Successfully saved attendance for ${results.length} students on ${date}.`,
      updatedCount: results.length
    });
  } catch (error) {
    console.error('markStudentAttendance error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 3. GET /api/attendance/leave-requests
 * Fetch leave requests for tutor's assigned students or all.
 */
exports.getStudentLeaveRequests = async (req, res) => {
  try {
    let query = {};
    if (req.user && (req.user.role === 'trainer' || req.user.role === 'tutor')) {
      const assignedProfiles = await StudentProfile.find({
        $or: [
          { assignedTutorId: req.user._id },
          { assignedTutor: req.user._id }
        ]
      }).select('userId');
      const assignedBatches = await Batch.find({ trainerId: req.user._id }).select('studentIds');
      const studentUserIds = new Set(assignedProfiles.map(p => p.userId?.toString()).filter(Boolean));
      assignedBatches.forEach(b => {
        (b.studentIds || []).forEach(sId => studentUserIds.add(sId.toString()));
      });

      query = {
        $or: [
          { tutorId: req.user._id },
          { studentId: { $in: Array.from(studentUserIds) } },
          { tutorId: null }
        ]
      };
    }

    const leaves = await StudentLeave.find(query)
      .populate('studentId', 'name email studentId username phone')
      .populate('tutorId', 'name email')
      .populate('batchId', 'name code department academicYear')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: leaves
    });
  } catch (error) {
    console.error('getStudentLeaveRequests error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 4. POST /api/attendance/leave-requests/:id/approve
 * Tutor approves leave request - MUST include approvalReason!
 */
exports.approveStudentLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { approvalReason } = req.body;
    const tutorId = req.user._id;

    if (!approvalReason || typeof approvalReason !== 'string' || !approvalReason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Reason for granting leave is MANDATORY. Please provide a valid approval reason.'
      });
    }

    const leave = await StudentLeave.findById(id);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found.' });
    }

    leave.status = 'Approved';
    leave.approvedBy = tutorId;
    leave.approvalReason = approvalReason.trim();
    leave.approvedAt = new Date();
    await leave.save();

    // Auto-update student attendance to 'Leave' for that leaveDate
    await StudentAttendance.findOneAndUpdate(
      { date: leave.leaveDate, studentId: leave.studentId },
      {
        date: leave.leaveDate,
        studentId: leave.studentId,
        tutorId,
        status: 'Leave',
        markedBy: tutorId
      },
      { upsert: true, new: true }
    );

    return res.json({
      success: true,
      message: 'Leave request approved successfully.',
      data: leave
    });
  } catch (error) {
    console.error('approveStudentLeave error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 5. POST /api/attendance/leave-requests/:id/reject
 */
exports.rejectStudentLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    const tutorId = req.user._id;

    const leave = await StudentLeave.findById(id);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found.' });
    }

    leave.status = 'Rejected';
    leave.approvedBy = tutorId;
    leave.approvalReason = rejectionReason ? rejectionReason.trim() : 'Request rejected by tutor.';
    leave.approvedAt = new Date();
    await leave.save();

    return res.json({
      success: true,
      message: 'Leave request rejected.',
      data: leave
    });
  } catch (error) {
    console.error('rejectStudentLeave error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 6. POST /api/attendance/student-leave (Student submits leave request)
 */
exports.submitStudentLeave = async (req, res) => {
  try {
    const { leaveDate, leaveType, reason } = req.body;
    const studentId = req.user._id;

    if (!leaveDate || !reason) {
      return res.status(400).json({ success: false, message: 'Leave date and reason are required.' });
    }

    // Find assigned tutor & batch if exists
    const profile = await StudentProfile.findOne({ userId: studentId });
    let tutorId = profile?.assignedTutorId || profile?.assignedTutor || null;
    let batchId = profile?.batchId || null;

    if (!tutorId || !batchId) {
      const batch = await Batch.findOne({ studentIds: studentId });
      if (batch) {
        if (!batchId) batchId = batch._id;
        if (!tutorId) tutorId = batch.trainerId || null;
      }
    }

    const leave = await StudentLeave.create({
      studentId,
      tutorId,
      batchId,
      leaveDate,
      leaveType: leaveType || 'Full Day',
      reason: reason.trim(),
      status: 'Pending'
    });

    return res.json({
      success: true,
      message: 'Leave request submitted successfully.',
      data: leave
    });
  } catch (error) {
    console.error('submitStudentLeave error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 7. GET /api/attendance/my-leaves (Student)
 */
exports.getStudentLeaves = async (req, res) => {
  try {
    const leaves = await StudentLeave.find({ studentId: req.user._id })
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: leaves
    });
  } catch (error) {
    console.error('getStudentLeaves error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 8. GET /api/attendance/my-attendance (Student)
 */
exports.getStudentOwnAttendance = async (req, res) => {
  try {
    const records = await StudentAttendance.find({ studentId: req.user._id })
      .populate('markedBy', 'name')
      .sort({ date: -1 });

    const total = records.length;
    const present = records.filter(r => r.status === 'Present').length;
    const absent = records.filter(r => r.status === 'Absent').length;
    const leave = records.filter(r => r.status === 'Leave').length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 100;

    return res.json({
      success: true,
      data: {
        records,
        summary: { total, present, absent, leave, percentage }
      }
    });
  } catch (error) {
    console.error('getStudentOwnAttendance error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 9. GET /api/attendance/tutor-self
 */
exports.getTutorSelfAttendance = async (req, res) => {
  try {
    const tutorId = req.user._id;
    const records = await TutorAttendance.find({ tutorId })
      .sort({ date: -1 });

    const todayDate = new Date().toISOString().split('T')[0];
    const todayRecord = records.find(r => r.date === todayDate) || {
      date: todayDate,
      checkIn: '',
      checkOut: '',
      status: 'Present'
    };

    return res.json({
      success: true,
      data: {
        todayRecord,
        records
      }
    });
  } catch (error) {
    console.error('getTutorSelfAttendance error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 10. POST /api/attendance/tutor-self
 */
exports.markTutorSelfAttendance = async (req, res) => {
  try {
    const tutorId = req.user._id;
    const { date, checkIn, checkOut, status } = req.body;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const updated = await TutorAttendance.findOneAndUpdate(
      { tutorId, date: targetDate },
      {
        tutorId,
        date: targetDate,
        checkIn: checkIn || '',
        checkOut: checkOut || '',
        status: status || 'Present'
      },
      { upsert: true, new: true }
    );

    return res.json({
      success: true,
      message: 'Tutor attendance updated successfully.',
      data: updated
    });
  } catch (error) {
    console.error('markTutorSelfAttendance error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
