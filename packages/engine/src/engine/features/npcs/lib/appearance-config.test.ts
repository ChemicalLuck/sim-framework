import { beforeEach, describe, expect, it } from 'vitest';
import { configureLinguistics } from '@chemicalluck/engine/features/linguistics/lib/config';
import { Mulberry32 } from '@chemicalluck/engine/features/rng/lib/rng';
import type { BodyAttributes, CharacterProfile } from '@chemicalluck/engine/types';

import {
  type AppearanceJsonData,
  configureAppearance,
  describeAppearance,
  getBodyAttributes,
  isBodyAttributeVisible,
  resolvePronouns,
  sampleBody,
} from './appearance-config';

const SENTENCES = [
  'You are a {age}-year-old {ethnicity} {noun}.',
  'You have {lower:hairStyle} {lower:hairColor} hair and {lower:eyeShape} {lower:eyeColor} eyes.',
  'You have {a:browShape} brow, {a:jawShape} jaw, {a:noseShape} nose and {lower:mouthShape} lips.',
];

const omit = (
  source: Record<string, string>,
  key: string,
): Record<string, string> =>
  Object.fromEntries(Object.entries(source).filter(([k]) => k !== key));

const data = (sentences: string[] = SENTENCES): AppearanceJsonData => ({
  features: [
    {
      id: 'gender',
      label: 'Gender',
      values: ['Male', 'Female'],
      isDimension: true,
      weights: { default: { Male: 1, Female: 1 } },
      pronouns: {
        Male: {
          subject: 'he',
          object: 'him',
          possessive: 'his',
          reflexive: 'himself',
          noun: 'man',
        },
        Female: {
          subject: 'she',
          object: 'her',
          possessive: 'her',
          reflexive: 'herself',
          noun: 'woman',
        },
      },
    },
    {
      id: 'ethnicity',
      label: 'Ethnicity',
      values: ['White', 'Asian'],
      isDimension: true,
      weights: { default: { White: 1, Asian: 1 } },
    },
    {
      id: 'hairStyle',
      label: 'Hair Style',
      values: ['Long Wavy'],
      weights: {},
    },
    { id: 'hairColor', label: 'Hair Color', values: ['Black'], weights: {} },
    { id: 'eyeShape', label: 'Eye Shape', values: ['Almond'], weights: {} },
    { id: 'eyeColor', label: 'Eye Color', values: ['Green'], weights: {} },
    { id: 'browShape', label: 'Brow', values: ['Soft Arch'], weights: {} },
    { id: 'jawShape', label: 'Jaw', values: ['Angular'], weights: {} },
    { id: 'noseShape', label: 'Nose', values: ['Button'], weights: {} },
    { id: 'mouthShape', label: 'Mouth', values: ['Full'], weights: {} },
  ],
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
      showWhen: { featureId: 'gender', values: ['Female'] },
      distribution: { default: { min: 0, max: 20, mean: 4, stdDev: 2 } },
    },
  ],
  display: { strangerFeatureIds: ['ethnicity'], metaFeatureIds: [] },
  description: { sentences },
});

const fullAppearance: Record<string, string> = {
  gender: 'Female',
  ethnicity: 'White',
  hairStyle: 'Long Wavy',
  hairColor: 'Black',
  eyeShape: 'Almond',
  eyeColor: 'Green',
  browShape: 'Soft Arch',
  jawShape: 'Angular',
  noseShape: 'Button',
  mouthShape: 'Full',
};

const profile = (
  appearance: Record<string, string> = fullAppearance,
): CharacterProfile => ({
  firstName: 'A',
  lastName: 'B',
  profession: 'Student',
  age: 20,
  appearance,
});

const body = (over: Partial<BodyAttributes> = {}): BodyAttributes => ({
  height: 170,
  weight: 70,
  bodyFat: 20,
  bustDifference: 2,
  ...over,
});

beforeEach(() => {
  configureAppearance(data());
});

describe('describeAppearance', () => {
  it('renders the full prose description with lowercasing and articles', () => {
    expect(describeAppearance(profile())).toBe(
      'You are a 20-year-old White woman. ' +
        'You have long wavy black hair and almond green eyes. ' +
        'You have a soft arch brow, an angular jaw, a button nose and full lips.',
    );
  });

  it('drops a sentence whose feature has no value', () => {
    expect(describeAppearance(profile(omit(fullAppearance, 'hairColor')))).toBe(
      'You are a 20-year-old White woman. ' +
        'You have a soft arch brow, an angular jaw, a button nose and full lips.',
    );
  });

  it('resolves pronouns from the gendered feature', () => {
    const male = describeAppearance(
      profile({ ...fullAppearance, gender: 'Male' }),
    );
    expect(male).toContain('White man');
  });

  it('falls back to neutral noun when gender is unset', () => {
    expect(
      describeAppearance(profile(omit(fullAppearance, 'gender'))),
    ).toContain('White person');
  });

  it('returns an empty string when no templates are configured', () => {
    configureAppearance(data([]));
    expect(describeAppearance(profile())).toBe('');
  });
});

