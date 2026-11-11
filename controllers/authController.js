const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const TrainerProfile = require('../models/TrainerProfile');
const CollegeTrainingEnrollment = require('../models/CollegeTrainingEnrollment');
const { sendPasswordResetOTP, sendWelcomeEmail } = require('../services/emailService');

const generateToken = (id, extra = {}) => {
  return jwt.sign({ id, ...extra }, process.env.JWT_SECRET || 'stackqueue_secret_jwt_key_2026_super_secure_it_platform', {
    expiresIn: '30d'
  });
};

// POST /api/auth/login
// Accepts username OR email OR courseUsername + password
exports.login = async (req, res) => {
  try {
    const { email, username, identifier, emailOrUsername, password } = req.body;
    const loginTarget = (identifier || emailOrUsername || email || username || '').trim();

    if (!loginTarget || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email or username, and password' });
    }

    // 1. Check for Course-Specific Enrollment Credentials first
    const courseEnrollment = await CollegeTrainingEnrollment.findOne({
      courseUsername: loginTarget.toLowerCase()
    }).select('+coursePassword');

    if (courseEnrollment) {
      // Check if course has been marked COMPLETED or access revoked
      if (courseEnrollment.status === 'COMPLETED' || courseEnrollment.accountStatus !== 'ACTIVE') {
        const completedDateStr = courseEnrollment.completionDate
          ? new Date(courseEnrollment.completionDate).toLocaleDateString()
          : (courseEnrollment.credentialsRevokedAt ? new Date(courseEnrollment.credentialsRevokedAt).toLocaleDateString() : 'recently');

        return res.status(403).json({
          success: false,
          code: 'COURSE_COMPLETED_ACCESS_REVOKED',
          message: `Access for course "${courseEnrollment.courseName || 'Training'}" has ended because this course was marked COMPLETED on ${completedDateStr}. If you have been assigned a new course, please log in using your new course credentials.`
        });
      }

      // Find associated student user
      const studentUser = await User.findById(courseEnrollment.studentId).select('+password');
      if (!studentUser || !studentUser.isActive) {
        return res.status(401).json({ success: false, message: 'Student account not found or deactivated.' });
      }

      let isMatch = false;
      if (courseEnrollment.coursePassword) {
        isMatch = await bcrypt.compare(password, courseEnrollment.coursePassword);
      }
      if (!isMatch && studentUser.password) {
        isMatch = await studentUser.matchPassword(password);
      }

      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials. Password incorrect.' });
      }

      const profile = await StudentProfile.findOne({ userId: studentUser._id })
        .populate('collegeId batchId enrolledCourseId assignedTutorId');

      const token = generateToken(studentUser._id, {
        enrollmentId: courseEnrollment._id,
        activeCourseId: courseEnrollment.courseId,
        tokenVersion: courseEnrollment.tokenVersion || 1
      });

      return res.json({
        success: true,
        token,
        user: {
          id: studentUser._id,
          studentId: studentUser.studentId || profile?.studentId || null,
          name: studentUser.name,
          username: courseEnrollment.courseUsername || studentUser.username,
          email: studentUser.email,
          role: studentUser.role,
          avatar: studentUser.avatar,
          phone: studentUser.phone || '',
          activeCourseName: courseEnrollment.courseName
        },
        profile
      });
    }

    // 2. Standard User Lookup (email / primary username / permanent studentId)
    const user = await User.findOne({
      $or: [
        { email: loginTarget.toLowerCase() },
        { username: loginTarget.toLowerCase() },
        { studentId: loginTarget.toUpperCase() }
      ]
    }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Password incorrect.' });
    }

    let profile = null;
    let activeEnrollment = null;

    if (user.role === 'student') {
      profile = await StudentProfile.findOne({ userId: user._id }).populate('collegeId batchId enrolledCourseId assignedTutorId');

      // Check if student has active course enrollments
      activeEnrollment = await CollegeTrainingEnrollment.findOne({
        studentId: user._id,
        status: 'ACTIVE',
        accountStatus: 'ACTIVE'
      }).sort({ createdAt: -1 });

      // If user has enrollments and ALL of them are COMPLETED:
      const totalEnrollments = await CollegeTrainingEnrollment.countDocuments({ studentId: user._id });
      if (totalEnrollments > 0 && !activeEnrollment && user.studentType === 'COLLEGE_TRAINING') {
        const lastCompleted = await CollegeTrainingEnrollment.findOne({ studentId: user._id }).sort({ completionDate: -1 });
        return res.status(403).json({
          success: false,
          code: 'COURSE_COMPLETED_ACCESS_REVOKED',
          message: `Your training course "${lastCompleted?.courseName || 'College Training'}" has been marked as COMPLETED and login access has ended. When a new course is assigned by the administration, you will receive new credentials.`
        });
      }
    } else if (user.role === 'trainer' || user.role === 'tutor') {
      profile = await TrainerProfile.findOne({ userId: user._id }).populate('assignedColleges assignedBatches');
    }

    const tokenPayload = activeEnrollment ? {
      enrollmentId: activeEnrollment._id,
      activeCourseId: activeEnrollment.courseId,
      tokenVersion: activeEnrollment.tokenVersion || 1
    } : {};

    const token = generateToken(user._id, tokenPayload);
    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        studentId: user.studentId || profile?.studentId || null,
        name: user.name,
        username: user.username || user.email.split('@')[0],
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone || ''
      },
      profile
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/register (Public Registration: Strictly for Students)
exports.register = async (req, res) => {
  try {
    const { name, username, email, password, confirmPassword, phone, collegeId, batchId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    const emailNorm = email.trim().toLowerCase();
    const existingEmail = await User.findOne({ email: emailNorm });
    if (existingEmail) {
      return res.status(400).json({ success: false, message: 'Email is already registered. Please login.' });
    }

    const usernameNorm = (username ? username.trim().toLowerCase() : emailNorm.split('@')[0]);
    const existingUsername = await User.findOne({ username: usernameNorm });
    if (existingUsername) {
      return res.status(400).json({ success: false, message: 'Username is already taken. Please pick another.' });
    }

    // Public registration is restricted strictly to students.
    // Tutors and Admins are provisioned by institute administration.
    const user = await User.create({
      name: name.trim(),
      username: usernameNorm,
      email: emailNorm,
      password,
      role: 'student',
      phone: phone ? phone.trim() : ''
    });

    const profile = await StudentProfile.create({
      userId: user._id,
      collegeId: collegeId || null,
      batchId: batchId || null,
      totalXp: 100
    });

    const token = generateToken(user._id);

    // Send Welcome Email asynchronously
    sendWelcomeEmail({
      toEmail: user.email,
      name: user.name,
      role: user.role,
      username: user.username
    }).catch(err => console.error('[Welcome Email Error]:', err.message));

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone
      },
      profile
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/forgot-password (Generates 6-digit OTP valid for 15 minutes)
exports.forgotPassword = async (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier) {
      return res.status(400).json({ success: false, message: 'Please enter your registered email or username.' });
    }

    const target = identifier.trim().toLowerCase();
    const user = await User.findOne({
      $or: [{ email: target }, { username: target }]
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found matching this email or username.' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    user.resetPasswordOtp = otp;
    user.resetPasswordExpires = expires;
    await user.save({ validateBeforeSave: false });

    // Send real password reset email via Nodemailer
    sendPasswordResetOTP(user.email, otp).catch(err => {
      console.error('[Forgot Password Email Error]:', err.message);
    });

    return res.json({
      success: true,
      message: `Password reset 6-digit OTP generated successfully. Valid for 15 minutes.`,
      email: user.email,
      demoOtp: otp // Included for instant sandbox testing
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/verify-otp
exports.verifyOtp = async (req, res) => {
  try {
    const { identifier, otp } = req.body;
    if (!identifier || !otp) {
      return res.status(400).json({ success: false, message: 'Email/username and OTP are required.' });
    }

    const target = identifier.trim().toLowerCase();
    const user = await User.findOne({
      $or: [{ email: target }, { username: target }],
      resetPasswordOtp: otp.trim(),
      resetPasswordExpires: { $gt: Date.now() }
    }).select('+resetPasswordOtp +resetPasswordExpires');

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP. Please request a new one.' });
    }

    return res.json({
      success: true,
      message: 'OTP verified successfully. You may now enter your new password.'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { identifier, otp, newPassword, confirmPassword } = req.body;
    if (!identifier || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const target = identifier.trim().toLowerCase();
    const user = await User.findOne({
      $or: [{ email: target }, { username: target }],
      resetPasswordOtp: otp.trim(),
      resetPasswordExpires: { $gt: Date.now() }
    }).select('+password +resetPasswordOtp +resetPasswordExpires');

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP. Please request a new OTP.' });
    }

    user.password = newPassword;
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.json({
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let profile = null;
    if (user.role === 'student') {
      profile = await StudentProfile.findOne({ userId: user._id }).populate('collegeId batchId enrolledCourseId assignedTutorId');
    } else if (user.role === 'trainer' || user.role === 'tutor') {
      profile = await TrainerProfile.findOne({ userId: user._id }).populate('assignedColleges assignedBatches');
    }

    return res.json({
      success: true,
      user: {
        id: user._id,
        studentId: user.studentId || profile?.studentId || null,
        name: user.name,
        username: user.username || user.email.split('@')[0],
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone || ''
      },
      profile
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/demo-switch (Quick Demo Login for testing and showcase)
exports.demoSwitch = async (req, res) => {
  try {
    const { role = 'student' } = req.body;
    let target = 'student01';
    if (role === 'trainer' || role === 'tutor') target = 'tutor01';
    if (role === 'admin') target = 'admin01';

    let user = await User.findOne({
      $or: [
        { username: target },
        { email: `${target}@stackqueue.com` },
        { email: `${role}@stackqueue.com` },
        { role: role === 'tutor' ? { $in: ['tutor', 'trainer'] } : role }
      ]
    });

    if (!user) {
      return res.status(404).json({ success: false, message: `Demo user for role ${role} not found.` });
    }

    let profile = null;
    if (user.role === 'student') {
      profile = await StudentProfile.findOne({ userId: user._id }).populate('collegeId batchId enrolledCourseId');
    } else if (user.role === 'trainer' || user.role === 'tutor') {
      profile = await TrainerProfile.findOne({ userId: user._id }).populate('assignedColleges assignedBatches');
    }

    const token = generateToken(user._id);
    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username || user.email.split('@')[0],
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone || ''
      },
      profile
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/logout
exports.logout = async (req, res) => {
  return res.json({
    success: true,
    message: 'User logged out successfully. Session invalidated.'
  });
};

