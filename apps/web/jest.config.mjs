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
};

export default createJestConfig(customJestConfig);
