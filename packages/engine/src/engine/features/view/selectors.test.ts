import { describe, expect, it } from 'vitest';
import type { RootState } from '@sim/engine/state/store';

import { selectDescription, selectView } from './selectors';

function makeState(view: {
  activeViewId: string;
  description: string;
  props: Record<string, unknown>;
}): RootState {
  return { present: { view } } as unknown as RootState;
}

describe('view selectors', () => {
  it('selectView returns the view slice', () => {
    const view = {
      activeViewId: 'SceneView',
      description: 'A scene.',
      props: { scene: {} },
    };
    expect(selectView(makeState(view))).toEqual(view);
  });

  it('selectDescription returns the description string', () => {
    expect(
      selectDescription(
        makeState({
          activeViewId: 'SceneView',
          description: 'A scene.',
          props: {},
        }),
      ),
    ).toBe('A scene.');
  });
});
