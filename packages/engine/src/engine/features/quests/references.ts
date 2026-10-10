import {
  type IdSource,
  type NodeRefExtractor,
  type NodeRefRewriter,
  type ReferenceProvider,
  type ReferenceRewriter,
  flattenConditions,
} from '@chemicalluck/sim-engine/lib/validation';
import type { Condition } from '@chemicalluck/sim-engine/types/condition.types';

import type { JsonSceneRef } from './authoring.types';
import type { Quest } from './types';

const objectiveId = (questId: string, name: string) => `${questId}::${name}`;

export const idSources: IdSource[] = [
  {
    namespace: 'quest',
    file: 'quests',
    select: (data) => (data as Quest[]).map((q) => q.id),
  },
  {
    namespace: 'questObjective',
    file: 'quests',
    select: (data) =>
      (data as Quest[]).flatMap((q) =>
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

export const referenceProviders: ReferenceProvider[] = [
  {
    file: 'quests',
    section: 'quests',
    collect: (data, extract) =>
      (data as Quest[]).flatMap((quest) =>
        quest.objectives.flatMap((objective) => {
          const source = `quest:${quest.id}`;
          const sceneId = sceneRefId(objective.condition);
          return [
            ...(sceneId
              ? [{ namespace: 'scene', id: sceneId, source, section: 'quests' }]
              : []),
            ...[objective.condition, objective.trigger]
              .filter((c): c is Condition => c != null)
              .flatMap((cond) =>
                flattenConditions(cond).flatMap((conditionNode) =>
                  extract(conditionNode).map((ref) => ({
                    ...ref,
                    source,
                    section: 'quests',
                  })),
                ),
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
      for (const quest of data as Quest[]) {
        for (const objective of quest.objectives) {
          if (ns === 'scene' && sceneRefId(objective.condition) === oldId) {
            (objective.condition as unknown as JsonSceneRef).sceneId = newId;
            count++;
          }
          for (const cond of [objective.condition, objective.trigger].filter(
            (c): c is Condition => c != null,
          )) {
            for (const node of flattenConditions(cond)) {
              if (rewriteNode(node)) count++;
            }
          }
        }
      }
      return count;
    },
  },
];
