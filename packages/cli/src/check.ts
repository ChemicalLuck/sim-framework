import fs from "node:fs";
import path from "node:path";

import { createServer } from "vite";

import { buildConfig } from "./config";

interface ValidationIssue {
  section: string;
  source: string;
  message: string;
}

interface ReferenceContributions {
  idSources: unknown[];
  referenceProviders: unknown[];
  nodeRefExtractors: unknown[];
  nodeRefRewriters: unknown[];
  referenceRewriters: unknown[];
}

interface ReferencesModule extends ReferenceContributions {
  /** Data files the feature manifests declare required (not `optional`). */
  requiredDataFiles: string[];
}

interface ValidationModule {
  validateReferences: (
    dataByFile: Record<string, unknown>,
    contributions: ReferenceContributions,
  ) => ValidationIssue[];
  missingRequiredFiles: (
    contributions: ReferenceContributions,
    dataByFile: Record<string, unknown>,
    required: readonly string[],
  ) => string[];
}

function loadDataDir(dataDir: string): Record<string, unknown> {
  const dataByFile: Record<string, unknown> = {};
  if (!fs.existsSync(dataDir)) return dataByFile;
  for (const entry of fs.readdirSync(dataDir)) {
    if (!entry.endsWith(".json")) continue;
    const name = entry.replace(/\.json$/, "");
    const raw = fs.readFileSync(path.join(dataDir, entry), "utf-8");
    try {
      dataByFile[name] = JSON.parse(raw);
    } catch (err) {
      throw new Error(`Invalid JSON in ${entry}: ${String(err)}`);
    }
  }
  return dataByFile;
}

/**
 * Validate a game's content headlessly. Spins up an in-process Vite server (no
 * port) purely to evaluate the plugin-generated `virtual:references` module and
 * the engine's validation library, then runs the reference-integrity check over
 * the game's data JSON. Returns a process exit code.
 */
export async function runCheck(cwd: string): Promise<number> {
  const base = await buildConfig({ cwd, build: false, mode: "production" });
  const server = await createServer({
    ...base,
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true },
  });

  try {
    const refs = (await server.ssrLoadModule(
      "virtual:references",
    )) as ReferencesModule;
    const validation = (await server.ssrLoadModule(
      "@chemicalluck/sim-engine/lib/validation",
    )) as ValidationModule;

    const contributions: ReferenceContributions = {
      idSources: refs.idSources,
      referenceProviders: refs.referenceProviders,
      nodeRefExtractors: refs.nodeRefExtractors,
      nodeRefRewriters: refs.nodeRefRewriters,
      referenceRewriters: refs.referenceRewriters,
    };

    const dataByFile = loadDataDir(path.join(cwd, "src", "game", "data"));

    // Only required files are reported: an absent optional one (e.g. a game
    // without weather.json) is legitimately not there.
    const missing = validation.missingRequiredFiles(
      contributions,
      dataByFile,
      refs.requiredDataFiles,
    );
    const issues = validation.validateReferences(dataByFile, contributions);

    if (missing.length > 0) {
      console.warn(
        `\n⚠  ${String(missing.length)} referenced data file(s) not found (their references can't be validated):`,
      );
      for (const file of missing) console.warn(`   - ${file}.json`);
    }

    if (issues.length > 0) {
      console.error(`\n✗ ${String(issues.length)} content issue(s):\n`);
      for (const issue of issues) {
        console.error(`   ${issue.source}: ${issue.message}`);
      }
      console.error("");
      return 1;
    }

    console.log("✓ Content OK — no broken references.");
    return 0;
  } finally {
    await server.close();
  }
}
