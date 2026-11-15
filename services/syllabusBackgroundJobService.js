const mongoose = require('mongoose');
const SyllabusGenerationJob = require('../models/SyllabusGenerationJob');
const Course = require('../models/Course');
const Module = require('../models/Module');
const DomainTask = require('../models/DomainTask');
const StudentDomainProgress = require('../models/StudentDomainProgress');
const { generateTasksForModule } = require('./syllabusGeneratorService');
const { extractCourseSyllabusTopics } = require('./syllabusTopicExtractorService');
const { generateAllSyllabusQuestionBanks } = require('./syllabusQuestionSeederService');
const { captureError } = require('./errorAlertService');
const systemLogger = require('./systemLogger');

/**
 * Creates and initializes a background syllabus task & question generation job.
 * Returns the created job immediately so the HTTP response is instantaneous.
 */
async function createAndStartSyllabusJob({
  course,
  domainKey,
  courseTitle,
  rawText,
  parsedModules,
  tasksPerModule = 12,
  isNewCourse = false
}) {
  course.syllabusText = rawText;
  await course.save().catch(() => {});

  // Pre-create or map Module documents in DB so moduleIds exist
  const moduleProgressItems = [];
  const parsedModuleBlueprints = [];

  for (let i = 0; i < parsedModules.length; i++) {
    const pMod = parsedModules[i];
    const modOrder = i + 1;

    let modDoc = await Module.findOne({
      courseId: course._id,
      order: modOrder
    });

    if (!modDoc) {
      modDoc = await Module.create({
        courseId: course._id,
        domain: domainKey,
        title: pMod.title,
        description: pMod.description || `Syllabus module covering ${pMod.title}.`,
        topics: pMod.topics || [],
        order: modOrder,
        isPublished: true
      });
    } else {
      modDoc.title = pMod.title;
      modDoc.description = pMod.description || modDoc.description;
      if (Array.isArray(pMod.topics) && pMod.topics.length > 0) {
        modDoc.topics = pMod.topics;
      }
      modDoc.domain = domainKey;
      modDoc.isPublished = true;
      await modDoc.save().catch(() => {});
    }

    moduleProgressItems.push({
      moduleId: modDoc._id,
      title: modDoc.title,
      order: modDoc.order,
      status: 'pending',
      progress: 0,
      questionsCount: 0,
      testedCount: 0,
      error: null
    });

    parsedModuleBlueprints.push({
      order: modOrder,
      title: pMod.title,
      description: pMod.description || '',
      topics: pMod.topics || []
    });
  }

  // Create SyllabusGenerationJob document
  const job = await SyllabusGenerationJob.create({
    courseId: course._id,
    domain: domainKey,
    courseTitle: courseTitle || course.title,
    jobType: 'combined',
    syllabusText: rawText,
    tasksPerModule,
    parsedModules: parsedModuleBlueprints,
    status: 'generating',
    progress: 5,
    currentStep: `Syllabus parsed into ${parsedModules.length} modules. Task generation running in background...`,
    stats: {
      totalModules: parsedModules.length,
      completedModules: 0,
      failedModules: 0,
      totalQuestions: 0,
      verifiedCount: 0,
      testedCount: 0,
      flaggedCount: 0
    },
    moduleProgress: moduleProgressItems,
    startedAt: new Date()
  });

  // Run in background asynchronously without blocking the event loop or request
  setImmediate(() => {
    runSyllabusJob(job._id).catch(err => {
      systemLogger.error(`[SyllabusJob Fatal Error]: ${err.message}`, { stack: err.stack, jobId: job._id });
    });
  });

  return job;
}

/**
 * Core Background Execution Engine with per-module persistence and fault isolation.
 */
