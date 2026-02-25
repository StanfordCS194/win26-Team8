import { build } from 'esbuild';
import { readFileSync, renameSync, existsSync, unlinkSync } from 'fs';
import { join } from 'path';

const outDir = 'extension';
const outFile = join(outDir, 'background.js');
const tmpFile = join(outDir, 'background.tmp.js');

await build({
  entryPoints: ['extension/src/background.ts'],
  bundle: true,
  platform: 'browser',
  format: 'iife',
  outfile: tmpFile,
  target: 'es2020',
});

if (existsSync(outFile)) unlinkSync(outFile);
renameSync(tmpFile, outFile);

console.log('Extension background script built successfully');
