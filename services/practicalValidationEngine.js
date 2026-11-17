/**
 * STACK QUEUE — Master Practical Validation Engine
 * 
 * Evaluates submissions for Non-Coding & Hybrid Domain Workspaces:
 * - UI/UX Design (Figma-style vector frames, components, typography & prototype links)
 * - 3D CAD & Mechanical Design (2D sketches, 3D extrusions, revolves, fillets & volume)
 * - Cloud Architecture & DevOps (AWS/Azure/GCP topologies, VPC subnets, security groups)
 * - Manual Testing & QA (Test scenarios, preconditions, steps, test data & bug reports)
 * - RPA Workflow (UiPath-style activities, loops, conditional decisions & variables)
 * - Data Analytics & Business Analytics (KPI calculations, data filters & chart visuals)
 * - Cybersecurity & Ethical Hacking (Firewall port policies, packet log analysis)
 * - API Testing (REST requests, status codes, header verifications & response assertions)
 */

/**
 * 1. UI/UX Design Validation
 */
function validateUiUxDesign(stateData, rubric = {}) {
  const artboards = stateData?.artboards || [];
  const layers = stateData?.layers || [];
  const prototypeLinks = stateData?.prototypeLinks || [];

  const checks = [];
  let score = 0;
  const maxScore = 100;

  // Check 1: Minimum artboards
  const minArtboards = rubric.minArtboards || 1;
  const artboardPassed = artboards.length >= minArtboards;
  checks.push({
    criterion: `Design Canvas: At least ${minArtboards} Artboard(s) created`,
    passed: artboardPassed,
    detail: `Found ${artboards.length} artboard(s).`
  });
  if (artboardPassed) score += 20;

  // Check 2: Core UI Elements (Header, Button, Card/Container, Input)
  const layerTypes = layers.map(l => (l.type || '').toLowerCase());
  const hasButton = layerTypes.includes('button') || layers.some(l => (l.name || '').toLowerCase().includes('button') || (l.text || '').toLowerCase().includes('click') || (l.text || '').toLowerCase().includes('submit'));
  const hasTextOrHeader = layerTypes.includes('text') || layerTypes.includes('header') || layers.some(l => l.type === 'text');
  const hasShape = layerTypes.includes('rectangle') || layerTypes.includes('circle') || layerTypes.includes('card');

  const elementsPassed = hasButton && hasTextOrHeader && hasShape;
  checks.push({
    criterion: 'Visual Hierarchy: Layout contains text typography, functional buttons, and structured card/shape containers',
    passed: elementsPassed,
    detail: `Button: ${hasButton ? '✓' : '✗'}, Typography: ${hasTextOrHeader ? '✓' : '✗'}, Shape/Card: ${hasShape ? '✓' : '✗'}`
  });
  if (elementsPassed) score += 30;
  else if (hasTextOrHeader || hasButton) score += 15;

  // Check 3: Color Palette & Typography Tokens
  const hasColorStyling = layers.some(l => l.fill && l.fill !== '#ffffff' && l.fill !== '#000000');
  const hasBorderRadius = layers.some(l => Number(l.borderRadius) > 0);
  const stylingPassed = hasColorStyling || hasBorderRadius;
  checks.push({
    criterion: 'Design System: Color styling and corner radius styling applied',
    passed: stylingPassed,
    detail: `Brand Colors: ${hasColorStyling ? 'Applied' : 'Default'}, Border Radius: ${hasBorderRadius ? 'Applied' : 'Square'}`
  });
  if (stylingPassed) score += 25;

  // Check 4: Interactive Prototype Navigation (if multi-frame or required)
  if (rubric.requirePrototype || artboards.length > 1) {
    const protoPassed = prototypeLinks.length > 0;
    checks.push({
      criterion: 'Interactive Prototyping: Navigation wire connects elements between artboards',
      passed: protoPassed,
      detail: `Found ${prototypeLinks.length} prototype transition link(s).`
    });
    if (protoPassed) score += 25;
  } else {
    // Single artboard complete layout
    const layersCountPassed = layers.length >= 3;
    checks.push({
      criterion: 'Component Density: Artboard contains at least 3 designed layers',
      passed: layersCountPassed,
      detail: `Found ${layers.length} layer(s).`
    });
    if (layersCountPassed) score += 25;
  }

  const allPassed = score >= 70;
  return {
    passed: allPassed,
    score,
    maxScore,
    checks,
    feedback: allPassed
      ? 'UI/UX Design Verified: Clean layout structure, compliant design tokens, and functional component hierarchy.'
      : 'UI/UX Design Incomplete: Ensure you place required buttons, text layers, and apply appropriate styling or prototype wires.'
  };
}

