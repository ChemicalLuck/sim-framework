import { describe, expect, it } from 'vitest';
import { buildRegistry } from '@chemicalluck/engine/data/registry';
import type { Scene, Script } from '@chemicalluck/engine/types';
import type {
  Item,
  Wearable,
  WearableTemplate,
} from '@chemicalluck/engine/types/item.types';

import {
  hydrateAction,
  hydrateEffect,
  hydrateScene,
  hydrateScript,
} from './hydrate';
import type { HydrationContext } from './hydrate';
import type { JsonAction, JsonScene, JsonScript } from './types';

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

const baseScene: Scene = {
  kind: 'scene',
  text: 'You are in a room.',
  actions: [],
};

const baseScript: Script = {
  order: 'sequential',
  duration: 30,
  scenes: [baseScene],
};

const templateWithId = { ...template, id: 'tpl' };

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

// ── hydrateEffect ─────────────────────────────────────────────────────────────

describe('hydrateEffect', () => {
  const ctx = makeCtx();

  it('passes through primitive effects unchanged', () => {
    const effect = {
      kind: 'needs' as const,
      need: 'Energy' as const,
      delta: -10,
    };
    expect(hydrateEffect(effect, ctx)).toEqual(effect);
  });

  it('resolves inventory add itemId to item object', () => {
    const result = hydrateEffect(
      { kind: 'inventory', operation: 'add', itemId: 'apple' },
      ctx,
    );
    expect(result).toMatchObject({ kind: 'inventory', operation: 'add', item });
    expect('itemId' in result).toBe(false);
  });

  it('resolves sceneId to scene object', () => {
    const result = hydrateEffect(
      { kind: 'view', activeViewId: 'SceneView', sceneId: 'room' },
      ctx,
    );
    expect(result).toMatchObject({
      kind: 'view',
      activeViewId: 'SceneView',
      props: { scene: { kind: 'scene' } },
    });
    expect('sceneId' in result).toBe(false);
  });

  it('resolves scriptId to script object', () => {
    const result = hydrateEffect(
      { kind: 'view', activeViewId: 'ScriptView', scriptId: 'intro' },
      ctx,
    );
    expect(result).toMatchObject({
      kind: 'view',
      activeViewId: 'ScriptView',
      props: { script: { order: 'sequential' } },
    });
    expect('scriptId' in result).toBe(false);
  });

  it('maps encounter view effect to encounter kind', () => {
    const result = hydrateEffect(
      {
        kind: 'view',
        activeViewId: 'EncounterView',
        encounterId: 'enc1',
        npcId: 'npc1',
      },
      ctx,
    );
    expect(result).toMatchObject({
      kind: 'encounter',
      encounterId: 'enc1',
      npcId: 'npc1',
    });
  });

  it('throws when itemId is not in registry', () => {
    expect(() =>
      hydrateEffect(
        { kind: 'inventory', operation: 'add', itemId: 'unknown' },
        ctx,
      ),
    ).toThrow();
  });
});

// ── hydrateAction ─────────────────────────────────────────────────────────────

describe('hydrateAction', () => {
  const ctx = makeCtx();

  it('preserves text, condition, and eventIds', () => {
    const condition = {
      kind: 'eq' as const,
      lhs: { kind: 'money' as const },
      rhs: { kind: 'const' as const, value: 100 },
    };
    const json: JsonAction = {
      kind: 'action',
      text: 'Pick up apple',
      effects: [{ kind: 'inventory', operation: 'add', itemId: 'apple' }],
      condition,
      eventIds: ['evt1'],
    };
    const result = hydrateAction(json, ctx);
    expect(result.text).toBe('Pick up apple');
    expect(result.condition).toEqual(condition);
    expect(result.eventIds).toEqual(['evt1']);
  });

  it('hydrates each effect', () => {
    const json: JsonAction = {
      kind: 'action',
      text: 'Get apple',
      effects: [{ kind: 'inventory', operation: 'add', itemId: 'apple' }],
    };
    const result = hydrateAction(json, ctx);
    expect(result.effects).toHaveLength(1);
    expect(result.effects?.[0]).toMatchObject({ kind: 'inventory', item });
  });
});

// ── hydrateScene ─────────────────────────────────────────────────────────────

