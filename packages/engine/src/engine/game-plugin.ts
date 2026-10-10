import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';

import type {
  ContentExtension,
  ContentSetupBinding,
  ContentSlot,
  ContextSlot,
  FeatureManifest,
  FeatureSlotSpec,
  SetupBinding,
} from './feature-slot';
import {
  createIdentifierAllocator,
  moduleExportName,
  toIdentifier,
} from './module-identifiers';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENGINE_DIR = __dirname;

const VIRTUAL_EXTENSIONS_ID = 'virtual:game-extensions';
const RESOLVED_VIRTUAL_EXTENSIONS_ID = '\0' + VIRTUAL_EXTENSIONS_ID;

const VIRTUAL_SETUP_ID = 'virtual:game-setup';
const RESOLVED_VIRTUAL_SETUP_ID = '\0' + VIRTUAL_SETUP_ID;

const VIRTUAL_CONDITIONS_ID = 'virtual:conditions';
const RESOLVED_VIRTUAL_CONDITIONS_ID = '\0' + VIRTUAL_CONDITIONS_ID;

const VIRTUAL_REFERENCES_ID = 'virtual:references';
const RESOLVED_VIRTUAL_REFERENCES_ID = '\0' + VIRTUAL_REFERENCES_ID;

/** Prefix for resolved IDs of virtual modules declared via feature.json contributions */
const RESOLVED_CONTRIB_PREFIX = '\0game-feature-module:';

const FEATURE_MANIFEST_FILE = 'feature.json';
const CONDITIONS_FILE = 'conditions.ts';
const REFERENCES_FILE = 'references.ts';
const EXTENSION_DATA_FILE = 'data.ts';
const EXTENSIONS_SUBDIR = 'extensions';
const DATA_SUBDIR = 'data';

// ---------------------------------------------------------------------------
// Built-in slot conventions
// ---------------------------------------------------------------------------

/**
 * The engine's built-in scanning conventions. Every feature/extension
 * directory is checked for these files and the results are aggregated into
 * virtual:game-extensions. Add genuinely custom slots via extraSlots instead
 * of feature.json — the slots key in feature.json is no longer supported.
 */
const DEFAULT_SLOTS: FeatureSlotSpec[] = [
  {
    filename: 'slice.ts',
    aliasPrefix: 'Reducer',
    importStyle: 'default',
    aggregation: 'keyed-by-name',
    appliesTo: 'both',
    virtualModule: VIRTUAL_EXTENSIONS_ID,
    exportName: 'slices',
  },
  {
    filename: 'effects.ts',
    aliasPrefix: 'Effects',
    importStyle: 'default',
    aggregation: 'spread-into-object',
    appliesTo: 'both',
    virtualModule: VIRTUAL_EXTENSIONS_ID,
    exportName: 'effectHandlers',
  },
  {
    filename: 'post-effects.ts',
    aliasPrefix: 'PostEffects',
    importStyle: 'default',
    aggregation: 'spread-into-array',
    appliesTo: 'both',
    virtualModule: VIRTUAL_EXTENSIONS_ID,
    exportName: 'postEffectHandlers',
  },
  {
    filename: 'effect-hydrators.ts',
    aliasPrefix: 'EffectHydrators',
    importStyle: 'default',
    aggregation: 'spread-into-array',
    appliesTo: 'both',
    virtualModule: VIRTUAL_EXTENSIONS_ID,
    exportName: 'effectHydrators',
  },
  {
    filename: 'initializer.ts',
    aliasPrefix: 'Initializer',
    importStyle: 'default',
    aggregation: 'push-into-array',
    appliesTo: 'both',
    virtualModule: VIRTUAL_EXTENSIONS_ID,
    exportName: 'storeInitializers',
  },
  {
    filename: 'views.tsx',
    aliasPrefix: 'Views',
    importStyle: 'namespace',
    aggregation: 'spread-into-object',
    appliesTo: 'both',
    virtualModule: VIRTUAL_EXTENSIONS_ID,
    exportName: 'views',
  },
  {
    filename: 'actions.ts',
    aliasPrefix: 'Actions',
    importStyle: 'default',
    aggregation: 'spread-into-array',
    appliesTo: 'game',
    virtualModule: VIRTUAL_EXTENSIONS_ID,
    exportName: 'actionGroupProviders',
  },
  {
    filename: 'template-vars.ts',
    aliasPrefix: 'TemplateVars',
    importStyle: 'default',
    aggregation: 'keyed-by-name',
    appliesTo: 'game',
    virtualModule: VIRTUAL_EXTENSIONS_ID,
    exportName: 'templateVarProviders',
  },
  {
    // The whole module, so the editor linter can read its optional `keys`.
    filename: 'template-vars.ts',
    aliasPrefix: 'TemplateVarsModule',
    importStyle: 'namespace',
    aggregation: 'keyed-by-name',
    appliesTo: 'game',
    virtualModule: VIRTUAL_EXTENSIONS_ID,
    exportName: 'templateVarDeclarations',
  },
];

