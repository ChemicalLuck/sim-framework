import { describe, expect, it } from 'vitest';

import type { LinguisticsMacroParam, LinguisticsTerm } from '../types';
import {
  type CompiledMacro,
  type TemplateContext,
  parseTemplate,
  renderSentences,
  renderTemplate,
  renderText,
} from './template';

interface CtxOverrides {
  vars?: Record<string, string | number>;
  wordChoices?: Record<string, string>;
  seed?: string | number;
  macros?: ReadonlyMap<string, CompiledMacro>;
  terms?: ReadonlyMap<string, LinguisticsTerm>;
  strict?: boolean;
}

const PRONOUNS = {
  subject: 'she',
  object: 'her',
  possessive: 'her',
  reflexive: 'herself',
  noun: 'woman',
};

function ctx(over: CtxOverrides = {}): TemplateContext {
  return {
    vars: { ...PRONOUNS, ...over.vars },
    wordChoices: over.wordChoices ?? {},
    seed: over.seed ?? 'seed-1',
    macros: over.macros ?? new Map<string, CompiledMacro>(),
    terms: over.terms ?? new Map<string, LinguisticsTerm>(),
    strict: over.strict ?? true,
  };
}

type MacroDef = string | { template: string; params?: LinguisticsMacroParam[] };

const macros = (defs: Record<string, MacroDef>) =>
  new Map(
    Object.entries(defs).map(([name, def]) => {
      const { template, params } =
        typeof def === 'string' ? { template: def, params: [] } : def;
      return [name, { params: params ?? [], body: parseTemplate(template) }];
    }),
  );

const terms = (defs: Record<string, string[]>) =>
  new Map<string, LinguisticsTerm>(
    Object.entries(defs).map(([key, options]) => [
      key,
      { key, label: key, options },
    ]),
  );

describe('substitution + conditionals', () => {
  it('substitutes vars, pronouns and modifiers', () => {
    const c = ctx({ vars: { age: 20, gender: 'Female' } });
    expect(renderTemplate('Age {age}, {lower:gender} {noun}.', c)).toBe(
      'Age 20, female woman.',
    );
  });

  it('drops a template referencing a missing var', () => {
    expect(
      renderTemplate('You have {lower:hairColor} hair.', ctx()),
    ).toBeNull();
  });

  it('selects numeric if/elif/else branches', () => {
    const t =
      'You are {if height >= 180}tall{elif height >= 165}average{else}short{/if}.';
    expect(renderTemplate(t, ctx({ vars: { height: 190 } }))).toBe(
      'You are tall.',
    );
    expect(renderTemplate(t, ctx({ vars: { height: 170 } }))).toBe(
      'You are average.',
    );
    expect(renderTemplate(t, ctx({ vars: { height: 150 } }))).toBe(
      'You are short.',
    );
  });

  it('falls to else when a variable is absent', () => {
    expect(
      renderTemplate('{if height >= 165}tall{else}short{/if}', ctx()),
    ).toBe('short');
  });
});

describe('global variables', () => {
  it('reads narrative vars like totalNearbyNpcs and timeOfDay', () => {
    const t =
      'The place is {if totalNearbyNpcs == 0}deserted{elif totalNearbyNpcs < 5}quiet{else}busy{/if} this {timeOfDay}.';
    expect(
      renderTemplate(
        t,
        ctx({ vars: { totalNearbyNpcs: 0, timeOfDay: 'morning' } }),
      ),
    ).toBe('The place is deserted this morning.');
    expect(
      renderTemplate(
        t,
        ctx({ vars: { totalNearbyNpcs: 9, timeOfDay: 'evening' } }),
      ),
    ).toBe('The place is busy this evening.');
  });
});

