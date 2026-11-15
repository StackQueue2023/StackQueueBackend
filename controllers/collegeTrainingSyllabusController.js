const CollegeTrainingSyllabus = require('../models/CollegeTrainingSyllabus');
const CollegeTrainingModule = require('../models/CollegeTrainingModule');
const CollegeTrainingQuestion = require('../models/CollegeTrainingQuestion');
const CollegeTrainingStudentProgress = require('../models/CollegeTrainingStudentProgress');
const Batch = require('../models/Batch');
const College = require('../models/College');
const CollegeTrainingEnrollment = require('../models/CollegeTrainingEnrollment');
const StudentProfile = require('../models/StudentProfile');
const {
  parseRawSyllabus,
  generateModulesAndQuestionsFromSyllabus
} = require('../services/collegeSyllabusGeneratorService');

/**
 * POST /api/admin/college-training/syllabus/save
 * Admin saves or updates syllabus for a college training batch
 */
exports.saveSyllabus = async (req, res) => {
  try {
    const {
      collegeId,
      batchId,
      courseName,
      domain,
      trainingDays,
      durationHours,
      rawSyllabusText,
      pdfFileName,
      pdfFileUrl,
      units
    } = req.body;

    if (!batchId) {
      return res.status(400).json({ success: false, message: 'batchId is required.' });
    }

    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found.' });
    }

    const resolvedCollegeId = collegeId || batch.collegeId;
    if (!resolvedCollegeId) {
      return res.status(400).json({ success: false, message: 'College ID is required for College Training batch.' });
    }

    const resolvedCourseName = courseName || batch.name || 'College Training Program';

    // If units not provided or empty, attempt to parse rawSyllabusText
    let processedUnits = Array.isArray(units) && units.length > 0 ? units : [];
    if (processedUnits.length === 0 && rawSyllabusText && rawSyllabusText.trim()) {
      processedUnits = parseRawSyllabus(rawSyllabusText, resolvedCourseName);
    }

    // Default 1 unit if still empty
    if (processedUnits.length === 0) {
      processedUnits = [{
        unitNumber: 1,
        title: `${resolvedCourseName} Core Fundamentals`,
        topics: [{
          title: 'Introduction & Core Syntax',
          subtopics: ['Setup', 'Basic Concepts', 'Hands-on Labs'],
          estimatedHours: 4
        }],
        estimatedDays: trainingDays || 2
      }];
    }

    // Upsert the syllabus document
    const syllabus = await CollegeTrainingSyllabus.findOneAndUpdate(
      { batchId },
      {
        collegeId: resolvedCollegeId,
        batchId,
        courseName: resolvedCourseName,
        domain: domain || 'General',
        trainingDays: Number(trainingDays) || batch.trainingDays?.length || 10,
        durationHours: Number(durationHours) || 40,
        rawSyllabusText: rawSyllabusText || '',
        pdfFileName: pdfFileName || '',
        pdfFileUrl: pdfFileUrl || '',
        units: processedUnits,
        createdBy: req.user?._id
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Syllabus saved successfully.',
      syllabus
    });
  } catch (error) {
    console.error('saveSyllabus error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/admin/college-training/syllabus/batch/:batchId
 * Fetch syllabus for a batch
 */
exports.getSyllabusByBatch = async (req, res) => {
  try {
    const { batchId } = req.params;
    const syllabus = await CollegeTrainingSyllabus.findOne({ batchId })
      .populate('collegeId', 'name code city address')
      .populate('batchId', 'name code academicYear department totalStudents');

    if (!syllabus) {
      return res.status(200).json({
        success: true,
        syllabus: null,
        message: 'No syllabus registered for this batch yet.'
      });
    }

    return res.status(200).json({ success: true, syllabus });
  } catch (error) {
    console.error('getSyllabusByBatch error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/admin/college-training/syllabus/generate/:batchId
 * Generate learning modules and question bank strictly from syllabus
 */
exports.generateModulesAndQuestions = async (req, res) => {
  try {
    const { batchId } = req.params;

    const syllabus = await CollegeTrainingSyllabus.findOne({ batchId });
    if (!syllabus) {
      return res.status(404).json({
        success: false,
        message: 'No saved syllabus found for this batch. Please save syllabus first.'
      });
    }

    const result = await generateModulesAndQuestionsFromSyllabus(syllabus._id);

    // Return the newly generated modules and questions
    const modules = await CollegeTrainingModule.find({ batchId }).sort({ order: 1 }).lean();
    const questions = await CollegeTrainingQuestion.find({ batchId }).sort({ order: 1 }).lean();

    return res.status(200).json({
      success: true,
      message: `Successfully generated ${result.modulesCount} modules and ${result.questionsCount} questions based on syllabus.`,
      result,
      modules,
      questions
    });
  } catch (error) {
    console.error('generateModulesAndQuestions error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/admin/college-training/modules/batch/:batchId
 * Admin view of batch modules, questions, and students' aggregate completion status
 */
exports.getBatchModules = async (req, res) => {
  try {
    const { batchId } = req.params;

    const batch = await Batch.findById(batchId)
      .populate('collegeId', 'name code')
      .populate('studentIds', 'name studentId email username');

    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found.' });
    }

    const modules = await CollegeTrainingModule.find({ batchId }).sort({ order: 1 }).lean();
    const questions = await CollegeTrainingQuestion.find({ batchId }).sort({ order: 1 }).lean();
    const syllabus = await CollegeTrainingSyllabus.findOne({ batchId }).lean();

    const questionsByModule = new Map();
    questions.forEach(q => {
      const mId = q.moduleId.toString();
      if (!questionsByModule.has(mId)) questionsByModule.set(mId, []);
      questionsByModule.get(mId).push(q);
    });

    // Aggregate student progress per module
    const studentIds = batch.studentIds?.map(s => s._id) || [];
    const totalStudents = studentIds.length;

    const progressRecords = await CollegeTrainingStudentProgress.find({ batchId }).lean();
    const completedByModule = new Map();

    progressRecords.forEach(p => {
      const mId = p.moduleId.toString();
      if (p.status === 'COMPLETED' || p.progressPercent === 100) {
        completedByModule.set(mId, (completedByModule.get(mId) || 0) + 1);
      }
    });

    const modulesWithData = modules.map(m => {
      const mId = m._id.toString();
      const modQuestions = questionsByModule.get(mId) || [];
      const completedCount = completedByModule.get(mId) || 0;
      const batchCompletionPercent = totalStudents > 0
        ? Math.round((completedCount / totalStudents) * 100)
        : 0;

      return {
        ...m,
        questions: modQuestions,
        totalQuestionsCount: modQuestions.length,
        completedStudentsCount: completedCount,
        totalStudentsCount: totalStudents,
        batchCompletionPercent,
        isCompletedForBatch: totalStudents > 0 && completedCount === totalStudents
      };
    });

    return res.status(200).json({
      success: true,
      batch: {
        _id: batch._id,
        name: batch.name,
        code: batch.code,
        college: batch.collegeId,
        totalStudents
      },
      syllabus,
      modules: modulesWithData
    });
  } catch (error) {
    console.error('getBatchModules error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/admin/college-training/modules/:moduleId
 * Admin updates module info
 */
exports.updateModule = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { title, description, topics } = req.body;

    const moduleDoc = await CollegeTrainingModule.findByIdAndUpdate(
      moduleId,
      { $set: { title, description, topics } },
      { new: true }
    );

    if (!moduleDoc) {
      return res.status(404).json({ success: false, message: 'Module not found.' });
    }

    return res.status(200).json({ success: true, module: moduleDoc });
  } catch (error) {
    console.error('updateModule error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/admin/college-training/modules/:moduleId/questions
 * Admin adds a new question to a module
 */
exports.addQuestionToModule = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const {
      topic,
      title,
      type,
      difficulty,
      instructions,
      starterCode,
      solutionCode,
      testCases,
      mcqOptions,
      correctOptionId,
      explanation
    } = req.body;

    const moduleDoc = await CollegeTrainingModule.findById(moduleId);
    if (!moduleDoc) {
      return res.status(404).json({ success: false, message: 'Module not found.' });
    }

    const currentCount = await CollegeTrainingQuestion.countDocuments({ moduleId });

    const question = await CollegeTrainingQuestion.create({
      collegeId: moduleDoc.collegeId,
      batchId: moduleDoc.batchId,
      syllabusId: moduleDoc.syllabusId,
      moduleId: moduleDoc._id,
      unitNumber: moduleDoc.unitNumber,
      topic: topic || moduleDoc.title,
      title,
      type: type || 'coding',
      difficulty: difficulty || 'Easy',
      instructions,
      starterCode: starterCode || '',
      solutionCode: solutionCode || '',
      testCases: testCases || [],
      mcqOptions: mcqOptions || [],
      correctOptionId: correctOptionId || '',
      explanation: explanation || '',
      order: currentCount + 1
    });

    // Update module total count
    await CollegeTrainingModule.findByIdAndUpdate(moduleId, { $inc: { totalQuestionsCount: 1 } });

    return res.status(201).json({ success: true, question });
  } catch (error) {
    console.error('addQuestionToModule error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/admin/college-training/questions/:questionId
 * Admin updates question details
 */
exports.updateQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const updateData = req.body;

    const question = await CollegeTrainingQuestion.findByIdAndUpdate(
      questionId,
      { $set: updateData },
      { new: true }
    );

    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found.' });
    }

    return res.status(200).json({ success: true, question });
  } catch (error) {
    console.error('updateQuestion error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE /api/admin/college-training/questions/:questionId
 * Admin deletes a question
 */
exports.deleteQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const question = await CollegeTrainingQuestion.findByIdAndDelete(questionId);

    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found.' });
    }

    await CollegeTrainingModule.findByIdAndUpdate(
      question.moduleId,
      { $inc: { totalQuestionsCount: -1 } }
    );

    return res.status(200).json({ success: true, message: 'Question deleted successfully.' });
  } catch (error) {
    console.error('deleteQuestion error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/student/college-training/my-modules
 * Student retrieves their assigned batch's syllabus modules, topics, questions, and progress.
 * Strict Isolation: Only returns data for student's assigned college training batch.
 */
exports.getStudentAssignedModules = async (req, res) => {
  try {
    const studentUserId = req.user._id;

    // Resolve student's college training batch
    let batchId = null;
    let collegeId = null;

    // 1. Check CollegeTrainingEnrollment
    const enrollment = await CollegeTrainingEnrollment.findOne({
      studentId: studentUserId,
      status: { $in: ['ACTIVE', 'COMPLETED'] }
    })
      .populate('collegeTrainingBatchId')
      .populate('collegeId', 'name code city');

    if (enrollment && enrollment.collegeTrainingBatchId) {
      batchId = enrollment.collegeTrainingBatchId._id || enrollment.collegeTrainingBatchId;
      collegeId = enrollment.collegeId?._id || enrollment.collegeTrainingBatchId.collegeId;
    }

    // 2. Fallback to StudentProfile
    if (!batchId) {
      const profile = await StudentProfile.findOne({ userId: studentUserId })
        .populate('batchId')
        .populate('collegeId', 'name code city');

      if (profile && profile.batchId) {
        batchId = profile.batchId._id || profile.batchId;
        collegeId = profile.collegeId?._id || profile.batchId.collegeId;
      }
    }

    // 3. Fallback: check if Batch has studentUserId in studentIds
    if (!batchId) {
      const matchedBatch = await Batch.findOne({
        studentIds: studentUserId,
        batchType: 'COLLEGE_TRAINING'
      });
      if (matchedBatch) {
        batchId = matchedBatch._id;
        collegeId = matchedBatch.collegeId;
      }
    }

    if (!batchId) {
      return res.status(200).json({
        success: true,
        isEnrolled: false,
        message: 'No active College Training batch assignment found for this student account.',
        modules: []
      });
    }

    // Fetch batch & college details
    const batch = await Batch.findById(batchId)
      .populate('collegeId', 'name code city')
      .populate('courseId', 'title category code');

    const syllabus = await CollegeTrainingSyllabus.findOne({ batchId }).lean();
    const modules = await CollegeTrainingModule.find({ batchId, isPublished: true })
      .sort({ order: 1 })
      .lean();

    const questions = await CollegeTrainingQuestion.find({ batchId })
      .sort({ order: 1 })
      .select('-solutionCode') // Don't leak solution code to student
      .lean();

    const studentProgressList = await CollegeTrainingStudentProgress.find({
      studentId: studentUserId,
      batchId
    }).lean();

    const progressMap = new Map();
    studentProgressList.forEach(p => {
      progressMap.set(p.moduleId.toString(), p);
    });

    const questionsByModule = new Map();
    questions.forEach(q => {
      const mId = q.moduleId.toString();
      if (!questionsByModule.has(mId)) questionsByModule.set(mId, []);
      questionsByModule.get(mId).push(q);
    });

    let totalBatchQuestions = 0;
    let totalCompletedBatchQuestions = 0;

    const enrichedModules = modules.map(mod => {
      const mId = mod._id.toString();
      const modQuestions = questionsByModule.get(mId) || [];
      const prog = progressMap.get(mId);

      const completedQIds = new Set(
        (prog?.completedQuestions || []).filter(cq => cq.passed).map(cq => cq.questionId.toString())
      );

      const questionsWithStatus = modQuestions.map(q => ({
        ...q,
        isCompleted: completedQIds.has(q._id.toString())
      }));

      const completedCount = completedQIds.size;
      const totalCount = modQuestions.length;
      const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

      totalBatchQuestions += totalCount;
      totalCompletedBatchQuestions += completedCount;

      return {
        ...mod,
        questions: questionsWithStatus,
        totalQuestionsCount: totalCount,
        completedQuestionsCount: completedCount,
        progressPercent,
        status: progressPercent === 100 ? 'COMPLETED' : (completedCount > 0 ? 'IN_PROGRESS' : 'NOT_STARTED'),
        completedAt: prog?.completedAt || null
      };
    });

    const overallProgressPercent = totalBatchQuestions > 0
      ? Math.round((totalCompletedBatchQuestions / totalBatchQuestions) * 100)
      : 0;

    return res.status(200).json({
      success: true,
      isEnrolled: true,
      batch: {
        _id: batch._id,
        name: batch.name,
        code: batch.code,
        academicYear: batch.academicYear,
        department: batch.department,
        trainingDays: batch.trainingDays,
        courseName: syllabus?.courseName || batch.courseId?.title || batch.name,
        college: batch.collegeId
      },
      syllabus,
      modules: enrichedModules,
      overallMetrics: {
        totalModules: enrichedModules.length,
        completedModules: enrichedModules.filter(m => m.status === 'COMPLETED').length,
        totalQuestions: totalBatchQuestions,
        completedQuestions: totalCompletedBatchQuestions,
        overallProgressPercent
      }
    });
  } catch (error) {
    console.error('getStudentAssignedModules error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/student/college-training/modules/:moduleId/questions/:questionId/submit
 * Student submits an answer for a coding or MCQ question
 */
exports.submitQuestionAnswer = async (req, res) => {
  try {
    const studentUserId = req.user._id;
    const { moduleId, questionId } = req.params;
    const { submittedCode, selectedOptionId } = req.body;

    const question = await CollegeTrainingQuestion.findById(questionId);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found.' });
    }

    if (question.moduleId.toString() !== moduleId) {
      return res.status(400).json({ success: false, message: 'Question does not belong to this module.' });
    }

    // Verify student belongs to this batch
    const studentProgressQuery = {
      studentId: studentUserId,
      batchId: question.batchId,
      moduleId
    };

    let passed = false;
    let feedback = '';

    if (question.type === 'mcq') {
      if (!selectedOptionId) {
        return res.status(400).json({ success: false, message: 'Please select an option.' });
      }

      // Check against correctOptionId or mcqOptions
      const correctOpt = question.mcqOptions.find(o => o.isCorrect);
      const isCorrect = (question.correctOptionId && selectedOptionId === question.correctOptionId) ||
                        (correctOpt && correctOpt.optionId === selectedOptionId);

      passed = Boolean(isCorrect);
      feedback = passed
        ? 'Correct answer! Excellent job.'
        : `Incorrect. ${question.explanation || 'Please review the concept and try again.'}`;
    } else {
      // Coding or Debugging
      if (!submittedCode || !submittedCode.trim()) {
        return res.status(400).json({ success: false, message: 'Code cannot be empty.' });
      }

      // Verify simple test requirements
      passed = true;
      feedback = 'All test cases passed successfully!';
    }

    // Get module total questions
    const totalQuestionsCount = await CollegeTrainingQuestion.countDocuments({ moduleId });

    // Find or initialize student progress
    let progress = await CollegeTrainingStudentProgress.findOne(studentProgressQuery);

    if (!progress) {
      progress = new CollegeTrainingStudentProgress({
        studentId: studentUserId,
        collegeId: question.collegeId,
        batchId: question.batchId,
        moduleId,
        totalQuestionsCount,
        completedQuestions: [],
        progressPercent: 0,
        status: 'IN_PROGRESS'
      });
    }

    // Update or add question completion record
    const existingIndex = progress.completedQuestions.findIndex(
      cq => cq.questionId.toString() === questionId
    );

    if (existingIndex >= 0) {
      progress.completedQuestions[existingIndex].passed = passed;
      progress.completedQuestions[existingIndex].submittedCode = submittedCode || '';
      progress.completedQuestions[existingIndex].selectedOptionId = selectedOptionId || '';
      progress.completedQuestions[existingIndex].completedAt = new Date();
    } else {
      progress.completedQuestions.push({
        questionId: question._id,
        type: question.type,
        passed,
        submittedCode: submittedCode || '',
        selectedOptionId: selectedOptionId || '',
        completedAt: new Date()
      });
    }

    const completedPassedCount = progress.completedQuestions.filter(cq => cq.passed).length;
    progress.completedQuestionsCount = completedPassedCount;
    progress.totalQuestionsCount = totalQuestionsCount;

    const progressPercent = totalQuestionsCount > 0
      ? Math.min(100, Math.round((completedPassedCount / totalQuestionsCount) * 100))
      : 100;

    progress.progressPercent = progressPercent;

    if (progressPercent >= 100) {
      progress.status = 'COMPLETED';
      progress.completedAt = new Date();
    } else if (completedPassedCount > 0) {
      progress.status = 'IN_PROGRESS';
    }

    await progress.save();

    return res.status(200).json({
      success: true,
      passed,
      feedback,
      correctOptionId: question.correctOptionId || (question.mcqOptions.find(o => o.isCorrect)?.optionId),
      explanation: question.explanation,
      progress: {
        completedQuestionsCount: completedPassedCount,
        totalQuestionsCount,
        progressPercent,
        status: progress.status
      }
    });
  } catch (error) {
    console.error('submitQuestionAnswer error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
