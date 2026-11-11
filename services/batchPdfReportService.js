const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const Batch = require('../models/Batch');
const StudentProfile = require('../models/StudentProfile');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const DailyTeachingUpdate = require('../models/DailyTeachingUpdate');
const BatchDailyReport = require('../models/BatchDailyReport');
const StudentTask = require('../models/StudentTask');
const XPTransaction = require('../models/XPTransaction');
const Course = require('../models/Course');

/**
 * Generate a PDF Daily Progress Report for a training batch on a specified date.
 * @param {string} batchId 
 * @param {string} dateStr YYYY-MM-DD
 * @returns {Promise<Object>} BatchDailyReport document
 */
exports.generateDailyReportPDF = async (batchId, dateStr) => {
  const dateObj = dateStr ? new Date(dateStr) : new Date();
  const todayStr = dateObj.toISOString().split('T')[0];

  const batch = await Batch.findById(batchId)
    .populate('collegeId', 'name city code')
    .populate('courseId', 'title code')
    .populate('trainerId', 'name email phone');

  if (!batch) {
    throw new Error(`Batch not found with ID ${batchId}`);
  }

  // Get tutor teaching update for today
  const teachingUpdate = await DailyTeachingUpdate.findOne({ batchId, date: todayStr });
  const topicCovered = teachingUpdate?.topicCovered || 'Daily Practical Training & Hands-on Coding Tasks';
  const practicalActivity = teachingUpdate?.practicalActivity || 'Lab sessions and domain task completion.';

  // Get students enrolled in this batch
  const studentProfiles = await StudentProfile.find({ batchId }).populate('userId', 'name username email studentId');
  const totalStudents = studentProfiles.length;

  // Get attendance for today
  const attendanceRecords = await Attendance.find({ batchId, date: todayStr });
  const attendanceMap = new Map();
  attendanceRecords.forEach(att => {
    attendanceMap.set(att.userId.toString(), att.status);
  });

  // Calculate start/end dates for today
  const dayStart = new Date(`${todayStr}T00:00:00.000Z`);
  const dayEnd = new Date(`${todayStr}T23:59:59.999Z`);

  let presentCount = 0;
  let absentCount = 0;
  let totalTasksCompletedToday = 0;
  let totalPointsEarnedToday = 0;

  const studentRows = [];

  for (const sp of studentProfiles) {
    if (!sp.userId) continue;
    const uId = sp.userId._id.toString();
    const attStatus = attendanceMap.get(uId) || 'Present';

    if (attStatus.toUpperCase() === 'PRESENT') {
      presentCount++;
    } else {
      absentCount++;
    }

    // Tasks completed today
    const tasksToday = await StudentTask.countDocuments({
      studentId: sp.userId._id,
      status: 'COMPLETED',
      updatedAt: { $gte: dayStart, $lte: dayEnd }
    });

    // Points earned today
    const xpAgg = await XPTransaction.aggregate([
      { $match: { userId: sp.userId._id, createdAt: { $gte: dayStart, $lte: dayEnd } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const pointsToday = xpAgg[0]?.total || 0;

    totalTasksCompletedToday += tasksToday;
    totalPointsEarnedToday += pointsToday;

    studentRows.push({
      studentId: sp.userId.studentId || sp.studentId || 'N/A',
      name: sp.userId.name || 'N/A',
      username: sp.userId.username || 'N/A',
      department: sp.department || batch.department || 'N/A',
      attendance: attStatus,
      tasksToday,
      pointsToday,
      totalPoints: sp.totalXp || 0
    });
  }

  const avgPointsToday = totalStudents > 0 ? Math.round(totalPointsEarnedToday / totalStudents) : 0;

  // Ensure output directory exists
  const reportsDir = path.join(__dirname, '../uploads/reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const fileName = `Batch_Report_${batch.code}_${todayStr}.pdf`;
  const pdfFilePath = path.join(reportsDir, fileName);
  const relativePdfPath = `/uploads/reports/${fileName}`;

  // Create PDF Document
  const doc = new PDFDocument({ margin: 36, size: 'A4' });
  const writeStream = fs.createWriteStream(pdfFilePath);
  doc.pipe(writeStream);

  // Header Banner
  doc.rect(0, 0, doc.page.width, 60).fill('#0f172a');
  doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold').text('DAILY TRAINING PROGRESS REPORT', 40, 20);
  doc.fillColor('#38bdf8').fontSize(10).font('Helvetica').text(`Generated On: ${todayStr}`, 400, 24, { align: 'right' });

  doc.moveDown(2);

  // Batch & Institution Overview Box
  const startY = 80;
  doc.rect(36, startY, 523, 90).lineWidth(1).strokeColor('#e2e8f0').fill('#f8fafc');

  doc.fillColor('#1e293b').fontSize(11).font('Helvetica-Bold').text('BATCH INFORMATION', 48, startY + 10);
  doc.fillColor('#475569').fontSize(9).font('Helvetica');

  doc.text(`College / Campus: ${batch.collegeId?.name || 'N/A'} (${batch.collegeId?.city || 'N/A'})`, 48, startY + 28);
  doc.text(`Batch Name & Code: ${batch.name} [ ${batch.code} ]`, 48, startY + 42);
  doc.text(`Academic Year & Dept: ${batch.academicYear} - ${batch.department}`, 48, startY + 56);
  doc.text(`Assigned Course: ${batch.courseId?.title || 'N/A'}`, 48, startY + 70);

  doc.text(`Assigned Tutor: ${batch.trainerId?.name || 'N/A'}`, 300, startY + 28);
  doc.text(`Training Hours: ${batch.startTime} - ${batch.endTime}`, 300, startY + 42);
  doc.text(`Daily Report Time: ${batch.dailyReportTime || '06:00 PM'}`, 300, startY + 56);
  doc.text(`Report Date: ${todayStr}`, 300, startY + 70);

  // Teaching Update Section
  const updateY = startY + 105;
  doc.rect(36, updateY, 523, 50).lineWidth(1).strokeColor('#cbd5e1').fill('#ffffff');
  doc.fillColor('#0369a1').fontSize(10).font('Helvetica-Bold').text('TODAY\'S TEACHING TOPIC & PRACTICAL ACTIVITY', 48, updateY + 8);
  doc.fillColor('#334155').fontSize(9).font('Helvetica');
  doc.text(`Topic Covered: ${topicCovered}`, 48, updateY + 22);
  doc.text(`Practical Activity: ${practicalActivity}`, 48, updateY + 34);

  // Stats Highlights
  const statsY = updateY + 60;
  const statBoxWidth = 120;
  
  // Total Students Box
  doc.rect(36, statsY, statBoxWidth, 40).fill('#e0f2fe');
  doc.fillColor('#0369a1').fontSize(8).font('Helvetica-Bold').text('TOTAL ENROLLED', 44, statsY + 6);
  doc.fontSize(14).text(`${totalStudents}`, 44, statsY + 18);

  // Present Box
  doc.rect(170, statsY, statBoxWidth, 40).fill('#dcfce7');
  doc.fillColor('#15803d').fontSize(8).font('Helvetica-Bold').text('PRESENT TODAY', 178, statsY + 6);
  doc.fontSize(14).text(`${presentCount}`, 178, statsY + 18);

  // Absent Box
  doc.rect(304, statsY, statBoxWidth, 40).fill('#fee2e2');
  doc.fillColor('#b91c1c').fontSize(8).font('Helvetica-Bold').text('ABSENT TODAY', 312, statsY + 6);
  doc.fontSize(14).text(`${absentCount}`, 312, statsY + 18);

  // Tasks Completed Box
  doc.rect(439, statsY, statBoxWidth, 40).fill('#fef3c7');
  doc.fillColor('#b45309').fontSize(8).font('Helvetica-Bold').text('TASKS DONE TODAY', 447, statsY + 6);
  doc.fontSize(14).text(`${totalTasksCompletedToday}`, 447, statsY + 18);

  // Student Attendance & Performance Table
  let tableY = statsY + 55;
  doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text('STUDENT PROGRESS ROSTER', 36, tableY);
  tableY += 15;

  // Table Headers
  doc.rect(36, tableY, 523, 20).fill('#1e293b');
  doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
  doc.text('STUDENT ID', 42, tableY + 6);
  doc.text('NAME', 110, tableY + 6);
  doc.text('USERNAME', 210, tableY + 6);
  doc.text('ATTENDANCE', 300, tableY + 6);
  doc.text('TASKS TODAY', 375, tableY + 6);
  doc.text('POINTS TODAY', 440, tableY + 6);
  doc.text('TOTAL POINTS', 500, tableY + 6);

  tableY += 20;

  doc.font('Helvetica').fontSize(8);
  for (let i = 0; i < studentRows.length; i++) {
    const row = studentRows[i];
    if (tableY > doc.page.height - 50) {
      doc.addPage({ margin: 36, size: 'A4' });
      tableY = 40;
      doc.rect(36, tableY, 523, 20).fill('#1e293b');
      doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
      doc.text('STUDENT ID', 42, tableY + 6);
      doc.text('NAME', 110, tableY + 6);
      doc.text('USERNAME', 210, tableY + 6);
      doc.text('ATTENDANCE', 300, tableY + 6);
      doc.text('TASKS TODAY', 375, tableY + 6);
      doc.text('POINTS TODAY', 440, tableY + 6);
      doc.text('TOTAL POINTS', 500, tableY + 6);
      tableY += 20;
      doc.font('Helvetica').fontSize(8);
    }

    const rowBg = i % 2 === 0 ? '#ffffff' : '#f8fafc';
    doc.rect(36, tableY, 523, 18).fill(rowBg);
    
    doc.fillColor('#334155').text(row.studentId, 42, tableY + 5, { width: 65, truncate: true });
    doc.text(row.name, 110, tableY + 5, { width: 95, truncate: true });
    doc.text(row.username, 210, tableY + 5, { width: 85, truncate: true });

    const isPresent = row.attendance.toUpperCase() === 'PRESENT';
    doc.fillColor(isPresent ? '#16a34a' : '#dc2626').text(row.attendance, 300, tableY + 5);

    doc.fillColor('#334155');
    doc.text(`${row.tasksToday}`, 385, tableY + 5);
    doc.text(`+${row.pointsToday}`, 450, tableY + 5);
    doc.text(`${row.totalPoints}`, 505, tableY + 5);

    tableY += 18;
  }

  // Footer / Disclaimer
  if (tableY > doc.page.height - 40) {
    doc.addPage({ margin: 36, size: 'A4' });
    tableY = 40;
  }

  doc.moveDown();
  doc.fillColor('#64748b').fontSize(8).font('Helvetica-Oblique').text(
    'This report is automatically generated by STACK QUEUE Full Training Batch Management System. Password credentials are kept confidential and secure.',
    36,
    tableY + 15,
    { align: 'center', width: 523 }
  );

  doc.end();

  // Wait for stream to finish writing
  await new Promise((resolve, reject) => {
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
  });

  // Upsert BatchDailyReport in Database
  const reportDoc = await BatchDailyReport.findOneAndUpdate(
    { batchId, date: todayStr },
    {
      batchId,
      date: todayStr,
      pdfPath: relativePdfPath,
      statsSnapshot: {
        totalStudents,
        presentCount,
        absentCount,
        avgPointsToday,
        totalTasksCompletedToday
      },
      topicCovered,
      practicalActivity,
      generatedAt: new Date()
    },
    { upsert: true, new: true }
  );

  return reportDoc;
};
