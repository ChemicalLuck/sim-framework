import { beforeAll, describe, expect, it } from 'vitest';
import {
  type AppearanceJsonData,
  configureAppearance,
} from '@sim/engine/features/npcs/lib/appearance-config';
import { configureWearables } from '@sim/engine/features/outfits/lib/wearable-config';
import type { Wearable } from '@sim/engine/types';

import reducer, {
  addTrait,
  adjustBodyAttribute,
  configurePlayer,
  equipItem,
  setBody,
  setLocation,
  setProfile,
  unequipItem,
  updateSkill,
} from './slice';

const APPEARANCE_FIXTURE: AppearanceJsonData = {
  features: [],
  ageDistribution: { min: 18, max: 80, mean: 20, stdDev: 12 },
  bodyAttributes: [
    {
      id: 'height',
      label: 'Height',
      unit: 'cm',
      default: 170,
      distribution: { default: { min: 120, max: 220, mean: 170, stdDev: 8 } },
    },
    {
      id: 'weight',
      label: 'Weight',
      unit: 'kg',
      default: 70,
      distribution: { default: { min: 30, max: 200, mean: 70, stdDev: 14 } },
    },
    {
      id: 'bodyFat',
      label: 'Body Fat',
      unit: '%',
      default: 20,
      distribution: { default: { min: 3, max: 60, mean: 20, stdDev: 7 } },
    },
    {
      id: 'bustDifference',
      label: 'Bust − Underbust',
      unit: 'in',
      default: 2,
      distribution: { default: { min: 0, max: 20, mean: 4, stdDev: 2 } },
    },
  ],
  display: { strangerFeatureIds: [], metaFeatureIds: [] },
};

beforeAll(() => {
  configureAppearance(APPEARANCE_FIXTURE);
});

const hat: Wearable = {
  kind: 'wearable',
  id: 'hat',
  name: 'Hat',
  slot: 'hat',
  appearance: {},
};

function init() {
  configurePlayer({});
  return reducer(undefined, { type: '@@INIT' });
}

describe('player slice', () => {
  it('uses the configured start location', () => {
    configurePlayer({ startLocation: 'campus_quad' });
    const state = reducer(undefined, { type: '@@INIT' });
    expect(state.locationId).toBe('campus_quad');
  });

  it('falls back to "bedroom" when no start location is configured', () => {
    configurePlayer({});
    expect(reducer(undefined, { type: '@@INIT' }).locationId).toBe('bedroom');
  });

  it('setLocation updates locationId', () => {
    const next = reducer(init(), setLocation('library'));
    expect(next.locationId).toBe('library');
  });

  it('equipItem stores the wearable in its slot', () => {
    const next = reducer(init(), equipItem(hat));
    expect(next.equipment.hat).toEqual(hat);
  });

  it('unequipItem clears the slot', () => {
    const equipped = reducer(init(), equipItem(hat));
    const next = reducer(equipped, unequipItem('hat'));
    expect(next.equipment.hat).toBeNull();
  });

  it('updateSkill stores the new skill value', () => {
    const next = reducer(init(), updateSkill({ skill: 'biology', value: 5 }));
    expect(next.skills.biology).toBe(5);
  });

  it('setProfile merges into the existing profile', () => {
    const next = reducer(
      init(),
      setProfile({ firstName: 'Alex', lastName: 'Doe' }),
    );
    expect(next.profile.firstName).toBe('Alex');
    expect(next.profile.lastName).toBe('Doe');
    expect(next.profile.profession).toBe('Student');
  });

  it('addTrait appends a trait', () => {
    const next = reducer(init(), addTrait('Introverted'));
    expect(next.traits).toEqual(['Introverted']);
  });

  it('addTrait deduplicates', () => {
    const once = reducer(init(), addTrait('Introverted'));
    const twice = reducer(once, addTrait('Introverted'));
    expect(twice.traits).toEqual(['Introverted']);
  });

  it('seeds body from config and defaults', () => {
    configurePlayer({ body: { weight: 80 } });
    const state = reducer(undefined, { type: '@@INIT' });
    expect(state.body.weight).toBe(80);
    expect(state.body.height).toBe(170); // default
  });

  it('setBody merges into the existing body', () => {
    const next = reducer(init(), setBody({ bodyFat: 30 }));
    expect(next.body.bodyFat).toBe(30);
    expect(next.body.height).toBe(170);
  });

  it('equipItem clears conflicting slots (full-body vs layers)', () => {
    configureWearables({
      slots: ['baselayer', 'legwear', 'full-body'],
      categories: [],
      slotCategoryMap: {},
      slotConflicts: { 'full-body': ['baselayer', 'legwear'] },
      styles: [],
      appearanceKeys: [],
      primaryBodyAttributes: [],
      estimatedMetrics: {},
      sizeSystems: {},
    });

    const top: Wearable = {
      kind: 'wearable',
      id: 'top',
      name: 'Top',
      slot: 'baselayer',
      appearance: {},
    };
    const jeans: Wearable = {
      kind: 'wearable',
      id: 'jeans',
      name: 'Jeans',
      slot: 'legwear',
      appearance: {},
    };
    const dress: Wearable = {
      kind: 'wearable',
      id: 'dress',
      name: 'Dress',
      slot: 'full-body',
      appearance: {},
    };

    // Equipping a full-body dress clears the layer slots it overlaps.
    let state = reducer(init(), equipItem(top));
    state = reducer(state, equipItem(jeans));
    state = reducer(state, equipItem(dress));
    expect(state.equipment['full-body']).toEqual(dress);
    expect(state.equipment.baselayer).toBeNull();
    expect(state.equipment.legwear).toBeNull();

    // Equipping a layer item clears the full-body garment (symmetric).
    state = reducer(state, equipItem(top));
    expect(state.equipment.baselayer).toEqual(top);
    expect(state.equipment['full-body']).toBeNull();
  });

  it('adjustBodyAttribute clamps within bounds', () => {
    const heavier = reducer(
      init(),
      adjustBodyAttribute({ attribute: 'weight', delta: 10 }),
    );
    expect(heavier.body.weight).toBe(80);

    const tooLight = reducer(
      init(),
      adjustBodyAttribute({ attribute: 'weight', delta: -1000 }),
    );
    expect(tooLight.body.weight).toBe(30); // clamped to min

    const tooHeavy = reducer(
      init(),
      adjustBodyAttribute({ attribute: 'weight', delta: 1000 }),
    );
    expect(tooHeavy.body.weight).toBe(200); // clamped to max
  });
});
