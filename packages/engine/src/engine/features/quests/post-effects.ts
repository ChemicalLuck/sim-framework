import { toast } from 'sonner';
import {
  type EffectContext,
  dispatchWithGroup,
} from '@sim/engine/features/core/types';
import { isConditionMet } from '@sim/engine/lib/conditions';
import { GlobalLogger } from '@sim/engine/lib/logger';
import { processEffects } from '@sim/engine/state/thunks';

import { updateQuestObjective } from './slice';

const logger = GlobalLogger.child('quests');

export function handleQuestStateTransitions(ctx: EffectContext) {
  const { dispatch, group, newState } = ctx;
  if (!newState) throw new Error('uncallable without newState');
  for (const quest of newState.present.quests) {
    for (const objective of quest.objectives) {
      const { state: objState, trigger, condition, name } = objective;

      if (objState === 'locked' && trigger?.kind !== 'action') {
        if (isConditionMet(newState, trigger)) {
          logger.debug('Objective available: ', name);
          toast(`Objective Available: ${name}`);
          dispatchWithGroup(
            dispatch,
            updateQuestObjective({
              questId: quest.id,
              objectiveName: name,
              objectiveState: 'available',
            }),
            group,
          );
        }
      }

      const conditionType = condition.kind;
      if (
        objState === 'available' &&
        conditionType !== 'action' &&
        conditionType !== 'scene'
      ) {
        if (isConditionMet(newState, condition)) {
          logger.debug('Objective complete: ', name);
          toast.success(`Objective Complete: ${name}`);
          dispatchWithGroup(
            dispatch,
            updateQuestObjective({
              questId: quest.id,
              objectiveName: name,
              objectiveState: 'complete',
            }),
            group,
          );
          if (objective.onComplete?.length) {
            dispatch(processEffects(objective.onComplete, ctx.group));
          }
        }
      }
    }
  }
}

export default [handleQuestStateTransitions];
