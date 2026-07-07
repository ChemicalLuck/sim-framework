import type { BodyAttributes, Character } from '@chemicalluck/engine/types/character.types';
import type { BaseEffect } from '@chemicalluck/engine/types/effect.types';
import type { InventoryItem, Wearable } from '@chemicalluck/engine/types/item.types';

export interface Player extends Character {
  id: 'player';
  locationId: string;
  // Required for the player (the base Character keeps it optional for NPCs).
  body: BodyAttributes;
}

export interface EquipEffect extends BaseEffect<'equip'> {
  readonly operation: 'don' | 'doff';
  readonly wearable: Wearable;
}

export type InventoryEffect =
  | (BaseEffect<'inventory'> & {
      readonly operation: 'add';
      readonly item: InventoryItem;
    })
  | (BaseEffect<'inventory'> & {
      readonly operation: 'remove';
      readonly id: string;
    });

export interface SkillEffect extends BaseEffect<'skill'> {
  readonly skill: string;
  readonly delta: number;
}

export interface BodyAttributeEffect extends BaseEffect<'bodyAttribute'> {
  readonly attribute: string;
  readonly delta: number;
}

declare module '@chemicalluck/engine/types/effect.types' {
  interface EffectMap {
    equip: EquipEffect;
    inventory: InventoryEffect;
    skill: SkillEffect;
    bodyAttribute: BodyAttributeEffect;
  }
}
