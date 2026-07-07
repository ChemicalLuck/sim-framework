import { defineEffectHydrator } from '@sim/engine/data/effect-hydrators';
import type { JsonEffect } from '@sim/engine/features/core/types';

import type { JsonViewShopEffect } from './authoring.types';

const hydrators = [
  defineEffectHydrator(
    (e: JsonEffect): e is JsonViewShopEffect =>
      e.kind === 'view' && 'shopId' in e,
    (e, ctx) => {
      if (!ctx.shops) throw new Error('Shop context not initialized');
      return {
        kind: 'view',
        activeViewId: 'ShopView',
        props: { shop: ctx.shops.get(e.shopId) },
      };
    },
  ),
];

export default hydrators;
