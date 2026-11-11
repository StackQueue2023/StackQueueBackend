const Course = require('../models/Course');
const Subject = require('../models/Subject');
const StudentProfile = require('../models/StudentProfile');
const Session = require('../models/Session');
const StudentTask = require('../models/StudentTask');

/**
 * Deterministic Curriculum & "What should I teach next?" Recommendation Engine
 */
async function getStudentLearningProgress(studentUserId) {
  const profile = await StudentProfile.findOne({ userId: studentUserId })
    .populate('enrolledCourseId')
    .populate('assignedTutorId', 'name email avatar');

  if (!profile) return null;

  // Fallback to primary course if not enrolled
  let course = profile.enrolledCourseId;
  if (!course) {
    course = await Course.findOne({ isActive: true });
  }

  // Load course subjects/modules
  const subjects = await Subject.find({ courseId: course?._id }).sort({ order: 1 });

  // Load completed sessions
  const completedSessions = await Session.find({
    studentIds: studentUserId,
    status: 'COMPLETED'
  }).sort({ actualEndTime: 1 });

  const completedTopicTitles = new Set(
    completedSessions.map(s => s.topic.trim().toLowerCase())
  );

  // Also include topics explicitly marked in student profile
  if (profile.learningJourney?.completedTopics) {
    profile.learningJourney.completedTopics.forEach(t => {
      completedTopicTitles.add(t.topicTitle.trim().toLowerCase());
    });
  }

  // Linearize all topics in the curriculum order
  const allOrderedTopics = [];
  const moduleProgress = [];

  for (const subject of subjects) {
    let subjectCompletedCount = 0;
    const topicDetails = [];

    for (const t of (subject.topics || [])) {
      const isCompleted = completedTopicTitles.has(t.title.trim().toLowerCase());
      if (isCompleted) subjectCompletedCount++;

      const item = {
        title: t.title,
        order: t.order,
        subjectId: subject._id,
        subjectTitle: subject.title,
        isCompleted
      };
      topicDetails.push(item);
      allOrderedTopics.push(item);
    }

    const totalInSubject = subject.topics?.length || 1;
    const percent = Math.round((subjectCompletedCount / totalInSubject) * 100);

    moduleProgress.push({
      subjectId: subject._id,
      title: subject.title,
      code: subject.code,
      totalTopics: totalInSubject,
      completedTopics: subjectCompletedCount,
      percentage: percent,
      topics: topicDetails
    });
  }

  // Find first uncompleted topic as current, and second as next suggested
  let currentTopic = null;
  let nextSuggestedTopic = null;
  let currentModule = null;
  let prerequisiteReason = 'Prerequisites satisfied in sequence.';

  for (let i = 0; i < allOrderedTopics.length; i++) {
    if (!allOrderedTopics[i].isCompleted) {
      if (!currentTopic) {
        currentTopic = allOrderedTopics[i];
        currentModule = currentTopic.subjectTitle;
        if (i > 0) {
          prerequisiteReason = `Previous prerequisite topic "${allOrderedTopics[i - 1].title}" has been completed.`;
        } else {
          prerequisiteReason = 'Initial foundation topic for this course.';
        }
      } else if (!nextSuggestedTopic) {
        nextSuggestedTopic = allOrderedTopics[i];
        break;
      }
    }
  }

  // Fallbacks if entire curriculum completed
  if (!currentTopic && allOrderedTopics.length > 0) {
    currentTopic = allOrderedTopics[allOrderedTopics.length - 1];
    nextSuggestedTopic = { title: 'Capstone Advanced Projects' };
    prerequisiteReason = 'All curriculum foundational topics completed!';
  }

  // Count pending and completed tasks
  const [pendingTasksCount, completedTasksCount] = await Promise.all([
    StudentTask.countDocuments({ studentId: studentUserId, status: { $in: ['ASSIGNED', 'IN_PROGRESS', 'SUBMITTED'] } }),
    StudentTask.countDocuments({ studentId: studentUserId, status: 'COMPLETED' })
  ]);

  const totalCurriculumTopics = allOrderedTopics.length || 1;
  const totalCompletedTopicsCount = allOrderedTopics.filter(t => t.isCompleted).length;
  const overallPercentage = Math.round((totalCompletedTopicsCount / totalCurriculumTopics) * 100);

  return {
    courseTitle: course ? course.title : 'Full Stack Development',
    assignedTutor: profile.assignedTutorId,
    overallPercentage,
    completedTopicsCount: totalCompletedTopicsCount,
    totalTopicsCount: totalCurriculumTopics,
    currentModule: currentModule || 'Core Foundations',
    currentTopic: currentTopic ? currentTopic.title : 'Introductory Foundations',
    nextSuggestedTopic: nextSuggestedTopic ? nextSuggestedTopic.title : 'Advanced OOP Patterns',
    prerequisiteReason,
    moduleProgress,
    pendingTasksCount,
    completedTasksCount,
    allOrderedTopics
  };
}

module.exports = {
  getStudentLearningProgress
};
