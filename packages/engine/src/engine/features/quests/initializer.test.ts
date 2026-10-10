import { describe, expect, it, vi } from 'vitest';

import type { EngineStore } from '@chemicalluck/sim-engine/state/store';

import initialize from './initializer';

describe('quests initializer', () => {
  it('loads nothing when the game has no quests.json', () => {
    const dispatch = vi.fn();
    initialize({ dispatch } as unknown as EngineStore);
    expect(dispatch).not.toHaveBeenCalled();
  });
});
