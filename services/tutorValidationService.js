const dns = require('dns').promises;
const http = require('http');
const https = require('https');
const User = require('../models/User');
const TrainerProfile = require('../models/TrainerProfile');

// Disposable / Temporary Email Domains List
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'mailinator.com', 'tempmail.com', '10minutemail.com', 'dispostable.com',
  'guerrillamail.com', 'trashmail.com', 'yopmail.com', 'sharklasers.com',
  'getnada.com', 'throwawaymail.com', 'temp-mail.org', 'fakeinbox.com',
  'binkmail.com', 'safetymail.info', 'maildrop.cc', 'emailondeck.com'
]);

// Fake Name Patterns
const FAKE_NAME_PATTERNS = [
  /^test$/i, /^test\d+$/i, /^abc$/i, /^qwerty$/i, /^asdf$/i, /^123$/i,
  /^xyz$/i, /^admin$/i, /^fake$/i, /^user$/i, /^no\s*name$/i, /^tutor$/i
];

// Indian State PIN Code Prefixes mapping for consistency validation
const INDIAN_PIN_PREFIX_MAP = {
  '11': ['Delhi'],
  '12': ['Haryana'],
  '13': ['Haryana'],
  '14': ['Punjab'],
  '15': ['Punjab'],
  '16': ['Chandigarh', 'Punjab'],
  '17': ['Himachal Pradesh'],
  '18': ['Jammu and Kashmir', 'Ladakh'],
  '19': ['Jammu and Kashmir'],
  '20': ['Uttar Pradesh'],
  '21': ['Uttar Pradesh'],
  '22': ['Uttar Pradesh'],
  '23': ['Uttar Pradesh'],
  '24': ['Uttarakhand', 'Uttar Pradesh'],
  '25': ['Uttar Pradesh'],
  '26': ['Uttarakhand'],
  '27': ['Uttar Pradesh'],
  '28': ['Uttar Pradesh'],
  '30': ['Rajasthan'],
  '31': ['Rajasthan'],
  '32': ['Rajasthan'],
  '33': ['Rajasthan'],
  '34': ['Rajasthan'],
  '36': ['Gujarat'],
  '37': ['Gujarat'],
  '38': ['Gujarat'],
  '39': ['Gujarat'],
  '40': ['Maharashtra', 'Goa'],
  '41': ['Maharashtra'],
  '42': ['Maharashtra'],
  '43': ['Maharashtra'],
  '44': ['Maharashtra'],
  '45': ['Madhya Pradesh'],
  '46': ['Madhya Pradesh'],
  '47': ['Madhya Pradesh'],
  '48': ['Madhya Pradesh'],
  '49': ['Chhattisgarh'],
  '50': ['Telangana'],
  '51': ['Andhra Pradesh'],
  '52': ['Andhra Pradesh'],
  '53': ['Andhra Pradesh'],
  '56': ['Karnataka'],
  '57': ['Karnataka'],
  '58': ['Karnataka'],
  '59': ['Karnataka'],
  '60': ['Tamil Nadu', 'Puducherry'],
  '61': ['Tamil Nadu'],
  '62': ['Tamil Nadu'],
  '63': ['Tamil Nadu'],
  '64': ['Tamil Nadu'],
  '67': ['Kerala', 'Lakshadweep'],
  '68': ['Kerala'],
  '69': ['Kerala'],
  '70': ['West Bengal'],
  '71': ['West Bengal'],
  '72': ['West Bengal'],
  '73': ['West Bengal', 'Sikkim'],
  '74': ['West Bengal'],
  '75': ['Odisha'],
  '76': ['Odisha'],
  '77': ['Odisha'],
  '78': ['Assam'],
  '79': ['Arunachal Pradesh', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Tripura'],
  '80': ['Bihar'],
  '81': ['Bihar'],
  '82': ['Bihar', 'Jharkhand'],
  '83': ['Jharkhand'],
  '84': ['Bihar'],
  '85': ['Bihar']
};

/**
 * 1. EMAIL VALIDATION & MX LOOKUP
 */
async function validateEmail(rawEmail) {
  if (!rawEmail || typeof rawEmail !== 'string') {
    return {
      field: 'email',
      value: rawEmail,
      status: 'invalid',
      reason: 'Email is required.',
      verification_method: 'SYNTAX_CHECK',
      isValid: false
    };
  }

  const email = rawEmail.trim().toLowerCase();

  // Syntax Regex Check
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email) || email.includes('..') || email.startsWith('.') || email.endsWith('.')) {
    return {
      field: 'email',
      value: email,
      status: 'invalid',
      reason: 'Enter a valid email address.',
      verification_method: 'SYNTAX_CHECK',
      isValid: false
    };
  }

  const domain = email.split('@')[1];

  // Disposable Domain Detection
  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
    return {
      field: 'email',
      value: email,
      status: 'invalid',
      reason: 'Disposable/temporary email domains are not allowed.',
      verification_method: 'DISPOSABLE_LIST_LOOKUP',
      isValid: false
    };
  }

  // DNS MX Record Verification
  try {
    const mxRecords = await dns.resolveMx(domain);
    if (mxRecords && mxRecords.length > 0) {
      return {
        field: 'email',
        value: email,
        status: 'domain_valid',
        reason: `Email format valid & MX domain verified (${mxRecords[0].exchange}).`,
        verification_method: 'DNS_MX_LOOKUP',
        isValid: true
      };
    } else {
      return {
        field: 'email',
        value: email,
        status: 'invalid',
        reason: 'This email domain does not have valid MX/DNS records.',
        verification_method: 'DNS_MX_LOOKUP',
        isValid: false
      };
    }
  } catch (err) {
    // If DNS resolve fails or offline
    return {
      field: 'email',
      value: email,
      status: 'warning',
      reason: 'Email syntax valid, but domain DNS records could not be verified.',
      verification_method: 'DNS_MX_LOOKUP_ATTEMPT',
      isValid: true
    };
  }
}

