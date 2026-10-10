import { describe, expect, it } from 'vitest';

import type { RootState } from '@chemicalluck/sim-engine/state/store';

import { buildTemplateContext } from './context';
import {
  collectExtensionVars,
  extensionTemplateVarNames,
} from './extension-vars';
import { renderText } from './template';

const state = { present: { term: 'autumn' } } as unknown as RootState;

const providers = {
  university: (s: RootState) => ({
    term: (s.present as unknown as { term: string }).term,
    week: 3,
    examsSoon: true,
    holiday: false,
  }),
};

describe('collectExtensionVars', () => {
  it('namespaces each provider’s variables under its extension name', () => {
    expect(collectExtensionVars(providers, state)).toEqual({
      'university.term': 'autumn',
      'university.week': 3,
      'university.examsSoon': 'true',
      'university.holiday': '',
    });
  });

  it('returns nothing without providers', () => {
    expect(collectExtensionVars({}, state)).toEqual({});
  });
});

describe('extensionTemplateVarNames', () => {
  it('lists declared keys and the namespaces of undeclared extensions', () => {
    expect(
      extensionTemplateVarNames({
        university: { keys: ['term', 'week'] },
        club: {},
      }),
    ).toEqual({
      variables: ['university.term', 'university.week'],
      namespaces: ['club'],
    });
  });

  it('returns nothing without declarations', () => {
    expect(extensionTemplateVarNames({})).toEqual({
      variables: [],
      namespaces: [],
    });
  });
});

describe('extension variables in templates', () => {
  const ctx = buildTemplateContext({
    narrativeVars: collectExtensionVars(providers, state),
  });

  it('interpolates {var} in a location description', () => {
    expect(
      renderText(
        'The quad is busy in week {university.week} of {university.term} term.',
        ctx,
      ),
    ).toBe('The quad is busy in week 3 of autumn term.');
  });

  it("evaluates {if var == 'x'} in scene text", () => {
    expect(
      renderText(
        "{if university.term == 'autumn'}Leaves fall.{else}No leaves.{/if}",
        ctx,
      ),
    ).toBe('Leaves fall.');
    expect(
      renderText(
        "{if university.term != 'autumn'}Spring.{else}Autumn.{/if}",
        ctx,
      ),
    ).toBe('Autumn.');
  });

  it('treats true as set and false as unset', () => {
    expect(
      renderText(
        '{if university.examsSoon}Revise!{/if}{if university.holiday} Relax.{/if}',
        ctx,
      ),
    ).toBe('Revise!');
  });

  it('keeps a hyphenated extension name in the variable', () => {
    const hyphenCtx = buildTemplateContext({
      narrativeVars: collectExtensionVars(
        { 'my-ext': () => ({ term: 'autumn' }) },
        state,
      ),
    });
    expect(
      renderText("{my-ext.term}{if my-ext.term == 'autumn'}!{/if}", hyphenCtx),
    ).toBe('autumn!');
  });
});