describe('macros', () => {
  it('expands a named macro', () => {
    const c = ctx({
      vars: { height: 190 },
      macros: macros({
        stature: '{if height >= 185}very tall{else}short{/if}',
      }),
    });
    expect(renderTemplate('You are {@stature}.', c)).toBe('You are very tall.');
  });

  it('expands nested macros', () => {
    const c = ctx({
      vars: { height: 190, weight: 100 },
      macros: macros({
        size: '{@stature} and {@heft}',
        stature: '{if height >= 185}tall{else}short{/if}',
        heft: '{if weight >= 90}heavy{else}light{/if}',
      }),
    });
    expect(renderTemplate('{@size}.', c)).toBe('tall and heavy.');
  });

  it('treats unknown macros as empty', () => {
    expect(renderTemplate('a{@nope}b', ctx())).toBe('ab');
  });

  it('breaks macro cycles', () => {
    const c = ctx({ macros: macros({ a: 'x{@b}', b: 'y{@a}' }) });
    expect(renderTemplate('{@a}', c)).toBe('xy');
  });

  it('passes a Character arg through as a namespace prefix', () => {
    const c = ctx({
      vars: {
        'player.firstName': 'You',
        'player.bodyFat': 25,
        'npc0.firstName': 'Alex',
        'npc0.bodyFat': 10,
      },
      macros: macros({
        build: {
          params: [{ name: 'c', type: 'Character' }],
          template: '{if c.bodyFat >= 20}heavy{else}lean{/if}',
        },
      }),
    });
    expect(renderTemplate('{@build player}', c)).toBe('heavy');
    expect(renderTemplate('{@build npc0}', c)).toBe('lean');
  });

  it('expands a two-arg macro positionally', () => {
    const c = ctx({
      vars: {
        'npc0.firstName': 'Alex',
        'npc0.height': 190,
        'npc1.firstName': 'Sam',
        'npc1.height': 170,
      },
      macros: macros({
        pair: {
          params: [
            { name: 'a', type: 'Character' },
            { name: 'b', type: 'Character' },
          ],
          template: '{a.firstName}/{a.height} & {b.firstName}/{b.height}',
        },
      }),
    });
    expect(renderTemplate('{@pair npc0 npc1}', c)).toBe('Alex/190 & Sam/170');
    expect(renderTemplate('{@pair npc1 npc0}', c)).toBe('Sam/170 & Alex/190');
  });

  it('forwards an outer parameter into a nested macro call', () => {
    const c = ctx({
      vars: { 'npc0.firstName': 'Alex', 'npc0.bodyFat': 10 },
      macros: macros({
        outer: {
          params: [{ name: 'x', type: 'Character' }],
          template: '{x.firstName} is {@inner x}',
        },
        inner: {
          params: [{ name: 'c', type: 'Character' }],
          template: '{if c.bodyFat >= 20}heavy{else}lean{/if}',
        },
      }),
    });
    expect(renderTemplate('{@outer npc0}', c)).toBe('Alex is lean');
  });

  it('drops the sentence when a parametered macro is called bare in strict mode', () => {
    const c = ctx({
      macros: macros({
        build: {
          params: [{ name: 'c', type: 'Character' }],
          template: '{if c.bodyFat >= 20}heavy{else}lean{/if}',
        },
      }),
    });
    expect(renderTemplate('a {@build} b', c)).toBeNull();
  });

  it('drops the sentence when a Character arg is not a known prefix', () => {
    const c = ctx({
      vars: { 'npc0.firstName': 'Alex', 'npc0.bodyFat': 10 },
      macros: macros({
        build: {
          params: [{ name: 'c', type: 'Character' }],
          template: '{if c.bodyFat >= 20}heavy{else}lean{/if}',
        },
      }),
    });
    expect(renderTemplate('a {@build mystery} b', c)).toBeNull();
  });

  it('does not falsely flag a cycle when the same macro is called with different args', () => {
    const c = ctx({
      vars: {
        'npc0.firstName': 'A',
        'npc0.height': 190,
        'npc1.firstName': 'B',
        'npc1.height': 160,
      },
      macros: macros({
        tall: {
          params: [{ name: 'c', type: 'Character' }],
          template: '{if c.height >= 180}tall{else}short{/if}',
        },
      }),
    });
    expect(renderTemplate('{@tall npc0} and {@tall npc1}', c)).toBe(
      'tall and short',
    );
  });
});