/**
 * 2. INDIAN MOBILE NUMBER VALIDATION
 */
function validateIndianMobile(rawPhone) {
  if (!rawPhone || typeof rawPhone !== 'string') {
    return {
      field: 'phone',
      value: rawPhone,
      status: 'invalid',
      reason: 'Mobile number is required.',
      verification_method: 'FORMAT_CHECK',
      isValid: false
    };
  }

  const cleaned = rawPhone.trim().replace(/[\s\-\(\)]/g, '');

  let tenDigits = '';
  if (cleaned.startsWith('+91')) {
    tenDigits = cleaned.slice(3);
  } else if (cleaned.startsWith('91') && cleaned.length === 12) {
    tenDigits = cleaned.slice(2);
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    tenDigits = cleaned.slice(1);
  } else if (cleaned.length === 10) {
    tenDigits = cleaned;
  } else {
    return {
      field: 'phone',
      value: rawPhone,
      status: 'invalid',
      reason: 'Please enter a valid 10-digit Indian mobile number.',
      verification_method: 'FORMAT_CHECK',
      isValid: false
    };
  }

  // Check 10 digits exact numeric
  if (!/^\d{10}$/.test(tenDigits)) {
    return {
      field: 'phone',
      value: rawPhone,
      status: 'invalid',
      reason: 'Mobile number must contain exactly 10 digits.',
      verification_method: 'DIGIT_LENGTH_CHECK',
      isValid: false
    };
  }

  // Indian Mobile Numbers start with 6, 7, 8, or 9
  if (!/^[6-9]/.test(tenDigits)) {
    return {
      field: 'phone',
      value: rawPhone,
      status: 'invalid',
      reason: 'Indian mobile numbers must start with 6, 7, 8, or 9.',
      verification_method: 'PREFIX_CHECK',
      isValid: false
    };
  }

  // Reject fake repetitive & sequential patterns
  const FAKE_PATTERNS = [
    '9999999999', '8888888888', '7777777777', '6666666666',
    '5555555555', '4444444444', '3333333333', '2222222222',
    '1111111111', '0000000000', '1234567890', '0123456789',
    '9876543210', '0987654321', '2345678901'
  ];
  if (FAKE_PATTERNS.includes(tenDigits) || /^(\d)\1{9}$/.test(tenDigits)) {
    return {
      field: 'phone',
      value: rawPhone,
      status: 'invalid',
      reason: 'Fake or repetitive phone numbers (e.g. 9999999999) are rejected.',
      verification_method: 'PATTERN_REJECTION',
      isValid: false
    };
  }

  const normalizedPhone = `+91${tenDigits}`;

  return {
    field: 'phone',
    value: rawPhone,
    normalizedValue: normalizedPhone,
    status: 'format_valid',
    reason: 'Valid Indian mobile number format (+91).',
    verification_method: 'INDIAN_MOBILE_REGEX',
    isValid: true
  };
}

