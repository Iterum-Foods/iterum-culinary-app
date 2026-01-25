module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    // Code quality
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-unused-vars': 'warn',
    'no-undef': 'error',
    
    // Formatting
    'indent': ['error', 2],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'comma-dangle': ['error', 'never'],
    
    // Best practices
    'eqeqeq': 'error',
    'curly': 'error',
    'no-eval': 'error',
    'no-implied-eval': 'error',
    
    // Iterum-specific rules
    'iterum/no-firebase': 'warn',
    'iterum/use-design-system': 'warn'
  },
  plugins: ['iterum'],
  globals: {
    // Iterum app globals
    'userSystem': 'readonly',
    'projectManager': 'readonly',
    'iterumApp': 'readonly',
    'IterumErrorTracker': 'readonly'
  }
};
