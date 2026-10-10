import { describe, expect, it } from 'vitest';

import * as needRefs from '@chemicalluck/sim-engine/features/needs/references';
import {
  type ReferenceContributions,
  validateReferences,
} from '@chemicalluck/sim-engine/lib/validation';

import type { JsonWeatherConfig } from './authoring.types';
import * as weatherRefs from './references';

const contributions: ReferenceContributions = {
  idSources: needRefs.idSources,
  referenceProviders: weatherRefs.referenceProviders,
  nodeRefExtractors: [],
  nodeRefRewriters: [],
  referenceRewriters: [],
};

const needs = {
  needs: { Energy: 100, Hygiene: 100 },
  decayRates: { Energy: 5, Hygiene: 2 },
};

function issues(weather: JsonWeatherConfig, data: object = { needs }) {
  return validateReferences({ ...data, weather }, contributions).map(
    (i) => `${i.source}: ${i.message}`,
  );
}

describe('weather references', () => {
  it('flags needEffects naming a need not declared in needs.json', () => {
    expect(
      issues({
        conditions: {
          rainy: { needEffects: { Hygiene: 3, Warmth: 1 } },
          heatwave: {
            label: 'Heatwave',
            tempMin: 30,
            tempMax: 40,
            needEffects: { Thirst: 2 },
          },
        },
      }),
    ).toEqual([
      "weather:rainy: references unknown need 'Warmth'",
      "weather:heatwave: references unknown need 'Thirst'",
    ]);
  });

  it('accepts declared needs and conditions without needEffects', () => {
    expect(
      issues({
        persistence: 0.5,
        conditions: {
          sunny: { label: 'Bright' },
          stormy: { needEffects: { Energy: 2 } },
        },
      }),
    ).toEqual([]);
  });

  it('skips need checks when needs.json is absent', () => {
    expect(
      issues({ conditions: { rainy: { needEffects: { Warmth: 1 } } } }, {}),
    ).toEqual([]);
  });

  it('collects nothing from a weather.json without conditions', () => {
    expect(issues({})).toEqual([]);
  });
});
