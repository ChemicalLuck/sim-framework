import { describe, expect, it } from 'vitest';
import type { RootState } from '@chemicalluck/sim-engine/state/store';

import { selectTimeOfDay } from './selectors';

/** Minimal RootState carrying a timestamp at the given local hour. */
const stateAtHour = (hour: number): RootState =>
  ({
    present: {
      time: { timestamp: new Date(2026, 0, 1, hour, 0, 0).getTime() },
    },
  }) as unknown as RootState;

describe('selectTimeOfDay', () => {
  it('buckets the hour into a part-of-day label', () => {
    expect(selectTimeOfDay(stateAtHour(7))).toBe('morning');
    expect(selectTimeOfDay(stateAtHour(11))).toBe('morning');
    expect(selectTimeOfDay(stateAtHour(12))).toBe('afternoon');
    expect(selectTimeOfDay(stateAtHour(16))).toBe('afternoon');
    expect(selectTimeOfDay(stateAtHour(17))).toBe('evening');
    expect(selectTimeOfDay(stateAtHour(20))).toBe('evening');
    expect(selectTimeOfDay(stateAtHour(21))).toBe('night');
    expect(selectTimeOfDay(stateAtHour(3))).toBe('night');
  });
});
