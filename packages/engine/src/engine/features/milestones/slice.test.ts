import { describe, expect, it } from 'vitest';

import reducer, { addMilestone, loadMilestones } from './slice';
import type { Milestone } from './types';

const defs: Milestone[] = [
  { id: 'first_day', title: 'First Day' },
  { id: 'graduated', title: 'Graduated' },
];

describe('milestones slice', () => {
  it('starts with empty definitions and no achievements', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual({
      definitions: [],
      achieved: [],
    });
  });

  it('loadMilestones replaces the definitions', () => {
    const next = reducer(undefined, loadMilestones(defs));
    expect(next.definitions).toEqual(defs);
  });

  it('addMilestone appends a new id', () => {
    const next = reducer(
      { definitions: defs, achieved: [] },
      addMilestone('first_day'),
    );
    expect(next.achieved).toEqual(['first_day']);
  });

  it('addMilestone deduplicates an already-achieved id', () => {
    const next = reducer(
      { definitions: defs, achieved: ['first_day'] },
      addMilestone('first_day'),
    );
    expect(next.achieved).toEqual(['first_day']);
  });
});
