import type { Equipment } from '@chemicalluck/sim-engine/types/character.types';
import type { BaseEffect } from '@chemicalluck/sim-engine/types/effect.types';

export interface Outfit {
  name: string;
  equipment: Equipment;
}

/** Equip every wearable in the named saved outfit at once. */
export interface ApplyOutfitEffect extends BaseEffect<'applyOutfit'> {
  name: string;
}

declare module '@chemicalluck/sim-engine/types/effect.types' {
  interface EffectMap {
    applyOutfit: ApplyOutfitEffect;
  }
}
