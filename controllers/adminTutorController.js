const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const User = require('../models/User');
const TrainerProfile = require('../models/TrainerProfile');
const Course = require('../models/Course');
const Batch = require('../models/Batch');
const College = require('../models/College');
const EmailOTP = require('../models/EmailOTP');
const TutorAttendance = require('../models/TutorAttendance');
const { parseResumePdf } = require('../services/resumeParserService');
const tutorValidationService = require('../services/tutorValidationService');
const emailService = require('../services/emailService');

const hashOTP = (otp) => {
  return crypto.createHash('sha256').update(otp.toString()).digest('hex');
};

// In-Memory OTP Store
const otpStore = new Map();

// Helper to auto-generate unique Tutor ID (e.g., TUT001, TUT002)
async function generateTutorId() {
  const count = await TrainerProfile.countDocuments();
  let nextSeq = count + 1;
  let candidate = `TUT${String(nextSeq).padStart(3, '0')}`;
  
  while (await TrainerProfile.findOne({ tutorId: candidate })) {
    nextSeq++;
    candidate = `TUT${String(nextSeq).padStart(3, '0')}`;
  }
  return candidate;
}

// POST /api/admin/tutors/validate-payload
exports.validatePayload = async (req, res) => {
  try {
    const { excludeTutorId } = req.body;
    const validation = await tutorValidationService.validateFullTutorPayload(req.body, excludeTutorId);
    return res.json({
      success: true,
      validation
    });
  } catch (error) {
    console.error('validatePayload error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Validation service error.' });
  }
};

// POST /api/admin/tutors/parse-resume
exports.parseResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a valid Resume PDF file.' });
    }

    const buffer = req.file.buffer || fs.readFileSync(req.file.path);
    const fileValidation = tutorValidationService.validateFileBuffer(buffer, req.file.originalname, req.file.mimetype, 5);

    if (!fileValidation.isValid) {
      return res.status(400).json({ success: false, message: fileValidation.reason });
    }

    const fileUrl = `/uploads/resumes/${req.file.filename}`;
    let result = { extractedData: {}, fieldStatus: {} };
    try {
      result = await parseResumePdf(buffer);
    } catch (parseErr) {
      console.warn('parseResumePdf warning:', parseErr.message);
    }

    return res.json({
      success: true,
      message: result.isScannedPdf
        ? 'Resume file uploaded successfully! (Image/Scanned PDF format detected — please manually review profile fields).'
        : 'Resume parsed successfully & magic byte check passed.',
      file: {
        fileName: req.file.originalname,
        fileUrl,
        fileSize: req.file.size,
        mimeType: req.file.mimetype
      },
      extractedData: result.extractedData || {},
      fieldStatus: result.fieldStatus || {}
    });
  } catch (error) {
    console.error('parseResume error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to process resume file.' });
  }
};

// POST /api/admin/tutors/upload-photo
exports.uploadPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select a profile photo to upload.' });
    }

    const buffer = req.file.buffer || fs.readFileSync(req.file.path);
    const fileValidation = tutorValidationService.validateFileBuffer(buffer, req.file.originalname, req.file.mimetype, 5);

    if (!fileValidation.isValid) {
      return res.status(400).json({ success: false, message: fileValidation.reason });
    }

    const photoUrl = `/uploads/avatars/${req.file.filename}`;
    return res.json({
      success: true,
      photoUrl,
      fileName: req.file.originalname
    });
  } catch (error) {
    console.error('uploadPhoto error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Photo upload failed.' });
  }
};

