import fsSyncModule from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_EDITOR_APP_DIR = __dirname;

const VIRTUAL_STYLES_ID = 'virtual:editor-game-styles';
const RESOLVED_VIRTUAL_STYLES_ID = '\0' + VIRTUAL_STYLES_ID;

const VIRTUAL_EXTENSIONS_ID = 'virtual:editor-extensions';
const RESOLVED_VIRTUAL_EXTENSIONS_ID = '\0' + VIRTUAL_EXTENSIONS_ID;

// ---------------------------------------------------------------------------
// Slot types
// ---------------------------------------------------------------------------

type EditorAggregation =
  | 'guarded-spread-object' //  ...(alias.key ?? {})
  | 'guarded-spread-array' //   ...(alias.key ?? [])
  | 'optional-spread-object' // ...alias?.key
  | 'object-keys'; //           ...Object.keys(alias)

interface EditorContribution {
  /** Named export on the alias to access, or null to use the alias itself */
  sourceExport: string | null;
  /** Key in the generated default-export object */
  targetExport: string;
  container: 'object' | 'array';
  aggregation: EditorAggregation;
  /** Optional TypeScript type annotation appended to the array literal, e.g. 'as string[]' */
  typeAnnotation?: string;
}

export interface EditorSlot {
  /** Ordered list of filenames to check; first existing file wins */
  filenames: string[];
  aliasPrefix: string;
  importStyle: 'default' | 'namespace';
  appliesTo: 'engine' | 'game';
  contributions: EditorContribution[];
}

// ---------------------------------------------------------------------------
// Built-in editor slots
// ---------------------------------------------------------------------------

