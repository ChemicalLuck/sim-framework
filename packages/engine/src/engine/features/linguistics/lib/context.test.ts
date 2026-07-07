import { describe, expect, it } from 'vitest';
import type { CharacterProfile } from '@sim/engine/types';

import { buildEntityVars, buildTemplateContext } from './context';

const profile = (over: Partial<CharacterProfile> = {}): CharacterProfile => ({
  firstName: 'Alex',
  lastName: 'Stone',
  profession: 'Barista',
  age: 28,
  appearance: { gender: 'Female', hairColor: 'Black' },
  ...over,
});

const pronouns = {
  subject: 'she',
  object: 'her',
  possessive: 'her',
  reflexive: 'herself',
  noun: 'woman',
};

describe('buildEntityVars', () => {
  it('flattens a character under a prefix', () => {
    const vars = buildEntityVars('npc0', {
      profile: profile(),
      body: { height: 165, weight: 60, bodyFat: 22, bustDifference: 3 },
      pronouns,
      known: true,
    });
    expect(vars['npc0.firstName']).toBe('Alex');
    expect(vars['npc0.fullName']).toBe('Alex Stone');
    expect(vars['npc0.name']).toBe('Alex');
    expect(vars['npc0.profession']).toBe('Barista');
    expect(vars['npc0.age']).toBe(28);
    expect(vars['npc0.gender']).toBe('Female');
    expect(vars['npc0.hairColor']).toBe('Black');
    expect(vars['npc0.height']).toBe(165);
    expect(vars['npc0.subject']).toBe('she');
  });

  it('renders unknown characters’ name as "They"', () => {
    const vars = buildEntityVars('npc0', {
      profile: profile(),
      pronouns,
      known: false,
    });
    expect(vars['npc0.name']).toBe('They');
    expect(vars['npc0.firstName']).toBe('Alex');
  });

  it('uses bare keys for an empty prefix', () => {
    const vars = buildEntityVars('', { profile: profile(), pronouns });
    expect(vars.firstName).toBe('Alex');
    expect(vars.noun).toBe('woman');
  });
});

describe('buildTemplateContext', () => {
  it('exposes the player bare and as player.*, and NPCs as npcN.*', () => {
    const ctx = buildTemplateContext({
      player: {
        profile: profile({ firstName: 'You', lastName: 'Player' }),
        pronouns,
      },
      npcs: [{ profile: profile(), pronouns, known: true }, undefined],
      narrativeVars: { timeOfDay: 'morning', totalNearbyNpcs: 3 },
      seed: 'game-seed',
    });
    expect(ctx.vars.firstName).toBe('You');
    expect(ctx.vars['player.firstName']).toBe('You');
    expect(ctx.vars['p.firstName']).toBe('You');
    expect(ctx.vars['p.hairColor']).toBe('Black');
    expect(ctx.vars['npc0.firstName']).toBe('Alex');
    expect(ctx.vars['npc1.firstName']).toBeUndefined();
    expect(ctx.vars.timeOfDay).toBe('morning');
    expect(ctx.vars.totalNearbyNpcs).toBe(3);
    expect(ctx.seed).toBe('game-seed');
  });
});
