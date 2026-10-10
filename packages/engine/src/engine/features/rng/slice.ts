import {
  type PayloadAction,
  type UnknownAction,
  createSlice,
} from '@reduxjs/toolkit';
import { REHYDRATE } from 'redux-persist';

export interface RngState {
  seed: number;
  /**
   * Mulberry32 state of `worldRng` (its position in the sequence), kept in
   * step by `rngSyncMiddleware` so it is saved and rewound by undo. Absent
   * means the sequence is still at the seed.
   */
  state?: number;
}

const initialState: RngState = {
  seed: 0,
};

/** The `worldRng` state this slice describes. */
export function rngPosition(rng: RngState): number {
  return (rng.state ?? rng.seed) >>> 0;
}

const rngSlice = createSlice({
  name: 'rng',
  initialState,
  reducers: {
    initGameSeed: {
      reducer: (state, action: PayloadAction<number>) => {
        state.seed = action.payload;
        state.state = action.payload >>> 0;
      },
      prepare: () => ({ payload: Date.now() }),
    },
    setGameSeed: (state, action: PayloadAction<number>) => {
      state.seed = action.payload;
      state.state = action.payload >>> 0;
    },
    /** Record `worldRng`'s position after it advanced (not an undo step). */
    syncRngState: (state, action: PayloadAction<number>) => {
      state.state = action.payload >>> 0;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(REHYDRATE, (state, action: UnknownAction) => {
      if ((action as { key?: string }).key !== 'root') return;
      const saved = (
        action.payload as
          | { present?: { rng?: { seed?: number; state?: number } } }
          | undefined
      )?.present?.rng;
      if (saved?.seed !== undefined) {
        state.seed = saved.seed;
        // Saves from before the position was stored restart from the seed.
        state.state = (saved.state ?? saved.seed) >>> 0;
      }
    });
  },
});

export const { initGameSeed, setGameSeed, syncRngState } = rngSlice.actions;

export default rngSlice.reducer;

declare module '@chemicalluck/sim-engine/state/store' {
  interface PresentState {
    rng: ReturnType<typeof rngSlice.reducer>;
  }
}
