import { afterEach, describe, expect, it } from 'vitest';

import { configurePlayerDefaults } from './player-defaults';
import {
  DEFAULT_SKILL_MAX,
  configureSkillMax,
  getNpcSkillRange,
  getSkillMax,
} from './skills';

afterEach(() => {
  configureSkillMax(DEFAULT_SKILL_MAX);
});

describe('skill scale', () => {
  it('defaults to 10', () => {
    configurePlayerDefaults({});
    expect(getSkillMax()).toBe(10);
  });

  it('is read from player.json skillMax', () => {
    configurePlayerDefaults({ skillMax: 20 });
    expect(getSkillMax()).toBe(20);
  });

  it('defaults the NPC range to the lower half of the scale', () => {
    expect(getNpcSkillRange({ id: 's', name: 'S' })).toEqual([0, 5]);
    configureSkillMax(20);
    expect(getNpcSkillRange({ id: 's', name: 'S' })).toEqual([0, 10]);
  });

  it('clamps an explicit NPC range to the scale', () => {
    expect(
      getNpcSkillRange({ id: 's', name: 'S', npcRange: [-2, 50] }),
    ).toEqual([0, 10]);
    expect(getNpcSkillRange({ id: 's', name: 'S', npcRange: [2, 7] })).toEqual([
      2, 7,
    ]);
  });
});
