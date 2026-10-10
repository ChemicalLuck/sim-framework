import { describe, expect, it } from 'vitest';

import type {
  Wearable,
  WearableTemplate,
} from '@chemicalluck/sim-engine/types/item.types';

import {
  equippedAttributeTotal,
  generateWearableFromTemplate,
} from './wearables';

const base: WearableTemplate = {
  name: 'Wool Coat',
  slot: 'jacket',
  coverage: 2,
  style: 'casual',
  options: { color1: ['Grey'] },
  value: 80,
};

describe('generateWearableFromTemplate', () => {
  it('builds the same wearable as before for an existing template', () => {
    expect(generateWearableFromTemplate(base, { color1: 'Grey' }, 'M')).toEqual(
      {
        kind: 'wearable',
        id: 'wool_coat-grey-m',
        name: 'Wool Coat',
        description: JSON.stringify({ color1: 'Grey' }),
        value: 80,
        slot: 'jacket',
        coverage: 2,
        style: 'casual',
        appearance: { color1: 'Grey' },
        sizeSystem: undefined,
        size: 'M',
      },
    );
    const plain = generateWearableFromTemplate(base, { color1: 'Grey' });
    expect('warmth' in plain).toBe(false);
    expect('attributes' in plain).toBe(false);
  });

  it('carries warmth and custom attributes onto the wearable', () => {
    const wearable = generateWearableFromTemplate(
      {
        ...base,
        warmth: 3,
        attributes: { waterproof: true, formality: 2, fabric: 'wool' },
      },
      { color1: 'Grey' },
    );
    expect(wearable.warmth).toBe(3);
    expect(wearable.attributes).toEqual({
      waterproof: true,
      formality: 2,
      fabric: 'wool',
    });
  });

  it('copies attributes rather than sharing the template object', () => {
    const template = { ...base, attributes: { formality: 2 } };
    const wearable = generateWearableFromTemplate(template, {});
    expect(wearable.attributes).not.toBe(template.attributes);
  });
});

describe('equippedAttributeTotal', () => {
  const coat: Wearable = {
    kind: 'wearable',
    id: 'coat',
    name: 'Coat',
    slot: 'jacket',
    coverage: 2,
    appearance: {},
    warmth: 3,
    attributes: { formality: 2, waterproof: true },
  };
  const scarf: Wearable = {
    kind: 'wearable',
    id: 'scarf',
    name: 'Scarf',
    slot: 'neck',
    coverage: 0,
    appearance: {},
    warmth: 1.5,
  };
  const tee: Wearable = {
    kind: 'wearable',
    id: 'tee',
    name: 'Tee',
    slot: 'baselayer',
    coverage: 1,
    appearance: {},
    attributes: { formality: '1' },
  };
  const equipment = { jacket: coat, neck: scarf, baselayer: tee, hat: null };

  it('sums first-class warmth and coverage', () => {
    expect(equippedAttributeTotal(equipment, 'warmth')).toBe(4.5);
    expect(equippedAttributeTotal(equipment, 'coverage')).toBe(3);
  });

  it('sums numeric custom attributes, ignoring non-numbers', () => {
    expect(equippedAttributeTotal(equipment, 'formality')).toBe(2);
    expect(equippedAttributeTotal(equipment, 'waterproof')).toBe(0);
  });

  it('is 0 when nothing is equipped or the attribute is unknown', () => {
    expect(equippedAttributeTotal({}, 'warmth')).toBe(0);
    expect(equippedAttributeTotal(equipment, 'nope')).toBe(0);
  });
});
