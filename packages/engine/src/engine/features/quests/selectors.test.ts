import { describe, expect, it } from 'vitest';
import type { RootState } from '@chemicalluck/engine/state/store';

import {
  selectActiveQuests,
  selectCompletedQuests,
  selectQuests,
} from './selectors';
import type { Quest } from './types';

function makeState(quests: Quest[]): RootState {
  return {
    present: { quests },
  } as unknown as RootState;
}

const active: Quest = {
  id: 'a',
  name: 'Active',
  objectives: [
    { name: 'o1', state: 'available', condition: { kind: 'action' } },
  ],
} as unknown as Quest;

const complete: Quest = {
  id: 'b',
  name: 'Done',
  objectives: [
    { name: 'o1', state: 'complete', condition: { kind: 'action' } },
  ],
} as unknown as Quest;

const mixed: Quest = {
  id: 'c',
  name: 'Mixed',
  objectives: [
    { name: 'o1', state: 'complete', condition: { kind: 'action' } },
    { name: 'o2', state: 'available', condition: { kind: 'action' } },
  ],
} as unknown as Quest;

describe('quests selectors', () => {
  it('selectQuests returns the quests slice', () => {
    const state = makeState([active]);
    expect(selectQuests(state)).toEqual([active]);
  });

  it('selectActiveQuests returns quests with any available objective', () => {
    const state = makeState([active, complete, mixed]);
    const result = selectActiveQuests(state);
    expect(result.map((q) => q.id)).toEqual(['a', 'c']);
  });

  it('selectCompletedQuests returns quests with any complete objective', () => {
    const state = makeState([active, complete, mixed]);
    const result = selectCompletedQuests(state);
    expect(result.map((q) => q.id)).toEqual(['b', 'c']);
  });
});
