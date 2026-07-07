import { QuestTemplatesPanel } from './quest-templates-panel';
import { QuestsPanel } from './quests-panel';

export default {
  panels: {
    quests: {
      label: 'Quests',
      group: 'Narrative',
      file: 'quests',
      component: QuestsPanel,
    },
    'quest-templates': {
      label: 'Quest Templates',
      group: 'Narrative',
      file: 'quest-templates',
      component: QuestTemplatesPanel,
    },
  },
};
