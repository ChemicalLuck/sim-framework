import { isConditionMet } from '@chemicalluck/sim-engine/lib/conditions';
import type { RootState } from '@chemicalluck/sim-engine/state/store';

import type { ShopGate } from '../authoring.types';
import type { Shop, ShopEntry } from '../types';

/**
 * What an entry costs in this shop: its explicit `price`, else the item or
 * template value scaled by the shop's `priceMultiplier` (rounded to cents).
 * The shop UI shows and charges this same number.
 */
export function shopEntryPrice(shop: Shop, entry: ShopEntry): number {
  if (entry.price != null) return entry.price;
  const value = entry.data.value ?? 0;
  return Math.round(value * (shop.priceMultiplier ?? 1) * 100) / 100;
}

export interface ResolvedShopEntry {
  entry: ShopEntry;
  price: number;
  /** Set when the entry's condition fails: show it disabled with this text. */
  lockedText: string | undefined;
}

export interface ResolvedShopTab {
  title: string;
  /** Set when the tab's condition fails: show it disabled with this text. */
  lockedText: string | undefined;
  entries: ResolvedShopEntry[];
}

/** Every tab and entry of a shop, in display order. */
export function shopGates(shop: Shop): ShopGate[] {
  return shop.tabs.flatMap((tab) => [tab, ...tab.items]);
}

/**
 * The tabs and entries the player sees, with prices. Anything whose condition
 * fails is dropped, unless it has `lockedText`, in which case it is kept locked.
 */
export function resolveShop(shop: Shop, state: RootState): ResolvedShopTab[] {
  return resolveShopWith(shop, (gate) => isConditionMet(state, gate.condition));
}

/** {@link resolveShop} with conditions already evaluated by `isMet`. */
export function resolveShopWith(
  shop: Shop,
  isMet: (gate: ShopGate) => boolean,
): ResolvedShopTab[] {
  // null = hidden, undefined = available, a string = locked with that text.
  const gateState = (gate: ShopGate) =>
    isMet(gate) ? undefined : (gate.lockedText ?? null);
  const tabs: ResolvedShopTab[] = [];
  for (const tab of shop.tabs) {
    const tabLock = gateState(tab);
    if (tabLock === null) continue;
    const entries: ResolvedShopEntry[] = [];
    for (const entry of tab.items) {
      const lockedText = gateState(entry);
      if (lockedText === null) continue;
      entries.push({ entry, price: shopEntryPrice(shop, entry), lockedText });
    }
    tabs.push({ title: tab.title, lockedText: tabLock, entries });
  }
  return tabs;
}
