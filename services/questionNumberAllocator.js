const InterviewQuestion = require('../models/InterviewQuestion');

let lockPromise = Promise.resolve();
let initialized = false;
let currentCounter = 1000;

async function ensureInitialized() {
  if (!initialized) {
    const highest = await InterviewQuestion.findOne()
      .sort({ questionNumber: -1 })
      .select('questionNumber')
      .lean();
    currentCounter = Math.max(highest?.questionNumber || 1000, 1000);
    initialized = true;
  }
}

/**
 * Concurrency-safe, globally shared questionNumber allocator.
 */
function allocateQuestionNumbers(count = 1) {
  const safeCount = Math.max(1, Number(count) || 1);
  const run = lockPromise.then(async () => {
    await ensureInitialized();
    const start = currentCounter + 1;
    currentCounter += safeCount;
    return start;
  });
  lockPromise = run.catch(() => {});
  return run;
}

module.exports = {
  allocateQuestionNumbers
};
