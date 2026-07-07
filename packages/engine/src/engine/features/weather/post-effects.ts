import {
  type EffectContext,
  dispatchWithGroup,
} from '@chemicalluck/sim-engine/features/core/types';
import { increaseNeedByAmount } from '@chemicalluck/sim-engine/features/needs/slice';
import type { PostEffectHandler } from '@chemicalluck/sim-engine/state/thunks';

import { computeDayWeather } from './lib/weather';
import type { WeatherConditionId } from './types';

const WEATHER_NEED_MODIFIERS: Partial<
  Record<WeatherConditionId, Partial<Record<string, number>>>
> = {
  snowy: { Energy: 2, Hunger: 3 },
  freezing: { Energy: 3, Hunger: 4 },
  rainy: { Energy: 1 },
  light_rain: { Energy: 0.5 },
  hot_sunny: { Hygiene: 2 },
};

const weatherPostEffect: PostEffectHandler = ({
  dispatch,
  group,
  effects,
  newState,
}: EffectContext) => {
  if (!newState) return;

  const timeEffects = effects.filter((e) => e.kind === 'time');
  if (timeEffects.length === 0) return;

  const totalMinutes = timeEffects.reduce(
    (sum, e) => sum + (e.hours ?? 0) * 60 + e.minutes,
    0,
  );

  if (totalMinutes <= 0) return;

  const override = newState.present.weather.conditionOverride;
  const effectiveId: WeatherConditionId =
    override ??
    computeDayWeather(
      new Date(newState.present.time.timestamp),
      newState.present.rng.seed,
    ).conditionId;

  const modifiers = WEATHER_NEED_MODIFIERS[effectiveId];
  if (!modifiers) return;

  for (const [need, ratePerHour] of Object.entries(modifiers)) {
    if (!ratePerHour) continue;
    const amount = -(ratePerHour * (totalMinutes / 60));
    dispatchWithGroup(dispatch, increaseNeedByAmount({ need, amount }), group);
  }
};

export default [weatherPostEffect];