// POST /api/admin/tutors/send-email-otp & /api/tutors/email/send-otp
exports.sendEmailOtp = async (req, res) => {
  console.log('[EMAIL OTP] Request received');
  try {
    const { email, isEdit } = req.body;
    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Email syntax & MX domain validation
    const emailRes = await tutorValidationService.validateEmail(normalizedEmail);
    if (!emailRes.isValid) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    // Check duplicate registered account (unless editing existing profile)
    if (!isEdit) {
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'An account with this email address already exists.' });
      }
    }

    // Rate Limiting: 60-second resend cooldown check
    const existingOTP = await EmailOTP.findOne({ email: normalizedEmail });
    if (existingOTP && existingOTP.lastSentAt) {
      const elapsedSeconds = Math.floor((Date.now() - new Date(existingOTP.lastSentAt).getTime()) / 1000);
      if (elapsedSeconds < 60) {
        const waitTime = 60 - elapsedSeconds;
        return res.status(429).json({
          success: false,
          message: `Please wait ${waitTime} seconds before requesting a new OTP.`
        });
      }
    }

    // Generate cryptographically secure 6-digit OTP
    const rawOtp = crypto.randomInt(100000, 1000000).toString();
    console.log('[EMAIL OTP] OTP generated');

    const otpHash = hashOTP(rawOtp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5-minute expiry

    // Invalidate/delete any previous active OTP for that email
    await EmailOTP.deleteMany({ email: normalizedEmail });

    // Store hashed OTP
    await EmailOTP.create({
      email: normalizedEmail,
      otpHash,
      expiresAt,
      otpExpiresAt: expiresAt,
      attempts: 0,
      lastSentAt: new Date(),
      used: false
    });

    console.log(`[EMAIL OTP] Sending email to: ${normalizedEmail}`);

    // Send real OTP email via Nodemailer
    try {
      await emailService.sendEmailOTP(normalizedEmail, rawOtp);
      console.log('[EMAIL OTP] Email sent successfully');
    } catch (mailError) {
      console.error('[EMAIL OTP SendMail Failure]:', mailError.message || mailError);
      await EmailOTP.deleteMany({ email: normalizedEmail });
      return res.status(500).json({
        success: false,
        message: 'Unable to send verification email. Please try again.'
      });
    }

    return res.status(200).json({
      success: true,
      message: `OTP sent to ${normalizedEmail}`
    });
  } catch (error) {
    console.error('[EMAIL OTP] Error processing send-email-otp:', error.message || error);
    return res.status(500).json({ success: false, message: 'Unable to send verification email. Please try again.' });
  }
};

// POST /api/admin/tutors/verify-email-otp & /api/tutors/email/verify-otp
exports.verifyEmailOtp = async (req, res) => {
  console.log('[EMAIL OTP] Request received');
  try {
    const { email, otp, tutorId } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const cleanOtp = otp.toString().trim();

    const otpRecord = await EmailOTP.findOne({ email: normalizedEmail, used: false });
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'This OTP has expired. Please request a new OTP.' });
    }

    // Check failed attempt limit (Max 5 attempts)
    if (otpRecord.attempts >= 5) {
      await EmailOTP.deleteMany({ email: normalizedEmail });
      return res.status(400).json({ success: false, message: 'Too many attempts. Please request a new OTP.' });
    }

    // Check 5-minute expiry
    const expiryTime = otpRecord.expiresAt || otpRecord.otpExpiresAt;
    if (new Date() > new Date(expiryTime)) {
      await EmailOTP.deleteMany({ email: normalizedEmail });
      return res.status(400).json({ success: false, message: 'This OTP has expired. Please request a new OTP.' });
    }

    // Compare hash of entered OTP with stored hash
    const enteredHash = hashOTP(cleanOtp);
    if (enteredHash !== otpRecord.otpHash) {
      otpRecord.attempts += 1;
      if (otpRecord.attempts >= 5) {
        await EmailOTP.deleteMany({ email: normalizedEmail });
        return res.status(400).json({ success: false, message: 'Too many attempts. Please request a new OTP.' });
      } else {
        await otpRecord.save();
        return res.status(400).json({ success: false, message: 'Invalid OTP. Please check your email and try again.' });
      }
    }

    // Successful OTP verification! Invalidate OTP record immediately
    otpRecord.used = true;
    await EmailOTP.deleteMany({ email: normalizedEmail });
    console.log('[EMAIL OTP] OTP verification successful');

    // Update TrainerProfile and User if existing
    let profile = null;
    if (tutorId) {
      profile = await TrainerProfile.findOne({ $or: [{ _id: tutorId }, { tutorId }] });
    } else {
      const user = await User.findOne({ email: normalizedEmail });
      if (user) {
        user.emailVerified = true;
        await user.save();
        profile = await TrainerProfile.findOne({ userId: user._id });
      }
    }

    if (profile) {
      profile.emailVerified = true;
      profile.emailStatus = 'VERIFIED';
      profile.emailVerifiedAt = new Date();
      await profile.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully.',
      emailVerified: true,
      status: 'VERIFIED'
    });
  } catch (error) {
    console.error('[EMAIL OTP] Error verifying OTP:', error.message || error);
    return res.status(500).json({ success: false, message: 'Error verifying OTP.' });
  }
};

// POST /api/admin/tutors/resend-email-otp & /api/tutors/email/resend-otp
exports.resendEmailOtp = exports.sendEmailOtp;

