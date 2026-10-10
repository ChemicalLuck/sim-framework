import {
  type EffectContext,
  dispatchWithGroup,
} from '@chemicalluck/sim-engine/features/core/types';
import { increaseNeedByAmount } from '@chemicalluck/sim-engine/features/needs/slice';
import type { PostEffectHandler } from '@chemicalluck/sim-engine/state/thunks';
import type { Effect } from '@chemicalluck/sim-engine/types';

import { msToNextHour } from './lib/weather';
import { getWeatherAt } from './selectors';
import { clearExpiredWeatherOverride } from './slice';
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

/** Share of the weather drain applied while asleep (sheltered indoors). */
export const WEATHER_SLEEP_FACTOR = 0.5;

interface Span {
  minutes: number;
  asleep: boolean;
}

/**
 * Split the elapsed minutes into awake/asleep spans in effect order. `time`
 * effects are awake; the rest of the clock change is attributed to `sleep`
 * effects when there are any, otherwise it's awake time from other effects.
 */
function elapsedSpans(effects: Effect[], elapsed: number): Span[] {
  const spans: Span[] = [];
  let left = elapsed;
  let sleepSpan: Span | null = null;
  for (const e of effects) {
    if (e.kind === 'time') {
      const hours = e.hours ?? 0;
      if (hours < 0 || e.minutes < 0) continue;
      const minutes = Math.min(left, hours * 60 + e.minutes);
      if (minutes <= 0) continue;
      spans.push({ minutes, asleep: false });
      left -= minutes;
    } else if (e.kind === 'sleep' && !sleepSpan) {
      sleepSpan = { minutes: 0, asleep: true };
      spans.push(sleepSpan);
    }
  }
  if (sleepSpan) sleepSpan.minutes = left;
  else spans.push({ minutes: left, asleep: false });
  return spans.filter((s) => s.minutes > 0);
}

/**
 * Drains needs for the weather of every hour the batch advanced the clock
 * through (by any effect), at a reduced rate while asleep.
 */
const weatherPostEffect: PostEffectHandler = ({
  dispatch,
  group,
  effects,
  prevState,
  newState,
}: EffectContext) => {
  if (!newState) return;

  const start = prevState.present.time.timestamp;
  const elapsed = (newState.present.time.timestamp - start) / 60_000;
  if (elapsed <= 0) return;

  const totals: Record<string, number> = {};
  let t = start;
  for (const span of elapsedSpans(effects, elapsed)) {
    const factor = span.asleep ? WEATHER_SLEEP_FACTOR : 1;
    const end = t + span.minutes * 60_000;
    // Walk the span hour by hour, using each hour's weather.
    while (t < end) {
      const next = Math.min(end, t + msToNextHour(new Date(t)));
      const modifiers =
        WEATHER_NEED_MODIFIERS[getWeatherAt(newState, t).conditionId];
      for (const [need, ratePerHour] of Object.entries(modifiers ?? {})) {
        if (!ratePerHour) continue;
        totals[need] =
          (totals[need] ?? 0) - ratePerHour * ((next - t) / 3_600_000) * factor;
      }
      t = next;
    }
  }

  for (const [need, amount] of Object.entries(totals)) {
    if (amount === 0) continue;
    dispatchWithGroup(dispatch, increaseNeedByAmount({ need, amount }), group);
  }
};

/** Clears a timed weather override once the clock has passed its expiry. */
const weatherExpiryPostEffect: PostEffectHandler = ({
  dispatch,
  group,
  newState,
}: EffectContext) => {
  if (!newState) return;
  const { overrideUntil } = newState.present.weather;
  const now = newState.present.time.timestamp;
  if (overrideUntil === undefined || now < overrideUntil) return;
  dispatchWithGroup(dispatch, clearExpiredWeatherOverride(now), group);
};

export default [weatherPostEffect, weatherExpiryPostEffect];
