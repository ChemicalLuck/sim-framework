import { act, renderHook } from '@testing-library/react';
import { createElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { UnsavedChangesProvider } from './unsaved-changes';
import { usePanelItems } from './use-panel-items';

interface Entry {
  id: string;
  name: string;
}

const wrapper = ({ children }: { children: React.ReactNode }) =>
  createElement(UnsavedChangesProvider, null, children);

function setup(initial: Entry[]) {
  const discardRaw = vi.fn();
  const view = renderHook(() => usePanelItems(initial, discardRaw), {
    wrapper,
  });
  return { ...view, discardRaw };
}

describe('usePanelItems', () => {
  it('seeds items keyed by id and starts clean', () => {
    const { result } = setup([{ id: 'a', name: 'A' }]);
    expect(result.current.ids).toEqual(['a']);
    expect(result.current.items.a).toEqual({ id: 'a', name: 'A' });
    expect(result.current.dirty).toBe(false);
  });

  it('handleAdd prepends a new item and marks dirty', () => {
    const { result } = setup([{ id: 'a', name: 'A' }]);
    act(() => {
      result.current.handleAdd({ id: 'b', name: 'B' });
    });
    expect(result.current.ids).toEqual(['b', 'a']);
    expect(result.current.dirty).toBe(true);
  });

  it('handleChange replaces an item by id', () => {
    const { result } = setup([{ id: 'a', name: 'A' }]);
    act(() => {
      result.current.handleChange('a', { id: 'a', name: 'renamed' });
    });
    expect(result.current.items.a.name).toBe('renamed');
    expect(result.current.dirty).toBe(true);
  });

  it('handleClone deep-copies, prepends, marks dirty and returns the clone', () => {
    const { result } = setup([{ id: 'a', name: 'A' }]);
    let clone: Entry | null = null;
    act(() => {
      clone = result.current.handleClone('a', 'b');
    });
    expect(clone).toEqual({ id: 'b', name: 'A' });
    expect(result.current.ids).toEqual(['b', 'a']);
    expect(result.current.dirty).toBe(true);
  });

  it('handleClone is a no-op on a missing source or a duplicate id', () => {
    const { result } = setup([
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B' },
    ]);
    let missing: Entry | null = { id: 'x', name: 'x' };
    let dup: Entry | null = { id: 'x', name: 'x' };
    act(() => {
      missing = result.current.handleClone('ghost', 'c');
      dup = result.current.handleClone('a', 'b');
    });
    expect(missing).toBeNull();
    expect(dup).toBeNull();
    expect(result.current.ids).toEqual(['a', 'b']);
    expect(result.current.dirty).toBe(false);
  });

  it('handleClone produces an independent copy (mutating the clone leaves the source intact)', () => {
    const { result } = setup([{ id: 'a', name: 'A' }]);
    act(() => {
      result.current.handleClone('a', 'b');
    });
    act(() => {
      result.current.handleChange('b', { id: 'b', name: 'changed' });
    });
    expect(result.current.items.a.name).toBe('A');
    expect(result.current.items.b.name).toBe('changed');
  });

  it('handleDelete removes the item and returns the remaining ids', () => {
    const { result } = setup([
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B' },
    ]);
    let remaining: string[] = [];
    act(() => {
      remaining = result.current.handleDelete('a').remaining;
    });
    expect(remaining).toEqual(['b']);
    expect(result.current.ids).toEqual(['b']);
  });

  it('discard restores the original items and calls discardRaw', () => {
    const { result, discardRaw } = setup([{ id: 'a', name: 'A' }]);
    act(() => {
      result.current.handleChange('a', { id: 'a', name: 'changed' });
    });
    expect(result.current.dirty).toBe(true);
    act(() => {
      result.current.discard();
    });
    expect(result.current.items.a.name).toBe('A');
    expect(result.current.dirty).toBe(false);
    expect(discardRaw).toHaveBeenCalled();
  });
});
