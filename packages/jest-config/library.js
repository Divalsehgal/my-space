/**
 * Jest preset for workspace libraries (packages/*) that aren't Next.js apps:
 * TypeScript/TSX via ts-jest, jsdom, and CSS Modules mapped to their class names.
 */
const { coverageReporters } = require('./coverage.js');

module.exports = {
  coverageReporters,
  setupFilesAfterEnv: ['@dival-sehgal/jest-config/setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  transform: {
    // .js too: the shared setup file is written as an ES module.
    '^.+\\.(ts|tsx|js)$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
          module: 'commonjs',
          esModuleInterop: true,
          isolatedModules: true,
          allowJs: true,
          types: ['jest', '@testing-library/jest-dom', 'node'],
        },
      },
    ],
  },
  moduleNameMapper: {
    '\\.(css|scss)$': '@dival-sehgal/jest-config/style-mock.js',
  },
};
