import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import type { WeatherConditionId, WeatherOverride } from './types';

interface WeatherState {
  conditionOverride: WeatherConditionId | null;
  /** Game timestamp (ms) the override expires at; absent = until cleared. */
  overrideUntil?: number;
  /** Temperature (°C) reported while the override is active. */
  temperatureOverride?: number;
}

const initialState: WeatherState = { conditionOverride: null };

const weatherSlice = createSlice({
  name: 'weather',
  initialState,
  reducers: {
    /** Set an override (a bare condition id is permanent), or `null` to clear it. */
    setWeatherOverride: (
      _state,
      action: PayloadAction<WeatherConditionId | WeatherOverride | null>,
    ): WeatherState => {
      const o = action.payload;
      if (o === null) return { conditionOverride: null };
      if (typeof o === 'string') return { conditionOverride: o };
      const next: WeatherState = { conditionOverride: o.conditionId };
      if (o.until !== undefined) next.overrideUntil = o.until;
      if (o.temperature !== undefined) next.temperatureOverride = o.temperature;
      return next;
    },
    /** Clear a timed override once game time (`payload`, ms) reaches its expiry. */
    clearExpiredWeatherOverride: (
      state,
      action: PayloadAction<number>,
    ): WeatherState => {
      if (state.overrideUntil === undefined) return state;
      if (action.payload < state.overrideUntil) return state;
      return { conditionOverride: null };
    },
  },
});

export const { setWeatherOverride, clearExpiredWeatherOverride } =
  weatherSlice.actions;
export default weatherSlice.reducer;

declare module '@chemicalluck/sim-engine/state/store' {
  interface PresentState {
    weather: ReturnType<typeof weatherSlice.reducer>;
  }
}
