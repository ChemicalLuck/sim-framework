import type { NPC } from '@chemicalluck/sim-engine/features/npcs/types';
import { getSkillMax } from '@chemicalluck/sim-engine/features/player/lib/skills';
import {
  forkRng,
  worldRng,
} from '@chemicalluck/sim-engine/features/rng/lib/rng';
import { WeightsBuilder } from '@chemicalluck/sim-engine/features/rng/lib/weights';
import { setView } from '@chemicalluck/sim-engine/features/view/slice';
import { isConditionMet } from '@chemicalluck/sim-engine/lib/conditions/evaluator';
import type { EngineThunk } from '@chemicalluck/sim-engine/state/store';
import {
  hashEffects,
  processEffects,
} from '@chemicalluck/sim-engine/state/thunks';
import type { Effect } from '@chemicalluck/sim-engine/types';

import { npcActions } from './lib/actions';
import { findNpc, withEncounterEffectNpc } from './lib/actor';
import {
  npcLeaveEncounter,
  presentNpcIds,
  setEncounterState,
  setNpcAction,
  stopEncounter,
} from './slice';
import type { Encounter, EncounterAction, EncounterStopReason } from './types';

/**
 * An NPC's selection weight for an action. Skill multipliers scale with the
 * NPC's skill as a fraction of the configured skill scale: at the top level
 * the full multiplier applies, at 0 none of it does.
 */
export function npcActionWeight(
  action: EncounterAction,
  npc: NPC | null | undefined,
): number {
  let weight = action.npcWeight ?? 1;
  if (npc) {
    const skillMax = getSkillMax();
    for (const [skill, mult] of Object.entries(action.npcSkillWeights ?? {})) {
      const skillValue = npc.skills[skill] ?? 0;
      weight *= 1 + (skillValue / skillMax) * (mult - 1);
    }
    for (const [trait, mult] of Object.entries(action.npcTraitWeights ?? {})) {
      if (npc.traits.includes(trait as 'Introverted' | 'Extroverted')) {
        weight *= mult;
      }
    }
  }
  return Math.max(0, weight);
}

/** The NPC an action's NPC-scoped effects apply to. */
function effectNpcFor(
  action: EncounterAction,
  actorNpcId: string | null,
  npcIds: string[],
): string | null {
  if (typeof action.target === 'number') {
    return npcIds[action.target] ?? actorNpcId;
  }
  return actorNpcId;
}

/** Apply effects with NPC-scoped effects going to `npcId`. */
const processScopedEffects =
  (effects: Effect[], npcId: string | null, group: string): EngineThunk =>
  (dispatch) => {
    if (!effects.length) return;
    withEncounterEffectNpc(npcId, () => {
      dispatch(processEffects(effects, group));
    });
  };

/** NPCs still present, in the encounter's turn order. */
export function npcsInTurnOrder(
  encounter: Encounter,
  npcIds: string[],
  present: string[],
): string[] {
  const ordered = (encounter.npcTurnOrder ?? [])
    .map((slot) => npcIds[slot])
    .filter((id) => present.includes(id));
  return [...new Set([...ordered, ...present])];
}

