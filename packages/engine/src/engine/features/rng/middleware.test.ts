import { type Reducer, createSlice } from '@reduxjs/toolkit';
import { ActionCreators } from 'redux-undo';
import { beforeEach, describe, expect, it } from 'vitest';

import { buildStore } from '@chemicalluck/sim-engine/state/store';

import { initWorldRng, worldRng } from './lib/rng';
import rngReducer, { setGameSeed } from './slice';

const counter = createSlice({
  name: 'counter',
  initialState: 0,
  reducers: { inc: (n) => n + 1 },
});

const reducers = {
  counter: counter.reducer,
  rng: rngReducer,
} as Record<string, Reducer<unknown>>;

const draw = (n: number) => Array.from({ length: n }, () => worldRng.next());

async function bootedStore() {
  const built = buildStore(reducers);
  await new Promise<void>((resolve) => {
    const check = () => {
      if (built.persistor.getState().bootstrapped) resolve();
      else setTimeout(check, 0);
    };
    check();
  });
  return built;
}

describe('world RNG persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('continues the same sequence after save and load', async () => {
    // Uninterrupted session.
    const a = await bootedStore();
    a.store.dispatch(setGameSeed(42));
    draw(5);
    a.store.dispatch(counter.actions.inc());
    const expected = draw(10);
    localStorage.clear();

    // Interrupted session: same seed and draws, then save → reload.
    const b = await bootedStore();
    b.store.dispatch(setGameSeed(42));
    draw(5);
    b.store.dispatch(counter.actions.inc());
    await b.persistor.flush();
    b.persistor.pause();

    initWorldRng(999); // a fresh page starts from an unrelated position
    await bootedStore();
    expect(draw(10)).toEqual(expected);
  });

  it('falls back to the seed for saves made before the position was stored', async () => {
    localStorage.setItem(
      'persist:root',
      JSON.stringify({
        present: JSON.stringify({ rng: { seed: 7 } }),
        _persist: JSON.stringify({ version: 3, rehydrated: true }),
      }),
    );
    initWorldRng(999);
    await bootedStore();
    const loaded = draw(3);
    initWorldRng(7);
    expect(loaded).toEqual(draw(3));
  });

  it('rewinds the sequence on undo', async () => {
    const { store } = await bootedStore();
    store.dispatch(setGameSeed(42));
    store.dispatch(counter.actions.inc());
    const drawn = draw(3);
    store.dispatch(counter.actions.inc());
    store.dispatch(ActionCreators.undo());
    expect(draw(3)).toEqual(drawn);
  });

  it('does not record position syncs as undo steps', async () => {
    const { store } = await bootedStore();
    store.dispatch(setGameSeed(42));
    const pastBefore = store.getState().past.length;
    draw(2);
    store.dispatch(counter.actions.inc());
    expect(store.getState().past.length).toBe(pastBefore + 1);
  });
});
