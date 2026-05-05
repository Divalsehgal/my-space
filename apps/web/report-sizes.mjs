import fs from 'fs';
import path from 'path';

const nextDir = '.next';
const appBuildManifestPath = path.join(nextDir, 'app-build-manifest.json');
const buildManifestPath = path.join(nextDir, 'build-manifest.json');

function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'kB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

console.log('\n' + 'Route'.padEnd(40) + 'Size'.padEnd(15) + 'First Load JS');
console.log('━'.repeat(70));

const routeSizes = new Map();

// 1. Process App Router Manifest (if exists)
if (fs.existsSync(appBuildManifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(appBuildManifestPath, 'utf8'));
  Object.entries(manifest.pages).forEach(([route, chunks]) => {
    let size = 0;
    chunks.forEach(chunk => {
      const chunkPath = path.join(nextDir, chunk);
      if (fs.existsSync(chunkPath)) {
        size += fs.statSync(chunkPath).size;
      }
    });
    routeSizes.set(route, size);
  });
}

// 2. Process Pages Router Manifest (if exists)
if (fs.existsSync(buildManifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(buildManifestPath, 'utf8'));
  Object.entries(manifest.pages).forEach(([route, chunks]) => {
    if (route === '/_app' || route === '/_error') return;
    let size = 0;
    chunks.forEach(chunk => {
      const chunkPath = path.join(nextDir, chunk);
      if (fs.existsSync(chunkPath)) {
        size += fs.statSync(chunkPath).size;
      }
    });
    // Add shared chunks (main, webpack, etc.)
    manifest.rootMainFiles?.forEach(chunk => {
        const chunkPath = path.join(nextDir, chunk);
        if (fs.existsSync(chunkPath)) {
          size += fs.statSync(chunkPath).size;
        }
    });
    routeSizes.set(route, (routeSizes.get(route) || 0) + size);
  });
}

// 3. Fallback: If no manifest has routes (Next 16 might use different keys)
if (routeSizes.size === 0) {
    // Try to find any manifest that looks like it has routes
    const files = fs.readdirSync(nextDir);
    for (const file of files) {
        if (file.endsWith('manifest.json')) {
            try {
                const data = JSON.parse(fs.readFileSync(path.join(nextDir, file), 'utf8'));
                if (data.pages) {
                    Object.entries(data.pages).forEach(([route, chunks]) => {
                        if (Array.isArray(chunks)) {
                            let size = 0;
                            chunks.forEach(c => {
                                const p = path.join(nextDir, typeof c === 'string' ? c : c.path);
                                if (fs.existsSync(p)) size += fs.statSync(p).size;
                            });
                            routeSizes.set(route, size);
                        }
                    });
                }
            } catch (e) {}
        }
    }
}

// Sort and display
Array.from(routeSizes.entries())
  .sort((a, b) => b[1] - a[1])
  .forEach(([route, size]) => {
    console.log(route.padEnd(40) + formatSize(size).padEnd(15));
  });

if (routeSizes.size === 0) {
    console.log('No routes found. Make sure you have run "yarn build" first.');
}
console.log('━'.repeat(70) + '\n');
