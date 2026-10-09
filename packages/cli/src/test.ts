import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

import { simVitestConfig } from "./vitest";

const require = createRequire(import.meta.url);

interface VitestNode {
  startVitest: (
    mode: "test",
    filters: string[],
    options: Record<string, unknown>,
    viteOverrides: Record<string, unknown>,
  ) => Promise<{ close: () => Promise<void> } | undefined>;
}

/**
 * Run the game's tests with vitest, resolved from the game (so it controls the
 * version), using {@link simVitestConfig}. Runs once unless `--watch` is given;
 * other arguments are test-file filters.
 */
export async function runTests(cwd: string, args: string[]): Promise<number> {
  let vitestPath: string;
  try {
    vitestPath = require.resolve("vitest/node", { paths: [cwd] });
  } catch {
    console.error(
      "sim test needs vitest in your project: npm install -D vitest jsdom",
    );
    return 1;
  }
  const { startVitest } = (await import(
    pathToFileURL(vitestPath).href
  )) as VitestNode;

  const watch = args.includes("--watch");
  const filters = args.filter((a) => !a.startsWith("--"));
  const { test, ...vite } = await simVitestConfig({ cwd });

  const vitest = await startVitest(
    "test",
    filters,
    { ...test, config: false, root: cwd, watch, run: !watch },
    vite,
  );
  if (!watch) await vitest?.close();
  return Number(process.exitCode ?? 0);
}
