import type { Weights } from '@chemicalluck/sim-engine/features/rng/weights.types';

export interface RNG {
  next(): number; // returns [0, 1)
}

export class Mulberry32 implements RNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}

export const cryptoRNG: RNG = { next: () => Math.random() };

let _worldState: number = (Date.now() * Math.random()) >>> 0;

export function initWorldRng(seed: number): void {
  _worldState = seed >>> 0;
}

export const worldRng: RNG = {
  next(): number {
    let t = (_worldState += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  },
};

function fnv1a(str: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function subRng(masterSeed: number, namespace: string): Mulberry32 {
  return new Mulberry32((masterSeed ^ fnv1a(namespace)) >>> 0);
}

export interface WeightedCDF<K extends string | number> {
  keys: K[];
  thresholds: number[]; // normalised cumulative probabilities, last entry is 1
}

/** Precompute a normalised CDF for O(log n) weighted sampling */
export function buildWeightedCDF<K extends string | number>(
  weights: Weights<K>,
): WeightedCDF<K> {
  const keys = Object.keys(weights) as K[];
  const total = keys.reduce((sum, k) => sum + weights[k], 0);
  if (total <= 0) throw new Error('Weights must sum to a positive number');
  let cumulative = 0;
  const thresholds = keys.map((k) => {
    cumulative += weights[k] / total;
    return cumulative;
  });
  thresholds[thresholds.length - 1] = 1;
  return { keys, thresholds };
}

/** Sample a key from a weighted CDF using binary search */
export function sample<K extends string | number>(
  { keys, thresholds }: WeightedCDF<K>,
  rng: RNG = cryptoRNG,
): K {
  const r = rng.next();
  let lo = 0;
  let hi = thresholds.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (r <= thresholds[mid]) hi = mid;
    else lo = mid + 1;
  }
  return keys[lo];
}
