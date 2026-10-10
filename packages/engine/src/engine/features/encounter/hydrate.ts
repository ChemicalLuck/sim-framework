import { hydrateEffect } from '@chemicalluck/sim-engine/features/core/hydrate';
import type { HydrationContext } from '@chemicalluck/sim-engine/features/core/hydrate';
import type {
  Encounter,
  EncounterAction,
  EncounterState,
} from '@chemicalluck/sim-engine/features/encounter/types';

import type {
  JsonEncounter,
  JsonEncounterAction,
  JsonEncounterState,
} from './authoring.types';

declare module '@chemicalluck/sim-engine/data' {
  interface ContentExtensions {
    encounters: Encounter[];
  }
}

export function hydrateEncounterAction(
  json: JsonEncounterAction,
  ctx: HydrationContext,
): EncounterAction {
  return {
    id: json.id,
    text: json.text,
    bodyPart: json.bodyPart,
    effects: json.effects?.map((e) => hydrateEffect(e, ctx)),
    condition: json.condition,
    activateTransition: json.activateTransition,
    npcWeight: json.npcWeight,
    npcSkillWeights: json.npcSkillWeights,
    npcTraitWeights: json.npcTraitWeights,
    npcStop: json.npcStop,
  };
}

export function hydrateEncounterState(
  json: JsonEncounterState,
  ctx: HydrationContext,
): EncounterState {
  return {
    id: json.id,
    name: json.name,
    text: json.text,
    actions: json.actions.map((a) => hydrateEncounterAction(a, ctx)),
    condition: json.condition,
    transitionTo: json.transitionTo,
    stopCondition: json.stopCondition,
  };
}

export function hydrateEncounter(
  json: JsonEncounter,
  ctx: HydrationContext,
): Encounter {
  return {
    kind: 'encounter',
    id: json.id,
    name: json.name,
    states: json.states.map((s) => hydrateEncounterState(s, ctx)),
    initialStateId: json.initialStateId,
    npcNeeds: json.npcNeeds,
    npcDoNothingWeight: json.npcDoNothingWeight,
    stopEffects: json.stopEffects?.map((e) => hydrateEffect(e, ctx)),
    stopEffectsByReason: json.stopEffectsByReason
      ? Object.fromEntries(
          Object.entries(json.stopEffectsByReason).map(([reason, effects]) => [
            reason,
            effects.map((e) => hydrateEffect(e, ctx)),
          ]),
        )
      : undefined,
    stopCondition: json.stopCondition,
  };
}

export function hydrateEncounters(
  data: JsonEncounter[],
  ctx: HydrationContext,
): Encounter[] {
  return data.map((e) => hydrateEncounter(e, ctx));
}