function containerFromAggregation(
  aggregation: FeatureSlotSpec['aggregation'],
): 'object' | 'array' {
  return aggregation === 'keyed-by-name' || aggregation === 'spread-into-object'
    ? 'object'
    : 'array';
}

export interface GamePluginOptions {
  /** Absolute path to src/game/ */
  gameDir: string;
  /**
   * Absolute path to the engine source root (the directory containing
   * `features/` and `data/`). Defaults to this plugin file's own directory,
   * which is correct when the plugin runs from source. The `sim` CLI passes
   * the resolved `@chemicalluck/sim-engine/src/engine` path so the plugin works even when
   * its Node entry is compiled to a different location.
   */
  engineDir?: string;
  /** Absolute path to docs/ folder (optional, enables /docs route) */
  docsDir?: string;
  /** Additional slot specs to include alongside the built-in defaults */
  extraSlots?: FeatureSlotSpec[];
}

// ---------------------------------------------------------------------------
// Manifest loading
// ---------------------------------------------------------------------------

interface FeatureSetupBinding {
  featureName: string;
  featureDir: string;
  binding: SetupBinding;
}

interface FeatureContentSetupBinding {
  featureName: string;
  featureDir: string;
  binding: ContentSetupBinding;
}

interface FeatureContentExtension {
  featureName: string;
  featureDir: string;
  ext: ContentExtension;
}

interface FeatureContextSlot {
  featureName: string;
  featureDir: string;
  slot: ContextSlot;
}

interface ManifestData {
  /** Custom virtual modules declared via FeatureContribution entries */
  customModules: Map<string, { featureName: string; filePath: string }[]>;
  setupBindings: FeatureSetupBinding[];
  contentSlots: ContentSlot[];
  contentExtensions: FeatureContentExtension[];
  contextSlots: FeatureContextSlot[];
  contentSetupBindings: FeatureContentSetupBinding[];
}

function loadManifests(
  engineFeaturesDir: string,
  extensionsDir: string,
): ManifestData {
  const customModules = new Map<
    string,
    { featureName: string; filePath: string }[]
  >();
  const setupBindings: FeatureSetupBinding[] = [];
  const contentSlots: ContentSlot[] = [];
  const contentExtensions: FeatureContentExtension[] = [];
  const contextSlots: FeatureContextSlot[] = [];
  const contentSetupBindings: FeatureContentSetupBinding[] = [];

  function processDir(dir: string) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const manifestFile = path.join(dir, entry.name, FEATURE_MANIFEST_FILE);
      if (!fs.existsSync(manifestFile)) continue;
      try {
        const manifest = JSON.parse(
          fs.readFileSync(manifestFile, 'utf-8'),
        ) as FeatureManifest;
        const featureDir = path.join(dir, entry.name);

        for (const contrib of manifest.contributions ?? []) {
          const absFile = path.resolve(featureDir, contrib.file);
          let modList = customModules.get(contrib.virtualModule);
          if (!modList) {
            modList = [];
            customModules.set(contrib.virtualModule, modList);
          }
          modList.push({
            featureName: contrib.as ?? entry.name,
            filePath: absFile,
          });
        }

        for (const binding of manifest.setup ?? []) {
          setupBindings.push({ featureName: entry.name, featureDir, binding });
        }
        contentSlots.push(...(manifest.content ?? []));
        for (const ext of manifest.contentExtensions ?? []) {
          contentExtensions.push({ featureName: entry.name, featureDir, ext });
        }
        for (const slot of manifest.contextSlots ?? []) {
          contextSlots.push({ featureName: entry.name, featureDir, slot });
        }
        for (const binding of manifest.contentSetup ?? []) {
          contentSetupBindings.push({
            featureName: entry.name,
            featureDir,
            binding,
          });
        }
      } catch {
        // skip malformed manifest
      }
    }
  }

  processDir(engineFeaturesDir);
  processDir(extensionsDir);
  return {
    customModules,
    setupBindings,
    contentSlots,
    contentExtensions,
    contextSlots,
    contentSetupBindings,
  };
}