async function runSyllabusJob(jobId) {
  const job = await SyllabusGenerationJob.findById(jobId);
  if (!job) return;

  const course = await Course.findById(job.courseId);
  if (!course) {
    job.status = 'failed';
    job.error = 'Associated course not found in database.';
    job.completedAt = new Date();
    await job.save();
    return;
  }

  const domainKey = job.domain;
  const tasksPerModule = job.tasksPerModule || 12;
  const allParsedModules = job.parsedModules || [];
  const totalModules = allParsedModules.length;

  let completedModules = job.stats?.completedModules || 0;
  let failedModules = job.stats?.failedModules || 0;

  try {
    // 1. Process modules sequentially with atomic progress updates
    for (let i = 0; i < allParsedModules.length; i++) {
      // Check if job was cancelled by admin
      const checkJob = await SyllabusGenerationJob.findById(jobId).select('status');
      if (checkJob && (checkJob.status === 'cancelled' || checkJob.status === 'stopped')) {
        systemLogger.info(`[SyllabusJob] Job ${jobId} was cancelled by administrator. Halting module processing safely.`);
        return;
      }

      const pMod = allParsedModules[i];
      const modOrder = pMod.order || (i + 1);

      // Check module progress entry in job
      const mProg = job.moduleProgress.find(m => m.order === modOrder);
      if (mProg && mProg.status === 'completed') {
        // Skip already successfully completed module (Protected existing data)
        continue;
      }

      // Update job telemetry: starting this module
      job.currentModule = pMod.title;
      job.currentStep = `Generating tasks for Module ${modOrder}/${totalModules}: ${pMod.title}`;
      if (mProg) {
        mProg.status = 'generating';
        mProg.progress = 25;
      }
      await job.save().catch(() => {});

      try {
        // Find or ensure Module in database
        let mod = await Module.findOne({ courseId: course._id, order: modOrder });
        if (!mod) {
          mod = await Module.create({
            courseId: course._id,
            domain: domainKey,
            title: pMod.title,
            description: pMod.description || '',
            topics: pMod.topics || [],
            order: modOrder,
            isPublished: true
          });
        }

        // Preserve tasks with existing student progress
        const existingTasks = await DomainTask.find({ moduleId: mod._id });
        const tasksWithProgress = await StudentDomainProgress.distinct('domainTaskId', {
          moduleId: mod._id,
          status: { $in: ['in_progress', 'completed'] }
        });
        const preserveTaskIds = new Set(tasksWithProgress.map(id => id.toString()));

        // Delete only uncompleted, non-progress tasks to prevent stale duplicates
        const deletableTaskIds = existingTasks
          .filter(t => !preserveTaskIds.has(t._id.toString()))
          .map(t => t._id);

        if (deletableTaskIds.length > 0) {
          await DomainTask.deleteMany({ _id: { $in: deletableTaskIds } });
        }

        // Generate 10-15 curriculum-aligned tasks for this module
        const taskBlueprints = generateTasksForModule(mod, domainKey, tasksPerModule, allParsedModules, course);

        const tasksToInsert = taskBlueprints.map((tb, j) => ({
          moduleId: mod._id,
          courseId: course._id,
          domain: domainKey,
          topic: tb.topic || '',
          topicId: tb.topicId || '',
          title: tb.title,
          description: tb.description,
          instructions: tb.instructions,
          problemStatement: tb.problemStatement || '',
          inputFormat: tb.inputFormat || '',
          outputFormat: tb.outputFormat || '',
          sampleInput: tb.sampleInput || '',
          sampleOutput: tb.sampleOutput || '',
          expectedOutput: tb.expectedOutput || '',
          constraints: tb.constraints || '',
          starterCode: tb.starterCode || '',
          referenceSolution: tb.referenceSolution || '',
          testingSolution: tb.testingSolution || tb.referenceSolution || '',
          explanation: tb.explanation || '',
          testCases: tb.testCases || [],
          technology: tb.technology || '',
          compiler: tb.compiler || '',
          taskType: tb.taskType,
          difficulty: tb.difficulty,
          points: tb.points,
          estimatedTime: tb.estimatedTime,
          order: j + 1,
          isActive: true,
          isEnabled: true
        }));

        if (tasksToInsert.length > 0) {
          await DomainTask.insertMany(tasksToInsert);
        }

        const taskCount = await DomainTask.countDocuments({ moduleId: mod._id, isActive: true });

        // Mark module complete in job record immediately
        if (mProg) {
          mProg.moduleId = mod._id;
          mProg.status = 'completed';
          mProg.progress = 100;
          mProg.questionsCount = taskCount;
          mProg.completedAt = new Date();
          mProg.error = null;
        }

        completedModules++;
        job.stats.completedModules = completedModules;
        job.progress = Math.min(85, Math.round((completedModules / totalModules) * 85));
        await job.save();

      } catch (modErr) {
        systemLogger.error(`[SyllabusJob] Module ${modOrder} generation failure: ${modErr.message}`, {
          jobId: job._id,
          courseId: course._id,
          moduleOrder: modOrder,
          stack: modErr.stack
        });

        failedModules++;
        job.stats.failedModules = failedModules;

        if (mProg) {
          mProg.status = 'failed';
          mProg.error = modErr.message;
        }

        job.lastErrorDetails = {
          timestamp: new Date(),
          endpoint: '/admin/syllabus/upload-pdf',
          failedModuleId: String(mProg?.moduleId || ''),
          moduleOrder: modOrder,
          statusCode: 500,
          backendException: modErr.message,
          aiProviderError: modErr.code || '',
          stack: modErr.stack || ''
        };

        // Report to system error monitoring
        captureError(modErr, {
          service: 'Syllabus Task Generator',
          severity: 'HIGH',
          endpoint: '/admin/syllabus/upload-pdf',
          impact: `Module ${modOrder} failed to generate tasks. Remaining modules will proceed.`,
          diagnosticDetails: {
            jobId: job._id,
            courseId: course._id,
            moduleOrder: modOrder,
            retryCount: job.retryCount,
            recoveryStatus: job.recoveryStatus
          }
        }).catch(() => {});

        // Save failure for this module and continue independently to next modules
        await job.save().catch(() => {});
      }
    }

    // 2. Archive obsolete modules that are not part of new syllabus
    const activeOrders = new Set(allParsedModules.map(m => m.order));
    const oldModules = await Module.find({ courseId: course._id, order: { $nin: Array.from(activeOrders) } });
    for (const oldMod of oldModules) {
      const hasProgress = await StudentDomainProgress.countDocuments({
        moduleId: oldMod._id,
        status: { $in: ['in_progress', 'completed'] }
      });
      if (hasProgress > 0) {
        oldMod.isPublished = false;
        await oldMod.save().catch(() => {});
      } else {
        await DomainTask.deleteMany({ moduleId: oldMod._id });
        await Module.findByIdAndDelete(oldMod._id);
      }
    }

    // 3. Extract topics and seed question banks (Interview Arena, Mock Interview, Testing Practice)
    job.currentStep = 'Syncing curriculum topics and generating question banks...';
    job.progress = 88;
    await job.save().catch(() => {});

    await extractCourseSyllabusTopics(course._id).catch(e => {
      systemLogger.warn(`[SyllabusJob] extractCourseSyllabusTopics warning: ${e.message}`);
    });

    try {
      await generateAllSyllabusQuestionBanks(course._id, {
        onProgress: async (p) => {
          job.progress = Math.min(98, 88 + Math.round((p.percent || 0) * 0.10));
          job.currentStep = `Seeding Question Banks: Module ${p.moduleOrder} (${p.percent || 0}%)`;
          await job.save().catch(() => {});
        }
      });
    } catch (bankErr) {
      systemLogger.warn(`[SyllabusJob] Question bank seeding warning: ${bankErr.message}`);
    }

    // Final live counts from database
    const [finalArena, finalMock, finalModuleQ, finalTasks, finalTested, flaggedArena, flaggedTask] = await Promise.all([
      DomainTask.countDocuments({ courseId: course._id }),
      DomainTask.countDocuments({ courseId: course._id, isTested: true }),
      DomainTask.countDocuments({ courseId: course._id, verificationStatus: 'flagged' }),
      DomainTask.countDocuments({ courseId: course._id }),
      DomainTask.countDocuments({ courseId: course._id, isTested: true }),
      DomainTask.countDocuments({ courseId: course._id, verificationStatus: 'flagged' }),
      DomainTask.countDocuments({ courseId: course._id, verificationStatus: 'flagged' })
    ]);

    const totalQuestions = finalArena + finalMock + finalModuleQ + finalTasks;

    job.stats.totalQuestions = totalQuestions;
    job.stats.testedCount = finalTested;
    job.stats.flaggedCount = flaggedArena + flaggedTask;

    if (failedModules > 0 && completedModules > 0) {
      job.status = 'partial';
      job.error = `Partial Completion: ${completedModules} of ${totalModules} module(s) completed successfully. ${failedModules} module(s) encountered issues. You can resume to retry incomplete modules.`;
      job.completedAt = new Date();
    } else if (failedModules > 0 && completedModules === 0) {
      job.status = 'failed';
      job.error = `Generation encountered issues across modules. Click Resume to retry.`;
      job.completedAt = new Date();
    } else {
      job.status = 'completed';
      job.progress = 100;
      job.currentStep = `All ${totalModules} syllabus modules, tasks, and question banks successfully generated and verified.`;
      job.completedAt = new Date();
      job.error = null;
    }

    await job.save();
    systemLogger.info(`[SyllabusJob Completed] Course: ${course.title}, Status: ${job.status}, Completed: ${completedModules}/${totalModules}`);

  } catch (fatalErr) {
    systemLogger.fatal(`[SyllabusJob Fatal]: ${fatalErr.message}`, { stack: fatalErr.stack });
    job.status = 'failed';
    job.error = `Generation halted unexpectedly: ${fatalErr.message}. You can click Resume to continue from the last saved module.`;
    job.completedAt = new Date();
    await job.save().catch(() => {});

    captureError(fatalErr, {
      service: 'Syllabus Background Job Worker',
      severity: 'CRITICAL',
      endpoint: '/admin/syllabus/upload-pdf',
      impact: 'Entire syllabus generation process interrupted',
      diagnosticDetails: { jobId: job._id, courseId: course._id }
    }).catch(() => {});
  }
}

