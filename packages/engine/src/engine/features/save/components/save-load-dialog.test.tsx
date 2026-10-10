import { fireEvent, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { renderWithStore } from '@chemicalluck/sim-engine/test-utils/render';

import { createAutosave, saveGame } from '../saves';
import SaveLoadDialog from './save-load-dialog';

const reducer = (
  state = {
    past: [],
    future: [],
    present: {
      save: { ironman: false },
      player: { profile: { firstName: 'Sam' } },
      time: { timestamp: 0 },
    },
  },
) => state;

describe('save/load dialog autosaves', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('persist:root', '{}');
  });

  it('lists autosaves separately from manual saves', () => {
    renderWithStore(<SaveLoadDialog />, { reducer });
    // Made after mount: the list refreshes when the dialog opens.
    saveGame('My manual save', 'Sam', '6:00 AM');
    createAutosave({
      label: 'Woke up',
      rotate: 3,
      characterName: 'Sam',
      inGameTime: '7:00 AM',
    });
    createAutosave({
      label: 'Chapter 1',
      keep: true,
      rotate: 3,
      characterName: 'Sam',
      inGameTime: '8:00 AM',
    });
    fireEvent.click(screen.getByText('Save / Load'));

    const autos = screen.getByRole('region', { name: 'Autosaves' });
    expect(within(autos).getByText(/Woke up/)).toBeInTheDocument();
    expect(within(autos).getByText(/Chapter 1/)).toBeInTheDocument();
    expect(within(autos).getByText(/Checkpoint/)).toBeInTheDocument();
    expect(within(autos).queryByText(/6:00 AM/)).not.toBeInTheDocument();

    const manual = screen.getByRole('region', { name: 'Load Save' });
    expect(within(manual).getByText(/6:00 AM/)).toBeInTheDocument();
    expect(within(manual).queryByText(/Woke up/)).not.toBeInTheDocument();
  });

  it('shows no autosave section when there are none', () => {
    renderWithStore(<SaveLoadDialog />, { reducer });
    fireEvent.click(screen.getByText('Save / Load'));
    expect(
      screen.queryByRole('region', { name: 'Autosaves' }),
    ).not.toBeInTheDocument();
  });
});
