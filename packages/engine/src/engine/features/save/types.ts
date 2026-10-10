import type { BaseEffect } from '@chemicalluck/sim-engine/types/effect.types';

/**
 * Snapshot the current state into a rotating autosave slot, listed apart from
 * manual saves. Does nothing in an ironman run, whose continuous autosave is
 * its only save.
 */
export interface AutosaveEffect extends BaseEffect<'autosave'> {
  /** Shown in the save/load dialog, e.g. "Woke up" or "Chapter 2". */
  readonly label?: string;
  /** Permanent checkpoint: never rotated out. */
  readonly keep?: boolean;
}

declare module '@chemicalluck/sim-engine/types/effect.types' {
  interface EffectMap {
    autosave: AutosaveEffect;
  }
}