/**
 * 3. NAME VALIDATION
 */
function validateName(rawName, fieldLabel = 'Full Name') {
  if (!rawName || typeof rawName !== 'string') {
    return {
      field: fieldLabel.toLowerCase().replace(/\s+/g, '_'),
      value: rawName,
      status: 'invalid',
      reason: `${fieldLabel} is required.`,
      verification_method: 'STRING_CHECK',
      isValid: false
    };
  }

  const trimmed = rawName.trim().replace(/\s+/g, ' ');

  if (trimmed.length < 2) {
    return {
      field: fieldLabel.toLowerCase().replace(/\s+/g, '_'),
      value: trimmed,
      status: 'invalid',
      reason: `${fieldLabel} must be at least 2 characters long.`,
      verification_method: 'LENGTH_CHECK',
      isValid: false
    };
  }

  // Accept letters, spaces, dots, hyphens, and apostrophes
  const nameRegex = /^[a-zA-Z\s\.\'\-]+$/;
  if (!nameRegex.test(trimmed)) {
    return {
      field: fieldLabel.toLowerCase().replace(/\s+/g, '_'),
      value: trimmed,
      status: 'invalid',
      reason: `${fieldLabel} contains invalid numbers or special characters.`,
      verification_method: 'CHARACTER_CHECK',
      isValid: false
    };
  }

  // Check fake names
  if (FAKE_NAME_PATTERNS.some(pattern => pattern.test(trimmed))) {
    return {
      field: fieldLabel.toLowerCase().replace(/\s+/g, '_'),
      value: trimmed,
      status: 'invalid',
      reason: `Please provide a genuine ${fieldLabel.toLowerCase()} (e.g. test/abc/fake values are rejected).`,
      verification_method: 'FAKE_NAME_CHECK',
      isValid: false
    };
  }

  return {
    field: fieldLabel.toLowerCase().replace(/\s+/g, '_'),
    value: trimmed,
    status: 'valid',
    reason: `${fieldLabel} format is valid.`,
    verification_method: 'NAME_REGEX',
    isValid: true
  };
}

/**
 * 4. AGE / DOB VALIDATION
 */
function validateDobAndAge(rawDob, minAge = 20, maxAge = 75) {
  if (!rawDob) {
    return {
      field: 'dob',
      value: rawDob,
      status: 'warning',
      reason: 'Date of birth was not provided.',
      verification_method: 'DATE_CHECK',
      isValid: true
    };
  }

  const dob = new Date(rawDob);
  if (isNaN(dob.getTime())) {
    return {
      field: 'dob',
      value: rawDob,
      status: 'invalid',
      reason: 'Invalid date format for Date of Birth.',
      verification_method: 'DATE_PARSE',
      isValid: false
    };
  }

  const today = new Date();
  if (dob > today) {
    return {
      field: 'dob',
      value: rawDob,
      status: 'invalid',
      reason: 'Date of birth cannot be in the future.',
      verification_method: 'FUTURE_DATE_CHECK',
      isValid: false
    };
  }

  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  if (age < minAge || age > maxAge) {
    return {
      field: 'dob',
      value: rawDob,
      calculatedAge: age,
      status: 'invalid',
      reason: `Tutor age must be between ${minAge} and ${maxAge} years old (Calculated: ${age} years).`,
      verification_method: 'AGE_RANGE_CHECK',
      isValid: false
    };
  }

  return {
    field: 'dob',
    value: rawDob,
    calculatedAge: age,
    status: 'valid',
    reason: `Valid date of birth. Tutor age: ${age} years.`,
    verification_method: 'AGE_CALCULATION',
    isValid: true
  };
}

/**
 * 5. QUALIFICATION VALIDATION
 */
function validateQualification(qual) {
  if (!qual || typeof qual !== 'string' || !qual.trim()) {
    return {
      field: 'qualification',
      value: qual,
      status: 'warning',
      reason: 'Educational qualification should be specified.',
      verification_method: 'STRING_CHECK',
      isValid: true
    };
  }

  const trimmed = qual.trim();
  if (trimmed.length < 2 || /^[^a-zA-Z0-9]+$/.test(trimmed) || FAKE_NAME_PATTERNS.some(p => p.test(trimmed))) {
    return {
      field: 'qualification',
      value: trimmed,
      status: 'invalid',
      reason: 'Please enter a valid qualification degree (e.g. B.Tech CSE, M.Sc, Ph.D.).',
      verification_method: 'CONTENT_CHECK',
      isValid: false
    };
  }

  return {
    field: 'qualification',
    value: trimmed,
    status: 'valid',
    reason: 'Qualification format valid.',
    verification_method: 'CONTENT_CHECK',
    isValid: true
  };
}

/**
 * 6. EXPERIENCE & TIMELINE CONSISTENCY VALIDATION
 */
function validateExperience(totalExpStr, experienceList = []) {
  let claimedYears = 0;
  if (typeof totalExpStr === 'string') {
    const match = totalExpStr.match(/(\d+(?:\.\d+)?)/);
    if (match) claimedYears = parseFloat(match[1]);
  } else if (typeof totalExpStr === 'number') {
    claimedYears = totalExpStr;
  }

  if (claimedYears < 0 || claimedYears > 50) {
    return {
      field: 'total_experience',
      value: totalExpStr,
      status: 'invalid',
      reason: 'Total experience must be a realistic non-negative number (0 to 50 years).',
      verification_method: 'RANGE_CHECK',
      isValid: false
    };
  }

  // Calculate timeline from work experience list if provided
  let calculatedYears = 0;
  if (Array.isArray(experienceList) && experienceList.length > 0) {
    experienceList.forEach(exp => {
      if (exp.startDate) {
        const start = new Date(exp.startDate);
        const end = exp.currentlyWorking || !exp.endDate ? new Date() : new Date(exp.endDate);
        if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end >= start) {
          const diffMs = end - start;
          calculatedYears += diffMs / (1000 * 60 * 60 * 24 * 365.25);
        }
      }
    });
    calculatedYears = Math.round(calculatedYears * 10) / 10;
  }

  // Check mismatch if both claimed and timeline exist
  if (experienceList.length > 0 && Math.abs(claimedYears - calculatedYears) > 2) {
    return {
      field: 'total_experience',
      value: totalExpStr,
      calculatedYears,
      status: 'warning',
      reason: `Claimed experience (${claimedYears} years) differs from documented work timeline (${calculatedYears} years).`,
      verification_method: 'TIMELINE_CONSISTENCY_CHECK',
      isValid: true
    };
  }

  return {
    field: 'total_experience',
    value: `${claimedYears} Years`,
    status: 'valid',
    reason: 'Total experience value validated.',
    verification_method: 'NUMERIC_CHECK',
    isValid: true
  };
}

