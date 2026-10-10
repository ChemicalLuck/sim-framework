import { createSelector } from '@reduxjs/toolkit';

import { isConditionMet } from '@chemicalluck/sim-engine/lib/conditions';
import type { RootState } from '@chemicalluck/sim-engine/state/store';
import type { Action, ActionGroup } from '@chemicalluck/sim-engine/types';

import { questObjectiveComplete } from './effects';

export const selectQuests = (state: RootState) => state.present.quests;

export const selectActiveQuests = createSelector([selectQuests], (quests) =>
  quests.filter((quest) =>
    quest.objectives.some((objective) => objective.state === 'available'),
  ),
);

export const selectCompletedQuests = createSelector([selectQuests], (quests) =>
  quests.filter((quest) =>
    quest.objectives.every((objective) => objective.state === 'complete'),
  ),
);

/** The objective's action, completing the objective after its own effects. */
function completingAction(
  action: Action,
  questId: string,
  objectiveName: string,
): Action {
  return {
    ...action,
    effects: [
      ...(action.effects ?? []),
      ...questObjectiveComplete(questId, objectiveName),
    ],
  };
}

/**
 * Actions offered by available objectives: an action `condition`, or an action
 * `trigger` (which unlocks the objective once the action's own condition holds;
 * see the quests post-effect). Taking either completes the objective.
 */
export function questActions(state: RootState): ActionGroup[] {
  const actions = state.present.quests.flatMap((quest) => {
    const triggers = quest.objectives
      .filter((o) => o.state === 'available' && o.trigger?.kind === 'action')
      .map((o) => completingAction(o.trigger as Action, quest.id, o.name));
    const conditions = quest.objectives
      .filter((o) => o.state === 'available' && o.condition.kind === 'action')
      .map((o) => completingAction(o.condition as Action, quest.id, o.name));
    return [...triggers, ...conditions];
  });
  const filtered = actions.filter((a) => isConditionMet(state, a.condition));
  return filtered.length > 0 ? [{ actions: filtered }] : [];
}