describe('hydrateScene', () => {
  const ctx = makeCtx();

  const jsonScene: JsonScene = {
    kind: 'scene',
    text: 'A quiet library.',
    actions: [{ actions: [{ kind: 'action', text: 'Read', effects: [] }] }],
    completionEffects: [{ kind: 'needs', need: 'Fun', delta: 5 }],
    npcSelection: { npcCount: 1 },
  };

  it('preserves text', () => {
    expect(hydrateScene(jsonScene, ctx).text).toBe('A quiet library.');
  });

  it('hydrates actions', () => {
    const result = hydrateScene(jsonScene, ctx);
    expect(result.actions).toHaveLength(1);
    expect(result.actions[0].actions[0].text).toBe('Read');
  });

  it('hydrates completionEffects', () => {
    const result = hydrateScene(jsonScene, ctx);
    expect(result.completionEffects).toHaveLength(1);
    expect(result.completionEffects?.[0]).toMatchObject({ kind: 'needs' });
  });

  it('preserves npcSelection', () => {
    const result = hydrateScene(jsonScene, ctx);
    expect(result.npcSelection).toEqual({ npcCount: 1 });
  });

  it('leaves completionEffects undefined when absent', () => {
    const minimal: JsonScene = { kind: 'scene', text: 'x', actions: [] };
    expect(hydrateScene(minimal, ctx).completionEffects).toBeUndefined();
  });
});

// ── hydrateScript ─────────────────────────────────────────────────────────────

describe('hydrateScript', () => {
  const ctx = makeCtx();

  const minimalScene: JsonScene = { kind: 'scene', text: 'x', actions: [] };

  it('preserves order for duration-based script', () => {
    const json: JsonScript = {
      id: 's',
      order: 'random',
      duration: 60,
      scenes: [minimalScene],
    };
    expect(hydrateScript(json, ctx).order).toBe('random');
  });

  it('preserves duration and omits endTime', () => {
    const json: JsonScript = {
      id: 's',
      order: 'sequential',
      duration: 45,
      scenes: [minimalScene],
    };
    const result = hydrateScript(json, ctx);
    expect('duration' in result && result.duration).toBe(45);
    expect('endTime' in result ? result.endTime : undefined).toBeUndefined();
  });

  it('preserves endTime and omits duration', () => {
    const json: JsonScript = {
      id: 's',
      order: 'sequential',
      endTime: 1000,
      scenes: [minimalScene],
    };
    const result = hydrateScript(json, ctx);
    expect('endTime' in result && result.endTime).toBe(1000);
    expect('duration' in result ? result.duration : undefined).toBeUndefined();
  });

  it('hydrates scenes', () => {
    const json: JsonScript = {
      id: 's',
      order: 'sequential',
      duration: 10,
      scenes: [minimalScene],
    };
    expect(hydrateScript(json, ctx).scenes[0].text).toBe('x');
  });

  it('hydrates completionEffects', () => {
    const json: JsonScript = {
      id: 's',
      order: 'sequential',
      duration: 10,
      scenes: [minimalScene],
      completionEffects: [{ kind: 'needs', need: 'Energy', delta: -5 }],
    };
    expect(hydrateScript(json, ctx).completionEffects).toHaveLength(1);
  });

  it('preserves npcSelection', () => {
    const json: JsonScript = {
      id: 's',
      order: 'sequential',
      duration: 10,
      scenes: [minimalScene],
      npcSelection: { npcIds: ['npc1'] },
    };
    expect(hydrateScript(json, ctx).npcSelection).toEqual({ npcIds: ['npc1'] });
  });

  it('preserves hideProgress: true (duration-based)', () => {
    const json: JsonScript = {
      id: 's',
      order: 'sequential',
      duration: 10,
      scenes: [minimalScene],
      hideProgress: true,
    };
    expect(hydrateScript(json, ctx).hideProgress).toBe(true);
  });

  it('preserves hideProgress: true (endTime-based)', () => {
    const json: JsonScript = {
      id: 's',
      order: 'sequential',
      endTime: 500,
      scenes: [minimalScene],
      hideProgress: true,
    };
    expect(hydrateScript(json, ctx).hideProgress).toBe(true);
  });

  it('leaves hideProgress undefined when absent', () => {
    const json: JsonScript = {
      id: 's',
      order: 'sequential',
      duration: 10,
      scenes: [minimalScene],
    };
    expect(hydrateScript(json, ctx).hideProgress).toBeUndefined();
  });
});
