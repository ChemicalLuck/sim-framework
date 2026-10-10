import { describe, expect, it, vi } from 'vitest';

import { lintTemplate } from '@chemicalluck/sim-engine/features/linguistics/lib/lint';

import { editorTemplateContext } from './template-context';

vi.mock('virtual:game-extensions', () => ({
  templateVarDeclarations: {
    university: { keys: ['term', 'week'] },
    club: {},
  },
}));

const messages = (t: string) =>
  lintTemplate(t, editorTemplateContext()).map((i) => i.message);

describe('editorTemplateContext', () => {
  it('accepts template variables declared by extensions', () => {
    expect(
      messages(
        "Week {university.week}. {if university.term == 'autumn'}x{/if}",
      ),
    ).toEqual([]);
  });

  it('accepts any variable of an extension that declares no keys', () => {
    expect(messages('{club.meetingDay}')).toEqual([]);
  });

  it('still flags unknown variables', () => {
    expect(messages('{university.nope} {sports.score}')).toEqual([
      'Unknown variable "university.nope"',
      'Unknown variable "sports.score"',
    ]);
  });
});
