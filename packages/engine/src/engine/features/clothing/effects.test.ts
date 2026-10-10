import type { UnknownAction } from '@reduxjs/toolkit';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { EffectContext } from '@chemicalluck/sim-engine/features/core/types';
import type { RootState } from '@chemicalluck/sim-engine/state/store';
import type { Wearable } from '@chemicalluck/sim-engine/types/item.types';

import type { WearableConditionEffect } from './effect-types';
import { handleWearableConditionEffect } from './effects';
import reducer from './slice';
import type { ClothingState } from './types';

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));

const shirt: Wearable = {
  kind: 'wearable',
  id: 'shirt',
  instanceId: 'shirt-1',
  name: 'Shirt',
  slot: 'baselayer',
  appearance: {},
};
const pants: Wearable = {
  kind: 'wearable',
  id: 'pants',
  instanceId: 'pants-1',
  name: 'Pants',
  slot: 'legwear',
  appearance: {},
};

interface DispatchedAction {
  type: string;
  payload?: unknown;
  meta?: unknown;
}

/** Runs the effect and folds every dispatched action through the reducer. */
function run(effect: WearableConditionEffect, clothing: ClothingState) {
  const dispatch = vi.fn<(action: DispatchedAction) => void>();
  const ctx = {
    dispatch,
    group: 'g',
    prevState: {
      present: {
        player: { equipment: { baselayer: shirt } },
        containers: { player: [pants] },
        clothing,
      },
    } as unknown as RootState,
    effects: [],
  } as unknown as EffectContext;
  handleWearableConditionEffect(effect, ctx);
  return dispatch.mock.calls
    .map((c) => c[0])
    .reduce((s, a) => reducer(s, a as UnknownAction), clothing);
}

const worn = (): ClothingState => ({
  'shirt-1': { isWet: false, isDirty: false, wearMinutes: 30 },
  'pants-1': { isWet: true, isDirty: true, wearMinutes: 600 },
});

const toastCount = () =>
  vi.mocked(toast.success).mock.calls.length +
  vi.mocked(toast).mock.calls.length;

describe('wearable_condition effect', () => {
  beforeEach(() => {
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast).mockClear();
  });

  it('resets every wearable when set is omitted', () => {
    const next = run({ kind: 'wearable_condition', target: '*' }, worn());
    expect(next['shirt-1']).toEqual({
      isWet: false,
      isDirty: false,
      wearMinutes: 0,
    });
    expect(next['pants-1']).toEqual({
      isWet: false,
      isDirty: false,
      wearMinutes: 0,
    });
    expect(toast.success).toHaveBeenCalledWith('Clothes laundered!');
  });

  it('sets wet on the targeted wearable only, keeping other fields', () => {
    const next = run(
      { kind: 'wearable_condition', target: 'shirt', set: { wet: true } },
      worn(),
    );
    expect(next['shirt-1']).toEqual({
      isWet: true,
      isDirty: false,
      wearMinutes: 30,
    });
    expect(next['pants-1']).toEqual(worn()['pants-1']);
  });

  it('sets dirty on all wearables', () => {
    const next = run(
      { kind: 'wearable_condition', target: '*', set: { dirty: true } },
      worn(),
    );
    expect(next['shirt-1']?.isDirty).toBe(true);
    expect(next['shirt-1']?.wearMinutes).toBe(30);
    expect(next['pants-1']?.isDirty).toBe(true);
    expect(next['pants-1']?.isWet).toBe(true);
  });

  it('sets wearMinutes and can clear dirty without drying', () => {
    const next = run(
      {
        kind: 'wearable_condition',
        target: 'pants',
        set: { dirty: false, wearMinutes: 0 },
      },
      worn(),
    );
    expect(next['pants-1']).toEqual({
      isWet: true,
      isDirty: false,
      wearMinutes: 0,
    });
  });

  it('seeds untracked wearables before applying set', () => {
    const next = run(
      { kind: 'wearable_condition', target: 'shirt', set: { wet: true } },
      {},
    );
    expect(next['shirt-1']).toEqual({
      isWet: true,
      isDirty: false,
      wearMinutes: 0,
    });
  });

  it('shows one toast for set unless silent', () => {
    run(
      { kind: 'wearable_condition', target: '*', set: { wet: true } },
      worn(),
    );
    expect(toastCount()).toBe(1);
  });

  it('suppresses the toast in silent mode', () => {
    run({ kind: 'wearable_condition', target: '*', silent: true }, worn());
    run(
      {
        kind: 'wearable_condition',
        target: '*',
        set: { dirty: true },
        silent: true,
      },
      worn(),
    );
    expect(toastCount()).toBe(0);
  });
});