// ---------------------------------------------------------------------------
// Feature directory scanner
// ---------------------------------------------------------------------------

function scanFeatureDir(
  featureDir: string,
  featureName: string,
  scope: 'engine' | 'game',
  specs: FeatureSlotSpec[],
  imports: string[],
  contributions: Map<string, string[]>,
  allocate: (base: string) => string,
): void {
  for (const spec of specs) {
    if (spec.appliesTo !== 'both' && spec.appliesTo !== scope) continue;

    const file = path.join(featureDir, spec.filename);
    if (!fs.existsSync(file)) continue;

    const alias = allocate(`${featureName}${spec.aliasPrefix}`);

    if (spec.importStyle === 'namespace') {
      imports.push(`import * as ${alias} from ${JSON.stringify(file)};`);
    } else {
      imports.push(`import ${alias} from ${JSON.stringify(file)};`);
    }

    let entries = contributions.get(spec.exportName);
    if (!entries) {
      entries = [];
      contributions.set(spec.exportName, entries);
    }

    switch (spec.aggregation) {
      case 'keyed-by-name':
        entries.push(`  ${JSON.stringify(featureName)}: ${alias}`);
        break;
      case 'spread-into-object':
      case 'spread-into-array':
        entries.push(`  ...${alias}`);
        break;
      case 'push-into-array':
        entries.push(`  ${alias}`);
        break;
    }
  }
}

// ---------------------------------------------------------------------------
// Virtual module generators
// ---------------------------------------------------------------------------

function generateExtensionsModule(
  engineFeaturesDir: string,
  extensionsDir: string,
  extraSlots: FeatureSlotSpec[],
): string {
  const allSpecs = [...DEFAULT_SLOTS, ...extraSlots].filter(
    (s) => s.virtualModule === VIRTUAL_EXTENSIONS_ID,
  );

  const imports: string[] = [];
  const contributions = new Map<string, string[]>();
  const exportMeta = new Map<string, 'object' | 'array'>();
  const allocate = createIdentifierAllocator();

  for (const spec of allSpecs) {
    if (!exportMeta.has(spec.exportName)) {
      exportMeta.set(
        spec.exportName,
        containerFromAggregation(spec.aggregation),
      );
    }
  }

  const readDirs = (dir: string) =>
    fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);

  if (fs.existsSync(engineFeaturesDir)) {
    for (const name of readDirs(engineFeaturesDir)) {
      scanFeatureDir(
        path.join(engineFeaturesDir, name),
        name,
        'engine',
        allSpecs,
        imports,
        contributions,
        allocate,
      );
    }
  }

  if (fs.existsSync(extensionsDir)) {
    for (const name of readDirs(extensionsDir)) {
      scanFeatureDir(
        path.join(extensionsDir, name),
        name,
        'game',
        allSpecs,
        imports,
        contributions,
        allocate,
      );
    }
  }

  const exportLines: string[] = [];
  for (const [exportName, container] of exportMeta) {
    const entries = contributions.get(exportName) ?? [];
    if (container === 'object') {
      exportLines.push(
        `export const ${exportName} = {\n${entries.join(',\n')}\n};`,
      );
    } else {
      exportLines.push(
        `export const ${exportName} = [\n${entries.join(',\n')}\n];`,
      );
    }
  }

  return [imports.join('\n'), exportLines.join('\n')]
    .filter(Boolean)
    .join('\n\n');
}

