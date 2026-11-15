const xpRules = require('../config/xpRules');
const XPTransaction = require('../models/XPTransaction');
const StudentProfile = require('../models/StudentProfile');
const Badge = require('../models/Badge');
const StudentBadge = require('../models/StudentBadge');
const Notification = require('../models/Notification');

const REASON_FALLBACKS = new Set([
  'challenge_solved',
  'first_attempt_bonus',
  'perfect_score_bonus',
  'daily_challenge_complete',
  'daily_challenge_all_bonus',
  'daily_challenge_solved',
  'interview_arena_solved',
  'mock_interview_solved',
  'module_question_solved',
  'concept_task_completed',
  'streak_bonus',
  'project_task_completed',
  'project_completed',
  'trainer_award',
  'badge_unlocked',
  'adaptive_mcq_solved',
  'adaptive_coding_solved'
]);

function normalizeReason(reason) {
  return REASON_FALLBACKS.has(reason) ? reason : 'challenge_solved';
}

async function applyAtomicProfileXp(studentUserId, amount) {
  const updated = await StudentProfile.findOneAndUpdate(
    { userId: studentUserId },
    { $inc: { totalXp: amount } },
    { new: true }
  );
  if (!updated) return null;

  const prevLevelNum = updated.currentLevel?.level || 1;
  const newLevel = xpRules.calculateLevel(updated.totalXp);
  const leveledUp = newLevel.level > prevLevelNum;

  if (
    leveledUp ||
    updated.currentLevel?.level !== newLevel.level ||
    updated.currentLevel?.title !== newLevel.title
  ) {
    updated.currentLevel = {
      level: newLevel.level,
      title: newLevel.title,
      icon: newLevel.icon
    };
    await StudentProfile.updateOne(
      { _id: updated._id },
      { $set: { currentLevel: updated.currentLevel } }
    );
  }

  return { profile: updated, newLevel, leveledUp };
}

/**
 * Idempotently awards XP for a completed student question/task/challenge.
 * Enforces uniqueness on (studentUserId, feature, questionId) via XPTransaction.idempotencyKey
 * BEFORE incrementing StudentProfile.totalXp, preventing double rewards on retries/double-clicks.
 */
async function awardQuestionXpIdempotent({
  studentUserId,
  questionId,
  feature,
  amount,
  reason,
  referenceId = null,
  referenceModel = null,
  description = ''
}) {
  if (!studentUserId) {
    return { awarded: false, alreadyCompleted: false, xpAwarded: 0, totalXp: 0, level: null, leveledUp: false };
  }

  const existingProfile = await StudentProfile.findOne({ userId: studentUserId }).select('totalXp currentLevel stats');
  if (!existingProfile) {
    return { awarded: false, alreadyCompleted: false, xpAwarded: 0, totalXp: 0, level: null, leveledUp: false };
  }

  const safeAmount = Math.max(0, Number(amount) || 0);
  if (safeAmount <= 0) {
    return {
      awarded: false,
      alreadyCompleted: false,
      xpAwarded: 0,
      totalXp: existingProfile.totalXp || 0,
      level: existingProfile.currentLevel,
      leveledUp: false
    };
  }

  const normalizedReason = normalizeReason(reason);
  const idempotencyKey = questionId && feature
    ? `${studentUserId.toString()}::${String(feature).toUpperCase()}::${questionId.toString()}`
    : undefined;

  if (idempotencyKey) {
    const existingTx = await XPTransaction.findOne({ idempotencyKey }).select('_id').lean();
    if (existingTx) {
      return {
        awarded: false,
        alreadyCompleted: true,
        xpAwarded: 0,
        totalXp: existingProfile.totalXp || 0,
        level: existingProfile.currentLevel,
        leveledUp: false
      };
    }
  }

  // Claim idempotency slot in XPTransaction first so concurrent requests collide safely
  let tx;
  try {
    tx = await XPTransaction.create({
      studentId: studentUserId,
      amount: safeAmount,
      xpAwarded: safeAmount,
      reason: normalizedReason,
      feature: feature ? String(feature).toUpperCase() : undefined,
      questionId: questionId || referenceId || undefined,
      completionStatus: 'completed',
      idempotencyKey,
      referenceId: referenceId || questionId || undefined,
      referenceModel: referenceModel || undefined,
      balanceAfter: (existingProfile.totalXp || 0) + safeAmount,
      description: description || `Earned ${safeAmount} XP for ${normalizedReason.replace(/_/g, ' ')}`
    });
  } catch (err) {
    if (err?.code === 11000) {
      const latest = await StudentProfile.findOne({ userId: studentUserId }).select('totalXp currentLevel').lean();
      return {
        awarded: false,
        alreadyCompleted: true,
        xpAwarded: 0,
        totalXp: latest?.totalXp ?? (existingProfile.totalXp || 0),
        level: latest?.currentLevel ?? existingProfile.currentLevel,
        leveledUp: false
      };
    }
    throw err;
  }

  let atomicRes;
  try {
    atomicRes = await applyAtomicProfileXp(studentUserId, safeAmount);
    if (!atomicRes) {
      await XPTransaction.deleteOne({ _id: tx._id }).catch(() => {});
      return { awarded: false, alreadyCompleted: false, xpAwarded: 0, totalXp: 0, level: null, leveledUp: false };
    }
    await XPTransaction.updateOne({ _id: tx._id }, { $set: { balanceAfter: atomicRes.profile.totalXp } }).catch(() => {});
  } catch (err) {
    await XPTransaction.deleteOne({ _id: tx._id }).catch(() => {});
    throw err;
  }

  const { profile, newLevel, leveledUp } = atomicRes;

  if (leveledUp) {
    await Notification.create({
      userId: studentUserId,
      title: `Level Up! Level ${newLevel.level}: ${newLevel.title}`,
      message: `Congratulations! You reached Level ${newLevel.level} (${newLevel.title}) with ${profile.totalXp} XP!`,
      type: 'challenge_completed',
      link: '/achievements'
    }).catch(() => {});
  }

  await checkAndAwardBadges(studentUserId, profile).catch(() => {});

  const refreshed = await StudentProfile.findOne({ userId: studentUserId }).select('totalXp currentLevel').lean();

  return {
    awarded: true,
    alreadyCompleted: false,
    xpAwarded: safeAmount,
    totalXp: refreshed?.totalXp ?? profile.totalXp,
    level: refreshed?.currentLevel ?? profile.currentLevel,
    leveledUp,
    transactionId: tx._id
  };
}

