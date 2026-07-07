import { setPostCharacterCreationView } from './character-customisation';
import { configureCharacterCreationSkillPoints } from './skills';

interface PlayerJsonConfig {
  postCharacterCreationView?: string;
  characterCreationSkillPoints?: number;
}

export function configurePlayerDefaults(config: PlayerJsonConfig): void {
  setPostCharacterCreationView(
    config.postCharacterCreationView ?? 'DefaultView',
  );
  configureCharacterCreationSkillPoints(
    config.characterCreationSkillPoints ?? 5,
  );
}
