import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createAutosave,
  getAutosaveSlots,
  getManualSaveSlots,
  getSaveSlots,
  loadGame,
  saveGame,
} from './saves';

function autosave(label: string, keep?: boolean, rotate = 3) {
  return createAutosave({
    label,
    keep,
    rotate,
    characterName: 'Sam',
    inGameTime: '7:00 AM',
  });
}

describe('autosave snapshots', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('persist:root', '{"present":"day1"}');
  });

  it('copies the current state into an auto slot in the manual-save format', () => {
    const slot = autosave('Woke up');
    expect(slot).toMatchObject({
      auto: true,
      label: 'Woke up',
      name: 'Woke up',
      characterName: 'Sam',
      inGameTime: '7:00 AM',
    });
    expect(slot && localStorage.getItem(slot.storageKey)).toBe(
      '{"present":"day1"}',
    );
    expect(getSaveSlots()).toEqual([slot]);
  });

  it('rotation keeps only the newest N autosaves', () => {
    const made = [1, 2, 3, 4, 5].map((n) => {
      localStorage.setItem('persist:root', `{"present":"day${String(n)}"}`);
      return autosave(`Day ${String(n)}`);
    });
    const kept = getAutosaveSlots();
    expect(kept.map((s) => s.label)).toEqual(['Day 3', 'Day 4', 'Day 5']);
    // Rotated-out snapshots are removed from storage too.
    expect(localStorage.getItem(made[0]?.storageKey ?? '')).toBeNull();
    expect(localStorage.getItem(made[1]?.storageKey ?? '')).toBeNull();
    expect(localStorage.getItem(made[4]?.storageKey ?? '')).toBe(
      '{"present":"day5"}',
    );
  });

  it('keep-flagged snapshots persist through rotation', () => {
    const checkpoint = autosave('Chapter 1', true);
    for (let i = 0; i < 5; i++) autosave(`Wake ${String(i)}`);
    const slots = getAutosaveSlots();
    expect(slots.filter((s) => !s.keep)).toHaveLength(3);
    expect(slots).toContainEqual(checkpoint);
    expect(checkpoint?.keep).toBe(true);
    expect(localStorage.getItem(checkpoint?.storageKey ?? '')).toBe(
      '{"present":"day1"}',
    );
  });

  it('does not rotate out manual saves', () => {
    saveGame('Manual', 'Sam', '6:00 AM');
    for (let i = 0; i < 4; i++) autosave(`Wake ${String(i)}`, false, 1);
    expect(getManualSaveSlots().map((s) => s.name)).toEqual(['Manual']);
    expect(getAutosaveSlots()).toHaveLength(1);
  });

  it('stores nothing for a rotating autosave when rotate is 0', () => {
    expect(autosave('Wake', false, 0)).toBeNull();
    expect(getSaveSlots()).toEqual([]);
    expect(autosave('Chapter', true, 0)).not.toBeNull();
  });

  describe('loading', () => {
    const reload = vi.fn();
    beforeEach(() => {
      vi.stubGlobal('location', { reload });
    });
    afterEach(() => {
      vi.unstubAllGlobals();
      reload.mockReset();
    });

    it('loading an autosave restores its snapshot', () => {
      const slot = autosave('Woke up');
      localStorage.setItem('persist:root', '{"present":"later"}');
      if (!slot) throw new Error('expected a slot');
      loadGame(slot);
      expect(localStorage.getItem('persist:root')).toBe('{"present":"day1"}');
      expect(reload).toHaveBeenCalled();
    });
  });
});
