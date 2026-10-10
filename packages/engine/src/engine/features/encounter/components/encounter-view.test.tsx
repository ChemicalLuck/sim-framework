import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it } from 'vitest';

import { SidebarComponentContext } from '@chemicalluck/sim-engine/components/sidebar/context';
import { configureAppearance } from '@chemicalluck/sim-engine/features/npcs/lib/appearance-config';

import { npcLeaveEncounter, setNpcAction, startEncounter } from '../slice';
import { createEncounterTestStore, makeTestNpc } from '../test-store';
import type { Encounter } from '../types';
import EncounterView from './encounter-view';

const encounter: Encounter = {
  kind: 'encounter',
  id: 'party',
  name: 'Party',
  initialStateId: 's',
  npcNeeds: { Energy: 40 },
  states: [
    {
      id: 's',
      name: 'S',
      text: 'With {npc0.firstName} and {npc1.firstName}.',
      actions: [
        { id: 'wave', text: 'Wave', bodyPart: 'hands' },
        { id: 'grab', text: 'Grab', bodyPart: 'hands', actor: 'npc' },
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

function renderParty() {
  const { store, dispatch } = createEncounterTestStore([
    makeTestNpc('Ann'),
    makeTestNpc('Bea'),
  ]);
  dispatch(startEncounter({ encounter, npcIds: ['Ann', 'Bea'] }));
  dispatch(setNpcAction({ bodyPart: 'hands', actionId: 'wave', npcId: 'Ann' }));
  dispatch(setNpcAction({ bodyPart: 'hands', actionId: 'grab', npcId: 'Bea' }));
  const result = render(<EncounterView />, {
    wrapper: ({ children }) => (
      <Provider store={store}>
        <SidebarComponentContext value={NoSidebar}>
          {children}
        </SidebarComponentContext>
      </Provider>
    ),
  });
  return { ...result, dispatch };
}

describe('EncounterView with several NPCs', () => {
  it('shows each NPC’s action labels and need bars', () => {
    const { getByText } = renderParty();
    expect(getByText('With Ann and Bea.')).toBeInTheDocument();
    expect(getByText('Ann').parentElement?.textContent).toBe('Ann: Wave');
    expect(getByText('Bea').parentElement?.textContent).toBe('Bea: Grab');
    expect(getByText("Ann's Energy")).toBeInTheDocument();
    expect(getByText("Bea's Energy")).toBeInTheDocument();
  });

  it('only offers the player actions it may take', () => {
    const { getAllByRole } = renderParty();
    const labels = getAllByRole('button').map((b) => b.textContent);
    expect(labels).toContain('Wave');
    expect(labels).not.toContain('Grab');
  });

  it('drops an NPC that left', () => {
    const { dispatch, queryByText, rerender } = renderParty();
    dispatch(npcLeaveEncounter('Ann'));
    rerender(<EncounterView />);
    expect(queryByText("Ann's Energy")).toBeNull();
    expect(queryByText("Bea's Energy")).toBeInTheDocument();
  });
});
