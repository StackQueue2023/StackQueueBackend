const http = require('http');

async function testStart(domain) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ domain, difficulty: 'Easy', duration: 15 });
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/interview/mock-interview/start',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, error: e.message, raw: data });
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function run() {
  const domains = ['java', 'python', 'cpp', 'dsa', 'javascript', 'sql', 'cybersecurity'];
  for (const d of domains) {
    const r = await testStart(d);
    const qs = r.body?.data?.questions || [];
    const returnedDomains = [...new Set(qs.map(q => q.domain))];
    console.log(`Domain [${d}]: status=${r.status}, questions=${qs.length}, returnedDomains=${JSON.stringify(returnedDomains)}, msg="${r.body?.message || ''}"`);
  }
}

run();
