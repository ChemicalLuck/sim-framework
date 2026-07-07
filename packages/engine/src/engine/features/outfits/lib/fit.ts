import type { BodyAttributes } from '@chemicalluck/engine/types/character.types';
import type { Wearable } from '@chemicalluck/engine/types/item.types';

import { resolveMetric } from './body';
import type {
  EstimatedMetric,
  SizeDimension,
  SizeSystem,
} from './wearable-config';

export interface FitConfig {
  sizeSystems: Record<string, SizeSystem>;
  estimatedMetrics: Record<string, EstimatedMetric>;
}

export interface DimensionFit {
  name: string;
  idealLabel: string;
  chosenLabel: string | undefined;
  /** Signed index distance: <0 too tight/small, >0 too loose/big, 0 ideal. */
  mismatch: number;
}

export interface FitResult {
  sizeless: boolean;
  perDimension: DimensionFit[];
  totalMismatch: number;
  descriptor: string;
}

const SIZELESS: FitResult = {
  sizeless: true,
  perDimension: [],
  totalMismatch: 0,
  descriptor: 'fits',
};

/** Index of the first tier whose `max` covers `value`; the largest tier otherwise. */
export function idealSizeIndex(
  value: number,
  dimension: SizeDimension,
): number {
  const idx = dimension.sizes.findIndex((tier) => value <= tier.max);
  return idx === -1 ? dimension.sizes.length - 1 : idx;
}

type FormatToken =
  | { kind: 'literal'; value: string }
  | { kind: 'dimension'; name: string };

function tokenizeFormat(labelFormat: string): FormatToken[] {
  const tokens: FormatToken[] = [];
  const regex = /\{([^}]+)\}/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(labelFormat)) !== null) {
    if (match.index > last) {
      tokens.push({
        kind: 'literal',
        value: labelFormat.slice(last, match.index),
      });
    }
    tokens.push({ kind: 'dimension', name: match[1] });
    last = regex.lastIndex;
  }
  if (last < labelFormat.length) {
    tokens.push({ kind: 'literal', value: labelFormat.slice(last) });
  }
  return tokens;
}

/** Build a composite label from per-dimension labels via the system's `labelFormat`. */
export function formatSize(
  system: SizeSystem,
  labels: Record<string, string>,
): string {
  return system.labelFormat.replace(/\{([^}]+)\}/g, (_, name: string) =>
    name in labels ? labels[name] : '',
  );
}

/**
 * Split a composite label (e.g. "34B", "32/30", "M") back into per-dimension
 * labels by greedily matching each dimension's known size labels against the
 * `labelFormat`. Returns an empty map if the label cannot be parsed.
 */
export function parseSizeLabel(
  label: string,
  system: SizeSystem,
): Record<string, string> {
  const tokens = tokenizeFormat(system.labelFormat);
  const result: Record<string, string> = {};
  let pos = 0;
  for (const token of tokens) {
    if (token.kind === 'literal') {
      if (!label.startsWith(token.value, pos)) return {};
      pos += token.value.length;
      continue;
    }
    const dimension = system.dimensions.find((d) => d.name === token.name);
    if (!dimension) return {};
    // Prefer the longest matching label to avoid prefix ambiguity (e.g. band "34").
    const candidates = dimension.sizes
      .map((tier) => tier.label)
      .filter((value) => label.startsWith(value, pos))
      .sort((a, b) => b.length - a.length);
    if (candidates.length === 0) return {};
    result[token.name] = candidates[0];
    pos += candidates[0].length;
  }
  return pos === label.length ? result : {};
}

function directionWord(name: string, mismatch: number): string {
  return `${name} ${mismatch < 0 ? 'tight' : 'loose'}`;
}

/**
 * Evaluate how the player's body fits a wearable's chosen size. Sizeless
 * wearables (no `sizeSystem`) report a no-op fit. Otherwise each dimension's
 * ideal size is computed from the player's estimated measurement and compared
 * to the chosen label.
 */
export function evaluateFit(
  wearable: Wearable,
  body: BodyAttributes,
  gender: string | undefined,
  config: FitConfig,
): FitResult {
  if (!wearable.sizeSystem) return SIZELESS;
  const system = config.sizeSystems[wearable.sizeSystem] as
    | SizeSystem
    | undefined;
  if (!system) return SIZELESS;

  const chosen = wearable.size ? parseSizeLabel(wearable.size, system) : {};

  const perDimension: DimensionFit[] = [];
  let totalMismatch = 0;

  for (const dimension of system.dimensions) {
    const value = resolveMetric(
      dimension.metric,
      body,
      gender,
      config.estimatedMetrics,
    );
    const idealIdx = value === undefined ? 0 : idealSizeIndex(value, dimension);
    const idealLabel = dimension.sizes[idealIdx]?.label ?? '';

    const chosenLabel = chosen[dimension.name];
    const chosenIdx = chosenLabel
      ? dimension.sizes.findIndex((tier) => tier.label === chosenLabel)
      : -1;

    const mismatch = chosenIdx === -1 ? 0 : chosenIdx - idealIdx;
    totalMismatch += Math.abs(mismatch);
    perDimension.push({
      name: dimension.name,
      idealLabel,
      chosenLabel,
      mismatch,
    });
  }

  const off = perDimension.filter((d) => d.mismatch !== 0);
  const descriptor =
    off.length === 0
      ? 'fits'
      : off.map((d) => directionWord(d.name, d.mismatch)).join(', ');

  return { sizeless: false, perDimension, totalMismatch, descriptor };
}

/** Size systems previewed as a player's estimated sizes, in display order. */
export const SIZE_PREVIEW_SYSTEMS: { key: string; label: string }[] = [
  { key: 'alpha-tops', label: 'Tops' },
  { key: 'trousers', label: 'Trousers' },
  { key: 'bra', label: 'Bra' },
  { key: 'shoe-uk', label: 'Shoes' },
];

/**
 * Estimated composite size labels for the player's body across the previewed
 * size systems (skipping any system not configured). Used both in character
 * creation and the profile dialog.
 */
export function estimatePlayerSizes(
  body: BodyAttributes,
  gender: string | undefined,
  config: FitConfig,
): { label: string; size: string }[] {
  return SIZE_PREVIEW_SYSTEMS.filter(
    ({ key }) => key in config.sizeSystems,
  ).map(({ key, label }) => ({
    label,
    size: formatSize(
      config.sizeSystems[key],
      idealSizeLabels(config.sizeSystems[key], body, gender, config),
    ),
  }));
}

/** Per-dimension ideal labels for the player's body — used to default the shop dropdowns. */
export function idealSizeLabels(
  system: SizeSystem,
  body: BodyAttributes,
  gender: string | undefined,
  config: FitConfig,
): Record<string, string> {
  const labels: Record<string, string> = {};
  for (const dimension of system.dimensions) {
    const value = resolveMetric(
      dimension.metric,
      body,
      gender,
      config.estimatedMetrics,
    );
    const idx = value === undefined ? 0 : idealSizeIndex(value, dimension);
    labels[dimension.name] = dimension.sizes[idx]?.label ?? '';
  }
  return labels;
}
