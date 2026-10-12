import { describe, expect, it } from 'vitest';

import type { RootState } from '@chemicalluck/sim-engine/state/store';
import type { Action } from '@chemicalluck/sim-engine/types';

import { type ActionDecorator, decorateAction } from './action-decorators';

const state = { present: { money: 5 } } as unknown as RootState;
const leap: Action = { kind: 'action', text: 'Leap' };

describe('decorateAction', () => {
  it('returns no decoration without decorators', () => {
    expect(decorateAction([], leap, state)).toEqual({});
  });

  it('skips decorators that return null', () => {
    expect(decorateAction([() => null], leap, state)).toEqual({});
  });

  it('derives the decoration from the action and the state', () => {
    const warn: ActionDecorator = (action, s) =>
      action.text === 'Leap' && s.present.money < 10 ? { prefix: '⚠ ' } : null;
    expect(decorateAction([warn], leap, state)).toEqual({ prefix: '⚠ ' });
    expect(
      decorateAction([warn], { kind: 'action', text: 'Walk' }, state),
    ).toEqual({});
  });

  it('combines several decorators in order', () => {
    const decorators: ActionDecorator[] = [
      () => ({ prefix: '⚠', suffix: ' (risky)', className: 'text-red-500' }),
      () => ({ prefix: '★', suffix: ' (new)', className: 'italic' }),
    ];
    expect(decorateAction(decorators, leap, state)).toEqual({
      prefix: '⚠★',
      suffix: ' (risky) (new)',
      className: 'text-red-500 italic',
    });
  });
});
