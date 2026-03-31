module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true
  },
  extends: [
    'eslint:recommended',
    'prettier'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    // Code quality (formatting delegated to Prettier)
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-unused-vars': 'warn',
    // Multi-page app: many functions are globals from other script tags
    'no-undef': 'warn',

    // Best practices (warn during legacy cleanup; tighten before major release)
    'eqeqeq': 'warn',
    'curly': 'warn',
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-inner-declarations': 'warn',
    'no-case-declarations': 'warn',
    'no-useless-escape': 'warn',
    'no-dupe-class-members': 'warn'
  },
  globals: {
    // Iterum app globals
    'userSystem': 'readonly',
    'projectManager': 'readonly',
    'iterumApp': 'readonly',
    'IterumErrorTracker': 'readonly'
  }
};
