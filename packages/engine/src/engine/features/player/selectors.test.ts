import { describe, expect, it, vi } from 'vitest';

import type { RootState } from '@chemicalluck/sim-engine/state/store';

import { selectPlayerDescription } from './selectors';

vi.mock('virtual:game-extensions', () => ({
  templateVarProviders: {
    university: (state: { present: { term: string } }) => ({
      term: state.present.term,
      examsSoon: false,
    }),
  },
}));

vi.mock('../linguistics/selectors', () => ({
  selectNarrativeVars: () => ({ timeOfDay: 'morning' }),
}));

// Echo the template variables the description is rendered with.
vi.mock('../npcs/lib/appearance-config', () => ({
  describeAppearance: (_profile: unknown, opts: { vars: unknown }) => opts.vars,
}));

const state = {
  present: {
    term: 'spring',
    player: { profile: { firstName: 'Sam' }, body: {} },
    linguistics: { wordChoices: {} },
    rng: { seed: 1 },
  },
} as unknown as RootState;

describe('selectPlayerDescription', () => {
  it('renders with narrative and extension template variables', () => {
    expect(selectPlayerDescription(state)).toEqual({
      timeOfDay: 'morning',
      'university.term': 'spring',
      'university.examsSoon': '',
    });
  });
});
