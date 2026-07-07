import type { Condition } from '@chemicalluck/engine/types/condition.types';

import type { ContentRef, RefNode, RefRecord } from './types';

/**
 * The minimal shape a walkable action group must satisfy. Both the runtime
 * `ActionGroup` and the authoring `JsonActionGroup` are assignable to it, so
 * providers pass their real types through without casting.
 */
export interface ActionGroupLike {
  actions: {
    effects?: RefNode[];
    condition?: Condition;
    eventIds?: string[];
  }[];
}

/** Namespace under which an action's `eventIds` reference events. */
const EVENT_NAMESPACE = 'event';

/** Flatten a condition tree into every condition node it contains. */
export function flattenConditions(cond: Condition | undefined): Condition[] {
  if (!cond) return [];
  const out: Condition[] = [cond];
  if (cond.kind === 'and' || cond.kind === 'or') {
    out.push(...flattenConditions(cond.lhs), ...flattenConditions(cond.rhs));
  } else if (cond.kind === 'not') {
    out.push(...flattenConditions(cond.operand));
  }
  return out;
}

/** Collect references from every effect node in a flat effect list. */
export function collectEffectRefs(
  effects: RefNode[] | undefined,
  source: string,
  section: string,
  extract: (node: RefNode) => ContentRef[],
): RefRecord[] {
  return (effects ?? []).flatMap((fx) =>
    extract(fx).map((ref) => ({ ...ref, source, section })),
  );
}

/**
 * Collect references from every effect and condition across a set of action
 * groups, tagging each with the given source label and editor section. Shared
 * by feature reference providers whose content is action-group shaped (scenes,
 * scripts, locations, items).
 */
export function collectActionGroupRefs(
  groups: ActionGroupLike[] | undefined,
  source: string,
  section: string,
  extract: (node: RefNode) => ContentRef[],
): RefRecord[] {
  const records: RefRecord[] = [];
  const add = (refs: ContentRef[]) => {
    for (const ref of refs) records.push({ ...ref, source, section });
  };
  for (const group of groups ?? []) {
    for (const action of group.actions) {
      for (const fx of action.effects ?? []) add(extract(fx));
      for (const cond of flattenConditions(action.condition))
        add(extract(cond));
      for (const eventId of action.eventIds ?? []) {
        add([{ namespace: EVENT_NAMESPACE, id: eventId }]);
      }
    }
  }
  return records;
}

/**
 * Mutating mirror of {@link collectEffectRefs}: rewrites references in a flat
 * effect list via the composed node rewriter. Returns the number of changes.
 */
export function rewriteEffectRefs(
  effects: RefNode[] | undefined,
  rewriteNode: (node: RefNode) => boolean,
): number {
  let count = 0;
  for (const fx of effects ?? []) if (rewriteNode(fx)) count++;
  return count;
}

/**
 * Mutating mirror of {@link collectActionGroupRefs}: rewrites references across
 * a set of action groups in place. Effects and conditions are rewritten via the
 * composed node rewriter; `eventIds` are rewritten directly when renaming an
 * `event` id. Returns the number of references changed.
 */
export function rewriteActionGroupRefs(
  groups: ActionGroupLike[] | undefined,
  rewriteNode: (node: RefNode) => boolean,
  namespace: string,
  oldId: string,
  newId: string,
): number {
  let count = 0;
  for (const group of groups ?? []) {
    for (const action of group.actions) {
      for (const fx of action.effects ?? []) if (rewriteNode(fx)) count++;
      for (const cond of flattenConditions(action.condition))
        if (rewriteNode(cond)) count++;
      if (namespace === EVENT_NAMESPACE && action.eventIds) {
        for (let i = 0; i < action.eventIds.length; i++) {
          if (action.eventIds[i] === oldId) {
            action.eventIds[i] = newId;
            count++;
          }
        }
      }
    }
  }
  return count;
}