/**
 * 7. ADDRESS & INDIAN PIN CODE CONSISTENCY VALIDATION
 */
function validateAddressAndPin(address, city, state, pincode) {
  const results = [];

  if (!pincode || typeof pincode !== 'string') {
    results.push({
      field: 'pincode',
      value: pincode,
      status: 'warning',
      reason: 'Postal PIN code is missing.',
      verification_method: 'PIN_CHECK',
      isValid: true
    });
  } else {
    const cleanPin = pincode.trim();
    if (!/^[1-9][0-9]{5}$/.test(cleanPin)) {
      results.push({
        field: 'pincode',
        value: cleanPin,
        status: 'invalid',
        reason: 'PIN code must contain exactly 6 digits (Indian postal PIN format).',
        verification_method: 'PIN_REGEX',
        isValid: false
      });
    } else {
      // Check prefix consistency with State if state is provided
      const prefix = cleanPin.slice(0, 2);
      const expectedStates = INDIAN_PIN_PREFIX_MAP[prefix];
      if (state && expectedStates && expectedStates.length > 0) {
        const matchesState = expectedStates.some(s => state.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(state.toLowerCase()));
        if (!matchesState) {
          results.push({
            field: 'pincode',
            value: cleanPin,
            status: 'warning',
            reason: `PIN Code ${cleanPin} (Region: ${expectedStates.join('/')}) might conflict with entered state "${state}".`,
            verification_method: 'POSTAL_REGION_MAP',
            isValid: true
          });
        } else {
          results.push({
            field: 'pincode',
            value: cleanPin,
            status: 'valid',
            reason: `PIN Code ${cleanPin} verified against region ${expectedStates[0]}.`,
            verification_method: 'POSTAL_REGION_MAP',
            isValid: true
          });
        }
      } else {
        results.push({
          field: 'pincode',
          value: cleanPin,
          status: 'valid',
          reason: 'Valid 6-digit Indian PIN code format.',
          verification_method: 'PIN_REGEX',
          isValid: true
        });
      }
    }
  }

  return results;
}

