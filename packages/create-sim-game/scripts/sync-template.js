// Copy templates/starter into this package's ./template on publish, so the
// scaffolder ships with the starter. In the monorepo the scaffolder falls back
// to templates/starter directly, so this only matters for a published package.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const src = path.resolve(here, '..', '..', '..', 'templates', 'starter');
const dest = path.resolve(here, '..', 'template');

fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(src, dest, {
  recursive: true,
  filter: (p) => !p.includes('node_modules') && !p.endsWith('/dist'),
});
console.log(`Synced starter template → ${dest}`);
