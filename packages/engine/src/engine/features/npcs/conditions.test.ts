import { describe, expect, it } from 'vitest';

import { conditionToString } from '@chemicalluck/sim-engine/editor/lib/condition-utils';
import {
  isConditionMet,
  parseCondition,
} from '@chemicalluck/sim-engine/lib/conditions';
import type { RootState } from '@chemicalluck/sim-engine/state/store';

function stateWithNearby(nearby: string[]): RootState {
  return {
    present: {
      npcs: { characters: nearby.map((id) => ({ id })), named: [], nearby },
    },
  } as unknown as RootState;
}

describe('nearby condition', () => {
  it('parses and serializes', () => {
    const c = parseCondition('nearby >= 2');
    expect(c).toEqual({
      kind: 'gte',
      lhs: { kind: 'nearby' },
      rhs: { kind: 'const', value: 2 },
    });
    expect(conditionToString(c)).toBe('nearby >= 2');
  });

  it('evaluates to the number of NPCs at the current location', () => {
    const c = parseCondition('nearby == 0');
    expect(isConditionMet(stateWithNearby([]), c)).toBe(true);
    expect(isConditionMet(stateWithNearby(['a']), c)).toBe(false);
    expect(
      isConditionMet(stateWithNearby(['a', 'b']), parseCondition('nearby > 1')),
    ).toBe(true);
  });
});