/**
 * 8. URL VALIDATION & REACHABILITY CHECK
 */
async function validateUrl(rawUrl, fieldLabel = 'URL', checkReachability = true) {
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return {
      field: fieldLabel.toLowerCase().replace(/\s+/g, '_'),
      value: '',
      status: 'valid',
      reason: `${fieldLabel} optional field is empty.`,
      verification_method: 'URL_CHECK',
      isValid: true
    };
  }

  let url = rawUrl.trim();

  // Common non-URL placeholders from resume text or user entry
  const dummyPlaceholders = [
    'none', 'n/a', 'na', 'nil', 'no', '-', '--', 'null', 'undefined',
    'not available', 'http://', 'https://', 'n.a.', 'n/a.'
  ];
  if (dummyPlaceholders.includes(url.toLowerCase())) {
    return {
      field: fieldLabel.toLowerCase().replace(/\s+/g, '_'),
      value: '',
      status: 'valid',
      reason: `${fieldLabel} optional field is empty.`,
      verification_method: 'URL_CHECK',
      isValid: true
    };
  }

  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }

  const urlPattern = /^https?:\/\/(localhost|([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,})(:\d+)?(\/.*)?$/i;
  if (!urlPattern.test(url)) {
    return {
      field: fieldLabel.toLowerCase().replace(/\s+/g, '_'),
      value: url,
      status: 'invalid',
      reason: `${fieldLabel} must be a valid web address (e.g. https://example.com).`,
      verification_method: 'URL_REGEX',
      isValid: false
    };
  }

  if (!checkReachability) {
    return {
      field: fieldLabel.toLowerCase().replace(/\s+/g, '_'),
      value: url,
      status: 'format_valid',
      reason: `${fieldLabel} syntax is valid.`,
      verification_method: 'URL_REGEX',
      isValid: true
    };
  }

  // Reachability Check via HTTP HEAD/GET request (timeout 3000ms)
  try {
    const isReachable = await new Promise((resolve) => {
      const client = url.startsWith('https') ? https : http;
      const req = client.request(url, { method: 'HEAD', timeout: 3000 }, (res) => {
        resolve(res.statusCode >= 200 && res.statusCode < 400);
      });
      req.on('error', () => resolve(false));
      req.on('timeout', () => { req.destroy(); resolve(false); });
      req.end();
    });

    if (isReachable) {
      return {
        field: fieldLabel.toLowerCase().replace(/\s+/g, '_'),
        value: url,
        status: 'website_reachable',
        reason: `${fieldLabel} is valid & reachable online.`,
        verification_method: 'HTTP_HEAD_CHECK',
        isValid: true
      };
    } else {
      return {
        field: fieldLabel.toLowerCase().replace(/\s+/g, '_'),
        value: url,
        status: 'warning',
        reason: `${fieldLabel} format is valid, but website could not be reached (HTTP timeout or error).`,
        verification_method: 'HTTP_HEAD_CHECK',
        isValid: true
      };
    }
  } catch (err) {
    return {
      field: fieldLabel.toLowerCase().replace(/\s+/g, '_'),
      value: url,
      status: 'format_valid',
      reason: `${fieldLabel} format valid. Reachability check skipped.`,
      verification_method: 'URL_REGEX',
      isValid: true
    };
  }
}