describe('describeAppearance conditionals', () => {
  it('selects an if/elif/else branch by numeric comparison', () => {
    configureAppearance(
      data([
        'You are {if height >= 180}tall{elif height >= 165}average{else}short{/if}.',
      ]),
    );
    expect(describeAppearance(profile(), { body: body({ height: 190 }) })).toBe(
      'You are tall.',
    );
    expect(describeAppearance(profile(), { body: body({ height: 170 }) })).toBe(
      'You are average.',
    );
    expect(describeAppearance(profile(), { body: body({ height: 150 }) })).toBe(
      'You are short.',
    );
  });

  it('falls to else when the body (and thus the variable) is absent', () => {
    configureAppearance(
      data(['You are {if height >= 165}tall{else}short{/if}.']),
    );
    expect(describeAppearance(profile())).toBe('You are short.');
  });

  it('supports bare existence tests and drops empty sentences', () => {
    configureAppearance(
      data(['{if hairColor}You have {lower:hairColor} hair.{/if}']),
    );
    expect(describeAppearance(profile())).toBe('You have black hair.');
    expect(describeAppearance(profile(omit(fullAppearance, 'hairColor')))).toBe(
      '',
    );
  });

  it('supports string equality on feature values', () => {
    configureAppearance(
      data(['{if gender == Female}She studies.{else}They study.{/if}']),
    );
    expect(describeAppearance(profile())).toBe('She studies.');
    expect(
      describeAppearance(profile({ ...fullAppearance, gender: 'Male' })),
    ).toBe('They study.');
  });

  it('evaluates nested conditionals', () => {
    configureAppearance(
      data([
        '{if height >= 180}{if weight >= 90}big and tall{else}tall{/if}{else}short{/if}',
      ]),
    );
    expect(
      describeAppearance(profile(), {
        body: body({ height: 190, weight: 100 }),
      }),
    ).toBe('big and tall');
    expect(
      describeAppearance(profile(), {
        body: body({ height: 190, weight: 70 }),
      }),
    ).toBe('tall');
    expect(describeAppearance(profile(), { body: body({ height: 150 }) })).toBe(
      'short',
    );
  });
});

describe('describeAppearance with the linguistics engine', () => {
  it('expands macros, player word overrides and global vars', () => {
    configureLinguistics({
      macros: [
        {
          name: 'stature',
          template: '{if height >= 180}{word:tall}{else}{word:short}{/if}',
        },
      ],
      terms: [
        { key: 'tall', label: 'Tall', options: ['tall', 'giant'] },
        { key: 'short', label: 'Short', options: ['short'] },
      ],
    });
    configureAppearance(data(['You look {@stature} this {timeOfDay}.']));
    expect(
      describeAppearance(profile(), {
        body: body({ height: 190 }),
        vars: { timeOfDay: 'morning' },
        wordChoices: { tall: 'giant, giant' },
        seed: 'x',
      }),
    ).toBe('You look giant this morning.');
  });
});

describe('sampleBody', () => {
  it('samples every configured attribute within its bounds', () => {
    const out = sampleBody(new Mulberry32(1), { gender: 'Female' });
    const attrs = getBodyAttributes();
    for (const a of attrs) {
      const v = out[a.id];
      expect(typeof v).toBe('number');
      if (a.showWhen && !isBodyAttributeVisible(a, { gender: 'Female' })) {
        expect(v).toBe(0);
      } else {
        expect(v).toBeGreaterThanOrEqual(a.distribution.default.min);
        expect(v).toBeLessThanOrEqual(a.distribution.default.max);
      }
    }
  });

  it('returns 0 for attributes whose showWhen does not match', () => {
    const out = sampleBody(new Mulberry32(7), { gender: 'Male' });
    // bustDifference is gated by gender=Female in the fixture.
    expect(out.bustDifference).toBe(0);
  });

  it('is deterministic for the same seed', () => {
    const a = sampleBody(new Mulberry32(99), { gender: 'Female' });
    const b = sampleBody(new Mulberry32(99), { gender: 'Female' });
    expect(a).toEqual(b);
  });
});

describe('resolvePronouns', () => {
  it('returns the configured pronouns for a known value', () => {
    expect(resolvePronouns({ gender: 'Female' }).noun).toBe('woman');
    expect(resolvePronouns({ gender: 'Male' }).subject).toBe('he');
  });

  it('falls back to neutral pronouns for an unknown or missing value', () => {
    expect(resolvePronouns({}).noun).toBe('person');
    expect(resolvePronouns({ gender: 'Other' }).subject).toBe('they');
  });
});
