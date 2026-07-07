import { toast } from 'sonner';
import {
  type EffectContext,
  dispatchWithGroup,
} from '@chemicalluck/sim-engine/features/core/types';
import { GlobalLogger } from '@chemicalluck/sim-engine/lib/logger';
import type { Effect } from '@chemicalluck/sim-engine/types';

import { getQuestTemplate, instantiateQuestTemplate } from './lib/templates';
import { addQuest, updateQuestObjective } from './slice';
import type { QuestCreateEffect, QuestEffect } from './types';

const logger = GlobalLogger.child('quests');

export const questObjectiveComplete = (
  questId: string,
  objectiveName: string,
): Effect[] => [
  { kind: 'quest', questId, objectiveName, objectiveState: 'complete' },
];

export function handleQuestEffect(
  effect: QuestEffect,
  { dispatch, group, prevState }: EffectContext,
) {
  const { questId, objectiveName, objectiveState } = effect;
  if (!prevState.present.quests.find((q) => q.id === questId)) {
    throw new Error('Quest not found');
  }
  logger.debug('Objective updated: ', objectiveName);
  toast(`Objective updated: ${objectiveName}`);
  dispatchWithGroup(
    dispatch,
    updateQuestObjective({ questId, objectiveName, objectiveState }),
    group,
  );
}

export function handleQuestCreateEffect(
  effect: QuestCreateEffect,
  { dispatch, group, prevState }: EffectContext,
) {
  const template = getQuestTemplate(effect.templateId);
  if (!template)
    throw new Error(`Quest template not found: ${effect.templateId}`);

  const npc = prevState.present.npcs.characters.find(
    (n) => n.id === effect.npcId,
  );
  if (!npc) throw new Error(`NPC not found: ${effect.npcId}`);

  const quest = instantiateQuestTemplate(template, npc);

  if (prevState.present.quests.find((q) => q.id === quest.id)) return;

  toast(`New quest: ${quest.name}`);
  dispatchWithGroup(dispatch, addQuest(quest), group);
}

export default {
  quest: handleQuestEffect,
  quest_create: handleQuestCreateEffect,
};
