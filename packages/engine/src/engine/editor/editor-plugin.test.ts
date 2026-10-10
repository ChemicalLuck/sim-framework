// @vitest-environment node
import { EventEmitter } from 'node:events';
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

describe('editor data API', () => {
  let dataDir: string;

  beforeEach(() => {
    dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sim-data-'));
  });

  afterEach(() => {
    fs.rmSync(dataDir, { recursive: true, force: true });
  });

  interface FakeRes {
    statusCode: number;
    setHeader: () => void;
    end: (chunk?: string) => void;
  }
  type Middleware = (
    req: EventEmitter & { url: string; method: string },
    res: FakeRes,
    next: () => void,
  ) => void;

  function middleware(): Middleware {
    let handler: Middleware | undefined;
    const server = {
      middlewares: {
        // Connect's middlewares.use, capturing what the plugin registers.
        // eslint-disable-next-line react-x/no-unnecessary-use-prefix
        use: (fn: Middleware) => {
          handler = fn;
        },
      },
      watcher: { emit: () => true },
    };
    const plugin = editorPlugin({ dataDir, extensionsDir: dataDir });
    (plugin.configureServer as unknown as (s: typeof server) => void)(server);
    if (!handler) throw new Error('no middleware registered');
    return handler;
  }

  function request(method: string, url: string, body?: string) {
    const handler = middleware();
    const req = Object.assign(new EventEmitter(), { url, method });
    return new Promise<{ status: number; body: string }>((resolve) => {
      const res: FakeRes = {
        statusCode: 200,
        setHeader: () => undefined,
        end: (chunk) => {
          resolve({ status: res.statusCode, body: chunk ?? '' });
        },
      };
      handler(req, res, () => {
        resolve({ status: -1, body: '' });
      });
      if (body !== undefined) {
        req.emit('data', Buffer.from(body));
        req.emit('end');
      }
    });
  }

  it('serves an existing data file', async () => {
    fs.writeFileSync(path.join(dataDir, 'quests.json'), '[{"id":"q"}]');
    const res = await request('GET', '/editor/api/data/quests');
    expect(res).toEqual({ status: 200, body: '[{"id":"q"}]' });
  });

  it('answers 404 for an absent data file', async () => {
    const res = await request('GET', '/editor/api/data/quests');
    expect(res.status).toBe(404);
  });

  it('answers 500 with the message for any other read error', async () => {
    // A directory where the file should be: a read error that isn't absence.
    fs.mkdirSync(path.join(dataDir, 'quests.json'));
    const res = await request('GET', '/editor/api/data/quests');
    expect(res.status).toBe(500);
    expect(res.body).toMatch(/EISDIR/);
  });

  it('creates an absent data file on save', async () => {
    const res = await request('POST', '/editor/api/data/quests', '[]');
    expect(res.status).toBe(200);
    expect(fs.readFileSync(path.join(dataDir, 'quests.json'), 'utf-8')).toBe(
      '[]',
    );
  });
});
