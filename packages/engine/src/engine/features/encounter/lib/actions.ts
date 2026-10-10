import { isConditionMet } from '@chemicalluck/sim-engine/lib/conditions/evaluator';
import type { RootState } from '@chemicalluck/sim-engine/state/store';

import type { EncounterAction, EncounterState } from '../types';
import { type EncounterActor, withEncounterActor } from './actor';

function canAct(
  action: EncounterAction,
  actor: EncounterActor['kind'],
): boolean {
  if (actor === 'player') {
    return !action.npcStop && action.actor !== 'npc';
  }
  return action.actor !== 'player';
}

/** Actions in `encounterState` the player may toggle right now. */
export function playerActions(
  state: RootState,
  encounterState: EncounterState,
): EncounterAction[] {
  return withEncounterActor({ kind: 'player' }, () =>
    encounterState.actions.filter(
      (a) => canAct(a, 'player') && isConditionMet(state, a.condition),
    ),
  );
}

/** Actions in `encounterState` the NPC `npcId` may pick right now. */
export function npcActions(
  state: RootState,
  encounterState: EncounterState,
  npcId: string,
): EncounterAction[] {
  return withEncounterActor({ kind: 'npc', npcId }, () =>
    encounterState.actions.filter(
      (a) => canAct(a, 'npc') && isConditionMet(state, a.condition),
    ),
  );
}
