import { afterEach, describe, expect, it, vi } from 'vitest';

import type { RootState } from '@chemicalluck/sim-engine/state/store';

import { handleSkillEffect } from './effects';
import { DEFAULT_SKILL_MAX, configureSkillMax } from './lib/skills';
import { updateSkill } from './slice';

afterEach(() => {
  configureSkillMax(DEFAULT_SKILL_MAX);
});

function run(current: number, delta: number) {
  const dispatch = vi.fn();
  const prevState = {
    present: { player: { skills: { charm: current } } },
  } as unknown as RootState;
  handleSkillEffect(
    { kind: 'skill', skill: 'charm', delta },
    {
      dispatch,
      group: 'g',
      prevState,
      effects: [],
    },
  );
  const action = dispatch.mock.calls[0][0] as ReturnType<typeof updateSkill>;
  return action.payload.value;
}

describe('handleSkillEffect', () => {
  it('clamps to the default skill max of 10', () => {
    expect(run(8, 5)).toBe(10);
    expect(run(2, -5)).toBe(0);
  });

  it('clamps to the configured skill max', () => {
    configureSkillMax(20);
    expect(run(8, 5)).toBe(13);
    expect(run(18, 5)).toBe(20);
  });
});
