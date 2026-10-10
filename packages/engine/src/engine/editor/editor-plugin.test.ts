// @vitest-environment node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseAst } from 'vite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { editorPlugin } from './editor-plugin';

describe('virtual:editor-extensions identifiers', () => {
  let extensionsDir: string;

  beforeEach(() => {
    extensionsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sim-ext-'));
    for (const name of ['my-ext', 'myExt']) {
      const dir = path.join(extensionsDir, name);
      fs.mkdirSync(dir);
      fs.writeFileSync(path.join(dir, 'editor.tsx'), 'export default {};');
      fs.writeFileSync(path.join(dir, 'views.tsx'), 'export const v = 1;');
    }
  });

  afterEach(() => {
    fs.rmSync(extensionsDir, { recursive: true, force: true });
  });

  it('generates valid, unique import identifiers for any folder name', () => {
    const plugin = editorPlugin({ dataDir: extensionsDir, extensionsDir });
    const resolveId = plugin.resolveId as (id: string) => string | null;
    const load = plugin.load as (id: string) => string | null;
    const resolved = resolveId('virtual:editor-extensions');
    if (!resolved) throw new Error('virtual:editor-extensions did not resolve');
    const code = load(resolved) ?? '';
    const bindings = parseAst(code).body.flatMap((node) =>
      node.type === 'ImportDeclaration'
        ? node.specifiers.map((s) => s.local.name)
        : [],
    );
    expect(bindings).toHaveLength(4);
    expect(new Set(bindings).size).toBe(4);
  });
});
