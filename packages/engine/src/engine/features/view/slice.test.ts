import { describe, expect, it } from 'vitest';

import reducer, { setDescription, setView } from './slice';

describe('view slice', () => {
  it('starts with MainMenuView and an empty description', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual({
      activeViewId: 'MainMenuView',
      description: '',
      props: {},
    });
  });

  it('setView updates activeViewId and props', () => {
    const next = reducer(
      undefined,
      setView({ activeViewId: 'DefaultView', props: {} }),
    );
    expect(next.activeViewId).toBe('DefaultView');
    expect(next.props).toEqual({});
  });

  it('setDescription replaces the description', () => {
    const next = reducer(undefined, setDescription('A grey day.'));
    expect(next.description).toBe('A grey day.');
  });

  it('setView leaves description untouched', () => {
    const withDesc = reducer(undefined, setDescription('Initial.'));
    const next = reducer(
      withDesc,
      setView({ activeViewId: 'DefaultView', props: {} }),
    );
    expect(next.description).toBe('Initial.');
  });
});