describe('word terms', () => {
  it('uses the default (first) option when there is no override', () => {
    const c = ctx({ terms: terms({ tall: ['tall'] }) });
    expect(renderTemplate('{word:tall}', c)).toBe('tall');
  });

  it('unknown term renders empty', () => {
    expect(renderTemplate('a{word:nope}b', ctx())).toBe('ab');
  });

  it('picks deterministically from a pool for a given seed', () => {
    const c = ctx({ terms: terms({ tall: ['tall', 'giant', 'towering'] }) });
    const a = renderTemplate('{word:tall}', c);
    const b = renderTemplate('{word:tall}', c);
    expect(a).toBe(b); // stable for the same seed
    expect(['tall', 'giant', 'towering']).toContain(a);
  });

  it('honours a comma-separated override and weights duplicates', () => {
    // All-duplicates override always yields that word regardless of seed.
    const make = (seed: string) =>
      renderTemplate(
        '{word:tall}',
        ctx({ seed, wordChoices: { tall: 'giant, giant, giant' } }),
      );
    expect(make('a')).toBe('giant');
    expect(make('b')).toBe('giant');
    expect(make('c')).toBe('giant');
  });

  it('different seeds can produce different picks', () => {
    const pool = { tall: ['tall', 'giant', 'towering', 'huge', 'tiny'] };
    const picks = new Set(
      ['s1', 's2', 's3', 's4', 's5', 's6'].map((seed) =>
        renderTemplate('{word:tall}', ctx({ seed, terms: terms(pool) })),
      ),
    );
    expect(picks.size).toBeGreaterThan(1);
  });
});

describe('entities, cap modifier, and lenient text', () => {
  it('resolves dotted entity variables', () => {
    const c = ctx({ vars: { 'npc0.firstName': 'Alex', 'npc0.subject': 'he' } });
    expect(renderText('{npc0.firstName} waved.', c)).toBe('Alex waved.');
    expect(renderText('{cap:npc0.subject} waved.', c)).toBe('He waved.');
  });

  it('capitalises the first letter with {cap:}', () => {
    expect(renderText('{cap:subject} left.', ctx())).toBe('She left.');
  });

  it('keeps the literal token for an unresolved var in lenient text', () => {
    expect(renderText('Hi {npc0.firstName}!', ctx())).toBe(
      'Hi {npc0.firstName}!',
    );
  });

  it('preserves inline whitespace within a line (no collapsing)', () => {
    expect(renderText('a   b', ctx())).toBe('a   b');
  });

  it('turns newlines between words into a single space', () => {
    const t = `{cap:subject} looks
      calm and
      collected today.`;
    expect(renderText(t, ctx())).toBe('She looks calm and collected today.');
  });

  it('strips structural whitespace around macro branches', () => {
    const c = ctx({
      vars: { height: 190 },
      macros: macros({
        stature: `{if height >= 185}
          very tall
        {else}
          short
        {/if}`,
      }),
    });
    expect(renderText('You are {@stature}.', c)).toBe('You are very tall.');
  });

  it('evaluates conditionals over dotted entity vars', () => {
    const t = '{if npc0.age >= 30}older{else}young{/if}';
    expect(renderText(t, ctx({ vars: { 'npc0.age': 40 } }))).toBe('older');
    expect(renderText(t, ctx({ vars: { 'npc0.age': 20 } }))).toBe('young');
  });
});

describe('renderSentences', () => {
  it('joins surviving sentences and drops incomplete ones', () => {
    const c = ctx({ vars: { age: 20 } });
    expect(
      renderSentences(['Age {age}.', 'Hair {lower:hairColor}.', 'Done.'], c),
    ).toBe('Age 20. Done.');
  });
});
