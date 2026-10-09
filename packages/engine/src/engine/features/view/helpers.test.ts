import { describe, expect, it } from 'vitest';

import type { Effect, Script } from '@chemicalluck/sim-engine/types';

import { earlyExitEffects } from './helpers';

const scene = { kind: 'scene' as const, text: '', actions: [] };
const pay: Effect = { kind: 'money', amount: 80 };
const back: Effect = { kind: 'view', activeViewId: 'DefaultView', props: {} };

function script(overrides: Partial<Script> = {}): Script {
  return {
    order: 'sequential',
    duration: 240,
    scenes: [scene, scene, scene, scene],
    completionEffects: [pay, back],
    ...overrides,
  } as Script;
}

describe('earlyExitEffects', () => {
  it('applies the leave effects and returns to the default view', () => {
    const fx = earlyExitEffects(
      script({
        leave: { effects: [{ kind: 'needs', need: 'Fun', delta: 5 }] },
      }),
      1,
    );
    expect(fx).toEqual([{ kind: 'needs', need: 'Fun', delta: 5 }, back]);
  });

  it('does not apply completion effects unless asked', () => {
    expect(earlyExitEffects(script({ leave: {} }), 2)).toEqual([back]);
  });

  it('scales completion effect amounts by the turns completed', () => {
    const fx = earlyExitEffects(
      script({ leave: { scaleCompletionEffects: true } }),
      1,
    );
    expect(fx).toEqual([{ kind: 'money', amount: 20 }, back]);
  });

  it('applies nothing scaled when no turns were completed', () => {
    const fx = earlyExitEffects(
      script({ leave: { scaleCompletionEffects: true } }),
      0,
    );
    expect(fx).toEqual([{ kind: 'money', amount: 0 }, back]);
  });

  it('keeps an explicit view effect from the leave effects', () => {
    const toScene: Effect = {
      kind: 'view',
      activeViewId: 'OutfitView',
      props: {},
    };
    expect(
      earlyExitEffects(script({ leave: { effects: [toScene] } }), 1),
    ).toEqual([toScene]);
  });
});
