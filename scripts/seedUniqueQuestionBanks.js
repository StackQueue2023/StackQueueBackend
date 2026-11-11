/**
 * STACK QUEUE Question Bank Generator & Seeder
 * Populates 144 unique questions per domain for Interview Arena
 * + 24 Mock Interview questions per domain
 * + Syllabus Module Tasks
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });

const InterviewQuestion = require('../models/InterviewQuestion');
const InterviewTestCase = require('../models/InterviewTestCase');
const DomainTask = require('../models/DomainTask');
const Course = require('../models/Course');
const Module = require('../models/Module');
const { validateQuestionUniqueness } = require('../services/questionUniquenessService');

console.log('Seeder loaded successfully');
