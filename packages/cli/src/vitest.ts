import fs from "node:fs";
import path from "node:path";

import type { InlineConfig } from "vite";

import { buildConfig } from "./config";

/** Vitest's `test` options; typed loosely so the CLI needn't depend on vitest. */
export type SimTestOptions = Record<string, unknown>;

export interface SimVitestConfig extends InlineConfig {
  test: SimTestOptions;
}

/**
 * Whether `id` is installed where Vite would find it from `cwd`: a
 * `node_modules/<id>` in `cwd` or an ancestor. Unlike `require.resolve`, this
 * ignores `NODE_PATH`, which pnpm's bin shims point at its hoisted store.
 */
function resolvesFrom(cwd: string, id: string): boolean {
  for (let dir = cwd; ; dir = path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, "node_modules", id, "package.json"))) {
      return true;
    }
    if (path.dirname(dir) === dir) return false;
  }
}

/**
 * The Vite config `sim dev` uses (engine and `~` aliases, `virtual:*` modules,
 * React dedupe) plus test defaults: jsdom, globals, and the jest-dom matchers
 * when `@testing-library/jest-dom` is installed. Use it from a game's
 * `vitest.config.ts`:
 *
 *   import { simVitestConfig } from '@chemicalluck/sim-cli/vitest';
 *   export default simVitestConfig();
 */
export async function simVitestConfig({
  cwd = process.cwd(),
  test = {},
}: { cwd?: string; test?: SimTestOptions } = {}): Promise<SimVitestConfig> {
  const base = await buildConfig({ cwd, build: false, mode: "test" });
  return {
    ...base,
    resolve: {
      ...base.resolve,
      // Tests don't pre-bundle deps, so a deduped package must resolve from the
      // game itself; under strict layouts (pnpm) e.g. react-redux only
      // resolves from the engine.
      dedupe: base.resolve?.dedupe?.filter((id) => resolvesFrom(cwd, id)),
    },
    test: {
      environment: "jsdom",
      globals: true,
      // The engine ships .ts/.tsx source: transform it rather than letting
      // Node load it as an external dependency.
      server: { deps: { inline: [/@chemicalluck\/sim-engine/] } },
      passWithNoTests: true,
      setupFiles: resolvesFrom(cwd, "@testing-library/jest-dom")
        ? ["@testing-library/jest-dom/vitest"]
        : [],
      include: ["src/**/*.{test,spec}.{ts,tsx}"],
      ...test,
    },
  };
}