/**
 * 9. FILE UPLOAD & MAGIC BYTE VALIDATION
 */
function validateFileBuffer(buffer, originalName, mimeType, maxMb = 5) {
  if (!buffer || buffer.length === 0) {
    return { isValid: false, reason: 'File payload is empty or missing.' };
  }

  const maxBytes = maxMb * 1024 * 1024;
  if (buffer.length > maxBytes) {
    return { isValid: false, reason: `File size (${(buffer.length / (1024 * 1024)).toFixed(2)} MB) exceeds maximum allowed ${maxMb} MB.` };
  }

  const header = buffer.slice(0, 8).toString('hex').toUpperCase();

  // Executable / Script Rejection (MZ for Windows EXE, #! for shell scripts, <html/<script)
  const isExe = header.startsWith('4D5A'); // MZ
  const isShell = buffer.slice(0, 2).toString() === '#!';
  const isScript = buffer.slice(0, 100).toString().toLowerCase().includes('<script');

  if (isExe || isShell || isScript) {
    return { isValid: false, reason: 'Security Violation: Executable binary or script files are strictly prohibited.' };
  }

  const ext = originalName ? originalName.slice(originalName.lastIndexOf('.')).toLowerCase() : '';

  if (ext === '.pdf') {
    // Magic check: %PDF (25 50 44 46)
    if (!header.startsWith('25504446')) {
      return { isValid: false, reason: 'Corrupted file: File extension is .pdf but binary content is not a valid PDF document.' };
    }
  } else if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
    const isPng = header.startsWith('89504E47');
    const isJpeg = header.startsWith('FFD8FF');
    const isWebp = header.startsWith('52494646') && buffer.slice(8, 12).toString() === 'WEBP';

    if (!isPng && !isJpeg && !isWebp) {
      return { isValid: false, reason: 'Corrupted file: Image content does not match PNG/JPEG/WEBP format.' };
    }
  }

  return { isValid: true, reason: 'File content and magic bytes verified clean.' };
}

/**
 * 10. DUPLICATE TUTOR DETECTION
 */
async function detectDuplicates(email, phone, fullName, excludeTutorId = null) {
  const warnings = [];
  const matches = [];

  const cleanEmail = email ? email.trim().toLowerCase() : '';
  const phoneRes = validateIndianMobile(phone || '');
  const cleanPhone = phoneRes.isValid ? phoneRes.normalizedValue : (phone ? phone.trim() : '');

  // 1. Email Match
  if (cleanEmail) {
    const emailMatch = await User.findOne({
      email: cleanEmail,
      ...(excludeTutorId ? { _id: { $ne: excludeTutorId } } : {})
    });
    if (emailMatch) {
      warnings.push(`Email '${cleanEmail}' is already registered to existing account (${emailMatch.name}).`);
      matches.push({ type: 'EMAIL_MATCH', existingUser: emailMatch });
    }
  }

  // 2. Phone Match
  if (cleanPhone) {
    const phoneMatch = await TrainerProfile.findOne({
      $or: [{ phone: cleanPhone }, { phone: phone ? phone.trim() : '' }],
      ...(excludeTutorId ? { tutorId: { $ne: excludeTutorId } } : {})
    });
    if (phoneMatch) {
      warnings.push(`Mobile number '${cleanPhone}' is already linked to existing tutor ${phoneMatch.tutorId} (${phoneMatch.fullName}).`);
      matches.push({ type: 'PHONE_MATCH', existingProfile: phoneMatch });
    }
  }

  // 3. Name Match
  if (fullName && fullName.trim().length > 3) {
    const nameMatch = await TrainerProfile.findOne({
      fullName: new RegExp(`^${fullName.trim()}$`, 'i'),
      ...(excludeTutorId ? { tutorId: { $ne: excludeTutorId } } : {})
    });
    if (nameMatch && !matches.some(m => m.type === 'PHONE_MATCH' && m.existingProfile.tutorId === nameMatch.tutorId)) {
      warnings.push(`A tutor record with identical full name '${fullName.trim()}' already exists (${nameMatch.tutorId}).`);
      matches.push({ type: 'NAME_MATCH', existingProfile: nameMatch });
    }
  }

  return {
    isPossibleDuplicate: matches.length > 0,
    matches,
    warnings
  };
}

