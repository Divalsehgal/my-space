module.exports = {
  setupFilesAfterEnv: ['@dival-sehgal/jest-config/setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
