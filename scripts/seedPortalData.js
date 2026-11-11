require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const CompanyPortal = require('../models/CompanyPortal');

async function seedPortal() {
  try {
    await connectDB();
    console.log('[Seed Portal] Connected to MongoDB.');

    await CompanyPortal.deleteMany({});

    // 52 Internship Domains across different industry tracks
    const internshipDomainList = [
      { title: 'Full Stack Java Enterprise', category: 'Software Development', technology: 'Java, Spring Boot, React, PostgreSQL', duration: '12 Weeks', mode: 'Hybrid', skills: ['Java Core', 'Spring Boot', 'REST APIs', 'React'], isPopular: true },
      { title: 'MERN Stack Cloud Engineering', category: 'Web Development', technology: 'MongoDB, Express, React, Node.js', duration: '12 Weeks', mode: 'Online', skills: ['React 18', 'Node.js', 'Redux', 'MongoDB'], isPopular: true },
      { title: 'Generative AI & LLM Systems', category: 'Artificial Intelligence', technology: 'Python, LangChain, PyTorch, OpenAI API', duration: '16 Weeks', mode: 'Hybrid', skills: ['LLMs', 'RAG', 'Vector DBs', 'Python'], isPopular: true },
      { title: 'Cloud DevOps & Kubernetes Architecture', category: 'Cloud & Infrastructure', technology: 'AWS, Docker, Kubernetes, Terraform', duration: '10 Weeks', mode: 'Hybrid', skills: ['CI/CD', 'K8s', 'Terraform', 'AWS'], isPopular: true },
      { title: 'Cybersecurity & Ethical Hacking', category: 'Security & Operations', technology: 'Kali Linux, Wireshark, Burp Suite, Metasploit', duration: '12 Weeks', mode: 'Offline', skills: ['Penetration Testing', 'SIEM', 'Network Auditing'], isPopular: true },
      { title: 'Python Data Science & Machine Learning', category: 'Data & Analytics', technology: 'Python, Pandas, Scikit-Learn, TensorFlow', duration: '12 Weeks', mode: 'Online', skills: ['Data Analysis', 'Regression', 'Neural Networks'], isPopular: true },
      { title: 'Mobile App Development with Flutter', category: 'Mobile Development', technology: 'Flutter, Dart, Firebase, REST APIs', duration: '10 Weeks', mode: 'Hybrid', skills: ['Dart', 'Cross-Platform UI', 'State Management'], isPopular: true },
      { title: 'React Native Cross-Platform Engineering', category: 'Mobile Development', technology: 'React Native, TypeScript, Redux, Expo', duration: '10 Weeks', mode: 'Online', skills: ['React Native', 'Mobile UX', 'Native Modules'], isPopular: true },
      
      // 44 additional internship domains to ensure over 50 real domains
      { title: 'Backend Microservices with Go (Golang)', category: 'Software Development', technology: 'Go, gRPC, Docker, Kafka', duration: '12 Weeks', mode: 'Online', skills: ['Concurrency', 'gRPC', 'Microservices'] },
      { title: 'Next.js 14 Fullstack Web Systems', category: 'Web Development', technology: 'Next.js, TypeScript, Tailwind, Prisma', duration: '8 Weeks', mode: 'Online', skills: ['Server Components', 'SSR', 'Prisma ORM'] },
      { title: 'Automated Software Testing & QA Engineering', category: 'Quality Assurance', technology: 'Selenium, Playwright, Jest, TestNG', duration: '8 Weeks', mode: 'Online', skills: ['E2E Testing', 'API Automation', 'Test Strategy'] },
      { title: 'Computer Vision & Deep Learning', category: 'Artificial Intelligence', technology: 'OpenCV, YOLO, PyTorch, Python', duration: '12 Weeks', mode: 'Hybrid', skills: ['Image Segmentation', 'Object Detection', 'CNNs'] },
      { title: 'Natural Language Processing (NLP)', category: 'Artificial Intelligence', technology: 'HuggingFace, Transformers, NLTK, Python', duration: '12 Weeks', mode: 'Online', skills: ['Tokenization', 'Attention Models', 'Sentiment Analysis'] },
      { title: 'Data Engineering & Big Data Pipelines', category: 'Data & Analytics', technology: 'Apache Spark, Kafka, Airflow, PySpark', duration: '16 Weeks', mode: 'Hybrid', skills: ['ETL Pipelines', 'Data Warehousing', 'Spark Streaming'] },
      { title: 'Business Intelligence & Modern Data Analytics', category: 'Data & Analytics', technology: 'Tableau, DAX, SQL, Excel Advanced', duration: '8 Weeks', mode: 'Online', skills: ['Interactive Dashboards', 'DAX Formulas', 'Data Modeling'] },
      { title: 'Azure Cloud Solutions Architecture', category: 'Cloud & Infrastructure', technology: 'Microsoft Azure, ARM Templates, Entra ID', duration: '10 Weeks', mode: 'Online', skills: ['Azure VMs', 'App Services', 'Blob Storage'] },
      { title: 'Google Cloud Platform (GCP) Data Engineering', category: 'Cloud & Infrastructure', technology: 'GCP BigQuery, Cloud Run, Pub/Sub, Dataflow', duration: '10 Weeks', mode: 'Online', skills: ['BigQuery SQL', 'Serverless', 'Cloud Architecture'] },
      { title: 'Network Security & SOC Analyst Operations', category: 'Security & Operations', technology: 'Splunk, Snort, Suricata, Linux Security', duration: '12 Weeks', mode: 'Offline', skills: ['Incident Response', 'Log Analysis', 'Threat Hunting'] },
      { title: 'IoT & Smart Hardware Embedded Systems', category: 'Embedded Systems', technology: 'Raspberry Pi, Arduino, ESP32, C/C++', duration: '12 Weeks', mode: 'Offline', skills: ['Sensors & GPIO', 'MQTT Protocols', 'Firmware'] },
      { title: 'Robotics & Microcontroller Engineering', category: 'Embedded Systems', technology: 'ROS, C++, Embedded C, Microchip PIC', duration: '14 Weeks', mode: 'Offline', skills: ['Robot Kinematics', 'Actuators', 'Sensors'] },
      { title: 'Android Native App Development with Kotlin', category: 'Mobile Development', technology: 'Kotlin, Jetpack Compose, Room DB, Coroutines', duration: '12 Weeks', mode: 'Hybrid', skills: ['Kotlin', 'Compose UI', 'MVVM'] },
      { title: 'iOS Native App Development with Swift', category: 'Mobile Development', technology: 'Swift, SwiftUI, Combine, CoreData', duration: '12 Weeks', mode: 'Hybrid', skills: ['SwiftUI', 'Apple Ecosystem', 'App Store Publishing'] },
      { title: 'UI/UX Design & Product Prototyping', category: 'Design & Product', technology: 'Figma, Adobe XD, Design Systems, Usability', duration: '8 Weeks', mode: 'Online', skills: ['Wireframing', 'User Research', 'Interactive Prototypes'] },
      { title: 'Angular Enterprise Frontend Architecture', category: 'Web Development', technology: 'Angular 17, RxJS, TypeScript, NgRx', duration: '10 Weeks', mode: 'Online', skills: ['Components', 'Services', 'State Management'] },
      { title: 'Vue.js & Nuxt Modern Frontend Systems', category: 'Web Development', technology: 'Vue 3, Nuxt.js, Pinia, Tailwind CSS', duration: '8 Weeks', mode: 'Online', skills: ['Composition API', 'Pinia', 'Nuxt Routing'] },
      { title: 'Spring Cloud Distributed Microservices', category: 'Software Development', technology: 'Spring Cloud, Eureka, Resilience4j, Gateway', duration: '14 Weeks', mode: 'Hybrid', skills: ['Service Discovery', 'Circuit Breakers', 'Config Server'] },
      { title: 'ASP.NET Core & C# Enterprise Engineering', category: 'Software Development', technology: '.NET 8, C#, Entity Framework Core, SQL Server', duration: '12 Weeks', mode: 'Hybrid', skills: ['C# OOP', 'LINQ', 'REST APIs', 'EF Core'] },
      { title: 'Rust Systems & High-Performance Computing', category: 'Software Development', technology: 'Rust, Cargo, Tokio, WebAssembly', duration: '12 Weeks', mode: 'Online', skills: ['Memory Safety', 'Async Rust', 'WASM'] },
      { title: 'Blockchain & Smart Contract Development', category: 'Emerging Tech', technology: 'Solidity, Ethereum, Web3.js, Hardhat', duration: '12 Weeks', mode: 'Online', skills: ['Smart Contracts', 'DeFi Patterns', 'EVM'] },
      { title: 'AR/VR & Unity 3D Simulation Development', category: 'Emerging Tech', technology: 'Unity 3D, C#, XR Interaction Toolkit', duration: '14 Weeks', mode: 'Offline', skills: ['3D Modeling', 'Physics Engines', 'VR Interactivity'] },
      { title: 'SQL & Database Administration (DBA)', category: 'Data & Analytics', technology: 'PostgreSQL, MySQL, Query Optimization, Tuning', duration: '8 Weeks', mode: 'Online', skills: ['Indexing', 'Execution Plans', 'Replication'] },
      { title: 'NoSQL & Distributed Data Modeling', category: 'Data & Analytics', technology: 'MongoDB, Cassandra, Redis, Neo4j', duration: '8 Weeks', mode: 'Online', skills: ['Sharding', 'Document DBs', 'Graph Queries'] },
      { title: 'Site Reliability Engineering (SRE)', category: 'Cloud & Infrastructure', technology: 'Prometheus, Grafana, Linux, Python, Ansible', duration: '10 Weeks', mode: 'Hybrid', skills: ['Observability', 'SLOs/SLAs', 'Chaos Engineering'] },
      { title: 'DevSecOps & Automated Security Pipelines', category: 'Security & Operations', technology: 'SonarQube, Trivy, GitHub Actions, HashiCorp Vault', duration: '10 Weeks', mode: 'Online', skills: ['SAST/DAST', 'Secret Management', 'Pipeline Security'] },
      { title: 'API Security & OAuth2 Authorization Architect', category: 'Security & Operations', technology: 'Keycloak, JWT, OAuth 2.0, OpenID Connect', duration: '6 Weeks', mode: 'Online', skills: ['Auth Protocols', 'Rate Limiting', 'Identity Management'] },
      { title: 'Product Management & Agile Scrum Execution', category: 'Design & Product', technology: 'Jira, Confluence, Product Roadmapping, PRDs', duration: '8 Weeks', mode: 'Online', skills: ['Scrum Ceremonies', 'User Stories', 'Go-To-Market'] },
      { title: 'Django & FastAPI High-Speed Backends', category: 'Software Development', technology: 'Python, FastAPI, Django, Asyncpg', duration: '10 Weeks', mode: 'Online', skills: ['Pydantic', 'Async Python', 'ORM'] },
      { title: 'PHP Laravel Modern Web Applications', category: 'Web Development', technology: 'PHP 8, Laravel 11, Livewire, MySQL', duration: '10 Weeks', mode: 'Online', skills: ['Eloquent ORM', 'Blade', 'MVC Architecture'] },
      { title: 'Ruby on Rails Rapid Product Prototyping', category: 'Web Development', technology: 'Ruby, Rails 7, Hotwire, PostgreSQL', duration: '8 Weeks', mode: 'Online', skills: ['ActiveRecord', 'Turbo', 'RESTful Design'] },
      { title: 'Salesforce Development & Apex Programming', category: 'Enterprise SaaS', technology: 'Apex, Lightning Web Components (LWC), SOQL', duration: '12 Weeks', mode: 'Online', skills: ['LWC Components', 'Triggers', 'Salesforce Admin'] },
      { title: 'SAP ABAP Cloud Modern Extensions', category: 'Enterprise SaaS', technology: 'SAP ABAP, CDS Views, RAP, Fiori Elements', duration: '12 Weeks', mode: 'Hybrid', skills: ['CDS Views', 'RAP Model', 'Fiori UI'] },
      { title: 'Kubernetes Operator & Platform Engineering', category: 'Cloud & Infrastructure', technology: 'Kubernetes, Go, Helm, ArgoCD', duration: '12 Weeks', mode: 'Online', skills: ['GitOps', 'Helm Charts', 'CRDs'] },
      { title: 'Edge AI & TinyML on Embedded Devices', category: 'Artificial Intelligence', technology: 'TensorFlow Lite, MicroPython, Edge Impulse', duration: '10 Weeks', mode: 'Offline', skills: ['Model Quantization', 'Sensor Inference', 'Microcontrollers'] },
      { title: 'Bioinformatics & Computational Biology Data', category: 'Data & Analytics', technology: 'Python, Biopython, R, Genomic Data Tools', duration: '10 Weeks', mode: 'Online', skills: ['Sequence Alignment', 'BLAST', 'Data Visualization'] },
      { title: 'FinTech Algorithmic Trading Systems', category: 'Emerging Tech', technology: 'Python, Backtrader, QuantConnect, Pandas', duration: '12 Weeks', mode: 'Online', skills: ['Trading Strategies', 'Backtesting', 'Risk Metrics'] },
      { title: 'GraphQL & Modern Federation Microservices', category: 'Software Development', technology: 'Apollo Server, GraphQL, Node.js, TypeScript', duration: '8 Weeks', mode: 'Online', skills: ['Schema Stitching', 'Resolvers', 'Federation'] },
      { title: 'Linux Kernel Modules & Device Drivers', category: 'Embedded Systems', technology: 'C, Linux Kernel 6.x, POSIX, Make', duration: '14 Weeks', mode: 'Offline', skills: ['Kernel Space', 'Interrupt Handlers', 'Char Drivers'] },
      { title: 'Game Development with Unreal Engine 5', category: 'Emerging Tech', technology: 'Unreal Engine 5, C++, Blueprints, Nanite', duration: '14 Weeks', mode: 'Offline', skills: ['Game Physics', 'Blueprints', 'C++ Gameplay'] },
      { title: 'Web3 Security & Smart Contract Auditing', category: 'Security & Operations', technology: 'Slither, Mythril, Foundry, Solidity', duration: '10 Weeks', mode: 'Online', skills: ['Reentrancy Bugs', 'Formal Verification', 'Gas Optimization'] },
      { title: 'Customer Data Platform (CDP) Engineering', category: 'Data & Analytics', technology: 'Segment, Snowflake, dbt, SQL', duration: '10 Weeks', mode: 'Online', skills: ['dbt Models', 'Data Lineage', 'Analytics Eng'] },
      { title: 'Performance Engineering & Load Testing', category: 'Quality Assurance', technology: 'k6, JMeter, Grafana, Distributed Tracing', duration: '8 Weeks', mode: 'Online', skills: ['Load Profiles', 'Bottleneck Analysis', 'Thread Dumps'] },
      { title: 'Conversational AI & Enterprise Voice Agents', category: 'Artificial Intelligence', technology: 'Twilio, WebSockets, Whisper, GPT-4, Node.js', duration: '10 Weeks', mode: 'Online', skills: ['Speech-to-Text', 'Streaming Audio', 'Agent Workflows'] }
    ];

    // Featured Courses
    const courseList = [
      {
        title: 'Java Full Stack Masterclass',
        domain: 'Enterprise Software',
        description: 'Master Core Java, Spring Boot microservices, React 18, PostgreSQL, and AWS deployment with 100% practical lab tasks.',
        duration: '16 Weeks',
        level: 'Beginner to Advanced',
        skills: ['Java Core', 'Spring Boot', 'React', 'Docker', 'AWS'],
        isTrending: true,
        studentsEnrolled: 420,
        rating: 4.9,
        icon: 'Layers'
      },
      {
        title: 'Python AI, Data Science & GenAI',
        domain: 'Artificial Intelligence',
        description: 'Comprehensive Python programming, data analytics with Pandas, deep learning, PyTorch, and generative AI with LLMs.',
        duration: '14 Weeks',
        level: 'Beginner to Advanced',
        skills: ['Python', 'PyTorch', 'LangChain', 'OpenAI', 'NumPy'],
        isTrending: true,
        studentsEnrolled: 560,
        rating: 5.0,
        icon: 'Brain'
      },
      {
        title: 'MERN Stack Cloud Developer',
        domain: 'Modern Web Engineering',
        description: 'Build enterprise-grade single page applications with React, Node.js, Express, MongoDB, TypeScript, and micro-frontends.',
        duration: '12 Weeks',
        level: 'Intermediate',
        skills: ['React 18', 'Node.js', 'Express', 'MongoDB', 'TypeScript'],
        isTrending: true,
        studentsEnrolled: 380,
        rating: 4.8,
        icon: 'Terminal'
      },
      {
        title: 'Data Structures, Algorithms & LeetCode 100',
        domain: 'Interview Preparation',
        description: 'Master arrays, trees, dynamic programming, sliding windows, and system design tailored for FAANG and product companies.',
        duration: '10 Weeks',
        level: 'All Levels',
        skills: ['DSA', 'Two Pointers', 'Graphs', 'DP', 'System Design'],
        isTrending: true,
        studentsEnrolled: 610,
        rating: 4.9,
        icon: 'Cpu'
      },
      {
        title: 'Cloud DevOps & Kubernetes Engineering',
        domain: 'Cloud Architecture',
        description: 'Automate enterprise pipelines with Docker, Kubernetes, Terraform, AWS, Jenkins, and GitOps workflows.',
        duration: '12 Weeks',
        level: 'Intermediate to Advanced',
        skills: ['Docker', 'Kubernetes', 'AWS', 'Terraform', 'CI/CD'],
        isTrending: false,
        studentsEnrolled: 290,
        rating: 4.8,
        icon: 'Cloud'
      },
      {
        title: 'Cybersecurity & Ethical Hacking Operations',
        domain: 'Security Engineering',
        description: 'Hands-on network auditing, penetration testing, vulnerability scanning, web security exploits, and SOC incident triage.',
        duration: '12 Weeks',
        level: 'All Levels',
        skills: ['Kali Linux', 'Burp Suite', 'Metasploit', 'SOC', 'SIEM'],
        isTrending: false,
        studentsEnrolled: 310,
        rating: 4.9,
        icon: 'ShieldCheck'
      },
      {
        title: 'Flutter & Mobile App Development',
        domain: 'Cross-Platform Mobile',
        description: 'Develop slick native iOS & Android applications from a single codebase using Flutter, Dart, Firebase, and Bloc state management.',
        duration: '10 Weeks',
        level: 'Beginner to Intermediate',
        skills: ['Dart', 'Flutter', 'Firebase', 'REST APIs', 'App Store'],
        isTrending: false,
        studentsEnrolled: 230,
        rating: 4.7,
        icon: 'Smartphone'
      },
      {
        title: 'Data Engineering & Big Data Systems',
        domain: 'Data Architecture',
        description: 'Construct real-time and batch streaming pipelines with Apache Spark, Kafka, Airflow, PySpark, and modern data lakes.',
        duration: '14 Weeks',
        level: 'Intermediate to Advanced',
        skills: ['PySpark', 'Kafka', 'Airflow', 'Data Lakes', 'SQL'],
        isTrending: false,
        studentsEnrolled: 260,
        rating: 4.8,
        icon: 'Database'
      }
    ];

    // Real-world Products Developed
    const productList = [
      {
        name: 'QuestLMS Enterprise',
        shortDescription: 'Comprehensive learning management system connecting syllabus, tutors, tasks, and real-time class attendance.',
        technology: 'React 18, Node.js, Express, MongoDB, Tailwind CSS',
        category: 'EdTech Platform',
        demoUrl: '/student',
        tags: ['LMS', 'Education', 'Full Stack']
      },
      {
        name: 'InterviewArena AI',
        shortDescription: 'Gamified coding sandbox with automated LeetCode-style test case runner, AST syntax analysis, and hint engine.',
        technology: 'Node.js, Docker Sandboxes, Python Runner, Java Compiler',
        category: 'Developer Tool',
        demoUrl: '/interview-game',
        tags: ['Compiler', 'Code Sandbox', 'AI Hints']
      },
      {
        name: 'CampusStream Live',
        shortDescription: 'Real-time hybrid classroom scheduling and virtual lecture gateway with automated student absence resolution.',
        technology: 'WebRTC, Socket.io, Express, React, Google Meet API',
        category: 'Collaboration',
        demoUrl: '/tutor',
        tags: ['WebRTC', 'Live Lecture', 'Attendance']
      },
      {
        name: 'OmniAnalytics SOC',
        shortDescription: 'Student telemetry dashboard measuring challenge accuracy, time spent, streaks, and tutor feedback loops.',
        technology: 'Recharts, MongoDB Aggregations, Redis, Tailwind',
        category: 'Analytics Dashboard',
        demoUrl: '/trainer',
        tags: ['Telemetry', 'Metrics', 'Real-time']
      },
      {
        name: 'CloudDeploy Pro',
        shortDescription: 'One-click containerized deployment assistant for student project portfolios and microservice testing.',
        technology: 'Go, Docker API, Kubernetes, AWS ECS, Nginx',
        category: 'DevOps Platform',
        demoUrl: '#',
        tags: ['DevOps', 'Containers', 'Cloud']
      },
      {
        name: 'CodeReviewer AI Assistant',
        shortDescription: 'Automated static code analyzer reviewing time complexity, memory footprint, and clean code principles.',
        technology: 'Python, Tree-sitter, OpenAI API, FastAPI',
        category: 'Developer Tool',
        demoUrl: '#',
        tags: ['Static Analysis', 'AI', 'Linting']
      }
    ];

    // Special Offers
    const offerList = [
      {
        title: 'Early Bird Technology Training Grant',
        description: 'Flat 25% waiver on all Full Stack Java, Python AI, and MERN Stack live training batches.',
        validity: 'Valid through this weekend',
        discount: '25% OFF',
        type: 'Course',
        applyUrl: '/contact',
        badgeColor: 'blue'
      },
      {
        title: 'Dual-Domain Internship Accelerator',
        description: 'Enroll in any core course and receive a guaranteed, certified 12-week industry internship placement.',
        validity: 'For first 50 registrations',
        discount: 'FREE INTERNSHIP',
        type: 'Internship',
        applyUrl: '/contact',
        badgeColor: 'emerald'
      },
      {
        title: 'Campus Student Scholar Pass',
        description: 'Special concession for currently enrolled college engineering students with verified college ID.',
        validity: 'Academic Year 2026',
        discount: '30% SCHOLARSHIP',
        type: 'Student',
        applyUrl: '/contact',
        badgeColor: 'amber'
      },
      {
        title: 'Full Stack + Cloud DevOps Super Combo',
        description: 'Complete end-to-end development plus infrastructure mastering bundle with lifetime practice sandbox access.',
        validity: 'Limited Seats',
        discount: 'COMBO 35% OFF',
        type: 'Combo',
        applyUrl: '/contact',
        badgeColor: 'red'
      }
    ];

    await CompanyPortal.create({
      companyName: 'STACK QUEUE',
      tagline: 'Inclusive Learning — Empowering students with industry-oriented technology training, practical learning, internship opportunities, and real-world product development.',
      statistics: {
        coursesCount: '50+',
        internshipDomainsCount: '50+',
        studentsTrained: '1,250+',
        studentsLearning: '450+',
        productsDeveloped: '28+',
        yearsExperience: '10+',
        industryProjects: '120+',
        internshipStudents: '850+'
      },
      featuredCourses: courseList,
      internshipDomains: internshipDomainList,
      products: productList,
      specialOffers: offerList
    });

    console.log('✅ PORTAL SEED SUCCESSFUL!');
    console.log(`- Statistics Seeded: 50+ Courses, 50+ Internship Domains (${internshipDomainList.length} total domains seeded)`);
    console.log(`- Courses Seeded: ${courseList.length}`);
    console.log(`- Products Seeded: ${productList.length}`);
    console.log(`- Offers Seeded: ${offerList.length}`);
    process.exit(0);
  } catch (err) {
    console.error('Portal seed error:', err);
    process.exit(1);
  }
}

seedPortal();
