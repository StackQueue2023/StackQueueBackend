/**
 * CSS Rule Parser and Evaluator Engine
 * Parses CSS text into structured selector-property maps and verifies target conditions
 */
function parseCssDeclarations(cssText) {
  const result = {};
  if (!cssText) return result;

  // Remove comments
  const cleanCss = cssText.replace(/\/\*[\s\S]*?\*\//g, '');

  // Extract rule blocks: selector { declaration }
  const ruleRegex = /([^{]+)\{([^}]+)\}/g;
  let match;

  while ((match = ruleRegex.exec(cleanCss)) !== null) {
    const selector = match[1].trim().toLowerCase();
    const decls = match[2].trim();

    if (!result[selector]) {
      result[selector] = {};
    }

    // Split properties
    const propLines = decls.split(';');
    for (const line of propLines) {
      const parts = line.split(':');
      if (parts.length >= 2) {
        const propName = parts[0].trim().toLowerCase();
        const propVal = parts.slice(1).join(':').trim().toLowerCase();
        result[selector][propName] = propVal;
      }
    }
  }

  return result;
}

/**
 * Validates whether parsed CSS meets the target conditions specified in Challenge.targetCondition
 * targetCondition format:
 * {
 *   ".container": { "display": "flex", "justify-content": "center", "align-items": "center" },
 *   ".box": { "background-color": "blue", "border-radius": "8px" }
 * }
 */
function evaluateCss(cssText, targetCondition) {
  if (!targetCondition || Object.keys(targetCondition).length === 0) {
    return { passed: true, feedback: 'No specific conditions required.' };
  }

  const parsed = parseCssDeclarations(cssText);
  const failures = [];
  const successes = [];

  for (const [selector, expectedProps] of Object.entries(targetCondition)) {
    const normSelector = selector.trim().toLowerCase();
    const matchingRules = parsed[normSelector] || {};

    for (const [prop, expectedValue] of Object.entries(expectedProps)) {
      const actualValue = matchingRules[prop.toLowerCase()];

      if (!actualValue) {
        failures.push(`Selector '${selector}' is missing property '${prop}'.`);
      } else {
        // Compare values, removing quotes and spaces for flexibility
        const cleanActual = actualValue.replace(/['"\s]/g, '');
        const cleanExpected = String(expectedValue).toLowerCase().replace(/['"\s]/g, '');

        if (cleanActual === cleanExpected || cleanActual.includes(cleanExpected)) {
          successes.push(`Selector '${selector}' has '${prop}: ${actualValue}'.`);
        } else {
          failures.push(`For '${selector}', expected '${prop}: ${expectedValue}', got '${prop}: ${actualValue}'.`);
        }
      }
    }
  }

  const passed = failures.length === 0;
  return {
    passed,
    score: passed ? 100 : Math.max(0, Math.round((successes.length / (successes.length + failures.length)) * 100)),
    successes,
    failures,
    feedback: passed
      ? 'Target styling achieved! Great visual alignment.'
      : failures[0] || 'Target criteria not completely satisfied.'
  };
}

module.exports = {
  parseCssDeclarations,
  evaluateCss
};
