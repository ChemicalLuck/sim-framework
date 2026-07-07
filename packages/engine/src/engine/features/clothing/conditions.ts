import type { RootState } from '@chemicalluck/engine/state/store';

import type { HasDirtyClothesCondition, HasWetClothesCondition } from './types';

declare module '@chemicalluck/engine/types/condition.types' {
  interface ConditionMap {
    has_dirty_clothes: HasDirtyClothesCondition;
    has_wet_clothes: HasWetClothesCondition;
  }
}

export const conditionParsers = [
  (id: string): HasDirtyClothesCondition | HasWetClothesCondition | null => {
    if (id === 'has_dirty_clothes') return { kind: 'has_dirty_clothes' };
    if (id === 'has_wet_clothes') return { kind: 'has_wet_clothes' };
    return null;
  },
];

export const conditionSerializers = {
  has_dirty_clothes: () => 'has_dirty_clothes',
  has_wet_clothes: () => 'has_wet_clothes',
};

export default {
  has_dirty_clothes: (
    _cond: HasDirtyClothesCondition,
    state: RootState,
  ): boolean => {
    const equipment = state.present.player.equipment;
    const clothing = state.present.clothing;
    return Object.values(equipment).some(
      (w) =>
        w?.instanceId != null && (clothing[w.instanceId]?.isDirty ?? false),
    );
  },

  has_wet_clothes: (
    _cond: HasWetClothesCondition,
    state: RootState,
  ): boolean => {
    const equipment = state.present.player.equipment;
    const clothing = state.present.clothing;
    return Object.values(equipment).some(
      (w) => w?.instanceId != null && (clothing[w.instanceId]?.isWet ?? false),
    );
  },
};