/**
 * 11. COMPREHENSIVE FULL TUTOR PAYLOAD VALIDATION
 */
async function validateFullTutorPayload(payload, excludeTutorId = null) {
  const fieldResults = [];
  const errors = [];
  const warnings = [];

  // Name Validation
  const nameRes = validateName(payload.fullName || '', 'Full Name');
  fieldResults.push(nameRes);
  if (!nameRes.isValid) errors.push(nameRes.reason);

  // Email Validation
  const emailRes = await validateEmail(payload.email || '');
  fieldResults.push(emailRes);
  if (!emailRes.isValid) {
    errors.push(emailRes.reason);
  } else if (emailRes.status === 'warning') {
    warnings.push(emailRes.reason);
  }

  // Phone Validation
  const phoneRes = validateIndianMobile(payload.phone || '');
  fieldResults.push(phoneRes);
  if (!phoneRes.isValid) {
    errors.push(phoneRes.reason);
  }

  // DOB & Age Validation
  if (payload.dob || payload.dateOfBirth) {
    const dobRes = validateDobAndAge(payload.dob || payload.dateOfBirth);
    fieldResults.push(dobRes);
    if (!dobRes.isValid) errors.push(dobRes.reason);
  }

  // Qualification
  if (payload.qualification) {
    const qualRes = validateQualification(payload.qualification);
    fieldResults.push(qualRes);
    if (!qualRes.isValid) errors.push(qualRes.reason);
  }

  // Experience Validation & Timeline Consistency
  const expRes = validateExperience(payload.totalExperience, payload.experience);
  fieldResults.push(expRes);
  if (!expRes.isValid) {
    errors.push(expRes.reason);
  } else if (expRes.status === 'warning') {
    warnings.push(expRes.reason);
  }

  // Address & PIN Code
  const pinResList = validateAddressAndPin(payload.address, payload.city, payload.state, payload.pincode);
  pinResList.forEach(res => {
    fieldResults.push(res);
    if (!res.isValid) errors.push(res.reason);
    if (res.status === 'warning') warnings.push(res.reason);
  });

  // URLs (LinkedIn, Portfolio, GitHub)
  if (payload.socialLinks?.linkedin) {
    const linkRes = await validateUrl(payload.socialLinks.linkedin, 'LinkedIn URL', false);
    fieldResults.push(linkRes);
    if (!linkRes.isValid) errors.push(linkRes.reason);
  }

  if (payload.socialLinks?.portfolio) {
    const portRes = await validateUrl(payload.socialLinks.portfolio, 'Portfolio URL', false);
    fieldResults.push(portRes);
    if (!portRes.isValid) errors.push(portRes.reason);
  }

  // Duplicate Detection
  const dupRes = await detectDuplicates(payload.email, payload.phone, payload.fullName, excludeTutorId);
  if (dupRes.isPossibleDuplicate) {
    dupRes.warnings.forEach(w => warnings.push(w));
  }

  // Overall Status Determination
  let overallStatus = 'VALID';
  if (errors.length > 0) {
    overallStatus = 'FAILED';
  } else if (warnings.length > 0 || dupRes.isPossibleDuplicate) {
    overallStatus = 'WARNING';
  }

  return {
    overallStatus,
    fieldResults,
    errors,
    warnings,
    duplicateInfo: dupRes,
    isValid: errors.length === 0
  };
}

module.exports = {
  validateEmail,
  validateIndianMobile,
  validateName,
  validateDobAndAge,
  validateQualification,
  validateExperience,
  validateAddressAndPin,
  validateUrl,
  validateFileBuffer,
  detectDuplicates,
  validateFullTutorPayload
};
