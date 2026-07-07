import { describe, expect, it } from 'vitest';

import reducer, { initGameSeed, setGameSeed } from './slice';

describe('rng slice', () => {
  it('starts with seed 0', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual({ seed: 0 });
  });

  it('setGameSeed stores the supplied seed', () => {
    const next = reducer({ seed: 0 }, setGameSeed(42));
    expect(next.seed).toBe(42);
  });

  it('initGameSeed sets a non-zero seed', () => {
    const next = reducer({ seed: 0 }, initGameSeed());
    expect(next.seed).toBeGreaterThan(0);
  });

  it('REHYDRATE restores the seed from persisted state', () => {
    const next = reducer(
      { seed: 0 },
      {
        type: 'persist/REHYDRATE',
        key: 'root',
        payload: { present: { rng: { seed: 123 } } },
      },
    );
    expect(next.seed).toBe(123);
  });

  it('REHYDRATE ignores payloads for other persist keys', () => {
    const next = reducer(
      { seed: 7 },
      {
        type: 'persist/REHYDRATE',
        key: 'other',
        payload: { present: { rng: { seed: 999 } } },
      },
    );
    expect(next.seed).toBe(7);
  });
});
