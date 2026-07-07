import { describe, expect, it } from 'vitest';

import { type TemplateLintContext, lintTemplate } from './lint';
import {
  baseTemplateVariableNames,
  entityAwareVariableNames,
} from './variables';

const ctx: TemplateLintContext = {
  variables: [...baseTemplateVariableNames(), 'hairColor', 'gender'],
  macros: [
    { name: 'stature', params: [] },
    { name: 'build', params: [] },
  ],
  terms: ['veryTall', 'short'],
};

const messages = (template: string) =>
  lintTemplate(template, ctx).map((i) => i.message);
const severities = (template: string) =>
  lintTemplate(template, ctx).map((i) => i.severity);

describe('lintTemplate', () => {
  it('accepts a valid template', () => {
    const t =
      'You are a {age}-year-old {noun}. You are {@stature} with {lower:hairColor} hair. {if height >= 180}Tall{elif weight >= 90}Big{else}{word:short}{/if}.';
    expect(lintTemplate(t, ctx)).toEqual([]);
  });

  it('warns on an unknown macro', () => {
    expect(messages('a {@nope} b')).toEqual(['Unknown macro "nope"']);
  });

  it('warns on an unknown term', () => {
    expect(messages('{word:bad}')).toEqual(['Unknown term "bad"']);
  });

  it('warns on an unknown variable (bare and modified)', () => {
    expect(messages('{foo}')).toEqual(['Unknown variable "foo"']);
    expect(messages('{lower:foo}')).toEqual(['Unknown variable "foo"']);
  });

  it('warns on an unknown modifier', () => {
    expect(messages('{upper:gender}')).toEqual(['Unknown modifier "upper"']);
  });

  it('flags an empty tag as an error', () => {
    expect(lintTemplate('a {} b', ctx)).toEqual([
      { from: 2, to: 4, severity: 'error', message: 'Empty {} tag' },
    ]);
  });

  it('flags an unterminated {if} as an error', () => {
    expect(severities('{if height >= 1}tall')).toEqual(['error']);
    expect(messages('{if height >= 1}tall')[0]).toContain('never closed');
  });

  it('flags stray block controls', () => {
    expect(messages('{/if}')).toEqual(["'{/if}' without '{if}'"]);
    expect(messages('{elif x}')).toEqual(["'{elif}' without '{if}'"]);
    expect(messages('{else}')).toEqual(["'{else}' without '{if}'"]);
  });

  it('reports an empty condition', () => {
    expect(messages('{if}{/if}')).toEqual(['Empty condition']);
  });

  it('warns about unknown variables used in conditions', () => {
    expect(messages('{if foo > 3}x{/if}')).toEqual([
      'Unknown variable "foo" in condition',
    ]);
  });

  it('reports the offset span of an issue', () => {
    const [issue] = lintTemplate('hi {@nope}', ctx);
    expect(template_slice('hi {@nope}', issue.from, issue.to)).toBe('{@nope}');
  });

  it('accepts the cap modifier and validates its variable', () => {
    expect(messages('{cap:gender}')).toEqual([]);
    expect(messages('{cap:nope}')).toEqual(['Unknown variable "nope"']);
  });
});

describe('lintTemplate with parametered macros', () => {
  const paramCtx: TemplateLintContext = {
    variables: [...baseTemplateVariableNames(), 'hairColor'],
    macros: [
      {
        name: 'build',
        params: [{ name: 'c', type: 'Character' }],
      },
      {
        name: 'compare',
        params: [
          { name: 'a', type: 'Character' },
          { name: 'b', type: 'Character' },
        ],
      },
      { name: 'crowd', params: [] },
    ],
    terms: [],
  };
  const paramMessages = (t: string) =>
    lintTemplate(t, paramCtx).map((i) => i.message);

  it('accepts a correct Character arg', () => {
    expect(paramMessages('{@build npc0}')).toEqual([]);
    expect(paramMessages('{@build player}')).toEqual([]);
    expect(paramMessages('{@compare npc0 npc1}')).toEqual([]);
  });

  it('warns on missing args', () => {
    expect(paramMessages('{@build}')).toEqual([
      'Macro "build" expects 1 argument, got 0',
    ]);
    expect(paramMessages('{@compare npc0}')).toEqual([
      'Macro "compare" expects 2 arguments, got 1',
    ]);
  });

  it('warns on an unknown Character arg', () => {
    expect(paramMessages('{@build mystery}')).toEqual([
      '"mystery" is not a known Character for macro "build"',
    ]);
  });

  it('accepts a transitive param as a Character arg via localParams', () => {
    const inMacroCtx: TemplateLintContext = {
      ...paramCtx,
      localParams: [{ name: 'x', type: 'Character' }],
    };
    expect(
      lintTemplate('{@build x}', inMacroCtx).map((i) => i.message),
    ).toEqual([]);
  });

  it('warns on a bare entity field inside a parametered macro body', () => {
    const inMacroCtx: TemplateLintContext = {
      ...paramCtx,
      localParams: [{ name: 'c', type: 'Character' }],
    };
    const messages = lintTemplate(
      '{if bodyFat >= 30}heavy{/if}',
      inMacroCtx,
    ).map((i) => i.message);
    expect(messages.some((m) => m.includes('Bare "bodyFat"'))).toBe(true);
  });

  it('does not warn on bare pronoun inside a parametered macro body', () => {
    const inMacroCtx: TemplateLintContext = {
      ...paramCtx,
      localParams: [{ name: 'c', type: 'Character' }],
    };
    expect(
      lintTemplate('{cap:subject} waved.', inMacroCtx).map((i) => i.message),
    ).toEqual([]);
  });

  it('accepts dotted local-param access', () => {
    const inMacroCtx: TemplateLintContext = {
      ...paramCtx,
      localParams: [{ name: 'c', type: 'Character' }],
    };
    expect(
      lintTemplate('{if c.bodyFat >= 30}heavy{/if}', inMacroCtx).map(
        (i) => i.message,
      ),
    ).toEqual([]);
  });

  it('accepts an appearance feature as a dotted character field', () => {
    const inMacroCtx: TemplateLintContext = {
      ...paramCtx,
      appearanceFeatures: ['jawShape'],
      localParams: [{ name: 'c', type: 'Character' }],
    };
    expect(
      lintTemplate('{lower:c.jawShape}', inMacroCtx).map((i) => i.message),
    ).toEqual([]);
    // Unknown appearance feature still warns.
    expect(
      lintTemplate('{lower:c.noSuchFeature}', inMacroCtx).map((i) => i.message),
    ).toEqual(['Unknown variable "c.noSuchFeature"']);
  });
});

describe('lintTemplate with entity-aware variables', () => {
  const entityCtx: TemplateLintContext = {
    variables: entityAwareVariableNames(['hairColor']),
    macros: [],
    terms: [],
  };
  const entityMessages = (t: string) =>
    lintTemplate(t, entityCtx).map((i) => i.message);

  it('accepts dotted entity tokens', () => {
    expect(
      entityMessages('{npc0.firstName} has {lower:npc0.hairColor} hair.'),
    ).toEqual([]);
    expect(
      entityMessages('{cap:npc0.subject} waved at {player.firstName}.'),
    ).toEqual([]);
    expect(entityMessages('{if npc0.age >= 30}older{/if}')).toEqual([]);
  });

  it('warns on an unknown entity field', () => {
    expect(entityMessages('{npc0.nope}')).toEqual([
      'Unknown variable "npc0.nope"',
    ]);
  });
});

function template_slice(t: string, from: number, to: number): string {
  return t.slice(from, to);
}
