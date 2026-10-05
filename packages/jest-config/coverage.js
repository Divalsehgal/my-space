const path = require('node:path');

/**
 * Coverage reporters shared by every workspace. lcov paths are written relative
 * to the monorepo root (e.g. "apps/web/src/…" instead of "src/…") so SonarQube
 * Cloud maps each report to the right files: several workspaces have a `src/`,
 * and workspace-relative paths would be ambiguous from the repo root.
 */
module.exports = {
  coverageReporters: ['text', ['lcov', { projectRoot: path.resolve(__dirname, '../..') }]],
};
