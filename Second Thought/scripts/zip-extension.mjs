#!/usr/bin/env node
/**
 * Zips the mindful/extension folder to public/second-thought-extension.zip
 * so the web app can offer it for download. Run before deploy or after
 * building the extension: npm run build:extension-zip
 */

import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const rootDir = join(__dirname, '..');
const extensionDir = join(rootDir, 'extension');
const publicDir = join(rootDir, 'public');
const outZip = join(publicDir, 'second-thought-extension.zip');
const zipRootName = 'second-thought-extension';

let archiver;
try {
  const mod = await import('archiver');
  archiver = mod.default;
} catch {
  console.error('Run: npm install --save-dev archiver');
  process.exit(1);
}

await mkdir(publicDir, { recursive: true });

const output = createWriteStream(outZip);
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
  console.log('Created public/second-thought-extension.zip');
});
archive.on('error', (err) => {
  throw err;
});
archive.pipe(output);

archive.directory(extensionDir, zipRootName);
await archive.finalize();
