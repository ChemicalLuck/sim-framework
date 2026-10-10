import { configureStore } from '@reduxjs/toolkit';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { describe, expect, it, vi } from 'vitest';

import { renderText } from './lib/template';
import { useTemplateContext } from './use-template-context';

vi.mock('virtual:game-extensions', () => ({
  templateVarProviders: {
    university: (state: { present: { term: string } }) => ({
      term: state.present.term,
    }),
  },
}));

vi.mock('@chemicalluck/sim-engine/features/npcs/lib/appearance-config', () => ({
  resolvePronouns: () => ({}),
}));

vi.mock('./selectors', () => ({
  selectNarrativeVars: () => NARRATIVE_VARS,
}));

const NARRATIVE_VARS = { timeOfDay: 'morning' };

const state = {
  present: {
    term: 'spring',
    player: {
      profile: {
        firstName: 'Sam',
        lastName: 'Lee',
        profession: 'student',
        age: 20,
        appearance: {},
      },
      body: {},
    },
    linguistics: { wordChoices: {} },
    rng: { seed: 1 },
  },
};

describe('useTemplateContext', () => {
  it('exposes extension-provided template variables', () => {
    const store = configureStore({ reducer: () => state });
    const { result } = renderHook(() => useTemplateContext(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      ),
    });
    expect(
      renderText(
        "{if university.term == 'spring'}Blossom{/if} this {timeOfDay}, {university.term} term.",
        result.current,
      ),
    ).toBe('Blossom this morning, spring term.');
  });
});
