const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const adminTutorController = require('../controllers/adminTutorController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

// Ensure upload directories exist
const uploadDir = path.join(__dirname, '..', 'uploads');
const resumeDir = path.join(uploadDir, 'resumes');
const avatarDir = path.join(uploadDir, 'avatars');

[uploadDir, resumeDir, avatarDir].forEach(d => {
  if (!fs.existsSync(d)) {
    fs.mkdirSync(d, { recursive: true });
  }
});

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'resume' || file.mimetype === 'application/pdf') {
      cb(null, resumeDir);
    } else {
      cb(null, avatarDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB Limit
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'resume') {
      if (file.mimetype === 'application/pdf' || file.originalname.endsWith('.pdf')) {
        cb(null, true);
      } else {
        cb(new Error('Only PDF resume files are accepted!'), false);
      }
    } else if (file.fieldname === 'photo') {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only JPG, JPEG, PNG, or WEBP image files are accepted!'), false);
      }
    } else {
      cb(null, true);
    }
  }
});

// Routes — All protected for Admin
router.use(protect);
router.use(authorize('admin'));

router.post('/validate-payload', adminTutorController.validatePayload);
router.post('/send-email-otp', adminTutorController.sendEmailOtp);
router.post('/resend-email-otp', adminTutorController.resendEmailOtp);
router.post('/verify-email-otp', adminTutorController.verifyEmailOtp);
router.post('/send-phone-otp', adminTutorController.sendPhoneOtp);
router.post('/verify-phone-otp', adminTutorController.verifyPhoneOtp);
router.get('/data-quality-report', adminTutorController.getDataQualityReport);

router.post('/parse-resume', upload.single('resume'), adminTutorController.parseResume);
router.post('/upload-photo', upload.single('photo'), adminTutorController.uploadPhoto);
router.post('/create', adminTutorController.createTutor);

// Tutor Attendance Routes
router.get('/attendance', adminTutorController.getTutorAttendanceOverview);
router.post('/attendance/mark', adminTutorController.markTutorAttendanceAdmin);
router.post('/attendance/mark-all-present', adminTutorController.markAllTutorsPresent);
router.get('/:id/attendance-history', adminTutorController.getTutorAttendanceHistory);

router.get('/', adminTutorController.getTutors);
router.get('/:id', adminTutorController.getTutorById);
router.put('/:id', adminTutorController.updateTutor);
router.delete('/:id', adminTutorController.deleteTutor);

module.exports = router;
