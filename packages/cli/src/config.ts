import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import type { InlineConfig, PluginOption } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

const require = createRequire(import.meta.url);

/** Overrides a game may export from an optional `sim.config.{js,mjs}`. */
export interface SimUserConfig {
  /** Extra Vite plugins appended after the engine's. */
  plugins?: PluginOption[];
  /** Extra resolve aliases merged over the defaults. */
  alias?: Record<string, string>;
  /** Extra `gamePlugin` slot specs. */
  extraSlots?: unknown[];
  /** Arbitrary Vite `InlineConfig` fields merged last. */
  vite?: Partial<InlineConfig>;
}

interface ResolvedEngine {
  engineDir: string;
  gamePlugin: (options: Record<string, unknown>) => PluginOption;
  editorPlugin: (options: Record<string, unknown>) => PluginOption;
}

/**
 * Resolve `@chemicalluck/sim-engine` from the *game's* directory (not the CLI's), so a game
 * always builds against the engine version it depends on. The Node-side
 * plugins are compiled JS and imported dynamically.
 */
async function loadEngine(cwd: string): Promise<ResolvedEngine> {
  const enginePkg = require.resolve('@chemicalluck/sim-engine/package.json', {
    paths: [cwd],
  });
  const engineRoot = path.dirname(enginePkg);
  const engineDir = path.join(engineRoot, 'src', 'engine');

  const gamePluginPath = require.resolve('@chemicalluck/sim-engine/game-plugin', {
    paths: [cwd],
  });
  const editorPluginPath = require.resolve('@chemicalluck/sim-engine/editor/editor-plugin', {
    paths: [cwd],
  });

  const gameMod = (await import(pathToFileURL(gamePluginPath).href)) as {
    gamePlugin: ResolvedEngine['gamePlugin'];
  };
  const editorMod = (await import(pathToFileURL(editorPluginPath).href)) as {
    editorPlugin: ResolvedEngine['editorPlugin'];
  };

  return {
    engineDir,
    gamePlugin: gameMod.gamePlugin,
    editorPlugin: editorMod.editorPlugin,
  };
}

async function loadUserConfig(cwd: string): Promise<SimUserConfig> {
  for (const name of ['sim.config.js', 'sim.config.mjs']) {
    const p = path.join(cwd, name);
    if (fs.existsSync(p)) {
      const mod = (await import(pathToFileURL(p).href)) as {
        default?: SimUserConfig;
      } & SimUserConfig;
      return mod.default ?? mod;
    }
  }
  return {};
}

export interface BuildConfigOptions {
  cwd: string;
  /** true for `sim build` / `sim preview`, false for `sim dev`. */
  build: boolean;
  mode: string;
}

/** Assemble the Vite `InlineConfig` for a game, mirroring the reference setup. */
export async function buildConfig({
  cwd,
  build: isBuild,
  mode,
}: BuildConfigOptions): Promise<InlineConfig> {
  const { engineDir, gamePlugin, editorPlugin } = await loadEngine(cwd);
  const user = await loadUserConfig(cwd);
  const gameDir = path.join(cwd, 'src', 'game');

  const userVite = user.vite ?? {};
  const userOptimize = userVite.optimizeDeps ?? {};

  const plugins: PluginOption[] = [
    react(),
    ...(isBuild ? [viteSingleFile({ removeViteModuleLoader: true })] : []),
    tailwindcss(),
    gamePlugin({ gameDir, engineDir, extraSlots: user.extraSlots }),
    editorPlugin({
      dataDir: path.join(gameDir, 'data'),
      extensionsDir: path.join(gameDir, 'extensions'),
      engineFeaturesDir: path.join(engineDir, 'features'),
      editorAppDir: path.join(engineDir, 'editor'),
      gameStyles: path.join(gameDir, 'index.css'),
    }),
    ...(user.plugins ?? []),
  ];

  return {
    root: cwd,
    mode,
    configFile: false,
    plugins,
    resolve: {
      alias: {
        // Resolve the engine to its source directory so Vite does normal
        // file/index resolution (package `exports` wildcards don't probe for
        // directory `index` files) and transforms the .tsx as source.
        '@chemicalluck/sim-engine': engineDir,
        '~': path.join(cwd, 'src'),
        ...(user.alias ?? {}),
      },
      // Force a single copy of these, resolved from the game. Matters when the
      // engine is linked (e.g. `pnpm link` / npm link) for local development:
      // otherwise its React/store would resolve from the linked location and
      // duplicate the game's, breaking hooks and the redux context.
      dedupe: ['react', 'react-dom', 'react-redux'],
    },
    esbuild: isBuild ? { drop: ['console', 'debugger'] } : undefined,
    build: {
      cssMinify: 'lightningcss',
      rollupOptions: { input: path.join(cwd, 'index.html') },
    },
    ...userVite,
    // Merge optimizeDeps last so a game's own `vite.optimizeDeps` extends —
    // rather than replaces — the engine essentials below.
    optimizeDeps: {
      ...userOptimize,
      // The engine is aliased to source and excluded below. Vite's dep scanner
      // does NOT crawl into excluded deps, so none of the engine's transitive
      // node_modules deps get discovered from the app graph — they'd be found
      // lazily at request time, which breaks named/default imports of CJS-only
      // leaves (the importer is already served before Vite learns the dep needs
      // interop → "doesn't provide an export named …"). Point the scanner
      // directly at the engine source so its whole runtime dep graph is
      // pre-bundled up-front with correct interop. Skip the engine's own tests:
      // they import dev-only deps (vitest, @testing-library/react) that games
      // don't install, which would abort the entire scan.
      entries: [
        'index.html',
        path.join(engineDir, '**/*.{ts,tsx}'),
        `!${path.join(engineDir, '**/*.{test,spec}.{ts,tsx}')}`,
        `!${path.join(engineDir, '**/test-utils/**')}`,
        ...(userOptimize.entries ?? []),
      ],
      // The engine ships as source (aliased above), so keep it out of dep
      // pre-bundling and let Vite transform its .ts/.tsx through the normal
      // pipeline.
      exclude: ['@chemicalluck/sim-engine', ...(userOptimize.exclude ?? [])],
      // Belt-and-suspenders for a few known CJS-only deps, in case the scan
      // above misses one (e.g. reached only through a path esbuild can't
      // statically follow). They get served raw otherwise and the browser
      // can't read their exports (hidden in dev-only IIFEs or `exports.default`,
      // which cjs-module-lexer can't statically detect):
      //   • react-redux → useSyncExternalStoreWithSelector (use-sync-external-store)
      //   • redux-persist/lib/storage → default export (redux-persist has no `exports` map)
      //   • redux-persist/integration/react → PersistGate
      //   • cookie / set-cookie-parser → react-router's browser entry imports `parse` from both
      include: [
        'react-redux',
        'redux-persist/lib/storage',
        'redux-persist/integration/react',
        'cookie',
        'set-cookie-parser',
        ...(userOptimize.include ?? []),
      ],
    },
  };
}
