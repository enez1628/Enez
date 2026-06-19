import { cp, mkdir, rm } from 'node:fs/promises';

const filesToCopy = [
  ['index.html', 'dist/index.html'],
  ['src', 'dist/src'],
  ['assets', 'dist/assets'],
  ['manifest.webmanifest', 'dist/manifest.webmanifest'],
  ['service-worker.js', 'dist/service-worker.js']
];

await rm('dist', { force: true, recursive: true });
await mkdir('dist', { recursive: true });

for (const [from, to] of filesToCopy) {
  await cp(from, to, { recursive: true });
}

console.log('Built mobile web assets into dist/');