// POST /api/admin/tutors/send-phone-otp
exports.sendPhoneOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    const phoneRes = tutorValidationService.validateIndianMobile(phone);
    if (!phoneRes.isValid) {
      return res.status(400).json({ success: false, message: phoneRes.reason });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const key = `phone:${phoneRes.normalizedValue}`;
    otpStore.set(key, { otp, expiresAt: Date.now() + 10 * 60 * 1000 });

    return res.json({
      success: true,
      message: `OTP sent to ${phoneRes.normalizedValue}. (Simulated OTP: ${otp})`,
      normalizedPhone: phoneRes.normalizedValue,
      simulatedOtp: otp
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/admin/tutors/verify-phone-otp
exports.verifyPhoneOtp = async (req, res) => {
  try {
    const { phone, otp, tutorId } = req.body;
    const phoneRes = tutorValidationService.validateIndianMobile(phone);
    const key = `phone:${phoneRes.normalizedValue}`;
    const record = otpStore.get(key);

    if (!record || record.otp !== otp || Date.now() > record.expiresAt) {
      return res.status(400).json({ success: false, message: 'Invalid or expired phone OTP code.' });
    }

    otpStore.delete(key);

    if (tutorId) {
      const profile = await TrainerProfile.findOne({ $or: [{ _id: tutorId }, { tutorId }] });
      if (profile) {
        profile.phoneStatus = 'OTP_VERIFIED';
        profile.phoneVerifiedAt = new Date();
        await profile.save();
      }
    }

    return res.json({
      success: true,
      message: `Phone number ${phoneRes.normalizedValue} has been successfully OTP Verified!`,
      status: 'OTP_VERIFIED'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/admin/tutors/create
exports.createTutor = async (req, res) => {
  let createdUser = null;

  try {
    const payload = req.body;

    // Run Comprehensive Backend Validation
    const validation = await tutorValidationService.validateFullTutorPayload(payload);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Data Validation Failed: Please fix the highlighted errors before saving.',
        errors: validation.errors,
        warnings: validation.warnings,
        validationResults: validation.fieldResults
      });
    }

    const {
      fullName,
      firstName,
      lastName,
      email,
      username,
      password,
      phone,
      alternatePhone,
      address,
      city,
      state,
      country,
      pincode,
      socialLinks,
      employmentType,
      professionalBio,
      totalExperience,
      education,
      experience,
      skills,
      certifications,
      languages,
      teachingDomains,
      teachingSpecializations,
      availability,
      resumeDocument,
      profilePhotoUrl,
      qualification,
      dob,
      expectedSalary,
      expectedAnnualSalary
    } = payload;

    const rawSalaryInput = Number(expectedAnnualSalary !== undefined ? expectedAnnualSalary : (expectedSalary || 0));
    const finalAnnualSalary = (rawSalaryInput > 0 && rawSalaryInput <= 250000) ? rawSalaryInput * 12 : rawSalaryInput;

    const cleanEmail = email.toLowerCase().trim();
    const phoneRes = tutorValidationService.validateIndianMobile(phone);
    const finalPhone = phoneRes.isValid ? phoneRes.normalizedValue : (phone || '');
    const targetUsername = (username || email.split('@')[0]).toLowerCase().trim();

    const tutorId = await generateTutorId();
    const finalUsername = (username || email.split('@')[0] || `tutor.${tutorId}`).toLowerCase().trim();

    // Check unique email, username, and phone number individually
    const existingEmail = await User.findOne({ email: cleanEmail });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: `An account with email '${cleanEmail}' already exists in the system.`
      });
    }

    const existingUser = await User.findOne({ username: finalUsername });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: `Username '${finalUsername}' is already taken. Please enter a different username.`
      });
    }

    if (finalPhone) {
      const existingPhone = await TrainerProfile.findOne({ phone: finalPhone });
      if (existingPhone) {
        return res.status(400).json({
          success: false,
          message: `Mobile number '${finalPhone}' is already linked to existing tutor ${existingPhone.tutorId} (${existingPhone.fullName}).`
        });
      }
    }

    // 1. Create User Account
    const isEmailVerified = req.body.emailVerified === true;
    createdUser = new User({
      name: fullName.trim(),
      username: finalUsername,
      email: cleanEmail,
      password,
      role: 'trainer',
      phone: finalPhone,
      mustChangePassword: true,
      isActive: true,
      emailVerified: isEmailVerified
    });

    await createdUser.save();

    // Determine initial verification status
    const emailRes = validation.fieldResults.find(r => r.field === 'email');
    let emailStatus = isEmailVerified ? 'VERIFIED' : (emailRes ? (emailRes.status === 'domain_valid' ? 'DOMAIN_VALID' : 'FORMAT_VALID') : 'FORMAT_VALID');

    // 2. Create Trainer/Tutor Profile
    const profile = new TrainerProfile({
      userId: createdUser._id,
      tutorId,
      emailVerified: isEmailVerified,
      firstName: firstName || fullName.split(' ')[0],
      lastName: lastName || fullName.split(' ').slice(1).join(' '),
      fullName: fullName.trim(),
      phone: finalPhone,
      alternatePhone: alternatePhone || '',
      profilePhotoUrl: profilePhotoUrl || '',
      address: address || '',
      city: city || '',
      state: state || '',
      country: country || 'India',
      pincode: pincode || '',
      socialLinks: socialLinks || {},
      employmentType: employmentType || 'FULL-TIME',
      professionalBio: professionalBio || '',
      totalExperience: totalExperience || '0 Years',
      education: education || [],
      experience: experience || [],
      skills: skills || [],
      certifications: certifications || [],
      languages: languages || [],
      teachingDomains: teachingDomains || [],
      teachingSpecializations: teachingSpecializations || {},
      availability: availability || [],
      resumeDocument: resumeDocument || {},
      qualification: qualification || '',
      dateOfBirth: dob ? new Date(dob) : null,
      expectedSalary: finalAnnualSalary,
      expectedAnnualSalary: finalAnnualSalary,
      emailStatus,
      phoneStatus: 'FORMAT_VALID',
      profileValidationStatus: validation.overallStatus,
      validationResults: validation.fieldResults
    });

    await profile.save();

    return res.status(201).json({
      success: true,
      message: 'Tutor profile created successfully!',
      validationSummary: {
        overallStatus: validation.overallStatus,
        warnings: validation.warnings
      },
      data: {
        tutorId: profile.tutorId,
        userId: createdUser._id,
        name: createdUser.name,
        email: createdUser.email,
        username: createdUser.username,
        employmentType: profile.employmentType,
        profile
      }
    });

  } catch (error) {
    if (createdUser && createdUser._id) {
      await User.deleteOne({ _id: createdUser._id }).catch(() => {});
    }
    console.error('createTutor error:', error);
    let errorMsg = error.message || 'Tutor creation failed.';
    if (error.code === 11000 || (error.message && error.message.includes('E11000'))) {
      errorMsg = 'A tutor record with identical email, username, or phone number already exists in the database.';
    }
    return res.status(400).json({ success: false, message: errorMsg });
  }
};

