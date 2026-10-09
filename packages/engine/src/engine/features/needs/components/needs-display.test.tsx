import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { renderWithStore } from '@chemicalluck/sim-engine/test-utils/render';

import { configureNeeds } from '../slice';
import NeedsDisplay from './needs-display';

const reducer =
  (needs: Record<string, number>) =>
  (state = { present: { needs } }) =>
    state;

describe('NeedsDisplay', () => {
  afterEach(() => {
    configureNeeds({ needs: {}, decayRates: {} });
  });

  it('hides a hideAtZero need while it is 0', () => {
    configureNeeds({
      needs: { Energy: 100, Drunk: 0 },
      decayRates: {},
      options: { Drunk: { hideAtZero: true, direction: 'inverse' } },
    });
    renderWithStore(<NeedsDisplay />, {
      reducer: reducer({ Energy: 100, Drunk: 0 }),
    });
    expect(screen.getByText('Energy')).toBeInTheDocument();
    expect(screen.queryByText('Drunk')).not.toBeInTheDocument();
  });

  it('shows a hideAtZero need once it is above 0', () => {
    configureNeeds({
      needs: { Drunk: 0 },
      decayRates: {},
      options: { Drunk: { hideAtZero: true } },
    });
    renderWithStore(<NeedsDisplay />, { reducer: reducer({ Drunk: 20 }) });
    expect(screen.getByText('Drunk')).toBeInTheDocument();
  });

  it('colours an inverse need as bad when high', () => {
    configureNeeds({
      needs: { Drunk: 0 },
      decayRates: {},
      options: { Drunk: { direction: 'inverse' } },
    });
    const { container } = renderWithStore(<NeedsDisplay />, {
      reducer: reducer({ Drunk: 90 }),
    });
    expect(container.innerHTML).toContain('bg-destructive');
  });
});
