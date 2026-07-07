import type { Equipment } from '@chemicalluck/engine/types/character.types';
import type { BaseEffect } from '@chemicalluck/engine/types/effect.types';

export interface Outfit {
  name: string;
  equipment: Equipment;
}

/** Equip every wearable in the named saved outfit at once. */
export interface ApplyOutfitEffect extends BaseEffect<'applyOutfit'> {
  name: string;
}

declare module '@chemicalluck/engine/types/effect.types' {
  interface EffectMap {
    applyOutfit: ApplyOutfitEffect;
  }
}
