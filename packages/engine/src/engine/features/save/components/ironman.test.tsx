import { fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import BackButton from '@chemicalluck/sim-engine/components/sidebar/back';
import { NewGameButton } from '@chemicalluck/sim-engine/features/view/built-in/main-menu/new-game-button';
import { renderWithStore } from '@chemicalluck/sim-engine/test-utils/render';

import { configureRunOptions } from '../slice';
import SaveLoadDialog from './save-load-dialog';

function reducerFor(ironman: boolean) {
  const actions: { type: string; payload?: unknown }[] = [];
  const reducer = (
    state = {
      past: [{}],
      future: [],
      present: {
        save: { ironman },
        player: { profile: { firstName: 'Sam' } },
        time: { timestamp: 0 },
      },
    },
    action: { type: string; payload?: unknown },
  ) => {
    actions.push(action);
    return state;
  };
  return { reducer, actions };
}

describe('ironman and undo settings', () => {
  afterEach(() => {
    configureRunOptions({});
  });

  it('shows the Back button in a normal run', () => {
    renderWithStore(<BackButton />, { reducer: reducerFor(false).reducer });
    expect(screen.getByTitle(/Undo/)).toBeInTheDocument();
  });

  it('hides the Back button in an ironman run', () => {
    renderWithStore(<BackButton />, { reducer: reducerFor(true).reducer });
    expect(screen.queryByTitle(/Undo/)).not.toBeInTheDocument();
  });

  it('hides the Back button when the undo limit is 0', () => {
    configureRunOptions({ undoLimit: 0 });
    renderWithStore(<BackButton />, { reducer: reducerFor(false).reducer });
    expect(screen.queryByTitle(/Undo/)).not.toBeInTheDocument();
  });

  it('hides manual save/load in an ironman run', () => {
    renderWithStore(<SaveLoadDialog />, { reducer: reducerFor(true).reducer });
    expect(screen.queryByText('Save / Load')).not.toBeInTheDocument();
  });

  it('shows manual save/load in a normal run', () => {
    renderWithStore(<SaveLoadDialog />, { reducer: reducerFor(false).reducer });
    expect(screen.getByText('Save / Load')).toBeInTheDocument();
  });

  it('offers ironman at New Game when optional', () => {
    configureRunOptions({ ironman: 'optional' });
    const { reducer, actions } = reducerFor(false);
    renderWithStore(<NewGameButton />, { reducer });
    fireEvent.click(screen.getByLabelText(/Ironman/));
    fireEvent.click(screen.getByText('New Game'));
    expect(actions).toContainEqual(
      expect.objectContaining({
        type: 'save/startRun',
        payload: { ironman: true },
      }),
    );
  });

  it('does not offer ironman by default and starts a normal run', () => {
    const { reducer, actions } = reducerFor(false);
    renderWithStore(<NewGameButton />, { reducer });
    expect(screen.queryByLabelText(/Ironman/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('New Game'));
    expect(actions).toContainEqual(
      expect.objectContaining({
        type: 'save/startRun',
        payload: { ironman: false },
      }),
    );
  });

  it('always starts an ironman run when forced', () => {
    configureRunOptions({ ironman: 'always' });
    const { reducer, actions } = reducerFor(false);
    renderWithStore(<NewGameButton />, { reducer });
    fireEvent.click(screen.getByText('New Game'));
    expect(actions).toContainEqual(
      expect.objectContaining({
        type: 'save/startRun',
        payload: { ironman: true },
      }),
    );
  });
});
