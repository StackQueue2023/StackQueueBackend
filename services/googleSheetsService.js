const crypto = require('crypto');
const User = require('../models/User');
const InternshipBatch = require('../models/InternshipBatch');
const InternshipStudent = require('../models/InternshipStudent');

/**
 * Extracts Google Sheet ID and GID from any Google Sheets URL
 */
function parseGoogleSheetUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    throw new Error('Please provide a valid Google Sheet URL.');
  }

  const url = rawUrl.trim();

  // Published to web format: /spreadsheets/d/e/2PACX-.../pub?output=csv
  if (url.includes('/spreadsheets/d/e/')) {
    const pubMatch = url.match(/\/spreadsheets\/d\/e\/([a-zA-Z0-9-_]+)/);
    if (pubMatch && pubMatch[1]) {
      return {
        sheetId: pubMatch[1],
        gid: '0',
        isPublished: true,
        directCsvUrl: url.includes('output=csv') ? url : url.replace(/\/pubhtml|\/pub/, '/pub?output=csv')
      };
    }
  }

  // Standard sheet format: /spreadsheets/d/<SHEET_ID>/...
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match || !match[1]) {
    throw new Error('Invalid Google Sheet URL format. Expected URL containing "/spreadsheets/d/<SHEET_ID>".');
  }

  const sheetId = match[1];

  // Extract gid (tab identifier) if available
  let gid = '0';
  const gidMatch = url.match(/[#?&]gid=([0-9]+)/);
  if (gidMatch && gidMatch[1]) {
    gid = gidMatch[1];
  }

  return {
    sheetId,
    gid,
    isPublished: false,
    directCsvUrl: `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`,
    gvizCsvUrl: `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`
  };
}

/**
 * Fetches raw CSV data from the Google Sheet
 */
async function fetchSheetCsv(rawUrl) {
  const parsed = parseGoogleSheetUrl(rawUrl);
  const candidateUrls = parsed.isPublished
    ? [parsed.directCsvUrl]
    : [parsed.directCsvUrl, parsed.gvizCsvUrl];

  let lastError = null;
  for (const url of candidateUrls) {
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'text/csv,text/plain,*/*',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) STACK-QUEUE-Internship-Importer/1.0'
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(15000)
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('ACCESS_DENIED');
        }
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || '';
      const text = await response.text();

      // If Google redirected to an HTML login page
      if (text.includes('accounts.google.com') || (text.includes('<html') && text.includes('Sign in'))) {
        throw new Error('ACCESS_DENIED');
      }

      // Check if response looks like valid CSV (has commas/newlines and not pure HTML error)
      if (contentType.includes('html') && text.includes('<html')) {
        throw new Error('Received HTML webpage instead of CSV. Ensure the sheet is shared publicly.');
      }

      return {
        sheetId: parsed.sheetId,
        gid: parsed.gid,
        csvText: text
      };
    } catch (err) {
      if (err.message === 'ACCESS_DENIED') {
        throw new Error(
          'Google Sheet Access Denied: The spreadsheet is private. In Google Sheets, click "Share" (top-right), change General Access to "Anyone with the link can view", and submit again.'
        );
      }
      lastError = err;
    }
  }

  throw new Error(`Failed to access Google Sheet: ${lastError ? lastError.message : 'Unknown network failure'}`);
}

/**
 * Robust CSV parser that handles quotes, escaped quotes, commas, and multi-line values
 */
