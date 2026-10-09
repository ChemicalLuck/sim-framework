import { defineConfig } from 'tsup';

export default defineConfig({
  // `index` is the `sim` binary; `vitest` is the library entry a game's
  // vitest.config.ts imports.
  entry: { index: 'src/index.ts', vitest: 'src/vitest.ts' },
  dts: { entry: { vitest: 'src/vitest.ts' } },
  format: ['esm'],
  platform: 'node',
  target: 'node20',
  outDir: 'dist',
  clean: true,
  banner: { js: '#!/usr/bin/env node' },
  // Build tooling resolves at runtime from the CLI's own node_modules; the
  // engine plugins and vitest are resolved from the *game's* node_modules and
  // imported dynamically, so nothing here needs bundling.
  external: [
    'vite',
    'vitest',
    '@vitejs/plugin-react',
    '@tailwindcss/vite',
    'vite-plugin-singlefile',
    'lightningcss',
    '@chemicalluck/sim-engine',
  ],
});
