const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function main() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/game_project');
  const Course = require('../models/Course');
  const Module = require('../models/Module');
  const DomainTask = require('../models/DomainTask');
  const Concept = require('../models/Concept');
  const ConceptTask = require('../models/ConceptTask');
  const InterviewQuestion = require('../models/InterviewQuestion');

  const courses = await Course.find({}).lean();
  console.log('Courses count:', courses.length);
  for (const c of courses) {
    const modules = await Module.find({ courseId: c._id }).sort({ order: 1 }).lean();
    const tasks = await DomainTask.find({ courseId: c._id }).lean();
    const concepts = await Concept.find({ courseId: c._id }).lean();
    const directQuestions = await InterviewQuestion.find({ courseId: c._id }).lean();
    const domainQuestions = await InterviewQuestion.find({ domain: new RegExp('^' + (c.domain || c.title), 'i') }).lean();
    console.log(`Course: "${c.title}" | ID: ${c._id} | slug: ${c.slug} | domain: ${c.domain}`);
    console.log(`  Modules: ${modules.length}, Tasks: ${tasks.length}, Concepts: ${concepts.length}, Direct Questions: ${directQuestions.length}, Domain Questions: ${domainQuestions.length}`);
    for (const m of modules.slice(0, 5)) {
      const modTasks = tasks.filter(t => t.moduleId && t.moduleId.toString() === m._id.toString());
      const modConcepts = concepts.filter(cp => cp.moduleId && cp.moduleId.toString() === m._id.toString());
      console.log(`    Module [${m.order}]: "${m.title}" -> ${modTasks.length} tasks, ${modConcepts.length} concepts`);
    }
  }

  // Also check all distinct question domains and questionBankTypes
  const distinctDomains = await InterviewQuestion.distinct('domain');
  console.log('\nDistinct InterviewQuestion domains:', distinctDomains);
  for (const d of distinctDomains) {
    const arenaCount = await InterviewQuestion.countDocuments({ domain: d, questionBankType: 'INTERVIEW_ARENA' });
    const mockCount = await InterviewQuestion.countDocuments({ domain: d, questionBankType: 'MOCK_INTERVIEW' });
    const moduleCount = await InterviewQuestion.countDocuments({ domain: d, questionBankType: 'MODULE' });
    const otherCount = await InterviewQuestion.countDocuments({ domain: d, questionBankType: { $nin: ['INTERVIEW_ARENA', 'MOCK_INTERVIEW', 'MODULE'] } });
    console.log(`Domain "${d}": Arena=${arenaCount}, Mock=${mockCount}, Module=${moduleCount}, Other=${otherCount}`);
  }

  const conceptTaskCount = await ConceptTask.countDocuments();
  console.log('\nTotal ConceptTasks:', conceptTaskCount);
  const domainTaskCount = await DomainTask.countDocuments();
  console.log('Total DomainTasks:', domainTaskCount);

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
