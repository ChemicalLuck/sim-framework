import type { RelationshipMetric } from '@chemicalluck/sim-engine/features/npcs/types';
import type { RootState } from '@chemicalluck/sim-engine/state/store';

import { DEFAULT_NPC_RELATIONSHIP } from './slice';

/**
 * A relationship metric. Without `npcId` it reads the current NPC: the one in
 * the active NpcView/ConversationView, the first NPC of the active
 * SceneView/ScriptView, or the NPC of the active encounter.
 */
export interface RelationshipExpr {
  kind: 'relationship';
  npcId?: string;
  metric: RelationshipMetric;
}

declare module '@chemicalluck/sim-engine/types/condition.types' {
  interface ExprMap {
    relationship: RelationshipExpr;
  }
}

const METRICS: readonly RelationshipMetric[] = [
  'Friendship',
  'Romance',
  'Attraction',
];

const PREFIX = 'relationship.';

function parseMetric(raw: string): RelationshipMetric | null {
  return METRICS.find((m) => m.toLowerCase() === raw.toLowerCase()) ?? null;
}

/** The NPC that `relationship.<metric>` refers to in the current context. */
export function selectCurrentNpcId(state: RootState): string | null {
  const props = state.present.view.props as {
    npcId?: unknown;
    npcIds?: unknown;
  };
  if (typeof props.npcId === 'string') return props.npcId;
  if (Array.isArray(props.npcIds) && typeof props.npcIds[0] === 'string') {
    return props.npcIds[0];
  }
  return state.present.encounter.npcId;
}

export const exprKinds = ['relationship'];

export const exprParsers = [
  (id: string): RelationshipExpr | null => {
    if (!id.startsWith(PREFIX)) return null;
    const parts = id.slice(PREFIX.length).split('.');
    const metric = parseMetric(parts[parts.length - 1]);
    if (!metric) return null;
    if (parts.length === 1) return { kind: 'relationship', metric };
    return {
      kind: 'relationship',
      npcId: parts.slice(0, -1).join('.'),
      metric,
    };
  },
];

export const exprEvaluators = {
  relationship: (e: RelationshipExpr, state: RootState): number => {
    const npcId = e.npcId ?? selectCurrentNpcId(state);
    const rel =
      (npcId != null ? state.present.relationships[npcId] : undefined) ??
      DEFAULT_NPC_RELATIONSHIP;
    return rel.relationship[e.metric];
  },
};

export const exprSerializers = {
  relationship: (e: RelationshipExpr) =>
    e.npcId ? `${PREFIX}${e.npcId}.${e.metric}` : `${PREFIX}${e.metric}`,
};

export default {};
