import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: ['esm'],
  platform: 'node',
  target: 'node20',
  outDir: 'dist',
  clean: true,
  banner: { js: '#!/usr/bin/env node' },
  // Build tooling resolves at runtime from the CLI's own node_modules; the
  // engine plugins are resolved from the *game's* node_modules and imported
  // dynamically, so nothing here needs bundling.
  external: [
    'vite',
    '@vitejs/plugin-react',
    '@tailwindcss/vite',
    'vite-plugin-singlefile',
    'lightningcss',
    '@sim/engine',
  ],
});