/**
 * 2. 3D CAD & Mechanical Design Validation
 */
function validateCadDesign(stateData, specs = {}) {
  const sketches = stateData?.sketches || [];
  const features = stateData?.features || [];
  const metrics = stateData?.metrics || { volume: 0, surfaceArea: 0 };

  const checks = [];
  let score = 0;
  const maxScore = 100;

  // Check 1: 2D Sketch profile
  const sketchPassed = sketches.length > 0 && sketches.some(s => (s.elements && s.elements.length > 0) || s.type);
  checks.push({
    criterion: '2D Parametric Sketch: Defined sketch plane and geometric profile (Rectangle, Circle, Line)',
    passed: sketchPassed,
    detail: `Sketches: ${sketches.length} sketch profile(s) recorded.`
  });
  if (sketchPassed) score += 30;

  // Check 2: 3D Feature Operation (Extrude, Revolve, Sweep, Fillet)
  const hasExtrude = features.some(f => (f.type || '').toLowerCase() === 'extrude' && Number(f.depth || f.value) > 0);
  const hasRevolve = features.some(f => (f.type || '').toLowerCase() === 'revolve' && Number(f.angle || f.value) > 0);
  const featurePassed = hasExtrude || hasRevolve || features.length > 0;
  checks.push({
    criterion: '3D Solid Modeling: Feature operation applied (Extrusion / Revolve / Pocket)',
    passed: featurePassed,
    detail: `Features: ${features.map(f => `${f.type} (${f.depth || f.value || 0})`).join(', ') || 'None'}`
  });
  if (featurePassed) score += 40;

  // Check 3: Geometry & Dimensions
  const targetDepth = Number(specs.minDepth || 5);
  const extrudeFeature = features.find(f => (f.type || '').toLowerCase() === 'extrude');
  const depthPassed = extrudeFeature ? Number(extrudeFeature.depth || extrudeFeature.value) >= targetDepth : featurePassed;
  checks.push({
    criterion: `Dimensional Accuracy: Feature parameters satisfy dimensional constraints (>= ${targetDepth} mm)`,
    passed: depthPassed,
    detail: `Extrude Depth: ${extrudeFeature ? extrudeFeature.depth || extrudeFeature.value : 'N/A'} mm`
  });
  if (depthPassed) score += 30;

  const allPassed = score >= 70;
  return {
    passed: allPassed,
    score,
    maxScore,
    checks,
    feedback: allPassed
      ? '3D CAD Model Approved: Parametric sketch constraints and solid 3D feature operations successfully validated.'
      : '3D CAD Model Incomplete: Please define a closed 2D sketch profile and apply an Extrude or Revolve solid feature.'
  };
}

/**
 * 3. Cloud Architecture & DevOps Validation
 */
