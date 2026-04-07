# NPM Publishing Guide

This guide outlines the steps to publish the `@divalsehgal` packages to the NPM registry.

## Prerequisites

1.  **NPM Account**: Ensure you have an account on [npmjs.com](https://www.npmjs.com/).
2.  **Login**: Run `npm login` in your terminal to authenticate.
3.  **Organization**: If you want to publish under the `@divalsehgal` scope, ensure you have created this organization on NPM.

## Packages

The following packages are ready for publishing:

- `@divalsehgal/design-tokens`
- `@divalsehgal/fonts`

## Steps to Publish

We have provided a helper script `publish.sh` in the root directory to automate the process.

### 1. Manual Dry Run (Recommended)
Before publishing, run a final dry-run to verify the contents of each package:

```bash
cd packages/design-tokens && npm publish --dry-run
cd ../fonts && npm publish --dry-run
```

### 2. Actual Publish
Run the following commands to publish each package:

```bash
# From the root directory
./publish.sh
```

Alternatively, publish manually:

```bash
cd packages/design-tokens && npm publish --access public
cd ../fonts && npm publish --access public
```

## Maintenance

### Versioning
To update the version of a package, use `npm version`:

```bash
cd packages/<package-name>
npm version patch # or minor, or major
```

### Tree-Shaking Verification
All packages are configured with `sideEffects: false` (except `@divalsehgal/fonts` which allows `.css` side effects). When consuming these packages in a bundler like Webpack or Rollup, ensure that unused code is properly removed.
