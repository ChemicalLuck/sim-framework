import type {
  BaseEffect,
  Effect,
} from '@chemicalluck/sim-engine/types/effect.types';

export type Need = string;

/** Effects applied when a need crosses `at`. */
export interface NeedThreshold<E = Effect> {
  at: number;
  /**
   * Which crossing fires: `falling` (moving down to or past `at`) or `rising`.
   * Defaults to toward the need's bad end: falling for normal needs, rising
   * for inverse needs.
   */
  when?: 'rising' | 'falling';
  effects: E[];
}

export interface NeedOptions<E = Effect> {
  /** `normal` needs are bad at 0 (default); `inverse` needs are bad at 100. */
  direction?: 'normal' | 'inverse';
  /** Hide the need in the needs display while it is 0. */
  hideAtZero?: boolean;
  thresholds?: NeedThreshold<E>[];
}

export interface NeedsEffect extends BaseEffect<'needs'> {
  readonly need: Need;
  readonly delta: number;
  /** Defaults to 'player'. Use 'npc' to affect transient NPC needs in an active encounter. */
  readonly target?: 'player' | 'npc';
}

declare module '@chemicalluck/sim-engine/types/effect.types' {
  interface EffectMap {
    needs: NeedsEffect;
  }
}
