import type { JsonEffect } from '@chemicalluck/sim-engine/features/core/types';
import {
  type ReferenceProvider,
  type ReferenceRewriter,
  collectEffectRefs,
  rewriteEffectRefs,
} from '@chemicalluck/sim-engine/lib/validation';

import type { NeedsConfig } from './slice';

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
