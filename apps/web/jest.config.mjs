import nextJest from 'next/jest.js';
import sharedConfig from '@dival-sehgal/jest-config/next.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const filename = fileURLToPath(import.meta.url);
const currentDir = dirname(filename);

const createJestConfig = nextJest({
  dir: currentDir,
});

const customJestConfig = {
  ...sharedConfig,
  modulePathIgnorePatterns: ['<rootDir>/.next/'],
  moduleNameMapper: {
    ...sharedConfig.moduleNameMapper,
    // react-markdown and its remark/unified dependencies are ESM-only, which
    // Jest's default node_modules transform exclusion can't parse. Stub it
    // out rather than widening the transform allowlist across that whole chain.
    '^react-markdown$': '<rootDir>/src/test-mocks/react-markdown.tsx',
  },
};

export default createJestConfig(customJestConfig);
