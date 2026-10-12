import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { parseCondition } from '@chemicalluck/sim-engine/lib/conditions';
import { renderWithStore } from '@chemicalluck/sim-engine/test-utils/render';
import type { Action } from '@chemicalluck/sim-engine/types';

import { ActionButtonList } from './action-button-list';

// A game decorator marking "Leap" as risky while money is low.
vi.mock('virtual:game-extensions', () => ({
  actionDecorators: [
    (a: Action, state: { present: { money: number } }) =>
      a.text === 'Leap' && state.present.money < 100
        ? { prefix: '⚠ ', suffix: ' (risky)', className: 'risky' }
        : null,
  ],
}));

const reducer = (state = { present: { money: 10 } }) => state;

const action = (
  text: string,
  condition?: string,
  lockedText?: string,
): Action => ({
  kind: 'action',
  text,
  ...(condition ? { condition: parseCondition(condition) } : {}),
  ...(lockedText ? { lockedText } : {}),
});

describe('ActionButtonList', () => {
  it('hides actions whose condition is not met', () => {
    renderWithStore(
      <ActionButtonList
        actions={[
          action('Free'),
          action('Rich', 'money >= 1000000'),
          action('Cheap', 'money >= 5'),
        ]}
      />,
      { reducer },
    );
    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.getByText('Cheap')).toBeInTheDocument();
    expect(screen.queryByText('Rich')).not.toBeInTheDocument();
  });

  it('shows locked actions disabled with their requirement when lockedText is set', () => {
    renderWithStore(
      <ActionButtonList
        actions={[action('Rich', 'money >= 1000000', 'Requires £1m')]}
      />,
      { reducer },
    );
    const button = screen.getByRole('button', { name: /Rich/ });
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Requires £1m');
  });

  it('renders nothing when every action is hidden', () => {
    const { container } = renderWithStore(
      <ActionButtonList actions={[action('Rich', 'money >= 1000000')]} />,
      { reducer },
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders decorator prefixes, suffixes and classes from state', () => {
    renderWithStore(
      <ActionButtonList actions={[action('Leap'), action('Walk')]} />,
      { reducer },
    );
    const leap = screen.getByRole('button', { name: /Leap/ });
    expect(leap).toHaveTextContent('⚠ Leap (risky)');
    expect(leap).toHaveClass('risky');
    const walk = screen.getByRole('button', { name: /Walk/ });
    expect(walk).not.toHaveTextContent('⚠');
    expect(walk).not.toHaveTextContent('(risky)');
    expect(walk).not.toHaveClass('risky');
  });

  it('leaves actions undecorated when the decorator returns null', () => {
    renderWithStore(<ActionButtonList actions={[action('Leap')]} />, {
      reducer: (state = { present: { money: 500 } }) => state,
    });
    const leap = screen.getByRole('button', { name: /Leap/ });
    expect(leap).not.toHaveTextContent('⚠');
    expect(leap).not.toHaveClass('risky');
  });

  it('decorates locked actions too', () => {
    renderWithStore(
      <ActionButtonList
        actions={[action('Leap', 'money >= 1000000', 'Requires £1m')]}
      />,
      { reducer },
    );
    const button = screen.getByRole('button', { name: /Leap/ });
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('⚠ Leap (risky)');
  });
});
