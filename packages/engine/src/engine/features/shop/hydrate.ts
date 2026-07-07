import { Registry } from '@chemicalluck/sim-engine/data/registry';
import type { HydrationContext } from '@chemicalluck/sim-engine/features/core/hydrate';

import type { JsonShop, JsonShopEntry } from './authoring.types';
import type { Shop, ShopEntry } from './types';

declare module '@chemicalluck/sim-engine/features/core/hydrate' {
  interface HydrationContext {
    shops?: Registry<Shop>;
  }
}

export function hydrateShopEntry(
  entry: JsonShopEntry,
  ctx: HydrationContext,
): ShopEntry {
  if (entry.kind === 'item') {
    return { kind: 'item', data: ctx.items.get(entry.itemId) };
  }
  if (entry.kind === 'wearable') {
    return { kind: 'wearable', data: ctx.wearables.get(entry.wearableId) };
  }
  return { kind: 'template', data: ctx.templates.get(entry.templateId) };
}

export function hydrateShop(shopJson: JsonShop, ctx: HydrationContext): Shop {
  return {
    text: shopJson.text,
    tabs: shopJson.tabs.map((tab) => ({
      title: tab.title,
      items: tab.items.map((entry) => hydrateShopEntry(entry, ctx)),
    })),
  };
}

export function hydrateShops(
  data: JsonShop[],
  ctx: HydrationContext,
): Registry<Shop> {
  const list = data.map((s) => hydrateShop(s, ctx));
  return new Registry('shop', new Map(data.map((s, i) => [s.id, list[i]])));
}
