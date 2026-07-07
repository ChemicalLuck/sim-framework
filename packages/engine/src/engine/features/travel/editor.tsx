import { LocationsPanel } from './locations-panel';
import { WorldGraph } from './world-graph';

export default {
  panels: {
    world: { label: 'World', group: 'Core', component: WorldGraph },
    locations: {
      label: 'Locations',
      group: 'Core',
      file: 'locations',
      component: LocationsPanel,
    },
  },
};
