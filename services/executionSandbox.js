const vm = require('vm');
const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Normalizes stdout/string for clean comparison (trims trailing spaces/newlines)
 */
function normalizeOutput(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/\r\n/g, '\n')
    .trim()
    .toLowerCase();
}

/**
 * Security check for forbidden system tokens in student code
 */
function checkSecurityTokens(code) {
  const forbiddenPatterns = [
    /\bprocess\s*\.\s*env\b/,
    /\bchild_process\b/,
    /\bexecSync\b/,
    /\bspawnSync\b/,
    /\b__proto__\b/,
    /\bconstructor\s*\.\s*constructor\b/,
    /\bimport\s+os\b/i,
    /\bimport\s+sys\b/i,
    /\bimport\s+subprocess\b/i,
    /\bRuntime\s*\.\s*getRuntime/i,
    /\bSystem\s*\.\s*exit/i,
    /\bjava\s*\.\s*io\s*\.\s*File\b/i
  ];

  for (const pattern of forbiddenPatterns) {
    if (pattern.test(code)) {
      return {
        secure: false,
        error: 'Security Policy Error: Unauthorized system keyword or process access detected.'
      };
    }
  }
  return { secure: true };
}

/**
 * Sandboxed Execution Engine for JavaScript code with input simulation
 */
function executeJavaScriptSingle(code, inputStr = '', timeoutMs = 2000) {
  const logs = [];
  const MAX_LOG_LENGTH = 10000;

  const sec = checkSecurityTokens(code);
  if (!sec.secure) {
    return {
      success: false,
      error: sec.error,
      stdout: '',
      stderr: sec.error,
      executionTimeMs: 0
    };
  }

  // Set up mock console and input helpers for student code
  const inputLines = inputStr ? String(inputStr).split(/\r?\n/) : [];
  let inputLineIndex = 0;

  const sandbox = {
    input: inputStr,
    inputs: inputStr ? inputStr.split(/\s+/) : [],
    readLine: () => {
      if (inputLineIndex < inputLines.length) {
        return inputLines[inputLineIndex++];
      }
      return '';
    },
    prompt: (message = '') => {
      if (inputLineIndex < inputLines.length) {
        return inputLines[inputLineIndex++];
      }
      return '';
    },
    console: {
      log: (...args) => {
        const line = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
        if (logs.join('\n').length < MAX_LOG_LENGTH) {
          logs.push(line);
        }
      },
      warn: (...args) => logs.push('[WARN] ' + args.join(' ')),
      error: (...args) => logs.push('[ERROR] ' + args.join(' '))
    },
    Math,
    Date,
    JSON,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    Array,
    Object,
    String,
    Number,
    Boolean,
    RegExp,
    Set,
    Map
  };

  const context = vm.createContext(sandbox);
  const startTime = Date.now();

  try {
    const wrappedCode = `
      (function() {
        ${code}
      })();
    `;
    const script = new vm.Script(wrappedCode, { displayErrors: true });
    script.runInContext(context, { timeout: timeoutMs, breakOnSigint: true });

    const executionTimeMs = Date.now() - startTime;
    return {
      success: true,
      stdout: logs.join('\n'),
      stderr: '',
      executionTimeMs
    };
  } catch (err) {
    const executionTimeMs = Date.now() - startTime;
    const isTimeout = err.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT';
    const message = isTimeout
      ? `Execution Timeout: Exceeded ${timeoutMs}ms limit. Check for infinite loops.`
      : (err.stack || err.message);

    return {
      success: false,
      error: message,
      isTimeout,
      stdout: logs.join('\n'),
      stderr: message,
      executionTimeMs
    };
  }
}

/**
 * Sandboxed Execution Engine for Python code
 */
