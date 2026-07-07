export interface BaseEffect<K extends string> {
  readonly kind: K;
}

/**
 * Map of every effect kind to its concrete type. Features/extensions augment via:
 *
 *   declare module '@chemicalluck/engine/types/effect.types' {
 *     interface EffectMap { myKind: MyEffect; }
 *   }
 *
 * The runtime side registers handlers via `GameConfig.effectHandlers`.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface EffectMap {}

export type Effect = EffectMap[keyof EffectMap];
