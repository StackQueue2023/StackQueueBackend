// Centralized XP, Levels, and Badges Configuration
module.exports = {
  DIFFICULTY_XP: {
    Beginner: 15,
    Intermediate: 30,
    Advanced: 60,
    Expert: 120
  },
  BONUSES: {
    FIRST_ATTEMPT: 15,
    PERFECT_SCORE: 20,
    DAILY_CHALLENGE_ALL: 100,
    PROJECT_TASK_COMPLETED: 50,
    PROJECT_COMPLETED: 300,
    STREAK_DAY_MULTIPLIER: 5
  },
  HINT_PENALTY_PERCENT: 15, // 15% reduction per hint used
  LEVELS: [
    { level: 1, title: 'Beginner', minXp: 0, maxXp: 150, icon: '🌱' },
    { level: 2, title: 'Explorer', minXp: 150, maxXp: 350, icon: '🧭' },
    { level: 3, title: 'Learner', minXp: 350, maxXp: 650, icon: '📚' },
    { level: 4, title: 'Developer', minXp: 650, maxXp: 1100, icon: '💻' },
    { level: 5, title: 'Problem Solver', minXp: 1100, maxXp: 1750, icon: '🧩' },
    { level: 6, title: 'Builder', minXp: 1750, maxXp: 2600, icon: '🔨' },
    { level: 7, title: 'Advanced Developer', minXp: 2600, maxXp: 3700, icon: '⚡' },
    { level: 8, title: 'Industry Ready', minXp: 3700, maxXp: 5200, icon: '🚀' },
    { level: 9, title: 'Project Engineer', minXp: 5200, maxXp: 7200, icon: '🛡️' },
    { level: 10, title: 'IT Champion', minXp: 7200, maxXp: Infinity, icon: '👑' }
  ],
  calculateLevel: function(totalXp) {
    const current = this.LEVELS.slice().reverse().find(l => totalXp >= l.minXp);
    return current || this.LEVELS[0];
  }
};
