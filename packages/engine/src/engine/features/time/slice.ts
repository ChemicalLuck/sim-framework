import { type PayloadAction, createSlice } from '@reduxjs/toolkit';
import { makeConfig } from '@chemicalluck/engine/lib/core';

const _gameStart = makeConfig(0);

export const configureGameStart = _gameStart.configure;

export function setGameStartFromISO(iso: string): void {
  _gameStart.configure(new Date(iso).getTime());
}

interface TimeState {
  timestamp: number;
}

const timeSlice = createSlice({
  name: 'time',
  initialState: (): TimeState => ({ timestamp: _gameStart.get() }),
  reducers: {
    advanceTimeByMinutes: (state, action: PayloadAction<number>) => {
      const minutes = action.payload;
      state.timestamp += minutes * 60 * 1000;
    },
  },
});

export const { advanceTimeByMinutes } = timeSlice.actions;

export default timeSlice.reducer;

declare module '@chemicalluck/engine/state/store' {
  interface PresentState {
    time: ReturnType<typeof timeSlice.reducer>;
  }
}
