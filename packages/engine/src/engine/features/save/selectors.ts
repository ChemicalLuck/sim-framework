import type { RootState } from '@chemicalluck/sim-engine/state/store';

import { type SaveState, getRunOptions } from './slice';

// Saves made before this slice existed have no `save` key.
export const selectIronman = (state: RootState): boolean =>
  (state.present.save as SaveState | undefined)?.ironman ?? false;

/** Whether the player may undo (and save/load manually) in this run. */
export const selectUndoEnabled = (state: RootState): boolean =>
  getRunOptions().undoLimit > 0 && !selectIronman(state);