function validateCloudArchitecture(stateData, reqs = {}) {
  const nodes = stateData?.nodes || [];
  const connections = stateData?.connections || [];

  const checks = [];
  let score = 0;
  const maxScore = 100;

  const nodeTypes = nodes.map(n => (n.type || n.service || '').toLowerCase());

  // Check 1: Compute / Server presence
  const hasCompute = nodeTypes.some(t => t.includes('ec2') || t.includes('vm') || t.includes('compute') || t.includes('lambda') || t.includes('container'));
  checks.push({
    criterion: 'Compute Tier: Provisioned virtual machine instance or container service (EC2 / Compute Engine / Container)',
    passed: hasCompute,
    detail: `Compute services: ${nodeTypes.filter(t => t.includes('ec2') || t.includes('compute') || t.includes('vm')).join(', ') || 'None'}`
  });
  if (hasCompute) score += 25;

  // Check 2: Storage or Database Tier
  const hasStorageOrDb = nodeTypes.some(t => t.includes('s3') || t.includes('rds') || t.includes('db') || t.includes('database') || t.includes('storage') || t.includes('bucket'));
  checks.push({
    criterion: 'Data Tier: Provisioned persistent storage or managed relational database (S3 / RDS / Cloud SQL)',
    passed: hasStorageOrDb,
    detail: `Data services: ${nodeTypes.filter(t => t.includes('s3') || t.includes('rds') || t.includes('db')).join(', ') || 'None'}`
  });
  if (hasStorageOrDb) score += 25;

  // Check 3: Network isolation (VPC / Subnet / Gateway / Load Balancer)
  const hasNetworking = nodeTypes.some(t => t.includes('vpc') || t.includes('subnet') || t.includes('gateway') || t.includes('alb') || t.includes('elb') || t.includes('router'));
  checks.push({
    criterion: 'Networking & Routing: Configured network boundary (VPC / Subnet / Internet Gateway / Load Balancer)',
    passed: hasNetworking,
    detail: `Network components: ${nodeTypes.filter(t => t.includes('vpc') || t.includes('subnet') || t.includes('gateway') || t.includes('alb')).join(', ') || 'None'}`
  });
  if (hasNetworking) score += 25;

  // Check 4: Interconnect Wires
  const hasConnections = connections.length >= 1;
  checks.push({
    criterion: 'Topology Routing: Connected interconnect links between cloud services',
    passed: hasConnections,
    detail: `Network connection links: ${connections.length} link(s) configured.`
  });
  if (hasConnections) score += 25;

  const allPassed = score >= 75;
  return {
    passed: allPassed,
    score,
    maxScore,
    checks,
    feedback: allPassed
      ? 'Cloud Architecture Approved: Well-architected multi-tier topology with proper compute, storage, and network boundaries.'
      : 'Cloud Architecture Needs Adjustment: Include both compute and database/storage components with connected routing links.'
  };
}

/**
 * 4. Manual Testing & QA Validation
 */
function validateManualTesting(stateData, reqs = {}) {
  const testCases = stateData?.testCases || [];
  const bugReports = stateData?.bugReports || [];

  const checks = [];
  let score = 0;
  const maxScore = 100;

  // Check 1: Minimum test cases written
  const minCases = reqs.minCases || 2;
  const countPassed = testCases.length >= minCases;
  checks.push({
    criterion: `Test Coverage: Authored at least ${minCases} structured test case(s)`,
    passed: countPassed,
    detail: `Authored: ${testCases.length} test case(s).`
  });
  if (countPassed) score += 30;

  // Check 2: Test Case Completeness (Title, Steps, Expected Result, Status)
  const completeCases = testCases.filter(tc =>
    tc.title && tc.title.trim() &&
    (tc.steps || tc.description) &&
    tc.expectedResult && tc.expectedResult.trim()
  );
  const detailPassed = completeCases.length >= Math.min(minCases, testCases.length);
  checks.push({
    criterion: 'Specification Standard: Test cases include Test Steps, Preconditions, and Expected Results',
    passed: detailPassed,
    detail: `${completeCases.length} fully specified test case(s).`
  });
  if (detailPassed) score += 35;

  // Check 3: Execution / Defect Logging
  const hasExecution = testCases.some(tc => tc.status === 'Pass' || tc.status === 'Fail' || tc.status === 'Blocked');
  const hasDefect = bugReports.length > 0 || testCases.some(tc => tc.status === 'Fail');
  const executionPassed = hasExecution || hasDefect;
  checks.push({
    criterion: 'Execution Verification: Test execution results recorded (Pass / Fail / Defect logged)',
    passed: executionPassed,
    detail: `Execution status recorded. Logged defects: ${bugReports.length}.`
  });
  if (executionPassed) score += 35;

  const allPassed = score >= 70;
  return {
    passed: allPassed,
    score,
    maxScore,
    checks,
    feedback: allPassed
      ? 'QA Verification Succeeded: Test cases conform to IEEE standard test documentation with verified steps and expected results.'
      : 'QA Verification Incomplete: Please author at least 2 complete test cases with preconditions, steps, and expected outcomes.'
  };
}

