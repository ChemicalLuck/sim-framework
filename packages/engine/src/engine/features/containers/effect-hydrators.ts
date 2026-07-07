import { defineEffectHydrator } from '@chemicalluck/engine/data/effect-hydrators';
import type { JsonEffect } from '@chemicalluck/engine/features/core/types';

import type {
  JsonContainerInsertEffect,
  JsonInventoryAddEffect,
} from './authoring.types';

const hydrators = [
  defineEffectHydrator(
    (e: JsonEffect): e is JsonInventoryAddEffect =>
      e.kind === 'inventory' && e.operation === 'add' && 'itemId' in e,
    (e, ctx) => ({
      kind: 'inventory',
      operation: 'add',
      item: ctx.items.get(e.itemId),
    }),
  ),
  defineEffectHydrator(
    (e: JsonEffect): e is JsonContainerInsertEffect =>
      e.kind === 'container' && 'itemId' in e,
    (e, ctx) => ({
      kind: 'container',
      operation: 'insert',
      containerId: e.containerId,
      item: ctx.items.get(e.itemId),
    }),
  ),
];

export default hydrators;