function parseCsv(text) {
  const cleanText = text.replace(/^\uFEFF/, '').trim(); // Remove UTF-8 BOM
  if (!cleanText) return [];

  const rows = [];
  let currentRow = [];
  let currentVal = '';
  let inQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentVal += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentVal.trim());
      currentVal = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // handle CRLF
      }
      currentRow.push(currentVal.trim());
      if (currentRow.some(c => c.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentVal = '';
    } else {
      currentVal += char;
    }
  }

  if (currentVal || currentRow.length > 0) {
    currentRow.push(currentVal.trim());
    if (currentRow.some(c => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Intelligent Column Detection based on Header Keywords
 */
function identifyColumns(headerRow) {
  const mapping = {
    nameIdx: -1,
    emailIdx: -1,
    phoneIdx: -1,
    courseIdx: -1,
    collegeIdx: -1,
    deptIdx: -1,
    batchIdx: -1,
    feeIdx: -1,
    paidIdx: -1,
    pendingIdx: -1,
    statusIdx: -1,
    dateIdx: -1,
    refIdx: -1
  };

  headerRow.forEach((col, idx) => {
    const h = col.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Name matchers
    if (mapping.nameIdx === -1 && /^(name|studentname|candidatename|fullname|student|candidat)$/.test(h)) {
      mapping.nameIdx = idx;
    } else if (mapping.nameIdx === -1 && h.includes('name') && !h.includes('course') && !h.includes('college')) {
      mapping.nameIdx = idx;
    }

    // Email matchers
    if (mapping.emailIdx === -1 && (h.includes('email') || h.includes('mail'))) {
      mapping.emailIdx = idx;
    }

    // Phone matchers
    if (mapping.phoneIdx === -1 && (h.includes('phone') || h.includes('mobile') || h.includes('contact') || h.includes('whatsapp') || h === 'phno')) {
      mapping.phoneIdx = idx;
    }

    // Course / Domain matchers
    if (mapping.courseIdx === -1 && (h.includes('course') || h.includes('domain') || h.includes('internship') || h.includes('technology') || h.includes('stream') || h.includes('track'))) {
      mapping.courseIdx = idx;
    }

    // College / Institution matchers
    if (mapping.collegeIdx === -1 && (h.includes('college') || h.includes('institution') || h.includes('university') || h.includes('campus'))) {
      mapping.collegeIdx = idx;
    }

    // Department matchers
    if (mapping.deptIdx === -1 && (h.includes('dept') || h.includes('department') || h.includes('branch'))) {
      mapping.deptIdx = idx;
    }

    // Batch identifier in sheet
    if (mapping.batchIdx === -1 && (h.includes('batch') || h.includes('cohort'))) {
      mapping.batchIdx = idx;
    }

    // Total Fee matchers
    if (mapping.feeIdx === -1 && (h.includes('totalfee') || h.includes('expectedfee') || h.includes('coursefee') || h.includes('totalamount') || h === 'fee' || h === 'fees' || h === 'amount')) {
      mapping.feeIdx = idx;
    }

    // Amount Paid matchers
    if (mapping.paidIdx === -1 && (h.includes('paidamount') || h.includes('amountpaid') || h === 'paid' || h.includes('feespaid'))) {
      mapping.paidIdx = idx;
    }

    // Amount Pending matchers
    if (mapping.pendingIdx === -1 && (h.includes('pending') || h.includes('balance') || h.includes('due'))) {
      mapping.pendingIdx = idx;
    }

    // Payment Status matchers
    if (mapping.statusIdx === -1 && (h.includes('paymentstatus') || h.includes('paystatus') || h === 'status')) {
      mapping.statusIdx = idx;
    }

    // Payment Date matchers
    if (mapping.dateIdx === -1 && (h.includes('date') || h.includes('paiddate') || h.includes('paymentdate'))) {
      mapping.dateIdx = idx;
    }

    // Transaction / Reference matchers
    if (mapping.refIdx === -1 && (h.includes('txn') || h.includes('transaction') || h.includes('ref') || h.includes('receipt') || h.includes('utr'))) {
      mapping.refIdx = idx;
    }
  });

  return mapping;
}

/**
 * Cleans numbers from currency symbols, commas, or spaces (e.g. "₹ 1,200.00" -> 1200)
 */
function parseCurrency(val) {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const cleaned = String(val).replace(/[^0-9.-]+/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : Math.max(0, parsed);
}

/**
 * Cleans name for username generation: removes accents, symbols, spaces and capitalizes
 */
function sanitizeNameForUsername(name) {
  if (!name) return 'Student';
  return name
    .replace(/[^a-zA-Z0-9]/g, '')
    .trim();
}

/**
 * Cleans course name into short, compact identifier (e.g. "Java Full Stack Development" -> "Java")
 */
function sanitizeCourseForUsername(course) {
  if (!course) return 'Intern';
  const c = course.trim();
  const firstWord = c.split(/[\s(/\\-]+/)[0];
  const cleaned = firstWord.replace(/[^a-zA-Z0-9]/g, '');
  return cleaned ? (cleaned.charAt(0).toUpperCase() + cleaned.slice(1)) : 'Intern';
}

/**
 * Formats a sequential username: StudentName + CourseName + StudentCount
 * Example: Arun + Java + 0001 -> ArunJava0001
 */
function formatUsername(studentName, courseName, sequentialNum) {
  const cleanName = sanitizeNameForUsername(studentName);
  const cleanCourse = sanitizeCourseForUsername(courseName);
  const paddedCount = String(sequentialNum).padStart(4, '0');
  return `${cleanName}${cleanCourse}${paddedCount}`;
}

/**
 * Generates a secure, cryptographically random temporary password
 */
function generateSecureTemporaryPassword(length = 12) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
  let pwd = '';
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    pwd += chars[randomBytes[i] % chars.length];
  }
  return pwd;
}

/**
 * Core Service: Preview Google Sheet, parse records, and validate against database
 */
async function previewGoogleSheet(googleSheetUrl) {
  const { sheetId, gid, csvText } = await fetchSheetCsv(googleSheetUrl);
  const rows = parseCsv(csvText);

  if (rows.length < 2) {
    throw new Error('The spreadsheet appears empty or contains only a single header row without student data.');
  }

  const headerRow = rows[0];
  const dataRows = rows.slice(1);
  const colMap = identifyColumns(headerRow);

  if (colMap.nameIdx === -1 && colMap.emailIdx === -1) {
    throw new Error(
      `Could not identify Student Name or Email columns. Detected columns: [${headerRow.join(', ')}]. Please ensure your sheet has headers like "Name" and "Email".`
    );
  }

  // Detect dominant course/domain from data rows
  const courseCounts = {};
  dataRows.forEach(r => {
    const c = colMap.courseIdx !== -1 ? (r[colMap.courseIdx] || '').trim() : '';
    if (c) {
      courseCounts[c] = (courseCounts[c] || 0) + 1;
    }
  });

  let detectedCourse = 'General Internship';
  let maxCount = 0;
  for (const [c, count] of Object.entries(courseCounts)) {
    if (count > maxCount) {
      maxCount = count;
      detectedCourse = c;
    }
  }

  // Check if a batch already exists for this exact Google Sheet
  const existingBatch = await InternshipBatch.findOne({
    $or: [
      { googleSheetUrl: googleSheetUrl.trim() },
      { googleSheetId: sheetId }
    ]
  });

  // Calculate next sequential batch number for this course
  let batchSequence = 1;
  const courseBatchCount = await InternshipBatch.countDocuments({
    courseName: { $regex: new RegExp(`^${detectedCourse.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}$`, 'i') }
  });
  batchSequence = courseBatchCount + 1;

  // Auto-generate batch name
  const detectedBatchName = existingBatch
    ? existingBatch.batchName
    : `${detectedCourse} Internship Batch ${batchSequence}`;

  const cleanCourseCode = detectedCourse.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) || 'INT';
  const detectedBatchCode = existingBatch
    ? existingBatch.batchCode
    : `INT-${cleanCourseCode}-${Date.now().toString().slice(-4)}-B${batchSequence}`;

  // Pre-fetch all existing users with emails in this sheet to detect duplicates
  const candidateEmails = dataRows
    .map(r => (colMap.emailIdx !== -1 ? (r[colMap.emailIdx] || '').trim().toLowerCase() : ''))
    .filter(e => e && e.includes('@'));

  const existingUsers = await User.find({ email: { $in: candidateEmails } }).select('email name username').lean();
  const existingEmailMap = new Map(existingUsers.map(u => [u.email.toLowerCase(), u]));

  // Get current student count for this course across system to calculate sequential numbers
  const currentTotalForCourse = await InternshipStudent.countDocuments({
    courseName: { $regex: new RegExp(`^${detectedCourse.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}$`, 'i') }
  });

  let sequentialCounter = currentTotalForCourse + 1;

  // Process rows
  const studentsPreview = [];
  let totalExpectedFees = 0;
  let totalCollectedFees = 0;
  let totalPendingFees = 0;
  let fullyPaidCount = 0;
  let partiallyPaidCount = 0;
  let unpaidCount = 0;

  dataRows.forEach((r, idx) => {
    const rawName = colMap.nameIdx !== -1 ? (r[colMap.nameIdx] || '').trim() : '';
    const rawEmail = colMap.emailIdx !== -1 ? (r[colMap.emailIdx] || '').trim() : '';
    const rawPhone = colMap.phoneIdx !== -1 ? (r[colMap.phoneIdx] || '').trim() : '';
    const rowCourse = colMap.courseIdx !== -1 && r[colMap.courseIdx] ? r[colMap.courseIdx].trim() : detectedCourse;
    const rawCollege = colMap.collegeIdx !== -1 ? (r[colMap.collegeIdx] || '').trim() : '';
    const rawDept = colMap.deptIdx !== -1 ? (r[colMap.deptIdx] || '').trim() : '';

    // Payments
    let fee = colMap.feeIdx !== -1 ? parseCurrency(r[colMap.feeIdx]) : 1200; // default 1200 from STACK QUEUE 15-day fee structure
    let paid = colMap.paidIdx !== -1 ? parseCurrency(r[colMap.paidIdx]) : 0;
    let pending = colMap.pendingIdx !== -1 ? parseCurrency(r[colMap.pendingIdx]) : Math.max(0, fee - paid);

    if (fee === 0 && paid > 0) {
      fee = paid;
      pending = 0;
    }

    let paymentStatus = 'Unpaid';
    if (fee > 0 && paid >= fee) {
      paymentStatus = 'Fully Paid';
      fullyPaidCount++;
    } else if (paid > 0 && paid < fee) {
      paymentStatus = 'Partially Paid';
      partiallyPaidCount++;
    } else {
      paymentStatus = 'Unpaid';
      unpaidCount++;
    }

    totalExpectedFees += fee;
    totalCollectedFees += paid;
    totalPendingFees += pending;

    const emailLower = rawEmail.toLowerCase();
    const isExisting = existingEmailMap.has(emailLower);
    const existingUserData = isExisting ? existingEmailMap.get(emailLower) : null;

    // Generated Username preview
    const previewUsername = existingUserData?.username || formatUsername(rawName, rowCourse, sequentialCounter);
    if (!isExisting) {
      sequentialCounter++;
    }

    // Validation flags
    const errors = [];
    if (!rawName) errors.push('Missing Student Name');
    if (!rawEmail) errors.push('Missing Email Address');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) errors.push('Invalid Email Format');

    studentsPreview.push({
      rowIndex: idx + 2, // 1-based, accounts for header row
      studentName: rawName || 'Unknown Student',
      email: rawEmail,
      phone: rawPhone,
      courseName: rowCourse,
      college: rawCollege,
      department: rawDept,
      fee,
      paidAmount: paid,
      pendingAmount: pending,
      paymentStatus,
      paymentMode: colMap.refIdx !== -1 && r[colMap.refIdx] ? 'Online Ref' : 'Standard',
      transactionRef: colMap.refIdx !== -1 ? (r[colMap.refIdx] || '').trim() : '',
      paymentDate: colMap.dateIdx !== -1 ? (r[colMap.dateIdx] || '').trim() : '',
      proposedUsername: previewUsername,
      isExistingUser: isExisting,
      isValid: errors.length === 0,
      validationErrors: errors
    });
  });

  return {
    success: true,
    sheetId,
    gid,
    googleSheetUrl,
    detectedBatchName,
    detectedBatchCode,
    detectedCourse,
    isExistingBatch: !!existingBatch,
    existingBatchId: existingBatch?._id || null,
    totalRows: dataRows.length,
    validStudentsCount: studentsPreview.filter(s => s.isValid).length,
    invalidStudentsCount: studentsPreview.filter(s => !s.isValid).length,
    existingStudentsCount: studentsPreview.filter(s => s.isExistingUser).length,
    newStudentsCount: studentsPreview.filter(s => s.isValid && !s.isExistingUser).length,
    headers: headerRow,
    mappedColumns: {
      name: colMap.nameIdx !== -1 ? headerRow[colMap.nameIdx] : 'Not Found',
      email: colMap.emailIdx !== -1 ? headerRow[colMap.emailIdx] : 'Not Found',
      phone: colMap.phoneIdx !== -1 ? headerRow[colMap.phoneIdx] : 'Not Found',
      course: colMap.courseIdx !== -1 ? headerRow[colMap.courseIdx] : 'Not Found (Using dominant)',
      college: colMap.collegeIdx !== -1 ? headerRow[colMap.collegeIdx] : 'Not Found',
      fee: colMap.feeIdx !== -1 ? headerRow[colMap.feeIdx] : 'Auto Standard',
      paid: colMap.paidIdx !== -1 ? headerRow[colMap.paidIdx] : 'Not Found',
      pending: colMap.pendingIdx !== -1 ? headerRow[colMap.pendingIdx] : 'Calculated'
    },
    financialSummary: {
      totalExpectedFees,
      totalCollectedFees,
      totalPendingFees,
      fullyPaidCount,
      partiallyPaidCount,
      unpaidCount
    },
    students: studentsPreview
  };
}

module.exports = {
  parseGoogleSheetUrl,
  fetchSheetCsv,
  previewGoogleSheet,
  formatUsername,
  generateSecureTemporaryPassword
};
