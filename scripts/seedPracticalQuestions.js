const mongoose = require('d:/Game_project/server/node_modules/mongoose');

const practicalQuestionsByDomain = {
  java: [
    // Module 1: Java Basics
    {
      moduleOrder: 1,
      order: 1,
      title: 'Find the Largest Number in an Array',
      description: 'Write a Java program that reads an integer N representing the array size, followed by N integers. Find and print the largest number in the array.',
      inputDescription: 'First line contains integer N. Second line contains N space-separated integers.',
      sampleInput: '5\n10 25 4 89 33',
      sampleOutput: '89',
      expectedOutput: '89',
      constraints: '1 <= N <= 1000\n-10^5 <= Array[i] <= 10^5',
      difficulty: 'Easy',
      points: 10,
      starterCode: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int max = Integer.MIN_VALUE;
        for (int i = 0; i < n; i++) {
            int val = sc.nextInt();
            if (val > max) {
                max = val;
            }
        }
        System.out.println(max);
    }
}`,
      testCases: [
        { input: '5\n10 25 4 89 33', expectedOutput: '89', isHidden: false, explanation: '89 is the maximum value' },
        { input: '3\n-5 -2 -10', expectedOutput: '-2', isHidden: true, explanation: '-2 is maximum negative value' }
      ]
    },
    {
      moduleOrder: 1,
      order: 2,
      title: 'Check Palindrome String',
      description: 'Write a Java program that reads a string and determines if it is a palindrome (reads the same forwards and backwards, ignoring case). Print "YES" or "NO".',
      inputDescription: 'A single line containing the string S.',
      sampleInput: 'madam',
      sampleOutput: 'YES',
      expectedOutput: 'YES',
      constraints: '1 <= length(S) <= 1000',
      difficulty: 'Easy',
      points: 10,
      starterCode: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.nextLine().trim();
        String rev = new StringBuilder(s).reverse().toString();
        if (s.equalsIgnoreCase(rev)) {
            System.out.println("YES");
        } else {
            System.out.println("NO");
        }
    }
}`,
      testCases: [
        { input: 'madam', expectedOutput: 'YES', isHidden: false, explanation: 'madam reversed is madam' },
        { input: 'hello', expectedOutput: 'NO', isHidden: true, explanation: 'hello reversed is olleh' }
      ]
    },
    {
      moduleOrder: 1,
      order: 3,
      title: 'Sum of Digits of a Number',
      description: 'Write a Java program that reads a positive integer N and prints the sum of its individual digits.',
      inputDescription: 'A single integer N.',
      sampleInput: '1234',
      sampleOutput: '10',
      expectedOutput: '10',
      constraints: '1 <= N <= 10^9',
      difficulty: 'Easy',
      points: 10,
      starterCode: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        long n = sc.nextLong();
        long sum = 0;
        while (n > 0) {
            sum += n % 10;
            n /= 10;
        }
        System.out.println(sum);
    }
}`,
      testCases: [
        { input: '1234', expectedOutput: '10', isHidden: false, explanation: '1+2+3+4 = 10' },
        { input: '908', expectedOutput: '17', isHidden: true, explanation: '9+0+8 = 17' }
      ]
    },

    // Module 2: OOP
    {
      moduleOrder: 2,
      order: 1,
      title: 'Bank Account Class with Deposit and Withdrawal',
      description: 'Design a Java BankAccount class with balance tracking. Read initial balance, deposit amount, and withdrawal amount. Print the final balance.',
      inputDescription: 'Three numbers: initial balance, deposit, withdrawal.',
      sampleInput: '1000 500 200',
      sampleOutput: '1300',
      expectedOutput: '1300',
      constraints: 'balance >= 0',
      difficulty: 'Medium',
      points: 20,
      starterCode: `import java.util.Scanner;