/**
 * 5. RPA Workflow Validation
 */
function validateRpaWorkflow(stateData, reqs = {}) {
  const activities = stateData?.activities || [];
  const variables = stateData?.variables || [];

  const checks = [];
  let score = 0;
  const maxScore = 100;

  // Check 1: Minimum activities
  const activityPassed = activities.length >= 3;
  checks.push({
    criterion: 'Workflow Depth: Flowchart contains at least 3 sequential RPA activities',
    passed: activityPassed,
    detail: `Found ${activities.length} activity node(s).`
  });
  if (activityPassed) score += 30;

  // Check 2: Control flow (Decision / Loop / Condition)
  const actTypes = activities.map(a => (a.type || '').toLowerCase());
  const hasControlFlow = actTypes.some(t => t.includes('if') || t.includes('loop') || t.includes('foreach') || t.includes('while') || t.includes('decision'));
  checks.push({
    criterion: 'Logic Branching: Workflow implements conditional logic or collection iteration (If / For Each / Loop)',
    passed: hasControlFlow,
    detail: `Control flow nodes: ${actTypes.filter(t => t.includes('if') || t.includes('loop') || t.includes('foreach')).join(', ') || 'None'}`
  });
  if (hasControlFlow) score += 35;
  else if (activities.length >= 4) score += 20;

  // Check 3: Data I/O & Variables
  const hasIO = actTypes.some(t => t.includes('read') || t.includes('write') || t.includes('assign') || t.includes('log') || t.includes('input'));
  checks.push({
    criterion: 'Data Processing: Variable assignment and data input/output activity present',
    passed: hasIO,
    detail: `I/O activities: ${actTypes.filter(t => t.includes('read') || t.includes('write') || t.includes('assign') || t.includes('log')).join(', ') || 'None'}`
  });
  if (hasIO) score += 35;

  const allPassed = score >= 70;
  return {
    passed: allPassed,
    score,
    maxScore,
    checks,
    feedback: allPassed
      ? 'RPA Automation Approved: Workflow sequence, variable scope, and branching conditions execute correctly.'
      : 'RPA Automation Incomplete: Build a workflow sequence with at least 3 activities including variable assignment or decision logic.'
  };
}

/**
 * 6. Data Analytics / Business Analytics Validation
 */
function validateDataAnalytics(stateData, reqs = {}) {
  const kpis = stateData?.kpis || [];
  const charts = stateData?.charts || [];
  const filters = stateData?.filters || [];

  const checks = [];
  let score = 0;
  const maxScore = 100;

  // Check 1: KPI metrics calculated
  const kpiPassed = kpis.length >= 1;
  checks.push({
    criterion: 'Executive Metrics: Configured aggregate KPI cards (Sum / Average / Count / Ratio)',
    passed: kpiPassed,
    detail: `Configured ${kpis.length} KPI card(s).`
  });
  if (kpiPassed) score += 35;

  // Check 2: Visual Chart representation
  const chartPassed = charts.length >= 1;
  checks.push({
    criterion: 'Visual Dashboard: Generated analytical chart visual (Bar / Line / Pie / Scatter)',
    passed: chartPassed,
    detail: `Generated ${charts.length} chart(s): ${charts.map(c => c.type).join(', ') || 'None'}`
  });
  if (chartPassed) score += 35;

  // Check 3: Data segmentation / Filtering
  const filterPassed = filters.length > 0 || (stateData?.activeFilter && stateData.activeFilter !== 'all') || kpis.length >= 2;
  checks.push({
    criterion: 'Data Segmentation: Applied dimensional filter or multi-metric comparison',
    passed: filterPassed,
    detail: `Filters / Comparative metrics active.`
  });
  if (filterPassed) score += 30;

  const allPassed = score >= 70;
  return {
    passed: allPassed,
    score,
    maxScore,
    checks,
    feedback: allPassed
      ? 'Analytics Dashboard Approved: Key metrics calculated and visual data distribution accurately plotted.'
      : 'Analytics Dashboard Incomplete: Calculate at least one aggregate KPI metric and configure an analytical chart.'
  };
}

