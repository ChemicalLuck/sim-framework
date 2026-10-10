import { describe, expect, it } from 'vitest';

import * as coreRefs from '@chemicalluck/sim-engine/features/core/references';
import type { JsonSceneWithId } from '@chemicalluck/sim-engine/features/core/types';
import * as outfitRefs from '@chemicalluck/sim-engine/features/outfits/references';
import {
  type ReferenceContributions,
  validateReferences,
} from '@chemicalluck/sim-engine/lib/validation';

import * as needRefs from './references';

const contributions: ReferenceContributions = {
  idSources: [...coreRefs.idSources, ...needRefs.idSources],
  referenceProviders: [
    ...coreRefs.referenceProviders,
    ...needRefs.referenceProviders,
    ...outfitRefs.referenceProviders,
  ],
  nodeRefExtractors: needRefs.nodeRefExtractors,
  nodeRefRewriters: [],
  referenceRewriters: [],
};

const needs = {
  needs: { Energy: 100, Hygiene: 100 },
  decayRates: { Energy: 5, Hygiene: 2 },
};

function scene(actions: JsonSceneWithId['actions']): JsonSceneWithId[] {
  return [{ id: 'cafe', text: '', actions } as JsonSceneWithId];
}

function issues(data: Record<string, unknown>) {
  return validateReferences({ needs, ...data }, contributions).map(
    (i) => `${i.source}: ${i.message}`,
  );
}

describe('need references', () => {
  it('flags needs effects and need conditions naming an undeclared need', () => {
    const scenes = scene([
      {
        actions: [
          {
            text: 'Nap',
            condition: {
              kind: 'lt',
              lhs: { kind: 'need', need: 'Sleepiness' },
              rhs: { kind: 'const', value: 20 },
            },
            effects: [
              { kind: 'needs', need: 'Energy', delta: 5 },
              { kind: 'needs', need: 'Stamina', delta: 5 },
            ],
          },
        ],
      },
    ] as JsonSceneWithId['actions']);
    expect(issues({ scenes })).toEqual([
      "scene:cafe: references unknown need 'Stamina'",
      "scene:cafe: references unknown need 'Sleepiness'",
    ]);
  });

  it('accepts declared needs and ignores NPC needs effects', () => {
    const scenes = scene([
      {
        actions: [
          {
            text: 'Chat',
            condition: {
              kind: 'gte',
              lhs: { kind: 'need', need: 'Hygiene' },
              rhs: { kind: 'const', value: 50 },
            },
            effects: [
              { kind: 'needs', need: 'Energy', delta: -5 },
              { kind: 'needs', need: 'Arousal', delta: 5, target: 'npc' },
            ],
          },
        ],
      },
    ] as JsonSceneWithId['actions']);
    expect(issues({ scenes })).toEqual([]);
  });

  it('flags explicitly configured clothing needs that are not declared', () => {
    expect(
      issues({
        'wearables-config': {
          clothingNeeds: {
            hygiene: { need: 'Cleanliness' },
            comfort: { need: 'Energy' },
          },
        },
      }),
    ).toEqual(["wearables-config: references unknown need 'Cleanliness'"]);
  });

  it('does not flag default or disabled clothing needs', () => {
    // The default comfort need (Comfort) is undeclared here, but only
    // explicitly configured needs are checked.
    expect(issues({ 'wearables-config': {} })).toEqual([]);
    expect(
      issues({
        'wearables-config': {
          clothingNeeds: { hygiene: { maxDrainPerHour: 2 }, comfort: null },
        },
      }),
    ).toEqual([]);
  });

  it('skips need checks when needs.json is absent', () => {
    expect(
      validateReferences(
        {
          'wearables-config': {
            clothingNeeds: { hygiene: { need: 'Cleanliness' } },
          },
        },
        contributions,
      ),
    ).toEqual([]);
  });
});
