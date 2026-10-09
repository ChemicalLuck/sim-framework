import {
  type HydrationContext,
  hydrateEffect,
} from '@chemicalluck/sim-engine/features/core/hydrate';
import type { JsonEffect } from '@chemicalluck/sim-engine/features/core/types';

import type { NeedThresholds } from './lib/thresholds';
import type { NeedsConfig } from './slice';

/** Hydrate the threshold effects declared in `needs.json` options. */
export function hydrateNeedThresholds(
  data: NeedsConfig<JsonEffect>,
  ctx: HydrationContext,
): NeedThresholds {
  const out: NeedThresholds = {};
  for (const [need, opts] of Object.entries(data.options ?? {})) {
    if (!opts?.thresholds) continue;
    out[need] = opts.thresholds.map((t) => ({
      ...t,
      effects: t.effects.map((e) => hydrateEffect(e, ctx)),
    }));
  }
  return out;
}

declare module '@chemicalluck/sim-engine/data' {
  interface ContentExtensions {
    needThresholds: NeedThresholds;
  }
}
