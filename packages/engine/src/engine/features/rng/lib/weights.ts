import type { Weights } from '@sim/engine/features/rng/weights.types';

import { type RNG, buildWeightedCDF, sample } from './rng';

export const normalizeWeights = <K extends string | number>(
  weights: Weights<K>,
): Weights<K> => {
  const entries = Object.entries(weights) as [K, number][];
  const total = entries.reduce((sum, [, w]) => sum + w, 0);

  if (total === 0) return weights;

  const normalized = Object.fromEntries(
    entries.map(([k, v]) => [k, v / total]),
  ) as Weights<K>;

  return Object.freeze(normalized);
};

const combineWeights = <K extends string | number>(
  ...weightMaps: Partial<Weights<K>>[]
): Weights<K> => {
  const result: Partial<Weights<K>> = {};

  for (const map of weightMaps) {
    for (const [key, weight] of Object.entries(map) as [K, number][]) {
      result[key] = (result[key] ?? 0) + weight;
    }
  }
  return result as Weights<K>;
};

const completeWeights = <K extends string | number>(
  allKeys: readonly K[],
  weights: Partial<Weights<K>>,
): Weights<K> => {
  const full: Record<K, number> = {} as Record<K, number>;
  for (const key of allKeys) {
    full[key] = weights[key] ?? 0;
  }
  return full as Weights<K>;
};

export const normalDistribution = <T extends number>(
  min = 0,
  max = 100,
  mean = 50,
  stdDev = 15,
): Weights<T> => {
  const weights = {} as Weights<T>;
  let total = 0;

  for (let x = min; x <= max; x++) {
    // Gaussian distribution curve
    const exponent = -Math.pow(x - mean, 2) / (2 * Math.pow(stdDev, 2));
    const weight = Math.exp(exponent);

    weights[x as T] = weight;
    total += weight;
  }

  // Normalize so sum = 1
  for (let x = min; x <= max; x++) {
    weights[x as T] = weights[x as T] / total;
  }

  return Object.freeze(weights);
};

export class WeightsBuilder<K extends string | number> {
  private readonly layers: Partial<Weights<K>>[] = [];
  private _allKeys?: readonly K[];
  private _shouldNormalize = false;

  static uniform<K extends string | number>(
    keys: readonly K[],
  ): WeightsBuilder<K> {
    const w = 1 / keys.length;
    return new WeightsBuilder<K>().merge(
      Object.fromEntries(keys.map((k) => [k, w])) as Weights<K>,
    );
  }

  merge(...maps: Partial<Weights<K>>[]): this {
    this.layers.push(...maps);
    return this;
  }

  complete(allKeys: readonly K[]): this {
    this._allKeys = allKeys;
    return this;
  }

  normalize(): this {
    this._shouldNormalize = true;
    return this;
  }

  build(): Weights<K> {
    let result: Partial<Weights<K>> = combineWeights(...this.layers);
    if (this._allKeys) result = completeWeights(this._allKeys, result);
    if (this._shouldNormalize) result = normalizeWeights(result as Weights<K>);
    return Object.freeze(result) as Weights<K>;
  }

  pick(rng?: RNG): K {
    return sample(buildWeightedCDF(this.build()), rng);
  }
}
