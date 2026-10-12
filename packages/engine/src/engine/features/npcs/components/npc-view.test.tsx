import { screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  type RelationshipSectionProps,
  configureRelationshipDisplay,
} from '@chemicalluck/sim-engine/features/relationships/display';
import { renderWithStore } from '@chemicalluck/sim-engine/test-utils/render';

import NpcView from './npc-view';

vi.mock('@chemicalluck/sim-engine/components/with-sidebar', () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock('@chemicalluck/sim-engine/components/npc-meta', () => ({
  NpcMeta: () => null,
}));
vi.mock('@chemicalluck/sim-engine/components/action-button', () => ({
  ActionButton: ({ children }: { children: ReactNode }) => (
    <button>{children}</button>
  ),
}));
vi.mock('@chemicalluck/sim-engine/features/npcs/lib/appearance-config', () => ({
  getAppearanceLists: () => [],
}));
vi.mock('@chemicalluck/sim-engine/features/npcs/selectors', () => ({
  selectNpcById: () => () => ({
    id: 'sam',
    profile: { firstName: 'Sam', lastName: 'Lee', appearance: {} },
    traits: [],
  }),
}));
vi.mock('@chemicalluck/sim-engine/features/relationships/selectors', () => ({
  selectNpcKnown: () => () => true,
  selectNpcRelationship: () => () => ({
    relationship: { Friendship: 42, Romance: 17, Attraction: 63 },
  }),
}));

function renderView() {
  return renderWithStore(<NpcView npcId="sam" />, {
    reducer: () => ({ present: {} }),
  });
}

describe('NpcView relationship section', () => {
  afterEach(() => {
    configureRelationshipDisplay('values');
  });

  it('lists the relationship values by default', () => {
    renderView();
    expect(screen.getByText('Relationship')).toBeInTheDocument();
    expect(screen.getByText('Friendship')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('63')).toBeInTheDocument();
  });

  it('omits the section when the display is hidden', () => {
    configureRelationshipDisplay('hidden');
    renderView();
    expect(screen.queryByText('Relationship')).not.toBeInTheDocument();
    expect(screen.queryByText('Attraction')).not.toBeInTheDocument();
    expect(screen.queryByText('63')).not.toBeInTheDocument();
    expect(screen.getByText('Sam Lee')).toBeInTheDocument();
  });

  it('renders a game-supplied section in place of the values', () => {
    function Stage({ npcId }: RelationshipSectionProps) {
      return <p>Stage for {npcId}</p>;
    }
    configureRelationshipDisplay(Stage);
    renderView();
    expect(screen.getByText('Stage for sam')).toBeInTheDocument();
    expect(screen.queryByText('42')).not.toBeInTheDocument();
  });
});
