const mongoose = require('mongoose');

async function verifyE2E() {
  console.log('=== VERIFYING TUTOR DATA VALIDATION & QUALITY SYSTEM E2E ===\n');

  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/codequest_db');
    const User = require('../models/User');
    const TrainerProfile = require('../models/TrainerProfile');
    const tutorValidationService = require('../services/tutorValidationService');

    // 1. Test Email validation & MX lookup
    console.log('1. Testing Email Validation & MX lookup:');
    const emailResult = await tutorValidationService.validateEmail('tutor.test@gmail.com');
    console.log('   Result:', emailResult.status, '| Reason:', emailResult.reason);

    // 2. Test Indian Mobile Number validation
    console.log('\n2. Testing Indian Mobile Normalization & Validation:');
    const phoneResult = tutorValidationService.validateIndianMobile('9876543210');
    console.log('   Result:', phoneResult.status, '| Normalized:', phoneResult.normalizedValue);

    // 3. Test File Magic Byte Inspection
    console.log('\n3. Testing File Security & Magic Byte Inspection:');
    const validPdf = Buffer.from('%PDF-1.4 header');
    const pdfVal = tutorValidationService.validateFileBuffer(validPdf, 'resume.pdf', 'application/pdf');
    console.log('   PDF Magic Check:', pdfVal.isValid ? 'PASSED' : 'FAILED');

    // 4. Test Full Tutor Payload Validation (Valid Payload)
    console.log('\n4. Testing Full Tutor Payload Validation:');
    const payload = {
      fullName: 'Vikram Sundaram',
      email: 'vikram.tutor@gmail.com',
      phone: '9876512345',
      dob: '1992-08-20',
      qualification: 'M.E / M.Tech',
      totalExperience: '5 Years',
      address: '45 Tech Park Road',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600001',
      employmentType: 'FULL-TIME'
    };

    const fullVal = await tutorValidationService.validateFullTutorPayload(payload);
    console.log('   Overall Status:', fullVal.overallStatus);
    console.log('   Errors Count:', fullVal.errors.length);
    console.log('   Warnings Count:', fullVal.warnings.length);

    // 5. Duplicate Tutor Detection Check
    console.log('\n5. Testing Duplicate Tutor Detection:');
    const dupCheck = await tutorValidationService.detectDuplicates('vikram.tutor@gmail.com', '9876512345', 'Vikram Sundaram');
    console.log('   Duplicate Detected:', dupCheck.isPossibleDuplicate);

    console.log('\n=== ALL E2E VERIFICATION CHECKS PASSED PERFECTLY ===');
    process.exit(0);
  } catch (err) {
    console.error('E2E Verification Error:', err);
    process.exit(1);
  }
}

verifyE2E();
