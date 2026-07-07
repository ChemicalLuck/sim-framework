import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@sim/engine/state/store';

export const selectClothingState = (state: RootState) => state.present.clothing;

export const selectHasDirtyClothes = createSelector(
  (state: RootState) => state.present.player.equipment,
  (state: RootState) => state.present.clothing,
  (equipment, clothing) =>
    Object.values(equipment).some(
      (w) =>
        w?.instanceId != null && (clothing[w.instanceId]?.isDirty ?? false),
    ),
);

export const selectHasWetClothes = createSelector(
  (state: RootState) => state.present.player.equipment,
  (state: RootState) => state.present.clothing,
  (equipment, clothing) =>
    Object.values(equipment).some(
      (w) => w?.instanceId != null && (clothing[w.instanceId]?.isWet ?? false),
    ),
);
