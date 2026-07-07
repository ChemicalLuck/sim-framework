import {
  type PayloadAction,
  type UnknownAction,
  createSlice,
} from '@reduxjs/toolkit';
import { REHYDRATE } from 'redux-persist';
import { initWorldRng } from '@chemicalluck/engine/features/rng/lib/rng';

interface RngState {
  seed: number;
}

const initialState: RngState = {
  seed: 0,
};

const rngSlice = createSlice({
  name: 'rng',
  initialState,
  reducers: {
    initGameSeed: (state) => {
      const seed = Date.now();
      state.seed = seed;
      initWorldRng(seed);
    },
    setGameSeed: (state, action: PayloadAction<number>) => {
      state.seed = action.payload;
      initWorldRng(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder.addCase(REHYDRATE, (state, action: UnknownAction) => {
      if ((action as { key?: string }).key !== 'root') return;
      const savedSeed = (
        action.payload as { present?: { rng?: { seed?: number } } } | undefined
      )?.present?.rng?.seed;
      if (savedSeed !== undefined) {
        state.seed = savedSeed;
        initWorldRng(savedSeed);
      }
    });
  },
});

export const { initGameSeed, setGameSeed } = rngSlice.actions;

export default rngSlice.reducer;

declare module '@chemicalluck/engine/state/store' {
  interface PresentState {
    rng: ReturnType<typeof rngSlice.reducer>;
  }
}
