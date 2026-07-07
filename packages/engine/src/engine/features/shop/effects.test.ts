import { describe, expect, it, vi } from 'vitest';
import type { EffectContext } from '@chemicalluck/engine/features/core/types';
import type { RootState } from '@chemicalluck/engine/state/store';
import type { InventoryItem } from '@chemicalluck/engine/types/item.types';

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
});
