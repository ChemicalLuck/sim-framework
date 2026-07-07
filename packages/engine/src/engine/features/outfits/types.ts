import type { Equipment } from '@sim/engine/types/character.types';
import type { BaseEffect } from '@sim/engine/types/effect.types';

export interface Outfit {
  name: string;
  equipment: Equipment;
}

/** Equip every wearable in the named saved outfit at once. */
export interface ApplyOutfitEffect extends BaseEffect<'applyOutfit'> {
  name: string;
}

declare module '@sim/engine/types/effect.types' {
  interface EffectMap {
    applyOutfit: ApplyOutfitEffect;
  }
}
