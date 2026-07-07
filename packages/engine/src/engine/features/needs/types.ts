import type { BaseEffect } from '@sim/engine/types/effect.types';

export type Need = string;

export interface NeedsEffect extends BaseEffect<'needs'> {
  readonly need: Need;
  readonly delta: number;
  /** Defaults to 'player'. Use 'npc' to affect transient NPC needs in an active encounter. */
  readonly target?: 'player' | 'npc';
}

declare module '@sim/engine/types/effect.types' {
  interface EffectMap {
    needs: NeedsEffect;
  }
}
