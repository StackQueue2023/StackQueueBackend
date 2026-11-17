/**
 * STACK QUEUE — Complete 42 Master Course Catalog & Learning Environment Configurations
 * Defined strictly according to Category A through H requirements.
 */

const MASTER_COURSES = [
  // ─────────────────────────────────────────────────────────────────
  // CATEGORY A – AI, DATA SCIENCE AND ANALYTICS
  // ─────────────────────────────────────────────────────────────────
  {
    courseNumber: 1,
    title: 'Artificial Intelligence',
    slug: 'artificial-intelligence',
    category: 'CATEGORY_A_AI_DATA',
    categoryLabel: 'AI, Data Science & Analytics',
    domain: 'Artificial Intelligence',
    classification: 'coding',
    environmentType: 'python_jupyter',
    environmentName: 'Python 3 + Jupyter-Style AI Workspace',
    compilerLanguage: 'python',
    supportedLanguages: ['python'],
    validationStrategy: 'COMPILER_TEST_CASES',
    description: 'AI model development, data preparation, model evaluation, and intelligent workflow exercises.',
    workspaceTools: [
      { toolId: 'jupyter', toolName: 'Interactive Python Notebook', icon: 'Code', description: 'Interactive Python cell runner' },
      { toolId: 'model_eval', toolName: 'Model Evaluator', icon: 'Cpu', description: 'Loss and accuracy metric visualizer' }
    ]
  },
  {
    courseNumber: 2,
    title: 'Machine Learning (Python)',
    slug: 'machine-learning-python',
    category: 'CATEGORY_A_AI_DATA',
    categoryLabel: 'AI, Data Science & Analytics',
    domain: 'Machine Learning',
    classification: 'coding',
    environmentType: 'python_jupyter',
    environmentName: 'Python + Jupyter Notebook (ML Engine)',
    compilerLanguage: 'python',
    supportedLanguages: ['python'],
    validationStrategy: 'COMPILER_TEST_CASES',
    description: 'NumPy, Pandas, Scikit-learn, supervised/unsupervised model training, prediction and evaluation.',
    workspaceTools: [
      { toolId: 'jupyter', toolName: 'Jupyter Notebook', icon: 'FileCode', description: 'Execute NumPy & Scikit-learn models' },
      { toolId: 'dataset', toolName: 'Dataset Inspector', icon: 'Database', description: 'Tabular dataset viewer' }
    ]
  },
  {
    courseNumber: 3,
    title: 'Deep Learning',
    slug: 'deep-learning',
    category: 'CATEGORY_A_AI_DATA',
    categoryLabel: 'AI, Data Science & Analytics',
    domain: 'Deep Learning',
    classification: 'coding',
    environmentType: 'python_jupyter',
    environmentName: 'Python + Jupyter (TensorFlow / PyTorch Engine)',
    compilerLanguage: 'python',
    supportedLanguages: ['python'],
    validationStrategy: 'COMPILER_TEST_CASES',
    description: 'TensorFlow, PyTorch, multi-layer neural network architecture, model training and evaluation.',
    workspaceTools: [
      { toolId: 'tensor_lab', toolName: 'Tensor Notebook', icon: 'Layers', description: 'Deep neural network design' }
    ]
  },
  {
    courseNumber: 4,
    title: 'Robotic Process Automation',
    slug: 'robotic-process-automation',
    category: 'CATEGORY_A_AI_DATA',
    categoryLabel: 'AI, Data Science & Analytics',
    domain: 'Robotic Process Automation',
    classification: 'non-coding',
    environmentType: 'rpa_designer',
    environmentName: 'Visual RPA Workflow Designer',
    compilerLanguage: null,
    supportedLanguages: [],
    validationStrategy: 'RPA_WORKFLOW_EVAL',
    description: 'Visual drag-and-drop RPA workflow designer with activity connections, variables, conditions, and execution simulation.',
    workspaceTools: [
      { toolId: 'rpa_canvas', toolName: 'Workflow Canvas', icon: 'GitBranch', description: 'Drag-and-drop automation designer' },
      { toolId: 'rpa_logs', toolName: 'Execution Logs', icon: 'Terminal', description: 'Bot run telemetry and step logs' }
    ]
  },
  {
    courseNumber: 5,
    title: 'Data Science (Python)',
    slug: 'data-science-python',
    category: 'CATEGORY_A_AI_DATA',
    categoryLabel: 'AI, Data Science & Analytics',
    domain: 'Data Science',
    classification: 'coding',
    environmentType: 'python_jupyter',
    environmentName: 'Python Data Science Workspace',
    compilerLanguage: 'python',
    supportedLanguages: ['python'],
    validationStrategy: 'COMPILER_TEST_CASES',
    description: 'Data cleaning, exploratory data analysis, Pandas, NumPy, statistical modeling and visualizations.',
    workspaceTools: [
      { toolId: 'pandas_lab', toolName: 'Pandas DataLab', icon: 'BarChart', description: 'Statistical transforms & plotting' }
    ]
  },
  {
    courseNumber: 6,
    title: 'Data Analytics',
    slug: 'data-analytics',
    category: 'CATEGORY_A_AI_DATA',
    categoryLabel: 'AI, Data Science & Analytics',
    domain: 'Data Analytics',
    classification: 'hybrid',
    environmentType: 'data_analytics',
    environmentName: 'Interactive Data Analytics Workspace',
    compilerLanguage: 'python',
    supportedLanguages: ['python', 'javascript'],
    validationStrategy: 'DATA_ANALYTICS_EVAL',
    description: 'Dataset editor, spreadsheet operations, data filtering, sorting, charts, metrics and exploratory analysis.',
    workspaceTools: [
      { toolId: 'grid_editor', toolName: 'Data Sheet Editor', icon: 'Table', description: 'Interactive data filtering and transforms' },
      { toolId: 'chart_engine', toolName: 'Chart Studio', icon: 'PieChart', description: 'Bar, line, scatter visualizers' }
    ]
  },
  {
    courseNumber: 7,
    title: 'Business Analytics',
    slug: 'business-analytics',
    category: 'CATEGORY_A_AI_DATA',
    categoryLabel: 'AI, Data Science & Analytics',
    domain: 'Business Analytics',
    classification: 'non-coding',
    environmentType: 'bi_dashboard',
    environmentName: 'Business Intelligence & KPI Workspace',
    compilerLanguage: null,
    supportedLanguages: [],
    validationStrategy: 'DATA_ANALYTICS_EVAL',
    description: 'Business datasets, KPI calculations, dashboard creation, trend charts, business insights and reporting.',
    workspaceTools: [
      { toolId: 'kpi_builder', toolName: 'KPI Metric Engine', icon: 'TrendingUp', description: 'Revenue, churn, margin formulas' },
      { toolId: 'bi_board', toolName: 'Executive Dashboard', icon: 'LayoutDashboard', description: 'Visual BI report composer' }
    ]
  },
  {
    courseNumber: 8,
    title: 'Big Data Engineering (Spark / Kafka)',
    slug: 'big-data-engineering-spark-kafka',
    category: 'CATEGORY_A_AI_DATA',
    categoryLabel: 'AI, Data Science & Analytics',
    domain: 'Big Data Engineering',
    classification: 'hybrid',
    environmentType: 'big_data_pipeline',
    environmentName: 'Big Data Pipeline Workspace',
    compilerLanguage: 'python',
    supportedLanguages: ['python', 'java'],
    validationStrategy: 'COMPILER_TEST_CASES',
    description: 'Spark workflows, Kafka event streaming simulation, data ingestion, distributed transforms and pipeline monitoring.',
    workspaceTools: [
      { toolId: 'spark_runner', toolName: 'PySpark / Spark Engine', icon: 'Zap', description: 'Batch & stream transform runner' },
      { toolId: 'kafka_stream', toolName: 'Kafka Topic Simulator', icon: 'Radio', description: 'Pub/sub message broker simulator' }
    ]
  },

  // ─────────────────────────────────────────────────────────────────
  // CATEGORY B – WEB AND FULL STACK DEVELOPMENT
  // ─────────────────────────────────────────────────────────────────
  {
    courseNumber: 9,
    title: 'Full Stack Web Development',
    slug: 'full-stack-web-development',
    category: 'CATEGORY_B_WEB_FULLSTACK',
    categoryLabel: 'Web & Full Stack Development',
    domain: 'Web Development',
    classification: 'coding',
    environmentType: 'web_editor',
    environmentName: 'Full Stack Browser & Node.js Workspace',
    compilerLanguage: 'javascript',
    supportedLanguages: ['javascript', 'html', 'css'],
    validationStrategy: 'COMPILER_TEST_CASES',
    description: 'HTML5, CSS3, JavaScript ES6+, Node.js runtime, relational/NoSQL databases, live browser preview.',
    workspaceTools: [
      { toolId: 'code_editor', toolName: 'Web Code Editor', icon: 'Code', description: 'Multi-file web editor' },
      { toolId: 'browser_preview', toolName: 'Live Browser View', icon: 'Globe', description: 'Real-time rendering iframe' }
    ]
  },
  {
    courseNumber: 10,
    title: 'MERN Stack Development',
    slug: 'mern-stack-development',
    category: 'CATEGORY_B_WEB_FULLSTACK',
    categoryLabel: 'Web & Full Stack Development',
    domain: 'MERN Stack',
    classification: 'coding',
    environmentType: 'mern_stack',
    environmentName: 'MERN Stack (MongoDB, Express, React, Node) Workspace',
    compilerLanguage: 'javascript',
    supportedLanguages: ['javascript'],
    validationStrategy: 'COMPILER_TEST_CASES',
    description: 'MongoDB Atlas, Express.js REST APIs, React components & hooks, Node.js backend integration.',
    workspaceTools: [
      { toolId: 'react_env', toolName: 'React Component Editor', icon: 'Component', description: 'React JSX & state sandbox' },
      { toolId: 'api_layer', toolName: 'Express API Runner', icon: 'Server', description: 'REST route evaluation' }
    ]
  },
  {
    courseNumber: 11,
    title: 'MEAN Stack Development',
    slug: 'mean-stack-development',
    category: 'CATEGORY_B_WEB_FULLSTACK',
    categoryLabel: 'Web & Full Stack Development',
    domain: 'MEAN Stack',
    classification: 'coding',
    environmentType: 'mean_stack',
    environmentName: 'MEAN Stack (MongoDB, Express, Angular, Node) Workspace',
    compilerLanguage: 'javascript',
    supportedLanguages: ['javascript'],
    validationStrategy: 'COMPILER_TEST_CASES',
    description: 'MongoDB, Express.js, Angular TypeScript components, dependency injection, and Node.js backend.',
    workspaceTools: [
      { toolId: 'angular_env', toolName: 'Angular Module Editor', icon: 'Code2', description: 'TypeScript component sandbox' }
    ]
  },
  {
    courseNumber: 12,
    title: 'Java Full Stack Development',
    slug: 'java-full-stack-development',
    category: 'CATEGORY_B_WEB_FULLSTACK',
    categoryLabel: 'Web & Full Stack Development',
    domain: 'Java Full Stack',
    classification: 'coding',
    environmentType: 'java_fullstack',
    environmentName: 'Java Full Stack (JDK 22 + Spring Boot + Web) Workspace',
    compilerLanguage: 'java',
    supportedLanguages: ['java', 'javascript', 'sql'],
    validationStrategy: 'COMPILER_TEST_CASES',
    description: 'Java JDK 22, Spring Boot REST controllers, Hibernate ORM, HTML/CSS/JavaScript, relational SQL.',
    workspaceTools: [
      { toolId: 'java_jdk', toolName: 'Java JDK 22 Engine', icon: 'Coffee', description: 'Compiled Java runner' },
      { toolId: 'spring_tester', toolName: 'Spring Endpoint Tester', icon: 'Send', description: 'Controller endpoint testing' }
    ]
  },
  {
    courseNumber: 13,
    title: 'Python Full Stack Development',
    slug: 'python-full-stack-development',
    category: 'CATEGORY_B_WEB_FULLSTACK',
    categoryLabel: 'Web & Full Stack Development',
    domain: 'Python Full Stack',
    classification: 'coding',
    environmentType: 'python_fullstack',
    environmentName: 'Python Full Stack (Django / Flask + Web) Workspace',
    compilerLanguage: 'python',
    supportedLanguages: ['python', 'javascript', 'html'],
    validationStrategy: 'COMPILER_TEST_CASES',
    description: 'Python 3.11, Django / Flask routes, templates, ORM models, frontend HTML/CSS/JS, SQLite/PostgreSQL.',
    workspaceTools: [
      { toolId: 'python_runtime', toolName: 'Python 3 Runtime', icon: 'Code', description: 'Backend Python engine' }
    ]
  },
  {
    courseNumber: 14,
    title: 'Frontend Development (React / Angular)',
    slug: 'frontend-development-react-angular',
    category: 'CATEGORY_B_WEB_FULLSTACK',
    categoryLabel: 'Web & Full Stack Development',
    domain: 'Frontend Development',
    classification: 'coding',
    environmentType: 'web_editor',
    environmentName: 'Frontend Component Studio (React / Angular)',
    compilerLanguage: 'javascript',
    supportedLanguages: ['javascript', 'html', 'css'],
    validationStrategy: 'COMPILER_TEST_CASES',
    description: 'Component architecture, state management, reactive rendering, responsive styling, and live browser previews.',
    workspaceTools: [
      { toolId: 'live_preview', toolName: 'Component Preview', icon: 'Eye', description: 'Live preview iframe' }
    ]
  },
  {
    courseNumber: 15,
    title: 'Backend Development (Node.js / Spring Boot)',
    slug: 'backend-development-nodejs-springboot',
    category: 'CATEGORY_B_WEB_FULLSTACK',
    categoryLabel: 'Web & Full Stack Development',
    domain: 'Backend Development',
    classification: 'coding',
    environmentType: 'api_tester',
    environmentName: 'Backend & API Testing Workspace',
    compilerLanguage: 'javascript',
    supportedLanguages: ['javascript', 'java'],
    validationStrategy: 'COMPILER_TEST_CASES',
    description: 'Node.js runtime, Java Spring Boot micro-services, RESTful API design, database transactions, request validation.',
    workspaceTools: [
      { toolId: 'api_client', toolName: 'REST API Tester', icon: 'Send', description: 'HTTP method runner with headers & body' }
    ]
  },

  // ─────────────────────────────────────────────────────────────────
  // CATEGORY C – CLOUD, DEVOPS AND CYBERSECURITY
  // ─────────────────────────────────────────────────────────────────
  {
    courseNumber: 16,
    title: 'Cloud Computing (AWS)',
    slug: 'cloud-computing-aws',
    category: 'CATEGORY_C_CLOUD_DEVOPS_CYBER',
    categoryLabel: 'Cloud, DevOps & Cybersecurity',
    domain: 'Cloud Computing',
    classification: 'hybrid',
    environmentType: 'cloud_aws',
    environmentName: 'AWS-Style Interactive Cloud Workspace',
    compilerLanguage: 'javascript',
    supportedLanguages: ['javascript', 'json'],
    validationStrategy: 'CLOUD_ARCH_EVAL',
    description: 'EC2 instance provisioning, S3 bucket storage, IAM roles, VPC networking, Lambda serverless, and cloud architecture designer.',
    workspaceTools: [
      { toolId: 'aws_designer', toolName: 'Cloud Architecture Designer', icon: 'Cloud', description: 'Visual AWS resource topology builder' },
      { toolId: 'cloud_tester', toolName: 'Deployment Simulator', icon: 'CheckCircle', description: 'Verify IAM, VPC, and S3 configs' }
    ]
  },
  {
    courseNumber: 17,
    title: 'Cloud Computing (Microsoft Azure)',
    slug: 'cloud-computing-microsoft-azure',
    category: 'CATEGORY_C_CLOUD_DEVOPS_CYBER',
    categoryLabel: 'Cloud, DevOps & Cybersecurity',
    domain: 'Cloud Computing',
    classification: 'hybrid',
    environmentType: 'cloud_azure',
    environmentName: 'Azure-Style Practical Cloud Workspace',
    compilerLanguage: 'javascript',
    supportedLanguages: ['javascript', 'json'],
    validationStrategy: 'CLOUD_ARCH_EVAL',
    description: 'Virtual Machines, Blob Storage, Virtual Networks, Azure AD identity & access management, deployment simulation.',
    workspaceTools: [
      { toolId: 'azure_portal', toolName: 'Azure Resource Designer', icon: 'CloudRain', description: 'Azure compute and networking simulation' }
    ]
  },
  {
    courseNumber: 18,
    title: 'Cloud Computing (Google Cloud)',
    slug: 'cloud-computing-google-cloud',
    category: 'CATEGORY_C_CLOUD_DEVOPS_CYBER',
    categoryLabel: 'Cloud, DevOps & Cybersecurity',
    domain: 'Cloud Computing',
    classification: 'hybrid',
    environmentType: 'cloud_gcp',
    environmentName: 'Google Cloud Practical Workspace',
    compilerLanguage: 'javascript',
    supportedLanguages: ['javascript', 'json'],
    validationStrategy: 'CLOUD_ARCH_EVAL',
    description: 'Compute Engine, Cloud Storage buckets, VPC networks, Cloud Functions, and GCP infrastructure configuration.',
    workspaceTools: [
      { toolId: 'gcp_console', toolName: 'GCP Topology Builder', icon: 'CloudSnow', description: 'Google Cloud resource simulation' }
    ]
  },
  {
    courseNumber: 19,
    title: 'DevOps Engineering',
    slug: 'devops-engineering',
    category: 'CATEGORY_C_CLOUD_DEVOPS_CYBER',
    categoryLabel: 'Cloud, DevOps & Cybersecurity',
    domain: 'DevOps',
    classification: 'hybrid',
    environmentType: 'devops_pipeline',
    environmentName: 'DevOps CI/CD & Terminal Workspace',
    compilerLanguage: 'javascript',
    supportedLanguages: ['javascript', 'bash'],
    validationStrategy: 'COMPILER_TEST_CASES',
    description: 'Linux terminal simulation, Git branching, CI/CD pipeline YAML builder, Jenkins workflow, and deployment automation.',
    workspaceTools: [
      { toolId: 'terminal', toolName: 'Linux DevOps Terminal', icon: 'Terminal', description: 'CLI commands, Git & Docker syntax' },
      { toolId: 'cicd_flow', toolName: 'CI/CD Pipeline Flow', icon: 'GitPullRequest', description: 'Build-test-deploy stage designer' }
    ]
  },
  {
    courseNumber: 20,
    title: 'Docker & Kubernetes',
    slug: 'docker-kubernetes',
    category: 'CATEGORY_C_CLOUD_DEVOPS_CYBER',
    categoryLabel: 'Cloud, DevOps & Cybersecurity',
    domain: 'DevOps & Containers',
    classification: 'hybrid',
    environmentType: 'docker_k8s',
    environmentName: 'Container & Orchestration Workspace',
    compilerLanguage: 'javascript',
    supportedLanguages: ['yaml', 'javascript'],
    validationStrategy: 'COMPILER_TEST_CASES',
    description: 'Dockerfile configurations, container lifecycle, Kubernetes YAML deployment designer, Pods, Services, and ingress validation.',
    workspaceTools: [
      { toolId: 'dockerfile_editor', toolName: 'Dockerfile & YAML Editor', icon: 'FileText', description: 'Container definitions' },
      { toolId: 'k8s_cluster', toolName: 'K8s Cluster Visualizer', icon: 'Server', description: 'Cluster pods & services telemetry' }
    ]
  },
  {
    courseNumber: 21,
    title: 'Cybersecurity',
    slug: 'cybersecurity',
    category: 'CATEGORY_C_CLOUD_DEVOPS_CYBER',
    categoryLabel: 'Cloud, DevOps & Cybersecurity',
    domain: 'Cybersecurity',
    classification: 'hybrid',
    environmentType: 'cybersecurity_lab',
    environmentName: 'Interactive Defensive Cybersecurity Lab',
    compilerLanguage: 'python',
    supportedLanguages: ['python'],
    validationStrategy: 'CYBER_DEFENSE_EVAL',
    description: 'Network analysis, packet payload inspection, security event log investigation, firewall configuration, threat identification.',
    workspaceTools: [
      { toolId: 'packet_analyzer', toolName: 'Packet & Log Inspector', icon: 'ShieldAlert', description: 'Network traffic & auth telemetry analysis' },
      { toolId: 'firewall_rules', toolName: 'Firewall Policy Manager', icon: 'ShieldCheck', description: 'Rule syntax & port filtering' }
    ]
  },
  {
    courseNumber: 22,
    title: 'Ethical Hacking',
    slug: 'ethical-hacking',
    category: 'CATEGORY_C_CLOUD_DEVOPS_CYBER',
    categoryLabel: 'Cloud, DevOps & Cybersecurity',
    domain: 'Cybersecurity',
    classification: 'hybrid',
    environmentType: 'ethical_hacking',
    environmentName: 'Authorized Security Training Lab',
    compilerLanguage: 'python',
    supportedLanguages: ['python'],
    validationStrategy: 'CYBER_DEFENSE_EVAL',
    description: 'Security vulnerability assessment, security header analysis, SQL injection defense, security reporting in controlled environments.',
    workspaceTools: [
      { toolId: 'vuln_scanner', toolName: 'Vulnerability Inspector', icon: 'Shield', description: 'Target security assessment' }
    ]
  },
  {
    courseNumber: 23,
    title: 'Network Security',
    slug: 'network-security',
    category: 'CATEGORY_C_CLOUD_DEVOPS_CYBER',
    categoryLabel: 'Cloud, DevOps & Cybersecurity',
    domain: 'Network Security',
    classification: 'non-coding',
    environmentType: 'network_security',
    environmentName: 'Network Security & Topology Simulator',
    compilerLanguage: null,
    supportedLanguages: [],
    validationStrategy: 'CYBER_DEFENSE_EVAL',
    description: 'Network topology design, packet filtering rules, firewall ACLs, subnets, routers, and traffic anomaly monitoring.',
    workspaceTools: [
      { toolId: 'net_topology', toolName: 'Network Topology Designer', icon: 'Share2', description: 'Subnet, router & switch designer' }
    ]
  },
  {
    courseNumber: 24,
    title: 'Penetration Testing',
    slug: 'penetration-testing',
    category: 'CATEGORY_C_CLOUD_DEVOPS_CYBER',
    categoryLabel: 'Cloud, DevOps & Cybersecurity',
    domain: 'Cybersecurity',
    classification: 'hybrid',
    environmentType: 'penetration_testing',
    environmentName: 'Authorized Penetration Testing Lab',
    compilerLanguage: 'python',
    supportedLanguages: ['python'],
    validationStrategy: 'CYBER_DEFENSE_EVAL',
    description: 'Target reconnaissance, vulnerability discovery, proof of concept analysis, remediation reports, and CVSS scoring.',
    workspaceTools: [
      { toolId: 'pentest_studio', toolName: 'Audit & Exploit Analysis', icon: 'Lock', description: 'Controlled test target inspection' }
    ]
  },

  // ─────────────────────────────────────────────────────────────────
  // CATEGORY D – MOBILE APPLICATION AND UI/UX
  // ─────────────────────────────────────────────────────────────────
  {
    courseNumber: 25,
    title: 'Mobile App Development (Android)',
    slug: 'mobile-app-development-android',
    category: 'CATEGORY_D_MOBILE_UIUX',
    categoryLabel: 'Mobile App & UI/UX Design',
    domain: 'Mobile App Development',
    classification: 'coding',
    environmentType: 'mobile_android',
    environmentName: 'Android Mobile App Workspace (Kotlin / Java)',
    compilerLanguage: 'java',
    supportedLanguages: ['java', 'kotlin'],
    validationStrategy: 'COMPILER_TEST_CASES',
    description: 'Android Studio-style development, Activity/Fragment lifecycle, XML layout, Kotlin/Java, mobile device preview.',
    workspaceTools: [
      { toolId: 'android_emulator', toolName: 'Android Device Screen', icon: 'Smartphone', description: 'Mobile screen layout preview' }
    ]
  },
  {
    courseNumber: 26,
    title: 'Cross-Platform App Development (Flutter / React Native)',
    slug: 'cross-platform-app-development-flutter-react-native',
    category: 'CATEGORY_D_MOBILE_UIUX',
    categoryLabel: 'Mobile App & UI/UX Design',
    domain: 'Mobile App Development',
    classification: 'coding',
    environmentType: 'mobile_crossplatform',
    environmentName: 'Cross-Platform Mobile Studio (Flutter / React Native)',
    compilerLanguage: 'javascript',
    supportedLanguages: ['javascript', 'dart'],
    validationStrategy: 'COMPILER_TEST_CASES',
    description: 'Flutter widget trees, React Native components, mobile responsive layouts, device navigation, live mobile preview.',
    workspaceTools: [
      { toolId: 'mobile_preview', toolName: 'Interactive Mobile Preview', icon: 'Tablet', description: 'iOS & Android viewport' }
    ]
  },
  {
    courseNumber: 27,
    title: 'UI/UX Design',
    slug: 'ui-ux-design',
    category: 'CATEGORY_D_MOBILE_UIUX',
    categoryLabel: 'Mobile App & UI/UX Design',
    domain: 'UI/UX Design',
    classification: 'non-coding',
    environmentType: 'uiux_figma',
    environmentName: 'Native Figma-Inspired Visual Design Workspace',
    compilerLanguage: null,
    supportedLanguages: [],
    validationStrategy: 'UIUX_DOM_RUBRIC',
    description: 'Visual vector canvas, frames, artboards, layers, properties, text, shapes, buttons, typography, colors, spacing, prototyping, interactive preview.',
    workspaceTools: [
      { toolId: 'canvas', toolName: 'Design Canvas', icon: 'Palette', description: 'Artboards, shapes, typography & layers' },
      { toolId: 'prototype', toolName: 'Interactive Prototype', icon: 'Play', description: 'Click-through screen transitions' }
    ]
  },
  {
    courseNumber: 28,
    title: 'Web Design (HTML, CSS, JS)',
    slug: 'web-design-html-css-js',
    category: 'CATEGORY_D_MOBILE_UIUX',
    categoryLabel: 'Mobile App & UI/UX Design',
    domain: 'Web Design',
    classification: 'coding',
    environmentType: 'web_editor',
    environmentName: 'Web Design Studio (HTML, CSS, JS)',
    compilerLanguage: 'javascript',
    supportedLanguages: ['html', 'css', 'javascript'],
    validationStrategy: 'COMPILER_TEST_CASES',
    description: 'Semantic HTML markup, CSS3 Flexbox/Grid layouts, modern typography, animations, JavaScript interactivity, live browser preview.',
    workspaceTools: [
      { toolId: 'split_editor', toolName: 'Live Web Editor', icon: 'Monitor', description: 'HTML/CSS code editor with live rendering' }
    ]
  },

  // ─────────────────────────────────────────────────────────────────
  // CATEGORY E – SOFTWARE TESTING
  // ─────────────────────────────────────────────────────────────────
  {
    courseNumber: 29,
    title: 'Software Testing (Manual Testing)',
    slug: 'software-testing-manual-testing',
    category: 'CATEGORY_E_TESTING',
    categoryLabel: 'Software Testing',
    domain: 'Software Testing',
    classification: 'non-coding',
    environmentType: 'manual_testing',
    environmentName: 'Interactive Software Testing Workspace',
    compilerLanguage: null,
    supportedLanguages: [],
    validationStrategy: 'MANUAL_TESTING_EVAL',
    description: 'Test scenario creation, test case builder with steps/preconditions/expected results, pass/fail execution, and defect bug reporting.',
    workspaceTools: [
      { toolId: 'test_case_builder', toolName: 'Test Case Manager', icon: 'CheckSquare', description: 'Test cases & execution status' },
      { toolId: 'bug_tracker', toolName: 'Bug Report Logger', icon: 'AlertOctagon', description: 'Defect logging with severity & steps' }
    ]
  },
  {
    courseNumber: 30,
    title: 'Software Testing (Automation Testing – Selenium)',
    slug: 'software-testing-automation-testing-selenium',
    category: 'CATEGORY_E_TESTING',
    categoryLabel: 'Software Testing',
    domain: 'Automation Testing',
    classification: 'coding',
    environmentType: 'selenium_automation',
    environmentName: 'Selenium WebDriver Automation Workspace',
    compilerLanguage: 'java',
    supportedLanguages: ['java', 'python'],
    validationStrategy: 'COMPILER_TEST_CASES',
    description: 'Selenium WebDriver API, locators (XPath, CSS), browser automation actions, assertion validations, and automated test reports.',
    workspaceTools: [
      { toolId: 'selenium_runner', toolName: 'Selenium Java/Python Engine', icon: 'PlayCircle', description: 'Automated test suite execution' }
    ]
  },

  // ─────────────────────────────────────────────────────────────────
  // CATEGORY F – BLOCKCHAIN, API AND DATABASE
  // ─────────────────────────────────────────────────────────────────
  {
    courseNumber: 31,
    title: 'Blockchain Development',
    slug: 'blockchain-development',
    category: 'CATEGORY_F_BLOCKCHAIN_API_DB',
    categoryLabel: 'Blockchain, API & Database',
    domain: 'Blockchain',
    classification: 'coding',
    environmentType: 'blockchain_solidity',
    environmentName: 'Solidity & Smart Contract Workspace',
    compilerLanguage: 'javascript',
    supportedLanguages: ['solidity', 'javascript'],
    validationStrategy: 'COMPILER_TEST_CASES',
    description: 'Solidity smart contract editor, gas calculations, local blockchain simulator, transaction blocks, and contract function testing.',
    workspaceTools: [
      { toolId: 'solidity_compiler', toolName: 'Solidity Compiler', icon: 'Box', description: 'Smart contract compiler & tester' }
    ]
  },
  {
    courseNumber: 32,
    title: 'Data Structures & Algorithms (DSA)',
    slug: 'data-structures-algorithms-dsa',
    category: 'CATEGORY_F_BLOCKCHAIN_API_DB',
    categoryLabel: 'Blockchain, API & Database',
    domain: 'Data Structures & Algorithms',
    classification: 'coding',
    environmentType: 'dsa_multilang',
    environmentName: 'Multi-Language Algorithm Arena (C, C++, Java, Python)',
    compilerLanguage: 'java',
    supportedLanguages: ['java', 'python', 'cpp', 'c'],
    validationStrategy: 'COMPILER_TEST_CASES',
    description: 'Algorithmic problem solving across Arrays, Trees, Graphs, DP, Sorting, with high-performance automated test case evaluations.',
    workspaceTools: [
      { toolId: 'multi_compiler', toolName: 'Multi-Language Runner', icon: 'Code', description: 'C, C++, Java, Python execution engine' }
    ]
  },
  {
    courseNumber: 33,
    title: 'API Development & Integration',
    slug: 'api-development-integration',
    category: 'CATEGORY_F_BLOCKCHAIN_API_DB',
    categoryLabel: 'Blockchain, API & Database',
    domain: 'API Engineering',
    classification: 'hybrid',
    environmentType: 'api_tester',
    environmentName: 'Interactive API Request & Integration Workspace',
    compilerLanguage: 'javascript',
    supportedLanguages: ['javascript', 'json'],
    validationStrategy: 'COMPILER_TEST_CASES',
    description: 'HTTP request builder (GET, POST, PUT, DELETE), headers, auth tokens, body payload formatting, response status code validation.',
    workspaceTools: [
      { toolId: 'postman_client', toolName: 'API Request Studio', icon: 'Send', description: 'Headers, Params, Body & Response Viewer' }
    ]
  },
  {
    courseNumber: 34,
    title: 'Microservices Architecture',
    slug: 'microservices-architecture',
    category: 'CATEGORY_F_BLOCKCHAIN_API_DB',
    categoryLabel: 'Blockchain, API & Database',
    domain: 'Microservices',
    classification: 'hybrid',
    environmentType: 'microservices',
    environmentName: 'Microservices Architecture & Gateway Workspace',
    compilerLanguage: 'java',
    supportedLanguages: ['java', 'javascript'],
    validationStrategy: 'COMPILER_TEST_CASES',
    description: 'Service discovery, API Gateway, inter-service HTTP/gRPC communication, resilience patterns, and Dockerized microservices.',
    workspaceTools: [
      { toolId: 'service_mesh', toolName: 'Service Topology Viewer', icon: 'Network', description: 'Microservices routing map' }
    ]
  },
  {
    courseNumber: 35,
    title: 'Database Management (SQL / NoSQL)',
    slug: 'database-management-sql-nosql',
    category: 'CATEGORY_F_BLOCKCHAIN_API_DB',
    categoryLabel: 'Blockchain, API & Database',
    domain: 'Database Systems',
    classification: 'coding',
    environmentType: 'database_sql_nosql',
    environmentName: 'SQL & NoSQL Database Playground',
    compilerLanguage: 'javascript',
    supportedLanguages: ['sql', 'javascript'],
    validationStrategy: 'SQL_DATASET_COMPARE',
    description: 'Relational SQL query editor (MySQL/PostgreSQL), schema designer, NoSQL MongoDB playground, query execution & tabular output verification.',
    workspaceTools: [
      { toolId: 'sql_editor', toolName: 'SQL Query Console', icon: 'Database', description: 'Query runner with table output comparisons' }
    ]
  },

  // ─────────────────────────────────────────────────────────────────
  // CATEGORY G – PROGRAMMING LANGUAGES
  // ─────────────────────────────────────────────────────────────────
  {
    courseNumber: 36,
    title: 'C Language',
    slug: 'c-language',
    category: 'CATEGORY_G_LANGUAGES',
    categoryLabel: 'Programming Languages',
    domain: 'C Language',
    classification: 'coding',
    environmentType: 'c_compiler',
    environmentName: 'C Language GCC Compiler Workspace',
    compilerLanguage: 'c',
    supportedLanguages: ['c'],
    validationStrategy: 'COMPILER_TEST_CASES',
    description: 'Pointers, memory allocation (malloc/free), structs, standard I/O, compilation via GCC with automated test case evaluation.',
    workspaceTools: [
      { toolId: 'gcc_compiler', toolName: 'GCC C Compiler', icon: 'Terminal', description: 'Native C compile & run' }
    ]
  },
  {
    courseNumber: 37,
    title: 'C++',
    slug: 'cpp-programming',
    category: 'CATEGORY_G_LANGUAGES',
    categoryLabel: 'Programming Languages',
    domain: 'C++',
    classification: 'coding',
    environmentType: 'cpp_compiler',
    environmentName: 'C++ G++ Compiler Workspace',
    compilerLanguage: 'cpp',
    supportedLanguages: ['cpp'],
    validationStrategy: 'COMPILER_TEST_CASES',
    description: 'OOP, classes, templates, STL (vector, map, set), memory management, compilation via G++ with automated test cases.',
    workspaceTools: [
      { toolId: 'gpp_compiler', toolName: 'G++ Compiler (C++17)', icon: 'Terminal', description: 'Native C++ compile & run' }
    ]
  },
  {
    courseNumber: 38,
    title: 'Java',
    slug: 'java-programming',
    category: 'CATEGORY_G_LANGUAGES',
    categoryLabel: 'Programming Languages',
    domain: 'Java',
    classification: 'coding',
    environmentType: 'java_compiler',
    environmentName: 'Java JDK 22 Compiler Workspace',
    compilerLanguage: 'java',
    supportedLanguages: ['java'],
    validationStrategy: 'COMPILER_TEST_CASES',
    description: 'Core Java, OOP principles, Collections Framework, Streams API, multi-threading, compiled with Java JDK 22.',
    workspaceTools: [
      { toolId: 'jdk_runner', toolName: 'Java JDK 22', icon: 'Coffee', description: 'Java compilation and execution engine' }
    ]
  },
  {
    courseNumber: 39,
    title: 'Python',
    slug: 'python-programming',
    category: 'CATEGORY_G_LANGUAGES',
    categoryLabel: 'Programming Languages',
    domain: 'Python',
    classification: 'coding',
    environmentType: 'python_compiler',
    environmentName: 'Python 3 Interpreter Workspace',
    compilerLanguage: 'python',
    supportedLanguages: ['python'],
    validationStrategy: 'COMPILER_TEST_CASES',
    description: 'Python 3.11 syntax, data structures (lists, dicts, sets, tuples), OOP, decorators, generators, and automated test cases.',
    workspaceTools: [
      { toolId: 'python3_engine', toolName: 'Python 3.11 Interpreter', icon: 'Code', description: 'Standard Python 3 runner' }
    ]
  },

  // ─────────────────────────────────────────────────────────────────
  // CATEGORY H – CAD AND MECHANICAL DESIGN
  // ─────────────────────────────────────────────────────────────────
  {
    courseNumber: 40,
    title: 'Catia',
    slug: 'catia-mechanical-cad',
    category: 'CATEGORY_H_CAD_MECHANICAL',
    categoryLabel: 'CAD and Mechanical Design',
    domain: 'Catia CAD',
    classification: 'non-coding',
    environmentType: 'cad_catia',
    environmentName: 'Interactive Browser-Based 3D CAD Workspace (Catia)',
    compilerLanguage: null,
    supportedLanguages: [],
    validationStrategy: 'CAD_GEOMETRY_EVAL',
    description: 'Sketching, Line, Circle, Rectangle, Dimensions, Constraints, Extrude, Revolve, Fillet, Chamfer, Part modeling, 3D orbit/pan/zoom preview.',
    workspaceTools: [
      { toolId: 'sketcher', toolName: '2D Parametric Sketcher', icon: 'Edit3', description: 'Lines, circles, rectangles & dimensions' },
      { toolId: 'solid_ops', toolName: 'Solid Features', icon: 'Box', description: 'Extrude, Revolve, Fillet & Chamfer' },
      { toolId: 'viewport_3d', toolName: '3D Viewport', icon: 'Eye', description: 'Real-time 3D rotation, pan & zoom' }
    ]
  },
  {
    courseNumber: 41,
    title: 'SolidWorks',
    slug: 'solidworks-mechanical-cad',
    category: 'CATEGORY_H_CAD_MECHANICAL',
    categoryLabel: 'CAD and Mechanical Design',
    domain: 'SolidWorks CAD',
    classification: 'non-coding',
    environmentType: 'cad_solidworks',
    environmentName: 'Interactive SolidWorks-Inspired 3D Modeling Workspace',
    compilerLanguage: null,
    supportedLanguages: [],
    validationStrategy: 'CAD_GEOMETRY_EVAL',
    description: 'Sketch tools, part modeling, Boss-Extrude, Cut-Extrude, Revolve, Fillet, Chamfer, geometric constraints, 3D interactive viewport.',
    workspaceTools: [
      { toolId: 'sw_sketch', toolName: 'Feature Sketcher', icon: 'Edit3', description: 'Sketch tools & geometric constraints' },
      { toolId: 'sw_features', toolName: '3D Feature Tree', icon: 'Layers', description: 'Extrude, revolve, chamfer & fillet' },
      { toolId: 'sw_viewport', toolName: '3D CAD Canvas', icon: 'Box', description: '3D preview with dynamic lighting & orbit' }
    ]
  },
  {
    courseNumber: 42,
    title: 'Creo',
    slug: 'creo-parametric-cad',
    category: 'CATEGORY_H_CAD_MECHANICAL',
    categoryLabel: 'CAD and Mechanical Design',
    domain: 'Creo CAD',
    classification: 'non-coding',
    environmentType: 'cad_creo',
    environmentName: 'Interactive Creo-Inspired Parametric Modeling Workspace',
    compilerLanguage: null,
    supportedLanguages: [],
    validationStrategy: 'CAD_GEOMETRY_EVAL',
    description: 'Parametric sketching, dimension constraints, Extrude, Revolve, datum planes, parametric part modeling, and real-time 3D preview.',
    workspaceTools: [
      { toolId: 'creo_sketch', toolName: 'Parametric Sketcher', icon: 'Edit3', description: 'Dimension-driven 2D entities' },
      { toolId: 'creo_modeler', toolName: 'Part Modeling Engine', icon: 'Box', description: 'Parametric solid feature engine' },
      { toolId: 'creo_view', toolName: '3D Orbit Viewer', icon: 'Eye', description: '3D rotation, wireframe & shaded modes' }
    ]
  }
];

module.exports = {
  MASTER_COURSES
};
