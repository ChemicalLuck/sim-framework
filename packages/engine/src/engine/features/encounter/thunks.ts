import { cryptoRNG } from '@chemicalluck/sim-engine/features/rng/lib/rng';
import { WeightsBuilder } from '@chemicalluck/sim-engine/features/rng/lib/weights';
import { setView } from '@chemicalluck/sim-engine/features/view/slice';
import { isConditionMet } from '@chemicalluck/sim-engine/lib/conditions/evaluator';
import type { EngineThunk } from '@chemicalluck/sim-engine/state/store';
import { processEffects } from '@chemicalluck/sim-engine/state/thunks';
import type { Effect } from '@chemicalluck/sim-engine/types';

import { setEncounterState, setNpcAction, stopEncounter } from './slice';

export const processTurn = (): EngineThunk => (dispatch, getState) => {
  const state = getState();
  const { encounter, currentStateId, playerActiveActions, npcActiveActions } =
    state.present.encounter;
  if (!encounter || !currentStateId) return;

  const currentState = encounter.states.find((s) => s.id === currentStateId);
  if (!currentState) return;

  // Collect effects from all currently active actions (player + NPC)
  const activeEffects: Effect[] = [];

  for (const actionId of Object.values(playerActiveActions)) {
    if (!actionId) continue;
    const action = currentState.actions.find((a) => a.id === actionId);
    if (action?.effects) activeEffects.push(...action.effects);
  }

  for (const actionId of Object.values(npcActiveActions)) {
    if (!actionId) continue;
    const action = currentState.actions.find((a) => a.id === actionId);
    if (action?.effects) activeEffects.push(...action.effects);
  }

  if (activeEffects.length > 0) {
    dispatch(processEffects(activeEffects));
  }

  // NPC picks one action (or passes) from available actions in current state
  const npcId = state.present.encounter.npcId;
  const npc = npcId
    ? state.present.npcs.characters.find((n) => n.id === npcId)
    : null;

  const availableActions = currentState.actions.filter((a) =>
    isConditionMet(state, a.condition),
  );

  const weightMap: Record<string, number> = {
    __pass__: encounter.npcDoNothingWeight ?? 1,
  };

  for (const action of availableActions) {
    let weight = action.npcWeight ?? 1;
    if (npc) {
      for (const [skill, mult] of Object.entries(
        action.npcSkillWeights ?? {},
      )) {
        const skillValue = npc.skills[skill] ?? 0;
        weight *= 1 + (skillValue / 100) * (mult - 1);
      }
      for (const [trait, mult] of Object.entries(
        action.npcTraitWeights ?? {},
      )) {
        if (npc.traits.includes(trait as 'Introverted' | 'Extroverted')) {
          weight *= mult;
        }
      }
    }
    weightMap[action.id] = Math.max(0, weight);
  }

  const picked = new WeightsBuilder<string>()
    .merge(weightMap)
    .normalize()
    .pick(cryptoRNG);

  if (picked !== '__pass__') {
    const pickedAction = availableActions.find((a) => a.id === picked);
    if (pickedAction) {
      dispatch(
        setNpcAction({ bodyPart: pickedAction.bodyPart, actionId: picked }),
      );
    }
  }

  // Evaluate condition-based state transition on the current state
  const freshState = getState();
  const { currentStateId: freshStateId } = freshState.present.encounter;
  if (!freshStateId) return;

  const freshCurrentState = encounter.states.find((s) => s.id === freshStateId);
  if (
    freshCurrentState?.condition &&
    freshCurrentState.transitionTo &&
    isConditionMet(freshState, freshCurrentState.condition)
  ) {
    dispatch(setEncounterState(freshCurrentState.transitionTo));
  }
};

export const stopEncounterThunk = (): EngineThunk => (dispatch, getState) => {
  const { encounter } = getState().present.encounter;
  if (encounter?.stopEffects?.length) {
    dispatch(processEffects(encounter.stopEffects));
  }
  dispatch(stopEncounter());
  dispatch(setView({ activeViewId: 'DefaultView', props: {} }));
};
