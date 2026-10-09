import type { NeedOptions, NeedThreshold } from '../types';

export type NeedThresholds = Record<string, NeedThreshold[] | undefined>;

let _thresholds: NeedThresholds = {};

export function configureNeedThresholds(thresholds: NeedThresholds) {
  _thresholds = thresholds;
}

export function getNeedThresholds(): NeedThresholds {
  return _thresholds;
}

/**
 * Thresholds crossed between two snapshots of the needs. A threshold is
 * crossed when the value moves from strictly before `at` to `at` or beyond, in
 * the threshold's direction.
 */
export function crossedThresholds(
  prev: Record<string, number>,
  next: Record<string, number>,
  thresholds: NeedThresholds,
  options: Record<string, Pick<NeedOptions, 'direction'> | undefined>,
): NeedThreshold[] {
  const crossed: NeedThreshold[] = [];
  for (const [need, list] of Object.entries(thresholds)) {
    const before = prev[need] as number | undefined;
    const after = next[need] as number | undefined;
    if (before === undefined || after === undefined || !list) continue;
    const inverse = options[need]?.direction === 'inverse';
    for (const t of list) {
      const when = t.when ?? (inverse ? 'rising' : 'falling');
      const hit =
        when === 'falling'
          ? before > t.at && after <= t.at
          : before < t.at && after >= t.at;
      if (hit) crossed.push(t);
    }
  }
  return crossed;
}
