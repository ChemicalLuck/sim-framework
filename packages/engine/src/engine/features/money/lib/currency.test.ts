import { afterEach, describe, expect, it } from 'vitest';

import { canAfford, configureCurrency, getCreditFloor } from './currency';

describe('credit floor', () => {
  afterEach(() => {
    configureCurrency({});
  });

  it('defaults to 0', () => {
    expect(getCreditFloor()).toBe(0);
    expect(canAfford(50, 50)).toBe(true);
    expect(canAfford(49, 50)).toBe(false);
  });

  it('lets spending go down to a configured negative floor', () => {
    configureCurrency({ creditFloor: -1000 });
    expect(getCreditFloor()).toBe(-1000);
    expect(canAfford(100, 500)).toBe(true); // → -400
    expect(canAfford(0, 1000)).toBe(true); // → -1000
    expect(canAfford(0, 1001)).toBe(false); // → -1001
  });
});
