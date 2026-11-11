const tutorValidationService = require('../services/tutorValidationService');

async function testValidationSuite() {
  console.log('=== RUNNING TUTOR VALIDATION & AUTHENTICITY SUITE ===\n');

  // Test 1: Email Validation (Invalid syntax, disposable, DNS MX lookup)
  console.log('--- Test 1: Email Validation ---');
  const invalidEmail1 = await tutorValidationService.validateEmail('abc@');
  console.log('abc@ ->', invalidEmail1.status, '| Reason:', invalidEmail1.reason);

  const invalidEmail2 = await tutorValidationService.validateEmail('abc..test@gmail.com');
  console.log('abc..test@gmail.com ->', invalidEmail2.status, '| Reason:', invalidEmail2.reason);

  const disposableEmail = await tutorValidationService.validateEmail('test@mailinator.com');
  console.log('test@mailinator.com ->', disposableEmail.status, '| Reason:', disposableEmail.reason);

  const validMxEmail = await tutorValidationService.validateEmail('test@gmail.com');
  console.log('test@gmail.com ->', validMxEmail.status, '| Reason:', validMxEmail.reason);

  // Test 2: Indian Mobile Number Validation
  console.log('\n--- Test 2: Indian Mobile Number Validation ---');
  const phone1 = tutorValidationService.validateIndianMobile('9876543210');
  console.log('9876543210 ->', phone1.status, '| Normalized:', phone1.normalizedValue);

  const phone2 = tutorValidationService.validateIndianMobile('+919876543210');
  console.log('+919876543210 ->', phone2.status, '| Normalized:', phone2.normalizedValue);

  const phoneFake = tutorValidationService.validateIndianMobile('9999999999');
  console.log('9999999999 ->', phoneFake.status, '| Reason:', phoneFake.reason);

  const phoneInvalid = tutorValidationService.validateIndianMobile('12345');
  console.log('12345 ->', phoneInvalid.status, '| Reason:', phoneInvalid.reason);

  // Test 3: Name Validation
  console.log('\n--- Test 3: Name Validation ---');
  const name1 = tutorValidationService.validateName('Arun Prakash');
  console.log('Arun Prakash ->', name1.status);

  const nameFake = tutorValidationService.validateName('test123');
  console.log('test123 ->', nameFake.status, '| Reason:', nameFake.reason);

  // Test 4: Age & DOB Validation
  console.log('\n--- Test 4: Age & DOB Validation ---');
  const dobValid = tutorValidationService.validateDobAndAge('1995-05-15');
  console.log('1995-05-15 ->', dobValid.status, '| Age:', dobValid.calculatedAge);

  const dobTooYoung = tutorValidationService.validateDobAndAge('2015-05-15');
  console.log('2015-05-15 ->', dobTooYoung.status, '| Reason:', dobTooYoung.reason);

  // Test 5: PIN Code & State Mapping Validation
  console.log('\n--- Test 5: PIN Code & State Consistency ---');
  const pinValid = tutorValidationService.validateAddressAndPin('123 Street', 'Chennai', 'Tamil Nadu', '600001');
  console.log('600001 (Tamil Nadu) ->', pinValid[0].status, '| Reason:', pinValid[0].reason);

  const pinMismatch = tutorValidationService.validateAddressAndPin('123 Street', 'Bangalore', 'Karnataka', '600001');
  console.log('600001 (Karnataka) ->', pinMismatch[0].status, '| Reason:', pinMismatch[0].reason);

  // Test 6: File Magic Bytes Validation
  console.log('\n--- Test 6: File Buffer Magic Check ---');
  const pdfBuffer = Buffer.from('%PDF-1.4 Fake PDF Content');
  const pdfCheck = tutorValidationService.validateFileBuffer(pdfBuffer, 'resume.pdf', 'application/pdf');
  console.log('Valid PDF Header ->', pdfCheck.isValid, '| Reason:', pdfCheck.reason);

  const fakePdfBuffer = Buffer.from('MZ Executable Binary Header');
  const exeCheck = tutorValidationService.validateFileBuffer(fakePdfBuffer, 'resume.pdf', 'application/pdf');
  console.log('Fake PDF Header (Exe Binary) ->', exeCheck.isValid, '| Reason:', exeCheck.reason);

  console.log('\n=== ALL VALIDATION TESTS COMPLETED SUCCESSFULY ===');
  process.exit(0);
}

testValidationSuite();
