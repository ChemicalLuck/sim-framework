import { describe, expect, it } from 'vitest';

import { buildRegistry } from '@chemicalluck/sim-engine/data/registry';
import type { HydrationContext } from '@chemicalluck/sim-engine/features/core/hydrate';
import type { Scene, Script } from '@chemicalluck/sim-engine/types';
import type {
  Item,
  Wearable,
  WearableTemplate,
} from '@chemicalluck/sim-engine/types/item.types';

import type { JsonShop } from './authoring.types';
import { hydrateShop, hydrateShopEntry } from './hydrate';
import type { Shop } from './types';

const item: Item = { kind: 'item', id: 'apple', name: 'Apple' };
const wearable: Wearable = {
  kind: 'wearable',
  id: 'hat',
  name: 'Hat',
  slot: 'head',
  appearance: {},
};
const template: WearableTemplate = {
  name: 'Custom Hat',
  slot: 'head',
  options: {},
  value: 10,
};
const templateWithId = { ...template, id: 'tpl' };

const baseScene: Scene = { kind: 'scene', text: 'A room.', actions: [] };
const baseScript: Script = {
  order: 'sequential',
  duration: 30,
  scenes: [baseScene],
};
const baseShop: Shop = { text: 'Welcome!', tabs: [] };

function makeCtx(overrides: Partial<HydrationContext> = {}): HydrationContext {
  return {
    items: buildRegistry('item', [item], (i) => i.id),
    wearables: buildRegistry('wearable', [wearable], (w) => w.id),
    templates: buildRegistry('template', [templateWithId], (t) => t.id),
    scenes: buildRegistry(
      'scene',
      [{ ...baseScene, id: 'room' }] as (Scene & { id: string })[],
      (s) => s.id,
    ),
    scripts: buildRegistry(
      'script',
      [{ ...baseScript, id: 'intro' }] as (Script & { id: string })[],
      (s) => s.id,
    ),
    shops: buildRegistry(
      'shop',
      [{ ...baseShop, id: 'general' }] as (Shop & { id: string })[],
      (s) => s.id,
    ),
    ...overrides,
  };
}

// ── hydrateShopEntry ─────────────────────────────────────────────────────────

describe('hydrateShopEntry', () => {
  const ctx = makeCtx();

  it('resolves item entry', () => {
    const result = hydrateShopEntry({ kind: 'item', itemId: 'apple' }, ctx);
    expect(result).toEqual({ kind: 'item', data: item });
  });

  it('resolves wearable entry', () => {
    const result = hydrateShopEntry(
      { kind: 'wearable', wearableId: 'hat' },
      ctx,
    );
    expect(result).toEqual({ kind: 'wearable', data: wearable });
  });

  it('resolves template entry', () => {
    const result = hydrateShopEntry(
      { kind: 'template', templateId: 'tpl' },
      ctx,
    );
    expect(result).toEqual({ kind: 'template', data: templateWithId });
  });
});

// ── hydrateShop ──────────────────────────────────────────────────────────────

describe('hydrateShop', () => {
  const ctx = makeCtx();

  it('preserves shop text and hydrates tabs', () => {
    const json: JsonShop = {
      id: 'shop1',
      text: 'Buy stuff',
      tabs: [{ title: 'Food', items: [{ kind: 'item', itemId: 'apple' }] }],
    };
    const result = hydrateShop(json, ctx);
    expect(result.text).toBe('Buy stuff');
    expect(result.tabs[0].title).toBe('Food');
    expect(result.tabs[0].items[0]).toEqual({ kind: 'item', data: item });
  });

  it('leaves existing shops without pricing or condition fields', () => {
    const result = hydrateShop(
      {
        id: 'shop1',
        text: 'Buy stuff',
        tabs: [{ title: 'Food', items: [{ kind: 'item', itemId: 'apple' }] }],
      },
      ctx,
    );
    expect(Object.keys(result)).toEqual(['text', 'tabs']);
    expect(Object.keys(result.tabs[0])).toEqual(['title', 'items']);
    expect(Object.keys(result.tabs[0].items[0])).toEqual(['kind', 'data']);
  });

  it('carries the multiplier, entry price and conditions through', () => {
    const condition = {
      kind: 'gte' as const,
      lhs: { kind: 'money' as const },
      rhs: { kind: 'const' as const, value: 5 },
    };
    const result = hydrateShop(
      {
        id: 'shop1',
        text: 'Buy stuff',
        priceMultiplier: 1.25,
        tabs: [
          {
            title: 'VIP',
            condition,
            lockedText: 'VIP only',
            items: [
              {
                kind: 'template',
                templateId: 'tpl',
                price: 3,
                condition,
                lockedText: 'Locked',
              },
            ],
          },
        ],
      },
      ctx,
    );
    expect(result.priceMultiplier).toBe(1.25);
    expect(result.tabs[0]).toMatchObject({
      condition,
      lockedText: 'VIP only',
    });
    expect(result.tabs[0].items[0]).toEqual({
      kind: 'template',
      data: templateWithId,
      price: 3,
      condition,
      lockedText: 'Locked',
    });
  });
});
