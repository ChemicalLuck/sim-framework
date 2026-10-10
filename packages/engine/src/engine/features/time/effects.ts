import {
  type EffectContext,
  dispatchWithGroup,
} from '@chemicalluck/sim-engine/features/core/types';
import { GlobalLogger } from '@chemicalluck/sim-engine/lib/logger';

import { nextGameHour } from './lib/game-time';
import { advanceTimeByMinutes } from './slice';
import type { SleepEffect, TimeEffect } from './types';

const logger = GlobalLogger.child('time');

export function handleTimeEffect(
  effect: TimeEffect,
  { dispatch, group }: EffectContext,
) {
  const { hours, minutes } = effect;
  if ((hours !== undefined && hours < 0) || minutes < 0) return;
  const total = (hours ?? 0) * 60 + minutes;

  if (total > 0) {
    logger.debug('Advancing time:', total, 'minutes');
    dispatchWithGroup(dispatch, advanceTimeByMinutes(total), group);
  } else {
    logger.warn('Zero time delta, skipping');
  }
}

export function handleSleepEffect(
  effect: SleepEffect,
  { dispatch, group, prevState }: EffectContext,
) {
  let minutes = 0;

  if (effect.wakeTime !== undefined) {
    const now = prevState.present.time.timestamp;
    const wake = nextGameHour(now, effect.wakeTime);

    minutes = Math.ceil((wake - now) / 1000 / 60);
    logger.debug(
      'Computed full sleep until',
      new Date(wake),
      '→',
      minutes,
      'minutes',
    );
  } else if (effect.hours !== undefined && effect.hours > 0) {
    minutes = effect.hours * 60;
    logger.debug(
      'Computed timed sleep:',
      effect.hours,
      'hours →',
      minutes,
      'minutes',
    );
  }

  if (minutes > 0) {
    logger.debug('Advancing time by', minutes, 'minutes');
    dispatchWithGroup(dispatch, advanceTimeByMinutes(minutes), group);
  } else {
    logger.warn('No sleep duration found, skipping time advance');
  }
}

export default { time: handleTimeEffect, sleep: handleSleepEffect };
