import { toast } from 'sonner';
import { depositItem } from '@chemicalluck/engine/features/containers/slice';
import {
  type EffectContext,
  dispatchWithGroup,
} from '@chemicalluck/engine/features/core/types';
import { formatMoney } from '@chemicalluck/engine/features/money/lib/currency';
import { increaseMoneyByAmount } from '@chemicalluck/engine/features/money/slice';
import { GlobalLogger } from '@chemicalluck/engine/lib/logger';

import type { PurchaseEffect } from './types';

const logger = GlobalLogger.child('shop');

export function handlePurchaseEffect(
  effect: PurchaseEffect,
  { dispatch, group, prevState }: EffectContext,
) {
  const balance = prevState.present.money;
  if (balance < effect.cost) {
    logger.debug('Purchase declined, insufficient funds:', effect);
    toast.error(`Not enough money to buy ${effect.item.name}`);
    return;
  }

  logger.debug('Purchasing:', effect.item, 'for', effect.cost);
  dispatchWithGroup(
    dispatch,
    depositItem({ containerId: 'player', item: effect.item }),
    group,
  );
  dispatchWithGroup(dispatch, increaseMoneyByAmount(-effect.cost), group);
  toast.success(
    `Purchased ${effect.item.name} for ${formatMoney(effect.cost)}`,
  );
}

export default { purchase: handlePurchaseEffect };
