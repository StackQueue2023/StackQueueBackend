/**
 * Master 500 Questions Dataset across 5 Active Domains:
 * 1. Java Domain: Q1 - Q100 (35 Easy, 40 Medium, 25 Hard)
 * 2. Python Domain: Q101 - Q200 (35 Easy, 40 Medium, 25 Hard)
 * 3. JavaScript Domain: Q201 - Q300 (35 Easy, 40 Medium, 25 Hard)
 * 4. Data Structures (DSA) Domain: Q301 - Q400 (35 Easy, 40 Medium, 25 Hard)
 * 5. C++ Domain: Q401 - Q500 (35 Easy, 40 Medium, 25 Hard)
 */

const javaQuestions = require('./domains/javaQuestions');
const pythonQuestions = require('./domains/pythonQuestions');
const jsQuestions = require('./domains/jsQuestions');
const dsaQuestions = require('./domains/dsaQuestions');
const cppQuestions = require('./domains/cppQuestions');

const questionsData500 = [
  ...javaQuestions,
  ...pythonQuestions,
  ...jsQuestions,
  ...dsaQuestions,
  ...cppQuestions
];

module.exports = questionsData500;
