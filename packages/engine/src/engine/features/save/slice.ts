import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { makeConfig } from '@chemicalluck/sim-engine/lib/core';

export interface SaveState {
  /**
   * Ironman run: no undo and no manual save/load; the continuous autosave is
   * the only save. Chosen at New Game and stored with the run.
   */
  ironman: boolean;
}

/** How a game offers ironman mode at New Game. */
export type IronmanMode = 'never' | 'optional' | 'always';

export interface AutosaveOptions {
  /**
   * Rotating snapshots made by `autosave` effects to keep; older ones are
   * dropped. Checkpoints (`keep: true`) don't count. 0 disables rotating ones.
   */
  rotate: number;
}

export interface RunOptions {
  ironman: IronmanMode;
  /** Undo steps kept for the Back button. 0 disables undo. */
  undoLimit: number;
  autosave: AutosaveOptions;
}

const DEFAULT_RUN_OPTIONS: RunOptions = {
  ironman: 'never',
  undoLimit: 10,
  autosave: { rotate: 3 },
};

const _options = makeConfig<RunOptions>(DEFAULT_RUN_OPTIONS);

export function configureRunOptions(options: Partial<RunOptions>) {
  _options.configure({ ...DEFAULT_RUN_OPTIONS, ...options });
}

export function getRunOptions(): RunOptions {
  return _options.get();
}

const initialState: SaveState = { ironman: false };

const saveSlice = createSlice({
  name: 'save',
  initialState,
  reducers: {
    /** Dispatched at New Game only; there is no way to toggle mid-run. */
    startRun: (state, action: PayloadAction<{ ironman: boolean }>) => {
      state.ironman = action.payload.ironman;
    },
  },
});

export const { startRun } = saveSlice.actions;

export default saveSlice.reducer;

declare module '@chemicalluck/sim-engine/state/store' {
  interface PresentState {
    save: SaveState;
  }
}
