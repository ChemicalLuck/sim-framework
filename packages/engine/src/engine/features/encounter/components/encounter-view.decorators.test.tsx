import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { actionDecorators } from 'virtual:game-extensions';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { SidebarComponentContext } from '@chemicalluck/sim-engine/components/sidebar/context';
import { configureAppearance } from '@chemicalluck/sim-engine/features/npcs/lib/appearance-config';
import type { ActionDecorator } from '@chemicalluck/sim-engine/features/view/lib/action-decorators';

import { startEncounter } from '../slice';
import { createEncounterTestStore, makeTestNpc } from '../test-store';
import type { Encounter } from '../types';
import EncounterView from './encounter-view';

// Registered on the real (fixture-empty) list: mocking the virtual module
// would load it circularly through the views it imports.
const markWave: ActionDecorator = (a) =>
  'id' in a && a.id === 'wave' ? { prefix: '⚠ ', className: 'risky' } : null;

beforeAll(() => {
  actionDecorators.push(markWave);
});

afterAll(() => {
  actionDecorators.splice(actionDecorators.indexOf(markWave), 1);
});

const encounter: Encounter = {
  kind: 'encounter',
  id: 'meet',
  name: 'Meet',
  initialStateId: 's',
  states: [
    {
      id: 's',
      name: 'S',
      text: 'Hello.',
      actions: [
        { id: 'wave', text: 'Wave', bodyPart: 'hands' },
        { id: 'nod', text: 'Nod', bodyPart: 'head' },
      ],
    },
  ],
};

function NoSidebar() {
  return null;
}

beforeEach(() => {
  configureAppearance({
    features: [],
    ageDistribution: { min: 18, max: 80, mean: 30, stdDev: 10 },
    bodyAttributes: [],
    display: { strangerFeatureIds: [], metaFeatureIds: [] },
  });
});

describe('EncounterView action decorators', () => {
  it('decorates the player action toggles', () => {
    const { store, dispatch } = createEncounterTestStore([makeTestNpc('Ann')]);
    dispatch(startEncounter({ encounter, npcIds: ['Ann'] }));
    const { getByRole } = render(<EncounterView />, {
      wrapper: ({ children }) => (
        <Provider store={store}>
          <SidebarComponentContext value={NoSidebar}>
            {children}
          </SidebarComponentContext>
        </Provider>
      ),
    });
    const wave = getByRole('button', { name: /Wave/ });
    expect(wave).toHaveTextContent('⚠ Wave');
    expect(wave).toHaveClass('risky');
    const nod = getByRole('button', { name: /Nod/ });
    expect(nod).toHaveTextContent(/^Nod$/);
    expect(nod).not.toHaveClass('risky');
  });
});
