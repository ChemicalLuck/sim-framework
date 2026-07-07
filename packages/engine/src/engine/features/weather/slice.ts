import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import type { WeatherConditionId } from './types';

interface WeatherState {
  conditionOverride: WeatherConditionId | null;
}

const weatherSlice = createSlice({
  name: 'weather',
  initialState: { conditionOverride: null } as WeatherState,
  reducers: {
    setWeatherOverride: (
      state,
      action: PayloadAction<WeatherConditionId | null>,
    ) => {
      state.conditionOverride = action.payload;
    },
  },
});

export const { setWeatherOverride } = weatherSlice.actions;
export default weatherSlice.reducer;

declare module '@chemicalluck/engine/state/store' {
  interface PresentState {
    weather: ReturnType<typeof weatherSlice.reducer>;
  }
}
