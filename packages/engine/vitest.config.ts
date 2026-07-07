import path from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

import { editorPlugin } from './src/engine/editor/editor-plugin';
import { gamePlugin } from './src/engine/game-plugin';

const dirname = import.meta.dirname;
const fixtureGame = path.resolve(dirname, 'test/fixtures/game');

// The engine consumes itself by package name (@sim/engine/...) internally.
// For unit tests we resolve that to the local source rather than node_modules.
//
// A handful of editor modules (e.g. the preview sandbox store) import the
// generated `virtual:game-*` modules. We run gamePlugin against an empty game
// fixture so those virtual modules resolve from the engine's own feature set —
// no game content required.
export default defineConfig({
  plugins: [
    react(),
    gamePlugin({ gameDir: fixtureGame }),
    editorPlugin({
      dataDir: path.join(fixtureGame, 'data'),
      extensionsDir: path.join(fixtureGame, 'extensions'),
      engineFeaturesDir: path.resolve(dirname, 'src/engine/features'),
      gameStyles: path.join(fixtureGame, 'index.css'),
    }),
  ],
  resolve: {
    alias: {
      '@sim/engine': path.resolve(dirname, 'src/engine'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test-setup.ts'],
    // The narrative preview renders a full loaded game (`virtual:game-setup`),
    // which needs a concrete game's content. It is an integration test and
    // lives with a game (examples/university), not in the engine unit suite.
    exclude: [
      '**/node_modules/**',
      'src/engine/editor/components/preview/narrative-preview.test.tsx',
    ],
  },
});
