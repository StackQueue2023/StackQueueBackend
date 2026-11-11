const { evaluateCode } = require('../services/interviewCodeRunner');

async function runAcceptanceTests() {
  console.log('===================================================');
  console.log('  INTERVIEW ARENA ONLINE JUDGE ACCEPTANCE TESTS');
  console.log('===================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(title, condition, detail = '') {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${title}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${title}`);
      if (detail) console.error(`   Detail: ${JSON.stringify(detail, null, 2)}`);
    }
  }

  // TEST 1: Java correct solution with main method and Scanner
  const javaCodePass = `
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        if (n % 2 == 0) {
            System.out.println("Even");
        } else {
            System.out.println("Odd");
        }
    }
}
`;
  const res1 = await evaluateCode({
    language: 'java',
    code: javaCodePass,
    testCases: [
      { input: '4', expectedOutput: 'Even', isHidden: false },
      { input: '7', expectedOutput: 'Odd', isHidden: false }
    ]
  });
  assert('TEST 1: Java standard Scanner solution (Even/Odd)', res1.allPassed && res1.passedTests === 2, res1);

  // TEST 2: Java wrong solution
  const javaCodeWrong = `
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        System.out.println("WrongOutput");
    }
}
`;
  const res2 = await evaluateCode({
    language: 'java',
    code: javaCodeWrong,
    testCases: [{ input: '4', expectedOutput: 'Even', isHidden: false }]
  });
  assert('TEST 2: Java wrong solution correctly flagged as FAILED', !res2.allPassed && res2.status === 'FAILED', res2);

  // TEST 3: Java compilation error
  const javaCodeCompileErr = `
public class Main {
    public static void main(String[] args) {
        int x = 
    }
}
`;
  const res3 = await evaluateCode({
    language: 'java',
    code: javaCodeCompileErr,
    testCases: [{ input: '4', expectedOutput: 'Even', isHidden: false }]
  });
  assert('TEST 3: Java syntax error correctly returns COMPILATION_ERROR', res3.status === 'COMPILATION_ERROR' && res3.error.includes('Compilation Error'), res3);

  // TEST 4: Java runtime error (division by zero)
  const javaCodeRuntimeErr = `
public class Main {
    public static void main(String[] args) {
        int x = 10 / 0;
    }
}
`;
  const res4 = await evaluateCode({
    language: 'java',
    code: javaCodeRuntimeErr,
    testCases: [{ input: '4', expectedOutput: 'Even', isHidden: false }]
  });
  assert('TEST 4: Java division by zero returns RUNTIME_ERROR', res4.status === 'RUNTIME_ERROR' && res4.error.includes('Runtime Error'), res4);

  // TEST 5: Java alternative valid solution (ternary operator)
  const javaTernary = `
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int a = sc.nextInt();
        System.out.println((a % 2 == 0) ? "Even" : "Odd");
    }
}
`;
  const res5 = await evaluateCode({
    language: 'java',
    code: javaTernary,
    testCases: [
      { input: '4', expectedOutput: 'Even' },
      { input: '7', expectedOutput: 'Odd' },
      { input: '0', expectedOutput: 'Even' },
      { input: '-8', expectedOutput: 'Even' }
    ]
  });
  assert('TEST 5: Java ternary operator alternative solution (4/4 passed)', res5.allPassed && res5.passedTests === 4, res5);

  // TEST 6: Python correct solution (input + print)
  const pyCode = `
n = int(input())
print("Even" if n % 2 == 0 else "Odd")
`;
  const res6 = await evaluateCode({
    language: 'python',
    code: pyCode,
    testCases: [
      { input: '4', expectedOutput: 'Even' },
      { input: '7', expectedOutput: 'Odd' }
    ]
  });
  assert('TEST 6: Python input() + print() solution', res6.allPassed && res6.passedTests === 2, res6);

  // TEST 7: JavaScript correct solution
  const jsCode = `
const n = parseInt(input);
console.log(n % 2 === 0 ? "Even" : "Odd");
`;
  const res7 = await evaluateCode({
    language: 'javascript',
    code: jsCode,
    testCases: [
      { input: '4', expectedOutput: 'Even' },
      { input: '7', expectedOutput: 'Odd' }
    ]
  });
  assert('TEST 7: JavaScript input + console.log solution', res7.allPassed && res7.passedTests === 2, res7);

  // TEST 8: Custom Input Execution
  const res8 = await evaluateCode({
    language: 'java',
    code: javaTernary,
    testCases: [{ input: '100', expectedOutput: '' }]
  });
  assert('TEST 8: Custom Input execution returns actual output ("Even")', res8.testResults[0].actual === 'Even', res8);

  console.log('\n===================================================');
  console.log(`  SUMMARY: ${passedTests} / ${totalTests} ACCEPTANCE TESTS PASSED`);
  console.log('===================================================\n');

  process.exit(passedTests === totalTests ? 0 : 1);
}

runAcceptanceTests().catch(err => {
  console.error('Test Suite Exception:', err);
  process.exit(1);
});
