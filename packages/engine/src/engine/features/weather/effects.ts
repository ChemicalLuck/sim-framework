import {
  type EffectContext,
  dispatchWithGroup,
} from '@sim/engine/features/core/types';

import { setWeatherOverride } from './slice';
import type { WeatherEffect } from './types';

export function handleWeatherEffect(
  effect: WeatherEffect,
  { dispatch, group }: EffectContext,
) {
  dispatchWithGroup(dispatch, setWeatherOverride(effect.conditionId), group);
}

export default { weather: handleWeatherEffect };
