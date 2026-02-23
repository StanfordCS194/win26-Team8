import { build } from 'esbuild';
import { readFileSync } from 'fs';

// Load .env file and extract EXPO_PUBLIC_ variables
const envFile = readFileSync('.env', 'utf-8');
const define = {
  'process.env.NODE_ENV': '"production"',
};

for (const line of envFile.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIndex = trimmed.indexOf('=');
  if (eqIndex === -1) continue;
  const key = trimmed.slice(0, eqIndex);
  const value = trimmed.slice(eqIndex + 1);
  if (key.startsWith('EXPO_PUBLIC_')) {
    define[`process.env.${key}`] = JSON.stringify(value);
  }
}

await build({
  entryPoints: ['extension/src/popup.tsx'],
  bundle: true,
  platform: 'browser',
  format: 'iife',
  outfile: 'extension/popup.js',
  jsx: 'automatic',
  jsxImportSource: 'react',
  define,
});

console.log('Extension popup built successfully');
