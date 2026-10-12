import { afterEach, describe, expect, it, vi } from 'vitest';

import type { EffectContext } from '@chemicalluck/sim-engine/features/core/types';
import { configureCurrency } from '@chemicalluck/sim-engine/features/money/lib/currency';
import type { RootState } from '@chemicalluck/sim-engine/state/store';
import type { InventoryItem } from '@chemicalluck/sim-engine/types/item.types';

import { handlePurchaseEffect } from './effects';
import type { PurchaseEffect } from './types';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const item: InventoryItem = {
  kind: 'item',
  id: 'apple',
  name: 'Apple',
  value: 50,
};

interface DispatchedAction {
  type: string;
  payload?: unknown;
  meta?: unknown;
}

function makeContext(balance: number) {
  const dispatch = vi.fn<(action: DispatchedAction) => void>();
  const ctx = {
    dispatch,
    group: 'g',
    prevState: { present: { money: balance } } as RootState,
    effects: [],
  } as unknown as EffectContext;
  return { dispatch, ctx };
}

const effect: PurchaseEffect = { kind: 'purchase', item, cost: 50 };

describe('purchase effect', () => {
  it('grants the item and deducts money when affordable', () => {
    const { dispatch, ctx } = makeContext(100);
    handlePurchaseEffect(effect, ctx);

    expect(dispatch).toHaveBeenCalledTimes(2);
    const [deposit, money] = dispatch.mock.calls.map((c) => c[0]);
    expect(deposit).toMatchObject({
      type: 'containers/depositItem',
      payload: { containerId: 'player', item },
      meta: { group: 'g' },
    });
    expect(money).toMatchObject({
      type: 'money/increaseMoneyByAmount',
      payload: -50,
      meta: { group: 'g' },
    });
  });

  it('rejects the purchase when funds are insufficient', () => {
    const { dispatch, ctx } = makeContext(10);
    handlePurchaseEffect(effect, ctx);
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('allows a purchase that spends the exact balance', () => {
    const { dispatch, ctx } = makeContext(50);
    handlePurchaseEffect(effect, ctx);
    expect(dispatch).toHaveBeenCalledTimes(2);
  });

  describe('with a credit floor', () => {
    afterEach(() => {
      configureCurrency({});
    });

    it('allows a purchase into the overdraft above the floor', () => {
      configureCurrency({ creditFloor: -1000 });
      const { dispatch, ctx } = makeContext(-350);
      handlePurchaseEffect(effect, ctx);
      expect(dispatch).toHaveBeenCalledTimes(2);
      expect(dispatch.mock.calls[1]?.[0]).toMatchObject({ payload: -50 });
    });

    it('allows a purchase that lands exactly on the floor', () => {
      configureCurrency({ creditFloor: -1000 });
      const { dispatch, ctx } = makeContext(-950);
      handlePurchaseEffect(effect, ctx);
      expect(dispatch).toHaveBeenCalledTimes(2);
    });

    it('rejects a purchase that would go below the floor', () => {
      configureCurrency({ creditFloor: -1000 });
      const { dispatch, ctx } = makeContext(-951);
      handlePurchaseEffect(effect, ctx);
      expect(dispatch).not.toHaveBeenCalled();
    });

    it('resets to a floor of 0 when the config omits it', () => {
      configureCurrency({ creditFloor: -1000 });
      configureCurrency({});
      const { dispatch, ctx } = makeContext(49);
      handlePurchaseEffect(effect, ctx);
      expect(dispatch).not.toHaveBeenCalled();
    });
  });
});