class BankAccount {
    private int balance;
    public BankAccount(int init) { this.balance = init; }
    public void deposit(int amt) { this.balance += amt; }
    public void withdraw(int amt) { if (amt <= this.balance) this.balance -= amt; }
    public int getBalance() { return this.balance; }
}

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int init = sc.nextInt();
        int dep = sc.nextInt();
        int with = sc.nextInt();
        BankAccount acc = new BankAccount(init);
        acc.deposit(dep);
        acc.withdraw(with);
        System.out.println(acc.getBalance());
    }
}`,
      testCases: [
        { input: '1000 500 200', expectedOutput: '1300', isHidden: false },
        { input: '500 200 800', expectedOutput: '700', isHidden: true }
      ]
    },
    {
      moduleOrder: 2,
      order: 2,
      title: 'Shape Area Calculation with Inheritance',
      description: 'Implement a Shape hierarchy where Rectangle inherits from Shape. Given width and height, compute and print the area.',
      inputDescription: 'Two integers representing width and height.',
      sampleInput: '4 5',
      sampleOutput: '20',
      expectedOutput: '20',
      constraints: '1 <= width, height <= 1000',
      difficulty: 'Medium',
      points: 20,
      starterCode: `import java.util.Scanner;

class Rectangle {
    int w, h;
    Rectangle(int w, int h) { this.w = w; this.h = h; }
    int getArea() { return w * h; }
}

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int w = sc.nextInt();
        int h = sc.nextInt();
        Rectangle r = new Rectangle(w, h);
        System.out.println(r.getArea());
    }
}`,
      testCases: [
        { input: '4 5', expectedOutput: '20', isHidden: false },
        { input: '7 8', expectedOutput: '56', isHidden: true }
      ]
    },

    // Module 3: Collections
    {
      moduleOrder: 3,
      order: 1,
      title: 'Element Frequency Counter Using HashMap',
      description: 'Given N space-separated integers, count the frequency of each unique number and print the number with the highest frequency.',
      inputDescription: 'First line N. Second line N integers.',
      sampleInput: '6\n1 2 2 3 2 1',
      sampleOutput: '2',
      expectedOutput: '2',
      constraints: '1 <= N <= 10^5',
      difficulty: 'Medium',
      points: 20,
      starterCode: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        Map<Integer, Integer> map = new HashMap<>();
        int maxVal = -1, maxFreq = 0;
        for (int i = 0; i < n; i++) {
            int num = sc.nextInt();
            int f = map.getOrDefault(num, 0) + 1;
            map.put(num, f);
            if (f > maxFreq) {
                maxFreq = f;
                maxVal = num;
            }
        }
        System.out.println(maxVal);
    }
}`,
      testCases: [
        { input: '6\n1 2 2 3 2 1', expectedOutput: '2', isHidden: false },
        { input: '5\n9 9 9 1 2', expectedOutput: '9', isHidden: true }
      ]
    },

    // Module 4: JDBC
    {
      moduleOrder: 4,
      order: 1,
      title: 'Simulate Prepared Statement Parameter Binding',
      description: 'Simulate a JDBC parameterized SQL query generator. Given table "students", parameter id, and name, print formatted SQL statement: "SELECT * FROM students WHERE id=? AND name=? -> [id=101, name=John]".',
      inputDescription: 'Two tokens: ID and Name.',
      sampleInput: '101 John',
      sampleOutput: 'SELECT * FROM students WHERE id=101 AND name=\'John\'',
      expectedOutput: 'SELECT * FROM students WHERE id=101 AND name=\'John\'',
      constraints: 'String inputs without SQL injection',
      difficulty: 'Medium',
      points: 20,
      starterCode: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String id = sc.next();
        String name = sc.next();
        System.out.println("SELECT * FROM students WHERE id=" + id + " AND name='" + name + "'");
    }
}`,
      testCases: [
        { input: '101 John', expectedOutput: 'SELECT * FROM students WHERE id=101 AND name=\'John\'', isHidden: false },
        { input: '205 Alice', expectedOutput: 'SELECT * FROM students WHERE id=205 AND name=\'Alice\'', isHidden: true }
      ]
    },

    // Module 5: Servlet
    {
      moduleOrder: 5,
      order: 1,
      title: 'Process HTTP Request Parameters in Java',
      description: 'Simulate an HttpServlet doGet parsing query parameters. Read "user" and "role" and output a greeting string "Welcome, <user> (<role>)!".',
      inputDescription: 'Two strings: username and user role.',
      sampleInput: 'Arun Admin',
      sampleOutput: 'Welcome, Arun (Admin)!',
      expectedOutput: 'Welcome, Arun (Admin)!',
      constraints: 'Alphanumeric strings',
      difficulty: 'Easy',
      points: 15,
      starterCode: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String u = sc.next();
        String r = sc.next();
        System.out.println("Welcome, " + u + " (" + r + ")!");
    }
}`,
      testCases: [
        { input: 'Arun Admin', expectedOutput: 'Welcome, Arun (Admin)!', isHidden: false },
        { input: 'Kumar Student', expectedOutput: 'Welcome, Kumar (Student)!', isHidden: true }
      ]
    },

    // Module 6: JSP
    {
      moduleOrder: 6,
      order: 1,
      title: 'Format Dynamic Table Row with JSTL Expression',
      description: 'Format a row representation for an item with id, title, and price. Output: "<tr><td>1</td><td>Java Book</td><td>$45</td></tr>".',
      inputDescription: 'Id, Title, Price',
      sampleInput: '1 Java_Book 45',
      sampleOutput: '<tr><td>1</td><td>Java_Book</td><td>$45</td></tr>',
      expectedOutput: '<tr><td>1</td><td>Java_Book</td><td>$45</td></tr>',
      constraints: 'Valid table tokens',
      difficulty: 'Easy',
      points: 15,
      starterCode: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String id = sc.next();
        String title = sc.next();
        String price = sc.next();
        System.out.println("<tr><td>" + id + "</td><td>" + title + "</td><td>$" + price + "</td></tr>");
    }
}`,
      testCases: [
        { input: '1 Java_Book 45', expectedOutput: '<tr><td>1</td><td>Java_Book</td><td>$45</td></tr>', isHidden: false },
        { input: '2 Spring_Guide 60', expectedOutput: '<tr><td>2</td><td>Spring_Guide</td><td>$60</td></tr>', isHidden: true }
      ]
    },

    // Module 7: Spring
    {
      moduleOrder: 7,
      order: 1,
      title: 'Dependency Injection Bean Resolver',
      description: 'Simulate Spring ApplicationContext bean wiring. Read service name and print active initialized service bean message.',
      inputDescription: 'Service name string.',
      sampleInput: 'PaymentService',
      sampleOutput: 'Initialized Bean: PaymentService [Ready]',
      expectedOutput: 'Initialized Bean: PaymentService [Ready]',
      constraints: 'Valid identifier',
      difficulty: 'Medium',
      points: 20,
      starterCode: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.nextLine().trim();
        System.out.println("Initialized Bean: " + s + " [Ready]");
    }
}`,
      testCases: [
        { input: 'PaymentService', expectedOutput: 'Initialized Bean: PaymentService [Ready]', isHidden: false },
        { input: 'UserService', expectedOutput: 'Initialized Bean: UserService [Ready]', isHidden: true }
      ]
    },

    // Module 8: Spring Boot
    {
      moduleOrder: 8,
      order: 1,
      title: 'REST Controller Response JSON Formatter',
      description: 'Format a JSON response object for a student entity given ID and Name. Output: "{\"id\":101,\"name\":\"Kumar\",\"status\":\"ACTIVE\"}".',
      inputDescription: 'ID and Name.',
      sampleInput: '101 Kumar',
      sampleOutput: '{"id":101,"name":"Kumar","status":"ACTIVE"}',
      expectedOutput: '{"id":101,"name":"Kumar","status":"ACTIVE"}',
      constraints: 'Valid parameters',
      difficulty: 'Medium',
      points: 25,
      starterCode: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int id = sc.nextInt();
        String name = sc.next();
        System.out.println("{\\"id\\":" + id + ",\\"name\\":\\"" + name + "\\",\\"status\\":\\"ACTIVE\\"}");
    }
}`,
      testCases: [
        { input: '101 Kumar', expectedOutput: '{"id":101,"name":"Kumar","status":"ACTIVE"}', isHidden: false },
        { input: '202 Arun', expectedOutput: '{"id":202,"name":"Arun","status":"ACTIVE"}', isHidden: true }
      ]
    },

    // Module 9: React
    {
      moduleOrder: 9,
      order: 1,
      title: 'React State Counter Logic',
      description: 'Simulate a React counter component given initial count and a sequence of operations (+, -, +). Print final count.',
      inputDescription: 'Initial value followed by operation count and operations.',
      sampleInput: '0 3 + + -',
      sampleOutput: '1',
      expectedOutput: '1',
      constraints: 'Initial count >= 0',
      difficulty: 'Easy',
      points: 15,
      starterCode: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int count = sc.nextInt();
        int ops = sc.nextInt();
        for (int i = 0; i < ops; i++) {
            String op = sc.next();
            if (op.equals("+")) count++;
            else if (op.equals("-")) count--;
        }
        System.out.println(count);
    }
}`,
      testCases: [
        { input: '0 3 + + -', expectedOutput: '1', isHidden: false },
        { input: '5 4 + + + -', expectedOutput: '7', isHidden: true }
      ]
    }
  ],

  python: [
    // Module 1: Python Basics
    {
      moduleOrder: 1,
      order: 1,
      title: 'Check Whether a Given Number is Prime',
      description: 'Write a Python program to check whether a given integer N is prime. Print "PRIME" if prime, otherwise "NOT PRIME".',
      inputDescription: 'A single positive integer N.',
      sampleInput: '7',
      sampleOutput: 'PRIME',
      expectedOutput: 'PRIME',
      constraints: '1 <= N <= 10^6',
      difficulty: 'Easy',
      points: 10,
      starterCode: `import sys

def check_prime(n):
    if n <= 1:
        return False
    for i in range(2, int(n**0.5) + 1):
        if n % i == 0:
            return False
    return True

line = sys.stdin.read().strip()
if line:
    n = int(line)
    print("PRIME" if check_prime(n) else "NOT PRIME")
`,
      testCases: [
        { input: '7', expectedOutput: 'PRIME', isHidden: false },
        { input: '12', expectedOutput: 'NOT PRIME', isHidden: true }
      ]
    },
    {
      moduleOrder: 1,
      order: 2,
      title: 'Count Vowels in a String',
      description: 'Write a Python program that counts the total number of vowels (a, e, i, o, u) in a given string, case-insensitively.',
      inputDescription: 'A single line of text S.',
      sampleInput: 'CodeQuest Academy',
      sampleOutput: '7',
      expectedOutput: '7',
      constraints: '1 <= len(S) <= 10^4',
      difficulty: 'Easy',
      points: 10,
      starterCode: `import sys

text = sys.stdin.read().strip()
vowels = "aeiouAEIOU"
count = sum(1 for ch in text if ch in vowels)
print(count)
`,
      testCases: [
        { input: 'CodeQuest Academy', expectedOutput: '7', isHidden: false },
        { input: 'Python', expectedOutput: '1', isHidden: true }
      ]
    },

    // Module 2: Data Structures in Python
    {
      moduleOrder: 2,
      order: 1,
      title: 'Reverse a List in Place',
      description: 'Given a space-separated list of numbers, reverse the list and print elements separated by a space.',
      inputDescription: 'Space-separated integers.',
      sampleInput: '1 2 3 4 5',
      sampleOutput: '5 4 3 2 1',
      expectedOutput: '5 4 3 2 1',
      constraints: '1 <= length <= 10^5',
      difficulty: 'Easy',
      points: 15,
      starterCode: `import sys

nums = sys.stdin.read().strip().split()
nums.reverse()
print(" ".join(nums))
`,
      testCases: [
        { input: '1 2 3 4 5', expectedOutput: '5 4 3 2 1', isHidden: false },
        { input: '10 20', expectedOutput: '20 10', isHidden: true }
      ]
    }
  ],

  cpp: [
    {
      moduleOrder: 1,
      order: 1,
      title: 'Reverse a String Using Pointers',
      description: 'Write a C++ program to reverse an input string in-place and print the reversed string.',
      inputDescription: 'A single string S.',
      sampleInput: 'hello',
      sampleOutput: 'olleh',
      expectedOutput: 'olleh',
      constraints: '1 <= len(S) <= 1000',
      difficulty: 'Easy',
      points: 10,
      starterCode: `#include <iostream>
#include <string>
#include <algorithm>

using namespace std;

int main() {
    string s;
    if (cin >> s) {
        reverse(s.begin(), s.end());
        cout << s << endl;
    }
    return 0;
}`,
      testCases: [
        { input: 'hello', expectedOutput: 'olleh', isHidden: false },
        { input: 'world', expectedOutput: 'dlrow', isHidden: true }
      ]
    }
  ],

  react: [
    {
      moduleOrder: 1,
      order: 1,
      title: 'Render Student Names with Array.map()',
      description: 'Given a comma-separated list of student names, format them as list item strings: "• Alice\\n• Bob".',
      inputDescription: 'Comma-separated student names.',
      sampleInput: 'Alice, Bob, Charlie',
      sampleOutput: '• Alice\n• Bob\n• Charlie',
      expectedOutput: '• Alice\n• Bob\n• Charlie',
      constraints: 'Valid name strings',
      difficulty: 'Easy',
      points: 15,
      starterCode: `const names = __input.split(',').map(n => n.trim());
const formatted = names.map(n => '• ' + n).join('\\n');
console.log(formatted);
`,
      testCases: [
        { input: 'Alice, Bob, Charlie', expectedOutput: '• Alice\n• Bob\n• Charlie', isHidden: false },
        { input: 'Kumar, Arun', expectedOutput: '• Kumar\n• Arun', isHidden: true }
      ]
    }
  ]
};

