import type { JsonEffect } from '@chemicalluck/sim-engine/features/core/types';
import {
  type ContentRef,
  type IdSource,
  type NodeRefExtractor,
  type ReferenceProvider,
  type ReferenceRewriter,
  collectEffectRefs,
  rewriteEffectRefs,
} from '@chemicalluck/sim-engine/lib/validation';

import type { NeedExpr } from './conditions';
import type { NeedsConfig } from './slice';

/** Namespace of the needs declared in `needs.json`. */
export const NEED_NAMESPACE = 'need';

export const idSources: IdSource[] = [
  {
    namespace: NEED_NAMESPACE,
    file: 'needs',
    select: (data) => Object.keys((data as Partial<NeedsConfig>).needs ?? {}),
  },
];

const COMPARISON_KINDS = new Set(['lt', 'lte', 'eq', 'neq', 'gt', 'gte']);

/** A `need.<Name>` operand, if `expr` is one. */
function needOperand(expr: unknown): ContentRef[] {
  const e = expr as Partial<NeedExpr> | undefined;
  return e?.kind === 'need' && typeof e.need === 'string'
    ? [{ namespace: NEED_NAMESPACE, id: e.need }]
    : [];
}

/**
 * Player-need references: `needs` effects (NPC-targeted ones change encounter
 * needs, which `needs.json` doesn't declare) and `need.<Name>` operands of
 * comparison conditions.
 */
const needRef: NodeRefExtractor = (node) => {
  if (!('kind' in node)) return [];
  if (node.kind === 'needs' && 'need' in node && 'delta' in node) {
    return node.target === 'npc'
      ? []
      : [{ namespace: NEED_NAMESPACE, id: node.need }];
  }
  if (COMPARISON_KINDS.has(node.kind) && 'lhs' in node && 'rhs' in node) {
    return [...needOperand(node.lhs), ...needOperand(node.rhs)];
  }
  return [];
};

export const nodeRefExtractors: NodeRefExtractor[] = [needRef];

function thresholdsOf(data: unknown) {
  const options = (data as NeedsConfig<JsonEffect>).options ?? {};
  return Object.entries(options).flatMap(([need, opts]) =>
    (opts?.thresholds ?? []).map((t) => ({ need, effects: t.effects })),
  );
}

export const referenceProviders: ReferenceProvider[] = [
  {
    file: 'needs',
    section: 'needs',
    collect: (data, extract) =>
      thresholdsOf(data).flatMap(({ need, effects }) =>
        collectEffectRefs(effects, `need:${need}`, 'needs', extract),
      ),
  },
];

export const referenceRewriters: ReferenceRewriter[] = [
  {
    file: 'needs',
    rewrite: (data, rewriteNode) =>
      thresholdsOf(data).reduce(
        (count, { effects }) => count + rewriteEffectRefs(effects, rewriteNode),
        0,
      ),
  },
];
