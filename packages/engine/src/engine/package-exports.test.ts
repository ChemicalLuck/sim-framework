import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import ts from 'typescript';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const ENGINE_ROOT = path.resolve(import.meta.dirname, '..', '..');

// Resolve engine subpaths the way a consuming game's TypeScript does: through
// the package `exports` map with `moduleResolution: bundler`, no `paths`.
describe('package exports for TypeScript consumers', () => {
  let gameDir: string;

  beforeAll(() => {
    gameDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sim-consumer-'));
    fs.mkdirSync(path.join(gameDir, 'node_modules', '@chemicalluck'), {
      recursive: true,
    });
    fs.symlinkSync(
      ENGINE_ROOT,
      path.join(gameDir, 'node_modules', '@chemicalluck', 'sim-engine'),
      'dir',
    );
  });

  afterAll(() => {
    fs.rmSync(gameDir, { recursive: true, force: true });
  });

  it.each([
    ['features/npcs/types', 'features/npcs/types.ts'],
    [
      'features/needs/components/needs-display',
      'features/needs/components/needs-display.tsx',
    ],
    ['lib/conditions', 'lib/conditions/index.ts'],
    ['state/store', 'state/store.ts'],
  ])('resolves @chemicalluck/sim-engine/%s', (subpath, file) => {
    const { resolvedModule } = ts.resolveModuleName(
      `@chemicalluck/sim-engine/${subpath}`,
      path.join(gameDir, 'src', 'main.ts'),
      {
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        allowImportingTsExtensions: true,
      },
      ts.sys,
    );
    expect(resolvedModule?.resolvedFileName).toBe(
      path.join(ENGINE_ROOT, 'src', 'engine', file),
    );
  });
});
