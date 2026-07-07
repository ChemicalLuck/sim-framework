import { describe, expect, it } from 'vitest';
import { buildRegistry } from '@sim/engine/data/registry';
import type { HydrationContext } from '@sim/engine/features/core/hydrate';
import type { MilestoneCondition } from '@sim/engine/features/milestones/types';
import type { Scene, Script } from '@sim/engine/types';
import type {
  Item,
  Wearable,
  WearableTemplate,
} from '@sim/engine/types/item.types';

import type { JsonLocation } from './authoring.types';
import { hydrateLocation } from './hydrate';

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

// ── hydrateLocation ───────────────────────────────────────────────────────────

describe('hydrateLocation', () => {
  const ctx = makeCtx();

  const json: JsonLocation = {
    id: 'library',
    name: 'Library',
    kind: 'interior',
    parent: 'campus',
    condition: milestoneCondition,
    nearby: ['cafe'],
    description: 'Quiet and studious.',
    actions: [{ actions: [{ kind: 'action', text: 'Study', effects: [] }] }],
  };

  it('preserves all scalar fields', () => {
    const result = hydrateLocation(json, ctx);
    expect(result.id).toBe('library');
    expect(result.name).toBe('Library');
    expect(result.kind).toBe('interior');
    expect(result.parent).toBe('campus');
    expect(result.condition).toEqual(milestoneCondition);
    expect(result.nearby).toEqual(['cafe']);
    expect(result.description).toBe('Quiet and studious.');
  });

  it('hydrates actions', () => {
    const result = hydrateLocation(json, ctx);
    expect(result.actions?.[0]?.actions[0]?.text).toBe('Study');
  });

  it('leaves actions undefined when absent', () => {
    const minimal: JsonLocation = { id: 'x', name: 'X', kind: 'exterior' };
    expect(hydrateLocation(minimal, ctx).actions).toBeUndefined();
  });
});
