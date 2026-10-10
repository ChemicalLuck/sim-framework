import { afterEach, describe, expect, it } from 'vitest';

import { conditionToString } from '@chemicalluck/sim-engine/editor/lib/condition-utils';
import {
  evalExpr,
  isConditionMet,
  parseCondition,
} from '@chemicalluck/sim-engine/lib/conditions';
import type { RootState } from '@chemicalluck/sim-engine/state/store';

const originalTz = process.env.TZ;

afterEach(() => {
  process.env.TZ = originalTz;
});

function stateAt(timestamp: number): RootState {
  return {
    present: {
      time: { timestamp },
      rng: { seed: 0 },
      weather: { conditionOverride: null },
    },
  } as unknown as RootState;
}

// Saturday 20 December 2025, 23:30 UTC.
const saturdayNight = stateAt(Date.UTC(2025, 11, 20, 23, 30));

describe('time conditions', () => {
  it.each([
    ['gameweekday', 6],
    ['gameday', 20],
    ['gamemonth', 12],
    ['gamehour', 23],
  ])('parses, evaluates and serializes %s', (id, value) => {
    const c = parseCondition(`${id} == ${String(value)}`);
    expect(c).toEqual({
      kind: 'eq',
      lhs: { kind: id },
      rhs: { kind: 'const', value },
    });
    expect(conditionToString(c)).toBe(`${id} == ${String(value)}`);
    expect(isConditionMet(saturdayNight, c)).toBe(true);
  });

  it.each(['UTC', 'Pacific/Kiritimati', 'America/Los_Angeles'])(
    'gamehour, gameweekday and season ignore host TZ=%s',
    (tz) => {
      process.env.TZ = tz;
      expect(evalExpr(saturdayNight, { kind: 'gamehour' })).toBe(23);
      expect(evalExpr(saturdayNight, { kind: 'gameweekday' })).toBe(6);
      expect(
        isConditionMet(saturdayNight, parseCondition("season == 'winter'")),
      ).toBe(true);
      // 30 November 23:30 UTC is still autumn even where it is already December.
      expect(
        isConditionMet(
          stateAt(Date.UTC(2025, 10, 30, 23, 30)),
          parseCondition("season == 'autumn'"),
        ),
      ).toBe(true);
    },
  );

  it('compares zoneless date literals in game (UTC) time', () => {
    process.env.TZ = 'America/Los_Angeles';
    const c = parseCondition("gametime >= '2025-12-20T23:00:00'");
    expect(isConditionMet(saturdayNight, c)).toBe(true);
    expect(isConditionMet(stateAt(Date.UTC(2025, 11, 20, 22, 59)), c)).toBe(
      false,
    );
  });
});
