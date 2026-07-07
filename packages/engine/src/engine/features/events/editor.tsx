import type { DataRequirement } from '@sim/engine/editor/lib/effect-editor';

import { EventsPanel } from './events-panel';

export default {
  panels: {
    events: {
      label: 'Events',
      group: 'Narrative',
      file: 'events',
      component: EventsPanel,
    },
  },
  editorDataRequirements: [{ key: 'events' }] as DataRequirement[],
};
