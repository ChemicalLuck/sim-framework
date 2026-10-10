import { describe, expect, it } from 'vitest';

import reducer, { initGameSeed, setGameSeed, syncRngState } from './slice';

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

  it('setGameSeed resets the sequence position to the seed', () => {
    const next = reducer({ seed: 1, state: 99 }, setGameSeed(42));
    expect(next.state).toBe(42);
  });

  it('syncRngState records the sequence position', () => {
    const next = reducer({ seed: 42 }, syncRngState(12345));
    expect(next).toEqual({ seed: 42, state: 12345 });
  });

  it('REHYDRATE restores the saved sequence position', () => {
    const next = reducer(
      { seed: 0 },
      {
        type: 'persist/REHYDRATE',
        key: 'root',
        payload: { present: { rng: { seed: 123, state: 456 } } },
      },
    );
    expect(next).toEqual({ seed: 123, state: 456 });
  });

  it('REHYDRATE starts at the seed for saves without a position', () => {
    const next = reducer(
      { seed: 0, state: 77 },
      {
        type: 'persist/REHYDRATE',
        key: 'root',
        payload: { present: { rng: { seed: 123 } } },
      },
    );
    expect(next).toEqual({ seed: 123, state: 123 });
  });
});
