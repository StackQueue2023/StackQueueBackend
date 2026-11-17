const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const app = require('../server');

const routesToTest = [
  // Public
  { method: 'GET', url: '/api/portal/homepage-data' },
  { method: 'GET', url: '/api/portal/courses' },
  { method: 'GET', url: '/api/portal/internships' },
  { method: 'GET', url: '/api/portal/products' },
  
  // Health & Monitoring
  { method: 'GET', url: '/api/health' },
  { method: 'GET', url: '/api/monitoring/system-health' },

  // Admin Domain Management
  { method: 'GET', url: '/api/admin/domain-management/all' },
  { method: 'GET', url: '/api/admin/domain-management/courses' },
  { method: 'GET', url: '/api/admin/syllabus/generation-status/overall' },

  // LMS
  { method: 'GET', url: '/api/lms/courses' },
  { method: 'GET', url: '/api/lms/admin/students/filter-options' },

  // Batches & Colleges
  { method: 'GET', url: '/api/admin/colleges' },
  { method: 'GET', url: '/api/admin/batches?batchType=COLLEGE_TRAINING' },
  { method: 'GET', url: '/api/admin/batches?batchType=LMS' },

  // Tutors & Users
  { method: 'GET', url: '/api/admin/tutors' },
  { method: 'GET', url: '/api/admin/users?role=trainer' },
  
  // Analytics
  { method: 'GET', url: '/api/admin/analytics/overview' },
  { method: 'GET', url: '/api/admin/analytics/courses' },
  { method: 'GET', url: '/api/admin/analytics/internships' },
  { method: 'GET', url: '/api/admin/analytics/products' },
  { method: 'GET', url: '/api/admin/analytics/college-training' },
  { method: 'GET', url: '/api/admin/analytics/college-projects' },

  // Adaptive Questions
  { method: 'GET', url: '/api/adaptive-questions/admin/pending-reviews' },
  { method: 'GET', url: '/api/adaptive-questions/admin/student-results' }
];

async function runTests() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB.\n');
  console.log(`Testing ${routesToTest.length} primary page-loading endpoints...\n`);

  let passed = 0;
  let failed = 0;

  for (const r of routesToTest) {
    const start = Date.now();
    try {
      let resData = null;
      let resStatus = 200;
      const headers = {};

      const req = {
        method: r.method,
        url: r.url,
        originalUrl: r.url,
        query: {},
        params: {},
        headers: {},
        ip: '127.0.0.1',
        requestId: `TEST-${Date.now()}`
      };

      if (r.url.includes('?')) {
        const [base, qs] = r.url.split('?');
        const params = new URLSearchParams(qs);
        for (const [k, v] of params.entries()) {
          req.query[k] = v;
        }
      }

      await new Promise((resolve) => {
        const res = {
          statusCode: 200,
          getHeader(name) {
            return headers[name.toLowerCase()];
          },
          setHeader(name, val) {
            headers[name.toLowerCase()] = val;
            return this;
          },
          status(code) {
            this.statusCode = code;
            resStatus = code;
            return this;
          },
          json(payload) {
            resData = payload;
            resolve();
            return this;
          },
          send(payload) {
            resData = payload;
            resolve();
            return this;
          }
        };

        app.handle(req, res, (err) => {
          if (err) {
            resStatus = 500;
            resData = { error: err.message, stack: err.stack };
          }
          resolve();
        });
      });

      const elapsed = Date.now() - start;
      const mem = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);

      if (resStatus < 400 || resStatus === 401) {
        passed++;
        console.log(`✓ [${resStatus}] ${r.method} ${r.url} (${elapsed}ms, heap: ${mem}MB)`);
      } else {
        failed++;
        console.error(`✗ [${resStatus}] ${r.method} ${r.url} (${elapsed}ms):`, resData?.message || resData);
      }
    } catch (err) {
      failed++;
      console.error(`💥 CRASH on ${r.method} ${r.url}:`, err.message);
    }
  }

  console.log(`\n======================================================`);
  console.log(`TEST RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log(`======================================================`);

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
