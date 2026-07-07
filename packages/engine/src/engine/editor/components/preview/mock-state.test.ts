import { describe, expect, it } from 'vitest';

import { DEFAULT_PREVIEW_STATE, buildMockRootState } from './mock-state';

describe('buildMockRootState', () => {
  it('covers every slice the condition DSL reads', () => {
    const present = buildMockRootState(DEFAULT_PREVIEW_STATE)
      .present as unknown as Record<string, unknown>;
    for (const key of [
      'money',
      'time',
      'player',
      'needs',
      'milestones',
      'weather',
      'encounter',
      'clothing',
      'containers',
    ]) {
      expect(present[key]).toBeDefined();
    }
  });

  it('maps date + hour to a timestamp and applies overrides', () => {
    const state = buildMockRootState({
      ...DEFAULT_PREVIEW_STATE,
      date: '2025-10-01',
      hour: 9,
      money: 42,
      location: 'cafe',
      weather: 'rainy',
      needs: { energy: 0.5 },
      skills: { athletics: 5 },
      milestones: ['got_job'],
    }).present as {
      money: number;
      time: { timestamp: number };
      player: { locationId: string; skills: Record<string, number> };
      needs: Record<string, number>;
      milestones: { achieved: string[] };
      weather: { conditionOverride: string | null };
    };

    expect(state.money).toBe(42);
    expect(new Date(state.time.timestamp).getHours()).toBe(9);
    expect(state.player.locationId).toBe('cafe');
    expect(state.player.skills.athletics).toBe(5);
    expect(state.needs.energy).toBe(0.5);
    expect(state.milestones.achieved).toEqual(['got_job']);
    expect(state.weather.conditionOverride).toBe('rainy');
  });

  it('leaves weather computed when unset', () => {
    const state = buildMockRootState(DEFAULT_PREVIEW_STATE).present as {
      weather: { conditionOverride: string | null };
    };
    expect(state.weather.conditionOverride).toBeNull();
  });
});
