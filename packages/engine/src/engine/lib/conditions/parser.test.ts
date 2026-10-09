import { describe, expect, it } from 'vitest';

import { conditionToString } from '@chemicalluck/sim-engine/editor/lib/condition-utils';

import { parseCondition } from './parser';

describe('parseCondition', () => {
  it('parses registered identifiers', () => {
    expect(parseCondition('money >= 50')).toEqual({
      kind: 'gte',
      lhs: { kind: 'money' },
      rhs: { kind: 'const', value: 50 },
    });
    expect(parseCondition('need.Energy < 10 && gamehour > 8').kind).toBe('and');
  });

  it('parses quoted string literals', () => {
    expect(parseCondition("location == 'cafe'")).toEqual({
      kind: 'eq',
      lhs: { kind: 'location' },
      rhs: { kind: 'string', value: 'cafe' },
    });
  });

  it.each([
    'money.balance >= 50',
    'needs.energy > 0.25',
    'time.hour < 18',
    "typo == 'x'",
    'has_dirty_clothse',
  ])('rejects the unknown identifier in %s', (input) => {
    expect(() => parseCondition(input)).toThrow(/Unknown identifier/);
  });

  describe('season and weather', () => {
    it("parses season == '<id>' into a season condition", () => {
      expect(parseCondition("season == 'summer'")).toEqual({
        kind: 'season',
        seasonId: 'summer',
      });
    });

    it("parses weather == '<id>' into a weather condition", () => {
      expect(parseCondition("weather == 'rainy'")).toEqual({
        kind: 'weather',
        conditionId: 'rainy',
      });
    });

    it('round-trips through the serializers', () => {
      for (const c of [
        { kind: 'season', seasonId: 'winter' },
        { kind: 'weather', conditionId: 'snowy' },
      ] as const) {
        expect(parseCondition(conditionToString(c))).toEqual(c);
      }
    });

    it('composes with other conditions', () => {
      expect(parseCondition("season == 'summer' && money > 5")).toEqual({
        kind: 'and',
        lhs: { kind: 'season', seasonId: 'summer' },
        rhs: {
          kind: 'gt',
          lhs: { kind: 'money' },
          rhs: { kind: 'const', value: 5 },
        },
      });
    });

    it('rejects unknown season and weather ids', () => {
      expect(() => parseCondition("season == 'monsoon'")).toThrow(/season/);
      expect(() => parseCondition("weather == 'hail'")).toThrow(/weather/);
    });

    it('rejects operators other than ==', () => {
      expect(() => parseCondition("season != 'summer'")).toThrow(/==/);
    });
  });
});
