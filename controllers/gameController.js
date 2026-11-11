const Game = require('../models/Game');
const Challenge = require('../models/Challenge');
const Progress = require('../models/Progress');
const StudentProfile = require('../models/StudentProfile');

// Domain code / slug to GameHub game slugs mapping
const DOMAIN_GAME_SLUGS = {
  java: ['java-quest', 'dsa-battle', 'sql-detective', 'git-battle', 'cloud-mission', 'fullstack-challenge'],
  python: ['python-island', 'dsa-battle', 'sql-detective', 'git-battle', 'cloud-mission', 'fullstack-challenge'],
  cpp: ['dsa-battle', 'sql-detective', 'git-battle', 'cloud-mission', 'fullstack-challenge'],
  react: ['react-lab', 'javascript-reactor', 'html-builder', 'css-arena', 'dsa-battle', 'sql-detective', 'git-battle', 'cloud-mission', 'fullstack-challenge'],
  javascript: ['react-lab', 'javascript-reactor', 'html-builder', 'css-arena', 'dsa-battle', 'sql-detective', 'git-battle', 'cloud-mission', 'fullstack-challenge'],
  js: ['react-lab', 'javascript-reactor', 'html-builder', 'css-arena', 'dsa-battle', 'sql-detective', 'git-battle', 'cloud-mission', 'fullstack-challenge'],
  mern: ['react-lab', 'javascript-reactor', 'html-builder', 'css-arena', 'dsa-battle', 'sql-detective', 'git-battle', 'cloud-mission', 'fullstack-challenge'],
  frontend: ['react-lab', 'javascript-reactor', 'html-builder', 'css-arena', 'dsa-battle', 'sql-detective', 'git-battle', 'cloud-mission', 'fullstack-challenge']
};

function extractNormalizedDomain(str) {
  if (!str || typeof str !== 'string') return null;
  const s = str.toLowerCase();
  if (s.includes('java') && !s.includes('javascript')) return 'java';
  if (s.includes('python')) return 'python';
  if (s.includes('cpp') || s.includes('c++')) return 'cpp';
  if (s.includes('react') || s.includes('mern') || s.includes('javascript') || s.includes('js') || s.includes('frontend')) return 'react';
  return null;
}

async function getStudentAllowedGameSlugs(userId, userRole) {
  if (!userRole || userRole === 'admin' || userRole === 'trainer' || userRole === 'tutor') {
    return null; // Null means all games allowed
  }

  const profile = await StudentProfile.findOne({ userId }).populate('enrolledCourseId');

  const domains = new Set();
  if (profile) {
    if (profile.domain) {
      const d = extractNormalizedDomain(profile.domain);
      if (d) domains.add(d);
    }
    if (profile.enrolledCourseId) {
      const d1 = extractNormalizedDomain(profile.enrolledCourseId.slug);
      const d2 = extractNormalizedDomain(profile.enrolledCourseId.title);
      if (d1) domains.add(d1);
      if (d2) domains.add(d2);
    }
    if (Array.isArray(profile.previousCourses)) {
      profile.previousCourses.forEach(p => {
        if (p.domain) {
          const d = extractNormalizedDomain(p.domain);
          if (d) domains.add(d);
        }
      });
    }
  }

  if (domains.size === 0) {
    domains.add('java');
  }

  const allowedSlugs = new Set();
  domains.forEach(d => {
    const slugs = DOMAIN_GAME_SLUGS[d];
    if (slugs) {
      slugs.forEach(s => allowedSlugs.add(s));
    }
  });

  return Array.from(allowedSlugs);
}

// GET /api/games
exports.getGames = async (req, res) => {
  try {
    let games = await Game.find({ isActive: true }).sort({ order: 1 });

    let progressMap = {};
    let allowedSlugs = null;

    if (req.user && req.user.role === 'student') {
      const progressList = await Progress.find({ studentId: req.user._id });
      progressList.forEach(p => {
        progressMap[p.gameSlug] = p;
      });

      allowedSlugs = await getStudentAllowedGameSlugs(req.user._id, req.user.role);
      if (allowedSlugs) {
        games = games.filter(g => allowedSlugs.includes(g.slug));
      }
    }

    const challengeCounts = await Challenge.aggregate([
      { $group: { _id: '$gameId', count: { $sum: 1 } } }
    ]);
    const countsMap = {};
    challengeCounts.forEach(c => {
      if (c._id) countsMap[c._id.toString()] = c.count;
    });

    const result = games.map(game => {
      const p = progressMap[game.slug];
      const count = countsMap[game._id.toString()] || 100;
      return {
        ...game.toObject(),
        totalChallenges: count,
        unlockedLevel: p ? p.unlockedLevel : 1,
        completedChallengesCount: p ? p.completedChallenges.length : 0,
        totalStars: p ? p.totalStars : 0,
        isCompleted: p ? p.isCompleted : false
      };
    });

    return res.json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/games/:slug
exports.getGameBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const normalizedSlug = slug.toLowerCase();

    if (req.user && req.user.role === 'student') {
      const allowedSlugs = await getStudentAllowedGameSlugs(req.user._id, req.user.role);
      if (allowedSlugs && !allowedSlugs.includes(normalizedSlug)) {
        return res.status(403).json({
          success: false,
          message: `This GameHub track (${slug}) is not authorized for your enrolled domain. Please complete the corresponding course domain to unlock it.`
        });
      }
    }

    const game = await Game.findOne({ slug: normalizedSlug });
    if (!game) {
      return res.status(404).json({ success: false, message: 'Game not found' });
    }

    const challenges = await Challenge.find({ gameSlug: normalizedSlug, isActive: true })
      .sort({ levelNumber: 1, order: 1 })
      .select('-solutionCode');

    let progress = null;
    if (req.user && req.user.role === 'student') {
      progress = await Progress.findOne({ studentId: req.user._id, gameSlug: normalizedSlug });
    }

    return res.json({
      success: true,
      data: {
        game,
        challenges,
        unlockedLevel: progress ? progress.unlockedLevel : 1,
        completedChallenges: progress ? progress.completedChallenges : [],
        totalStars: progress ? progress.totalStars : 0
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
