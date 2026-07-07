import { combineReducers } from '@reduxjs/toolkit';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { configureAppearance } from '@chemicalluck/sim-engine/features/npcs/lib/appearance-config';
import { configureWearables } from '@chemicalluck/sim-engine/features/outfits/lib/wearable-config';
import { renderWithStore } from '@chemicalluck/sim-engine/test-utils/render';

import { setPostCharacterCreationView } from '../lib/character-customisation';
import { configureSkills } from '../lib/skills';
import playerReducer, { configurePlayer } from '../slice';
import { CharacterCustomisationView } from './character-customisation';

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));

const reducer = combineReducers({
  present: combineReducers({ player: playerReducer }),
});

beforeEach(() => {
  configurePlayer({});
  configureSkills([]);
  setPostCharacterCreationView('DefaultView');
  configureAppearance({
    features: [],
    ageDistribution: { min: 18, max: 80, mean: 20, stdDev: 12 },
    bodyAttributes: [
      {
        id: 'height',
        label: 'Height',
        unit: 'cm',
        default: 170,
        distribution: { default: { min: 120, max: 220, mean: 170, stdDev: 8 } },
      },
      {
        id: 'weight',
        label: 'Weight',
        unit: 'kg',
        default: 70,
        distribution: { default: { min: 30, max: 200, mean: 70, stdDev: 14 } },
      },
      {
        id: 'bodyFat',
        label: 'Body Fat',
        unit: '%',
        default: 20,
        distribution: { default: { min: 3, max: 60, mean: 20, stdDev: 7 } },
      },
      {
        id: 'bustDifference',
        label: 'Bust − Underbust',
        unit: 'in',
        default: 2,
        distribution: { default: { min: 0, max: 20, mean: 4, stdDev: 2 } },
      },
    ],
    display: { strangerFeatureIds: [], metaFeatureIds: [] },
  });
  configureWearables({
    slots: [],
    categories: [],
    slotCategoryMap: {},
    styles: [],
    appearanceKeys: [],
    primaryBodyAttributes: ['height', 'weight', 'bodyFat', 'bustDifference'],
    estimatedMetrics: {
      underbust: { default: { intercept: 60, terms: { weight: 0.2 } } },
    },
    sizeSystems: {
      bra: {
        labelFormat: '{band}{cup}',
        dimensions: [
          {
            name: 'band',
            metric: 'underbust',
            sizes: [
              { label: '32', max: 75 },
              { label: '34', max: 80 },
              { label: '36', max: 999 },
            ],
          },
          {
            name: 'cup',
            metric: 'bustDifference',
            sizes: [
              { label: 'A', max: 13 },
              { label: 'B', max: 15 },
              { label: 'C', max: 999 },
            ],
          },
        ],
      },
    },
  });
});

describe('CharacterCustomisationView body', () => {
  it('renders body controls including a Cup selector', () => {
    renderWithStore(<CharacterCustomisationView />, { reducer });
    expect(screen.getByLabelText('Height (cm)')).toBeInTheDocument();
    expect(screen.getByLabelText('Weight (kg)')).toBeInTheDocument();
    expect(screen.getByLabelText('Body Fat (%)')).toBeInTheDocument();
    expect(screen.getByText('Cup')).toBeInTheDocument();
    // Bra appears in the live estimated-size preview.
    expect(screen.getByText(/Bra/)).toBeInTheDocument();
  });

  it('persists edited body attributes into player.body on submit', async () => {
    const { store } = renderWithStore(<CharacterCustomisationView />, {
      reducer,
    });

    fireEvent.change(screen.getByLabelText('Weight (kg)'), {
      target: { value: '90' },
    });
    fireEvent.change(screen.getByLabelText('Height (cm)'), {
      target: { value: '180' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save Character' }));

    await waitFor(() => {
      const body = (
        store.getState() as {
          present: { player: { body: Record<string, number> } };
        }
      ).present.player.body;
      expect(body.weight).toBe(90);
      expect(body.height).toBe(180);
    });
  });
});
