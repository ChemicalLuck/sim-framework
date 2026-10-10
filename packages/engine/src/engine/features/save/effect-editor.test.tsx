import { describe, expect, it } from 'vitest';

import editors from './effect-editor';

const { autosave } = editors;

describe('autosave effect editor', () => {
  it('builds a bare autosave effect by default', () => {
    expect(autosave.buildEffect(autosave.defaultState)).toEqual({
      kind: 'autosave',
    });
  });

  it('round-trips label and keep', () => {
    const effect = autosave.buildEffect({ label: ' Chapter 1 ', keep: true });
    expect(effect).toEqual({
      kind: 'autosave',
      label: 'Chapter 1',
      keep: true,
    });
    if (!effect) throw new Error('expected an effect');
    expect(autosave.toFormState(effect)).toEqual({
      label: 'Chapter 1',
      keep: true,
    });
    expect(autosave.label(effect)).toBe('autosave:Chapter 1 (keep)');
  });
});
