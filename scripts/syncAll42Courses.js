const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const Course = require('../models/Course');
const CourseEnvironmentConfig = require('../models/CourseEnvironmentConfig');
const { MASTER_COURSES } = require('../data/masterCourseCatalog');

async function syncCourses() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB.');

  const results = [];

  for (const item of MASTER_COURSES) {
    // Check if course already exists by slug or title case-insensitive
    let course = await Course.findOne({
      $or: [
        { slug: item.slug },
        { title: new RegExp(`^${item.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
      ]
    });

    if (!course) {
      // Create new course
      course = new Course({
        title: item.title,
        slug: item.slug,
        description: item.description,
        category: item.categoryLabel,
        domain: item.domain,
        executionEnvironment: item.classification === 'coding' ? 'COMPILER' : (item.classification === 'non-coding' ? 'MCQ' : 'AUTO'),
        compilerLanguage: item.compilerLanguage || '',
        hasCompiler: item.classification === 'coding',
        durationValue: 12,
        durationUnit: 'Weeks',
        durationWeeks: 12,
        durationText: '12 Weeks',
        totalHours: 120,
        totalCourseFee: 24000,
        monthlyInstallment: 2000,
        level: 'All Levels',
        isActive: true
      });
      await course.save();
      console.log(`[Created Course #${item.courseNumber}]: "${course.title}" (${course._id})`);
    } else {
      // Update existing course to sync environment
      course.domain = item.domain;
      course.category = item.categoryLabel;
      course.hasCompiler = item.classification === 'coding';
      course.compilerLanguage = item.compilerLanguage || '';
      course.executionEnvironment = item.classification === 'coding' ? 'COMPILER' : (item.classification === 'non-coding' ? 'MCQ' : 'AUTO');
      course.isActive = true;
      await course.save();
      console.log(`[Synced Existing Course #${item.courseNumber}]: "${course.title}" (${course._id})`);
    }

    // Sync CourseEnvironmentConfig
    let envConfig = await CourseEnvironmentConfig.findOne({ courseId: course._id });
    if (!envConfig) {
      envConfig = new CourseEnvironmentConfig({
        courseId: course._id,
        courseSlug: item.slug,
        courseTitle: item.title,
        category: item.category,
        categoryLabel: item.categoryLabel,
        classification: item.classification,
        environmentType: item.environmentType,
        environmentName: item.environmentName,
        compilerLanguage: item.compilerLanguage,
        supportedLanguages: item.supportedLanguages,
        workspaceTools: item.workspaceTools,
        validationStrategy: item.validationStrategy,
        isActive: true
      });
    } else {
      envConfig.courseSlug = item.slug;
      envConfig.courseTitle = item.title;
      envConfig.category = item.category;
      envConfig.categoryLabel = item.categoryLabel;
      envConfig.classification = item.classification;
      envConfig.environmentType = item.environmentType;
      envConfig.environmentName = item.environmentName;
      envConfig.compilerLanguage = item.compilerLanguage;
      envConfig.supportedLanguages = item.supportedLanguages;
      envConfig.workspaceTools = item.workspaceTools;
      envConfig.validationStrategy = item.validationStrategy;
      envConfig.isActive = true;
    }

    await envConfig.save();

    results.push({
      number: item.courseNumber,
      title: item.title,
      classification: item.classification,
      environment: item.environmentType,
      id: course._id
    });
  }

  console.log(`\nSuccessfully synchronized all ${results.length} courses and environment configs in MongoDB.`);
  await mongoose.disconnect();
  return results;
}

if (require.main === module) {
  syncCourses().then(() => process.exit(0)).catch(err => {
    console.error('Sync failed:', err);
    process.exit(1);
  });
}

module.exports = { syncCourses };
