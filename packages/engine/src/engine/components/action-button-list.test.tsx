import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { parseCondition } from '@chemicalluck/sim-engine/lib/conditions';
import { renderWithStore } from '@chemicalluck/sim-engine/test-utils/render';
import type { Action } from '@chemicalluck/sim-engine/types';

import { ActionButtonList } from './action-button-list';

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
});
