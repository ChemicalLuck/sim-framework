import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

/** Per-term wording overrides chosen by the player. Each value is the raw
 * comma-separated string they typed (duplicates weight the random pick). */
interface LinguisticsState {
  wordChoices: Record<string, string>;
}

const linguisticsSlice = createSlice({
  name: 'linguistics',
  initialState: { wordChoices: {} } as LinguisticsState,
  reducers: {
    setWordChoice: (
      state,
      action: PayloadAction<{ key: string; value: string }>,
    ) => {
      const { key, value } = action.payload;
      if (value.trim()) state.wordChoices[key] = value;
      else
        state.wordChoices = Object.fromEntries(
          Object.entries(state.wordChoices).filter(([k]) => k !== key),
        );
    },
    setAllWordChoices: (
      state,
      action: PayloadAction<Record<string, string>>,
    ) => {
      state.wordChoices = action.payload;
    },
  },
});

export const { setWordChoice, setAllWordChoices } = linguisticsSlice.actions;

export default linguisticsSlice.reducer;

declare module '@chemicalluck/sim-engine/state/store' {
  interface PresentState {
    linguistics: ReturnType<typeof linguisticsSlice.reducer>;
  }
}
