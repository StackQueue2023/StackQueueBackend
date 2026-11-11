const StudentProfile = require('../models/StudentProfile');
const Course = require('../models/Course');
const Game = require('../models/Game');
const Progress = require('../models/Progress');
const StudentBadge = require('../models/StudentBadge');
const Badge = require('../models/Badge');
const DailyChallenge = require('../models/DailyChallenge');
const Project = require('../models/Project');
const Attendance = require('../models/Attendance');
const TrainerFeedback = require('../models/TrainerFeedback');
const XPTransaction = require('../models/XPTransaction');
const Module = require('../models/Module');
const DomainTask = require('../models/DomainTask');
const StudentModuleStatus = require('../models/StudentModuleStatus');
const StudentDomainProgress = require('../models/StudentDomainProgress');
const { autoGenerateSyllabusModules } = require('./adminDomainController');


// GET /api/student/dashboard
exports.getDashboard = async (req, res) => {
  try {
    const studentUserId = req.user._id;
    let profile = await StudentProfile.findOne({ userId: studentUserId })
      .populate('collegeId')
      .populate('batchId')
      .populate('enrolledCourseId');

    if (!profile) {
      profile = await StudentProfile.create({ userId: studentUserId });
    }

    // Today's daily challenge
    const todayStr = new Date().toISOString().split('T')[0];
    const dailyChallenge = await DailyChallenge.findOne({ date: todayStr }).populate('challenges.challengeId');

    // Recent badges
    const recentBadges = await StudentBadge.find({ studentId: studentUserId })
      .sort({ earnedAt: -1 })
      .limit(4)
      .populate('badgeId');

    // Active project
    const activeProject = await Project.findOne({
      $or: [{ assignedStudentId: studentUserId }, { teamMembers: studentUserId }]
    });

    // Today's attendance
    const todayAttendance = await Attendance.findOne({
      userId: studentUserId,
      date: todayStr
    });

    // Recent trainer feedback
    const recentFeedback = await TrainerFeedback.find({ studentId: studentUserId })
      .sort({ createdAt: -1 })
      .limit(3)
      .populate('trainerId', 'name avatar');

    // Recent XP transactions
    const recentXp = await XPTransaction.find({ studentId: studentUserId })
      .sort({ createdAt: -1 })
      .limit(5);

    // Total completed games count
    const completedGamesCount = await Progress.countDocuments({
      studentId: studentUserId,
      isCompleted: true
    });

    return res.json({
      success: true,
      data: {
        profile,
        dailyChallenge,
        recentBadges,
        activeProject,
        todayAttendance: todayAttendance ? todayAttendance.status : 'Not Marked',
        recentFeedback,
        recentXp,
        completedGamesCount
      }
    });
  } catch (error) {
    console.error('getDashboard error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/student/progress
exports.getProgress = async (req, res) => {
  try {
    const studentUserId = req.user._id;
    const profile = await StudentProfile.findOne({ userId: studentUserId })
      .populate('enrolledCourseId', 'title slug description icon color durationWeeks totalHours')
      .populate('previousCourses.courseId', 'title slug description icon color durationWeeks totalHours');

    const requestedDomain = req.query.domain;
    const requestedCourseId = req.query.courseId;

    const DOMAIN_GAME_SLUGS = {
      java: ['java-quest', 'dsa-battle', 'sql-detective', 'git-battle', 'cloud-mission', 'fullstack-challenge'],
      python: ['python-island', 'dsa-battle', 'sql-detective', 'git-battle', 'cloud-mission', 'fullstack-challenge'],
      cpp: ['dsa-battle', 'sql-detective', 'git-battle', 'cloud-mission', 'fullstack-challenge'],
      react: ['react-lab', 'javascript-reactor', 'html-builder', 'css-arena', 'dsa-battle', 'sql-detective', 'git-battle', 'cloud-mission', 'fullstack-challenge'],
      javascript: ['javascript-reactor', 'react-lab', 'html-builder', 'css-arena', 'dsa-battle', 'sql-detective', 'git-battle', 'cloud-mission', 'fullstack-challenge'],
      js: ['javascript-reactor', 'react-lab', 'html-builder', 'css-arena', 'dsa-battle', 'sql-detective', 'git-battle', 'cloud-mission', 'fullstack-challenge']
    };

    let activeDomain = profile?.domain || 'java';
    let activeCourse = profile?.enrolledCourseId;
    let isCompletedCourse = false;

    if (requestedDomain || requestedCourseId) {
      const prev = profile?.previousCourses?.find(p => {
        const pId = p.courseId?._id?.toString() || p.courseId?.toString();
        if (requestedCourseId && pId === requestedCourseId) return true;
        if (requestedDomain && p.domain === requestedDomain) return true;
        return false;
      });
      if (prev) {
        activeDomain = prev.domain;
        activeCourse = prev.courseId;
        isCompletedCourse = true;
      }
    }

    const allowedSlugs = DOMAIN_GAME_SLUGS[(activeDomain || 'java').toLowerCase()] || DOMAIN_GAME_SLUGS.java;

    const allGames = await Game.find({ slug: { $in: allowedSlugs }, isActive: true }).sort({ order: 1 });
    const progressList = await Progress.find({ studentId: studentUserId });

    const gameProgressMap = {};
    progressList.forEach(p => {
      gameProgressMap[p.gameSlug] = p;
    });

    const gamesProgress = allGames.map(game => {
      const p = gameProgressMap[game.slug];
      return {
        gameId: game._id,
        title: game.title,
        slug: game.slug,
        category: game.category,
        totalLevels: game.totalLevels,
        unlockedLevel: p ? p.unlockedLevel : 1,
        completedChallengesCount: p ? p.completedChallenges.length : 0,
        totalStars: p ? p.totalStars : 0,
        isCompleted: p ? p.isCompleted : false
      };
    });

    // Build available courses list for selector
    const availableCourses = [];
    if (profile?.enrolledCourseId) {
      availableCourses.push({
        domain: profile.domain,
        course: profile.enrolledCourseId,
        isCurrent: true
      });
    }
    if (Array.isArray(profile?.previousCourses)) {
      profile.previousCourses.forEach(p => {
        availableCourses.push({
          domain: p.domain,
          course: p.courseId,
          isCompleted: true
        });
      });
    }

    return res.json({
      success: true,
      data: {
        domain: activeDomain,
        course: activeCourse,
        isCompletedCourse,
        availableCourses,
        stats: profile ? profile.stats : {},
        strongTopics: profile ? profile.strongTopics : [],
        weakTopics: profile ? profile.weakTopics : [],
        gamesProgress
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/student/achievements
exports.getAchievements = async (req, res) => {
  try {
    const studentUserId = req.user._id;
    const allBadges = await Badge.find().sort({ createdAt: 1 });
    const earnedStudentBadges = await StudentBadge.find({ studentId: studentUserId }).populate('badgeId');

    const earnedBadgeIds = new Set(earnedStudentBadges.map(sb => sb.badgeId._id.toString()));
    const earnedAtMap = {};
    earnedStudentBadges.forEach(sb => {
      earnedAtMap[sb.badgeId._id.toString()] = sb.earnedAt;
    });

    const badges = allBadges.map(b => ({
      id: b._id,
      name: b.name,
      slug: b.slug,
      description: b.description,
      category: b.category,
      icon: b.icon,
      color: b.color,
      xpBonus: b.xpBonus,
      isUnlocked: earnedBadgeIds.has(b._id.toString()),
      earnedAt: earnedAtMap[b._id.toString()] || null
    }));

    const xpHistory = await XPTransaction.find({ studentId: studentUserId }).sort({ createdAt: -1 }).limit(20);

    return res.json({
      success: true,
      data: {
        badges,
        unlockedCount: earnedStudentBadges.length,
        totalBadges: allBadges.length,
        xpHistory
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/student/daily-challenge
exports.getDailyChallenge = async (req, res) => {
  try {
    const studentUserId = req.user._id;
    const todayStr = new Date().toISOString().split('T')[0];
    let dc = await DailyChallenge.findOne({ date: todayStr }).populate('challenges.challengeId');

    if (!dc) {
      return res.status(404).json({ success: false, message: 'No daily challenge scheduled for today.' });
    }

    const studentCompletion = dc.completions.find(c => c.studentId && c.studentId.toString() === studentUserId.toString());
    const completedSlots = studentCompletion ? studentCompletion.completedSlots : [];
    const completedAll = studentCompletion ? studentCompletion.completedAll : false;

    return res.json({
      success: true,
      data: {
        date: dc.date,
        bonusXp: dc.bonusXp,
        challenges: dc.challenges,
        completedSlots,
        completedAll
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/student/learning-path
exports.getLearningPath = async (req, res) => {
  try {
    const studentUserId = req.user._id;
    let profile = await StudentProfile.findOne({ userId: studentUserId }).populate('enrolledCourseId');

    let course = profile ? profile.enrolledCourseId : null;
    if (!course) {
      if (profile && profile.domain) {
        course = await Course.findOne({
          $or: [
            { slug: profile.domain },
            { slug: new RegExp(`^${profile.domain}$`, 'i') },
            { title: new RegExp(profile.domain, 'i') }
          ]
        });
      }
      if (!course) {
        course = await Course.findOne({ isActive: true }).sort({ createdAt: -1 });
      }
      if (!course) {
        course = await Course.findOne().sort({ createdAt: -1 });
      }
      if (course && profile) {
        profile.enrolledCourseId = course._id;
        await profile.save().catch(() => {});
      }
    }

    let modules = [];
    if (course) {
      const domainSlug = (course.slug || course.domain || course.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const slugs = [course.slug, course.domain, domainSlug, profile?.domain].filter(Boolean);

      const query = {
        isPublished: { $ne: false },
        $or: [
          { courseId: course._id },
          { domain: { $in: slugs } }
        ]
      };

      modules = await Module.find(query).sort({ order: 1 });
    }

    const statuses = await StudentModuleStatus.find({ studentId: studentUserId });
    const statusMap = {};
    statuses.forEach(s => { statusMap[s.moduleId.toString()] = s.status; });

    const populatedModules = await Promise.all(modules.map(async (mod, idx) => {
      const tasks = await DomainTask.find({ moduleId: mod._id, isActive: true }).sort({ order: 1 });
      const completedTasks = await StudentDomainProgress.countDocuments({
        studentId: studentUserId,
        moduleId: mod._id,
        status: 'completed'
      });
      const defaultStatus = idx === 0 ? 'processing' : 'not_started';
      const status = statusMap[mod._id.toString()] || defaultStatus;

      return {
        id: mod._id,
        _id: mod._id,
        order: mod.order,
        title: mod.title,
        description: mod.description,
        status,
        isCompleted: status === 'completed',
        isCurrent: status === 'processing',
        isLocked: status === 'not_started',
        totalTasks: tasks.length,
        completedTasks,
        topics: tasks.map(t => t.title)
      };
    }));

    return res.json({
      success: true,
      data: {
        course,
        modules: populatedModules,
        currentLevel: profile ? profile.currentLevel : { level: 1, title: 'Beginner' }
      }
    });
  } catch (error) {
    console.error('getLearningPath error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
