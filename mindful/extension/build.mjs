import { build } from 'esbuild';
import { readFileSync, renameSync } from 'fs';
import { join } from 'path';

// Load .env file and extract EXPO_PUBLIC_ variables
const envFile = readFileSync('.env', 'utf-8');
const envVars = { NODE_ENV: 'production' };

for (const line of envFile.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIndex = trimmed.indexOf('=');
  if (eqIndex === -1) continue;
  const key = trimmed.slice(0, eqIndex);
  const value = trimmed.slice(eqIndex + 1);
  if (key.startsWith('EXPO_PUBLIC_')) {
    envVars[key] = value;
  }
}

const define = {
  'process.env': JSON.stringify(envVars),
};

// Build to a temp file first to avoid Windows "user-mapped section" errors
// when popup.js is open in an editor or another process.
const outDir = 'extension';
const outFile = join(outDir, 'popup.js');
const tmpFile = join(outDir, 'popup.tmp.js');

await build({
  entryPoints: ['extension/src/popup.tsx'],
  bundle: true,
  platform: 'browser',
  format: 'iife',
  outfile: tmpFile,
  jsx: 'automatic',
  jsxImportSource: 'react',
  define,
});

// Replace popup.js with the new bundle (avoids writing to a locked file on Windows).
renameSync(tmpFile, outFile);

console.log('Extension popup built successfully');
