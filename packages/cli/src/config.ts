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
 * Resolve `@chemicalluck/engine` from the *game's* directory (not the CLI's), so a game
 * always builds against the engine version it depends on. The Node-side
 * plugins are compiled JS and imported dynamically.
 */
async function loadEngine(cwd: string): Promise<ResolvedEngine> {
  const enginePkg = require.resolve('@chemicalluck/engine/package.json', {
    paths: [cwd],
  });
  const engineRoot = path.dirname(enginePkg);
  const engineDir = path.join(engineRoot, 'src', 'engine');

  const gamePluginPath = require.resolve('@chemicalluck/engine/game-plugin', {
    paths: [cwd],
  });
  const editorPluginPath = require.resolve('@chemicalluck/engine/editor/editor-plugin', {
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
        '@chemicalluck/engine': engineDir,
        '~': path.join(cwd, 'src'),
        ...(user.alias ?? {}),
      },
    },
    // The engine ships as source; keep it out of dep pre-bundling so Vite
    // transforms its .ts/.tsx through the normal pipeline.
    optimizeDeps: { exclude: ['@chemicalluck/engine'] },
    esbuild: isBuild ? { drop: ['console', 'debugger'] } : undefined,
    build: {
      cssMinify: 'lightningcss',
      rollupOptions: { input: path.join(cwd, 'index.html') },
    },
    ...(user.vite ?? {}),
  };
}
