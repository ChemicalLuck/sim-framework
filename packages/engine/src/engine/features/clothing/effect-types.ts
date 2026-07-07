export interface WearableConditionEffect {
  readonly kind: 'wearable_condition';
  /** '*' resets all wearables owned by the player; a wearable ID resets only that item. */
  readonly target: string;
}

declare module '@chemicalluck/sim-engine/types/effect.types' {
  interface EffectMap {
    wearable_condition: WearableConditionEffect;
  }
}
