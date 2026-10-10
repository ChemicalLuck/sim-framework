import {
  type EffectContext,
  dispatchWithGroup,
} from '@chemicalluck/sim-engine/features/core/types';
import type { EngineThunk } from '@chemicalluck/sim-engine/state/store';

import { setWeatherOverride } from './slice';
import type { WeatherEffect, WeatherOverride } from './types';

const HOUR_MS = 3_600_000;

export function handleWeatherEffect(
  effect: WeatherEffect,
  { dispatch, group }: EffectContext,
) {
  const { conditionId, until, durationHours, temperature } = effect;
  if (conditionId === null) {
    dispatchWithGroup(dispatch, setWeatherOverride(null), group);
    return;
  }
  // Resolve the expiry against the clock as it stands mid-batch, after any
  // earlier effects advanced it.
  const apply: EngineThunk = (d, getState) => {
    const override: WeatherOverride = { conditionId };
    if (durationHours !== undefined) {
      override.until =
        getState().present.time.timestamp + durationHours * HOUR_MS;
    } else if (until !== undefined) {
      const ts = new Date(until).getTime();
      if (Number.isFinite(ts)) override.until = ts;
    }
    if (temperature !== undefined) override.temperature = temperature;
    dispatchWithGroup(d, setWeatherOverride(override), group);
  };
  dispatch(apply);
}

export default { weather: handleWeatherEffect };
