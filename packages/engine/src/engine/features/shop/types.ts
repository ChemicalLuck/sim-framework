import type { BaseEffect } from '@chemicalluck/sim-engine/types/effect.types';
import type {
  InventoryItem,
  Item,
  Wearable,
  WearableTemplate,
} from '@chemicalluck/sim-engine/types/item.types';

import type { ShopEntryOptions, ShopGate } from './authoring.types';

export interface Shop {
  text: string;
  priceMultiplier?: number;
  tabs: ShopTab[];
}

/**
 * Buy a resolved item/wearable for `cost`. The handler gates on the player's
 * balance, so the purchase is rejected (item not granted, money untouched)
 * when funds are insufficient.
 */
export interface PurchaseEffect extends BaseEffect<'purchase'> {
  item: InventoryItem;
  cost: number;
}

declare module '@chemicalluck/sim-engine/types/effect.types' {
  interface EffectMap {
    purchase: PurchaseEffect;
  }
}

export type ShopEntry = (
  | { kind: 'item'; data: Item }
  | { kind: 'wearable'; data: Wearable }
  | { kind: 'template'; data: WearableTemplate }
) &
  ShopEntryOptions;

export interface ShopTab extends ShopGate {
  title: string;
  items: ShopEntry[];
}

declare module '@chemicalluck/sim-engine/features/view/slice' {
  interface ViewPropsMap {
    ShopView: { shop: Shop };
  }
}
