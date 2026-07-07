export interface SkillDefinition {
  id: string;
  name: string;
  description?: string;
  /** Inclusive [min, max] range for NPC auto-generation. Defaults to [0, 5]. */
  npcRange?: [number, number];
}

let _skills: SkillDefinition[] = [];
let _characterCreationPoints = 5;

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
