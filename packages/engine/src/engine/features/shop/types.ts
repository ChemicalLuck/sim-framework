import type { BaseEffect } from '@sim/engine/types/effect.types';
import type {
  InventoryItem,
  Item,
  Wearable,
  WearableTemplate,
} from '@sim/engine/types/item.types';

export interface Shop {
  text: string;
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

declare module '@sim/engine/types/effect.types' {
  interface EffectMap {
    purchase: PurchaseEffect;
  }
}

export type ShopEntry =
  | { kind: 'item'; data: Item }
  | { kind: 'wearable'; data: Wearable }
  | { kind: 'template'; data: WearableTemplate };

export interface ShopTab {
  title: string;
  items: ShopEntry[];
}

declare module '@sim/engine/features/view/slice' {
  interface ViewPropsMap {
    ShopView: { shop: Shop };
  }
}
