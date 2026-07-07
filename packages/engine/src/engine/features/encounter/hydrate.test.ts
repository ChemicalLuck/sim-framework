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

import type { Shop } from '../shop/types';
import type {
  JsonEncounter,
  JsonEncounterAction,
  JsonEncounterState,
} from './authoring.types';
import {
  hydrateEncounter,
  hydrateEncounterAction,
  hydrateEncounterState,
} from './hydrate';

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
const baseShop: Shop = { text: 'Welcome!', tabs: [] };

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
    shops: buildRegistry(
      'shop',
      [{ ...baseShop, id: 'general' }] as (Shop & { id: string })[],
      (s) => s.id,
    ),
    ...overrides,
  };
}

// ── hydrateEncounterAction ────────────────────────────────────────────────────

describe('hydrateEncounterAction', () => {
  const ctx = makeCtx();

  const json: JsonEncounterAction = {
    id: 'act1',
    text: 'Dodge',
    bodyPart: 'torso',
    effects: [{ kind: 'needs', need: 'Energy', delta: -5 }],
    condition: milestoneCondition,
    activateTransition: 'dodge_state',
    npcWeight: 2,
    npcSkillWeights: { agility: 1.5 },
    npcTraitWeights: { brave: 1 },
  };

  it('preserves all scalar fields', () => {
    const result = hydrateEncounterAction(json, ctx);
    expect(result.id).toBe('act1');
    expect(result.text).toBe('Dodge');
    expect(result.bodyPart).toBe('torso');
    expect(result.activateTransition).toBe('dodge_state');
    expect(result.npcWeight).toBe(2);
    expect(result.npcSkillWeights).toEqual({ agility: 1.5 });
    expect(result.npcTraitWeights).toEqual({ brave: 1 });
    expect(result.condition).toEqual(milestoneCondition);
  });

  it('hydrates effects', () => {
    const result = hydrateEncounterAction(json, ctx);
    expect(result.effects).toHaveLength(1);
    expect(result.effects?.[0]).toMatchObject({ kind: 'needs' });
  });
});

// ── hydrateEncounterState ─────────────────────────────────────────────────────

describe('hydrateEncounterState', () => {
  const ctx = makeCtx();

  const json: JsonEncounterState = {
    id: 'state1',
    name: 'Combat',
    text: 'Fists are flying.',
    actions: [{ id: 'a1', text: 'Block', bodyPart: 'arm', effects: [] }],
    condition: milestoneCondition,
    transitionTo: 'end',
  };

  it('preserves id, name, text, condition, transitionTo', () => {
    const result = hydrateEncounterState(json, ctx);
    expect(result.id).toBe('state1');
    expect(result.name).toBe('Combat');
    expect(result.text).toBe('Fists are flying.');
    expect(result.condition).toEqual(milestoneCondition);
    expect(result.transitionTo).toBe('end');
  });

  it('hydrates actions', () => {
    const result = hydrateEncounterState(json, ctx);
    expect(result.actions[0].text).toBe('Block');
  });
});

// ── hydrateEncounter ──────────────────────────────────────────────────────────

describe('hydrateEncounter', () => {
  const ctx = makeCtx();

  const json: JsonEncounter = {
    id: 'enc1',
    name: 'Brawl',
    states: [{ id: 'start', name: 'Start', text: 'It begins.', actions: [] }],
    initialStateId: 'start',
    npcNeeds: { aggression: 10 },
    npcDoNothingWeight: 0.5,
    stopEffects: [{ kind: 'needs', need: 'Energy', delta: -20 }],
  };

  it('preserves id, name, initialStateId, npcNeeds, npcDoNothingWeight', () => {
    const result = hydrateEncounter(json, ctx);
    expect(result.id).toBe('enc1');
    expect(result.name).toBe('Brawl');
    expect(result.initialStateId).toBe('start');
    expect(result.npcNeeds).toEqual({ aggression: 10 });
    expect(result.npcDoNothingWeight).toBe(0.5);
  });

  it('hydrates states', () => {
    expect(hydrateEncounter(json, ctx).states[0].id).toBe('start');
  });

  it('hydrates stopEffects', () => {
    const result = hydrateEncounter(json, ctx);
    expect(result.stopEffects).toHaveLength(1);
    expect(result.stopEffects?.[0]).toMatchObject({ kind: 'needs' });
  });
});
