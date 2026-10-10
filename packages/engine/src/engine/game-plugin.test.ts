// @vitest-environment node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseAst } from 'vite';
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

  it('exposes each template-vars.ts module so the linter can read its declared keys', () => {
    const file = path.join(
      gameDir,
      'extensions',
      'university',
      'template-vars.ts',
    );
    fs.writeFileSync(
      file,
      'export const keys = ["term"];\nexport default () => ({ term: "autumn" });',
    );
    const code = generateExtensions();
    expect(code).toContain(
      `import * as universityTemplateVarsModule from ${JSON.stringify(file)};`,
    );
    expect(code).toMatch(
      /export const templateVarDeclarations = \{\s*"university": universityTemplateVarsModule\s*\};/,
    );
  });
});

describe('virtual:game-setup quests hydration', () => {
  let gameDir: string;

  beforeEach(() => {
    gameDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sim-game-'));
    fs.mkdirSync(path.join(gameDir, 'data'));
  });

  afterEach(() => {
    fs.rmSync(gameDir, { recursive: true, force: true });
  });

  it('hydrates quests.json through the quests hydrator', () => {
    fs.writeFileSync(path.join(gameDir, 'data', 'quests.json'), '[]');
    const code = generateSetup(gameDir);
    expect(code).toContain(
      'key: "quests", data: quests_questsData, hydrate: (data, ctx) => quests_hydrateQuests(data, ctx)',
    );
  });
});

describe('generated identifiers for extension folder names', () => {
  let gameDir: string;

  function writeExt(name: string, file: string, contents: string): void {
    const dir = path.join(gameDir, 'extensions', name);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, file), contents);
  }

  beforeEach(() => {
    gameDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sim-game-'));
    fs.mkdirSync(path.join(gameDir, 'data'));
    // `my-ext` and `2d` are not identifiers; `myExt` clashes with `my-ext`
    // once camel-cased.
    for (const name of ['my-ext', 'myExt', '2d']) {
      writeExt(name, 'slice.ts', 'export default (s = {}) => s;');
      writeExt(name, 'template-vars.ts', 'export default () => ({});');
      writeExt(name, 'conditions.ts', 'export default {};');
      writeExt(name, 'references.ts', 'export const idSources = [];');
    }
    writeExt('my-ext', 'effects.ts', 'export default {};');
    writeExt('my-ext', 'data.ts', 'export const myExtData = {};');
  });

  afterEach(() => {
    fs.rmSync(gameDir, { recursive: true, force: true });
  });

  function load(id: string): string {
    const plugin = gamePlugin({ gameDir, engineDir: ENGINE_DIR });
    const resolveId = plugin.resolveId as (id: string) => string | null;
    const loadHook = plugin.load as (id: string) => string | null;
    const resolved = resolveId(id);
    if (!resolved) throw new Error(`${id} did not resolve`);
    return loadHook(resolved) ?? '';
  }

  /** Parse as an ES module (throws if invalid); returns imported bindings. */
  function importBindings(code: string): string[] {
    return parseAst(code).body.flatMap((node) =>
      node.type === 'ImportDeclaration'
        ? node.specifiers.map((s) => s.local.name)
        : [],
    );
  }

  function expectUnique(names: string[]) {
    expect(new Set(names).size).toBe(names.length);
  }

  it('generates a valid virtual:game-extensions keyed by the real names', () => {
    const code = load('virtual:game-extensions');
    expectUnique(importBindings(code));
    for (const exportName of [
      'slices',
      'templateVarProviders',
      'templateVarDeclarations',
    ]) {
      const block = new RegExp(
        `export const ${exportName} = \\{([^}]*)\\}`,
      ).exec(code)?.[1];
      expect(block).toContain('"my-ext": ');
      expect(block).toContain('"myExt": ');
      expect(block).toContain('"2d": ');
    }
  });

  it('generates valid virtual:conditions and virtual:references', () => {
    expectUnique(importBindings(load('virtual:conditions')));
    expectUnique(importBindings(load('virtual:references')));
  });

  it("imports a hyphenated extension's data.ts by its camel-cased export", () => {
    const code = load('virtual:game-setup');
    expectUnique(importBindings(code));
    expect(code).toMatch(/import \{ myExtData( as \w+)? \} from /);
  });

  it('exports a contribution from a hyphenated folder under its real name', () => {
    writeExt(
      'my-ext',
      'feature.json',
      JSON.stringify({
        contributions: [
          { file: 'widget.ts', virtualModule: 'virtual:widgets' },
        ],
      }),
    );
    writeExt('my-ext', 'widget.ts', 'export default 1;');
    const code = load('virtual:widgets');
    importBindings(code);
    expect(code).toContain('as "my-ext"');
  });
});
