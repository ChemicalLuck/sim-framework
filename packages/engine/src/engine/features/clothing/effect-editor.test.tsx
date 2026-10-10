import { describe, expect, it } from 'vitest';

import type { Effect } from '@chemicalluck/sim-engine/types/effect.types';

import editors from './effect-editor';

const editor = editors.wearable_condition;
const roundTrip = (effect: Effect) =>
  editor.buildEffect(editor.toFormState(effect));

describe('wearable_condition effect editor', () => {
  it('round-trips a plain reset', () => {
    const effect: Effect = { kind: 'wearable_condition', target: '*' };
    expect(roundTrip(effect)).toEqual(effect);
  });

  it('round-trips set fields and silent', () => {
    const effect: Effect = {
      kind: 'wearable_condition',
      target: 'shirt',
      set: { wet: true, dirty: false, wearMinutes: 120 },
      silent: true,
    };
    expect(roundTrip(effect)).toEqual(effect);
  });

  it('omits unchanged fields from set', () => {
    expect(
      editor.buildEffect({
        ...editor.defaultState,
        dirty: 'true',
      }),
    ).toEqual({
      kind: 'wearable_condition',
      target: '*',
      set: { dirty: true },
    });
  });

  it('rejects a non-numeric wear time', () => {
    expect(
      editor.buildEffect({ ...editor.defaultState, wearMinutes: 'abc' }),
    ).toBeNull();
  });
});
