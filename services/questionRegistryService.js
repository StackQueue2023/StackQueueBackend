const crypto = require('crypto');
const QuestionRegistry = require('../models/QuestionRegistry');
const DailyChallengeHistory = require('../models/DailyChallengeHistory');
const InterviewQuestion = require('../models/InterviewQuestion');
const Challenge = require('../models/Challenge');
const ConceptTask = require('../models/ConceptTask');

/**
 * Normalizes question text for robust duplicate comparison
 */
function normalizeQuestionText(text) {
  if (!text) return '';
  return String(text)
    .toLowerCase()
    .replace(/[^\w\s]/gi, ' ') // Replace punctuation with space
    .replace(/\s+/g, ' ')      // Collapse multiple whitespace
    .trim();
}

/**
 * Generates a stable SHA-256 fingerprint hash for question content
 */
function generateFingerprint(title, problemStatement = '', category = '', domain = '') {
  const normTitle = normalizeQuestionText(title);
  const normBody = normalizeQuestionText(problemStatement).slice(0, 100); // Check core statement
  const normCat = normalizeQuestionText(category);
  const normDom = normalizeQuestionText(domain);
  const rawString = `${normTitle}|${normBody}|${normCat}|${normDom}`;
  return crypto.createHash('sha256').update(rawString).digest('hex');
}

/**
 * Checks if a question already exists in the registry
 */
async function checkDuplicate(title, problemStatement = '', category = '', domain = '') {
  const fingerprint = generateFingerprint(title, problemStatement, category, domain);
  const normTitle = normalizeQuestionText(title);

  // 1. Direct fingerprint match
  const existing = await QuestionRegistry.findOne({
    $or: [
      { fingerprint },
      { normalizedTitle: normTitle }
    ]
  });

  if (existing) {
    return {
      isDuplicate: true,
      existingSource: existing.source,
      existingTitle: existing.title,
      existingId: existing.questionId
    };
  }

  // 2. Word overlap / near-exact match (scoped to same domain when available to utilize domain index)
  const words = normTitle.split(' ').filter(w => w.length > 3);
  if (words.length >= 3) {
    const regexPattern = words.slice(0, 4).join('|');
    const query = {
      normalizedTitle: { $regex: regexPattern, $options: 'i' }
    };
    if (domain) {
      query.domain = (domain || 'general').toLowerCase().trim();
    }
    const candidates = await QuestionRegistry.find(query)
      .select('normalizedTitle source title questionId')
      .limit(10);

    for (const cand of candidates) {
      const candWords = new Set(cand.normalizedTitle.split(' '));
      const matchCount = words.filter(w => candWords.has(w)).length;
      const overlapRatio = matchCount / Math.max(words.length, candWords.size);

      if (overlapRatio >= 0.8) {
        return {
          isDuplicate: true,
          existingSource: cand.source,
          existingTitle: cand.title,
          existingId: cand.questionId,
          nearMatch: true
        };
      }
    }
  }

  return { isDuplicate: false };
}

/**
 * Registers a new question into central registry
 */
async function registerQuestion(questionId, source, title, problemStatement = '', category = '', domain = '', knownDup = null) {
  const normTitle = normalizeQuestionText(title);
  const fingerprint = generateFingerprint(title, problemStatement, category, domain);

  const dup = knownDup !== null ? knownDup : await checkDuplicate(title, problemStatement, category, domain);

  const record = await QuestionRegistry.findOneAndUpdate(
    { questionId, source },
    {
      questionId,
      source,
      title: title.trim(),
      normalizedTitle: normTitle,
      fingerprint,
      domain: (domain || 'general').toLowerCase().trim(),
      category: category || 'General',
      isDuplicate: dup.isDuplicate,
      duplicateOf: dup.existingId || null
    },
    { upsert: true, new: true }
  );

  return { record, dupCheck: dup };
}

/**
 * Scans all collections and populates central QuestionRegistry on startup/sync
 */
