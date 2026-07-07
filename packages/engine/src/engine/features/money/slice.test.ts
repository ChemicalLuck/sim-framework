import { describe, expect, it } from 'vitest';

import reducer, { configureMoney, increaseMoneyByAmount } from './slice';

describe('money slice', () => {
  it('starts at the configured initial amount', () => {
    configureMoney(50);
    expect(reducer(undefined, { type: '@@INIT' })).toBe(50);
  });

  it('increases by the payload amount', () => {
    const state = reducer(10, increaseMoneyByAmount(5));
    expect(state).toBe(15);
  });

  it('accepts negative payloads (decreasing money)', () => {
    const state = reducer(10, increaseMoneyByAmount(-3));
    expect(state).toBe(7);
  });
});
