import type { RootState } from '@chemicalluck/sim-engine/state/store';

import { equippedAttributeTotal } from './lib/wearables';

export const selectOutfits = (state: RootState) => {
  return state.present.outfits;
};

/** Total of a numeric wearable attribute across equipped items (e.g. `warmth`, `coverage`). */
export const selectEquippedAttributeTotal = (
  state: RootState,
  attribute: string,
) => equippedAttributeTotal(state.present.player.equipment, attribute);

export const selectEquippedWarmth = (state: RootState) =>
  selectEquippedAttributeTotal(state, 'warmth');
