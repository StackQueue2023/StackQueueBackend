const express = require('express');
const router = express.Router();
const challengeController = require('../controllers/challengeController');
const { protect } = require('../middleware/auth');

// Domain daily challenge
router.get('/daily/my', protect, challengeController.getMyDailyChallenge);
router.post('/daily/submit-domain', protect, challengeController.submitDomainDailyChallenge);

// Challenge execution & submission endpoints
router.get('/:id', protect, challengeController.getChallengeById);
router.post('/:id/run', protect, challengeController.runChallenge);
router.post('/:id/submit', protect, challengeController.submitChallenge);

module.exports = router;
