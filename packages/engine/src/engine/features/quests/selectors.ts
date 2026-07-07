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
    quest.objectives.some((objective) => objective.state === 'complete'),
  ),
);

export function questActions(state: RootState): ActionGroup[] {
  const actions = state.present.quests.flatMap((quest) => {
    const triggers = quest.objectives
      .filter((o) => o.state === 'available' && o.trigger?.kind === 'action')
      .flatMap((o) => {
        const action = o.trigger as Action;
        return {
          effects: [
            ...questObjectiveComplete(quest.id, o.name),
            ...(action.effects ?? []),
          ],
          ...action,
        };
      });
    const conditions = quest.objectives
      .filter((o) => o.state === 'available' && o.condition.kind === 'action')
      .flatMap((o) => {
        const action = o.condition as Action;
        return {
          effects: [
            ...questObjectiveComplete(quest.id, o.name),
            ...(action.effects ?? []),
          ],
          ...action,
        };
      });
    return [...triggers, ...conditions];
  });
  const filtered = actions.filter((a) => isConditionMet(state, a.condition));
  return filtered.length > 0 ? [{ actions: filtered }] : [];
}
