import { describe, expect, it } from 'vitest';
import type { InventoryItem } from '@chemicalluck/sim-engine/types/item.types';

import reducer, {
  clearContainer,
  configureContainers,
  depositItem,
  withdrawItem,
} from './slice';

const apple: InventoryItem = { id: 'apple', kind: 'item', name: 'Apple' };
const bread: InventoryItem = { id: 'bread', kind: 'item', name: 'Bread' };

describe('containers slice', () => {
  it('seeds the player container from configuration', () => {
    configureContainers({ player: [apple] });
    expect(reducer(undefined, { type: '@@INIT' })).toEqual({ player: [apple] });
  });

  it('depositItem appends to an existing container', () => {
    const next = reducer(
      { player: [apple] },
      depositItem({ containerId: 'player', item: bread }),
    );
    expect(next.player).toHaveLength(2);
    expect(next.player?.[0]).toEqual(apple);
    expect(next.player?.[1]).toMatchObject({ id: 'bread', name: 'Bread' });
  });

  it('depositItem creates a new container when one does not exist', () => {
    const next = reducer(
      { player: [] },
      depositItem({ containerId: 'locker', item: apple }),
    );
    expect(next.locker).toHaveLength(1);
    expect(next.locker?.[0]).toMatchObject({ id: 'apple', name: 'Apple' });
  });

  it('depositItem stamps a unique instanceId on every deposit', () => {
    const next = reducer(
      { player: [] },
      depositItem({ containerId: 'player', item: apple }),
    );
    const after = reducer(
      next,
      depositItem({ containerId: 'player', item: apple }),
    );
    const [first, second] = after.player ?? [];
    expect(first.instanceId).toBeDefined();
    expect(second.instanceId).toBeDefined();
    expect(first.instanceId).not.toBe(second.instanceId);
  });

  it('withdrawItem removes an item by id', () => {
    const next = reducer(
      { player: [apple, bread] },
      withdrawItem({ containerId: 'player', itemId: 'apple' }),
    );
    expect(next.player).toEqual([bread]);
  });

  it('withdrawItem removes only the first matching instance', () => {
    const a1 = { ...apple, instanceId: 'a1' };
    const a2 = { ...apple, instanceId: 'a2' };
    const next = reducer(
      { player: [a1, a2, bread] },
      withdrawItem({ containerId: 'player', itemId: 'apple' }),
    );
    expect(next.player).toEqual([a2, bread]);
  });

  it('withdrawItem is a no-op for unknown containers', () => {
    const before = { player: [apple] };
    const after = reducer(
      before,
      withdrawItem({ containerId: 'missing', itemId: 'apple' }),
    );
    expect(after).toEqual(before);
  });

  it('clearContainer empties the target container', () => {
    const next = reducer(
      { player: [apple, bread] },
      clearContainer({ containerId: 'player' }),
    );
    expect(next.player).toEqual([]);
  });
});
