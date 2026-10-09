import fs from 'node:fs';
import path from 'node:path';

import { defineConfig } from 'tsup';

/** Read a sibling workspace package's version (bumped by changesets before publish). */
function versionOf(dir: string): string {
  const pkgPath = path.resolve(import.meta.dirname, '..', dir, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as {
    version: string;
  };
  return `^${pkg.version}`;
}

export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: ['esm'],
  platform: 'node',
  target: 'node20',
  outDir: 'dist',
  clean: true,
  banner: { js: '#!/usr/bin/env node' },
  // Scaffolded games depend on the framework versions released alongside
  // this build of the scaffolder.
  define: {
    __FRAMEWORK_VERSIONS__: JSON.stringify({
      '@chemicalluck/sim-engine': versionOf('engine'),
      '@chemicalluck/sim-cli': versionOf('cli'),
      '@chemicalluck/sim-config': versionOf('config'),
    }),
  },
});
