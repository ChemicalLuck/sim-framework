import { defineConfig } from 'tsup';

// Only the engine's *Node-side tooling* is compiled to JS: the two Vite
// plugins the `sim` CLI imports at runtime. The browser runtime (index.tsx,
// features, components, …) ships as source and is transpiled by the game's
// own Vite process via the package `exports` map.
export default defineConfig({
  entry: {
    'game-plugin': 'src/engine/game-plugin.ts',
    'editor/editor-plugin': 'src/engine/editor/editor-plugin.ts',
  },
  format: ['esm'],
  dts: true,
  platform: 'node',
  target: 'node20',
  outDir: 'dist',
  clean: true,
  external: ['vite'],
});
