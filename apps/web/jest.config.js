const nextJest = require('next/jest');
const sharedConfig = require('@dival-sehgal/jest-config/next');

const createJestConfig = nextJest({
  dir: __dirname,
});

const customJestConfig = {
  ...sharedConfig,
  modulePathIgnorePatterns: ['<rootDir>/.next/'],
};

module.exports = createJestConfig(customJestConfig);
