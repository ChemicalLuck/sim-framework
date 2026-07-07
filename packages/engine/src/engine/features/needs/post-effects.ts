import {
  type EffectContext,
  dispatchWithGroup,
} from '@chemicalluck/sim-engine/features/core/types';
import type { SleepEffect } from '@chemicalluck/sim-engine/features/time/types';
import type { PostEffectHandler } from '@chemicalluck/sim-engine/state/thunks';

import { decayNeedsByMinutes } from './slice';

function sleepMinutes(effect: SleepEffect, prevTimestamp: number): number {
  if (effect.wakeTime !== undefined) {
    const now = new Date(prevTimestamp);
    const wakeDate = new Date(now);
    if (now.getHours() >= effect.wakeTime) wakeDate.setDate(now.getDate() + 1);
    wakeDate.setHours(effect.wakeTime, 0, 0, 0);
    return Math.ceil((wakeDate.getTime() - now.getTime()) / 1000 / 60);
  }
  if (effect.hours !== undefined && effect.hours > 0) return effect.hours * 60;
  return 0;
}

const needsDecayPostEffect: PostEffectHandler = ({
  dispatch,
  group,
  effects,
  prevState,
}: EffectContext) => {
  const timeMinutes = effects
    .filter((e) => e.kind === 'time')
    .reduce((sum, e) => sum + (e.hours ?? 0) * 60 + e.minutes, 0);
  if (timeMinutes > 0) {
    dispatchWithGroup(
      dispatch,
      decayNeedsByMinutes({ minutes: timeMinutes, sleep: false }),
      group,
    );
  }

  const prevTimestamp = prevState.present.time.timestamp;
  for (const effect of effects.filter((e) => e.kind === 'sleep')) {
    const minutes = sleepMinutes(effect, prevTimestamp);
    if (minutes > 0) {
      dispatchWithGroup(
        dispatch,
        decayNeedsByMinutes({ minutes, sleep: true }),
        group,
      );
    }
  }
};

export default [needsDecayPostEffect];
