import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { RootState } from '@chemicalluck/sim-engine/state/store';

import { autosaveThunk } from './effects';
import { getAutosaveSlots, registerPersistFlush } from './saves';
import { configureRunOptions } from './slice';

function stateFor(ironman: boolean) {
  return {
    present: {
      save: { ironman },
      player: { profile: { firstName: 'Sam' } },
      time: { timestamp: 0 },
    },
  } as unknown as RootState;
}

async function run(ironman: boolean, label = 'Woke up', keep?: boolean) {
  const state = stateFor(ironman);
  await autosaveThunk({ kind: 'autosave', label, keep })(
    () => undefined as never,
    () => state,
  );
}

describe('autosave effect', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('persist:root', '{"present":"now"}');
  });
  afterEach(() => {
    configureRunOptions({});
    registerPersistFlush(null);
  });

  it('flushes pending persistence, then snapshots into an auto slot', async () => {
    registerPersistFlush(() => {
      localStorage.setItem('persist:root', '{"present":"flushed"}');
      return Promise.resolve();
    });
    await run(false);
    const slots = getAutosaveSlots();
    expect(slots).toHaveLength(1);
    const [slot] = slots;
    expect(slot).toMatchObject({ auto: true, label: 'Woke up' });
    expect(localStorage.getItem(slot.storageKey)).toBe('{"present":"flushed"}');
  });

  it('rotates using the configured count', async () => {
    configureRunOptions({ autosave: { rotate: 2 } });
    for (let i = 0; i < 4; i++) await run(false, `Wake ${String(i)}`);
    await run(false, 'Term 1', true);
    const slots = getAutosaveSlots();
    expect(slots.map((s) => s.label)).toEqual(['Wake 2', 'Wake 3', 'Term 1']);
  });

  it('defaults to keeping 3 rotating autosaves', async () => {
    for (let i = 0; i < 5; i++) await run(false, `Wake ${String(i)}`);
    expect(getAutosaveSlots()).toHaveLength(3);
  });

  it('does nothing in an ironman run', async () => {
    await run(true);
    await run(true, 'Chapter 1', true);
    expect(getAutosaveSlots()).toEqual([]);
    expect(localStorage.getItem('saveSlots')).toBeNull();
    expect(localStorage.getItem('persist:root')).toBe('{"present":"now"}');
  });

  it('does nothing when every run is ironman', async () => {
    configureRunOptions({ ironman: 'always' });
    await run(false);
    expect(getAutosaveSlots()).toEqual([]);
  });
});
