export type SlotAggregation =
  | 'keyed-by-name' //     { [featureName]: defaultExport }  → object
  | 'spread-into-object' // ...defaultExport (or ...namespace) → object
  | 'spread-into-array' //  ...defaultExport                  → array
  | 'push-into-array'; //    defaultExport (single item)       → array

export interface FeatureSlotSpec {
  /** Filename to scan for in every feature/extension directory */
  filename: string;
  /** Suffix appended to the feature name to form the import alias, e.g. 'Reducer' → educationReducer */
  aliasPrefix: string;
  importStyle: 'default' | 'namespace';
  aggregation: SlotAggregation;
  /** Which feature scopes this slot applies to */
  appliesTo: 'engine' | 'game' | 'both';
  /** Virtual module this slot's aggregated output is exported from */
  virtualModule: string;
  /** Named export within that virtual module */
  exportName: string;
}

/**
 * NOTE: `conditions.ts` files are scanned by a separate convention outside
 * the slot system. Any feature or extension may export `default` (condition
 * evaluators), `exprEvaluators`, `conditionParsers`, `exprParsers`,
 * `exprKinds`, `conditionSerializers`, or `exprSerializers` from a
 * `conditions.ts` file and they will be merged into `virtual:conditions`
 * automatically — no manifest entry required.
 */

/** A direct file contribution from one specific feature to a virtual module */
export interface FeatureContribution {
  /** Relative path from the feature directory to the contributing file */
  file: string;
  /** Virtual module to generate/augment */
  virtualModule: string;
  /** Export name to use; defaults to the feature's directory name */
  as?: string;
}

/** JSON file → single init call (for optional feature-specific data) */
export interface SetupBinding {
  /** JSON file path relative to game/data/ */
  jsonFile: string;
  /** Skip this binding when the JSON file does not exist */
  optional?: boolean;
  /** Module path relative to the feature directory */
  from: string;
  /** Named export to call, receiving the JSON as the sole argument */
  call: string;
}

/** JSON file → key in the loadContent RawContent bundle */
export interface ContentSlot {
  /** JSON file path relative to game/data/ */
  jsonFile: string;
  /** Key in RawContent / loadContent argument */
  contentKey: string;
  /** If true, skip if the file does not exist */
  optional?: boolean;
}

/** One JSON file contribution to a multi-file ContentExtension bundle */
export interface ContentBundleInput {
  /** JSON file path relative to game/data/ */
  jsonFile: string;
  /** Key under which this file's data is passed to the hydrator */
  inputKey: string;
  optional?: boolean;
}

/**
 * A single JSON file or a bundle of multiple JSON files that produces one
 * entry in `Content.extensions`. Use `jsonFile` for a single source file and
 * `inputs` for multiple. When a hydrator is supplied it receives the raw data
 * and returns the hydrated value; without one the data passes through as-is.
 */
export interface ContentExtension {
  /** Key in Content.extensions */
  contentKey: string;
  /** Single source file (mutually exclusive with inputs) */
  jsonFile?: string;
  /** Multiple input files for bundle hydration (mutually exclusive with jsonFile) */
  inputs?: ContentBundleInput[];
  optional?: boolean;
  /** Module path relative to the feature directory */
  hydratorFrom?: string;
  /** Named export to call: (data, ctx) => hydratedValue */
  hydratorCall?: string;
}

/**
 * Single JSON file that populates HydrationContext before scene/script hydration.
 * Used for content that must be resolved by effect hydrators (e.g. shops).
 */
export interface ContextSlot {
  /** JSON file path relative to game/data/ */
  jsonFile: string;
  /** Key in HydrationContext to populate */
  contextKey: string;
  optional?: boolean;
  /** Module path relative to the feature directory */
  hydratorFrom: string;
  /** Named export to call: (data, ctx) => HydrationContext[contextKey] */
  hydratorCall: string;
}

/** Post-loadContent call that receives a Content key as sole argument */
export interface ContentSetupBinding {
  /** Key to read from Content or Content.extensions */
  contentKey: string;
  /** Module path relative to the feature directory */
  from: string;
  /** Named export to call */
  call: string;
  /**
   * Where to read the value from:
   *   'root'       → content[contentKey]
   *   'extensions' → content.extensions[contentKey]  (default)
   */
  source?: 'root' | 'extensions';
}

/**
 * Shape of a feature's `feature.json` manifest.
 *
 * `contributions`   — direct file contributions from this feature only:
 *                     the plugin generates or augments the target virtual module
 *                     with this feature's file as a named export.
 *
 * `setup`           — declares JSON data files and the init function to call
 *                     with each, generating entries in virtual:game-setup.
 *
 * `content`         — declares which JSON files map to keys in RawContent for
 *                     the loadContent call.
 *
 * `contentExtensions` — each entry maps one JSON file (or a bundle of files)
 *                     to a key in Content.extensions via an optional hydrator.
 *
 * `contextSlots`    — populates HydrationContext before scene hydration.
 *
 * `contentSetup`    — declares post-loadContent calls that receive a Content key.
 *
 * NOTE: `slots` are not declared in feature.json. The engine's built-in
 * scanning conventions (slice.ts, effects.ts, views.tsx, etc.) are hardcoded
 * in the game-plugin. Use `GamePluginOptions.extraSlots` to add custom ones.
 */
export interface FeatureManifest {
  contributions?: FeatureContribution[];
  setup?: SetupBinding[];
  content?: ContentSlot[];
  contentExtensions?: ContentExtension[];
  contextSlots?: ContextSlot[];
  contentSetup?: ContentSetupBinding[];
}
