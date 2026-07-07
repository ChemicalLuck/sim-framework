import { describe, expect, it } from 'vitest';
import type { EngineDispatch } from '@chemicalluck/engine/state/store';
import { processEffects } from '@chemicalluck/engine/state/thunks';

import { DEFAULT_PREVIEW_STATE } from '../mock-state';
import { createMockNpc } from './mock-npc';
import { createSandboxStore } from './sandbox-store';

describe('createSandboxStore', () => {
  it('seeds present from the mock state and injects the mock NPC', () => {
    const npc = createMockNpc();
    const store = createSandboxStore(
      { ...DEFAULT_PREVIEW_STATE, money: 250 },
      npc,
    );
    const present = store.getState().present as {
      money: number;
      npcs: { named: { id: string }[]; nearby: string[] };
    };
    expect(present.money).toBe(250);
    expect(present.npcs.named[0].id).toBe(npc.id);
    expect(present.npcs.nearby).toEqual([npc.id]);
  });

  it('runs effects through the real pipeline and mutates sandbox state', () => {
    const store = createSandboxStore(
      { ...DEFAULT_PREVIEW_STATE, money: 100 },
      createMockNpc(),
    );
    (store.dispatch as EngineDispatch)(
      processEffects([{ kind: 'money', amount: -30 }]),
    );
    expect((store.getState().present as { money: number }).money).toBe(70);
  });

  it('is not a persisted store (no redux-persist wrapper)', () => {
    const store = createSandboxStore(DEFAULT_PREVIEW_STATE, createMockNpc());
    const state = store.getState() as { present?: unknown; _persist?: unknown };
    // persistReducer (used by the real buildStore) would add `_persist`.
    expect(state.present).toBeDefined();
    expect(state._persist).toBeUndefined();
  });
});
