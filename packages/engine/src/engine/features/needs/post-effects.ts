import {
  type EffectContext,
  dispatchWithGroup,
} from '@chemicalluck/sim-engine/features/core/types';
import { nextGameHour } from '@chemicalluck/sim-engine/features/time/lib/game-time';
import type { SleepEffect } from '@chemicalluck/sim-engine/features/time/types';
import type { EngineThunk } from '@chemicalluck/sim-engine/state/store';
import {
  type PostEffectHandler,
  processEffects,
} from '@chemicalluck/sim-engine/state/thunks';

import { crossedThresholds, getNeedThresholds } from './lib/thresholds';
import { decayNeedsByMinutes, getNeedOptions } from './slice';

function sleepMinutes(effect: SleepEffect, prevTimestamp: number): number {
  if (effect.wakeTime !== undefined) {
    const wake = nextGameHour(prevTimestamp, effect.wakeTime);
    return Math.ceil((wake - prevTimestamp) / 1000 / 60);
  }
  if (effect.hours !== undefined && effect.hours > 0) return effect.hours * 60;
  return 0;
}

/** Apply the effects of any need thresholds crossed since `prevNeeds`. */
const applyThresholds =
  (prevNeeds: Record<string, number>, group: string): EngineThunk =>
  (dispatch, getState) => {
    const crossed = crossedThresholds(
      prevNeeds,
      getState().present.needs,
      getNeedThresholds(),
      getNeedOptions(),
    );
    for (const t of crossed) dispatch(processEffects(t.effects, group));
  };

/**
 * Decays needs for the clock time the batch advanced (by any effect, not only
 * `time`), treating `sleep` effects' minutes as asleep and the rest as awake,
 * then fires any thresholds the needs crossed.
 */
const needsDecayPostEffect: PostEffectHandler = ({
  dispatch,
  group,
  effects,
  prevState,
  newState,
}: EffectContext) => {
  const prevTimestamp = prevState.present.time.timestamp;
  const elapsed = newState
    ? Math.round((newState.present.time.timestamp - prevTimestamp) / 60_000)
    : 0;

  let sleptMinutes = 0;
  for (const effect of effects.filter((e) => e.kind === 'sleep')) {
    const minutes = sleepMinutes(effect, prevTimestamp);
    if (minutes > 0) {
      sleptMinutes += minutes;
      dispatchWithGroup(
        dispatch,
        decayNeedsByMinutes({ minutes, sleep: true }),
        group,
      );
    }
  }

  const awakeMinutes = elapsed - sleptMinutes;
  if (awakeMinutes > 0) {
    dispatchWithGroup(
      dispatch,
      decayNeedsByMinutes({ minutes: awakeMinutes, sleep: false }),
      group,
    );
  }

  dispatch(applyThresholds(prevState.present.needs, group));
};

export default [needsDecayPostEffect];
