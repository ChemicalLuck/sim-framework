import { toast } from 'sonner';

import {
  type EffectContext,
  dispatchWithGroup,
} from '@chemicalluck/sim-engine/features/core/types';
import { isConditionMet } from '@chemicalluck/sim-engine/lib/conditions';
import { GlobalLogger } from '@chemicalluck/sim-engine/lib/logger';
import type { RootState } from '@chemicalluck/sim-engine/state/store';
import { processEffects } from '@chemicalluck/sim-engine/state/thunks';
import type { Scene } from '@chemicalluck/sim-engine/types';

import { updateQuestObjective } from './slice';
import type { Quest, QuestObjective } from './types';

const logger = GlobalLogger.child('quests');

function fireOnComplete(ctx: EffectContext, objective: QuestObjective) {
  if (objective.onComplete?.length) {
    ctx.dispatch(processEffects(objective.onComplete, ctx.group));
  }
}

function completeObjective(
  ctx: EffectContext,
  quest: Quest,
  objective: QuestObjective,
) {
  logger.debug('Objective complete: ', objective.name);
  toast.success(`Objective Complete: ${objective.name}`);
  dispatchWithGroup(
    ctx.dispatch,
    updateQuestObjective({
      questId: quest.id,
      objectiveName: objective.name,
      objectiveState: 'complete',
    }),
    ctx.group,
  );
  fireOnComplete(ctx, objective);
}

/** Whether the objective was in play, and not yet complete, before this batch. */
function wasIncomplete(
  prevState: RootState,
  quest: Quest,
  objective: QuestObjective,
): boolean {
  const prevQuest = prevState.present.quests.find((q) => q.id === quest.id);
  const prev = prevQuest?.objectives.find((o) => o.name === objective.name);
  return prev !== undefined && prev.state !== 'complete';
}

/**
 * The scene the player was in when this batch of effects ran — i.e. the scene
 * whose choice was just taken — if any.
 */
function sceneChoiceTaken(prevState: RootState): Scene | undefined {
  const { activeViewId, props } = prevState.present.view;
  return activeViewId === 'SceneView' ? (props.scene as Scene) : undefined;
}

// Scenes in state lose their identity across a save/load, so fall back to
// comparing content.
function isSameScene(a: Scene, b: Scene): boolean {
  return a === b || JSON.stringify(a) === JSON.stringify(b);
}

export function handleQuestStateTransitions(ctx: EffectContext) {
  const { dispatch, group, prevState, newState } = ctx;
  if (!newState) throw new Error('uncallable without newState');
  const chosenScene = sceneChoiceTaken(prevState);
  for (const quest of newState.present.quests) {
    for (const objective of quest.objectives) {
      const { state: objState, trigger, condition, name } = objective;

      // Completed by an effect in this batch (an action objective's own
      // completion, or an authored `quest` effect).
      if (objState === 'complete') {
        if (wasIncomplete(prevState, quest, objective)) {
          fireOnComplete(ctx, objective);
        }
        continue;
      }

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

      if (objState !== 'available') continue;
      if (condition.kind === 'scene') {
        if (chosenScene && isSameScene(chosenScene, condition)) {
          completeObjective(ctx, quest, objective);
        }
      } else if (condition.kind !== 'action') {
        if (isConditionMet(newState, condition)) {
          completeObjective(ctx, quest, objective);
        }
      }
    }
  }
}

export default [handleQuestStateTransitions];
