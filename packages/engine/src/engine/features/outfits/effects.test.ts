import { describe, expect, it, vi } from 'vitest';
import type { EffectContext } from '@sim/engine/features/core/types';
import type { RootState } from '@sim/engine/state/store';
import type { Equipment } from '@sim/engine/types/character.types';
import type { Wearable } from '@sim/engine/types/item.types';

import { handleApplyOutfitEffect } from './effects';
import type { ApplyOutfitEffect, Outfit } from './types';

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));

const hat: Wearable = {
  kind: 'wearable',
  id: 'hat',
  name: 'Hat',
  slot: 'hat',
  appearance: {},
};
const shoes: Wearable = {
  kind: 'wearable',
  id: 'shoes',
  name: 'Shoes',
  slot: 'shoes',
  appearance: {},
};

const outfit: Outfit = {
  name: 'Casual',
  equipment: { hat, shoes, bra: null } as unknown as Equipment,
};

interface DispatchedAction {
  type: string;
  payload?: unknown;
  meta?: unknown;
}

function makeContext(outfits: Outfit[]) {
  const dispatch = vi.fn<(action: DispatchedAction) => void>();
  const ctx = {
    dispatch,
    group: 'g',
    prevState: { present: { outfits } } as RootState,
    effects: [],
  } as unknown as EffectContext;
  return { dispatch, ctx };
}

const effect: ApplyOutfitEffect = { kind: 'applyOutfit', name: 'Casual' };

describe('applyOutfit effect', () => {
  it('equips each non-null wearable in the outfit', () => {
    const { dispatch, ctx } = makeContext([outfit]);
    handleApplyOutfitEffect(effect, ctx);

    expect(dispatch).toHaveBeenCalledTimes(2);
    const payloads = dispatch.mock.calls.map((c) => c[0].payload);
    expect(payloads).toContainEqual(hat);
    expect(payloads).toContainEqual(shoes);
    for (const call of dispatch.mock.calls) {
      expect(call[0]).toMatchObject({
        type: 'player/equipItem',
        meta: { group: 'g' },
      });
    }
  });

  it('is a no-op for an unknown outfit name', () => {
    const { dispatch, ctx } = makeContext([outfit]);
    handleApplyOutfitEffect({ kind: 'applyOutfit', name: 'Nope' }, ctx);
    expect(dispatch).not.toHaveBeenCalled();
  });
});
