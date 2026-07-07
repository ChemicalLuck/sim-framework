import type { Mock } from 'vitest';
import { describe, expect, it, vi } from 'vitest';
import { useEditorData } from '@chemicalluck/sim-engine/editor/lib/use-editor-data';
import { mockEditorDataHandle, renderEditorPanel } from '@chemicalluck/sim-engine/test-utils/render';

import editor from './editor';

vi.mock('@chemicalluck/sim-engine/editor/lib/use-editor-data', () => ({
  useEditorData: vi.fn(),
  preloadEditorData: vi.fn(),
}));

const PlayerDefaultsPanel = editor.panels['player-defaults'].component;

describe('player editor panel', () => {
  it('registers as "Player Defaults" under the Core group', () => {
    expect(editor.panels['player-defaults'].label).toBe('Player Defaults');
    expect(editor.panels['player-defaults'].group).toBe('Core');
  });

  it('renders inputs seeded from the API for each player default', () => {
    (useEditorData as Mock).mockImplementation((url: string) => {
      if (url === '/editor/api/data/player')
        return mockEditorDataHandle({
          postCharacterCreationView: 'DefaultView',
          characterCreationSkillPoints: 5,
          startLocation: 'bedroom',
          bodyParts: ['hands', 'head'],
          initialItems: ['notebook'],
          initialEquipment: { hat: 'cap' },
        });
      if (url === '/editor/api/data/locations')
        return mockEditorDataHandle([
          { id: 'bedroom', name: 'Bedroom' },
          { id: 'kitchen', name: 'Kitchen' },
        ]);
      throw new Error(`Unexpected editor data url: ${url}`);
    });

    const { container, getByText, getByDisplayValue } = renderEditorPanel(
      <PlayerDefaultsPanel />,
    );

    expect(getByText('Player Defaults')).toBeInTheDocument();
    expect(getByDisplayValue('bedroom')).toBeInTheDocument();
    expect(getByDisplayValue('DefaultView')).toBeInTheDocument();

    const skillPoints = container.querySelector<HTMLInputElement>(
      'input[type="number"]',
    );
    if (!skillPoints) throw new Error('skill points input not found');
    expect(skillPoints.value).toBe('5');

    expect(getByText('hands')).toBeInTheDocument();
    expect(getByText('notebook')).toBeInTheDocument();
  });
});