function generateContributionModule(
  entries: { featureName: string; filePath: string }[],
): string {
  return entries
    .map(
      ({ featureName, filePath }) =>
        `export { default as ${moduleExportName(featureName)} } from ${JSON.stringify(filePath)};`,
    )
    .join('\n');
}

function collectConditionsAliases(
  engineFeaturesDir: string,
  extensionsDir: string,
): { imports: string[]; aliases: string[] } {
  return collectFeatureFileAliases(
    engineFeaturesDir,
    extensionsDir,
    CONDITIONS_FILE,
    'Conditions',
  );
}

function generateConditionsBundle(
  engineFeaturesDir: string,
  extensionsDir: string,
): string {
  const { imports, aliases } = collectConditionsAliases(
    engineFeaturesDir,
    extensionsDir,
  );
  const o = (key: string) =>
    aliases.map((a) => `  ...('${key}' in ${a} ? ${a}['${key}'] : {})`);
  const a = (key: string) =>
    aliases.map((a) => `  ...('${key}' in ${a} ? ${a}['${key}'] : [])`);

  return `
${imports.join('\n')}

export const conditionEvaluators = {
${o('default').join(',\n')}
};
export const exprEvaluators = {
${o('exprEvaluators').join(',\n')}
};
export const conditionParsers = [
${a('conditionParsers').join(',\n')}
];
export const exprParsers = [
${a('exprParsers').join(',\n')}
];
export const comparisonParsers = [
${a('comparisonParsers').join(',\n')}
];
export const exprKinds = new Set([
${a('exprKinds').join(',\n')}
]);
export const conditionSerializers = {
${o('conditionSerializers').join(',\n')}
};
export const exprSerializers = {
${o('exprSerializers').join(',\n')}
};
`.trim();
}

function collectFeatureFileAliases(
  engineFeaturesDir: string,
  extensionsDir: string,
  filename: string,
  aliasSuffix: string,
): { imports: string[]; aliases: string[] } {
  const imports: string[] = [];
  const aliases: string[] = [];
  const allocate = createIdentifierAllocator();

  const scan = (dir: string) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const file = path.join(dir, entry.name, filename);
      if (!fs.existsSync(file)) continue;
      const alias = allocate(`${entry.name}${aliasSuffix}`);
      imports.push(`import * as ${alias} from ${JSON.stringify(file)};`);
      aliases.push(alias);
    }
  };

  scan(engineFeaturesDir);
  scan(extensionsDir);
  return { imports, aliases };
}

/**
 * Data files (base names, without `.json`) the feature manifests declare
 * required — the ones whose absence `virtual:game-setup` does not tolerate.
 * Anything declared only as `optional` (e.g. `weather.json`) is left out.
 */
function requiredDataFiles(manifestData: ManifestData): string[] {
  const { setupBindings, contentSlots, contentExtensions, contextSlots } =
    manifestData;
  const files = new Set<string>();
  const add = (jsonFile: string, optional?: boolean) => {
    if (!optional) files.add(jsonFile.replace(/\.json$/, ''));
  };
  for (const { binding } of setupBindings)
    add(binding.jsonFile, binding.optional);
  for (const slot of contentSlots) add(slot.jsonFile, slot.optional);
  for (const { slot } of contextSlots) add(slot.jsonFile, slot.optional);
  for (const { ext } of contentExtensions) {
    if (ext.jsonFile) add(ext.jsonFile, ext.optional);
    for (const input of ext.inputs ?? [])
      add(input.jsonFile, (ext.optional ?? false) || input.optional);
  }
  return [...files].sort();
}

function generateReferencesBundle(
  engineFeaturesDir: string,
  extensionsDir: string,
  manifestData: ManifestData,
): string {
  const { imports, aliases } = collectFeatureFileAliases(
    engineFeaturesDir,
    extensionsDir,
    REFERENCES_FILE,
    'References',
  );
  const arr = (key: string) =>
    aliases.map((a) => `  ...('${key}' in ${a} ? ${a}['${key}'] : [])`);

  return `
${imports.join('\n')}

export const idSources = [
${arr('idSources').join(',\n')}
];
export const referenceProviders = [
${arr('referenceProviders').join(',\n')}
];
export const nodeRefExtractors = [
${arr('nodeRefExtractors').join(',\n')}
];
export const nodeRefRewriters = [
${arr('nodeRefRewriters').join(',\n')}
];
export const referenceRewriters = [
${arr('referenceRewriters').join(',\n')}
];
export const requiredDataFiles = ${JSON.stringify(requiredDataFiles(manifestData))};
`.trim();
}

