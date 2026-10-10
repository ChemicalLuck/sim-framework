import { Registry } from '@chemicalluck/sim-engine/data/registry';
import type { HydrationContext } from '@chemicalluck/sim-engine/features/core/hydrate';

import type {
  JsonShop,
  JsonShopEntry,
  ShopEntryOptions,
  ShopGate,
} from './authoring.types';
import type { Shop, ShopEntry } from './types';

declare module '@chemicalluck/sim-engine/features/core/hydrate' {
  interface HydrationContext {
    shops?: Registry<Shop>;
  }
}

/** The gate fields that are set, so entries without them stay unchanged. */
function gateOf({ condition, lockedText }: ShopGate): ShopGate {
  return {
    ...(condition && { condition }),
    ...(lockedText != null && { lockedText }),
  };
}

function entryOptions(entry: JsonShopEntry): ShopEntryOptions {
  return {
    ...(entry.price != null && { price: entry.price }),
    ...gateOf(entry),
  };
}

export function hydrateShopEntry(
  entry: JsonShopEntry,
  ctx: HydrationContext,
): ShopEntry {
  const options = entryOptions(entry);
  if (entry.kind === 'item') {
    return { kind: 'item', data: ctx.items.get(entry.itemId), ...options };
  }
  if (entry.kind === 'wearable') {
    return {
      kind: 'wearable',
      data: ctx.wearables.get(entry.wearableId),
      ...options,
    };
  }
  return {
    kind: 'template',
    data: ctx.templates.get(entry.templateId),
    ...options,
  };
}

export function hydrateShop(shopJson: JsonShop, ctx: HydrationContext): Shop {
  return {
    text: shopJson.text,
    ...(shopJson.priceMultiplier != null && {
      priceMultiplier: shopJson.priceMultiplier,
    }),
    tabs: shopJson.tabs.map((tab) => ({
      title: tab.title,
      items: tab.items.map((entry) => hydrateShopEntry(entry, ctx)),
      ...gateOf(tab),
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
