const { spawn } = require('child_process');
const path = require('path');

const DEFAULT_SQL_SCHEMA = `
CREATE TABLE students (
  id INTEGER PRIMARY KEY,
  name TEXT,
  course TEXT,
  grade INTEGER,
  city TEXT,
  batch TEXT
);
INSERT INTO students VALUES (101, 'Alice Walker', 'Full Stack Java', 92, 'Austin', '2026-A');
INSERT INTO students VALUES (102, 'Bob Chen', 'Python AI', 78, 'Seattle', '2026-A');
INSERT INTO students VALUES (103, 'Clara Patel', 'Full Stack Java', 85, 'Boston', '2026-B');
INSERT INTO students VALUES (104, 'David Kim', 'MERN Stack', 64, 'Chicago', '2026-B');
INSERT INTO students VALUES (105, 'Elena Rostova', 'Python AI', 95, 'Austin', '2026-A');
INSERT INTO students VALUES (106, 'Farhan Ali', 'DSA Mastery', 88, 'Dallas', '2026-C');
INSERT INTO students VALUES (107, 'Grace Hopper', 'MERN Stack', 99, 'San Jose', '2026-A');

CREATE TABLE courses (
  id INTEGER PRIMARY KEY,
  title TEXT,
  fee INTEGER,
  trainer TEXT,
  department TEXT
);
INSERT INTO courses VALUES (1, 'Full Stack Java', 1200, 'Prof. Miller', 'Computer Science');
INSERT INTO courses VALUES (2, 'Python AI', 1400, 'Dr. Santos', 'Artificial Intelligence');
INSERT INTO courses VALUES (3, 'MERN Stack', 1100, 'Prof. Miller', 'Computer Science');
INSERT INTO courses VALUES (4, 'DSA Mastery', 900, 'Elena Vance', 'Computer Science');

CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT,
  department TEXT,
  salary INTEGER,
  hire_date TEXT
);
INSERT INTO employees VALUES (1, 'John Doe', 'Engineering', 95000, '2022-03-15');
INSERT INTO employees VALUES (2, 'Jane Smith', 'Marketing', 75000, '2021-06-20');
INSERT INTO employees VALUES (3, 'Michael Brown', 'Engineering', 110000, '2020-01-10');
INSERT INTO employees VALUES (4, 'Emily Davis', 'HR', 65000, '2023-08-01');
INSERT INTO employees VALUES (5, 'David Wilson', 'Marketing', 82000, '2022-11-05');
`;

/**
 * Runs SQL query safely in-memory using Python's built-in sqlite3 engine
 */
function runSql(query, customSetup = '', timeoutMs = 5000) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const cleanQuery = (query || '').trim();

    // Check dangerous patterns
    if (/attach\s+database|detach\s+database|load_extension|pragma\s+writable_schema/i.test(cleanQuery)) {
      return resolve({
        success: false,
        isSecurityViolation: true,
        error: 'Security Error: Unauthorized SQLite operation attempted.',
        output: '',
        executionTimeMs: 0
      });
    }

    const runnerScript = `
import sys
import json
import sqlite3

def run():
    setup = ${JSON.stringify(customSetup || DEFAULT_SQL_SCHEMA)}
    sql = ${JSON.stringify(cleanQuery)}
    con = sqlite3.connect(':memory:')
    con.row_factory = sqlite3.Row
    cur = con.cursor()
    try:
        if setup.strip():
            cur.executescript(setup)
        
        # Execute user query
        # If query has multiple statements, run executescript or execute last
        statements = [s.strip() for s in sql.split(';') if s.strip()]
        if not statements:
            print(json.dumps({"success": True, "output": "", "rows": []}))
            return
            
        rows = []
        for i, stmt in enumerate(statements):
            if i < len(statements) - 1:
                cur.execute(stmt)
            else:
                cur.execute(stmt)
                if cur.description:
                    fetched = cur.fetchall()
                    rows = [dict(r) for r in fetched]
                    cols = [d[0] for d in cur.description]
                    
                    # Also build human readable tabular output
                    formatted_lines = []
                    header = " | ".join(cols)
                    formatted_lines.append(header)
                    formatted_lines.append("-" * len(header))
                    for r in rows:
                        formatted_lines.append(" | ".join(str(r[c]) for c in cols))
                    tabular = "\\n".join(formatted_lines)
                    
                    print(json.dumps({
                        "success": True,
                        "columns": cols,
                        "rows": rows,
                        "tabular": tabular,
                        "count": len(rows)
                    }))
                    return
        print(json.dumps({"success": True, "rows": [], "count": 0, "tabular": "Query executed successfully."}))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
    finally:
        con.close()

if __name__ == '__main__':
    run()
`;

    const py = spawn('python', ['-c', runnerScript], { timeout: timeoutMs });
    let stdout = '';
    let stderr = '';

    py.stdout.on('data', (d) => { stdout += d.toString(); });
    py.stderr.on('data', (d) => { stderr += d.toString(); });

    py.on('close', (exitCode) => {
      const executionTimeMs = Date.now() - startTime;
      if (exitCode !== 0 && !stdout.trim()) {
        return resolve({
          success: false,
          isRuntimeError: true,
          error: (stderr || `Python exit code ${exitCode}`).trim(),
          output: '',
          executionTimeMs
        });
      }

      try {
        const parsed = JSON.parse(stdout.trim());
        if (!parsed.success) {
          return resolve({
            success: false,
            isRuntimeError: true,
            error: parsed.error,
            output: '',
            executionTimeMs
          });
        }

        // Return tabular representation as stdout
        return resolve({
          success: true,
          output: parsed.tabular || JSON.stringify(parsed.rows),
          rows: parsed.rows,
          columns: parsed.columns,
          count: parsed.count,
          executionTimeMs
        });
      } catch (parseErr) {
        return resolve({
          success: true,
          output: stdout.trim(),
          executionTimeMs
        });
      }
    });

    py.on('error', (err) => {
      resolve({
        success: false,
        isRuntimeError: true,
        error: err.message,
        output: '',
        executionTimeMs: Date.now() - startTime
      });
    });
  });
}

module.exports = {
  runSql,
  DEFAULT_SQL_SCHEMA
};