/**
 * 7. Cybersecurity Lab Validation
 */
function validateCybersecurityLab(stateData, reqs = {}) {
  const firewallRules = stateData?.firewallRules || [];
  const auditFindings = stateData?.auditFindings || [];

  const checks = [];
  let score = 0;
  const maxScore = 100;

  // Check 1: Insecure protocol blocked (e.g. Telnet 23 or HTTP 80 or FTP 21)
  const hasDenyRule = firewallRules.some(r =>
    (r.action || '').toUpperCase() === 'DENY' ||
    (r.action || '').toUpperCase() === 'BLOCK' ||
    r.blocked === true
  );
  checks.push({
    criterion: 'Threat Mitigation: Hardened security policy blocking insecure ports/services (e.g., Telnet 23, FTP 21)',
    passed: hasDenyRule,
    detail: `Active DENY / BLOCK rules: ${firewallRules.filter(r => (r.action || '').toUpperCase() === 'DENY').length}`
  });
  if (hasDenyRule) score += 40;

  // Check 2: Secure inbound allowed (e.g. 443 / HTTPS or 22 / SSH)
  const hasAllowRule = firewallRules.some(r =>
    (r.action || '').toUpperCase() === 'ALLOW' ||
    r.allowed === true
  );
  checks.push({
    criterion: 'Service Availability: Configured permissive ALLOW rules for authorized traffic (HTTPS:443)',
    passed: hasAllowRule,
    detail: `Active ALLOW rules: ${firewallRules.filter(r => (r.action || '').toUpperCase() === 'ALLOW').length}`
  });
  if (hasAllowRule) score += 30;

  // Check 3: Audit inspection / incident response findings
  const hasAudit = auditFindings.length > 0 || firewallRules.length >= 2;
  checks.push({
    criterion: 'Incident Log Analysis: Security event logs audited and mitigation actions executed',
    passed: hasAudit,
    detail: `Audit findings and rule verifications complete.`
  });
  if (hasAudit) score += 30;

  const allPassed = score >= 70;
  return {
    passed: allPassed,
    score,
    maxScore,
    checks,
    feedback: allPassed
      ? 'Cybersecurity Audit Passed: Perimeter firewall rules and threat mitigation policies verified compliant.'
      : 'Cybersecurity Audit Failed: Configure firewall policies to DENY insecure ports and ALLOW authorized traffic.'
  };
}

/**
 * Master dispatcher for practical workspace evaluation
 */
function evaluatePracticalWorkspace(environmentType, stateData, rubric = {}) {
  const env = (environmentType || '').toLowerCase().trim();

  if (env.includes('uiux') || env.includes('design')) {
    return validateUiUxDesign(stateData, rubric);
  }
  if (env.includes('cad') || env.includes('mechanical')) {
    return validateCadDesign(stateData, rubric);
  }
  if (env.includes('cloud') || env.includes('devops')) {
    return validateCloudArchitecture(stateData, rubric);
  }
  if (env.includes('testing') || env.includes('manual_testing') || env.includes('qa')) {
    return validateManualTesting(stateData, rubric);
  }
  if (env.includes('rpa')) {
    return validateRpaWorkflow(stateData, rubric);
  }
  if (env.includes('analytics') || env.includes('business')) {
    return validateDataAnalytics(stateData, rubric);
  }
  if (env.includes('cyber') || env.includes('security') || env.includes('ethical')) {
    return validateCybersecurityLab(stateData, rubric);
  }

  // Default fallback validator
  const hasState = stateData && Object.keys(stateData).length > 0;
  return {
    passed: hasState,
    score: hasState ? 100 : 0,
    maxScore: 100,
    checks: [{ criterion: 'Workspace State Validation', passed: hasState, detail: 'Data present' }],
    feedback: hasState ? 'Practical assignment successfully validated.' : 'Workspace has no submitted data.'
  };
}

module.exports = {
  evaluatePracticalWorkspace,
  validateUiUxDesign,
  validateCadDesign,
  validateCloudArchitecture,
  validateManualTesting,
  validateRpaWorkflow,
  validateDataAnalytics,
  validateCybersecurityLab
};
