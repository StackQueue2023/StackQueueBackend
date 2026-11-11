const StudentProfile = require('../models/StudentProfile');
const StudentBadge = require('../models/StudentBadge');

// GET /api/leaderboard
exports.getLeaderboard = async (req, res) => {
  try {
    const { batchId, courseId } = req.query;

    const filter = {};
    if (batchId) filter.batchId = batchId;
    if (courseId) filter.enrolledCourseId = courseId;

    const profiles = await StudentProfile.find(filter)
      .sort({ totalXp: -1 })
      .limit(50)
      .populate('userId', 'name email avatar')
      .populate('batchId', 'name code')
      .populate('collegeId', 'name code')
      .populate('enrolledCourseId', 'title');

    // Get badge count for each student
    const studentUserIds = profiles.map(p => p.userId?._id).filter(Boolean);
    const badgesCounts = await StudentBadge.aggregate([
      { $match: { studentId: { $in: studentUserIds } } },
      { $group: { _id: '$studentId', count: { $sum: 1 } } }
    ]);

    const badgeMap = {};
    badgesCounts.forEach(b => {
      badgeMap[b._id.toString()] = b.count;
    });

    const leaderboard = profiles
      .filter(p => p.userId)
      .map((p, index) => ({
        rank: index + 1,
        studentId: p.userId._id,
        name: p.userId.name,
        avatar: p.userId.avatar,
        college: p.collegeId ? p.collegeId.code || p.collegeId.name : 'STACK QUEUE',
        batch: p.batchId ? p.batchId.name : 'General',
        course: p.enrolledCourseId ? p.enrolledCourseId.title : 'IT Foundations',
        xp: p.totalXp,
        level: p.currentLevel,
        challengesSolved: p.stats?.challengesSolved || 0,
        accuracyRate: p.stats?.accuracyRate || 100,
        badgesCount: badgeMap[p.userId._id.toString()] || 0
      }));

    return res.json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
