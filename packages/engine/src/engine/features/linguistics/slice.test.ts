import { describe, expect, it } from 'vitest';

import reducer, { setAllWordChoices, setWordChoice } from './slice';

const initial = { wordChoices: {} };

describe('linguistics slice', () => {
  it('sets a word choice', () => {
    const next = reducer(
      initial,
      setWordChoice({ key: 'tall', value: 'giant' }),
    );
    expect(next.wordChoices).toEqual({ tall: 'giant' });
  });

  it('clears a word choice when set to blank', () => {
    const state = { wordChoices: { tall: 'giant' } };
    const next = reducer(state, setWordChoice({ key: 'tall', value: '  ' }));
    expect(next.wordChoices).toEqual({});
  });

  it('replaces all word choices', () => {
    const next = reducer(initial, setAllWordChoices({ a: 'x', b: 'y' }));
    expect(next.wordChoices).toEqual({ a: 'x', b: 'y' });
  });
});
