/**
 * Safe In-Memory SQL Sandbox for SQL Detective Challenges
 * Simulates SQL queries on sandboxed institute datasets without exposing live DB
 */

const DEFAULT_SANDBOX_DATA = {
  students: [
    { id: 101, name: 'Alice Walker', course: 'Full Stack Java', mark: 92, city: 'Austin', batch: '2026-A' },
    { id: 102, name: 'Bob Chen', course: 'Python AI', mark: 78, city: 'Seattle', batch: '2026-A' },
    { id: 103, name: 'Clara Patel', course: 'Full Stack Java', mark: 85, city: 'Boston', batch: '2026-B' },
    { id: 104, name: 'David Kim', course: 'MERN Stack', mark: 64, city: 'Chicago', batch: '2026-B' },
    { id: 105, name: 'Elena Rostova', course: 'Python AI', mark: 95, city: 'Austin', batch: '2026-A' },
    { id: 106, name: 'Farhan Ali', course: 'DSA Mastery', mark: 88, city: 'Dallas', batch: '2026-C' },
    { id: 107, name: 'Grace Hopper', course: 'MERN Stack', mark: 99, city: 'San Jose', batch: '2026-A' }
  ],
  courses: [
    { id: 1, title: 'Full Stack Java', fee: 1200, trainer: 'Prof. Miller' },
    { id: 2, title: 'Python AI', fee: 1400, trainer: 'Dr. Santos' },
    { id: 3, title: 'MERN Stack', fee: 1100, trainer: 'Prof. Miller' },
    { id: 4, title: 'DSA Mastery', fee: 900, trainer: 'Elena Vance' }
  ]
};

function executeSqlQuery(query, targetCondition = {}) {
  const cleanQuery = (query || '').trim();

  // Basic security: block non-sandboxed operations or injection
  if (/drop\s+database|exec|system|xp_|load_file|outfile/i.test(cleanQuery)) {
    return {
      success: false,
      error: 'Security Error: Dangerous SQL statement rejected.',
      rows: [],
      columns: []
    };
  }

  try {
    let rows = [...DEFAULT_SANDBOX_DATA.students];
    let columns = ['id', 'name', 'course', 'mark', 'city', 'batch'];

    // Simulated parsing of common educational SQL queries
    const selectMatch = cleanQuery.match(/select\s+(.*?)\s+from\s+(\w+)/i);
    if (!selectMatch) {
      return {
        success: false,
        error: 'Invalid SQL: Please write a valid SELECT query.',
        rows: [],
        columns: []
      };
    }

    const requestedCols = selectMatch[1].trim();
    const table = selectMatch[2].trim().toLowerCase();

    if (table === 'courses') {
      rows = [...DEFAULT_SANDBOX_DATA.courses];
      columns = ['id', 'title', 'fee', 'trainer'];
    }

    // WHERE clause processing
    const whereMatch = cleanQuery.match(/where\s+(.*?)(order\s+by|group\s+by|limit|$)/i);
    if (whereMatch) {
      const conditionStr = whereMatch[1].trim();

      // mark > X, mark >= X, mark < X, mark <= X, mark = X
      const markMatch = conditionStr.match(/mark\s*([><!=]+)\s*(\d+)/i);
      if (markMatch) {
        const op = markMatch[1];
        const val = parseInt(markMatch[2], 10);
        rows = rows.filter(r => {
          if (op === '>') return r.mark > val;
          if (op === '>=') return r.mark >= val;
          if (op === '<') return r.mark < val;
          if (op === '<=') return r.mark <= val;
          if (op === '=' || op === '==') return r.mark === val;
          if (op === '!=' || op === '<>') return r.mark !== val;
          return true;
        });
      }

      // course = '...'
      const courseMatch = conditionStr.match(/course\s*=\s*['"]([^'"]+)['"]/i);
      if (courseMatch) {
        const cVal = courseMatch[1].toLowerCase();
        rows = rows.filter(r => r.course && r.course.toLowerCase() === cVal);
      }

      // city = '...'
      const cityMatch = conditionStr.match(/city\s*=\s*['"]([^'"]+)['"]/i);
      if (cityMatch) {
        const cityVal = cityMatch[1].toLowerCase();
        rows = rows.filter(r => r.city && r.city.toLowerCase() === cityVal);
      }
    }

    // ORDER BY processing
    const orderMatch = cleanQuery.match(/order\s+by\s+(\w+)(\s+(asc|desc))?/i);
    if (orderMatch) {
      const orderCol = orderMatch[1].toLowerCase();
      const isDesc = orderMatch[3] && orderMatch[3].toLowerCase() === 'desc';
      rows.sort((a, b) => {
        if (a[orderCol] < b[orderCol]) return isDesc ? 1 : -1;
        if (a[orderCol] > b[orderCol]) return isDesc ? -1 : 1;
        return 0;
      });
    }

    // Column filtering
    if (requestedCols !== '*') {
      const colList = requestedCols.split(',').map(c => c.trim().toLowerCase());
      columns = colList;
      rows = rows.map(r => {
        const filtered = {};
        for (const col of colList) {
          filtered[col] = r[col];
        }
        return filtered;
      });
    }

    // Evaluate target conditions if provided
    let passed = true;
    let feedback = 'Query executed successfully.';

    if (targetCondition && targetCondition.expectedRowCount !== undefined) {
      if (rows.length !== targetCondition.expectedRowCount) {
        passed = false;
        feedback = `Expected ${targetCondition.expectedRowCount} rows, but got ${rows.length}.`;
      }
    }

    if (targetCondition && targetCondition.requiredKeywords) {
      for (const kw of targetCondition.requiredKeywords) {
        if (!new RegExp(`\\b${kw}\\b`, 'i').test(cleanQuery)) {
          passed = false;
          feedback = `Query must use the '${kw.toUpperCase()}' clause.`;
          break;
        }
      }
    }

    return {
      success: true,
      passed,
      feedback,
      columns,
      rows,
      rowCount: rows.length
    };
  } catch (err) {
    return {
      success: false,
      error: `SQL Syntax / Runtime Error: ${err.message}`,
      rows: [],
      columns: []
    };
  }
}

module.exports = {
  executeSqlQuery,
  DEFAULT_SANDBOX_DATA
};
