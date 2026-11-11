const vm = require('vm');
const { execFile, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Temporary directory for sandboxed file runs
const RUNNER_DIR = path.join(__dirname, '..', 'scratch', 'runners');
if (!fs.existsSync(RUNNER_DIR)) {
  fs.mkdirSync(RUNNER_DIR, { recursive: true });
}

/**
 * Normalizes output strings for robust comparison
 * Handles CRLF, leading/trailing whitespace, and line structures
 */
function normalizeOutput(str) {
  if (str === null || str === undefined) return '';
  if (typeof str !== 'string') {
    str = JSON.stringify(str);
  }
  return str
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n')
    .trim();
}

/**
 * Security filter for unauthorized system tokens
 */
function checkSecurityTokens(language, code = '') {
  const langLower = (language || '').toLowerCase().trim();

  const jsForbidden = [
    /\bprocess\.exit\b/,
    /\brequire\s*\(\s*['"](child_process|net|cluster|worker_threads)['"]/,
    /\bimport\s+.*from\s+['"](child_process|net)['"]/,
    /\bconstructor\s*\.\s*constructor\b/,
    /\b__proto__\b/
  ];

  const pyForbidden = [
    /\bimport\s+(os|subprocess|shutil|socket|pty|ctypes|requests|urllib)\b/,
    /\bfrom\s+(os|subprocess|shutil|socket|pty|ctypes|requests|urllib)\b/,
    /\b(eval|exec|compile)\s*\(/,
    /\b__import__\b/
  ];

  const javaForbidden = [
    /\bProcessBuilder\b/,
    /\bRuntime\.getRuntime\b/,
    /\bjava\.net\b/,
    /\bSystem\.exit\b/
  ];

  let patterns = [];
  if (langLower === 'javascript' || langLower === 'js') patterns = jsForbidden;
  else if (langLower === 'python' || langLower === 'py') patterns = pyForbidden;
  else if (langLower === 'java') patterns = javaForbidden;

  for (const pattern of patterns) {
    if (pattern.test(code)) {
      return {
        safe: false,
        error: `Security Error: Unauthorized library, process, or system call detected in ${language} code.`
      };
    }
  }

  return { safe: true };
}

/**
 * 1. JavaScript Runner (Node.js runtime with stdin simulation and LeetCode function support)
 */
function runJavaScript(code, inputStr, timeoutMs = 5000) {
  return new Promise((resolve) => {
    const fileId = `js_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const scriptPath = path.join(RUNNER_DIR, `${fileId}.js`);

    const harness = `
const fs = require('fs');
const rawInput = ${JSON.stringify(inputStr === undefined || inputStr === null ? '' : String(inputStr))};

// Robust prompt input line buffer for browser-like synchronous input
let inputLines = [];
if (rawInput.length > 0) {
  inputLines = rawInput.split(/\\r?\\n/);
  // If input has trailing newline, pop empty trailing entry so it matches exact line count
  if (rawInput.endsWith('\\n') && inputLines[inputLines.length - 1] === '') {
    inputLines.pop();
  }
}
let promptIndex = 0;

function prompt(message = '') {
  if (promptIndex < inputLines.length) {
    const val = inputLines[promptIndex++];
    return val !== undefined ? val : '';
  }
  return '';
}

global.prompt = prompt;
globalThis.prompt = prompt;
if (typeof window === 'undefined') {
  global.window = global;
}
window.prompt = prompt;

const lines = rawInput.split(/\\r?\\n/);
let lineIdx = 0;
global.readline = () => lines[lineIdx++];
global.input = rawInput;

const origReadFileSync = fs.readFileSync;
fs.readFileSync = function(fd, options) {
  if (fd === 0 || fd === '/dev/stdin' || fd === 'dev/stdin') {
    return rawInput;
  }
  return origReadFileSync.apply(this, arguments);
};

let capturedLogs = [];
const origLog = console.log;
console.log = function(...args) {
  capturedLogs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
  origLog.apply(console, args);
};

try {
  // Student Code
  ${code}

  if (capturedLogs.length === 0) {
    let fn = null;
    if (typeof solution === 'function') fn = solution;
    else if (typeof Solution === 'function') {
      try {
        const inst = new Solution();
        if (typeof inst.solution === 'function') fn = inst.solution.bind(inst);
        else {
          const proto = Object.getPrototypeOf(inst);
          const methods = Object.getOwnPropertyNames(proto).filter(m => m !== 'constructor' && typeof inst[m] === 'function');
          if (methods.length > 0) fn = inst[methods[0]].bind(inst);
        }
      } catch(e) {}
    }

    if (fn) {
      let parsedInput;
      try { parsedInput = JSON.parse(rawInput); } catch(e) { parsedInput = rawInput; }
      let res;
      if (Array.isArray(parsedInput) && fn.length > 1 && parsedInput.length === fn.length) {
        res = fn(...parsedInput);
      } else {
        res = fn(parsedInput);
      }
      if (res !== undefined) {
        origLog(typeof res === 'object' ? JSON.stringify(res) : String(res));
      }
    }
  }
} catch (err) {
  console.error("Runtime Error: " + err.message);
  if (err.stack) console.error(err.stack);
  process.exit(1);
}
`;

    fs.writeFileSync(scriptPath, harness, 'utf8');
    const startTime = Date.now();

    execFile('node', [scriptPath], { timeout: timeoutMs }, (err, stdout, stderr) => {
      const executionTimeMs = Date.now() - startTime;
      try { fs.unlinkSync(scriptPath); } catch (_) {}

      if (err) {
        if (err.killed) {
          return resolve({
            success: false,
            isTimeout: true,
            error: `Time Limit Exceeded (${timeoutMs}ms)`,
            output: '',
            executionTimeMs
          });
        }

        const isSyntax = (stderr || '').includes('SyntaxError');
        return resolve({
          success: false,
          isCompilationError: isSyntax,
          isRuntimeError: !isSyntax,
          error: (stderr || err.message).trim(),
          output: stdout ? stdout.trim() : '',
          executionTimeMs
        });
      }

      return resolve({
        success: true,
        output: (stdout || '').trim(),
        executionTimeMs
      });
    });
  });
}

/**
 * 2. Python Runner (Python 3.11 with stdin simulation and LeetCode function support)
 */
function runPython(code, inputStr, timeoutMs = 5000) {
  return new Promise((resolve) => {
    const fileId = `py_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const scriptPath = path.join(RUNNER_DIR, `${fileId}.py`);

    const harness = `
import json
import sys
import io

raw_input_val = ${JSON.stringify(inputStr || '')}
sys.stdin = io.StringIO(raw_input_val)

stdout_capture = io.StringIO()
old_stdout = sys.stdout
sys.stdout = stdout_capture

globals_dict = {'__builtins__': __builtins__}

execution_error = None
try:
    exec(${JSON.stringify(code)}, globals_dict)
except Exception as e:
    execution_error = e

sys.stdout = old_stdout

if execution_error is not None:
    import traceback
    print(f"Runtime Error:\\n{execution_error}", file=sys.stderr)
    traceback.print_exc(file=sys.stderr)
    sys.exit(1)

printed_output = stdout_capture.getvalue()
if printed_output.strip():
    print(printed_output.strip())
else:
    target_func = None
    if 'Solution' in globals_dict and isinstance(globals_dict['Solution'], type):
        try:
            instance = globals_dict['Solution']()
            methods = [m for m in dir(instance) if callable(getattr(instance, m)) and not m.startswith('__')]
            if 'solution' in methods:
                target_func = getattr(instance, 'solution')
            elif methods:
                target_func = getattr(instance, methods[0])
        except Exception:
            pass

    if not target_func:
        if 'solution' in globals_dict and callable(globals_dict['solution']):
            target_func = globals_dict['solution']

    if target_func:
        try:
            try:
                parsed_input = json.loads(raw_input_val)
            except Exception:
                parsed_input = raw_input_val

            import inspect
            sig = inspect.signature(target_func)
            param_count = len(sig.parameters)

            if param_count > 1 and isinstance(parsed_input, list) and len(parsed_input) == param_count:
                res = target_func(*parsed_input)
            else:
                res = target_func(parsed_input)

            if res is not None:
                if isinstance(res, (dict, list)):
                    print(json.dumps(res))
                elif isinstance(res, bool):
                    print(str(res).lower())
                else:
                    print(res)
        except Exception as e:
            print(f"Runtime Error: {e}", file=sys.stderr)
            sys.exit(1)
`;

    fs.writeFileSync(scriptPath, harness, 'utf8');
    const startTime = Date.now();

    execFile('python', [scriptPath], { timeout: timeoutMs, maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
      const executionTimeMs = Date.now() - startTime;
      try { fs.unlinkSync(scriptPath); } catch (_) {}

      if (err) {
        if (err.killed) {
          return resolve({
            success: false,
            isTimeout: true,
            error: `Time Limit Exceeded (${timeoutMs}ms)`,
            output: '',
            executionTimeMs
          });
        }

        const isSyntax = (stderr || '').includes('SyntaxError');
        return resolve({
          success: false,
          isCompilationError: isSyntax,
          isRuntimeError: !isSyntax,
          error: (stderr || err.message).trim(),
          output: stdout ? stdout.trim() : '',
          executionTimeMs
        });
      }

      return resolve({
        success: true,
        output: (stdout || '').trim(),
        executionTimeMs
      });
    });
  });
}

/**
 * 3. Java Runner (JDK 22 with javac & java execution)
 */
function prepareJavaExecution(userCode) {
  // Strip package declaration if present to avoid path mismatch
  let cleanCode = userCode.replace(/^\s*package\s+[a-zA-Z0-9_.]+;\s*/gm, '');

  let mainClassName = 'Solution';

  const publicClassMatch = cleanCode.match(/public\s+class\s+([A-Za-z0-9_]+)/);
  if (publicClassMatch) {
    mainClassName = publicClassMatch[1];
  } else {
    const classMatch = cleanCode.match(/class\s+([A-Za-z0-9_]+)/);
    if (classMatch) {
      mainClassName = classMatch[1];
    }
  }

  // If code contains main method
  if (cleanCode.includes('public static void main')) {
    let source = cleanCode;
    if (!source.includes('import java.util.')) {
      source = `import java.util.*;\nimport java.io.*;\n${source}`;
    }
    return {
      mainClassName,
      sourceCode: source
    };
  }

  // Otherwise LeetCode class Solution harness
  let classBody = cleanCode;
  if (cleanCode.includes('class Solution') || cleanCode.includes(`class ${mainClassName}`)) {
    const firstBrace = cleanCode.indexOf('{');
    const lastBrace = cleanCode.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      classBody = cleanCode.substring(firstBrace + 1, lastBrace);
    }
  }

  const driverSource = `
import java.util.*;
import java.io.*;
import java.lang.reflect.*;

public class Solution {
    ${classBody}

    public static void main(String[] args) {
        try {
            Scanner sc = new Scanner(System.in);
            StringBuilder sb = new StringBuilder();
            while (sc.hasNextLine()) {
                sb.append(sc.nextLine()).append("\\n");
            }
            String rawInput = sb.toString().trim();

            Solution instance = new Solution();
            Method targetMethod = null;
            for (Method m : Solution.class.getDeclaredMethods()) {
                if (!m.getName().equals("main") && !m.getName().startsWith("lambda$") && !m.getName().equals("parseArgs") && !m.getName().equals("parseSingle") && !m.getName().equals("splitArgs")) {
                    targetMethod = m;
                    break;
                }
            }

            if (targetMethod == null) {
                System.err.println("No solution method found in class Solution.");
                System.exit(1);
            }

            targetMethod.setAccessible(true);
            Class<?>[] pTypes = targetMethod.getParameterTypes();
            Object[] invokeArgs = parseArgs(rawInput, pTypes);
            Object result = Modifier.isStatic(targetMethod.getModifiers())
                ? targetMethod.invoke(null, invokeArgs)
                : targetMethod.invoke(instance, invokeArgs);

            if (result != null) {
                if (result instanceof int[]) {
                    System.out.println(Arrays.toString((int[]) result));
                } else if (result instanceof long[]) {
                    System.out.println(Arrays.toString((long[]) result));
                } else if (result instanceof double[]) {
                    System.out.println(Arrays.toString((double[]) result));
                } else if (result instanceof boolean[]) {
                    System.out.println(Arrays.toString((boolean[]) result));
                } else if (result instanceof Object[]) {
                    System.out.println(Arrays.deepToString((Object[]) result));
                } else if (result instanceof List) {
                    System.out.println(result.toString());
                } else if (result instanceof Boolean) {
                    System.out.println(result.toString().toLowerCase());
                } else {
                    System.out.println(result.toString());
                }
            }
        } catch (InvocationTargetException ite) {
            Throwable cause = ite.getCause() != null ? ite.getCause() : ite;
            System.err.println("Runtime Exception: " + cause.getMessage());
            cause.printStackTrace(System.err);
            System.exit(1);
        } catch (Exception e) {
            System.err.println("Execution Error: " + e.getMessage());
            e.printStackTrace(System.err);
            System.exit(1);
        }
    }

    private static Object[] parseArgs(String input, Class<?>[] pTypes) {
        if (pTypes.length == 0) return new Object[0];
        Object[] out = new Object[pTypes.length];

        if (pTypes.length == 1) {
            out[0] = parseSingle(input, pTypes[0]);
            return out;
        }

        List<String> tokens = splitArgs(input.trim());
        for (int i = 0; i < pTypes.length; i++) {
            if (i < tokens.size()) {
                out[i] = parseSingle(tokens.get(i), pTypes[i]);
            } else {
                out[i] = null;
            }
        }
        return out;
    }

    private static List<String> splitArgs(String s) {
        List<String> list = new ArrayList<>();
        if (s.startsWith("[") && s.endsWith("]")) {
            String inner = s.substring(1, s.length() - 1).trim();
            int depth = 0;
            StringBuilder cur = new StringBuilder();
            for (char c : inner.toCharArray()) {
                if (c == '[' || c == '{') depth++;
                else if (c == ']' || c == '}') depth--;
                else if (c == ',' && depth == 0) {
                    list.add(cur.toString().trim());
                    cur = new StringBuilder();
                    continue;
                }
                cur.append(c);
            }
            if (cur.length() > 0) list.add(cur.toString().trim());
            return list;
        }

        int depth = 0;
        StringBuilder cur = new StringBuilder();
        for (char c : s.toCharArray()) {
            if (c == '[' || c == '{') depth++;
            else if (c == ']' || c == '}') depth--;
            else if (c == ',' && depth == 0) {
                list.add(cur.toString().trim());
                cur = new StringBuilder();
                continue;
            }
            cur.append(c);
        }
        if (cur.length() > 0) list.add(cur.toString().trim());
        return list;
    }

    private static Object parseSingle(String val, Class<?> type) {
        val = val.trim();
        if (type == int.class || type == Integer.class) {
            return Integer.parseInt(val.replaceAll("[^0-9-]", ""));
        }
        if (type == long.class || type == Long.class) {
            return Long.parseLong(val.replaceAll("[^0-9-]", ""));
        }
        if (type == double.class || type == Double.class) {
            return Double.parseDouble(val.replaceAll("[^0-9.-]", ""));
        }
        if (type == boolean.class || type == Boolean.class) {
            return Boolean.parseBoolean(val);
        }
        if (type == String.class) {
            if (val.startsWith("\\\"") && val.endsWith("\\\"") && val.length() >= 2) {
                return val.substring(1, val.length() - 1);
            }
            return val;
        }
        if (type == int[].class) {
            String clean = val.replaceAll("[\\\\s\\\\[\\\\]]", "");
            if (clean.isEmpty()) return new int[0];
            String[] parts = clean.split(",");
            int[] arr = new int[parts.length];
            for (int i = 0; i < parts.length; i++) arr[i] = Integer.parseInt(parts[i].trim());
            return arr;
        }
        if (type == String[].class) {
            String clean = val.replaceAll("[\\\\[\\\\]]", "");
            if (clean.trim().isEmpty()) return new String[0];
            String[] parts = clean.split(",");
            for (int i = 0; i < parts.length; i++) {
                String p = parts[i].trim();
                if (p.startsWith("\\\"") && p.endsWith("\\\"") && p.length() >= 2) {
                    p = p.substring(1, p.length() - 1);
                }
                parts[i] = p;
            }
            return parts;
        }
        return val;
    }
}
`;

  return {
    mainClassName: 'Solution',
    sourceCode: driverSource
  };
}

function runJava(code, inputStr, timeoutMs = 5000) {
  return new Promise((resolve) => {
    const fileId = `j_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const subDir = path.join(RUNNER_DIR, fileId);
    fs.mkdirSync(subDir, { recursive: true });

    const { mainClassName, sourceCode } = prepareJavaExecution(code);
    const sourcePath = path.join(subDir, `${mainClassName}.java`);

    fs.writeFileSync(sourcePath, sourceCode, 'utf8');
    const startTime = Date.now();

    // Compile Java
    execFile('javac', [sourcePath], { timeout: 8000 }, (compileErr, cStdout, cStderr) => {
      if (compileErr) {
        try { fs.rmSync(subDir, { recursive: true, force: true }); } catch (_) {}
        const rawErr = (cStderr || cStdout || compileErr.message).trim();
        const cleanErr = rawErr.replace(new RegExp(subDir.replace(/\\/g, '\\\\'), 'g'), '');
        return resolve({
          success: false,
          isCompilationError: true,
          error: `Compilation Error:\n${cleanErr}`,
          output: '',
          executionTimeMs: Date.now() - startTime
        });
      }

      // Execute Java class
      const child = spawn('java', ['-Xmx128m', '-cp', subDir, mainClassName], { timeout: timeoutMs });
      let stdout = '';
      let stderr = '';

      if (inputStr !== undefined && inputStr !== null) {
        child.stdin.write(inputStr + '\n');
      }
      child.stdin.end();

      child.stdout.on('data', data => stdout += data.toString());
      child.stderr.on('data', data => stderr += data.toString());

      let killedByTimer = false;
      const timer = setTimeout(() => {
        killedByTimer = true;
        child.kill();
      }, timeoutMs);

      child.on('close', (codeStatus) => {
        clearTimeout(timer);
        const executionTimeMs = Date.now() - startTime;
        try { fs.rmSync(subDir, { recursive: true, force: true }); } catch (_) {}

        if (killedByTimer) {
          return resolve({
            success: false,
            isTimeout: true,
            error: `Time Limit Exceeded (${timeoutMs}ms)`,
            output: stdout.trim(),
            executionTimeMs
          });
        }

        if (codeStatus !== 0) {
          const errMessage = stderr || `Process exited with status ${codeStatus}`;
          return resolve({
            success: false,
            isRuntimeError: true,
            error: `Runtime Error:\n${errMessage.trim()}`,
            output: stdout.trim(),
            executionTimeMs
          });
        }

        return resolve({
          success: true,
          output: stdout.trim(),
          executionTimeMs
        });
      });
    });
  });
}

/**
 * 4. Master Evaluator
 */
async function evaluateCode(arg1, arg2, arg3, arg4) {
  let code, language, testCases, isSubmit;
  if (typeof arg1 === 'object' && arg1 !== null) {
    code = arg1.code;
    language = arg1.language;
    testCases = arg1.testCases || [];
    isSubmit = !!arg1.isSubmit;
  } else {
    code = arg1 || '';
    language = arg2 || 'javascript';
    testCases = arg3 || [];
    isSubmit = !!arg4;
  }
  code = code || '';
  language = (language || 'javascript').toLowerCase().trim();

  // 1. Security Check
  const secCheck = checkSecurityTokens(language, code);
  if (!secCheck.safe) {
    return {
      status: 'SECURITY_VIOLATION',
      allPassed: false,
      passedTests: 0,
      totalTests: testCases.length,
      error: secCheck.error,
      testResults: []
    };
  }

  let totalExecutionTime = 0;
  let passedCount = 0;
  const testResults = [];
  let globalStatus = 'SUCCESS';
  let topLevelError = null;

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    let runResult;

    if (language === 'javascript' || language === 'js') {
      runResult = await runJavaScript(code, tc.input);
    } else if (language === 'python' || language === 'py') {
      runResult = await runPython(code, tc.input);
    } else if (language === 'java') {
      runResult = await runJava(code, tc.input);
    } else {
      return {
        status: 'UNSUPPORTED_LANGUAGE',
        allPassed: false,
        passedTests: 0,
        totalTests: testCases.length,
        error: `Unsupported language: ${language}`,
        testResults: []
      };
    }

    totalExecutionTime += (runResult.executionTimeMs || 0);

    if (!runResult.success) {
      if (runResult.isCompilationError) {
        globalStatus = 'COMPILATION_ERROR';
      } else if (runResult.isTimeout) {
        globalStatus = 'TIME_LIMIT_EXCEEDED';
      } else if (globalStatus === 'SUCCESS') {
        globalStatus = 'RUNTIME_ERROR';
      }
      if (!topLevelError) topLevelError = runResult.error;

      testResults.push({
        testCaseId: tc._id || `TC${i + 1}`,
        caseNumber: i + 1,
        input: tc.input || '',
        expected: tc.expectedOutput || '',
        actual: runResult.output || '<No output returned>',
        passed: false,
        status: runResult.isCompilationError ? 'COMPILATION_ERROR' : (runResult.isTimeout ? 'TIME_LIMIT_EXCEEDED' : 'RUNTIME_ERROR'),
        isHidden: false,
        error: runResult.error
      });
    } else {
      const actualNorm = normalizeOutput(runResult.output);
      const expectedNorm = normalizeOutput(tc.expectedOutput);
      
      // For custom input or empty expectedOutput, if execution succeeded, consider it passed for custom input display
      const isCustomMode = tc.expectedOutput === undefined || tc.expectedOutput === null || tc.expectedOutput === '';
      const passed = isCustomMode ? true : (actualNorm === expectedNorm);

      if (passed && !isCustomMode) passedCount++;
      else if (!passed && globalStatus === 'SUCCESS') globalStatus = 'FAILED';

      testResults.push({
        testCaseId: tc._id || `TC${i + 1}`,
        caseNumber: i + 1,
        input: tc.input || '',
        expected: tc.expectedOutput || '',
        actual: runResult.output || '',
        passed,
        status: passed ? 'PASSED' : 'FAILED',
        isHidden: false,
        error: null
      });
    }
  }

  const allPassed = passedCount === testCases.length && globalStatus === 'SUCCESS';

  let verdict = 'Wrong Answer';
  if (allPassed) {
    verdict = 'Accepted';
  } else if (globalStatus === 'COMPILATION_ERROR') {
    verdict = 'Compilation Error';
  } else if (globalStatus === 'TIME_LIMIT_EXCEEDED') {
    verdict = 'Time Limit Exceeded';
  } else if (globalStatus === 'RUNTIME_ERROR') {
    verdict = 'Runtime Error';
  } else if (globalStatus === 'SECURITY_VIOLATION') {
    verdict = 'Security Violation';
  }

  return {
    status: globalStatus,
    verdict,
    allPassed,
    passedTests: passedCount,
    totalTests: testCases.length,
    executionTimeMs: totalExecutionTime,
    error: topLevelError,
    testResults
  };
}

module.exports = {
  evaluateCode,
  runJavaScript,
  runPython,
  runJava,
  normalizeOutput
};
