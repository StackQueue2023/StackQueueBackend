/**
 * Shared Domain & Category Constants (Server)
 * Single Source of Truth for domain and category options across the platform
 */

const DOMAIN_CATEGORIES = [
  'Enterprise Software',
  'Artificial Intelligence',
  'Modern Web Engineering',
  'Interview Preparation',
  'Cloud Architecture',
  'Security Engineering',
  'Cross-Platform Mobile',
  'Data Architecture'
];

const DOMAIN_FILTER_OPTIONS = ['All', ...DOMAIN_CATEGORIES];

const DEFAULT_DOMAIN_CATEGORY = 'Enterprise Software';

const CATEGORY_COMPATIBILITY_MAP = {
  'Software Development': 'Enterprise Software',
  'Data Science & AI': 'Artificial Intelligence',
  'Web Engineering': 'Modern Web Engineering',
  'Web Development': 'Modern Web Engineering',
  'Cloud & DevOps': 'Cloud Architecture',
  'Cybersecurity': 'Security Engineering',
  'Mobile Development': 'Cross-Platform Mobile',
  'Data & Analytics': 'Data Architecture'
};

const normalizeCategory = (category) => {
  if (!category) return DEFAULT_DOMAIN_CATEGORY;
  if (CATEGORY_COMPATIBILITY_MAP[category]) {
    return CATEGORY_COMPATIBILITY_MAP[category];
  }
  return category;
};

module.exports = {
  DOMAIN_CATEGORIES,
  DOMAIN_FILTER_OPTIONS,
  DEFAULT_DOMAIN_CATEGORY,
  CATEGORY_COMPATIBILITY_MAP,
  normalizeCategory
};
