const StudentProfile = require('../models/StudentProfile');

const DOMAIN_TO_LANG = {
  java: 'java',
  python: 'python',
  cpp: 'cpp',
  react: 'javascript',
  javascript: 'javascript',
  js: 'javascript'
};

/**
 * Returns array of language keys allowed for a given student based on their completed and enrolled courses.
 */
async function getStudentAllowedLanguages(userId, userRole) {
  // All languages unlocked so students can freely practice across all domain courses in Interview Arena & Mock Interview
  return ['java', 'python', 'javascript', 'cpp'];
}

/**
 * Validates whether the student is authorized to run/submit code in the given language.
 */
async function validateStudentLanguageAccess(user, targetLanguage) {
  if (!user || user.role === 'admin' || user.role === 'trainer' || user.role === 'tutor') {
    return true;
  }

  const allowedLangs = await getStudentAllowedLanguages(user._id, user.role);
  const normalizedTarget = (targetLanguage || '').toLowerCase().trim();
  const mappedTarget = DOMAIN_TO_LANG[normalizedTarget] || normalizedTarget;

  return allowedLangs.includes(mappedTarget);
}

module.exports = {
  getStudentAllowedLanguages,
  validateStudentLanguageAccess
};
