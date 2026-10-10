import type { RelationshipMetric } from '@chemicalluck/sim-engine/features/npcs/types';
import { DEFAULT_NPC_RELATIONSHIP } from '@chemicalluck/sim-engine/features/relationships/slice';
import type { RootState } from '@chemicalluck/sim-engine/state/store';

import { findNpc, getEncounterActor } from './lib/actor';
import type { EncounterSliceState } from './slice';

/** `npcNeed.<need>` (first NPC still present) or `npcNeed.<slot>.<need>`. */
export interface NpcNeedExpr {
  kind: 'npcNeed';
  need: string;
  slot?: number;
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

/**
 * `npc.skill.<id>`, `npc.need.<id>`, `npc.relationship.<metric>`: the first
 * encounter NPC still present, or the NPC in `slot` with `npc.<slot>.*`.
 */
export interface EncounterNpcExpr {
  kind: 'encounterNpc';
  stat: 'skill' | 'need' | 'relationship';
  key: string;
  slot?: number;
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

/**
 * The NPC a slot refers to: the first NPC still present without a slot,
 * otherwise the slot's NPC (undefined when the slot is empty).
 */
function npcInSlot(state: RootState, slot?: number): string | null | undefined {
  const encounter = state.present.encounter as Partial<EncounterSliceState>;
  if (slot === undefined) return encounter.npcId ?? null;
  return encounter.npcIds?.[slot];
}

function npcStat(
  state: RootState,
  npcId: string | null,
  stat: EncounterNpcExpr['stat'],
  key: string,
): number {
  switch (stat) {
    case 'skill':
      return findNpc(state, npcId)?.skills[key] ?? 0;
    case 'need': {
      const encounter = state.present.encounter as Partial<EncounterSliceState>;
      const needs =
        (npcId != null ? encounter.npcs?.[npcId]?.needs : undefined) ??
        encounter.npcNeeds;
      return needs?.[key] ?? 0;
    }
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
    const match = /^npcNeed\.(?:(\d+)\.)?(.+)$/.exec(id);
    if (!match) return null;
    const slot = match[1] as string | undefined;
    return slot === undefined
      ? { kind: 'npcNeed', need: match[2] }
      : { kind: 'npcNeed', need: match[2], slot: Number(slot) };
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
    const match = /^npc\.(?:(\d+)\.)?(skill|need|relationship)\.(.+)$/.exec(id);
    if (!match) return null;
    const stat = match[2] as EncounterNpcExpr['stat'];
    const key =
      stat === 'relationship'
        ? METRICS.find((m) => m.toLowerCase() === match[3].toLowerCase())
        : match[3];
    if (!key) return null;
    const slot = match[1] as string | undefined;
    return slot === undefined
      ? { kind: 'encounterNpc', stat, key }
      : { kind: 'encounterNpc', stat, key, slot: Number(slot) };
  },
];

export const exprEvaluators = {
  npcNeed: (e: NpcNeedExpr, state: RootState): number => {
    const npcId = npcInSlot(state, e.slot);
    return npcId === undefined ? 0 : npcStat(state, npcId, 'need', e.need);
  },
  encounterSelf: (e: EncounterSelfExpr, state: RootState): number => {
    const actor = getEncounterActor();
    if (actor.kind === 'npc') return npcStat(state, actor.npcId, e.stat, e.key);
    return e.stat === 'skill'
      ? (state.present.player.skills[e.key] ?? 0)
      : (state.present.needs[e.key] ?? 0);
  },
  encounterNpc: (e: EncounterNpcExpr, state: RootState): number => {
    const npcId = npcInSlot(state, e.slot);
    return npcId === undefined ? 0 : npcStat(state, npcId, e.stat, e.key);
  },
};

export const exprSerializers = {
  npcNeed: (e: NpcNeedExpr) =>
    e.slot === undefined
      ? `npcNeed.${e.need}`
      : `npcNeed.${String(e.slot)}.${e.need}`,
  encounterSelf: (e: EncounterSelfExpr) => `self.${e.stat}.${e.key}`,
  encounterNpc: (e: EncounterNpcExpr) =>
    e.slot === undefined
      ? `npc.${e.stat}.${e.key}`
      : `npc.${String(e.slot)}.${e.stat}.${e.key}`,
};

export default {};
