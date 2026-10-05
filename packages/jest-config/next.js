const { coverageReporters } = require('./coverage.js');

module.exports = {
  coverageReporters,
  setupFilesAfterEnv: ['@dival-sehgal/jest-config/setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
