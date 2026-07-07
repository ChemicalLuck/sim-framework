import type { Trait } from './character.types';

export type NpcFilter =
  | { kind: 'appearance'; featureId: string; value: string }
  | { kind: 'profession'; profession: string }
  | { kind: 'trait'; trait: Trait };

export type NpcSelection =
  | { npcIds: string[] }
  | { npcCount: number; npcFilters?: NpcFilter[][] };
