import {
  type Reducer,
  type UnknownAction,
  combineReducers,
  configureStore,
} from '@reduxjs/toolkit';
import undoable from 'redux-undo';
import {
  effectHandlers,
  postEffectHandlers,
  slices,
} from 'virtual:game-extensions';
import type { NamedNpcDefinition } from '@chemicalluck/engine/features/npcs/types';
import { setGameSeed } from '@chemicalluck/engine/features/rng/slice';
import type { EngineStore } from '@chemicalluck/engine/state/store';
import { initProcessEffects } from '@chemicalluck/engine/state/thunks';

import type { PreviewState } from '../mock-state';

interface GroupedAction extends UnknownAction {
  meta?: { group?: string };
}

function makeReducer() {
  return undoable(combineReducers(slices as Record<string, Reducer<unknown>>), {
    groupBy: (action: GroupedAction) => action.meta?.group ?? null,
    limit: 10,
  });
}

function newStore(preloadedState?: unknown) {
  return configureStore({
    reducer: makeReducer(),
    preloadedState: preloadedState as never,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ serializableCheck: false }),
  });
}

function timestampFor(seed: PreviewState, fallback: number): number {
  const date = new Date(`${seed.date}T00:00:00`);
  if (Number.isNaN(date.getTime())) return fallback;
  date.setHours(seed.hour);
  return date.getTime();
}

/**
 * Build a throwaway, **non-persistent** engine store for the preview sandbox.
 * Mirrors the real reducer wiring (undoable + combined feature slices) but
 * deliberately avoids `buildStore` so it never touches the player's real save
 * (localStorage key `root`). Effect handlers are registered once; the editor
 * never mounts the game, so this sandbox is their only consumer.
 */
export function createSandboxStore(
  seed: PreviewState,
  mockNpc: NamedNpcDefinition,
): EngineStore {
  initProcessEffects(effectHandlers, postEffectHandlers);

  // First pass: full initial state for every slice (correct shapes), then
  // overlay only the fields the mock state controls.
  const base = newStore();
  base.dispatch(setGameSeed(1));
  const initial = base.getState().present as Record<string, unknown>;

  const player = initial.player as { locationId: string; skills: object };
  const present = {
    ...initial,
    money: seed.money,
    time: { ...(initial.time as object), timestamp: timestampFor(seed, 0) },
    player: {
      ...player,
      locationId: seed.location || player.locationId,
      skills: { ...player.skills, ...seed.skills },
    },
    needs: { ...(initial.needs as object), ...seed.needs },
    milestones: {
      ...(initial.milestones as object),
      achieved: seed.milestones,
    },
    weather: {
      ...(initial.weather as object),
      conditionOverride: seed.weather || null,
    },
    npcs: {
      ...(initial.npcs as object),
      named: [mockNpc],
      nearby: [mockNpc.id],
    },
  };

  const store = newStore({ past: [], present, future: [] });
  store.dispatch(setGameSeed(1));
  return store as unknown as EngineStore;
}
