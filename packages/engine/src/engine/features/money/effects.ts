import {
  type EffectContext,
  dispatchWithGroup,
} from '@chemicalluck/sim-engine/features/core/types';
import { GlobalLogger } from '@chemicalluck/sim-engine/lib/logger';

import { increaseMoneyByAmount } from './slice';
import type { MoneyEffect } from './types';

const logger = GlobalLogger.child('money');

export function handleMoneyEffect(
  effect: MoneyEffect,
  { dispatch, group }: EffectContext,
) {
  logger.debug('Adjusting money:', effect.amount);
  dispatchWithGroup(dispatch, increaseMoneyByAmount(effect.amount), group);
}

export default { money: handleMoneyEffect };
