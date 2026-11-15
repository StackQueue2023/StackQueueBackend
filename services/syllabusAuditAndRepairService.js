/**
 * STACK QUEUE — Global Syllabus Question Audit, Backup & Repair Service (STAGE 1)
 *
 * Scans ALL courses, modules, and question banks in MongoDB:
 *   - Keeps valid module-aligned questions untouched (backfilling missing topicId/metadata only)
 *   - Backs up invalid/unrelated/future-concept/duplicate/broken-solution questions into QuestionBackup
 *   - Preserves student submissions (InterviewSubmission), Game Hub attempts (Attempt), and Domain progress (StudentDomainProgress)
 *   - Deactivates or replaces invalid questions so students never receive out-of-scope problems
 *   - Regenerates missing/invalid slots cleanly via the strict module-scoped generator + validator
 */

const Course = require('../models/Course');
const Module = require('../models/Module');
const DomainTask = require('../models/DomainTask');
const InterviewQuestion = require('../models/InterviewQuestion');
const InterviewTestCase = require('../models/InterviewTestCase');
const Challenge = require('../models/Challenge');
const InterviewSubmission = require('../models/InterviewSubmission');
const Attempt = require('../models/Attempt');
const StudentDomainProgress = require('../models/StudentDomainProgress');
const QuestionBackup = require('../models/QuestionBackup');
const { extractCourseSyllabusTopics } = require('./syllabusTopicExtractorService');
const { analyzeModuleScope, buildTopicId } = require('./moduleScopeEngine');
const { validateGeneratedQuestion } = require('./questionValidationService');
const { generateFingerprint } = require('./questionRegistryService');
const {
  generateSyllabusQuestions,
  ensureDomainGame,
  normalizeDomainKey
} = require('./syllabusQuestionGeneratorService');
const { generateAllSyllabusQuestionBanks } = require('./syllabusQuestionSeederService');

/**
 * Audit and repair a single module across InterviewQuestion, Challenge, and DomainTask.
 */
