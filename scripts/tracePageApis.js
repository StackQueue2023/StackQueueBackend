const fs = require('fs');
const path = require('path');

function getPageFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of list) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      results = results.concat(getPageFiles(full));
    } else if (item.isFile() && item.name.endsWith('.jsx')) {
      results.push(full);
    }
  }
  return results;
}

const pages = getPageFiles(path.join(__dirname, '..', '..', 'client', 'src', 'pages'));
console.log('Total pages found:', pages.length);

const pageMap = {};

for (const p of pages) {
  const code = fs.readFileSync(p, 'utf8');
  const apiMatches = [];
  const regex = /api\.(get|post|put|delete|patch)\(\s*[`'"]([^`'"]+)[`'"]/g;
  let m;
  while ((m = regex.exec(code)) !== null) {
    if (!apiMatches.includes(m[2])) {
      apiMatches.push(m[2]);
    }
  }
  const rel = path.relative(path.join(__dirname, '..', '..', 'client', 'src', 'pages'), p).replace(/\\/g, '/');
  if (apiMatches.length > 0) {
    pageMap[rel] = apiMatches;
  }
}

for (const [page, apis] of Object.entries(pageMap)) {
  console.log(`\n📄 [${page}] (${apis.length} API endpoints):`);
  apis.forEach(ep => console.log('   - ' + ep));
}
