import { describe, expect, it } from 'vitest';

import reducer, {
  configureNeeds,
  decayNeedsByMinutes,
  increaseNeedByAmount,
} from './slice';

const CONFIG = {
  needs: { Energy: 100, Hunger: 100 },
  decayRates: { Energy: 60, Hunger: 60 },
  sleepRestoreNeed: 'Energy',
};

describe('needs slice', () => {
  it('seeds initial state from the configured needs', () => {
    configureNeeds(CONFIG);
    expect(reducer(undefined, { type: '@@INIT' })).toEqual({
      Energy: 100,
      Hunger: 100,
    });
  });

  it('increaseNeedByAmount adds to an existing need and clamps to 100', () => {
    configureNeeds(CONFIG);
    const next = reducer(
      { Energy: 95, Hunger: 50 },
      increaseNeedByAmount({ need: 'Energy', amount: 10 }),
    );
    expect(next.Energy).toBe(100);
    expect(next.Hunger).toBe(50);
  });

  it('increaseNeedByAmount clamps at 0 for negative amounts', () => {
    configureNeeds(CONFIG);
    const next = reducer(
      { Energy: 5, Hunger: 100 },
      increaseNeedByAmount({ need: 'Energy', amount: -10 }),
    );
    expect(next.Energy).toBe(0);
  });

  it('increaseNeedByAmount is a no-op for unknown needs', () => {
    configureNeeds(CONFIG);
    const before = { Energy: 50, Hunger: 50 };
    const after = reducer(
      before,
      increaseNeedByAmount({ need: 'Unknown', amount: 10 }),
    );
    expect(after).toEqual(before);
  });

  it('decayNeedsByMinutes decreases needs when awake', () => {
    configureNeeds(CONFIG);
    const next = reducer(
      { Energy: 100, Hunger: 100 },
      decayNeedsByMinutes({ minutes: 60, sleep: false }),
    );
    expect(next.Energy).toBe(40);
    expect(next.Hunger).toBe(40);
  });

  it('decayNeedsByMinutes restores the sleep-restore need during sleep', () => {
    configureNeeds(CONFIG);
    const next = reducer(
      { Energy: 20, Hunger: 100 },
      decayNeedsByMinutes({ minutes: 60, sleep: true }),
    );
    expect(next.Energy).toBeGreaterThan(20);
    expect(next.Hunger).toBeLessThan(100);
  });
});
