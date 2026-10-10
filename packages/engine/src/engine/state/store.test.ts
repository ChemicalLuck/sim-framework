import { type Reducer, createSlice } from '@reduxjs/toolkit';
import { ActionCreators } from 'redux-undo';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import moneyReducer, {
  increaseMoneyByAmount,
} from '@chemicalluck/sim-engine/features/money/slice';
import { configureAppearance } from '@chemicalluck/sim-engine/features/npcs/lib/appearance-config';
import { setNamedNpcs } from '@chemicalluck/sim-engine/features/npcs/lib/named-npcs';
import { initNpcNames } from '@chemicalluck/sim-engine/features/npcs/lib/npcs';
import { configureProfessions } from '@chemicalluck/sim-engine/features/npcs/lib/professions';
import npcsReducer, {
  regenerateNpcs,
} from '@chemicalluck/sim-engine/features/npcs/slice';
import playerReducer, {
  setLocation,
} from '@chemicalluck/sim-engine/features/player/slice';
import relationshipsReducer, {
  meetNpc,
} from '@chemicalluck/sim-engine/features/relationships/slice';
import rngReducer, {
  setGameSeed,
} from '@chemicalluck/sim-engine/features/rng/slice';
import {
  getSaveSlots,
  loadGame,
  saveGame,
} from '@chemicalluck/sim-engine/features/save/saves';
import saveReducer, {
  startRun,
} from '@chemicalluck/sim-engine/features/save/slice';

import { buildStore } from './store';

const counter = createSlice({
  name: 'counter',
  initialState: 0,
  reducers: { inc: (n) => n + 1 },
});

const reducers = {
  counter: counter.reducer,
  save: saveReducer,
} as Record<string, Reducer<unknown>>;

const counterOf = (s: unknown) =>
  (s as { present: { counter: number } }).present.counter;
const pastOf = (s: unknown) => (s as { past: unknown[] }).past;

describe('buildStore undo history', () => {
  it('records undo history by default', () => {
    const { store } = buildStore(reducers);
    store.dispatch(counter.actions.inc());
    expect(pastOf(store.getState())).toHaveLength(1);
    store.dispatch(ActionCreators.undo());
    expect(counterOf(store.getState())).toBe(0);
  });

  it('honours a configured undo limit', () => {
    const { store } = buildStore(reducers, [], { undoLimit: 2 });
    for (let i = 0; i < 5; i++) store.dispatch(counter.actions.inc());
    expect(pastOf(store.getState())).toHaveLength(2);
  });

  it('disables undo when the limit is 0', () => {
    const { store } = buildStore(reducers, [], { undoLimit: 0 });
    store.dispatch(counter.actions.inc());
    expect(pastOf(store.getState())).toHaveLength(0);
    store.dispatch(ActionCreators.undo());
    expect(counterOf(store.getState())).toBe(1);
  });

  it('disables undo for an ironman run, including history from before it', () => {
    const { store } = buildStore(reducers);
    store.dispatch(counter.actions.inc());
    store.dispatch(startRun({ ironman: true }));
    store.dispatch(counter.actions.inc());
    store.dispatch(ActionCreators.undo());
    store.dispatch(ActionCreators.jumpToPast(0));
    expect(counterOf(store.getState())).toBe(2);
    expect(pastOf(store.getState())).toHaveLength(0);
  });
});