function generateSetupModule(
  gameDir: string,
  engineRoot: string,
  manifestData: ManifestData,
): string {
  const dataDir = path.join(gameDir, DATA_SUBDIR);
  const extensionsDir = path.join(gameDir, EXTENSIONS_SUBDIR);
  const dataModulePath = path.join(engineRoot, 'data');

  const {
    setupBindings,
    contentSlots,
    contentSetupBindings,
    contentExtensions,
    contextSlots,
  } = manifestData;

  const allocate = createIdentifierAllocator();
  allocate('loadContent');
  allocate('content');
  // Content keys are passed to loadContent as shorthand properties, so they
  // keep their own names.
  const activeContentSlots = contentSlots.filter(
    (slot) =>
      !slot.optional || fs.existsSync(path.join(dataDir, slot.jsonFile)),
  );
  for (const slot of activeContentSlots) allocate(slot.contentKey);

  // One import per JSON file, shared by every binding that reads it.
  const jsonVars = new Map<string, string>();
  const importJson = (
    featureName: string,
    jsonFile: string,
    imports: string[],
  ): string => {
    const jsonFilePath = path.join(dataDir, jsonFile);
    let dataVar = jsonVars.get(jsonFilePath);
    if (!dataVar) {
      dataVar = allocate(
        `${featureName}_${toIdentifier(path.basename(jsonFile, '.json'))}Data`,
      );
      jsonVars.set(jsonFilePath, dataVar);
      imports.push(`import ${dataVar} from ${JSON.stringify(jsonFilePath)};`);
    }
    return dataVar;
  };
  const importNamed = (
    featureName: string,
    call: string,
    from: string,
    imports: string[],
  ): string => {
    const alias = allocate(`${featureName}_${call}`);
    imports.push(
      `import { ${call} as ${alias} } from ${JSON.stringify(from)};`,
    );
    return alias;
  };

  // ---- Extension data (convention: each data.ts exports `${name}Data`,
  // with a non-identifier name camel-cased: `my-ext` → `myExtData`) ----
  const extDataImports: string[] = [];
  const extDataEntries: string[] = [];
  if (fs.existsSync(extensionsDir)) {
    for (const entry of fs.readdirSync(extensionsDir, {
      withFileTypes: true,
    })) {
      if (!entry.isDirectory()) continue;
      const dataFile = path.join(
        extensionsDir,
        entry.name,
        EXTENSION_DATA_FILE,
      );
      if (!fs.existsSync(dataFile)) continue;
      const exportName = toIdentifier(`${entry.name}Data`);
      const varName = allocate(exportName);
      const specifier =
        varName === exportName ? varName : `${exportName} as ${varName}`;
      extDataImports.push(
        `import { ${specifier} } from ${JSON.stringify(dataFile)};`,
      );
      extDataEntries.push(`  ${varName}`);
    }
  }

  // ---- Setup bindings (optional JSON → function) ----
  const setupImports: string[] = [];
  const setupCalls: string[] = [];
  for (const { featureName, featureDir, binding } of setupBindings) {
    const jsonFilePath = path.join(dataDir, binding.jsonFile);
    if (binding.optional && !fs.existsSync(jsonFilePath)) continue;
    const callAlias = importNamed(
      featureName,
      binding.call,
      path.resolve(featureDir, binding.from),
      setupImports,
    );
    const dataVar = importJson(featureName, binding.jsonFile, setupImports);
    setupCalls.push(`${callAlias}(${dataVar});`);
  }

  // ---- Content slots (JSON → RawContent key for loadContent) ----
  const contentImports: string[] = [];
  const activeContentKeys: string[] = [];
  for (const slot of activeContentSlots) {
    const jsonFilePath = path.join(dataDir, slot.jsonFile);
    activeContentKeys.push(slot.contentKey);
    contentImports.push(
      `import ${slot.contentKey} from ${JSON.stringify(jsonFilePath)};`,
    );
  }

  // ---- Context slots (populate HydrationContext before scene hydration) ----
  const ctxSlotImports: string[] = [];
  const ctxSlotEntries: string[] = [];
  for (const { featureName, featureDir, slot } of contextSlots) {
    const jsonFilePath = path.join(dataDir, slot.jsonFile);
    if (slot.optional && !fs.existsSync(jsonFilePath)) continue;
    const dataVar = importJson(featureName, slot.jsonFile, ctxSlotImports);
    const hydratorAlias = importNamed(
      featureName,
      slot.hydratorCall,
      path.resolve(featureDir, slot.hydratorFrom),
      ctxSlotImports,
    );
    ctxSlotEntries.push(
      `  { contextKey: ${JSON.stringify(slot.contextKey)}, data: ${dataVar}, hydrate: (data, ctx) => ${hydratorAlias}(data, ctx) }`,
    );
  }

  // ---- Content extensions (single file or bundle → Content.extensions) ----
  const extImports: string[] = [];
  const extEntries: string[] = [];
  // Extensions not loaded (optional file absent) — their contentSetup calls are skipped.
  const skippedExtKeys = new Set<string>();
  for (const { featureName, featureDir, ext } of contentExtensions) {
    if (ext.inputs) {
      // Bundle: multiple JSON files → single hydrated extension entry
      const inputVars: { inputKey: string; dataVar: string }[] = [];
      let skip = false;
      for (const input of ext.inputs) {
        const jsonFilePath = path.join(dataDir, input.jsonFile);
        if (!fs.existsSync(jsonFilePath)) {
          if (input.optional) continue;
          skip = true;
          break;
        }
        const dataVar = importJson(featureName, input.jsonFile, extImports);
        inputVars.push({ inputKey: input.inputKey, dataVar });
      }
      if (skip) {
        skippedExtKeys.add(ext.contentKey);
        continue;
      }
      if (!ext.hydratorCall || !ext.hydratorFrom) continue;
      const hydratorAlias = importNamed(
        featureName,
        ext.hydratorCall,
        path.resolve(featureDir, ext.hydratorFrom),
        extImports,
      );
      const dataObj = `{ ${inputVars.map(({ inputKey, dataVar }) => `${inputKey}: ${dataVar}`).join(', ')} }`;
      extEntries.push(
        `  { key: ${JSON.stringify(ext.contentKey)}, data: ${dataObj}, hydrate: (data, ctx) => ${hydratorAlias}(data, ctx) }`,
      );
    } else {
      // Single file → optional hydration
      if (!ext.jsonFile) continue;
      const jsonFilePath = path.join(dataDir, ext.jsonFile);
      if (ext.optional && !fs.existsSync(jsonFilePath)) {
        skippedExtKeys.add(ext.contentKey);
        continue;
      }
      // A setup binding may already import the same file (e.g. needs.json).
      const dataVar = importJson(featureName, ext.jsonFile, extImports);
      if (ext.hydratorFrom && ext.hydratorCall) {
        const hydratorAlias = importNamed(
          featureName,
          ext.hydratorCall,
          path.resolve(featureDir, ext.hydratorFrom),
          extImports,
        );
        extEntries.push(
          `  { key: ${JSON.stringify(ext.contentKey)}, data: ${dataVar}, hydrate: (data, ctx) => ${hydratorAlias}(data, ctx) }`,
        );
      } else {
        extEntries.push(
          `  { key: ${JSON.stringify(ext.contentKey)}, data: ${dataVar} }`,
        );
      }
    }
  }

  // ---- Content-setup bindings (post-loadContent calls) ----
  const contentSetupImports: string[] = [];
  const contentSetupCalls: string[] = [];
  for (const { featureName, featureDir, binding } of contentSetupBindings) {
    if (binding.source !== 'root' && skippedExtKeys.has(binding.contentKey)) {
      continue;
    }
    const alias = importNamed(
      featureName,
      binding.call,
      path.resolve(featureDir, binding.from),
      contentSetupImports,
    );
    const accessor =
      binding.source === 'root'
        ? `content.${binding.contentKey}`
        : `content.extensions.${binding.contentKey}`;
    contentSetupCalls.push(`${alias}(${accessor});`);
  }

  const contentArgs = activeContentKeys.map((k) => `  ${k},`);

  const allExtEntries = [...extDataEntries, ...extEntries];
  const extensionsValue =
    allExtEntries.length > 0 ? `[\n${allExtEntries.join(',\n')}\n]` : '[]';

  const loadContentArgs = [
    ...contentArgs,
    ...(ctxSlotEntries.length > 0
      ? [`  contextExtensions: [\n${ctxSlotEntries.join(',\n')}\n  ],`]
      : []),
    `  extensions: ${extensionsValue},`,
  ];

  return `
import { loadContent } from ${JSON.stringify(dataModulePath)};
${setupImports.join('\n')}
${contentImports.join('\n')}
${contentSetupImports.join('\n')}
${extDataImports.join('\n')}
${ctxSlotImports.join('\n')}
${extImports.join('\n')}

export const content = loadContent({
${loadContentArgs.join('\n')}
});

${setupCalls.join('\n')}
${contentSetupCalls.join('\n')}
`.trim();
}

