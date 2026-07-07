import { describe, expect, it } from 'vitest';
import type { Equipment } from '@chemicalluck/engine/types/character.types';

import reducer, { addOutfit, removeOutfitByName } from './slice';
import type { Outfit } from './types';

const emptyEquipment = {} as Equipment;

const casual: Outfit = { name: 'Casual', equipment: emptyEquipment };
const formal: Outfit = { name: 'Formal', equipment: emptyEquipment };

describe('outfits slice', () => {
  it('starts empty', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual([]);
  });

  it('addOutfit appends a new outfit', () => {
    const next = reducer([], addOutfit(casual));
    expect(next).toEqual([casual]);
  });

  it('addOutfit replaces an outfit with the same name', () => {
    const updated: Outfit = { name: 'Casual', equipment: emptyEquipment };
    const next = reducer([casual, formal], addOutfit(updated));
    expect(next).toHaveLength(2);
    expect(next[1].name).toBe('Casual');
    expect(next[0].name).toBe('Formal');
  });

  it('removeOutfitByName filters by name', () => {
    const next = reducer([casual, formal], removeOutfitByName('Casual'));
    expect(next).toEqual([formal]);
  });

  it('removeOutfitByName is a no-op for unknown names', () => {
    const before = [casual];
    const after = reducer(before, removeOutfitByName('Unknown'));
    expect(after).toEqual(before);
  });
});