describe('buildStore save and reload', () => {
  const gameReducers = {
    counter: counter.reducer,
    money: moneyReducer,
    npcs: npcsReducer,
    player: playerReducer,
    relationships: relationshipsReducer,
    rng: rngReducer,
    save: saveReducer,
  } as Record<string, Reducer<unknown>>;

  interface GameState {
    past: unknown[];
    future: unknown[];
    present: {
      counter: number;
      money: number;
      npcs: { seed: number; characters: { id: string }[] };
      player: { locationId: string };
      relationships: Record<string, unknown>;
      rng: { seed: number };
      save: { ironman: boolean };
    };
  }

  // Build a store over the shared localStorage and wait for it to rehydrate,
  // as a fresh page load would.
  async function boot() {
    const built = buildStore(gameReducers);
    await new Promise<void>((resolve) => {
      const check = () => {
        if (built.persistor.getState().bootstrapped) resolve();
        else setTimeout(check, 0);
      };
      check();
    });
    return {
      ...built,
      state: () => built.store.getState() as unknown as GameState,
    };
  }

  // Write the current state to storage and stop this "page" persisting.
  async function persist(built: Awaited<ReturnType<typeof boot>>) {
    await built.persistor.flush();
    built.persistor.pause();
  }

  beforeEach(() => {
    localStorage.clear();
    configureAppearance({
      features: [
        {
          id: 'gender',
          label: 'Gender',
          values: ['Male', 'Female'],
          isDimension: true,
          weights: { default: { Male: 1, Female: 1 } },
        },
      ],
      ageDistribution: { min: 18, max: 80, mean: 30, stdDev: 10 },
      bodyAttributes: [],
      display: { strangerFeatureIds: [], metaFeatureIds: [] },
    });
    initNpcNames({ male: ['Bob'], female: ['Alice'], surnames: ['Smith'] });
    configureProfessions({ professions: ['Student'] });
    setNamedNpcs([]);
  });

  it('restores every changed slice, including procedural NPC relationships', async () => {
    const a = await boot();
    a.store.dispatch(setGameSeed(42));
    a.store.dispatch(regenerateNpcs(42));
    const npc = a.state().present.npcs.characters[3];
    a.store.dispatch(increaseMoneyByAmount(50));
    a.store.dispatch(setLocation('park'));
    a.store.dispatch(meetNpc(npc.id));
    a.store.dispatch(counter.actions.inc());
    await persist(a);

    const b = await boot();
    const { present } = b.state();
    expect(present.money).toBe(50);
    expect(present.player.locationId).toBe('park');
    expect(present.counter).toBe(1);
    expect(present.rng.seed).toBe(42);
    expect(present.relationships[npc.id]).toBeDefined();
    // Procedural NPCs are regenerated from the saved seed, same ids.
    expect(present.npcs.characters.find((c) => c.id === npc.id)).toEqual(npc);
    // The reload starts a fresh history: Back can't undo the load itself.
    expect(b.state().past).toEqual([]);
    expect(b.state().future).toEqual([]);
    b.store.dispatch(ActionCreators.undo());
    expect(b.state().present.money).toBe(50);
  }, 30000);

  it('keeps an ironman run ironman after reload', async () => {
    const a = await boot();
    a.store.dispatch(startRun({ ironman: true }));
    a.store.dispatch(increaseMoneyByAmount(5));
    await persist(a);

    const b = await boot();
    expect(b.state().present.save.ironman).toBe(true);
    b.store.dispatch(increaseMoneyByAmount(5));
    expect(b.state().past).toEqual([]);
    expect(b.state().present.money).toBe(10);
  }, 30000);

  it('loads a manual save slot', async () => {
    const reload = vi.fn();
    vi.stubGlobal('location', { reload });
    try {
      const a = await boot();
      a.store.dispatch(setGameSeed(42));
      a.store.dispatch(increaseMoneyByAmount(20));
      a.store.dispatch(setLocation('park'));
      await persist(a);
      saveGame('Slot 1', 'Hero', '12:00 PM');

      // Play on past the save, then load it.
      a.persistor.persist();
      a.store.dispatch(increaseMoneyByAmount(100));
      a.store.dispatch(setLocation('shop'));
      await persist(a);
      loadGame(getSaveSlots()[0]);
      expect(reload).toHaveBeenCalled();

      const b = await boot();
      expect(b.state().present.money).toBe(20);
      expect(b.state().present.player.locationId).toBe('park');
      expect(b.state().present.rng.seed).toBe(42);
    } finally {
      vi.unstubAllGlobals();
    }
  }, 30000);
});
