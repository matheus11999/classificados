import { build } from 'esbuild';
import { readFileSync } from 'fs';

// Read package.json to get dependencies
const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));
const dependencies = Object.keys(pkg.dependencies || {});

build({
  entryPoints: ['server/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  outdir: 'dist',
  external: [
    ...dependencies,
    'vite',
    '@replit/vite-plugin-cartographer',
    '@replit/vite-plugin-runtime-error-modal',
  ],
  minify: false,
  sourcemap: true,
}).catch(() => process.exit(1));