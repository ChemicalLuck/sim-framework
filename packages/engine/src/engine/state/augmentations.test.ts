import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import ts from 'typescript';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const ENGINE_SRC = path.resolve(import.meta.dirname, '..');
const ENGINE_ROOT = path.resolve(ENGINE_SRC, '..', '..');

// Modules games read through RootState / Effect / Condition / Content.
const RUNTIME_AUGMENTATION =
  /^declare module '@chemicalluck\/sim-engine\/(state\/store|types\/effect\.types|types\/condition\.types|data|data\/authoring\.types|features\/core\/hydrate|features\/view\/slice)'/m;

function augmentingFiles(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (
        /\.tsx?$/.test(entry.name) &&
        !/\.test\.tsx?$/.test(entry.name) &&
        RUNTIME_AUGMENTATION.test(fs.readFileSync(full, 'utf-8'))
      ) {
        out.push(full);
      }
    }
  };
  walk(path.join(ENGINE_SRC, 'features'));
  return out;
}

describe('state/augmentations', () => {
  it('imports every built-in module augmentation', () => {
    const source = fs.readFileSync(
      path.join(ENGINE_SRC, 'state', 'augmentations.ts'),
      'utf-8',
    );
    const missing = augmentingFiles()
      .map((f) =>
        path.relative(path.join(ENGINE_SRC, 'state'), f).replace(/\.tsx?$/, ''),
      )
      .filter((rel) => !source.includes(`'${rel}'`));
    expect(missing).toEqual([]);
  });

  describe('in a game program', () => {
    let gameDir: string;

    beforeAll(() => {
      gameDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sim-consumer-'));
      fs.mkdirSync(path.join(gameDir, 'node_modules', '@chemicalluck'), {
        recursive: true,
      });
      fs.mkdirSync(path.join(gameDir, 'src'));
      fs.symlinkSync(
        ENGINE_ROOT,
        path.join(gameDir, 'node_modules', '@chemicalluck', 'sim-engine'),
        'dir',
      );
    });

    afterAll(() => {
      fs.rmSync(gameDir, { recursive: true, force: true });
    });

    it('sees built-in slice state through RootState alone', () => {
      const file = path.join(gameDir, 'src', 'probe.ts');
      fs.writeFileSync(
        file,
        [
          "import type { RootState } from '@chemicalluck/sim-engine/state/store';",
          'export const read = (s: RootState): number =>',
          '  s.present.time.timestamp + s.present.money;',
        ].join('\n'),
      );
      const program = ts.createProgram([file], {
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
        strict: true,
        noEmit: true,
        skipLibCheck: true,
        allowImportingTsExtensions: true,
        types: [],
      });
      const diagnostics = program
        .getSemanticDiagnostics(program.getSourceFile(file))
        .map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n'));
      expect(diagnostics).toEqual([]);
    });
  });
});
