import { type Reducer, createSlice } from '@reduxjs/toolkit';
import { ActionCreators } from 'redux-undo';
import { describe, expect, it } from 'vitest';

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