async function syncAllQuestionsRegistry() {
  try {
    // 1. Sync InterviewQuestion (Interview Arena & Mock Interview)
    const interviewQuestions = await InterviewQuestion.find();
    for (const iq of interviewQuestions) {
      await registerQuestion(
        iq._id,
        'INTERVIEW_ARENA',
        iq.title,
        iq.problemStatement,
        iq.category,
        iq.domain
      );
    }

    // 2. Sync Challenge (Game Hub & Challenge Manager)
    const challenges = await Challenge.find();
    for (const ch of challenges) {
      await registerQuestion(
        ch._id,
        'GAME_HUB',
        ch.title,
        ch.instructions || ch.targetDescription,
        ch.category,
        ch.gameSlug
      );
    }

    // 3. Sync ConceptTask (Syllabus)
    const tasks = await ConceptTask.find();
    for (const tk of tasks) {
      await registerQuestion(
        tk._id,
        'SYLLABUS',
        tk.question,
        tk.description,
        'Syllabus',
        'syllabus'
      );
    }
  } catch (err) {
    console.error('Error syncing question registry:', err);
  }
}

/**
 * Collects list of fingerprints and titles that are EXCLUDED from Daily Challenge
 */
async function getExcludedFingerprints(studentId, domain, scope = 'GLOBAL') {
  const excludedSet = new Set();

  // 1. Exclude all Interview Arena questions (where isDailyOnly is not true)
  const arenaQuestions = await InterviewQuestion.find({
    isDailyOnly: { $ne: true }
  }).select('title problemStatement category domain');

  arenaQuestions.forEach(q => {
    const fp = generateFingerprint(q.title, q.problemStatement, q.category, q.domain);
    excludedSet.add(fp);
    const normT = normalizeQuestionText(q.title);
    excludedSet.add(normT);
  });

  // 2. Exclude all Game Hub & Challenge Manager challenges
  const challenges = await Challenge.find().select('title instructions targetDescription category gameSlug');
  challenges.forEach(ch => {
    const fp = generateFingerprint(ch.title, ch.instructions || ch.targetDescription, ch.category, ch.gameSlug);
    excludedSet.add(fp);
    const normT = normalizeQuestionText(ch.title);
    excludedSet.add(normT);
  });

  // 3. Exclude all Syllabus tasks
  const tasks = await ConceptTask.find().select('question description');
  tasks.forEach(tk => {
    const fp = generateFingerprint(tk.question, tk.description, 'Syllabus', 'syllabus');
    excludedSet.add(fp);
    const normT = normalizeQuestionText(tk.question);
    excludedSet.add(normT);
  });

  // 4. Exclude fingerprints from central QuestionRegistry registered as non-Daily
  const registeredNonDaily = await QuestionRegistry.find({
    source: { $in: ['INTERVIEW_ARENA', 'GAME_HUB', 'MOCK_INTERVIEW', 'SYLLABUS', 'CHALLENGE_MANAGER'] }
  }).select('fingerprint normalizedTitle');

  registeredNonDaily.forEach(r => {
    if (r.fingerprint) excludedSet.add(r.fingerprint);
    if (r.normalizedTitle) excludedSet.add(r.normalizedTitle);
  });

  // 5. Exclude fingerprints already served/completed in DailyChallengeHistory for this student
  let historyFilter = {};
  if (scope === 'PER_STUDENT' && studentId) {
    historyFilter = { studentId };
  }
  const history = await DailyChallengeHistory.find(historyFilter).select('questionFingerprint');
  history.forEach(h => {
    if (h.questionFingerprint) excludedSet.add(h.questionFingerprint);
  });

  return excludedSet;
}

/**
 * Selects a UNIQUE Daily Challenge for the student
 * Returns null if no eligible unique question remains (DO NOT RECYCLE OR FALL BACK TO ARENA).
 */
