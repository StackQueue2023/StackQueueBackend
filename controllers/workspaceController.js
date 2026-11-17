const WorkspaceState = require('../models/WorkspaceState');
const CourseEnvironmentConfig = require('../models/CourseEnvironmentConfig');

/**
 * GET /api/workspace/state/:courseId/:questionId
 * Retrieves auto-saved working state for student
 */
exports.getWorkspaceState = async (req, res) => {
  try {
    const userId = req.user._id;
    const { courseId, questionId } = req.params;

    const state = await WorkspaceState.findOne({ userId, courseId, questionId }).lean();
    return res.json({
      success: true,
      stateData: state?.stateData || null,
      lastExecutionResult: state?.lastExecutionResult || null,
      isCompleted: state?.isCompleted || false
    });
  } catch (err) {
    console.error('Error fetching workspace state:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve workspace state' });
  }
};

/**
 * POST /api/workspace/state/:courseId/:questionId
 * Continuously auto-saves student workspace state (No manual save button required)
 */
exports.saveWorkspaceState = async (req, res) => {
  try {
    const userId = req.user._id;
    const { courseId, questionId } = req.params;
    const { environmentType, stateData, lastExecutionResult } = req.body;

    const updated = await WorkspaceState.findOneAndUpdate(
      { userId, courseId, questionId },
      {
        userId,
        courseId,
        questionId,
        environmentType: environmentType || 'generic',
        stateData: stateData || {},
        lastExecutionResult: lastExecutionResult !== undefined ? lastExecutionResult : null,
        lastExecutedAt: lastExecutionResult ? new Date() : undefined
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.json({
      success: true,
      message: 'Workspace state preserved',
      updatedAt: updated.updatedAt
    });
  } catch (err) {
    console.error('Error saving workspace state:', err);
    return res.status(500).json({ success: false, message: 'Failed to persist workspace state' });
  }
};

/**
 * GET /api/workspace/config/:courseId
 * Retrieves environment configuration for a course
 */
exports.getCourseEnvironmentConfig = async (req, res) => {
  try {
    const { courseId } = req.params;
    const config = await CourseEnvironmentConfig.findOne({ courseId }).lean();
    if (config) {
      return res.json({ success: true, config });
    }
    // Fallback default
    return res.json({
      success: true,
      config: {
        classification: 'hybrid',
        environmentType: 'frontend_web',
        environmentName: 'Interactive Workspace',
        supportedLanguages: ['javascript', 'python'],
        validationStrategy: 'COMPILER_TEST_CASES'
      }
    });
  } catch (err) {
    console.error('Error fetching environment config:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch course environment config' });
  }
};
