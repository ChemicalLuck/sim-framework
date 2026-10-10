import { describe, expect, it } from 'vitest';

import editors from './effect-editor';

const { calendar } = editors;

const addState = (dayOfWeek: string) => ({
  ...calendar.defaultState,
  id: 'match',
  label: 'Football',
  dayOfWeek,
});

describe('calendar effect editor', () => {
  it.each([
    ['0', 0],
    ['6', 6],
    ['3', 3],
  ])('keeps day %s', (raw, day) => {
    expect(calendar.buildEffect(addState(raw))).toMatchObject({
      event: { dayOfWeek: day },
    });
  });

  it('round-trips a Sunday event', () => {
    const effect = calendar.buildEffect(addState('0'));
    if (!effect) throw new Error('expected an effect');
    expect(calendar.toFormState(effect).dayOfWeek).toBe('0');
  });

  it.each(['', '7', 'x'])('falls back to Monday for %j', (raw) => {
    expect(calendar.buildEffect(addState(raw))).toMatchObject({
      event: { dayOfWeek: 1 },
    });
  });
});
