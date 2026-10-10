import type { Reducer } from '@reduxjs/toolkit';
import { afterAll, describe, expect, it } from 'vitest';

import needsReducer from '@chemicalluck/sim-engine/features/needs/slice';
import rngReducer from '@chemicalluck/sim-engine/features/rng/slice';
import timeEffects from '@chemicalluck/sim-engine/features/time/effects';
import timeReducer from '@chemicalluck/sim-engine/features/time/slice';
import {
  type EngineDispatch,
  type EngineStore,
  buildStore,
} from '@chemicalluck/sim-engine/state/store';
import {
  type EffectHandler,
  initProcessEffects,
  processEffects,
} from '@chemicalluck/sim-engine/state/thunks';

import weatherEffects from './effects';
import weatherPostEffects from './post-effects';
import { selectTemperature, selectWeather } from './selectors';
import weatherReducer from './slice';

describe('weather override expiry (store)', () => {
  initProcessEffects(
    { ...timeEffects, ...weatherEffects } as Record<string, EffectHandler>,
    weatherPostEffects,
  );
  afterAll(() => {
    initProcessEffects();
  });

  const { store: built } = buildStore(
    {
      time: timeReducer,
      rng: rngReducer,
      needs: needsReducer,
      weather: weatherReducer,
    } as Record<string, Reducer<unknown>>,
    [],
    { undoLimit: 0 },
  );
  const store = built as unknown as EngineStore & { dispatch: EngineDispatch };

  it('expires a durationHours override at the right game time', () => {
    store.dispatch(
      processEffects([
        { kind: 'time', minutes: 30 },
        {
          kind: 'weather',
          conditionId: 'snowy',
          durationHours: 2,
          temperature: -6,
        },
      ]),
    );
    expect(selectWeather(store.getState()).conditionId).toBe('snowy');
    expect(selectTemperature(store.getState())).toBe(-6);

    store.dispatch(processEffects([{ kind: 'time', hours: 1, minutes: 59 }]));
    expect(store.getState().present.weather.conditionOverride).toBe('snowy');

    store.dispatch(processEffects([{ kind: 'time', minutes: 1 }]));
    expect(store.getState().present.weather).toEqual({
      conditionOverride: null,
    });
  });

  it('a plain override stays until cleared with null', () => {
    store.dispatch(processEffects([{ kind: 'weather', conditionId: 'rainy' }]));
    store.dispatch(processEffects([{ kind: 'time', hours: 48, minutes: 0 }]));
    expect(store.getState().present.weather.conditionOverride).toBe('rainy');
    store.dispatch(processEffects([{ kind: 'weather', conditionId: null }]));
    expect(store.getState().present.weather.conditionOverride).toBeNull();
  });
});