/**
 * Awards XP to a student, updates level, records transaction, and checks for badges
 */
async function awardXp(studentUserId, amount, reason, referenceId = null, referenceModel = null, description = '', options = {}) {
  const safeAmount = Math.max(0, Number(amount) || 0);
  if (safeAmount <= 0) {
    const cur = await StudentProfile.findOne({ userId: studentUserId }).select('totalXp currentLevel').lean();
    return cur ? { totalXp: cur.totalXp, level: cur.currentLevel, leveledUp: false, xpAwarded: 0 } : null;
  }

  if (options?.feature && (options?.questionId || referenceId)) {
    return awardQuestionXpIdempotent({
      studentUserId,
      questionId: options.questionId || referenceId,
      feature: options.feature,
      amount: safeAmount,
      reason,
      referenceId,
      referenceModel,
      description
    });
  }

  const atomicRes = await applyAtomicProfileXp(studentUserId, safeAmount);
  if (!atomicRes) return null;

  const { profile, newLevel, leveledUp } = atomicRes;
  const normalizedReason = normalizeReason(reason);

  // Record audit transaction
  await XPTransaction.create({
    studentId: studentUserId,
    amount: safeAmount,
    xpAwarded: safeAmount,
    reason: normalizedReason,
    feature: options?.feature ? String(options.feature).toUpperCase() : undefined,
    questionId: options?.questionId || referenceId || undefined,
    completionStatus: 'completed',
    referenceId,
    referenceModel,
    balanceAfter: profile.totalXp,
    description: description || `Earned ${safeAmount} XP for ${normalizedReason.replace(/_/g, ' ')}`
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

  const refreshed = await StudentProfile.findOne({ userId: studentUserId }).select('totalXp currentLevel').lean();

  return {
    totalXp: refreshed?.totalXp ?? profile.totalXp,
    level: refreshed?.currentLevel ?? profile.currentLevel,
    leveledUp,
    xpAwarded: safeAmount
  };
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
        const bonusRes = await applyAtomicProfileXp(studentUserId, badge.xpBonus);
        const bal = bonusRes?.profile?.totalXp ?? profile.totalXp;
        await XPTransaction.create({
          studentId: studentUserId,
          amount: badge.xpBonus,
          xpAwarded: badge.xpBonus,
          reason: 'badge_unlocked',
          referenceId: badge._id,
          referenceModel: 'Badge',
          balanceAfter: bal,
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
  awardQuestionXpIdempotent,
  updateDailyStreak,
  checkAndAwardBadges
};
