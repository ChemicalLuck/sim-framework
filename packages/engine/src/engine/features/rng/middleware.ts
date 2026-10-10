import type { Middleware, UnknownAction } from '@reduxjs/toolkit';
import { REHYDRATE } from 'redux-persist';
import { ActionTypes as UndoActionTypes } from 'redux-undo';

import {
  getWorldRngState,
  initWorldRng,
} from '@chemicalluck/sim-engine/features/rng/lib/rng';
import {
  type RngState,
  initGameSeed,
  rngPosition,
  setGameSeed,
  syncRngState,
} from '@chemicalluck/sim-engine/features/rng/slice';

// Actions after which the slice, not the live generator, is authoritative.
const RESTORE_TYPES = new Set<string>([
  REHYDRATE,
  initGameSeed.type,
  setGameSeed.type,
  UndoActionTypes.UNDO,
  UndoActionTypes.REDO,
  UndoActionTypes.JUMP,
  UndoActionTypes.JUMP_TO_PAST,
  UndoActionTypes.JUMP_TO_FUTURE,
]);

function positionOf(state: unknown): number | undefined {
  const rng = (state as { present?: { rng?: RngState } } | undefined)?.present
    ?.rng;
  return rng ? rngPosition(rng) : undefined;
}

/** True for the position-sync action, which must not become an undo step. */
export function isRngSyncAction(action: UnknownAction): boolean {
  return syncRngState.match(action);
}

/**
 * Keeps `worldRng` and the rng slice in step so reducers stay pure:
 * - when an action sets the slice's position (seed, load, undo/redo), the
 *   live generator is moved to it;
 * - otherwise, if code advanced the generator, its new position is written
 *   back with `syncRngState`.
 */
export const rngSyncMiddleware: Middleware = (api) => (next) => (action) => {
  const before = positionOf(api.getState());
  const result = next(action);
  const after = positionOf(api.getState());
  if (after === undefined) return result;

  if (after !== before || RESTORE_TYPES.has((action as UnknownAction).type)) {
    if (getWorldRngState() !== after) initWorldRng(after);
  } else if (getWorldRngState() !== after) {
    api.dispatch(syncRngState(getWorldRngState()));
  }
  return result;
};