async function auditAndRepairModule({
  course,
  mod,
  allModules,
  submittedIQSet,
  attemptedChallengeSet,
  activeTaskSet,
  runSandbox = true
}) {
  const scope = analyzeModuleScope(mod, allModules, course);
  const domainKey = normalizeDomainKey(course.slug || course.domain || course.title);

  const summary = {
    moduleId: mod._id,
    moduleOrder: mod.order,
    moduleTitle: mod.title,
    kept: 0,
    repairedOrDeactivated: 0,
    backupsCreated: 0,
    rejectionReasons: []
  };

  // 1. Audit InterviewQuestions for this module (ARENA, MODULE_QUESTIONS, MOCK_INTERVIEW, DAILY_CHALLENGE)
  const iqDocs = await InterviewQuestion.find({ moduleId: mod._id, isActive: { $ne: false } }).lean();
  const iqIds = iqDocs.map(d => d._id);
  const tcByQId = new Map();
  if (iqIds.length > 0) {
    const tcDocs = await InterviewTestCase.find({ questionId: { $in: iqIds } }).lean();
    for (const tc of tcDocs) {
      const k = String(tc.questionId);
      if (!tcByQId.has(k)) tcByQId.set(k, []);
      tcByQId.get(k).push(tc);
    }
  }

  const seenByBank = {};
  const backupBatch = [];
  const deactivateIQIds = [];
  const deleteIQIds = [];

  for (const q of iqDocs) {
    const bankKey = q.targetFeature || 'INTERVIEW_ARENA';
    if (!seenByBank[bankKey]) seenByBank[bankKey] = new Set();

    const fp = generateFingerprint(q.title || '', q.problemStatement || '', mod.title, domainKey);
    const isDuplicate = seenByBank[bankKey].has(fp);

    const tcs = tcByQId.get(String(q._id)) || [];
    const testCasesForVal = tcs.length > 0
      ? tcs
      : (Array.isArray(q.examples) ? q.examples.map((ex, i) => ({
          input: ex.input || '',
          expectedOutput: ex.output || '',
          isHidden: i > 0
        })) : []);

    // Already verified? Only re-run full static + concept + language check; run sandbox if untested or flagged
    const shouldRunSandbox = Boolean(runSandbox && (!q.isTested || q.verificationStatus !== 'tested'));

    const validation = isDuplicate
      ? { valid: false, reason: 'Duplicate question detected within module bank' }
      : await validateGeneratedQuestion({
          question: {
            title: q.title,
            topic: q.topic,
            problemStatement: q.problemStatement,
            inputFormat: q.inputFormat,
            outputFormat: q.outputFormat || 'Expected standard output',
            programmingLanguage: q.programmingLanguage,
            referenceSolution: q.referenceSolution || q.testingSolution || '',
            testingSolution: q.testingSolution || q.referenceSolution || '',
            testCases: testCasesForVal
          },
          scope,
          runSandbox: shouldRunSandbox,
          existingFingerprints: seenByBank[bankKey],
          fingerprint: fp
        });

    if (validation.valid) {
      seenByBank[bankKey].add(fp);
      summary.kept++;

      // Backfill missing strict metadata non-destructively
      const updates = {};
      if (!q.topicId && scope.topics.length > 0) {
        const tIdx = Math.max(0, scope.topics.indexOf(q.topic));
        updates.topicId = buildTopicId(mod._id, q.topic || scope.topics[0], tIdx);
      }
      if (!q.testingSolution && q.referenceSolution) {
        updates.testingSolution = q.referenceSolution;
      }
      if (q.verificationStatus !== 'tested' && (shouldRunSandbox || q.isTested)) {
        updates.verificationStatus = 'tested';
        updates.isTested = true;
      }
      if (Object.keys(updates).length > 0) {
        await InterviewQuestion.updateOne({ _id: q._id }, { $set: updates });
      }
    } else {
      const hasActivity = submittedIQSet.has(String(q._id));
      backupBatch.push({
        originalId: q._id,
        collectionName: 'InterviewQuestion',
        targetFeature: bankKey,
        courseId: course._id,
        moduleId: mod._id,
        topic: q.topic || '',
        topicId: q.topicId || '',
        reason: validation.reason || 'Failed strict module audit',
        actionTaken: hasActivity ? 'deactivated' : 'replaced',
        hasStudentActivity: hasActivity,
        snapshot: { ...q, testCases: tcs }
      });

      if (hasActivity) {
        deactivateIQIds.push(q._id);
      } else {
        deleteIQIds.push(q._id);
      }
      summary.repairedOrDeactivated++;
      summary.rejectionReasons.push(`[IQ:${bankKey}] ${validation.reason}`);
    }
  }

  // 2. Audit Game Hub Challenges for this module
  const chDocs = await Challenge.find({ moduleId: mod._id, isActive: { $ne: false } }).lean();
  const seenCh = new Set();
  const deactivateChIds = [];
  const deleteChIds = [];

  for (const ch of chDocs) {
    const fp = generateFingerprint(ch.title || '', ch.description || '', mod.title, domainKey);
    const isDuplicate = seenCh.has(fp);
    const shouldRunSandbox = Boolean(runSandbox && (!ch.isTested || ch.verificationStatus !== 'tested'));

    const validation = isDuplicate
      ? { valid: false, reason: 'Duplicate Game Hub challenge in module' }
      : await validateGeneratedQuestion({
          question: {
            title: ch.title,
            topic: ch.topic,
            problemStatement: ch.description,
            outputFormat: 'Expected challenge output',
            programmingLanguage: ch.language,
            referenceSolution: ch.solutionCode || ch.testingSolution || '',
            testingSolution: ch.testingSolution || ch.solutionCode || '',
            testCases: ch.testCases || []
          },
          scope,
          runSandbox: shouldRunSandbox,
          existingFingerprints: seenCh,
          fingerprint: fp
        });

    if (validation.valid) {
      seenCh.add(fp);
      summary.kept++;
      const chUpdates = {};
      if (!ch.topicId && scope.topics.length > 0) {
        const tIdx = Math.max(0, scope.topics.indexOf(ch.topic));
        chUpdates.topicId = buildTopicId(mod._id, ch.topic || scope.topics[0], tIdx);
      }
      if (!ch.testingSolution && ch.solutionCode) chUpdates.testingSolution = ch.solutionCode;
      if (Object.keys(chUpdates).length > 0) {
        await Challenge.updateOne({ _id: ch._id }, { $set: chUpdates });
      }
    } else {
      const hasActivity = attemptedChallengeSet.has(String(ch._id));
      backupBatch.push({
        originalId: ch._id,
        collectionName: 'Challenge',
        targetFeature: ch.targetFeature || 'GAME_HUB',
        courseId: course._id,
        moduleId: mod._id,
        topic: ch.topic || '',
        topicId: ch.topicId || '',
        reason: validation.reason || 'Failed strict Game Hub audit',
        actionTaken: hasActivity ? 'deactivated' : 'replaced',
        hasStudentActivity: hasActivity,
        snapshot: ch
      });

      if (hasActivity) deactivateChIds.push(ch._id);
      else deleteChIds.push(ch._id);

      summary.repairedOrDeactivated++;
      summary.rejectionReasons.push(`[Challenge] ${validation.reason}`);
    }
  }

  // 3. Audit DomainTasks (Module Practice)
  const taskDocs = await DomainTask.find({ moduleId: mod._id, isActive: { $ne: false } }).lean();
  const seenTasks = new Set();
  const deactivateTaskIds = [];
  const deleteTaskIds = [];

  for (const t of taskDocs) {
    const fp = generateFingerprint(t.title || '', t.problemStatement || t.description || '', mod.title, domainKey);
    const isDuplicate = seenTasks.has(fp);
    const shouldRunSandbox = Boolean(runSandbox && (!t.isTested || t.verificationStatus !== 'tested'));

    const validation = isDuplicate
      ? { valid: false, reason: 'Duplicate Module Practice task in module' }
      : await validateGeneratedQuestion({
          question: {
            title: t.title,
            topic: t.topic,
            problemStatement: t.problemStatement || t.description,
            inputFormat: t.inputFormat || t.inputDescription,
            outputFormat: t.outputFormat || 'Expected task output',
            programmingLanguage: scope.language,
            referenceSolution: t.referenceSolution || t.testingSolution || '',
            testingSolution: t.testingSolution || t.referenceSolution || '',
            testCases: t.testCases || []
          },
          scope,
          runSandbox: shouldRunSandbox,
          existingFingerprints: seenTasks,
          fingerprint: fp
        });

    if (validation.valid) {
      seenTasks.add(fp);
      summary.kept++;
      const tUpdates = {};
      if (!t.topicId && scope.topics.length > 0) {
        tUpdates.topicId = buildTopicId(mod._id, t.topic || scope.topics[0], 0);
      }
      if (!t.testingSolution && t.referenceSolution) tUpdates.testingSolution = t.referenceSolution;
      if (Object.keys(tUpdates).length > 0) {
        await DomainTask.updateOne({ _id: t._id }, { $set: tUpdates });
      }
    } else {
      const hasActivity = activeTaskSet.has(String(t._id));
      backupBatch.push({
        originalId: t._id,
        collectionName: 'DomainTask',
        targetFeature: t.targetFeature || 'TESTING_PRACTICE',
        courseId: course._id,
        moduleId: mod._id,
        topic: t.topic || '',
        topicId: t.topicId || '',
        reason: validation.reason || 'Failed strict DomainTask audit',
        actionTaken: hasActivity ? 'deactivated' : 'replaced',
        hasStudentActivity: hasActivity,
        snapshot: t
      });

      if (hasActivity) deactivateTaskIds.push(t._id);
      else deleteTaskIds.push(t._id);

      summary.repairedOrDeactivated++;
      summary.rejectionReasons.push(`[DomainTask] ${validation.reason}`);
    }
  }

  // Persist backups FIRST before modifying or deleting any invalid records
  if (backupBatch.length > 0) {
    await QuestionBackup.insertMany(backupBatch, { ordered: false });
    summary.backupsCreated = backupBatch.length;
  }

  if (deactivateIQIds.length > 0) {
    await InterviewQuestion.updateMany({ _id: { $in: deactivateIQIds } }, { $set: { isActive: false, verificationStatus: 'flagged' } });
  }
  if (deleteIQIds.length > 0) {
    await InterviewTestCase.deleteMany({ questionId: { $in: deleteIQIds } });
    await InterviewQuestion.deleteMany({ _id: { $in: deleteIQIds } });
  }

  if (deactivateChIds.length > 0) {
    await Challenge.updateMany({ _id: { $in: deactivateChIds } }, { $set: { isActive: false, verificationStatus: 'flagged' } });
  }
  if (deleteChIds.length > 0) {
    await Challenge.deleteMany({ _id: { $in: deleteChIds } });
  }

  if (deactivateTaskIds.length > 0) {
    await DomainTask.updateMany({ _id: { $in: deactivateTaskIds } }, { $set: { isActive: false, verificationStatus: 'flagged' } });
  }
  if (deleteTaskIds.length > 0) {
    await DomainTask.deleteMany({ _id: { $in: deleteTaskIds } });
  }

  // Persist updated module topicsSignature if invalid items were pruned so missing slots trigger refill
  if (summary.repairedOrDeactivated > 0) {
    await Module.findByIdAndUpdate(mod._id, { $set: { topicsSignature: '' } });
  }

  return summary;
}

