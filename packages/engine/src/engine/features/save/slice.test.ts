import { describe, expect, it } from 'vitest';

import reducer, { startRun } from './slice';

describe('save slice', () => {
  it('starts as a normal run', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual({ ironman: false });
  });

  it('records the run mode chosen at New Game', () => {
    expect(reducer(undefined, startRun({ ironman: true })).ironman).toBe(true);
    expect(
      reducer({ ironman: true }, startRun({ ironman: false })).ironman,
    ).toBe(false);
  });
});

describe('selectIronman', () => {
  it('treats saves without the save slice as normal runs', async () => {
    const { selectIronman } = await import('./selectors');
    expect(selectIronman({ present: {} } as never)).toBe(false);
  });
});
