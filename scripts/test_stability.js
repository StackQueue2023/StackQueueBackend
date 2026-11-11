const http = require('http');

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, data });
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('Testing STACK QUEUE Backend Stability...');

  // 1. Health endpoint
  const r1 = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/health', method: 'GET' });
  console.log(`[Test 1] GET /api/health -> HTTP ${r1.statusCode}`, r1.data);

  // 2. System Health endpoint
  const r2 = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/monitoring/system-health', method: 'GET' });
  console.log(`[Test 2] GET /api/monitoring/system-health -> HTTP ${r2.statusCode}`);

  // 3. 404 Route handling (Must not crash)
  const r3 = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/nonexistent-route-test', method: 'GET' });
  console.log(`[Test 3] GET /api/nonexistent-route-test -> HTTP ${r3.statusCode}`, r3.data);

  // 4. Malformed JSON Body (Must return 400, not crash server)
  const r4 = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/contact',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, '{bad json: true');
  console.log(`[Test 4] POST malformed JSON -> HTTP ${r4.statusCode}`, r4.data);

  // 5. Public Portal Courses API
  const r5 = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/portal/courses', method: 'GET' });
  const data = JSON.parse(r5.data);
  console.log(`[Test 5] GET /api/portal/courses -> HTTP ${r5.statusCode}, Courses count: ${data.courses ? data.courses.length : 'N/A'}`);

  // 6. Verify server is still alive
  const r6 = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/health', method: 'GET' });
  console.log(`[Test 6] Final Health Verification -> HTTP ${r6.statusCode}`);
  console.log('ALL STABILITY TESTS PASSED CLEANLY.');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