export const processTurn = (): EngineThunk => (dispatch, getState) => {
  const state = getState();
  const { encounter, currentStateId, playerActiveActions, npcIds, npcs } =
    state.present.encounter;
  if (!encounter || !currentStateId) return;

  const currentState = encounter.states.find((s) => s.id === currentStateId);
  if (!currentState) return;

  const findAction = (actionId: string | null) =>
    actionId ? currentState.actions.find((a) => a.id === actionId) : undefined;
  const present = presentNpcIds(state.present.encounter);
  const group = hashEffects();

  // Apply effects from all currently active actions (player, then each NPC),
  // scoping NPC-targeted effects to the acting or targeted NPC
  for (const actionId of Object.values(playerActiveActions)) {
    const action = findAction(actionId);
    if (!action?.effects) continue;
    dispatch(
      processScopedEffects(
        action.effects,
        effectNpcFor(action, state.present.encounter.npcId, npcIds),
        group,
      ),
    );
  }

  const npcActiveActions: [string | null, string | null][] = npcIds.length
    ? present.flatMap((npcId) =>
        Object.values(npcs[npcId].activeActions).map(
          (actionId): [string | null, string | null] => [npcId, actionId],
        ),
      )
    : // Encounter started without an NPC: the legacy single-NPC fields
      Object.values(state.present.encounter.npcActiveActions).map(
        (actionId): [string | null, string | null] => [null, actionId],
      );
  for (const [npcId, actionId] of npcActiveActions) {
    const action = findAction(actionId);
    if (!action?.effects) continue;
    dispatch(
      processScopedEffects(
        action.effects,
        effectNpcFor(action, npcId, npcIds),
        group,
      ),
    );
  }

  // Each NPC still present picks one action (or passes) in turn order
  const pickers = npcIds.length
    ? npcsInTurnOrder(encounter, npcIds, present)
    : [state.present.encounter.npcId ?? ''];
  for (const npcId of pickers) {
    const npc = findNpc(state, npcId);

    // The NPC's pool: actions it may take, with `self.*` resolving to the NPC
    const availableActions = npcActions(state, currentState, npcId);

    const weightMap: Record<string, number> = {
      __pass__: encounter.npcDoNothingWeight ?? 1,
    };
    for (const action of availableActions) {
      weightMap[action.id] = npcActionWeight(action, npc);
    }

    const picked = new WeightsBuilder<string>()
      .merge(weightMap)
      .normalize()
      .pick(forkRng(worldRng, `encounter:${encounter.id}`));
    const pickedAction = availableActions.find((a) => a.id === picked);
    if (!pickedAction) continue;

    if (pickedAction.npcStop) {
      dispatch(
        processScopedEffects(
          pickedAction.effects ?? [],
          effectNpcFor(pickedAction, npcId, npcIds),
          group,
        ),
      );
      // The encounter ends once no NPC remains; otherwise this one leaves
      if (presentNpcIds(getState().present.encounter).length <= 1) {
        dispatch(stopEncounterThunk('npc'));
        return;
      }
      dispatch(npcLeaveEncounter(npcId));
      continue;
    }

    dispatch(
      setNpcAction({
        bodyPart: pickedAction.bodyPart,
        actionId: pickedAction.id,
        npcId: npcIds.length ? npcId : undefined,
      }),
    );
  }

  const freshState = getState();
  const { currentStateId: freshStateId } = freshState.present.encounter;
  if (!freshStateId) return;

  const freshCurrentState = encounter.states.find((s) => s.id === freshStateId);

  // Stop conditions (encounter-wide or on the current state) end the encounter
  const stopConditions = [
    encounter.stopCondition,
    freshCurrentState?.stopCondition,
  ].filter((c) => c !== undefined);
  if (stopConditions.some((c) => isConditionMet(freshState, c))) {
    dispatch(stopEncounterThunk('condition'));
    return;
  }

  // Evaluate condition-based state transition on the current state
  if (
    freshCurrentState?.condition &&
    freshCurrentState.transitionTo &&
    isConditionMet(freshState, freshCurrentState.condition)
  ) {
    dispatch(setEncounterState(freshCurrentState.transitionTo));
  }
};

/**
 * End the encounter: apply its `stopEffects` and the effects for `reason`,
 * then return to the default view.
 */
export const stopEncounterThunk =
  (reason: EncounterStopReason = 'player'): EngineThunk =>
  (dispatch, getState) => {
    const { encounter } = getState().present.encounter;
    const effects = [
      ...(encounter?.stopEffects ?? []),
      ...(encounter?.stopEffectsByReason?.[reason] ?? []),
    ];
    if (effects.length) {
      dispatch(processEffects(effects));
    }
    dispatch(stopEncounter());
    dispatch(setView({ activeViewId: 'DefaultView', props: {} }));
  };
