import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { gamePlugin } from './game-plugin';

const ENGINE_DIR = import.meta.dirname;

function generateSetup(gameDir: string): string {
  const plugin = gamePlugin({ gameDir, engineDir: ENGINE_DIR });
  const resolveId = plugin.resolveId as (id: string) => string | null;
  const load = plugin.load as (id: string) => string | null;
  const resolved = resolveId('virtual:game-setup');
  if (!resolved) throw new Error('virtual:game-setup did not resolve');
  return load(resolved) ?? '';
}

describe('virtual:game-setup contentSetup bindings', () => {
  let gameDir: string;

  beforeEach(() => {
    gameDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sim-game-'));
    fs.mkdirSync(path.join(gameDir, 'data'));
  });

  afterEach(() => {
    fs.rmSync(gameDir, { recursive: true, force: true });
  });

  it('skips the setup call when its optional content extension is absent', () => {
    const code = generateSetup(gameDir);
    expect(code).not.toContain('configureEncounters');
  });

  it('emits the setup call when the optional content extension is present', () => {
    fs.writeFileSync(path.join(gameDir, 'data', 'encounters.json'), '[]');
    const code = generateSetup(gameDir);
    expect(code).toContain(
      'encounter_configureEncounters(content.extensions.encounters);',
    );
  });
});

describe('virtual:game-setup data imports', () => {
  let gameDir: string;

  beforeEach(() => {
    gameDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sim-game-'));
    fs.mkdirSync(path.join(gameDir, 'data'));
  });

  afterEach(() => {
    fs.rmSync(gameDir, { recursive: true, force: true });
  });

  it('imports a JSON file once when a setup binding and a content extension share it', () => {
    fs.writeFileSync(path.join(gameDir, 'data', 'needs.json'), '{}');
    const code = generateSetup(gameDir);
    const imports = code
      .split('\n')
      .filter((l) => l.startsWith('import needs_needsData from '));
    expect(imports).toHaveLength(1);
    expect(code).toContain('needs_configureNeeds(needs_needsData);');
    expect(code).toContain(
      'needs_configureNeedThresholds(content.extensions.needThresholds);',
    );
  });
});

describe('virtual:game-extensions template-vars slot', () => {
  let gameDir: string;

  beforeEach(() => {
    gameDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sim-game-'));
    fs.mkdirSync(path.join(gameDir, 'data'));
    fs.mkdirSync(path.join(gameDir, 'extensions', 'university'), {
      recursive: true,
    });
  });

  afterEach(() => {
    fs.rmSync(gameDir, { recursive: true, force: true });
  });

  function generateExtensions(): string {
    const plugin = gamePlugin({ gameDir, engineDir: ENGINE_DIR });
    const resolveId = plugin.resolveId as (id: string) => string | null;
    const load = plugin.load as (id: string) => string | null;
    const resolved = resolveId('virtual:game-extensions');
    if (!resolved) throw new Error('virtual:game-extensions did not resolve');
    return load(resolved) ?? '';
  }

  it('exports an empty provider map when no extension supplies one', () => {
    expect(generateExtensions()).toContain('export const templateVarProviders');
  });

  it("keys an extension's template-vars.ts default export by its name", () => {
    const file = path.join(
      gameDir,
      'extensions',
      'university',
      'template-vars.ts',
    );
    fs.writeFileSync(file, 'export default () => ({ term: "autumn" });');
    const code = generateExtensions();
    expect(code).toContain(
      `import universityTemplateVars from ${JSON.stringify(file)};`,
    );
    expect(code).toMatch(
      /export const templateVarProviders = \{\s*"university": universityTemplateVars\s*\};/,
    );
  });
});