// GET /api/admin/tutors/data-quality-report
exports.getDataQualityReport = async (req, res) => {
  try {
    const profiles = await TrainerProfile.find().populate('userId', 'name email username phone isActive createdAt');

    const totalTutors = profiles.length;
    let fullyValidatedCount = 0;
    let pendingVerificationCount = 0;
    let invalidOrWarningCount = 0;
    let duplicateRecordsCount = 0;

    const emailBreakdown = { verified: 0, domainValid: 0, formatValid: 0, disposable: 0, invalid: 0 };
    const phoneBreakdown = { otpVerified: 0, formatValid: 0, invalid: 0 };

    const qualityIssues = [];

    const emailsSeen = new Map();
    const phonesSeen = new Map();

    profiles.forEach(p => {
      const email = p.userId?.email || p.email;
      const phone = p.phone || p.userId?.phone;

      // Duplicate detection checks
      if (email) {
        if (emailsSeen.has(email)) {
          duplicateRecordsCount++;
          qualityIssues.push({ tutorId: p.tutorId, name: p.fullName, issue: `Duplicate Email: ${email}` });
        } else {
          emailsSeen.set(email, p.tutorId);
        }
      }

      if (phone) {
        if (phonesSeen.has(phone)) {
          duplicateRecordsCount++;
          qualityIssues.push({ tutorId: p.tutorId, name: p.fullName, issue: `Duplicate Phone: ${phone}` });
        } else {
          phonesSeen.set(phone, p.tutorId);
        }
      }

      // Email breakdown
      const eStat = p.emailStatus || 'FORMAT_VALID';
      if (eStat === 'VERIFIED') emailBreakdown.verified++;
      else if (eStat === 'DOMAIN_VALID') emailBreakdown.domainValid++;
      else if (eStat === 'DISPOSABLE_EMAIL') emailBreakdown.disposable++;
      else emailBreakdown.formatValid++;

      // Phone breakdown
      const pStat = p.phoneStatus || 'FORMAT_VALID';
      if (pStat === 'OTP_VERIFIED') phoneBreakdown.otpVerified++;
      else phoneBreakdown.formatValid++;

      // Check missing mandatory fields
      const missing = [];
      if (!p.fullName) missing.push('Full Name');
      if (!p.phone || p.phone === 'N/A') missing.push('Phone Number');
      if (!p.resumeDocument?.fileUrl) missing.push('Resume PDF');
      if (!p.teachingDomains || p.teachingDomains.length === 0) missing.push('Teaching Domain');

      if (missing.length > 0) {
        qualityIssues.push({ tutorId: p.tutorId, name: p.fullName, issue: `Missing fields: ${missing.join(', ')}` });
      }

      const isFullyValid = (eStat === 'VERIFIED' || eStat === 'DOMAIN_VALID') &&
                           pStat === 'OTP_VERIFIED' &&
                           p.profileValidationStatus === 'VALID' &&
                           missing.length === 0;

      if (isFullyValid) {
        fullyValidatedCount++;
      } else if (eStat !== 'VERIFIED' || pStat !== 'OTP_VERIFIED') {
        pendingVerificationCount++;
      } else {
        invalidOrWarningCount++;
      }
    });

    const healthScore = totalTutors > 0
      ? Math.min(100, Math.round(((fullyValidatedCount * 1.0 + (totalTutors - qualityIssues.length) * 0.5) / totalTutors) * 100))
      : 100;

    return res.json({
      success: true,
      report: {
        totalTutors,
        healthScore,
        fullyValidatedCount,
        pendingVerificationCount,
        invalidOrWarningCount,
        duplicateRecordsCount,
        emailBreakdown,
        phoneBreakdown,
        qualityIssues
      }
    });
  } catch (error) {
    console.error('getDataQualityReport error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/tutors
exports.getTutors = async (req, res) => {
  try {
    const { employmentType, status, domain, search } = req.query;

    const query = {};
    if (employmentType && employmentType !== 'ALL') {
      query.employmentType = employmentType;
    }
    if (domain && domain !== 'ALL') {
      query['teachingDomains.domainName'] = { $regex: domain, $options: 'i' };
    }

    const profiles = await TrainerProfile.find(query)
      .populate('userId', 'name username email role isActive createdAt')
      .populate('assignedBatches', 'name code department');

    let filtered = profiles.filter(p => p.userId != null);

    if (status && status !== 'ALL') {
      const activeState = status === 'active';
      filtered = filtered.filter(p => p.userId.isActive === activeState);
    }

    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(p => (
        (p.fullName || '').toLowerCase().includes(s) ||
        (p.tutorId || '').toLowerCase().includes(s) ||
        (p.userId?.username || '').toLowerCase().includes(s) ||
        (p.userId?.email || '').toLowerCase().includes(s) ||
        (p.phone || '').toLowerCase().includes(s)
      ));
    }

    const formatted = filtered.map(p => {
      const primaryDom = p.teachingDomains?.find(d => d.priority === 'Primary') || p.teachingDomains?.[0];
      const rawSal = Number(p.expectedAnnualSalary || p.expectedSalary || 0);
      const annualSal = (rawSal > 0 && rawSal <= 250000) ? rawSal * 12 : rawSal;
      return {
        _id: p._id,
        tutorId: p.tutorId || 'TUT000',
        userId: p.userId._id,
        fullName: p.fullName || p.userId.name,
        username: p.userId.username,
        email: p.userId.email,
        phone: p.phone || p.userId.phone || 'N/A',
        profilePhotoUrl: p.profilePhotoUrl,
        employmentType: p.employmentType || 'FULL-TIME',
        primaryDomain: primaryDom ? primaryDom.domainName : 'General',
        teachingDomains: p.teachingDomains || [],
        totalExperience: p.totalExperience || '0 Years',
        address: p.address || '',
        city: p.city || '',
        state: p.state || '',
        pincode: p.pincode || '',
        qualification: p.qualification || '',
        professionalBio: p.professionalBio || '',
        expectedSalary: annualSal,
        expectedAnnualSalary: annualSal,
        resumeDocument: p.resumeDocument || {},
        assignedBatchesCount: p.assignedBatches?.length || 0,
        status: p.userId.isActive ? 'ACTIVE' : 'INACTIVE',
        emailStatus: p.emailStatus || 'FORMAT_VALID',
        phoneStatus: p.phoneStatus || 'FORMAT_VALID',
        profileValidationStatus: p.profileValidationStatus || 'VALID',
        createdAt: p.createdAt
      };
    });

    return res.json({
      success: true,
      data: formatted,
      totalCount: formatted.length
    });
  } catch (error) {
    console.error('getTutors error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/tutors/:id
exports.getTutorById = async (req, res) => {
  try {
    const { id } = req.params;
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { userId: id }] }
      : { tutorId: id.toUpperCase() };

    const profile = await TrainerProfile.findOne(query)
      .populate('userId', 'name username email role isActive createdAt')
      .populate('assignedBatches')
      .populate('assignedColleges')
      .populate('assignedStudents', 'name email studentId');

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Tutor profile not found.' });
    }

    const profileObj = profile.toObject();
    const rawSal = Number(profileObj.expectedAnnualSalary || profileObj.expectedSalary || 0);
    const annualSal = (rawSal > 0 && rawSal <= 250000) ? rawSal * 12 : rawSal;
    profileObj.expectedSalary = annualSal;
    profileObj.expectedAnnualSalary = annualSal;

    return res.json({
      success: true,
      data: profileObj
    });
  } catch (error) {
    console.error('getTutorById error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/admin/tutors/:id
exports.updateTutor = async (req, res) => {
  try {
    const { id } = req.params;
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { userId: id }] }
      : { tutorId: id.toUpperCase() };

    const profile = await TrainerProfile.findOne(query);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Tutor profile not found.' });
    }

    const fields = req.body;

    if (fields.expectedAnnualSalary !== undefined || fields.expectedSalary !== undefined) {
      const inputSal = Number(fields.expectedAnnualSalary !== undefined ? fields.expectedAnnualSalary : (fields.expectedSalary || 0));
      const normalizedSal = (inputSal > 0 && inputSal <= 250000) ? inputSal * 12 : inputSal;
      fields.expectedSalary = normalizedSal;
      fields.expectedAnnualSalary = normalizedSal;
    }

    // Validate payload with tutorValidationService if essential fields are provided
    if (fields.fullName && fields.email && fields.phone) {
      try {
        const validation = await tutorValidationService.validateFullTutorPayload({
          fullName: fields.fullName,
          email: fields.email,
          phone: fields.phone,
          dob: fields.dateOfBirth || fields.dob,
          pincode: fields.pincode,
          state: fields.state,
          qualification: fields.qualification,
          resumeDocument: fields.resumeDocument || profile.resumeDocument,
          socialLinks: fields.socialLinks || profile.socialLinks
        }, profile.tutorId);
        fields.profileValidationStatus = validation.overallStatus;
        fields.validationResults = validation.fieldResults;
      } catch (valErr) {
        console.warn('Tutor update validation check warning:', valErr.message);
      }
    }

    if (fields.primaryDomain && typeof fields.primaryDomain === 'string') {
      fields.teachingDomains = [
        { domainName: fields.primaryDomain.trim(), priority: 'Primary', experienceYears: 1 }
      ];
    }

    // Email change behavior: reset emailVerified to false when email changes
    if (fields.email && fields.email.trim().toLowerCase() !== profile.email?.toLowerCase()) {
      fields.email = fields.email.trim().toLowerCase();
      fields.emailVerified = false;
      fields.emailStatus = 'FORMAT_VALID';
      const user = await User.findById(profile.userId);
      if (user) {
        user.email = fields.email;
        user.emailVerified = false;
        await user.save();
      }
    }

    Object.assign(profile, fields);
    await profile.save();

    if (fields.fullName || fields.email || fields.phone || fields.password || fields.profilePhotoUrl) {
      const user = await User.findById(profile.userId);
      if (user) {
        if (fields.fullName) user.name = fields.fullName;
        if (fields.email) user.email = fields.email;
        if (fields.phone) user.phone = fields.phone;
        if (fields.profilePhotoUrl) user.avatar = fields.profilePhotoUrl;
        if (fields.password && fields.password.trim() && fields.password !== 'NOT_REQUIRED') {
          user.password = fields.password.trim();
        }
        await user.save();
      }
    }

    const updatedProfile = await TrainerProfile.findById(profile._id)
      .populate('userId', 'name username email role isActive createdAt')
      .populate('assignedBatches')
      .populate('assignedColleges')
      .populate('assignedStudents', 'name email studentId');

    const updatedObj = updatedProfile ? updatedProfile.toObject() : profile.toObject();
    const rawSal = Number(updatedObj.expectedAnnualSalary || updatedObj.expectedSalary || 0);
    const annualSal = (rawSal > 0 && rawSal <= 250000) ? rawSal * 12 : rawSal;
    updatedObj.expectedSalary = annualSal;
    updatedObj.expectedAnnualSalary = annualSal;

    return res.json({
      success: true,
      message: 'Tutor profile updated successfully.',
      data: updatedObj
    });
  } catch (error) {
    console.error('updateTutor error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/admin/tutors/:id
exports.deleteTutor = async (req, res) => {
  try {
    const { id } = req.params;
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { userId: id }] }
      : { tutorId: id.toUpperCase() };

    const profile = await TrainerProfile.findOne(query);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Tutor not found.' });
    }

    const assignedBatchesCount = profile.assignedBatches?.length || 0;
    const assignedStudentsCount = profile.assignedStudents?.length || 0;

    // Dependency check unless force=true is passed
    if ((assignedBatchesCount > 0 || assignedStudentsCount > 0) && req.query.force !== 'true') {
      return res.status(400).json({
        success: false,
        hasDependencies: true,
        assignedBatchesCount,
        assignedStudentsCount,
        message: `Tutor is currently assigned to ${assignedBatchesCount} batch(es) and ${assignedStudentsCount} student(s).`
      });
    }

    if (profile.userId) {
      await User.findByIdAndDelete(profile.userId);
    }
    await TrainerProfile.findByIdAndDelete(profile._id);

    return res.json({
      success: true,
      message: 'Tutor account and profile deleted successfully.'
    });
  } catch (error) {
    console.error('deleteTutor error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/admin/tutors/attendance
 * Comprehensive Tutor Attendance Ledger & Daily Summary for Admin
 */
exports.getTutorAttendanceOverview = async (req, res) => {
  try {
    const { date, status, employmentType, search } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    // 1. Fetch all tutors
    const tutors = await User.find({ role: { $in: ['tutor', 'trainer'] } })
      .select('name email username phone avatar isActive role createdAt')
      .sort({ name: 1 });

    const tutorUserIds = tutors.map(t => t._id);

    // 2. Fetch profiles
    const profiles = await TrainerProfile.find({ userId: { $in: tutorUserIds } })
      .populate('teachingDomains.domainId', 'title code')
      .populate('assignedBatches', 'name code');

    const profileByUserId = new Map();
    profiles.forEach(p => {
      if (p.userId) profileByUserId.set(p.userId.toString(), p);
    });

    // 3. Fetch TutorAttendance records for target date
    const attendanceRecords = await TutorAttendance.find({
      date: targetDate,
      tutorId: { $in: tutorUserIds }
    });

    const attendanceByTutorId = new Map();
    attendanceRecords.forEach(att => {
      if (att.tutorId) attendanceByTutorId.set(att.tutorId.toString(), att);
    });

    // 4. Build unified records
    let presentCount = 0;
    let absentCount = 0;
    let leaveCount = 0;
    let notMarkedCount = 0;

    let records = tutors.map(t => {
      const uIdStr = t._id.toString();
      const profile = profileByUserId.get(uIdStr);
      const att = attendanceByTutorId.get(uIdStr);

      const recordStatus = att ? att.status : 'Not Marked';
      if (recordStatus === 'Present') presentCount++;
      else if (recordStatus === 'Absent') absentCount++;
      else if (recordStatus === 'Leave') leaveCount++;
      else notMarkedCount++;

      return {
        _id: t._id,
        tutorId: profile?.tutorId || 'TUT-N/A',
        profileId: profile?._id || null,
        name: t.name,
        email: t.email,
        username: t.username,
        phone: profile?.mobileNumber || t.phone || 'N/A',
        avatar: t.avatar || '',
        employmentType: profile?.employmentType || 'FULL-TIME',
        primaryDomain: profile?.primaryDomain || 'General',
        experienceYears: profile?.experienceYears || 0,
        assignedCourses: profile?.assignedCourses || [],
        assignedBatches: profile?.assignedBatches || [],
        attendance: {
          _id: att?._id || null,
          date: targetDate,
          status: recordStatus,
          checkIn: att?.checkIn || '',
          checkOut: att?.checkOut || '',
          updatedAt: att?.updatedAt || null
        }
      };
    });

    const totalTutors = tutors.length;
    const attendancePercentage = totalTutors > 0
      ? Math.round((presentCount / totalTutors) * 100)
      : 0;

    const summary = {
      date: targetDate,
      totalTutors,
      presentCount,
      absentCount,
      leaveCount,
      notMarkedCount,
      attendancePercentage
    };

    // Filter by search
    if (search) {
      const q = search.trim().toLowerCase();
      records = records.filter(r =>
        r.name?.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q) ||
        r.username?.toLowerCase().includes(q) ||
        r.tutorId?.toLowerCase().includes(q)
      );
    }

    // Filter by employmentType
    if (employmentType && employmentType !== 'ALL') {
      records = records.filter(r => r.employmentType?.toUpperCase() === employmentType.toUpperCase());
    }

    // Filter by status
    if (status && status !== 'ALL') {
      records = records.filter(r => r.attendance.status.toLowerCase() === status.toLowerCase());
    }

    return res.json({
      success: true,
      data: {
        date: targetDate,
        summary,
        records
      }
    });
  } catch (error) {
    console.error('getTutorAttendanceOverview error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/admin/tutors/attendance/mark
 * Admin marks, updates, or overrides a tutor's attendance
 */
exports.markTutorAttendanceAdmin = async (req, res) => {
  try {
    const { tutorId, date, status, checkIn, checkOut } = req.body;
    if (!tutorId) {
      return res.status(400).json({ success: false, message: 'Tutor ID is required.' });
    }

    const targetDate = date || new Date().toISOString().split('T')[0];
    const validStatus = ['Present', 'Absent', 'Leave'].includes(status) ? status : 'Present';

    const updated = await TutorAttendance.findOneAndUpdate(
      { tutorId, date: targetDate },
      {
        tutorId,
        date: targetDate,
        status: validStatus,
        checkIn: validStatus === 'Absent' ? '' : (checkIn || '09:30 AM'),
        checkOut: validStatus === 'Absent' ? '' : (checkOut || '05:30 PM')
      },
      { upsert: true, new: true }
    );

    return res.json({
      success: true,
      message: `Tutor attendance marked as ${validStatus} for ${targetDate}.`,
      data: updated
    });
  } catch (error) {
    console.error('markTutorAttendanceAdmin error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/admin/tutors/attendance/mark-all-present
 * Admin quick action: mark all tutors as Present
 */
exports.markAllTutorsPresent = async (req, res) => {
  try {
    const { date, checkIn = '09:30 AM', checkOut = '05:30 PM', onlyUnmarked = false } = req.body;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const tutors = await User.find({ role: { $in: ['tutor', 'trainer'] } });
    let updatedCount = 0;

    for (const tutor of tutors) {
      if (onlyUnmarked) {
        const existing = await TutorAttendance.findOne({ tutorId: tutor._id, date: targetDate });
        if (existing) continue;
      }

      await TutorAttendance.findOneAndUpdate(
        { tutorId: tutor._id, date: targetDate },
        {
          tutorId: tutor._id,
          date: targetDate,
          status: 'Present',
          checkIn,
          checkOut
        },
        { upsert: true, new: true }
      );
      updatedCount++;
    }

    return res.json({
      success: true,
      message: `Successfully marked ${updatedCount} tutor(s) as Present for ${targetDate}.`,
      updatedCount
    });
  } catch (error) {
    console.error('markAllTutorsPresent error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/admin/tutors/:id/attendance-history
 * Fetch detailed historical attendance logs for a specific tutor
 */
exports.getTutorAttendanceHistory = async (req, res) => {
  try {
    const { id } = req.params;

    // Resolve tutor user ID
    let tutorUserId = null;
    let tutorUser = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      tutorUser = await User.findById(id);
      if (tutorUser && (tutorUser.role === 'tutor' || tutorUser.role === 'trainer')) {
        tutorUserId = tutorUser._id;
      } else {
        const profile = await TrainerProfile.findById(id);
        if (profile?.userId) {
          tutorUserId = profile.userId;
          tutorUser = await User.findById(profile.userId);
        }
      }
    } else {
      const profile = await TrainerProfile.findOne({ tutorId: id.toUpperCase() });
      if (profile?.userId) {
        tutorUserId = profile.userId;
        tutorUser = await User.findById(profile.userId);
      }
    }

    if (!tutorUserId) {
      return res.status(404).json({ success: false, message: 'Tutor not found.' });
    }

    const records = await TutorAttendance.find({ tutorId: tutorUserId }).sort({ date: -1 });

    const totalDays = records.length;
    const presentDays = records.filter(r => r.status === 'Present').length;
    const absentDays = records.filter(r => r.status === 'Absent').length;
    const leaveDays = records.filter(r => r.status === 'Leave').length;
    const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    return res.json({
      success: true,
      data: {
        tutor: {
          _id: tutorUser._id,
          name: tutorUser.name,
          email: tutorUser.email,
          username: tutorUser.username
        },
        summary: {
          totalDays,
          presentDays,
          absentDays,
          leaveDays,
          attendancePercentage
        },
        records
      }
    });
  } catch (error) {
    console.error('getTutorAttendanceHistory error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
