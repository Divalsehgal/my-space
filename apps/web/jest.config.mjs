import nextJest from 'next/jest.js';
import sharedConfig from '@dival-sehgal/jest-config/next.js';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const filename = fileURLToPath(import.meta.url);
const currentDir = dirname(filename);

const createJestConfig = nextJest({
  dir: currentDir,
});

const customJestConfig = {
  ...sharedConfig,
  modulePathIgnorePatterns: ['<rootDir>/.next/'],
  // Playwright end-to-end specs run separately (yarn test:e2e).
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/e2e/'],
  moduleNameMapper: {
    ...sharedConfig.moduleNameMapper,
    // react-markdown and its remark/unified dependencies are ESM-only, which
    // Jest's default node_modules transform exclusion can't parse. Stub it
    // out rather than widening the transform allowlist across that whole chain.
    '^react-markdown$': '<rootDir>/src/test-mocks/react-markdown.tsx',
    // `import "server-only"` guards secret-bearing modules; it's a build-time check only.
    '^server-only$': '<rootDir>/src/test-mocks/server-only.ts',
  },
};

export default createJestConfig(customJestConfig);
