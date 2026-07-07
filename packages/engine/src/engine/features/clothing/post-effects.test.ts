import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EffectContext } from '@chemicalluck/sim-engine/features/core/types';
import { configureWearables } from '@chemicalluck/sim-engine/features/outfits/lib/wearable-config';
import { configureWorld } from '@chemicalluck/sim-engine/features/travel/lib/world';
import type { LocationNode } from '@chemicalluck/sim-engine/features/travel/types';
import type { RootState } from '@chemicalluck/sim-engine/state/store';
import type { Wearable } from '@chemicalluck/sim-engine/types/item.types';

import postEffects from './post-effects';
import type { ClothingState } from './types';

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));

const clothingPostEffect = postEffects[0];

const park: LocationNode = { id: 'park', name: 'Park', kind: 'exterior' };
const home: LocationNode = { id: 'home', name: 'Home', kind: 'interior' };

const jacket: Wearable = {
  kind: 'wearable',
  id: 'jacket',
  instanceId: 'jacket-1',
  name: 'Jacket',
  slot: 'jacket',
  appearance: {},
};

interface DispatchedAction {
  type: string;
  payload?: { ids?: string[] | '*'; wet?: boolean };
  meta?: unknown;
}

function run(opts: {
  locationId: string;
  override?: string | null;
  clothing?: ClothingState;
}) {
  const dispatch = vi.fn<(action: DispatchedAction) => void>();
  const present = {
    time: { timestamp: 60 * 60000 }, // 60 minutes elapsed
    player: { locationId: opts.locationId, equipment: { jacket } },
    weather: { conditionOverride: opts.override ?? null },
    rng: { seed: 1 },
    clothing: opts.clothing ?? {},
  };
  const ctx = {
    dispatch,
    group: 'g',
    prevState: { present: { time: { timestamp: 0 } } } as RootState,
    newState: { present } as unknown as RootState,
    effects: [],
  } as unknown as EffectContext;

  clothingPostEffect(ctx);
  return dispatch.mock.calls
    .map((c) => c[0])
    .filter((a) => a.type === 'clothing/setWet');
}

describe('clothing weather post-effect', () => {
  beforeEach(() => {
    configureWorld({ locations: [park, home], edges: [] });
  });

  it('wets equipped clothing outdoors in wet weather', () => {
    const setWets = run({ locationId: 'park', override: 'rainy' });
    expect(setWets).toContainEqual(
      expect.objectContaining({
        type: 'clothing/setWet',
        payload: { ids: ['jacket-1'], wet: true },
      }),
    );
  });

  it('does not wet clothing indoors even in wet weather', () => {
    const setWets = run({ locationId: 'home', override: 'rainy' });
    const wettings = setWets.filter((a) => a.payload?.wet === true);
    expect(wettings).toHaveLength(0);
  });

  it('dries already-wet clothing once indoors', () => {
    const setWets = run({
      locationId: 'home',
      override: 'rainy',
      clothing: { 'jacket-1': { isWet: true, isDirty: false, wearMinutes: 0 } },
    });
    expect(setWets).toContainEqual(
      expect.objectContaining({
        type: 'clothing/setWet',
        payload: { ids: ['jacket-1'], wet: false },
      }),
    );
  });
});

describe('clothing comfort post-effect', () => {
  beforeEach(() => {
    configureWorld({ locations: [park, home], edges: [] });
    configureWearables({
      slots: [],
      categories: [],
      slotCategoryMap: {},
      styles: [],
      appearanceKeys: [],
      primaryBodyAttributes: ['height', 'weight', 'bodyFat'],
      // chest fixed at 100 -> ideal index 1 ("M") for the tops system below.
      estimatedMetrics: {
        chest: { default: { intercept: 100, terms: {} } },
      },
      sizeSystems: {
        'alpha-tops': {
          labelFormat: '{size}',
          dimensions: [
            {
              name: 'size',
              metric: 'chest',
              sizes: [
                { label: 'S', max: 96 },
                { label: 'M', max: 104 },
                { label: 'L', max: 999 },
              ],
            },
          ],
        },
      },
    });
  });

  function runComfort(size: string | undefined, minutes = 60) {
    const dispatch = vi.fn<(action: DispatchedAction) => void>();
    const top: Wearable = {
      kind: 'wearable',
      id: 'top',
      instanceId: 'top-1',
      name: 'Top',
      slot: 'baselayer',
      appearance: {},
      sizeSystem: 'alpha-tops',
      size,
    };
    const present = {
      time: { timestamp: minutes * 60000 },
      player: {
        locationId: 'home',
        equipment: { baselayer: top },
        body: { height: 170, weight: 70, bodyFat: 20 },
        profile: { appearance: {} },
      },
      weather: { conditionOverride: null },
      rng: { seed: 1 },
      clothing: {},
    };
    const ctx = {
      dispatch,
      group: 'g',
      prevState: { present: { time: { timestamp: 0 } } } as RootState,
      newState: { present } as unknown as RootState,
      effects: [],
    } as unknown as EffectContext;
    clothingPostEffect(ctx);
    return dispatch.mock.calls
      .map(
        (c) =>
          c[0] as DispatchedAction & {
            payload?: { need?: string; amount?: number };
          },
      )
      .filter((a) => a.type === 'needs/increaseNeedByAmount')
      .filter((a) => a.payload?.need === 'Comfort');
  }

  it('drains Comfort when the size is wrong', () => {
    // ideal M, chosen S => mismatch 1 => -1.5/hr over 1hr
    const comfort = runComfort('S');
    expect(comfort).toHaveLength(1);
    expect(comfort[0].payload?.amount).toBeCloseTo(-1.5);
  });

  it('recovers Comfort when the size fits', () => {
    const comfort = runComfort('M');
    expect(comfort).toHaveLength(1);
    expect(comfort[0].payload?.amount).toBeGreaterThan(0);
  });

  it('scales the drain with elapsed time', () => {
    const oneHour = runComfort('S', 60)[0].payload?.amount ?? 0;
    const twoHours = runComfort('S', 120)[0].payload?.amount ?? 0;
    expect(twoHours).toBeCloseTo(oneHour * 2);
  });
});
