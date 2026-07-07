import type { Slot, Wearable } from './item.types';

/**
 * Body measurements keyed by attribute id (e.g. `height`, `weight`). The set
 * of known attributes is defined by `bodyAttributes` in `appearance.json` and
 * exposed at runtime via `getBodyAttributes()`. Most garment measurements
 * (waist, underbust, hips, inseam) are estimated from these via the configured
 * size models and not stored.
 */
export type BodyAttributes = Record<string, number>;

export interface Character {
  id: string;
  profile: CharacterProfile;
  equipment: Equipment;
  skills: Record<string, number>;
  traits: Trait[];
  // Optional on the base character (NPCs don't need it); required on Player.
  body?: BodyAttributes;
}

export interface CharacterProfileTemplate {
  firstName: string;
  lastName: string;
  profession: string;
  age: number;
  appearance: Record<string, string | null>;
}

export type CharacterProfile = {
  [K in keyof CharacterProfileTemplate]: K extends 'appearance'
    ? Record<string, string>
    : NonNullable<CharacterProfileTemplate[K]>;
};

export type Equipment = Record<Slot, Wearable | null>;

export type Trait = 'Introverted' | 'Extroverted';
