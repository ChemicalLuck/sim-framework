import { getMacros, getTerms } from '@chemicalluck/engine/features/linguistics/lib/config';
import { buildEntityVars } from '@chemicalluck/engine/features/linguistics/lib/context';
import {
  type TemplateContext,
  renderSentences,
} from '@chemicalluck/engine/features/linguistics/lib/template';
import type { Pronouns } from '@chemicalluck/engine/features/npcs/types';
import {
  type RNG,
  buildWeightedCDF,
  sample,
} from '@chemicalluck/engine/features/rng/lib/rng';
import {
  normalDistribution,
  normalizeWeights,
} from '@chemicalluck/engine/features/rng/lib/weights';
import type { Weights } from '@chemicalluck/engine/features/rng/weights.types';
import type { BodyAttributes, CharacterProfile } from '@chemicalluck/engine/types';

// ── JSON schema ───────────────────────────────────────────────────────────────

export interface AppearanceFeatureDefinition {
  id: string;
  label: string;
  values: string[];
  weights: {
    default?: Record<string, number>;
    by?: Record<string, Record<string, Record<string, number>>>;
  };
  isDimension?: boolean;
  pronouns?: Record<string, Pronouns>;
  showWhen?: { featureId: string; values: string[] };
}

export interface AppearanceDisplayConfig {
  strangerFeatureIds: string[];
  metaFeatureIds: string[];
}

/** Sentence templates for the full prose description of a character (see `describeAppearance`). */
export interface AppearanceDescriptionConfig {
  sentences: string[];
}

export interface NormalDistParams {
  min: number;
  max: number;
  mean: number;
  stdDev: number;
}

/**
 * A single named body measurement (height, weight, …) defined entirely in
 * data. The player UI, NPC generator, and templates all derive from these.
 * Distributions can vary per appearance dimension (e.g. gender) with sparse
 * `Partial<NormalDistParams>` overrides that inherit missing fields from the
 * default. `showWhen` gates whether the attribute applies to a given
 * character (e.g. `bustDifference` only for `gender: Female`).
 */
export interface BodyAttributeDefinition {
  id: string;
  label: string;
  unit: string;
  default: number;
  showWhen?: { featureId: string; values: string[] };
  distribution: {
    default: NormalDistParams;
    byDimension?: Record<string, Record<string, Partial<NormalDistParams>>>;
  };
}

export interface AppearanceJsonData {
  features: AppearanceFeatureDefinition[];
  ageDistribution: NormalDistParams;
  bodyAttributes: BodyAttributeDefinition[];
  display: AppearanceDisplayConfig;
  description?: AppearanceDescriptionConfig;
}

// ── Runtime types ─────────────────────────────────────────────────────────────

export interface FeatureRuntime {
  id: string;
  label: string;
  values: readonly string[];
  isDimension: boolean;
  defaultWeights: Record<string, number>;
  byDimension: Record<string, Record<string, Record<string, number>>>;
  pronouns?: Record<string, Pronouns>;
  showWhen?: { featureId: string; values: string[] };
}

export interface BodyAttributeRuntime extends BodyAttributeDefinition {
  /** Discrete-normal CDF for the default distribution. */
  defaultWeights: Weights<number>;
  /** Pre-built CDFs keyed by [dimensionId][dimensionValue]. */
  byDimensionWeights: Record<string, Record<string, Weights<number>>>;
}

export interface AppearanceWeightTables {
  features: FeatureRuntime[];
  dimensionIds: string[];
  pronounFeatureId: string | undefined;
  display: AppearanceDisplayConfig;
  description: AppearanceDescriptionConfig;
  ages: Weights<number>;
  bodyAttributes: BodyAttributeRuntime[];
}

export type AppearanceLists = {
  id: string;
  label: string;
  values: readonly string[];
  showWhen?: { featureId: string; values: string[] };
}[];

// ── Module state ──────────────────────────────────────────────────────────────

let _lists: AppearanceLists | null = null;
let _tables: AppearanceWeightTables | null = null;

// ── Configuration ─────────────────────────────────────────────────────────────

export function configureAppearance(data: AppearanceJsonData): void {
  const features: FeatureRuntime[] = data.features.map((def) => ({
    id: def.id,
    label: def.label,
    values: def.values,
    isDimension: def.isDimension ?? false,
    defaultWeights: normalizeWeights(
      def.weights.default ?? buildUniform(def.values),
    ),
    byDimension: Object.fromEntries(
      Object.entries(def.weights.by ?? {}).map(([dimId, dimMap]) => [
        dimId,
        Object.fromEntries(
          Object.entries(dimMap).map(([dimVal, w]) => [
            dimVal,
            normalizeWeights(w),
          ]),
        ),
      ]),
    ),
    pronouns: def.pronouns,
    showWhen: def.showWhen,
  }));

  _lists = features.map(({ id, label, values, showWhen }) => ({
    id,
    label,
    values,
    showWhen,
  }));

  const pronounFeatureId = features.find((f) => f.pronouns !== undefined)?.id;

  const ageDist = data.ageDistribution;

  _tables = {
    features,
    dimensionIds: features.filter((f) => f.isDimension).map((f) => f.id),
    pronounFeatureId,
    display: data.display,
    description: data.description ?? { sentences: [] },
    ages: normalDistribution(
      ageDist.min,
      ageDist.max,
      ageDist.mean,
      ageDist.stdDev,
    ) as unknown as Weights<number>,
    bodyAttributes: buildBodyRuntime(data.bodyAttributes),
  };
}

function buildUniform(values: string[]): Record<string, number> {
  return Object.fromEntries(values.map((v) => [v, 1]));
}

