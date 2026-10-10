import { describe, expect, it } from 'vitest';

import { conditionToString } from '@chemicalluck/sim-engine/editor/lib/condition-utils';
import {
  evalExpr,
  isConditionMet,
  parseCondition,
} from '@chemicalluck/sim-engine/lib/conditions';
import type { RootState } from '@chemicalluck/sim-engine/state/store';
import type { Wearable } from '@chemicalluck/sim-engine/types/item.types';

import { selectEquippedAttributeTotal } from './selectors';

const coat: Wearable = {
  kind: 'wearable',
  id: 'coat',
  name: 'Coat',
  slot: 'jacket',
  coverage: 2,
  appearance: {},
  warmth: 3,
  attributes: { formality: 2 },
};
const gloves: Wearable = {
  kind: 'wearable',
  id: 'gloves',
  name: 'Gloves',
  slot: 'hands',
  coverage: 0,
  appearance: {},
  warmth: 1,
};

const state = {
  present: { player: { equipment: { jacket: coat, hands: gloves } } },
} as unknown as RootState;

describe('equipped.<attr> expressions', () => {
  it('parses into an equipped expression', () => {
    expect(parseCondition('equipped.warmth >= 3')).toEqual({
      kind: 'gte',
      lhs: { kind: 'equipped', attribute: 'warmth' },
      rhs: { kind: 'const', value: 3 },
    });
  });

  it('rejects a bare equipped identifier', () => {
    expect(() => parseCondition('equipped > 1')).toThrow(/Unknown identifier/);
  });

  it('round-trips through the serializer', () => {
    for (const s of ['equipped.warmth >= 3', 'equipped.formality < 2']) {
      expect(conditionToString(parseCondition(s))).toBe(s);
    }
  });

  it('evaluates to the equipped total', () => {
    expect(evalExpr(state, { kind: 'equipped', attribute: 'warmth' })).toBe(4);
    expect(isConditionMet(state, parseCondition('equipped.warmth >= 4'))).toBe(
      true,
    );
    expect(isConditionMet(state, parseCondition('equipped.coverage > 2'))).toBe(
      false,
    );
    expect(
      isConditionMet(state, parseCondition('equipped.formality == 2')),
    ).toBe(true);
  });
});

describe('selectEquippedAttributeTotal', () => {
  it('sums equipped warmth', () => {
    expect(selectEquippedAttributeTotal(state, 'warmth')).toBe(4);
  });
});
