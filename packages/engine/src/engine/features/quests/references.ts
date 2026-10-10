import type {
  JsonAction,
  JsonScene,
} from '@chemicalluck/sim-engine/features/core/types';
import {
  type ContentRef,
  type IdSource,
  type NodeRefExtractor,
  type NodeRefRewriter,
  type RefNode,
  type RefRecord,
  type ReferenceProvider,
  type ReferenceRewriter,
  collectActionGroupRefs,
  collectEffectRefs,
  flattenConditions,
  rewriteActionGroupRefs,
  rewriteEffectRefs,
} from '@chemicalluck/sim-engine/lib/validation';
import type { Condition } from '@chemicalluck/sim-engine/types/condition.types';

import type {
  JsonObjectiveCondition,
  JsonObjectiveTrigger,
  JsonQuest,
  JsonSceneRef,
} from './authoring.types';

const objectiveId = (questId: string, name: string) => `${questId}::${name}`;

export const idSources: IdSource[] = [
  {
    namespace: 'quest',
    file: 'quests',
    select: (data) => (data as JsonQuest[]).map((q) => q.id),
  },
  {
    namespace: 'questObjective',
    file: 'quests',
    select: (data) =>
      (data as JsonQuest[]).flatMap((q) =>
        q.objectives.map((o) => objectiveId(q.id, o.name)),
      ),
  },
  {
    namespace: 'questTemplate',
    file: 'quest-templates',
    select: (data) => (data as { id: string }[]).map((t) => t.id),
  },
];

const questRef: NodeRefExtractor = (node) => {
  if ('kind' in node && node.kind === 'quest' && 'questId' in node) {
    const refs = [{ namespace: 'quest', id: node.questId }];
    if (node.objectiveName) {
      refs.push({
        namespace: 'questObjective',
        id: objectiveId(node.questId, node.objectiveName),
      });
    }
    return refs;
  }
  if ('kind' in node && node.kind === 'quest_create' && 'templateId' in node) {
    return [{ namespace: 'questTemplate', id: node.templateId }];
  }
  return [];
};

export const nodeRefExtractors: NodeRefExtractor[] = [questRef];

/** The scene id of a `{ kind: 'scene', sceneId }` scene objective. */
function sceneRefId(condition: unknown): string | undefined {
  const c = condition as Partial<JsonSceneRef> | undefined;
  return c?.kind === 'scene' && typeof c.sceneId === 'string'
    ? c.sceneId
    : undefined;
}

/**
 * An objective's trigger or condition, split by shape: an action (or the
 * actions of an inline scene, plus its completion effects) or a plain
 * condition tree. A `{ kind: 'scene', sceneId }` ref holds neither.
 */
function objectiveParts(part: JsonObjectiveTrigger | JsonObjectiveCondition): {
  actions: JsonAction[];
  scene?: JsonScene;
  condition?: Condition;
} {
  if (part.kind === 'action') return { actions: [part] };
  if (part.kind === 'scene') {
    return 'sceneId' in part ? { actions: [] } : { actions: [], scene: part };
  }
  return { actions: [], condition: part };
}

function collectPartRefs(
  part: JsonObjectiveTrigger | JsonObjectiveCondition | undefined,
  source: string,
  extract: (node: RefNode) => ContentRef[],
): RefRecord[] {
  if (!part) return [];
  const { actions, scene, condition } = objectiveParts(part);
  return [
    ...collectActionGroupRefs([{ actions }], source, 'quests', extract),
    ...collectActionGroupRefs(scene?.actions, source, 'quests', extract),
    ...collectEffectRefs(scene?.completionEffects, source, 'quests', extract),
    ...collectEffectRefs(
      flattenConditions(condition),
      source,
      'quests',
      extract,
    ),
  ];
}

function rewritePartRefs(
  part: JsonObjectiveTrigger | JsonObjectiveCondition | undefined,
  rewriteNode: (node: RefNode) => boolean,
  ns: string,
  oldId: string,
  newId: string,
): number {
  if (!part) return 0;
  const { actions, scene, condition } = objectiveParts(part);
  return (
    rewriteActionGroupRefs([{ actions }], rewriteNode, ns, oldId, newId) +
    rewriteActionGroupRefs(scene?.actions, rewriteNode, ns, oldId, newId) +
    rewriteEffectRefs(scene?.completionEffects, rewriteNode) +
    rewriteEffectRefs(flattenConditions(condition), rewriteNode)
  );
}

export const referenceProviders: ReferenceProvider[] = [
  {
    file: 'quests',
    section: 'quests',
    collect: (data, extract) =>
      (data as JsonQuest[]).flatMap((quest) =>
        quest.objectives.flatMap((objective) => {
          const source = `quest:${quest.id}`;
          const sceneId = sceneRefId(objective.condition);
          return [
            ...(sceneId
              ? [{ namespace: 'scene', id: sceneId, source, section: 'quests' }]
              : []),
            ...collectPartRefs(objective.condition, source, extract),
            ...collectPartRefs(objective.trigger, source, extract),
            ...collectEffectRefs(
              objective.onComplete,
              source,
              'quests',
              extract,
            ),
          ];
        }),
      ),
  },
];

// Renaming a quest id rewrites both the `questId` ref and — because objective
// ids are composed as `questId::name` — every objective reference made by the
// same node, so no separate questObjective handling is needed here. Objective
// names themselves are not top-level ids and are out of scope for renaming.
const questRewrite: NodeRefRewriter = (node, ns, oldId, newId) => {
  if ('kind' in node && node.kind === 'quest' && 'questId' in node) {
    if (ns === 'quest' && node.questId === oldId) {
      (node as { questId: string }).questId = newId;
      return true;
    }
    return false;
  }
  if (
    ns === 'questTemplate' &&
    'kind' in node &&
    node.kind === 'quest_create' &&
    'templateId' in node &&
    node.templateId === oldId
  ) {
    (node as { templateId: string }).templateId = newId;
    return true;
  }
  return false;
};

export const nodeRefRewriters: NodeRefRewriter[] = [questRewrite];

export const referenceRewriters: ReferenceRewriter[] = [
  {
    file: 'quests',
    rewrite: (data, rewriteNode, ns, oldId, newId) => {
      let count = 0;
      for (const quest of data as JsonQuest[]) {
        for (const objective of quest.objectives) {
          if (ns === 'scene' && sceneRefId(objective.condition) === oldId) {
            (objective.condition as JsonSceneRef).sceneId = newId;
            count++;
          }
          for (const part of [objective.condition, objective.trigger]) {
            count += rewritePartRefs(part, rewriteNode, ns, oldId, newId);
          }
          count += rewriteEffectRefs(objective.onComplete, rewriteNode);
        }
      }
      return count;
    },
  },
];
