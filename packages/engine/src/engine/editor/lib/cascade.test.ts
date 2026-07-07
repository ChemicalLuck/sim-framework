import { describe, expect, it } from 'vitest';

import {
  type ObjectiveRename,
  diffObjectiveRenames,
  patchObjectiveRenames,
} from './cascade';

describe('diffObjectiveRenames', () => {
  it('detects a renamed objective paired by index', () => {
    const renames = diffObjectiveRenames(
      [{ id: 'q1', objectives: [{ name: 'old' }] }],
      [{ id: 'q1', objectives: [{ name: 'new' }] }],
    );
    expect(renames).toEqual([
      { questId: 'q1', oldName: 'old', newName: 'new' },
    ]);
  });

  it('ignores quests whose objective count changed (add/remove)', () => {
    const renames = diffObjectiveRenames(
      [{ id: 'q1', objectives: [{ name: 'a' }] }],
      [{ id: 'q1', objectives: [{ name: 'a' }, { name: 'b' }] }],
    );
    expect(renames).toEqual([]);
  });

  it('ignores new quests with no prior version', () => {
    const renames = diffObjectiveRenames(
      [],
      [{ id: 'q1', objectives: [{ name: 'a' }] }],
    );
    expect(renames).toEqual([]);
  });

  it('returns nothing when names are unchanged', () => {
    const renames = diffObjectiveRenames(
      [{ id: 'q1', objectives: [{ name: 'a' }] }],
      [{ id: 'q1', objectives: [{ name: 'a' }] }],
    );
    expect(renames).toEqual([]);
  });
});

describe('patchObjectiveRenames', () => {
  const renames: ObjectiveRename[] = [
    { questId: 'q1', oldName: 'old', newName: 'new' },
  ];

  it('rewrites matching quest effects and counts them', () => {
    const data = [
      {
        id: 'scene1',
        actions: [
          {
            actions: [
              {
                effects: [
                  { kind: 'quest', questId: 'q1', objectiveName: 'old' },
                  { kind: 'money', amount: 5 },
                ],
              },
            ],
          },
        ],
      },
    ];
    const { patched, count } = patchObjectiveRenames(data, renames);
    expect(count).toBe(1);
    expect(patched[0].actions[0].actions[0].effects[0]).toMatchObject({
      kind: 'quest',
      objectiveName: 'new',
    });
    // Unrelated effect untouched.
    expect(patched[0].actions[0].actions[0].effects[1]).toMatchObject({
      kind: 'money',
      amount: 5,
    });
  });

  it('leaves non-matching effects and quests alone (count 0)', () => {
    const data = [
      {
        id: 'scene1',
        actions: [
          {
            actions: [
              {
                effects: [
                  { kind: 'quest', questId: 'q2', objectiveName: 'old' },
                ],
              },
            ],
          },
        ],
      },
    ];
    const { count } = patchObjectiveRenames(data, renames);
    expect(count).toBe(0);
  });
});
