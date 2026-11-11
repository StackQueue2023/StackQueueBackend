const Offer = require('../models/Offer');

/**
 * GET /api/admin/offers
 * Get all offers with optional search and status filter
 */
exports.getAllOffers = async (req, res) => {
  try {
    const { search, status } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { couponCode: { $regex: search, $options: 'i' } },
        { offerType: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const offers = await Offer.find(query).sort({ createdAt: -1 });

    // Format with computed status
    let formatted = offers.map(o => o.toJSON());

    // Filter by computed status if provided
    if (status && status !== 'All') {
      formatted = formatted.filter(o => o.status.toLowerCase() === status.toLowerCase());
    }

    return res.json({
      success: true,
      count: formatted.length,
      data: formatted
    });
  } catch (error) {
    console.error('getAllOffers error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/admin/offers/:id
 * Get single offer by ID
 */
exports.getOfferById = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({ success: false, message: 'Offer not found' });
    }
    return res.json({ success: true, data: offer.toJSON() });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/admin/offers
 * Create new offer
 */
exports.createOffer = async (req, res) => {
  try {
    const {
      title,
      description,
      offerType,
      discountType,
      discountValue,
      applicableCourses,
      applicableStudentCategory,
      startDate,
      endDate,
      couponCode,
      termsAndConditions,
      bannerUrl,
      isActive,
      isDraft
    } = req.body;

    if (!title || !startDate || !endDate || discountValue === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Title, start date, end date, and discount value are required.'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid start date or end date format.' });
    }
    if (end < start) {
      return res.status(400).json({ success: false, message: 'End date cannot be earlier than start date.' });
    }

    // Check unique coupon code if provided
    let normCoupon = couponCode ? couponCode.trim().toUpperCase() : null;
    if (normCoupon) {
      const existing = await Offer.findOne({ couponCode: normCoupon });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `Coupon code "${normCoupon}" is already used by another offer.`
        });
      }
    }

    const offer = await Offer.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      offerType: offerType || 'Course Discount',
      discountType: discountType === 'fixed' ? 'fixed' : 'percentage',
      discountValue: Number(discountValue),
      applicableCourses: Array.isArray(applicableCourses) ? applicableCourses : (applicableCourses ? [applicableCourses] : []),
      applicableStudentCategory: applicableStudentCategory || 'All Students',
      startDate: start,
      endDate: end,
      couponCode: normCoupon || undefined,
      termsAndConditions: termsAndConditions ? termsAndConditions.trim() : '',
      bannerUrl: bannerUrl ? bannerUrl.trim() : '',
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      isDraft: Boolean(isDraft)
    });

    return res.status(201).json({
      success: true,
      message: `Offer "${offer.title}" created successfully!`,
      data: offer.toJSON()
    });
  } catch (error) {
    console.error('createOffer error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/admin/offers/:id
 * Update existing offer
 */
exports.updateOffer = async (req, res) => {
  try {
    const offerId = req.params.id;
    const offer = await Offer.findById(offerId);
    if (!offer) {
      return res.status(404).json({ success: false, message: 'Offer not found.' });
    }

    const {
      title,
      description,
      offerType,
      discountType,
      discountValue,
      applicableCourses,
      applicableStudentCategory,
      startDate,
      endDate,
      couponCode,
      termsAndConditions,
      bannerUrl,
      isActive,
      isDraft
    } = req.body;

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end < start) {
        return res.status(400).json({ success: false, message: 'End date cannot be earlier than start date.' });
      }
    }

    if (couponCode !== undefined) {
      const normCoupon = couponCode ? couponCode.trim().toUpperCase() : null;
      if (normCoupon) {
        const existing = await Offer.findOne({ couponCode: normCoupon, _id: { $ne: offerId } });
        if (existing) {
          return res.status(400).json({
            success: false,
            message: `Coupon code "${normCoupon}" is already used by another offer.`
          });
        }
        offer.couponCode = normCoupon;
      } else {
        offer.couponCode = undefined;
      }
    }

    if (title !== undefined) offer.title = title.trim();
    if (description !== undefined) offer.description = description.trim();
    if (offerType !== undefined) offer.offerType = offerType;
    if (discountType !== undefined) offer.discountType = discountType;
    if (discountValue !== undefined) offer.discountValue = Number(discountValue);
    if (applicableCourses !== undefined) offer.applicableCourses = Array.isArray(applicableCourses) ? applicableCourses : [applicableCourses];
    if (applicableStudentCategory !== undefined) offer.applicableStudentCategory = applicableStudentCategory;
    if (startDate !== undefined) offer.startDate = new Date(startDate);
    if (endDate !== undefined) offer.endDate = new Date(endDate);
    if (termsAndConditions !== undefined) offer.termsAndConditions = termsAndConditions.trim();
    if (bannerUrl !== undefined) offer.bannerUrl = bannerUrl.trim();
    if (isActive !== undefined) offer.isActive = Boolean(isActive);
    if (isDraft !== undefined) offer.isDraft = Boolean(isDraft);

    await offer.save();

    return res.json({
      success: true,
      message: `Offer "${offer.title}" updated successfully!`,
      data: offer.toJSON()
    });
  } catch (error) {
    console.error('updateOffer error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE /api/admin/offers/:id
 * Delete an offer
 */
exports.deleteOffer = async (req, res) => {
  try {
    const offer = await Offer.findByIdAndDelete(req.params.id);
    if (!offer) {
      return res.status(404).json({ success: false, message: 'Offer not found.' });
    }
    return res.json({
      success: true,
      message: `Offer "${offer.title}" deleted successfully.`
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PATCH /api/admin/offers/:id/toggle-status
 * Toggle active status of offer
 */
exports.toggleOfferStatus = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({ success: false, message: 'Offer not found.' });
    }

    offer.isActive = !offer.isActive;
    await offer.save();

    return res.json({
      success: true,
      message: `Offer status changed to ${offer.isActive ? 'Active' : 'Inactive'}.`,
      data: offer.toJSON()
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