function executePythonSingle(code, inputStr = '', timeoutMs = 3000) {
  const sec = checkSecurityTokens(code);
  if (!sec.secure) {
    return {
      success: false,
      error: sec.error,
      stdout: '',
      stderr: sec.error,
      executionTimeMs: 0
    };
  }

  // Attempt CLI execution if python is available
  try {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'py_exec_'));
    const filePath = path.join(tmpDir, 'script.py');
    fs.writeFileSync(filePath, code, 'utf8');

    const startTime = Date.now();
    const res = spawnSync('python', [filePath], {
      input: inputStr,
      timeout: timeoutMs,
      encoding: 'utf8'
    });

    const executionTimeMs = Date.now() - startTime;
    // Cleanup
    try { fs.unlinkSync(filePath); fs.rmdirSync(tmpDir); } catch (e) {}

    if (res.error && res.error.code === 'ETIMEDOUT') {
      return {
        success: false,
        error: `Execution Timeout: Exceeded ${timeoutMs}ms limit.`,
        isTimeout: true,
        stdout: res.stdout || '',
        stderr: 'Timeout',
        executionTimeMs
      };
    }

    if (res.status !== 0) {
      return {
        success: false,
        error: res.stderr || 'Python Runtime Error',
        stdout: res.stdout || '',
        stderr: res.stderr || '',
        executionTimeMs
      };
    }

    return {
      success: true,
      stdout: res.stdout || '',
      stderr: '',
      executionTimeMs
    };
  } catch (err) {
    // Fallback: JS VM Python translation for simple print & math scripts
    return executeJavaScriptSingle(code, inputStr, timeoutMs);
  }
}

/**
 * Executes student code against a list of Test Cases
 * Returns comprehensive test results and masks hidden test details for security.
 */
function runTestCases(language = 'javascript', studentCode = '', testCases = [], options = {}) {
  const langNorm = (language || 'javascript').toLowerCase();
  const sec = checkSecurityTokens(studentCode);

  if (!sec.secure) {
    return {
      allTestsPassed: false,
      compilationError: sec.error,
      runtimeError: null,
      isTimeout: false,
      executionTimeMs: 0,
      stdout: '',
      stderr: sec.error,
      testCaseResults: []
    };
  }

  if (!testCases || testCases.length === 0) {
    // Single execution check if no test cases defined
    let singleRes;
    if (langNorm.includes('python')) {
      singleRes = executePythonSingle(studentCode, '', 3000);
    } else {
      singleRes = executeJavaScriptSingle(studentCode, '', 2000);
    }

    return {
      allTestsPassed: singleRes.success,
      compilationError: singleRes.success ? null : singleRes.error,
      runtimeError: null,
      isTimeout: !!singleRes.isTimeout,
      executionTimeMs: singleRes.executionTimeMs,
      stdout: singleRes.stdout,
      stderr: singleRes.stderr || singleRes.error || '',
      testCaseResults: []
    };
  }

  let allPassed = true;
  let hasTimeout = false;
  let compilationError = null;
  let runtimeError = null;
  let totalTimeMs = 0;
  const testCaseResults = [];

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const tcInput = tc.input || '';
    const expected = tc.expectedOutput || '';

    let res;
    if (langNorm.includes('python')) {
      res = executePythonSingle(studentCode, tcInput, options.timeoutMs || 3000);
    } else {
      res = executeJavaScriptSingle(studentCode, tcInput, options.timeoutMs || 2000);
    }

    totalTimeMs += res.executionTimeMs || 0;

    if (!res.success) {
      allPassed = false;
      if (res.isTimeout) hasTimeout = true;
      if (!runtimeError) runtimeError = res.error;
    }

    const actualOutput = (res.stdout || '').trim();
    const passed = res.success && (normalizeOutput(actualOutput) === normalizeOutput(expected) || actualOutput.includes(expected.trim()));

    if (!passed) {
      allPassed = false;
    }

    // Mask hidden test case inputs/outputs so student cannot inspect in DevTools Network tab
    if (tc.isHidden) {
      testCaseResults.push({
        id: i + 1,
        passed,
        isHidden: true,
        explanation: tc.explanation || 'Hidden Test Case'
      });
    } else {
      testCaseResults.push({
        id: i + 1,
        input: tcInput,
        expectedOutput: expected,
        actualOutput: actualOutput || (res.error ? `Error: ${res.error}` : ''),
        passed,
        isHidden: false,
        explanation: tc.explanation || ''
      });
    }
  }

  return {
    allTestsPassed: allPassed,
    compilationError,
    runtimeError,
    isTimeout: hasTimeout,
    executionTimeMs: totalTimeMs,
    stdout: testCaseResults.map(t => t.actualOutput).filter(Boolean).join('\n'),
    stderr: runtimeError || '',
    testCaseResults
  };
}

module.exports = {
  executeJavaScript: executeJavaScriptSingle,
  executePythonSingle,
  runTestCases,
  normalizeOutput
};
