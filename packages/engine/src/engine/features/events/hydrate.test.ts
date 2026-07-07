import { describe, expect, it } from 'vitest';
import { buildRegistry } from '@chemicalluck/engine/data/registry';
import type { HydrationContext } from '@chemicalluck/engine/features/core/hydrate';
import type { MilestoneCondition } from '@chemicalluck/engine/features/milestones/types';
import type { Scene, Script } from '@chemicalluck/engine/types';
import type {
  Item,
  Wearable,
  WearableTemplate,
} from '@chemicalluck/engine/types/item.types';

import type { JsonRandomEvent } from './authoring.types';
import { hydrateRandomEvent } from './hydrate';

// ── Fixtures ──────────────────────────────────────────────────────────────────

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
const templateWithId = template as WearableTemplate & { id: string };
templateWithId.id = 'tpl';

const baseScene: Scene = { kind: 'scene', text: 'x', actions: [] };
const baseScript: Script = {
  order: 'sequential',
  duration: 30,
  scenes: [baseScene],
};

const milestoneCondition: MilestoneCondition = {
  kind: 'milestone',
  milestoneId: 'test',
};

function makeCtx(overrides: Partial<HydrationContext> = {}): HydrationContext {
  return {
    items: buildRegistry('item', [item], (i) => i.id),
    wearables: buildRegistry('wearable', [wearable], (w) => w.id),
    templates: buildRegistry(
      'template',
      [templateWithId],
      (t) => (t as WearableTemplate & { id: string }).id,
    ),
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
    ...overrides,
  };
}

// ── hydrateRandomEvent ────────────────────────────────────────────────────────

describe('hydrateRandomEvent', () => {
  const ctx = makeCtx();

  const json: JsonRandomEvent = {
    id: 'evt1',
    probability: 0.3,
    scriptId: 'intro',
    cancels: true,
    condition: milestoneCondition,
  };

  it('preserves id, probability, cancels, and condition', () => {
    const result = hydrateRandomEvent(json, ctx);
    expect(result.id).toBe('evt1');
    expect(result.probability).toBe(0.3);
    expect(result.cancels).toBe(true);
    expect(result.condition).toEqual(milestoneCondition);
  });

  it('resolves scriptId to script object', () => {
    const result = hydrateRandomEvent(json, ctx);
    expect(result.script).toMatchObject({ order: 'sequential' });
    expect('scriptId' in result).toBe(false);
  });
});
