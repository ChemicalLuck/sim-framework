import { describe, expect, it } from 'vitest';

import type { RootState } from '@chemicalluck/sim-engine/state/store';
import type { Condition } from '@chemicalluck/sim-engine/types/condition.types';
import type {
  Item,
  WearableTemplate,
} from '@chemicalluck/sim-engine/types/item.types';

import type { Shop, ShopEntry } from '../types';
import { resolveShop, shopEntryPrice } from './shop';

const apple: Item = { kind: 'item', id: 'apple', name: 'Apple', value: 10 };
const freebie: Item = { kind: 'item', id: 'leaflet', name: 'Leaflet' };
const coat: WearableTemplate = {
  name: 'Coat',
  slot: 'jacket',
  options: {},
  value: 40,
};

const state = { present: { money: 50 } } as unknown as RootState;
const rich: Condition = {
  kind: 'gte',
  lhs: { kind: 'money' },
  rhs: { kind: 'const', value: 100 },
};
const poor: Condition = {
  kind: 'lt',
  lhs: { kind: 'money' },
  rhs: { kind: 'const', value: 100 },
};

const shop = (tabs: Shop['tabs'], priceMultiplier?: number): Shop => ({
  text: 'Shop',
  tabs,
  ...(priceMultiplier != null && { priceMultiplier }),
});

describe('shopEntryPrice', () => {
  const appleEntry: ShopEntry = { kind: 'item', data: apple };
  const coatEntry: ShopEntry = { kind: 'template', data: coat };

  it('uses the item or template value by default', () => {
    expect(shopEntryPrice(shop([]), appleEntry)).toBe(10);
    expect(shopEntryPrice(shop([]), coatEntry)).toBe(40);
    expect(shopEntryPrice(shop([]), { kind: 'item', data: freebie })).toBe(0);
  });

  it('applies the shop price multiplier', () => {
    expect(shopEntryPrice(shop([], 1.5), appleEntry)).toBe(15);
    expect(shopEntryPrice(shop([], 0.333), coatEntry)).toBe(13.32);
  });

  it('lets a per-entry price override value and multiplier', () => {
    expect(shopEntryPrice(shop([], 2), { ...appleEntry, price: 7 })).toBe(7);
    expect(shopEntryPrice(shop([]), { ...coatEntry, price: 0 })).toBe(0);
  });
});

describe('resolveShop', () => {
  it('shows every entry and tab when there are no conditions', () => {
    const resolved = resolveShop(
      shop([{ title: 'Food', items: [{ kind: 'item', data: apple }] }], 2),
      state,
    );
    expect(resolved).toEqual([
      {
        title: 'Food',
        lockedText: undefined,
        entries: [
          {
            entry: { kind: 'item', data: apple },
            price: 20,
            lockedText: undefined,
          },
        ],
      },
    ]);
  });

  it('hides an entry whose condition fails', () => {
    const [tab] = resolveShop(
      shop([
        {
          title: 'Food',
          items: [
            { kind: 'item', data: apple, condition: rich },
            { kind: 'item', data: freebie, condition: poor },
          ],
        },
      ]),
      state,
    );
    expect(tab.entries.map((e) => e.entry.data)).toEqual([freebie]);
  });

  it('shows a failing entry locked when it has lockedText', () => {
    const [tab] = resolveShop(
      shop([
        {
          title: 'Food',
          items: [
            {
              kind: 'item',
              data: apple,
              condition: rich,
              lockedText: 'Members only',
            },
            {
              kind: 'item',
              data: freebie,
              condition: poor,
              lockedText: 'unused',
            },
          ],
        },
      ]),
      state,
    );
    expect(tab.entries.map((e) => e.lockedText)).toEqual([
      'Members only',
      undefined,
    ]);
  });

  it('hides a tab whose condition fails', () => {
    const tabs = resolveShop(
      shop([
        { title: 'VIP', items: [], condition: rich },
        { title: 'Food', items: [], condition: poor },
      ]),
      state,
    );
    expect(tabs.map((t) => t.title)).toEqual(['Food']);
  });

  it('shows a failing tab locked when it has lockedText', () => {
    const tabs = resolveShop(
      shop([
        { title: 'VIP', items: [], condition: rich, lockedText: 'VIP only' },
      ]),
      state,
    );
    expect(tabs).toEqual([
      { title: 'VIP', lockedText: 'VIP only', entries: [] },
    ]);
  });
});
