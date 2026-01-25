module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['@testing-library/jest-dom'],
  testMatch: [
    '**/tests/**/*.js',
    '**/__tests__/**/*.js',
    '**/*.(test|spec).js'
  ],
  collectCoverageFrom: [
    '*.js',
    '!node_modules/**',
    '!coverage/**',
    '!jest.config.js',
    '!venv/**',
    '!app/**',
    '!archive/**'
  ],
  coverageDirectory: 'coverage/frontend',
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true,
  testTimeout: 10000,
  moduleFileExtensions: ['js', 'json'],
  transform: {},
  testPathIgnorePatterns: [
    '/node_modules/',
    '/venv/',
    '/app/',
    '/archive/',
    '/coverage/'
  ],
  collectCoverage: false,
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
}; 