async function selectUniqueDailyChallenge(studentId, domain = 'java', options = {}) {
  const normDomain = domain.toLowerCase().trim();
  const todayStr = new Date().toISOString().split('T')[0];
  const { excludeQuestionIds = [], scope = 'GLOBAL' } = options;

  // 1. Check if student already has a served Daily Challenge for today
  if (studentId && !options.forceRefresh) {
    const todayLog = await DailyChallengeHistory.findOne({
      studentId,
      challengeDate: todayStr
    });

    if (todayLog) {
      const qDoc = await InterviewQuestion.findOne({ _id: todayLog.questionId, isDailyOnly: true }).select('-hiddenTestCases');
      if (qDoc) {
        return {
          question: qDoc,
          domain: normDomain,
          historyId: todayLog._id,
          status: todayLog.status,
          date: todayStr
        };
      }
    }
  }

  // 2. Get set of excluded fingerprints
  const excludedFingerprints = await getExcludedFingerprints(studentId, normDomain, scope);

  // 3. Find candidate questions in InterviewQuestion database that are strictly isDailyOnly: true
  let categoryFilters = [normDomain, 'general'];
  if (normDomain.includes('femn')) categoryFilters.push('femnstack', 'femn-stack', 'FEMN STACK', 'web', 'javascript', 'react');
  if (normDomain.includes('selenium')) categoryFilters.push('selenium', 'Selenium', 'SELENIUM', 'automation');
  if (normDomain.includes('java') && !normDomain.includes('script')) categoryFilters.push('java', 'Java', 'JAVA');
  if (normDomain.includes('python')) categoryFilters.push('python', 'Python', 'PYTHON');
  if (normDomain.includes('cpp') || normDomain.includes('c++')) categoryFilters.push('cpp', 'c++', 'C++', 'CPP');
  if (normDomain.includes('data')) categoryFilters.push('datascience', 'Data Science', 'python');

  const candidates = await InterviewQuestion.find({
    isDailyOnly: true,
    isActive: true,
    _id: { $nin: excludeQuestionIds },
    $or: [
      { domain: { $in: categoryFilters } },
      { category: { $in: categoryFilters } },
      { tags: { $in: categoryFilters } }
    ]
  }).select('-hiddenTestCases').sort({ questionNumber: 1 });

  // 4. Filter candidates against excluded fingerprints and titles
  let selectedQuestion = null;
  for (const cand of candidates) {
    const fp = generateFingerprint(cand.title, cand.problemStatement, cand.category, cand.domain);
    const normT = normalizeQuestionText(cand.title);

    if (!excludedFingerprints.has(fp) && !excludedFingerprints.has(normT)) {
      selectedQuestion = cand;
      break;
    }
  }

  // 5. If no eligible question remains, return null (DO NOT RECYCLE OR FALL BACK TO INTERVIEW ARENA)
  if (!selectedQuestion) {
    return null;
  }

  // 6. Record served question in DailyChallengeHistory
  const fp = generateFingerprint(selectedQuestion.title, selectedQuestion.problemStatement, selectedQuestion.category, selectedQuestion.domain);
  let historyRecord = null;
  if (studentId) {
    historyRecord = await DailyChallengeHistory.findOneAndUpdate(
      { studentId, challengeDate: todayStr },
      {
        studentId,
        questionId: selectedQuestion._id,
        questionSource: 'InterviewQuestion',
        questionFingerprint: fp,
        challengeDate: todayStr,
        domain: normDomain,
        status: 'SERVED',
        servedAt: new Date()
      },
      { upsert: true, new: true }
    );
  }

  return {
    question: selectedQuestion,
    domain: normDomain,
    historyId: historyRecord ? historyRecord._id : null,
    status: 'SERVED',
    date: todayStr
  };
}

module.exports = {
  normalizeQuestionText,
  generateFingerprint,
  checkDuplicate,
  registerQuestion,
  syncAllQuestionsRegistry,
  getExcludedFingerprints,
  selectUniqueDailyChallenge
};
