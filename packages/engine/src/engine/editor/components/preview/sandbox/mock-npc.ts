import type { NamedNpcDefinition } from '@sim/engine/features/npcs/types';
import type { Equipment } from '@sim/engine/types/character.types';

export const MOCK_NPC_ID = 'preview_npc';

/**
 * A single stand-in NPC for the preview sandbox — used for `{npc0.*}` token
 * resolution and as the target of conversation/encounter views. Procedural
 * pool generation and filter-based selection are intentionally skipped.
 */
export function createMockNpc(): NamedNpcDefinition {
  return {
    id: MOCK_NPC_ID,
    profile: {
      firstName: 'Alex',
      lastName: 'Doe',
      profession: 'student',
      age: 20,
      appearance: {},
    },
    equipment: {} as Equipment,
    skills: {},
    traits: ['Extroverted'],
    pronouns: {
      subject: 'they',
      object: 'them',
      possessive: 'their',
      reflexive: 'themself',
      noun: 'person',
    },
    topics: [],
  };
}
