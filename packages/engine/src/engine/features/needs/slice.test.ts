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

  it('slows decay toward the bad end during sleep but not recovery', () => {
    configureNeeds({
      needs: { Energy: 100, Drunk: 50, Stress: 50 },
      decayRates: { Energy: 60, Drunk: 60, Stress: -60 },
      options: {
        Drunk: { direction: 'inverse' },
        Stress: { direction: 'inverse' },
      },
    });
    const next = reducer(
      { Energy: 100, Drunk: 50, Stress: 50 },
      decayNeedsByMinutes({ minutes: 10, sleep: true }),
    );
    // Drunk sobers (toward its good end, 0) at the full rate while asleep.
    expect(next.Drunk).toBe(40);
    // Stress rises (toward its bad end, 100) at the slowed sleep rate.
    expect(next.Stress).toBeCloseTo(51);
  });

  it('a negative decay rate makes a need rise over time', () => {
    configureNeeds({
      needs: { Stress: 0 },
      decayRates: { Stress: -30 },
      options: { Stress: { direction: 'inverse' } },
    });
    const next = reducer(
      { Stress: 0 },
      decayNeedsByMinutes({ minutes: 60, sleep: false }),
    );
    expect(next.Stress).toBe(30);
  });

  it('restores an inverse sleep-restore need toward 0', () => {
    configureNeeds({
      needs: { Tiredness: 50 },
      decayRates: { Tiredness: -30 },
      sleepRestoreNeed: 'Tiredness',
      options: { Tiredness: { direction: 'inverse' } },
    });
    const next = reducer(
      { Tiredness: 50 },
      decayNeedsByMinutes({ minutes: 60, sleep: true }),
    );
    expect(next.Tiredness).toBe(0);
  });
});
