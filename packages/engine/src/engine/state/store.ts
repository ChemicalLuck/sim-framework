import {
  type Reducer,
  type ThunkDispatch,
  type UnknownAction,
  combineReducers,
} from '@reduxjs/toolkit';
import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, useStore } from 'react-redux';
import type { Store } from 'redux';
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  type Transform,
  createTransform,
  persistReducer,
  persistStore,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import type { StateWithHistory } from 'redux-undo';
import undoable, {
  ActionTypes as UndoActionTypes,
  newHistory,
} from 'redux-undo';

import {
  isRngSyncAction,
  rngSyncMiddleware,
} from '@chemicalluck/sim-engine/features/rng/middleware';

import type {} from './augmentations';

// Features augment this interface to register their slice state type.
// Augmentation pattern: declare module '@chemicalluck/sim-engine/state/store' { interface PresentState { myKey: MyState; } }
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface PresentState {}

export type RootState = StateWithHistory<PresentState> & {
  _persist: { version: number; rehydrated: boolean };
};

// Strip large/transient data before writing to localStorage.
// NPC characters are regenerated from seed on load; undo history is dropped.
// Games can add their own transient fields by providing additionalStrip.
export type TransientStripper = (
  sliceState: Record<string, unknown>,
) => Record<string, unknown>;

function stripTransientData(
  sliceState: unknown,
  additionalStrip?: TransientStripper,
): unknown {
  if (!sliceState || typeof sliceState !== 'object') return sliceState;
  let result = sliceState as Record<string, unknown>;
  if (result.npcs) {
    const npcs = result.npcs as Record<string, unknown>;
    result = {
      ...result,
      npcs: { seed: npcs.seed ?? 0, characters: [], named: [], nearby: [] },
    };
  }
  if ('encounter' in result) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { encounter: _, ...rest } = result;
    result = rest;
  }
  if (additionalStrip) {
    result = additionalStrip(result);
  }
  return result;
}

export function createCompactTransform(additionalStrip?: TransientStripper) {
  return createTransform(
    (state, key) => {
      if (key === 'past' || key === 'future') return [];
      if (key === 'present' || key === '_latestUnfiltered') {
        return stripTransientData(state, additionalStrip);
      }
      return state;
    },
    (state) => state,
  );
}

interface GroupedAction extends UnknownAction {
  meta?: {
    group?: string;
  };
}

export interface StoreOptions {
  /** Undo steps kept for the Back button (default 10). 0 disables undo. */
  undoLimit?: number;
}

const HISTORY_ACTION_TYPES = new Set<string>([
  UndoActionTypes.UNDO,
  UndoActionTypes.REDO,
  UndoActionTypes.JUMP,
  UndoActionTypes.JUMP_TO_PAST,
  UndoActionTypes.JUMP_TO_FUTURE,
]);

function isIronman(present: unknown): boolean {
  return (
    (present as { save?: { ironman?: boolean } } | undefined)?.save?.ironman ===
    true
  );
}

export function buildStore(
  reducers: Record<string, Reducer<unknown>> = {},
  additionalTransforms: Transform<unknown, unknown>[] = [],
  { undoLimit = 10 }: StoreOptions = {},
) {
  const compactTransform = createCompactTransform();
  const persistConfig = {
    key: 'root',
    version: 3,
    storage,
    transforms: [compactTransform, ...additionalTransforms],
  };

  const rootReducer = combineReducers(reducers);

  const historyReducer = undoable(rootReducer, {
    groupBy: (action: GroupedAction) => action.meta?.group ?? null,
    // redux-undo's limit counts the present state too.
    limit: undoLimit + 1,
    // Record nothing when undo is disabled or the run is ironman. RNG
    // position syncs fold into the step that consumed the randomness.
    filter: (action, present) =>
      undoLimit > 0 && !isIronman(present) && !isRngSyncAction(action),
    syncFilter: true,
  });

  // An ironman run can't step back, even into history recorded before it.
  const guardedReducer: typeof historyReducer = (state, action) => {
    if (
      state &&
      HISTORY_ACTION_TYPES.has(action.type) &&
      isIronman(state.present)
    ) {
      return state;
    }
    const next = historyReducer(state, action);
    if (isIronman(next.present) && (next.past.length || next.future.length)) {
      return newHistory([], next.present, []);
    }
    return next;
  };

  const persistedReducer = persistReducer(persistConfig, guardedReducer);

  const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        },
      }).concat(rngSyncMiddleware),
    devTools: {
      stateSanitizer: <S>(state: S): S => {
        const s = state as Record<string, unknown>;
        const present = s.present as Record<string, unknown> | undefined;
        const npcs = present?.npcs as Record<string, unknown> | undefined;
        if (
          !npcs?.characters ||
          !Array.isArray(npcs.characters) ||
          !npcs.characters.length
        )
          return state;
        return {
          ...s,
          present: {
            ...present,
            npcs: {
              ...npcs,
              characters: `<<${String(npcs.characters.length)} NPCs>>`,
            },
          },
        } as S;
      },
    },
  });

  const persistor = persistStore(store);
  return { store, persistor };
}

export type EngineStore = Store<RootState>;
export type EngineDispatch = ThunkDispatch<RootState, undefined, UnknownAction>;
export type EngineThunk<ReturnType = void> = (
  dispatch: EngineDispatch,
  getState: () => RootState,
) => ReturnType;

export const useEngineDispatch = useDispatch.withTypes<EngineDispatch>();
export const useEngineSelector = useSelector.withTypes<RootState>();
export const useEngineStore = useStore.withTypes<EngineStore>();
