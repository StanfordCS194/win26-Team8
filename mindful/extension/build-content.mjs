import { build } from 'esbuild';
import { readFileSync, renameSync, existsSync, unlinkSync } from 'fs';
import { join } from 'path';

const envVars = { NODE_ENV: 'production' };

try {
  const envFile = readFileSync('.env', 'utf-8');
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
} catch {
  // .env optional for content script
}

const define = {
  'process.env': JSON.stringify(envVars),
};

const outDir = 'extension';
const outFile = join(outDir, 'content.js');
const tmpFile = join(outDir, 'content.tmp.js');

await build({
  entryPoints: ['extension/src/content.tsx'],
  bundle: true,
  platform: 'browser',
  format: 'iife',
  outfile: tmpFile,
  jsx: 'automatic',
  jsxImportSource: 'react',
  define,
});

if (existsSync(outFile)) {
  unlinkSync(outFile);
}
renameSync(tmpFile, outFile);

console.log('Extension content script built successfully');
