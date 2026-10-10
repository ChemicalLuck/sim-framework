import type { RelationshipMetric } from '@chemicalluck/sim-engine/features/npcs/types';
import { DEFAULT_NPC_RELATIONSHIP } from '@chemicalluck/sim-engine/features/relationships/slice';
import type { RootState } from '@chemicalluck/sim-engine/state/store';

import { findNpc, getEncounterActor } from './lib/actor';

export interface NpcNeedExpr {
  kind: 'npcNeed';
  need: string;
}

/**
 * `self.skill.<id>` / `self.need.<id>`: the actor whose action is being
 * checked — the NPC while filtering its pool, otherwise the player.
 */
export interface EncounterSelfExpr {
  kind: 'encounterSelf';
  stat: 'skill' | 'need';
  key: string;
}

/** `npc.skill.<id>`, `npc.need.<id>`, `npc.relationship.<metric>`: the encounter NPC. */
export interface EncounterNpcExpr {
  kind: 'encounterNpc';
  stat: 'skill' | 'need' | 'relationship';
  key: string;
}

declare module '@chemicalluck/sim-engine/types/condition.types' {
  interface ExprMap {
    npcNeed: NpcNeedExpr;
    encounterSelf: EncounterSelfExpr;
    encounterNpc: EncounterNpcExpr;
  }
}

const METRICS: readonly RelationshipMetric[] = [
  'Friendship',
  'Romance',
  'Attraction',
];

function npcStat(
  state: RootState,
  npcId: string | null,
  stat: EncounterNpcExpr['stat'],
  key: string,
): number {
  switch (stat) {
    case 'skill':
      return findNpc(state, npcId)?.skills[key] ?? 0;
    case 'need':
      return state.present.encounter.npcNeeds[key] ?? 0;
    case 'relationship': {
      const rel =
        (npcId != null ? state.present.relationships[npcId] : undefined) ??
        DEFAULT_NPC_RELATIONSHIP;
      return rel.relationship[key as RelationshipMetric];
    }
  }
}

export const exprKinds = ['npcNeed', 'encounterSelf', 'encounterNpc'];

export const exprParsers = [
  (id: string): NpcNeedExpr | null => {
    if (!id.startsWith('npcNeed.')) return null;
    return { kind: 'npcNeed', need: id.slice('npcNeed.'.length) };
  },
  (id: string): EncounterSelfExpr | null => {
    const match = /^self\.(skill|need)\.(.+)$/.exec(id);
    if (!match) return null;
    return {
      kind: 'encounterSelf',
      stat: match[1] as EncounterSelfExpr['stat'],
      key: match[2],
    };
  },
  (id: string): EncounterNpcExpr | null => {
    const match = /^npc\.(skill|need|relationship)\.(.+)$/.exec(id);
    if (!match) return null;
    const stat = match[1] as EncounterNpcExpr['stat'];
    if (stat !== 'relationship') {
      return { kind: 'encounterNpc', stat, key: match[2] };
    }
    const metric = METRICS.find(
      (m) => m.toLowerCase() === match[2].toLowerCase(),
    );
    return metric ? { kind: 'encounterNpc', stat, key: metric } : null;
  },
];

export const exprEvaluators = {
  npcNeed: (e: NpcNeedExpr, state: RootState): number =>
    state.present.encounter.npcNeeds[e.need] ?? 0,
  encounterSelf: (e: EncounterSelfExpr, state: RootState): number => {
    const actor = getEncounterActor();
    if (actor.kind === 'npc') return npcStat(state, actor.npcId, e.stat, e.key);
    return e.stat === 'skill'
      ? (state.present.player.skills[e.key] ?? 0)
      : (state.present.needs[e.key] ?? 0);
  },
  encounterNpc: (e: EncounterNpcExpr, state: RootState): number =>
    npcStat(state, state.present.encounter.npcId ?? null, e.stat, e.key),
};

export const exprSerializers = {
  npcNeed: (e: NpcNeedExpr) => `npcNeed.${e.need}`,
  encounterSelf: (e: EncounterSelfExpr) => `self.${e.stat}.${e.key}`,
  encounterNpc: (e: EncounterNpcExpr) => `npc.${e.stat}.${e.key}`,
};

export default {};
