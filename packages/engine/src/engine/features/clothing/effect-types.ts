/** Fields a `wearable_condition` effect can override. Omitted fields keep their current value. */
export interface WearableConditionSet {
  readonly wet?: boolean;
  /** Omitted with `wearMinutes` given: dirty follows the wear-time threshold. */
  readonly dirty?: boolean;
  readonly wearMinutes?: number;
}

export interface WearableConditionEffect {
  readonly kind: 'wearable_condition';
  /** '*' targets all wearables owned by the player; a wearable ID targets only that item. */
  readonly target: string;
  /** Fields to override. Omitted: reset the items to clean, dry and unworn. */
  readonly set?: WearableConditionSet;
  /** Suppress the toast. */
  readonly silent?: boolean;
}

declare module '@chemicalluck/sim-engine/types/effect.types' {
  interface EffectMap {
    wearable_condition: WearableConditionEffect;
  }
}
