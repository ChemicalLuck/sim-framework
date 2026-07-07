import { ItemsPanel } from './items-panel';
import { ScenesPanel } from './scenes-panel';
import { ScriptsPanel } from './scripts-panel';
import { WearableTemplatesPanel } from './wearable-templates-panel';

export default {
  panels: {
    items: {
      label: 'Items',
      group: 'Core',
      file: 'items',
      component: ItemsPanel,
    },
    templates: {
      label: 'Wearable Templates',
      group: 'Core',
      file: 'wearable-templates',
      component: WearableTemplatesPanel,
    },
    scenes: {
      label: 'Scenes',
      group: 'Narrative',
      file: 'scenes',
      component: ScenesPanel,
    },
    scripts: {
      label: 'Scripts',
      group: 'Narrative',
      file: 'scripts',
      component: ScriptsPanel,
    },
  },
};
