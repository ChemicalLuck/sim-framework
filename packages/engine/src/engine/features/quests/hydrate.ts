import {
  type HydrationContext,
  hydrateAction,
  hydrateEffect,
  hydrateScene,
} from '@chemicalluck/sim-engine/features/core/hydrate';

import type {
  JsonObjectiveCondition,
  JsonObjectiveTrigger,
  JsonQuest,
  JsonQuestObjective,
  JsonQuestTemplate,
} from './authoring.types';
import type {
  ObjectiveCondition,
  ObjectiveTrigger,
  Quest,
  QuestObjective,
  QuestTemplate,
} from './types';

function hydrateTrigger(
  trigger: JsonObjectiveTrigger,
  ctx: HydrationContext,
): ObjectiveTrigger {
  return trigger.kind === 'action' ? hydrateAction(trigger, ctx) : trigger;
}

function hydrateCondition(
  condition: JsonObjectiveCondition,
  ctx: HydrationContext,
): ObjectiveCondition {
  if (condition.kind === 'action') return hydrateAction(condition, ctx);
  if (condition.kind === 'scene') {
    return 'sceneId' in condition
      ? ctx.scenes.get(condition.sceneId)
      : hydrateScene(condition, ctx);
  }
  return condition;
}

function hydrateObjective(
  objective: JsonQuestObjective,
  ctx: HydrationContext,
): QuestObjective {
  return {
    state: objective.state,
    name: objective.name,
    trigger: objective.trigger && hydrateTrigger(objective.trigger, ctx),
    condition: hydrateCondition(objective.condition, ctx),
    onComplete: objective.onComplete?.map((e) => hydrateEffect(e, ctx)),
  };
}

/**
 * Resolve `quests.json` shorthand (`sceneId`/`scriptId`/`itemId` effects,
 * `{ kind: 'scene', sceneId }` objectives) against the loaded content. Runs as
 * a content extension, after scenes and scripts are hydrated.
 */
export function hydrateQuests(
  data: JsonQuest[],
  ctx: HydrationContext,
): Quest[] {
  return data.map((quest) => ({
    id: quest.id,
    name: quest.name,
    objectives: quest.objectives.map((o) => hydrateObjective(o, ctx)),
  }));
}

/**
 * Resolve `quest-templates.json` shorthand the same way as {@link hydrateQuests}.
 * Name and id templates are left as authored; they're rendered per NPC when a
 * `quest_create` effect instantiates the template.
 */
export function hydrateQuestTemplates(
  data: JsonQuestTemplate[],
  ctx: HydrationContext,
): QuestTemplate[] {
  return data.map((template) => ({
    id: template.id,
    idTemplate: template.idTemplate,
    name: template.name,
    objectives: template.objectives.map((o) => hydrateObjective(o, ctx)),
  }));
}
