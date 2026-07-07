export type JsonShopEntry =
  | { kind: 'item'; itemId: string }
  | { kind: 'wearable'; wearableId: string }
  | { kind: 'template'; templateId: string };

export interface JsonShopTab {
  title: string;
  items: JsonShopEntry[];
}

export interface JsonShop {
  id: string;
  text: string;
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
