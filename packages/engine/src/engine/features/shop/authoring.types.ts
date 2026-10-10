import type { Condition } from '@chemicalluck/sim-engine/types/condition.types';

/**
 * Gating shared by shop entries and tabs: hidden while `condition` fails, or
 * shown locked with `lockedText` when one is set.
 */
export interface ShopGate {
  condition?: Condition;
  lockedText?: string;
}

/** Per-entry options: `price` overrides the item value and shop multiplier. */
export interface ShopEntryOptions extends ShopGate {
  price?: number;
}

export type JsonShopEntry = (
  | { kind: 'item'; itemId: string }
  | { kind: 'wearable'; wearableId: string }
  | { kind: 'template'; templateId: string }
) &
  ShopEntryOptions;

export interface JsonShopTab extends ShopGate {
  title: string;
  items: JsonShopEntry[];
}

export interface JsonShop {
  id: string;
  text: string;
  /** Scales every entry's value (not explicit entry prices). Defaults to 1. */
  priceMultiplier?: number;
  tabs: JsonShopTab[];
}

export interface JsonViewShopEffect {
  kind: 'view';
  activeViewId: 'ShopView';
  shopId: string;
}

declare module '@chemicalluck/sim-engine/data/authoring.types' {
  interface JsonEffectMap {
    view_shop: JsonViewShopEffect;
  }
}