/**
 * STAGE 1 ORCHESTRATOR:
 * Scans ALL existing courses & modules, backs up & repairs invalid/out-of-scope questions,
 * keeps valid ones, and fills any uncovered topic/difficulty gaps across all 5 question banks.
 */
async function auditAndRepairAllCourses(options = {}) {
  const { runSandbox = true, regenerateMissing = true, courseId = null } = options;
  const query = courseId ? { _id: courseId } : {};
  const courses = await Course.find(query).sort({ title: 1 });

  const [submittedIQIds, attemptedChallengeIds, activeTaskIds] = await Promise.all([
    InterviewSubmission.distinct('questionId'),
    Attempt.distinct('challengeId'),
    StudentDomainProgress.distinct('domainTaskId', { status: { $in: ['in_progress', 'completed'] } })
  ]);

  const submittedIQSet = new Set(submittedIQIds.map(id => String(id)));
  const attemptedChallengeSet = new Set(attemptedChallengeIds.map(id => String(id)));
  const activeTaskSet = new Set(activeTaskIds.map(id => String(id)));

  const report = {
    coursesScanned: courses.length,
    totalModulesScanned: 0,
    totalKept: 0,
    totalRepairedOrDeactivated: 0,
    totalBackupsCreated: 0,
    courseResults: []
  };

  for (const course of courses) {
    await extractCourseSyllabusTopics(course._id);
    const domainKey = normalizeDomainKey(course.slug || course.domain || course.title);
    await ensureDomainGame(domainKey, course.title);

    const modules = await Module.find({
      courseId: course._id,
      isPublished: { $ne: false }
    }).sort({ order: 1 });

    let courseKept = 0;
    let courseRepaired = 0;
    let courseBackups = 0;

    for (const mod of modules) {
      const mRes = await auditAndRepairModule({
        course,
        mod,
        allModules: modules,
        submittedIQSet,
        attemptedChallengeSet,
        activeTaskSet,
        runSandbox
      });
      report.totalModulesScanned++;
      courseKept += mRes.kept;
      courseRepaired += mRes.repairedOrDeactivated;
      courseBackups += mRes.backupsCreated;
    }

    report.totalKept += courseKept;
    report.totalRepairedOrDeactivated += courseRepaired;
    report.totalBackupsCreated += courseBackups;

    let refillStats = null;
    let seederStats = null;
    if (regenerateMissing) {
      // Fill uncovered slots non-destructively (valid questions were preserved above)
      const genRes = await generateSyllabusQuestions(course._id, {
        forceRegenerate: false,
        questionsPerTopic: 2
      });
      refillStats = genRes.stats;

      const seedRes = await generateAllSyllabusQuestionBanks(course._id, {
        forceRegenerate: false
      });
      seederStats = seedRes.createdQuestions;
    }

    report.courseResults.push({
      courseId: course._id,
      courseTitle: course.title,
      modulesScanned: modules.length,
      kept: courseKept,
      repairedOrDeactivated: courseRepaired,
      backupsCreated: courseBackups,
      refillStats,
      seederStats
    });
  }

  return report;
}

module.exports = {
  auditAndRepairModule,
  auditAndRepairAllCourses
};