function buildBodyRuntime(
  defs: BodyAttributeDefinition[],
): BodyAttributeRuntime[] {
  return defs.map((def) => {
    const { default: base, byDimension = {} } = def.distribution;
    const defaultWeights = normalDistribution(
      base.min,
      base.max,
      base.mean,
      base.stdDev,
    ) as unknown as Weights<number>;
    const byDimensionWeights: Record<
      string,
      Record<string, Weights<number>>
    > = {};
    for (const [dimId, dimMap] of Object.entries(byDimension)) {
      byDimensionWeights[dimId] = {};
      for (const [dimVal, partial] of Object.entries(dimMap)) {
        byDimensionWeights[dimId][dimVal] = normalDistribution(
          partial.min ?? base.min,
          partial.max ?? base.max,
          partial.mean ?? base.mean,
          partial.stdDev ?? base.stdDev,
        ) as unknown as Weights<number>;
      }
    }
    return { ...def, defaultWeights, byDimensionWeights };
  });
}

// ── Accessors ─────────────────────────────────────────────────────────────────

export function getAppearanceLists(): AppearanceLists {
  return _lists ?? [];
}

export function getAppearanceWeights(): AppearanceWeightTables {
  if (!_tables) {
    throw new Error(
      'Appearance not configured — call configureAppearance() during game setup.',
    );
  }
  return _tables;
}

export function getAppearanceDisplay(): AppearanceDisplayConfig {
  return _tables?.display ?? { strangerFeatureIds: [], metaFeatureIds: [] };
}

export function getAppearanceDescriptionTemplate(): AppearanceDescriptionConfig {
  return _tables?.description ?? { sentences: [] };
}

export function getBodyAttributes(): BodyAttributeRuntime[] {
  return _tables?.bodyAttributes ?? [];
}

/** True when the attribute applies to the given appearance (no `showWhen`, or `showWhen` matches). */
export function isBodyAttributeVisible(
  def: Pick<BodyAttributeDefinition, 'showWhen'>,
  appearance: Record<string, string>,
): boolean {
  if (!def.showWhen) return true;
  if (!(def.showWhen.featureId in appearance)) return false;
  return def.showWhen.values.includes(appearance[def.showWhen.featureId]);
}

/**
 * Sample a fresh BodyAttributes for a character using the configured per-
 * attribute distributions. For each attribute the first matching dimension
 * override (in `dimensionIds` order) is used; otherwise the default. Gated
 * attributes (`showWhen` not satisfied) get `0`.
 */
export function sampleBody(
  rng: RNG,
  appearance: Record<string, string>,
): BodyAttributes {
  const tables = getAppearanceWeights();
  const body: BodyAttributes = {};
  for (const attr of tables.bodyAttributes) {
    if (!isBodyAttributeVisible(attr, appearance)) {
      body[attr.id] = 0;
      continue;
    }
    let cdf = attr.defaultWeights;
    for (const dimId of tables.dimensionIds) {
      if (!(dimId in appearance)) continue;
      const dimMap = attr.byDimensionWeights[dimId];
      if (!(dimMap as unknown)) continue;
      const dimVal = appearance[dimId];
      if (!(dimVal in dimMap)) continue;
      cdf = dimMap[dimVal];
      break;
    }
    // `sample` returns Object.keys() strings even for numeric keys; coerce.
    body[attr.id] = +(sample(buildWeightedCDF(cdf), rng) as unknown as string);
  }
  return body;
}

// ── Description generation ──────────────────────────────────────────────────────

export const DEFAULT_PRONOUNS: Pronouns = {
  subject: 'they',
  object: 'them',
  possessive: 'their',
  reflexive: 'themself',
  noun: 'person',
};

/** Resolve a character's pronouns from the configured pronoun feature, falling back to neutral. */
export function resolvePronouns(appearance: Record<string, string>): Pronouns {
  const config = getAppearanceWeights();
  if (!config.pronounFeatureId) return DEFAULT_PRONOUNS;
  const value = appearance[config.pronounFeatureId];
  const feature = config.features.find((f) => f.id === config.pronounFeatureId);
  if (value && feature?.pronouns?.[value]) return feature.pronouns[value];
  return DEFAULT_PRONOUNS;
}

export interface DescribeOptions {
  body?: BodyAttributes;
  /** Global narrative variables (weather, timeOfDay, totalNearbyNpcs, …). */
  vars?: Record<string, string | number>;
  /** Player's per-term wording overrides (raw comma-separated strings). */
  wordChoices?: Record<string, string>;
  /** Seed making `{word:…}` picks deterministic (game seed for the player, npc id for NPCs). */
  seed?: string | number;
}

/**
 * Build a full prose description of a character from the configured sentence
 * templates. Variables available to the templates are the character's `age`,
 * body attributes (`height`, `weight`, `bodyFat`, `bustDifference`), appearance
 * feature values, and any global `vars` passed in. Rendering (tokens,
 * conditionals, `{@macro}`, `{word:key}`) is delegated to the shared linguistics
 * engine. Returns '' when no templates are configured.
 */
export function describeAppearance(
  profile: CharacterProfile,
  opts: DescribeOptions = {},
): string {
  const { sentences } = getAppearanceDescriptionTemplate();
  if (sentences.length === 0) return '';

  const ctx: TemplateContext = {
    vars: {
      ...buildEntityVars('', {
        profile,
        body: opts.body,
        pronouns: { ...resolvePronouns(profile.appearance) },
      }),
      ...opts.vars,
    },
    wordChoices: opts.wordChoices ?? {},
    seed: opts.seed ?? '',
    macros: getMacros(),
    terms: getTerms(),
  };
  return renderSentences(sentences, ctx);
}
