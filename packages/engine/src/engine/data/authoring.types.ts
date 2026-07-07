/**
 * Map of every feature-owned Json effect type, keyed by a registry-internal
 * discriminator. Features augment this interface via module declaration:
 *
 *   declare module '@chemicalluck/engine/data/authoring.types' {
 *     interface JsonEffectMap { container_insert: JsonContainerInsertEffect; }
 *   }
 *
 * Hydration handlers are contributed via `effect-hydrators.ts` files per
 * feature; the central dispatch in `data/hydrate.ts` consults them by walking
 * the aggregated list from `virtual:game-extensions`.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface JsonEffectMap {}
