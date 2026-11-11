const express = require('express');
const router = express.Router();
const offerController = require('../controllers/adminOfferController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

// All offer routes are protected and restricted to admin
router.use(protect);
router.use(authorize('admin'));

router.get('/', offerController.getAllOffers);
router.post('/', offerController.createOffer);
router.get('/:id', offerController.getOfferById);
router.put('/:id', offerController.updateOffer);
router.delete('/:id', offerController.deleteOffer);
router.patch('/:id/toggle-status', offerController.toggleOfferStatus);

module.exports = router;