async function seed() {
  await mongoose.connect('mongodb://127.0.0.1:27017/codequest_db');
  console.log('Connected to MongoDB. Starting practical questions seed...');

  const modules = await mongoose.connection.collection('modules').find().toArray();
  const courses = await mongoose.connection.collection('courses').find().toArray();

  for (const [domain, questions] of Object.entries(practicalQuestionsByDomain)) {
    const course = courses.find(c => (c.domain === domain || (c.slug && c.slug.includes(domain))));
    const domainModules = modules.filter(m => m.domain === domain).sort((a, b) => a.order - b.order);

    console.log(`\nProcessing Domain "${domain}" with ${domainModules.length} modules...`);

    for (const q of questions) {
      const targetModule = domainModules.find(m => m.order === q.moduleOrder) || domainModules[0];
      if (!targetModule) {
        console.warn(`Could not find module order ${q.moduleOrder} for domain ${domain}`);
        continue;
      }

      const existingTask = await mongoose.connection.collection('domaintasks').findOne({
        moduleId: targetModule._id,
        title: q.title
      });

      const doc = {
        moduleId: targetModule._id,
        courseId: targetModule.courseId || course?._id,
        domain: domain,
        title: q.title,
        description: q.description,
        instructions: q.description,
        inputDescription: q.inputDescription,
        sampleInput: q.sampleInput,
        sampleOutput: q.sampleOutput,
        expectedOutput: q.expectedOutput,
        constraints: q.constraints,
        difficulty: q.difficulty,
        points: q.points,
        starterCode: q.starterCode,
        timeLimit: 2000,
        testCases: q.testCases,
        taskType: 'coding',
        order: q.order,
        isEnabled: true,
        isActive: true,
        updatedAt: new Date()
      };

      if (!existingTask) {
        doc.createdAt = new Date();
        await mongoose.connection.collection('domaintasks').insertOne(doc);
        console.log(`  + Created: Module ${targetModule.order} [${targetModule.title}]: "${q.title}"`);
      } else {
        await mongoose.connection.collection('domaintasks').updateOne(
          { _id: existingTask._id },
          { $set: doc }
        );
        console.log(`  ~ Updated: Module ${targetModule.order} [${targetModule.title}]: "${q.title}"`);
      }
    }
  }

  console.log('\n✅ Practical questions seed finished successfully!');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