/**
 * Resume an interrupted or failed generation job from the exact point of interruption.
 * Skips already-completed modules and guarantees zero task duplication.
 */
async function resumeSyllabusJob(jobId) {
  const job = await SyllabusGenerationJob.findById(jobId);
  if (!job) {
    throw new Error(`Generation job not found for ID: ${jobId}`);
  }

  job.status = 'generating';
  job.recoveryStatus = 'resumed';
  job.retryCount = (job.retryCount || 0) + 1;
  job.currentStep = `Resuming generation (Attempt #${job.retryCount}). Checking completed modules...`;
  await job.save();

  setImmediate(() => {
    runSyllabusJob(job._id).catch(err => {
      systemLogger.error(`[ResumeSyllabusJob Error]: ${err.message}`, { stack: err.stack, jobId: job._id });
    });
  });

  return job;
}

/**
 * Startup Watchdog Recovery: Detects any orphaned jobs that were left in 'generating'
 * state due to a server restart or crash, and marks them recoverable.
 */
async function autoRecoverStalledJobs() {
  try {
    const STALL_THRESHOLD_MS = 3 * 60 * 1000; // 3 minutes
    const staleTime = new Date(Date.now() - STALL_THRESHOLD_MS);

    const stalledJobs = await SyllabusGenerationJob.find({
      status: 'generating',
      updatedAt: { $lt: staleTime }
    });

    for (const sj of stalledJobs) {
      sj.status = 'failed';
      sj.error = 'Server restarted or connection reset while generation was in progress. Click Resume to continue from the last saved module without losing progress.';
      sj.recoveryStatus = 'recovering';
      await sj.save();
      systemLogger.warn(`[Watchdog Auto-Recovery] Marked stalled generation job ${sj._id} for course "${sj.courseTitle}" as resumable.`);
    }
  } catch (err) {
    systemLogger.error(`[AutoRecoverStalledJobs Error]: ${err.message}`);
  }
}

module.exports = {
  createAndStartSyllabusJob,
  runSyllabusJob,
  resumeSyllabusJob,
  autoRecoverStalledJobs
};