const EDITOR_SLOTS: EditorSlot[] = [
  {
    filenames: ['effect-editor.tsx', 'effect-editor.ts'],
    aliasPrefix: 'EngineEditor',
    importStyle: 'namespace',
    appliesTo: 'engine',
    contributions: [
      {
        sourceExport: 'default',
        targetExport: 'engineEffectEditors',
        container: 'object',
        aggregation: 'guarded-spread-object',
      },
      {
        sourceExport: 'viewSections',
        targetExport: 'viewSections',
        container: 'array',
        aggregation: 'guarded-spread-array',
      },
      {
        sourceExport: 'editorDataRequirements',
        targetExport: 'dataRequirements',
        container: 'array',
        aggregation: 'guarded-spread-array',
      },
    ],
  },
  {
    filenames: ['editor.tsx', 'editor.ts'],
    aliasPrefix: 'FeatureEditor',
    importStyle: 'default',
    appliesTo: 'engine',
    contributions: [
      {
        sourceExport: 'panels',
        targetExport: 'panels',
        container: 'object',
        aggregation: 'optional-spread-object',
      },
      {
        sourceExport: 'editorDataRequirements',
        targetExport: 'dataRequirements',
        container: 'array',
        aggregation: 'guarded-spread-array',
      },
    ],
  },
  {
    filenames: ['editor.tsx', 'editor.ts'],
    aliasPrefix: 'Editor',
    importStyle: 'default',
    appliesTo: 'game',
    contributions: [
      {
        sourceExport: 'effectRenderers',
        targetExport: 'effectRenderers',
        container: 'object',
        aggregation: 'optional-spread-object',
      },
      {
        sourceExport: 'effectEditors',
        targetExport: 'effectEditors',
        container: 'object',
        aggregation: 'optional-spread-object',
      },
      {
        sourceExport: 'panels',
        targetExport: 'panels',
        container: 'object',
        aggregation: 'optional-spread-object',
      },
      {
        sourceExport: 'editorDataRequirements',
        targetExport: 'dataRequirements',
        container: 'array',
        aggregation: 'guarded-spread-array',
      },
    ],
  },
  {
    filenames: ['views.tsx'],
    aliasPrefix: 'Views',
    importStyle: 'namespace',
    appliesTo: 'game',
    contributions: [
      {
        sourceExport: null,
        targetExport: 'extensionViewIds',
        container: 'array',
        aggregation: 'object-keys',
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Plugin options
// ---------------------------------------------------------------------------

export interface EditorPluginOptions {
  /** Absolute path to the directory containing game data JSON files. */
  dataDir: string;
  /**
   * Absolute path to the directory containing extension folders. Each
   * extension `<key>` is expected to expose its editable data at
   * `<extensionsDir>/<key>/data.json`. Required for the extension data API
   * (`/editor/api/extensions/:key`).
   */
  extensionsDir?: string;
  /**
   * Absolute path to `src/engine/features/`. When provided, each feature's
   * optional `effect-editor.{ts,tsx}` is auto-discovered and merged into
   * `virtual:editor-extensions.engineEffectEditors`.
   */
  engineFeaturesDir?: string;
  /**
   * Absolute path to a CSS file whose values should override the editor's
   * default shadcn theme. When omitted the virtual import resolves to an
   * empty module.
   */
  gameStyles?: string;
  /** Additional editor slots to include alongside the built-in ones */
  extraEditorSlots?: EditorSlot[];
  /**
   * Absolute path to the directory containing the editor SPA's `index.html`
   * (i.e. `@chemicalluck/sim-engine/src/engine/editor`). Defaults to this plugin file's own
   * directory, which is correct when the plugin runs from source. The `sim`
   * CLI passes the resolved path so the editor is served even when the
   * plugin's Node entry is compiled elsewhere.
   */
  editorAppDir?: string;
}

// ---------------------------------------------------------------------------
// Module generator
// ---------------------------------------------------------------------------

function generateEditorExtensionsModule(
  extensionsDir: string | undefined,
  engineFeaturesDir: string | undefined,
  extraEditorSlots: EditorSlot[],
): string {
  const allSlots = [...EDITOR_SLOTS, ...extraEditorSlots];

  const imports: string[] = [];
  const contributions = new Map<string, string[]>();
  const exportMeta = new Map<
    string,
    { container: 'object' | 'array'; typeAnnotation?: string }
  >();

  for (const slot of allSlots) {
    for (const contrib of slot.contributions) {
      if (!exportMeta.has(contrib.targetExport)) {
        exportMeta.set(contrib.targetExport, {
          container: contrib.container,
          typeAnnotation: contrib.typeAnnotation,
        });
      }
    }
  }

  function scan(dir: string, scope: 'engine' | 'game') {
    if (!fsSyncModule.existsSync(dir)) return;
    const names = fsSyncModule
      .readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);

    for (const name of names) {
      for (const slot of allSlots) {
        if (slot.appliesTo !== scope) continue;

        const file =
          slot.filenames
            .map((f) => path.join(dir, name, f))
            .find((f) => fsSyncModule.existsSync(f)) ?? null;
        if (!file) continue;

        const alias = `${name}${slot.aliasPrefix}`;

        if (slot.importStyle === 'namespace') {
          imports.push(`import * as ${alias} from ${JSON.stringify(file)};`);
        } else {
          imports.push(`import ${alias} from ${JSON.stringify(file)};`);
        }

        for (const contrib of slot.contributions) {
          let entries = contributions.get(contrib.targetExport);
          if (!entries) {
            entries = [];
            contributions.set(contrib.targetExport, entries);
          }

          const src = contrib.sourceExport;
          switch (contrib.aggregation) {
            case 'guarded-spread-object':
              entries.push(
                src ? `  ...(${alias}.${src} ?? {})` : `  ...(${alias} ?? {})`,
              );
              break;
            case 'guarded-spread-array':
              entries.push(
                src ? `  ...(${alias}.${src} ?? [])` : `  ...(${alias} ?? [])`,
              );
              break;
            case 'optional-spread-object':
              entries.push(src ? `  ...${alias}?.${src}` : `  ...${alias}`);
              break;
            case 'object-keys':
              entries.push(`  ...Object.keys(${alias})`);
              break;
          }
        }
      }
    }
  }

  if (engineFeaturesDir) scan(engineFeaturesDir, 'engine');
  if (extensionsDir) scan(extensionsDir, 'game');

  const exportLines: string[] = [];
  for (const [exportName, { container, typeAnnotation }] of exportMeta) {
    const entries = contributions.get(exportName) ?? [];
    const ann = typeAnnotation ? ` ${typeAnnotation}` : '';
    if (container === 'object') {
      exportLines.push(`  ${exportName}: {\n${entries.join(',\n')}\n  }`);
    } else {
      exportLines.push(`  ${exportName}: [\n${entries.join(',\n')}\n  ]${ann}`);
    }
  }
  return `${imports.join('\n')}\n\nexport default {\n${exportLines.join(',\n')}\n};`.trimStart();
}

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------

export function editorPlugin(options: EditorPluginOptions): Plugin {
  const {
    dataDir,
    extensionsDir,
    engineFeaturesDir,
    gameStyles,
    extraEditorSlots = [],
    editorAppDir = DEFAULT_EDITOR_APP_DIR,
  } = options;

  const EDITOR_HTML = path.resolve(editorAppDir, 'index.html');

  return {
    name: 'editor-plugin',
    apply: 'serve',
    resolveId(id) {
      if (id === VIRTUAL_STYLES_ID) return RESOLVED_VIRTUAL_STYLES_ID;
      if (id === VIRTUAL_EXTENSIONS_ID) return RESOLVED_VIRTUAL_EXTENSIONS_ID;
      return null;
    },
    load(id) {
      if (id === RESOLVED_VIRTUAL_STYLES_ID) {
        if (!gameStyles) return 'export {};';
        const importPath = JSON.stringify(gameStyles);
        return `import ${importPath};`;
      }
      if (id === RESOLVED_VIRTUAL_EXTENSIONS_ID) {
        return generateEditorExtensionsModule(
          extensionsDir,
          engineFeaturesDir,
          extraEditorSlots,
        );
      }
      return null;
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        void (async () => {
          const url = req.url ?? '';

          // Serve editor SPA at any /editor/* path (SPA routing)
          if (url.startsWith('/editor') && !url.startsWith('/editor/api')) {
            try {
              let html = await fs.readFile(EDITOR_HTML, 'utf-8');
              // The editor entry lives next to index.html (in node_modules when
              // installed), not under the game's own /src. Point Vite at its
              // real filesystem location so it resolves regardless of root.
              const mainEntry = `/@fs/${path
                .resolve(editorAppDir, 'main.tsx')
                .replace(/\\/g, '/')}`;
              html = html.replace('/src/engine/editor/main.tsx', mainEntry);
              html = await server.transformIndexHtml('/editor/', html);
              res.setHeader('Content-Type', 'text/html');
              res.end(html);
            } catch {
              next();
            }
            return;
          }

          // Data API at /editor/api/data/:name
          if (url.startsWith('/editor/api/data')) {
            const name = url
              .replace(/^\/editor\/api\/data\/?/, '')
              .replace(/\.json$/, '');
            if (!name) {
              res.statusCode = 400;
              res.end('Bad request');
              return;
            }
            const filePath = path.join(dataDir, `${name}.json`);

            if (req.method === 'GET') {
              try {
                const content = await fs.readFile(filePath, 'utf-8');
                res.setHeader('Content-Type', 'application/json');
                res.end(content);
              } catch {
                res.statusCode = 404;
                res.end('Not found');
              }
            } else if (req.method === 'POST') {
              let body = '';
              req.on('data', (chunk: Buffer) => {
                body += chunk.toString();
              });
              req.on('end', () => {
                void (async () => {
                  try {
                    JSON.parse(body);
                    await fs.writeFile(filePath, body, 'utf-8');
                    server.watcher.emit('change', filePath);
                    res.setHeader('Content-Type', 'application/json');
                    res.end('{"ok":true}');
                  } catch (e: unknown) {
                    res.statusCode = 400;
                    res.end(String(e));
                  }
                })();
              });
            } else {
              res.statusCode = 405;
              res.end('Method not allowed');
            }
            return;
          }

          // Extension data API at /editor/api/extensions/:key
          if (url.startsWith('/editor/api/extensions')) {
            if (!extensionsDir) {
              res.statusCode = 400;
              res.end('extensionsDir not configured');
              return;
            }
            const key = url
              .replace(/^\/editor\/api\/extensions\/?/, '')
              .replace(/[?#].*$/, '');
            if (!key || key.includes('/') || key.includes('..')) {
              res.statusCode = 400;
              res.end('Bad request');
              return;
            }
            const filePath = path.join(extensionsDir, key, 'data.json');

            if (req.method === 'GET') {
              try {
                const content = await fs.readFile(filePath, 'utf-8');
                res.setHeader('Content-Type', 'application/json');
                res.end(content);
              } catch {
                res.statusCode = 404;
                res.end('Not found');
              }
            } else if (req.method === 'POST') {
              let body = '';
              req.on('data', (chunk: Buffer) => {
                body += chunk.toString();
              });
              req.on('end', () => {
                void (async () => {
                  try {
                    JSON.parse(body);
                    await fs.writeFile(filePath, body, 'utf-8');
                    server.watcher.emit('change', filePath);
                    res.setHeader('Content-Type', 'application/json');
                    res.end('{"ok":true}');
                  } catch (e: unknown) {
                    res.statusCode = 400;
                    res.end(String(e));
                  }
                })();
              });
            } else {
              res.statusCode = 405;
              res.end('Method not allowed');
            }
            return;
          }

          next();
        })();
      });
    },
  };
}
