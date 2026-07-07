import { describe, expect, it } from 'vitest';

import reducer, {
  advanceTimeByMinutes,
  configureGameStart,
  setGameStartFromISO,
} from './slice';

describe('time slice', () => {
  it('initial state uses the configured game start', () => {
    configureGameStart(1_000_000);
    expect(reducer(undefined, { type: '@@INIT' })).toEqual({
      timestamp: 1_000_000,
    });
  });

  it('setGameStartFromISO updates the configured game start', () => {
    setGameStartFromISO('2026-01-01T00:00:00Z');
    const expected = new Date('2026-01-01T00:00:00Z').getTime();
    expect(reducer(undefined, { type: '@@INIT' })).toEqual({
      timestamp: expected,
    });
  });

  it('advanceTimeByMinutes adds minutes converted to milliseconds', () => {
    const next = reducer({ timestamp: 0 }, advanceTimeByMinutes(30));
    expect(next.timestamp).toBe(30 * 60 * 1000);
  });

  it('advanceTimeByMinutes accepts negative amounts', () => {
    const next = reducer(
      { timestamp: 60 * 60 * 1000 },
      advanceTimeByMinutes(-30),
    );
    expect(next.timestamp).toBe(30 * 60 * 1000);
  });
});
