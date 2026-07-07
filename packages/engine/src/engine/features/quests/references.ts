import {
  type IdSource,
  type NodeRefExtractor,
  type NodeRefRewriter,
  type ReferenceProvider,
  type ReferenceRewriter,
  flattenConditions,
} from '@chemicalluck/engine/lib/validation';
import type { Condition } from '@chemicalluck/engine/types/condition.types';

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

export const referenceProviders: ReferenceProvider[] = [
  {
    file: 'quests',
    section: 'quests',
    collect: (data, extract) =>
      (data as Quest[]).flatMap((quest) =>
        quest.objectives.flatMap((objective) =>
          [objective.condition, objective.trigger]
            .filter((c): c is Condition => c != null)
            .flatMap((cond) =>
              flattenConditions(cond).flatMap((conditionNode) =>
                extract(conditionNode).map((ref) => ({
                  ...ref,
                  source: `quest:${quest.id}`,
                  section: 'quests',
                })),
              ),
            ),
        ),
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
    rewrite: (data, rewriteNode) => {
      let count = 0;
      for (const quest of data as Quest[]) {
        for (const objective of quest.objectives) {
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
