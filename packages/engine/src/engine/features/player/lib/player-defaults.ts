import { setPostCharacterCreationView } from './character-customisation';
import {
  DEFAULT_SKILL_MAX,
  configureCharacterCreationSkillPoints,
  configureSkillMax,
} from './skills';

interface PlayerJsonConfig {
  postCharacterCreationView?: string;
  characterCreationSkillPoints?: number;
  /** Top of the skill scale for the player, generated NPCs and encounters. */
  skillMax?: number;
}

export function configurePlayerDefaults(config: PlayerJsonConfig): void {
  setPostCharacterCreationView(
    config.postCharacterCreationView ?? 'DefaultView',
  );
  configureCharacterCreationSkillPoints(
    config.characterCreationSkillPoints ?? 5,
  );
  configureSkillMax(config.skillMax ?? DEFAULT_SKILL_MAX);
}
