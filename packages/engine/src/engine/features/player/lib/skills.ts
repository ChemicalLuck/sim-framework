export interface SkillDefinition {
  id: string;
  name: string;
  description?: string;
  /**
   * Inclusive [min, max] range for NPC auto-generation. Defaults to
   * `[0, skillMax / 2]` (rounded down) and is clamped to `[0, skillMax]`.
   */
  npcRange?: [number, number];
}

/** Default top of the skill scale when `player.json` sets no `skillMax`. */
export const DEFAULT_SKILL_MAX = 10;

let _skills: SkillDefinition[] = [];
let _characterCreationPoints = 5;
let _skillMax = DEFAULT_SKILL_MAX;

export function configureSkills(defs: SkillDefinition[]): void {
  _skills = defs;
}

export function getSkills(): SkillDefinition[] {
  return _skills;
}

export function configureCharacterCreationSkillPoints(n: number): void {
  _characterCreationPoints = n;
}

export function getCharacterCreationSkillPoints(): number {
  return _characterCreationPoints;
}

/**
 * The single skill scale (0 – max) shared by the player `skill` effect clamp,
 * NPC skill generation defaults and encounter skill weighting.
 */
export function configureSkillMax(max: number): void {
  _skillMax = max > 0 ? max : DEFAULT_SKILL_MAX;
}

export function getSkillMax(): number {
  return _skillMax;
}

/** The inclusive range generated NPCs roll a skill in, clamped to the scale. */
export function getNpcSkillRange(def: SkillDefinition): [number, number] {
  const [min, max] = def.npcRange ?? [0, Math.floor(_skillMax / 2)];
  const clamp = (n: number) => Math.max(0, Math.min(_skillMax, n));
  const lo = clamp(min);
  return [lo, Math.max(lo, clamp(max))];
}
