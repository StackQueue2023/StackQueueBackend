const Course = require('../models/Course');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');

/**
 * Normalizes prefix by trimming, upper-casing, and stripping trailing hyphens/underscores
 */
function cleanPrefix(str) {
  if (!str || typeof str !== 'string') return '';
  return str.trim().toUpperCase().replace(/[-_]+$/, '');
}

/**
 * Formats a student ID given a prefix and a numeric sequence
 * Example: cleanPrefix="SQ-JAVA", seq=1 -> "SQ-JAVA-0001"
 */
function formatStudentId(prefix, seq) {
  const p = cleanPrefix(prefix) || 'SQ-STU';
  const numStr = String(seq).padStart(4, '0');
  return `${p}-${numStr}`;
}

/**
 * Validates whether a given Student ID matches a Course's configured ID format/prefix
 */
function validateStudentIdAgainstCourse(studentId, course) {
  if (!studentId || !studentId.trim()) {
    return { valid: false, message: 'Student ID is required.' };
  }
  if (!course) {
    return { valid: false, message: 'Associated course record is required for ID validation.' };
  }

  const cleanId = studentId.trim().toUpperCase();
  const studentPrefix = cleanPrefix(course.studentIdPrefix);
  const coursePrefix = cleanPrefix(course.coursePrefix);

  // Expected prefixes: primary student prefix, or course prefix
  const allowedPrefixes = [];
  if (studentPrefix) allowedPrefixes.push(`${studentPrefix}-`);
  if (coursePrefix) allowedPrefixes.push(`${coursePrefix}-`);

  // Historical aliases (e.g. SQ-JA for JAVA)
  if (studentPrefix === 'SQ-JAVA' || coursePrefix === 'SQ-JAVA') {
    allowedPrefixes.push('SQ-JA-');
  }

  const isMatched = allowedPrefixes.some(pref => cleanId.startsWith(pref));
  if (!isMatched) {
    const expected = studentPrefix || coursePrefix || 'SQ-COURSE';
    return {
      valid: false,
      message: `Student ID "${cleanId}" does not match course "${course.title}". Expected format prefix: "${expected}-" (e.g. ${expected}-0001).`
    };
  }

  return { valid: true };
}

/**
 * Detects / resolves the matching Course document given a Student ID
 */
async function resolveCourseFromStudentId(studentId) {
  if (!studentId || typeof studentId !== 'string') return null;
  const cleanId = studentId.trim().toUpperCase();

  const courses = await Course.find({ isActive: { $ne: false } }).lean();

  // Find course where Student ID starts with configured studentIdPrefix or coursePrefix
  for (const c of courses) {
    const sPref = cleanPrefix(c.studentIdPrefix);
    const cPref = cleanPrefix(c.coursePrefix);

    if (
      (sPref && cleanId.startsWith(`${sPref}-`)) ||
      (cPref && cleanId.startsWith(`${cPref}-`)) ||
      ((sPref === 'SQ-JAVA' || cPref === 'SQ-JAVA') && cleanId.startsWith('SQ-JA-'))
    ) {
      return c;
    }
  }

  return null;
}

/**
 * Calculates the next available unique Student ID for a given course
 * Checks sequential counter and database to guarantee no duplicate ID
 */
async function getNextStudentIdForCourse(courseId) {
  const course = await Course.findById(courseId);
  if (!course) {
    throw new Error('Course not found');
  }

  const prefix = cleanPrefix(course.studentIdPrefix || course.coursePrefix || 'SQ-STU');
  const startSeq = Number(course.startingSequence) >= 1 ? Number(course.startingSequence) : 1;
  const currSeq = Number(course.currentSequence) >= 0 ? Number(course.currentSequence) : 0;

  let nextSeq = Math.max(startSeq, currSeq + 1);

  // Scan until a guaranteed globally unused Student ID is found
  while (true) {
    const candidateId = formatStudentId(prefix, nextSeq);

    const [userExists, profileExists] = await Promise.all([
      User.findOne({ studentId: candidateId }),
      StudentProfile.findOne({ studentId: candidateId })
    ]);

    if (!userExists && !profileExists) {
      return {
        nextStudentId: candidateId,
        sequence: nextSeq,
        courseId: course._id,
        courseTitle: course.title,
        coursePrefix: course.coursePrefix || prefix,
        studentIdPrefix: prefix,
        studentIdFormat: `${prefix}-0001`
      };
    }
    nextSeq++;
  }
}

/**
 * Commits the used sequence number for a course
 */
async function commitStudentSequenceForCourse(courseId, sequence) {
  if (!courseId || !sequence) return;
  await Course.findByIdAndUpdate(courseId, {
    $max: { currentSequence: sequence }
  });
}

module.exports = {
  cleanPrefix,
  formatStudentId,
  validateStudentIdAgainstCourse,
  resolveCourseFromStudentId,
  getNextStudentIdForCourse,
  commitStudentSequenceForCourse
};