export function gamePlugin(options: GamePluginOptions): Plugin {
  const { gameDir, extraSlots = [] } = options;
  const engineRoot = options.engineDir ?? ENGINE_DIR;
  const extensionsDir = path.join(gameDir, EXTENSIONS_SUBDIR);
  const engineFeaturesDir = path.join(engineRoot, 'features');

  let manifestCache: ManifestData | null = null;

  function getManifestData(): ManifestData {
    manifestCache ??= loadManifests(engineFeaturesDir, extensionsDir);
    return manifestCache;
  }

  function invalidateManifestCache() {
    manifestCache = null;
  }

  const VIRTUAL_ID_MAP = new Map([
    [VIRTUAL_EXTENSIONS_ID, RESOLVED_VIRTUAL_EXTENSIONS_ID],
    [VIRTUAL_SETUP_ID, RESOLVED_VIRTUAL_SETUP_ID],
    [VIRTUAL_CONDITIONS_ID, RESOLVED_VIRTUAL_CONDITIONS_ID],
    [VIRTUAL_REFERENCES_ID, RESOLVED_VIRTUAL_REFERENCES_ID],
  ]);

  const generators = new Map<string, () => string>([
    [
      RESOLVED_VIRTUAL_EXTENSIONS_ID,
      () =>
        generateExtensionsModule(engineFeaturesDir, extensionsDir, extraSlots),
    ],
    [
      RESOLVED_VIRTUAL_SETUP_ID,
      () => generateSetupModule(gameDir, engineRoot, getManifestData()),
    ],
    [
      RESOLVED_VIRTUAL_CONDITIONS_ID,
      () => generateConditionsBundle(engineFeaturesDir, extensionsDir),
    ],
    [
      RESOLVED_VIRTUAL_REFERENCES_ID,
      () =>
        generateReferencesBundle(
          engineFeaturesDir,
          extensionsDir,
          getManifestData(),
        ),
    ],
  ]);

  return {
    name: 'game-plugin',

    onLog(level, log) {
      // virtual:conditions uses `'key' in ns` guards for optional exports.
      // Suppress the spurious Rollup MISSING_EXPORT warnings they generate.
      if (
        level === 'warn' &&
        log.code === 'MISSING_EXPORT' &&
        typeof log.id === 'string' &&
        (log.id === RESOLVED_VIRTUAL_CONDITIONS_ID ||
          log.id === RESOLVED_VIRTUAL_REFERENCES_ID)
      ) {
        return false;
      }
    },

    resolveId(id) {
      const resolved = VIRTUAL_ID_MAP.get(id);
      if (resolved) return resolved;
      const { customModules } = getManifestData();
      if (customModules.has(id)) return RESOLVED_CONTRIB_PREFIX + id;
      return null;
    },

    load(id) {
      const gen = generators.get(id);
      if (gen) return gen();

      if (id.startsWith(RESOLVED_CONTRIB_PREFIX)) {
        const virtualId = id.slice(RESOLVED_CONTRIB_PREFIX.length);
        const { customModules } = getManifestData();
        const entries = customModules.get(virtualId);
        if (entries) return generateContributionModule(entries);
      }

      return null;
    },

    configureServer(server) {
      server.watcher.add(engineFeaturesDir);
      server.watcher.add(extensionsDir);

      server.watcher.on('add', (file) => {
        if (
          path.basename(file) === FEATURE_MANIFEST_FILE &&
          (file.startsWith(engineFeaturesDir) || file.startsWith(extensionsDir))
        ) {
          invalidateManifestCache();
          const extMod = server.moduleGraph.getModuleById(
            RESOLVED_VIRTUAL_EXTENSIONS_ID,
          );
          if (extMod) server.moduleGraph.invalidateModule(extMod);
          const setupMod = server.moduleGraph.getModuleById(
            RESOLVED_VIRTUAL_SETUP_ID,
          );
          if (setupMod) server.moduleGraph.invalidateModule(setupMod);
          // Its requiredDataFiles export derives from the manifests.
          const refMod = server.moduleGraph.getModuleById(
            RESOLVED_VIRTUAL_REFERENCES_ID,
          );
          if (refMod) server.moduleGraph.invalidateModule(refMod);
        }
      });

      server.watcher.on('change', (file) => {
        if (
          file.startsWith(engineFeaturesDir) ||
          file.startsWith(extensionsDir)
        ) {
          if (path.basename(file) === FEATURE_MANIFEST_FILE) {
            // Snapshot custom module IDs before clearing so we can invalidate them
            const oldCustomIds = manifestCache
              ? [...manifestCache.customModules.keys()]
              : [];

            invalidateManifestCache();

            for (const virtualId of oldCustomIds) {
              const mod = server.moduleGraph.getModuleById(
                RESOLVED_CONTRIB_PREFIX + virtualId,
              );
              if (mod) server.moduleGraph.invalidateModule(mod);
            }

            const setupMod = server.moduleGraph.getModuleById(
              RESOLVED_VIRTUAL_SETUP_ID,
            );
            if (setupMod) server.moduleGraph.invalidateModule(setupMod);

            const refMod = server.moduleGraph.getModuleById(
              RESOLVED_VIRTUAL_REFERENCES_ID,
            );
            if (refMod) server.moduleGraph.invalidateModule(refMod);
          }

          const mod = server.moduleGraph.getModuleById(
            RESOLVED_VIRTUAL_EXTENSIONS_ID,
          );
          if (mod) server.moduleGraph.invalidateModule(mod);

          if (file.endsWith(CONDITIONS_FILE)) {
            const condMod = server.moduleGraph.getModuleById(
              RESOLVED_VIRTUAL_CONDITIONS_ID,
            );
            if (condMod) server.moduleGraph.invalidateModule(condMod);
          }

          if (file.endsWith(REFERENCES_FILE)) {
            const refMod = server.moduleGraph.getModuleById(
              RESOLVED_VIRTUAL_REFERENCES_ID,
            );
            if (refMod) server.moduleGraph.invalidateModule(refMod);
          }
        }
        {
          const dataDir = path.join(gameDir, DATA_SUBDIR);
          const {
            setupBindings,
            contentSlots,
            contentExtensions,
            contextSlots,
          } = getManifestData();
          const watchedSetupFiles = new Set([
            ...setupBindings.map(({ binding }) =>
              path.join(dataDir, binding.jsonFile),
            ),
            ...contentSlots.map((s) => path.join(dataDir, s.jsonFile)),
            ...contentExtensions.flatMap(({ ext }) =>
              ext.inputs
                ? ext.inputs.map((i) => path.join(dataDir, i.jsonFile))
                : ext.jsonFile
                  ? [path.join(dataDir, ext.jsonFile)]
                  : [],
            ),
            ...contextSlots.map(({ slot }) =>
              path.join(dataDir, slot.jsonFile),
            ),
          ]);
          if (watchedSetupFiles.has(file)) {
            const mod = server.moduleGraph.getModuleById(
              RESOLVED_VIRTUAL_SETUP_ID,
            );
            if (mod) server.moduleGraph.invalidateModule(mod);
          }
        }
      });
    },
  };
}
