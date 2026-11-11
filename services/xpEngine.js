const xpRules = require('../config/xpRules');
const XPTransaction = require('../models/XPTransaction');
const StudentProfile = require('../models/StudentProfile');
const Badge = require('../models/Badge');
const StudentBadge = require('../models/StudentBadge');
const Notification = require('../models/Notification');

/**
 * Awards XP to a student, updates level, records transaction, and checks for badges
 */
async function awardXp(studentUserId, amount, reason, referenceId = null, referenceModel = null, description = '') {
  const profile = await StudentProfile.findOne({ userId: studentUserId });
  if (!profile) return null;

  profile.totalXp += amount;
  const newLevel = xpRules.calculateLevel(profile.totalXp);
  const leveledUp = newLevel.level > profile.currentLevel.level;
  profile.currentLevel = {
    level: newLevel.level,
    title: newLevel.title,
    icon: newLevel.icon
  };

  await profile.save();

  // Record audit transaction
  await XPTransaction.create({
    studentId: studentUserId,
    amount,
    reason,
    referenceId,
    referenceModel,
    balanceAfter: profile.totalXp,
    description: description || `Earned ${amount} XP for ${reason.replace(/_/g, ' ')}`
  });

  // Level up notification
  if (leveledUp) {
    await Notification.create({
      userId: studentUserId,
      title: `Level Up! Level ${newLevel.level}: ${newLevel.title}`,
      message: `Congratulations! You reached Level ${newLevel.level} (${newLevel.title}) with ${profile.totalXp} XP!`,
      type: 'challenge_completed',
      link: '/achievements'
    });
  }

  // Check eligible badges
  await checkAndAwardBadges(studentUserId, profile);

  return { totalXp: profile.totalXp, level: profile.currentLevel, leveledUp };
}

/**
 * Streak feature has been completely retired (safe no-op)
 */
async function updateDailyStreak(studentUserId) {
  return {};
}

/**
 * Checks and awards badges based on student metrics
 */
async function checkAndAwardBadges(studentUserId, profile) {
  const allBadges = await Badge.find();
  const earnedBadges = await StudentBadge.find({ studentId: studentUserId }).populate('badgeId');
  const earnedIds = new Set(earnedBadges.map(b => b.badgeId._id.toString()));

  for (const badge of allBadges) {
    if (earnedIds.has(badge._id.toString())) continue;

    let qualified = false;
    if (badge.criteria.type === 'challenges_count') {
      qualified = profile.stats.challengesSolved >= badge.criteria.targetValue;
    } else if (badge.criteria.type === 'xp_threshold') {
      qualified = profile.totalXp >= badge.criteria.targetValue;
    } else if (badge.criteria.type === 'project_count') {
      qualified = profile.stats.projectsSubmitted >= badge.criteria.targetValue;
    }

    if (qualified) {
      await StudentBadge.create({
        studentId: studentUserId,
        badgeId: badge._id
      });

      // Bonus XP for badge
      if (badge.xpBonus > 0) {
        profile.totalXp += badge.xpBonus;
        await profile.save();
        await XPTransaction.create({
          studentId: studentUserId,
          amount: badge.xpBonus,
          reason: 'badge_unlocked',
          referenceId: badge._id,
          referenceModel: 'Badge',
          balanceAfter: profile.totalXp,
          description: `Unlocked badge: ${badge.name}`
        });
      }

      await Notification.create({
        userId: studentUserId,
        title: `Badge Unlocked: ${badge.name}!`,
        message: `You unlocked the "${badge.name}" badge! +${badge.xpBonus} XP Bonus.`,
        type: 'badge_earned',
        link: '/achievements'
      });
    }
  }
}

module.exports = {
  awardXp,
  updateDailyStreak,
  checkAndAwardBadges
};
