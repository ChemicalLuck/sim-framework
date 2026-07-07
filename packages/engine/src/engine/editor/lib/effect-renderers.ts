import { useMemo } from 'react';
import type { Effect } from '@sim/engine/types/effect.types';

import { useEffectEditors } from './effect-editor';

/**
 * Legacy renderer shape — still used by game extensions that register
 * renderer-only entries via `virtual:editor-extensions.effectRenderers`.
 * New code should register a full `EffectEditorModule` instead.
 */
export interface EffectRenderer {
  /** Tailwind class string used to style the effect chip */
  color: string;
  /** Compact label to display inside the chip */
  label: (effect: Effect) => string;
}

/**
 * Adapter that exposes the editor registry as a flat renderer map.
 * Preserves the `useEffectRenderers()` API for any external callers.
 */
export function useEffectRenderers(): Record<string, EffectRenderer> {
  const editors = useEffectEditors();
  return useMemo(() => {
    const out: Record<string, EffectRenderer> = {};
    for (const [kind, mod] of Object.entries(editors)) {
      out[kind] = { color: mod.color, label: mod.label };
    }
    return out;
  }, [editors]);
}
